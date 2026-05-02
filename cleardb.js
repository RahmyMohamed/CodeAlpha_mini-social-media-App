const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.log("❌ DB Connection Error:", err);
        process.exit(1);
    });

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
    likes: [String],
    comments: [mongoose.Schema.Types.ObjectId],
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', postSchema);

// Clear database function
async function clearDatabase() {
    try {
        console.log("🗑️ Clearing database...");
        
        // Delete all users
        const userResult = await User.deleteMany({});
        console.log(`✅ Deleted ${userResult.deletedCount} users`);
        
        // Delete all posts
        const postResult = await Post.deleteMany({});
        console.log(`✅ Deleted ${postResult.deletedCount} posts`);
        
        // Delete all comments
        const commentResult = await Comment.deleteMany({});
        console.log(`✅ Deleted ${commentResult.deletedCount} comments`);
        
        console.log("\n✅ Database cleared successfully!");
        
        // Close connection
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error clearing database:", err);
        process.exit(1);
    }
}

// Run the clear function
clearDatabase();
