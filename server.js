const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// Schemas
const userSchema = new mongoose.Schema({
    userId: String,
    username: String,
    email: String,
    password: String,
    followers: [String],
    following: [String],
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const commentSchema = new mongoose.Schema({
    postId: mongoose.Schema.Types.ObjectId,
    userId: String,
    username: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
});
const Comment = mongoose.model('Comment', commentSchema);

const postSchema = new mongoose.Schema({
    userId: String,
    username: String,
    text: String,
    likes: [String], // Array of userIds who liked
    comments: [mongoose.Schema.Types.ObjectId], // Array of comment IDs
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("📝 Registration attempt:", { username, email });

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Create new user
        const userId = 'user_' + Date.now();
        const user = new User({
            userId,
            username,
            email,
            password,
            followers: [],
            following: []
        });

        await user.save();
        console.log("✅ User registered:", username);

        res.status(201).json({
            success: true,
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error("❌ Registration error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("🔑 Login attempt:", username);

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        console.log("✅ Login successful:", username);
        res.json({
            success: true,
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email,
                followers: user.followers,
                following: user.following
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ error: err.message });
    }
});

// API Routes

// Get all posts with comments populated
app.get('/api/posts', async (req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('comments');
    res.json(posts);
});

// Get single post with comments
app.get('/api/posts/:id', async (req, res) => {
    const post = await Post.findById(req.params.id).populate('comments');
    res.json(post);
});

// Create new post
app.post('/api/posts', async (req, res) => {
    const post = new Post({
        ...req.body,
        likes: [],
        comments: []
    });
    await post.save();
    res.status(201).json(post);
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { userId } = req.body;
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if user is the owner of the post
        if (post.userId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }

        // Delete all comments associated with the post
        await Comment.deleteMany({ postId: req.params.id });

        // Delete the post
        await Post.findByIdAndDelete(req.params.id);

        console.log('✅ Post deleted:', req.params.id);
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        console.error('❌ Delete post error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Like/Unlike a post
app.post('/api/posts/:id/like', async (req, res) => {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1); // Unlike
    } else {
        post.likes.push(userId); // Like
    }
    
    await post.save();
    res.json(post);
});

// Add comment to post
app.post('/api/posts/:id/comments', async (req, res) => {
    const { userId, username, text } = req.body;
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const comment = new Comment({
        postId: req.params.id,
        userId,
        username,
        text
    });
    
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    
    res.status(201).json(comment);
});

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
    const comments = await Comment.find({ postId: req.params.id }).sort({ createdAt: -1 });
    res.json(comments);
});

// Delete comment
app.delete('/api/comments/:id', async (req, res) => {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (comment) {
        await Post.findByIdAndUpdate(comment.postId, { $pull: { comments: req.params.id } });
    }
    res.json({ success: true });
});

// Follow user
app.post('/api/users/:userId/follow', async (req, res) => {
    const { currentUserId } = req.body;
    const targetUserId = req.params.userId;
    
    if (currentUserId === targetUserId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    let targetUser = await User.findOne({ userId: targetUserId });
    if (!targetUser) {
        targetUser = new User({ userId: targetUserId, username: targetUserId });
    }
    
    let currentUser = await User.findOne({ userId: currentUserId });
    if (!currentUser) {
        currentUser = new User({ userId: currentUserId, username: currentUserId });
    }
    
    const followIndex = currentUser.following.indexOf(targetUserId);
    if (followIndex > -1) {
        currentUser.following.splice(followIndex, 1); // Unfollow
        targetUser.followers.splice(targetUser.followers.indexOf(currentUserId), 1);
    } else {
        currentUser.following.push(targetUserId); // Follow
        targetUser.followers.push(currentUserId);
    }
    
    await currentUser.save();
    await targetUser.save();
    
    res.json({ following: currentUser.following });
});

// Get user profile
app.get('/api/users/:userId', async (req, res) => {
    let user = await User.findOne({ userId: req.params.userId });
    if (!user) {
        user = new User({ userId: req.params.userId, username: req.params.userId });
        await user.save();
    }
    res.json(user);
});

// Serve static files from /public (AFTER all API routes)
app.use(express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
});

// Handle EADDRINUSE error - if port is already in use, try next port
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        const newPort = PORT + 1;
        server.listen(newPort, () => {
            console.log(`🚀 Server on http://localhost:${newPort}`);
        });
    } else {
        throw err;
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📛 SIGTERM received, closing server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});