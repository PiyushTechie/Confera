import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/Home';
import History from './pages/History';
import GuestJoin from './pages/GuestJoin';

// --- PROTECTION WRAPPER ---
// This prevents logged-in users from seeing the Landing/Login page
const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

// --- REQUIRE AUTH WRAPPER ---
// This prevents logged-out users from seeing Home/History
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 1. Public Routes (Redirect to Home if logged in) */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/auth" element={<PublicRoute><Authentication /></PublicRoute>} />
          <Route path="/guest" element={<GuestJoin />} />
          
          {/* 2. Protected Routes (No Dashboard Layout, just the pages) */}
          <Route path='/home' element={<ProtectedRoute><HomeComponent/></ProtectedRoute>} />
          <Route path='/history' element={<ProtectedRoute><History/></ProtectedRoute>} />

          {/* 3. Video Room */}
          <Route path='/:url' element={<VideoMeetComponent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;