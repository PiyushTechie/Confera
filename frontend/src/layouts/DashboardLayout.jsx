import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Clock, LogOut, Video } from 'lucide-react';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    navigate("/auth");
  };

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/home' },
    { icon: Clock, label: 'History', path: '/history' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Video size={18} />
            </div>
            <span className="font-bold text-lg text-slate-800">Confera</span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>

        <div className="p-4 border-t border-slate-200">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
                <LogOut size={20} />
                Logout
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10">
          <h1 className="text-lg font-semibold text-slate-700 capitalize">
            {location.pathname.replace('/', '')}
          </h1>
        </header>

        {/* Page Content (Home/History renders here) */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;