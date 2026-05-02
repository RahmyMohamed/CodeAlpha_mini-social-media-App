const API_URL = 'http://localhost:5000/api';
let currentUser = null;

// Initialize app
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showFeed();
        loadPosts();
    } else {
        showLoginPage();
    }
};

// Show Login Page
function showLoginPage() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('feed-container').style.display = 'none';
}

// Show Feed
function showFeed() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('feed-container').style.display = 'block';
    document.getElementById('feed-view').style.display = 'block';
    document.getElementById('profile-view').style.display = 'none';
    loadPosts();
}

// Show Profile
async function showProfile(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        const user = await response.json();

        document.getElementById('feed-view').style.display = 'none';
        document.getElementById('profile-view').style.display = 'block';

        // Populate profile info
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-email').textContent = user.email || 'No email';
        document.getElementById('profile-followers-count').textContent = user.followers.length;
        document.getElementById('profile-following-count').textContent = user.following.length;

        // Load user's posts
        await loadUserPosts(userId);

        // Show follow/unfollow button if viewing another user's profile
        const actionsDiv = document.getElementById('profile-actions');
        if (userId === currentUser.userId) {
            actionsDiv.innerHTML = '<p style="text-align:center; color:var(--muted)">This is your profile</p>';
        } else {
            const isFollowing = currentUser.following.includes(userId);
            actionsDiv.innerHTML = `<button class="btn-primary" onclick="toggleFollowFromProfile('${userId}')">${isFollowing ? 'Unfollow' : 'Follow'}</button>`;
        }
    } catch (err) {
        console.error("Error loading profile:", err);
        alert("Failed to load profile");
    }
}

// Load user's posts
async function loadUserPosts(userId) {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const allPosts = await response.json();
        const userPosts = allPosts.filter(post => post.userId === userId);

        document.getElementById('profile-posts-count').textContent = userPosts.length;

        const profileFeed = document.getElementById('profile-feed');

        if (userPosts.length === 0) {
            profileFeed.innerHTML = '<p style="text-align:center; color:var(--muted)">No posts yet</p>';
            return;
        }

        profileFeed.innerHTML = userPosts.map(post => `
            <div class="post-card" data-post-id="${post._id}">
                <div class="post-header">
                    <span class="post-user">@${post.username}</span>
                    <div class="post-header-actions">
                        ${post.userId === currentUser.userId ? `<button class="btn-delete-post" onclick="deletePost('${post._id}')">🗑️ Delete</button>` : ''}
                    </div>
                </div>
                <p class="post-content">${post.text}</p>
                <div style="margin-top:10px; font-size:12px; color:var(--muted)">
                    ${new Date(post.createdAt).toLocaleDateString()}
                </div>
                
                <div class="post-actions">
                    <button class="btn-action" onclick="toggleLike('${post._id}')">
                        <span class="like-icon">❤️</span> Like (${post.likes.length})
                    </button>
                    <button class="btn-action" onclick="toggleCommentSection('${post._id}')">
                        💬 Comment (${post.comments.length})
                    </button>
                </div>
                
                <div class="comments-section" id="comments-${post._id}" style="display:none;">
                    <div class="comment-input">
                        <input type="text" placeholder="Add a comment..." class="comment-text" data-post-id="${post._id}">
                        <button class="btn-small" onclick="addComment('${post._id}')">Post</button>
                    </div>
                    <div class="comments-list" id="comments-list-${post._id}"></div>
                </div>
            </div>
        `).join('');

        // Load comments for each post
        userPosts.forEach(post => {
            loadComments(post._id);
        });
    } catch (err) {
        console.error("Error loading user posts:", err);
    }
}

// Toggle between Login and Register
function toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleBtn = document.getElementById('toggle-auth-btn');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        toggleBtn.textContent = "Don't have an account? Register";
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleBtn.textContent = 'Already have an account? Login';
    }
}

// Register
async function register() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    if (!username || !email || !password) {
        return alert('All fields required');
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Registration successful! Please login.');
            document.getElementById('reg-username').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-password').value = '';
            toggleAuthMode();
        } else {
            alert('Error: ' + (data.error || 'Registration failed'));
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('Error: Failed to connect to server. Make sure backend is running.');
    }
}

// Login
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        return alert('Username and password required');
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            showFeed();
            loadPosts();
        } else {
            alert('Error: ' + (data.error || 'Login failed'));
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('Error: Failed to connect to server. Make sure backend is running.');
    }
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLoginPage();
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
    }
}

// Load posts from Backend
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        const feed = document.getElementById('feed');
        
        if (posts.length === 0) {
            feed.innerHTML = '<p style="text-align:center; color:var(--muted)">No posts yet.</p>';
            return;
        }

        feed.innerHTML = posts.map(post => {
            const isFollowing = currentUser.following.includes(post.userId);
            const isOwnPost = post.userId === currentUser.userId;

            return `
                <div class="post-card" data-post-id="${post._id}">
                    <div class="post-header">
                        <span class="post-user" style="cursor:pointer;" onclick="showProfile('${post.userId}')">@${post.username}</span>
                        <div class="post-header-actions">
                            ${isOwnPost ? `<button class="btn-delete-post" onclick="deletePost('${post._id}')">🗑️ Delete</button>` : `<button class="btn-follow" onclick="toggleFollow('${post.userId}')">${isFollowing ? 'Unfollow' : 'Follow'}</button>`}
                        </div>
                    </div>
                    <p class="post-content">${post.text}</p>
                    <div style="margin-top:10px; font-size:12px; color:var(--muted)">
                        ${new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div class="post-actions">
                        <button class="btn-action" onclick="toggleLike('${post._id}')">
                            <span class="like-icon">❤️</span> Like (${post.likes.length})
                        </button>
                        <button class="btn-action" onclick="toggleCommentSection('${post._id}')">
                            💬 Comment (${post.comments.length})
                        </button>
                    </div>
                    
                    <div class="comments-section" id="comments-${post._id}" style="display:none;">
                        <div class="comment-input">
                            <input type="text" placeholder="Add a comment..." class="comment-text" data-post-id="${post._id}">
                            <button class="btn-small" onclick="addComment('${post._id}')">Post</button>
                        </div>
                        <div class="comments-list" id="comments-list-${post._id}"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Load comments for each post
        posts.forEach(post => {
            loadComments(post._id);
        });
    } catch (err) {
        console.error("Error loading posts:", err);
    }
}

// Load comments for a post
async function loadComments(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`);
        const comments = await response.json();
        const commentsList = document.getElementById(`comments-list-${postId}`);
        
        if (commentsList) {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment">
                    <span class="comment-user">@${comment.username}</span>
                    <p class="comment-text">${comment.text}</p>
                    <small>${new Date(comment.createdAt).toLocaleDateString()}</small>
                    ${comment.userId === currentUser.userId ? `<button class="btn-delete" onclick="deleteComment('${comment._id}')">Delete</button>` : ''}
                </div>
            `).join('');
        }
    } catch (err) {
        console.error("Error loading comments:", err);
    }
}

// Toggle comments section
function toggleCommentSection(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

// Create a new post
async function createPost() {
    const textInput = document.getElementById('post-text');
    const text = textInput.value.trim();

    if (!text) return alert("Please write something!");

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.userId,
                username: currentUser.username,
                text: text
            })
        });

        if (response.ok) {
            textInput.value = '';
            loadPosts(); // Refresh the feed
        }
    } catch (err) {
        alert("Failed to connect to server.");
    }
}

// Delete a post
async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.userId })
        });

        const data = await response.json();

        if (response.ok) {
            loadPosts(); // Refresh the feed
        } else {
            alert('Error: ' + (data.error || 'Failed to delete post'));
        }
    } catch (err) {
        console.error("Error deleting post:", err);
        alert("Failed to delete post");
    }
}

// Toggle like on a post
async function toggleLike(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.userId })
        });

        if (response.ok) {
            loadPosts(); // Refresh to show updated likes
        }
    } catch (err) {
        console.error("Error toggling like:", err);
    }
}

// Add comment to post
async function addComment(postId) {
    const commentInput = document.querySelector(`input[data-post-id="${postId}"]`);
    const text = commentInput.value.trim();

    if (!text) return alert("Please write a comment!");

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.userId,
                username: currentUser.username,
                text: text
            })
        });

        if (response.ok) {
            commentInput.value = '';
            loadComments(postId); // Refresh comments
        }
    } catch (err) {
        console.error("Error adding comment:", err);
    }
}

// Delete comment
async function deleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;
    
    try {
        await fetch(`${API_URL}/comments/${commentId}`, { method: 'DELETE' });
        loadPosts(); // Refresh
    } catch (err) {
        console.error("Error deleting comment:", err);
    }
}

// Toggle follow
async function toggleFollow(userId) {
    if (userId === currentUser.userId) {
        return alert("You cannot follow yourself");
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUserId: currentUser.userId })
        });

        const data = await response.json();

        if (response.ok) {
            // Update current user's following list
            currentUser.following = data.following;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadPosts(); // Refresh to update follow button state
        }
    } catch (err) {
        console.error("Error toggling follow:", err);
    }
}

// Toggle follow from profile
async function toggleFollowFromProfile(userId) {
    if (userId === currentUser.userId) {
        return alert("You cannot follow yourself");
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUserId: currentUser.userId })
        });

        const data = await response.json();

        if (response.ok) {
            // Update current user's following list
            currentUser.following = data.following;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            // Reload profile with updated follow status
            showProfile(userId);
        }
    } catch (err) {
        console.error("Error toggling follow:", err);
    }
}