import React, { useState } from 'react';
import styled from 'styled-components';
import { Menu, X } from 'lucide-react'; 
import { Link } from 'react-router-dom';
// 1. Import the logo
import brandLogo from '../assets/BrandLogo.png'; 

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-2 max-w-7xl mx-auto mt-2">
      {/* Glassmorphism Background (Main Bar) */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm z-0" />

      {/* Navbar Content */}
      <div className="relative z-10 flex items-center justify-between w-full px-2 py-2">
        
        {/* Logo Section - Modified to use Image */}
        <Link to="/" className="flex items-center gap-2 group">
           <img 
              src={brandLogo} 
              alt="Cenfora Logo" 
              // Responsive height: h-16 (64px) mobile, h-20 (80px) desktop
              className="h-16 md:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
           />
        </Link>

        {/* --- DESKTOP MENU (Hidden on Mobile) --- */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/guest" style={{ textDecoration: 'none' }}>
            <UnderlineButtonStyle>
              <button>Guest Join</button>
            </UnderlineButtonStyle>
          </Link>

          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <UnderlineButtonStyle>
              <button>Register</button>
            </UnderlineButtonStyle>
          </Link>
          
          <Link to="/auth" style={{ textDecoration: 'none' }}>
            <LoginButtonStyle>
              <div className="button" style={{ '--clr': '#4f46e5' }}>
                <span className="button__icon-wrapper">
                  <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="button__icon-svg" width={10}>
                    <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 14 15" fill="none" width={10} xmlns="http://www.w3.org/2000/svg" className="button__icon-svg button__icon-svg--copy">
                    <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
                  </svg>
                </span>
                Login
              </div>
            </LoginButtonStyle>
          </Link>
        </div>

        {/* --- MOBILE HAMBURGER BUTTON --- */}
        <button 
          onClick={toggleMenu} 
          className="md:hidden text-slate-700 hover:text-indigo-600 focus:outline-none transition-colors p-2"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* --- MOBILE DROPDOWN MENU --- */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-2 p-6 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl flex flex-col items-center gap-6 md:hidden animate-in slide-in-from-top-2 fade-in duration-200 z-50">
          
          <Link to="/guest" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            <UnderlineButtonStyle>
              <button style={{ fontSize: '1.1rem' }}>Guest Join</button>
            </UnderlineButtonStyle>
          </Link>

          <Link to="/auth" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            <UnderlineButtonStyle>
              <button style={{ fontSize: '1.1rem' }}>Register</button>
            </UnderlineButtonStyle>
          </Link>
          
          <div className="w-full border-t border-slate-100 my-2"></div>

          <Link to="/auth" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
            <LoginButtonStyle>
              <div className="button" style={{ '--clr': '#4f46e5', width: '100%', justifyContent: 'center' }}>
                <span className="button__icon-wrapper">
                  <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="button__icon-svg" width={10}>
                    <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
                  </svg>
                  <svg viewBox="0 0 14 15" fill="none" width={10} xmlns="http://www.w3.org/2000/svg" className="button__icon-svg button__icon-svg--copy">
                    <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
                  </svg>
                </span>
                Login
              </div>
            </LoginButtonStyle>
          </Link>
        </div>
      )}
    </nav>
  );
};

// --- STYLED COMPONENTS ---
const UnderlineButtonStyle = styled.div`
  button {
    color: #64748b;
    text-decoration: none;
    font-size: 1rem; 
    border: none;
    background: none;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    padding: 5px 0;
    transition: color 0.3s ease;
    position: relative;
    display: inline-block;
  }

  button::before {
    margin-left: auto;
  }

  button::after, button::before {
    content: '';
    width: 0%;
    height: 2px;
    background: #4f46e5;
    display: block;
    transition: 0.5s;
    position: absolute;
    bottom: 0;
  }

  button:hover {
    color: #0f172a;
  }

  button:hover::after, button:hover::before {
    width: 100%;
  }
`;

const LoginButtonStyle = styled.div`
  .button {
    line-height: 1;
    text-decoration: none;
    display: inline-flex;
    border: none;
    cursor: pointer;
    align-items: center;
    gap: 0.75rem;
    background-color: var(--clr);
    color: #fff;
    border-radius: 10rem;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    padding-left: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background-color 0.3s;
    font-size: 0.95rem;
  }

  .button__icon-wrapper {
    flex-shrink: 0;
    width: 25px;
    height: 25px;
    position: relative;
    color: var(--clr);
    background-color: #fff;
    border-radius: 50%;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .button:hover {
    background-color: #312e81;
  }

  .button:hover .button__icon-wrapper {
    color: #312e81;
  }

  .button__icon-svg--copy {
    position: absolute;
    transform: translate(-150%, 150%);
  }

  .button:hover .button__icon-svg:first-child {
    transition: transform 0.3s ease-in-out;
    transform: translate(150%, -150%);
  }

  .button:hover .button__icon-svg--copy {
    transition: transform 0.3s ease-in-out 0.1s;
    transform: translate(0);
  }
`;

export default Navbar;