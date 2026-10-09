import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Authentication = lazy(() => import('./pages/Authentication'));
const VideoMeetComponent = lazy(() => import('./pages/VideoMeet'));
const HomeComponent = lazy(() => import('./pages/Home'));
const History = lazy(() => import('./pages/History'));
const GuestJoin = lazy(() => import('./pages/GuestJoin'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const CookieSettings = lazy(() => import('./pages/CookieSettings'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Community = lazy(() => import('./pages/Community'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Documentation = lazy(() => import('./pages/Documentation'));
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Security = lazy(() => import('./pages/Security'));
const Changelog = lazy(() => import('./pages/Changelog'));
const NotFound404 = lazy(() => import('./pages/NotFound404'));
const ServerError500 = lazy(() => import('./pages/ServerError500'));

const PublicRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#202124] text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8ab4f8]"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/auth" element={<PublicRoute><Authentication /></PublicRoute>} />
            <Route path="/guest" element={<GuestJoin />} />
            
            <Route path="/cookie-settings" element={<CookieSettings />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/community" element={<Community />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/documentation" element={<Documentation />} />
            
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/security" element={<Security />} />
            <Route path="/changelog" element={<Changelog />} />
            
            <Route path='/home' element={<ProtectedRoute><HomeComponent/></ProtectedRoute>} />
            <Route path='/history' element={<ProtectedRoute><History/></ProtectedRoute>} />

            <Route path='/meeting/:url' element={<VideoMeetComponent />} />

            {/* Error Pages */}
            <Route path="/500" element={<ServerError500 />} />
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;