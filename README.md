# Pulse — Mini Social Media App

**Pulse** is a lightweight, full-stack social media application built to demonstrate core social networking features. It features a sleek, dark-themed UI and allows users to share thoughts, follow others, and interact through likes and comments.

![preview img](Photo.png)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/)

Live link : https://rahmymohamed.github.io/CodeAlpha_E-Commerce-Store/

## 🚀 Features

* **User Authentication**: Secure registration and login system[cite: 1, 8].
* **Session Persistence**: Uses `localStorage` to keep users logged in across refreshes[cite: 1].
* **Global Feed**: A real-time view of all posts created by the community[cite: 1, 8].
* **Post Interactions**: Users can like posts and add comments to engage in discussions[cite: 1, 8].
* **Profile Management**: View specific user profiles with post counts, followers, and following data[cite: 1, 2, 8].
* **Follow System**: Ability to follow or unfollow other users directly from the feed or profile[cite: 1, 8].
* **Modern Design**: Built with a responsive "Dark Mode" aesthetic using the Syne and Inter Google Fonts[cite: 2, 3].

## 🛠️ Tech Stack

### Frontend
* **HTML5 & CSS3**: Custom styling using CSS variables for a consistent theme[cite: 2, 3].
* **Vanilla JavaScript**: Direct DOM manipulation and asynchronous API communication using `fetch`[cite: 1].

### Backend
* **Node.js & Express**: Handles API routing and server-side logic[cite: 6, 8].
* **MongoDB & Mongoose**: Used for data modeling and persistent storage of users, posts, and comments[cite: 5, 8].
* **Dotenv**: Manages sensitive environment variables like database URIs[cite: 4, 6].

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/pulse-social-app.git](https://github.com/your-username/pulse-social-app.git)
cd pulse-social-app
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Configure 
Environment VariablesCreate a file named .env in the root directory and add your configuration:  
```Code snippet
PORT=5000
MONGO_URI=mongodb://localhost:27017/pulseDB
```
### 4. Start the Backend Server
```Bash
npm start
The server will start running at http://localhost:5000.  
```
### 5. Open the Frontend
Simply open index.html in your preferred web browser.  
🧹 MaintenanceYou can quickly reset the database (delete all data) for testing purposes using the included script:  
```Bash
npm run clear
```
### Developed by Mohamed Rahmy.  
