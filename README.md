# Confera - Real-time Video Conferencing Platform

<div align="center">

![Confera](https://img.shields.io/badge/Confera-Video%20Conferencing-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)

**A modern, scalable, and secure video conferencing platform for real-time communication**

[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Setup](#setup--installation) • [API Documentation](#api-endpoints) • [Security](#security--best-practices)

</div>

---

## Overview

**Confera** is a production-ready video conferencing application that enables seamless peer-to-peer and group video meetings with real-time communication. Whether you need to host team meetings, online classes, or webinars, Confera provides a robust and secure platform with advanced features like screen sharing, chat, meeting history, and guest access.

### Problem It Solves

Many organizations struggle with finding a reliable, self-hosted video conferencing solution that doesn't depend on expensive third-party services. Confera provides:

- **Cost-effective alternative** to traditional video conferencing platforms
- **Full control** over your communication infrastructure
- **Guest access** without requiring user registration
- **Meeting history tracking** for audit and compliance needs
- **Secure authentication** with OAuth and encrypted tokens

### Real-World Use Cases

- 🏢 **Corporate Team Meetings** - Host secure internal video meetings with employees
- 🎓 **Online Education** - Conduct virtual classes and tutoring sessions
- 🤝 **Client Consultations** - Provide video consultation services to clients via guest links
- 📊 **Webinars & Presentations** - Stream presentations with interactive Q&A
- 💼 **Remote Collaboration** - Enable seamless distributed team collaboration

---

## Tech Stack

### Frontend
- **React 19.2** - Modern UI library with hooks and functional components
- **Vite 7.2** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1** - Utility-first CSS framework for responsive design
- **Socket.IO Client 4.8** - Real-time bidirectional communication
- **React Router 7.11** - Client-side routing and navigation
- **Axios 1.13** - HTTP client for API requests
- **Lucide React** - Beautiful, consistent SVG icons
- **Styled Components 6.1** - CSS-in-JS for component styling

### Backend
- **Node.js with ES6 Modules** - Modern JavaScript runtime
- **Express 5.2** - Lightweight web framework
- **Socket.IO 4.8** - WebSocket library for real-time features
- **MongoDB with Mongoose 9.0** - NoSQL database with schema validation
- **Passport.js 0.7** - Authentication middleware
- **Google OAuth 2.0** - Social authentication integration
- **Bcrypt 6.0** - Password hashing and security
- **JWT & Crypto Tokens** - Token-based authentication
- **Helmet 8.1** - HTTP security headers
- **Express Rate Limit 8.2** - DDoS protection and rate limiting
- **CORS 2.8** - Cross-origin resource sharing
- **Nodemon 3.1** - Development auto-reload

### Database
- **MongoDB** - Document-based NoSQL database
- **Collections**: Users (with meeting history) and Meetings

### Tools & Infrastructure
- **npm** - Package management
- **Render** - Cloud deployment platform (backend)
- **Git** - Version control

---

## Features

### 🎥 Core Video Features
- **High-quality peer-to-peer video** with WebRTC integration
- **Screen sharing capability** for presentations and demos
- **Audio controls** - Toggle microphone with one click
- **Video management** - Enable/disable camera independently
- **Multiple device support** - Audio input/output device selection

### 🔐 Security & Authentication
- **Secure user registration** with bcrypt password hashing
- **Google OAuth 2.0 integration** for single sign-on
- **Hex token-based authentication** stored in MongoDB
- **Guest access** without requiring user accounts
- **Rate limiting** on all endpoints (15 auth attempts per 15 minutes)
- **XSS protection** and helmet security headers
- **MongoDB data sanitization** to prevent injection attacks

### 💬 Communication Features
- **Real-time text chat** within video meetings
- **Meeting code generation** for easy sharing
- **User presence indicators** showing who's in the meeting
- **Host controls** for managing participants

### 📊 Meeting Management
- **Meeting history tracking** with timestamps
- **Persistent meeting records** for compliance and audit
- **Meeting activity dashboard** viewing user's past meetings
- **Quick meeting join** via meeting codes or URLs

### 🎨 User Experience
- **Responsive design** works on desktop, tablet, and mobile
- **Dark/Light mode support** with Tailwind CSS
- **Real-time notifications** for user actions
- **Clean, intuitive interface** with Lucide icons
- **Meeting participant list** with user information
- **One-click meeting code copy** to clipboard

### 🚀 Performance & Scalability
- **Client-side rendering** with React for fast interactions
- **WebSocket communication** for real-time updates
- **STUN servers** (Google's public STUN) for NAT traversal
- **Optimized bundle size** with Vite
- **Lazy loading** of components and routes

---

## Folder Structure

```
Confera/
│
├── frontend/                          # React application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── Navbar.jsx            # Navigation bar
│   │   │   └── Footer.jsx            # Footer component
│   │   ├── pages/                    # Page components (routes)
│   │   │   ├── LandingPage.jsx       # Public landing page
│   │   │   ├── Authentication.jsx    # Login/Register page
│   │   │   ├── GuestJoin.jsx         # Guest meeting access
│   │   │   ├── Home.jsx              # Authenticated home dashboard
│   │   │   ├── VideoMeet.jsx         # Video meeting room (2000+ lines)
│   │   │   └── History.jsx           # User meeting history
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       # Authentication state management
│   │   ├── hooks/
│   │   │   └── useSpeechRecognition.js # Speech-to-text hook
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx   # Dashboard layout wrapper
│   │   ├── utils/
│   │   │   └── withAuth.jsx          # HOC for protected routes
│   │   ├── assets/                   # Images, icons, media
│   │   ├── App.jsx                   # Main app component with routing
│   │   ├── App.css                   # Global styles
│   │   ├── main.jsx                  # React DOM entry point
│   │   ├── index.css                 # Base styles
│   │   └── environment.js            # Environment configuration
│   ├── package.json                  # Frontend dependencies
│   ├── vite.config.js                # Vite build configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   ├── eslint.config.js              # ESLint rules
│   └── index.html                    # HTML entry point
│
└── backend/                           # Node.js/Express server
    ├── src/
    │   ├── config/
    │   │   └── passportConfig.js     # Google OAuth strategy setup
    │   ├── controllers/
    │   │   ├── authentication.js     # Login/register/history logic
    │   │   └── SocketManager.js      # WebSocket event handlers
    │   ├── middlewares/
    │   │   └── limiters.js           # Rate limiting middleware
    │   ├── models/
    │   │   ├── user.js               # User schema (name, username, password, token, history)
    │   │   └── meeting.js            # Meeting schema (meetingCode, date)
    │   ├── routes/
    │   │   ├── authRoutes.js         # Auth endpoints (login, register, OAuth)
    │   │   └── users.js              # User endpoints (activity/history)
    │   └── app.js                    # Express app setup & Socket.IO config
    ├── package.json                  # Backend dependencies
    └── .env.example                  # Environment variables template
```

### Key Directories Explained

- **frontend/src/pages/VideoMeet.jsx** - The most complex component (~2000 lines), handles all video conferencing logic including WebRTC, local/remote streams, screen sharing, chat, and participant management
- **backend/src/app.js** - Central server file initializing Express, Socket.IO, middleware, routes, and database connections
- **backend/controllers/SocketManager.js** - Manages real-time event handling for join, signal, chat, disconnect
- **frontend/src/contexts/AuthContext.jsx** - Centralized auth state for token management and user data persistence

---

## Setup & Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (local or cloud instance) - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for free tier
- **Git** - [Download](https://git-scm.com/)

### Environment Variables

#### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/confera?retryWrites=true&w=majority

# Frontend URL (for CORS and OAuth callback)
CLIENT_URL=http://localhost:5173

# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:8000/auth/google/callback
```

#### Frontend Configuration

The frontend uses `src/environment.js`:

```javascript
let IS_PROD = false; // Set to true for production
const server = IS_PROD ? "https://your-production-api.com" : "http://localhost:8000";
export default server;
```

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/confera.git
cd confera
```

#### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

#### 4. Set Up MongoDB

**MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Replace `MONGO_URI` in `.env` with your connection string

```

#### 5. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
6. Copy Client ID and Client Secret to `.env`

#### 6. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Production Build

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Creates optimized build in dist/
npm run preview
```

---

## API Endpoints

### Authentication Routes

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "username": "john@example.com",
  "password": "securePassword123"
}

Response: 201 Created
{
  "message": "User Registered Successfully."
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "username": "john@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

#### Google OAuth Login
```http
GET /auth/google
# Initiates Google OAuth flow

GET /auth/google/callback
# Redirect from Google with authorization code
# Sets token and redirects to /home?token=<TOKEN>
```

### User Routes

#### Get User Activity/History
```http
GET /api/v1/users/activity
Authorization: Bearer <TOKEN>

Response: 200 OK
[
  {
    "meetingCode": "XYZ123",
    "date": "2025-12-28T10:30:00Z"
  },
  {
    "meetingCode": "ABC456",
    "date": "2025-12-27T14:15:00Z"
  }
]
```

#### Health Check
```http
GET /health

Response: 200 OK
OK
```

### WebSocket Events (Socket.IO)

#### User Authentication
```javascript
// Client connects with token
socket = io(server_url, {
  auth: { token: "hex_token_from_backend" }
});
```

#### Join Call
```javascript
socket.emit('join-call', meetingCode);
// Server broadcasts 'user-joined' event with socket list
```

#### Signal (WebRTC Offer/Answer)
```javascript
socket.emit('signal', targetSocketId, signalingMessage);
socket.on('signal', (senderSocketId, signalingMessage) => {
  // Handle WebRTC signaling
});
```

#### Chat Message
```javascript
socket.emit('chat-message', messageText, senderName);
socket.on('chat-message', (messageText, senderName, senderId) => {
  // Display message
});
```

#### User Disconnect
```javascript
socket.on('user-left', (socketId) => {
  // Remove user from participant list
});
```

---

## Usage Instructions

### For Authenticated Users

#### 1. Register/Login
- Visit `http://localhost:5173/auth`
- Create new account or login with credentials
- Or use "Sign in with Google" for quick authentication

#### 2. Dashboard
- After login, you're on the home dashboard
- Click **"New Meeting"** to create a new meeting
- Share meeting code with participants
- View your meeting history by clicking **"History"**

#### 3. Join/Start Meeting
```
Meeting URL: http://localhost:5173/meeting/YOUR_MEETING_CODE
- Click to join or send link to others
```

#### 4. During Video Call
- **Share Screen**: Click screen sharing icon (browser permission required)
- **Chat**: Open chat panel on the right
- **Participant List**: View all connected participants
- **End Meeting**: Click "Leave Meeting" button

### For Guest Users

#### 1. Access Guest Join
- Navigate to `http://localhost:5173/guest`
- Enter your name
- Enter meeting code provided by host

#### 2. Join Meeting
- No account required
- No password needed
- Click "Join Meeting"

---

## Security & Best Practices

### 🔐 Authentication Security

1. **Password Hashing**
   - All passwords hashed with bcrypt (10 salt rounds)
   - Never stored in plain text
   - Verified during login with timing-safe comparison

2. **Token Management**
   - Cryptographically secure tokens (20 random bytes → 40-char hex)
   - Stored in MongoDB with user record
   - Validated on every socket connection
   - Cleared on logout

3. **OAuth 2.0 Integration**
   - Secure Google OAuth flow with PKCE
   - Email-based user lookup to prevent duplication
   - Automatic token generation on successful auth

### 🛡️ API Security

1. **Rate Limiting**
   - Auth endpoints: 15 requests per 15 minutes per IP
   - API endpoints: 150 requests per 15 minutes per IP
   - Prevents brute force and DDoS attacks

2. **HTTP Security Headers**
   - Helmet.js enables:
     - CSP (Content Security Policy)
     - HSTS (HTTP Strict Transport Security)
     - X-Frame-Options (clickjacking protection)
     - X-Content-Type-Options (MIME sniffing protection)

3. **CORS Protection**
   - Whitelist frontend origin in environment variable
   - Specific allowed methods (GET, POST, PUT, DELETE)
   - Credentials required for all requests

4. **Data Sanitization**
   - Express-mongo-sanitize prevents NoSQL injection
   - Removes `$` and `.` characters from input data
   - XSS-clean middleware for HTML content

### 🔒 Socket.IO Security

1. **WebSocket Authentication**
   - All socket connections require token in handshake
   - Invalid tokens result in connection rejection
   - Guest access allowed with explicit role assignment

2. **Event Validation**
   - Server validates all socket events
   - Prevents unauthorized room access
   - Checks user membership before broadcasting

### 🌐 Environment Security

1. **Sensitive Configuration**
   ```
   ✅ DO Store in .env:
   - Database credentials
   - API keys and secrets
   - OAuth credentials
   - JWT secrets
   - Port numbers
   
   ❌ DON'T Store in .env:
   - Push to version control
   - Commit .env files
   - Share credentials
   - Use weak/default secrets
   ```

2. **Environment Separation**
   ```
   Development:  http://localhost:8000 (local)
   Production:   https://https://confera-h2oo.onrender.com (HTTPS only)
   ```

### 📋 Best Practices Implementation

| Practice | Implementation | Status |
|----------|----------------|--------|
| Password Hashing | Bcrypt 10 rounds | ✅ Implemented |
| Rate Limiting | Express-rate-limit | ✅ Implemented |
| HTTPS | Recommended for production | ⚠️ Manual setup |
| CORS | Whitelist origin | ✅ Implemented |
| Input Validation | express-mongo-sanitize | ✅ Implemented |
| XSS Protection | helmet + xss-clean | ✅ Implemented |
| CSRF Protection | Same-site cookies | ⚠️ Configure in production |
| Logging | Console (add Winston for prod) | ⚠️ Needs enhancement |

### 🚀 Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS/TLS certificates
- [ ] Enable MongoDB authentication
- [ ] Rotate JWT/Token secrets regularly
- [ ] Set strong, unique Google OAuth credentials
- [ ] Enable helmet CSP headers
- [ ] Configure HTTPS redirect
- [ ] Use environment secrets manager (AWS Secrets, HashiCorp Vault)
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated (`npm audit fix`)

---

## Screenshots

### Landing Page
![Landing Page Placeholder](https://via.placeholder.com/1200x675?text=Landing+Page+-+Welcome+Screen)
*Professional landing page with call-to-action and feature highlights*

### Authentication Page
![Authentication Placeholder](https://via.placeholder.com/1200x675?text=Auth+Page+-+Login+&+Register)
*Login/Register form with Google OAuth option*

### Home Dashboard
![Dashboard Placeholder](https://via.placeholder.com/1200x675?text=Home+Dashboard+-+New+Meeting+&+History)
*Main dashboard showing quick meeting creation and recent meetings*

### Video Meeting Room
![Video Meeting Placeholder](https://via.placeholder.com/1200x675?text=Video+Meeting+-+Participants+&+Chat)
*Full-featured video conferencing interface with controls and participant list*

### Meeting History
![History Placeholder](https://via.placeholder.com/1200x675?text=History+-+Past+Meetings+List)
*Meeting history with dates, participants, and duration*

### Guest Join Page
![Guest Join Placeholder](https://via.placeholder.com/1200x675?text=Guest+Join+-+Anonymous+Access)
*Simple guest access interface without authentication*

---


### Potential Technologies for Future

- **WebRTC SFU** - Selective Forwarding Unit for better scalability
- **Janus/Kurento** - Media server for advanced features
- **Redis** - Session management and caching
- **Stripe/Razorpay** - Subscription and payment handling
- **Twilio** - Phone dial-in and fallback
- **Docker & Kubernetes** - Containerization and orchestration

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards

- Follow ESLint configuration
- Write clear commit messages
- Test thoroughly before submitting PR
- Update documentation for new features
- Add comments for complex logic

---

## License

This project is licensed under the **ISC License** - see the LICENSE file for details.

```
ISC License

Copyright (c) 2025 Piyush Prajapati

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
```

---

## Authors

**Piyush Prajapati** - Full Stack Development(MERN)

### Contributors

Contributions and feedback from the community are appreciated!

---

## Support & Contact

- 📧 Email: support@confera.io
- 🐛 Issues: [GitHub Issues](https://github.com/PiyushTechie/Confera/issues)
- 🌐 Website: [https://confera-h2oo.onrender.com/](https://confera-h2oo.onrender.com/)

---

## Deployment

### Render.com (Backend)

1. Create account on [Render](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Set environment variables in dashboard
5. Deploy automatically on push

### Vercel (Frontend)

1. Connect GitHub to [Vercel](https://vercel.com)
2. Select frontend directory
3. Set production API URL
4. Deploy

---
## Acknowledgments

- **Google OAuth** - Secure authentication
- **WebRTC** - Real-time peer communication
- **Socket.IO** - Real-time event handling
- **MongoDB** - Reliable data persistence
- **React & Vite** - Modern frontend tooling
- **Tailwind CSS** - Beautiful styling

---

**Last Updated:** December 28, 2025

**Status:** ✅ Production Ready | 📦 v1.0.0 | 🚀 Actively Maintained

---

<div align="center">

Made with ❤️ by Piyush Prajapati

⭐ If you find this project helpful, please star it on GitHub!

</div>
