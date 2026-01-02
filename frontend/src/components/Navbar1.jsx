import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import brandLogo from "../assets/BrandLogo.png";
import { Clock, LogOut, ChevronDown } from "lucide-react";

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
    const displayUsername = user?.username || "user";

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all"
            >
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
                    {getInitials(displayName)}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">@{displayUsername}</p>
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

    return (
        <nav className="w-full px-8 py-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-2 cursor-pointer ml-4" onClick={() => navigate("/home")}>
                <img 
                    src={brandLogo} 
                    alt="Logo" 
                    className="h-16 sm:h-16 w-auto object-contain transition-transform hover:scale-105" 
                /> 
            </div>
            
            <div className="flex items-center gap-5 mr-4">
                <button 
                    onClick={() => navigate("/history")} 
                    className="text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl transition-colors" 
                    title="Meeting History"
                >
                    <Clock size={22} />
                </button>
                
                <ProfileMenu user={user} handleLogout={handleLogout} />
            </div>
        </nav>
    );
};

export default Navbar;