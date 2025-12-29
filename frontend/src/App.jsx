import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import VideoMeetComponent from './pages/VideoMeet';
import HomeComponent from './pages/Home';
import History from './pages/History';
import GuestJoin from './pages/GuestJoin';
import PrivacyPolicy from './pages/PrivacyPolicy';         // <--- Import this
import TermsAndConditions from './pages/TermsAndConditions'

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/auth" element={<PublicRoute><Authentication /></PublicRoute>} />
          <Route path="/guest" element={<GuestJoin />} />
          
          <Route path='/home' element={<ProtectedRoute><HomeComponent/></ProtectedRoute>} />
          <Route path='/history' element={<ProtectedRoute><History/></ProtectedRoute>} />

          <Route path='/meeting/:url' element={<VideoMeetComponent />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;