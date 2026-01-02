import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import brandLogo from "../assets/BrandLogo.png";
import { LogOut, Clock } from "lucide-react";

// --- PROFILE MENU COMPONENT ---
const ProfileMenu = ({ user, handleLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
    const displayName = user?.name || "Guest";

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-sm focus:outline-none transition-transform hover:scale-105"
            >
                {getInitials(displayName)}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">@{user?.username || "user"}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};

// --- MAIN NAVBAR COMPONENT ---
const Navbar = ({ user, handleLogout }) => {
    const navigate = useNavigate();
    const brandLogoSrc = brandLogo; 

    return (
        // Changed max-w-7xl to w-full and added specific padding to match Home page
        <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-slate-200/60">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                
                {/* Brand Logo Section */}
                <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                    <img
                        src={brandLogoSrc}
                        alt="Brand Logo"
                        className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                    />
                    <span className="hidden text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ml-2">
                        Confera
                    </span>
                </div>

                {/* Right Side items */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <button 
                        onClick={() => navigate("/history")} 
                        className="text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl transition-all" 
                        title="Meeting History"
                    >
                        <Clock size={22} />
                    </button>
                    
                    <ProfileMenu user={user} handleLogout={handleLogout} />
                </div>
            </div>
        </nav>
    );
};

export default Navbar;