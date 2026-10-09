import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown, Menu, X, Layout, FileText,
  Sun, Globe, Newspaper, Tags, ArrowRight
} from "lucide-react";
import brandLogo from '../assets/BrandLogo.png';

const resourcesData = [
  { title: "Products", description: "Find the perfect solution for your needs.", icon: Layout, color: "text-purple-600 bg-purple-50" },
  { title: "Blog", description: "Read our latest updates and articles.", icon: FileText, color: "text-purple-600 bg-purple-50" },
  { title: "Services", description: "Learn how we can help you achieve goals.", icon: Sun, color: "text-slate-700 bg-slate-100" },
  { title: "Support", description: "Reach out to us for assistance.", icon: Globe, color: "text-purple-600 bg-purple-50" },
  { title: "News", description: "Insightful articles and expert opinions.", icon: Newspaper, color: "text-purple-600 bg-purple-50" },
  { title: "Offers", description: "Explore limited-time deals and bundles.", icon: Tags, color: "text-slate-700 bg-slate-100" },
];

const Navbar = ({ user, handleLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMegaMenuOpen, setIsMobileMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isMobileMenuOpen]);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 w-full transition-all duration-500 font-heading ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm' : 'bg-transparent'}`}>
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Top">

        {/* Logo */}
        <div className="flex shrink-0 items-center">
          <Link to={user ? "/home" : "/"} className="outline-none rounded-md cursor-pointer">
            <span className="sr-only">Confera</span>
            <img className="h-10 sm:h-14 lg:h-16 w-auto object-contain transition-transform hover:scale-105 duration-500" src={brandLogo} alt="Confera" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          {user ? (
            <Link to="/history" className="group relative inline-flex overflow-hidden px-2 py-2 cursor-pointer">
              <span className="invisible text-[15px] font-semibold">History</span>
              <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-slate-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">History</span>
              <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-purple-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0">History</span>
            </Link>
          ) : (
            <>
              <Link to="/" className="group relative inline-flex overflow-hidden px-2 py-2 cursor-pointer">
                <span className="invisible text-[15px] font-semibold">Home</span>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-slate-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">Home</span>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-purple-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0">Home</span>
              </Link>

          <Link to="/about" className="group relative inline-flex overflow-hidden px-2 py-2 cursor-pointer">
            <span className="invisible text-[15px] font-semibold">About Us</span>
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-slate-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">About Us</span>
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-purple-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0">About Us</span>
          </Link>

          {/* Mega Menu Trigger */}
          <div className="group relative">
            <button className="group relative inline-flex overflow-hidden px-2 py-6 outline-none cursor-pointer">
              <span className="invisible text-[15px] font-semibold flex items-center gap-1.5">Resources <ChevronDown size={16} /></span>
              <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-slate-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full gap-1.5">
                Resources <ChevronDown size={16} strokeWidth={2.5} />
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-purple-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0 gap-1.5">
                Resources <ChevronDown size={16} strokeWidth={2.5} className="transition-transform duration-500 group-hover:rotate-180" />
              </span>
            </button>

            {/* Pure CSS Dropdown - Smoothed fade */}
            <div className="invisible absolute left-1/2 top-full -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="w-screen max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/60">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-6 bg-white">
                  {resourcesData.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        to={`/${item.title.toLowerCase().replace(" ", "-")}`}
                        className="group/item flex items-start gap-4 rounded-xl p-3 hover:bg-slate-50 transition-colors duration-300 outline-none cursor-pointer"
                      >
                        <div className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-500 group-hover/item:scale-105 ${item.color}`}>
                          <Icon size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-900 transition-colors duration-300 group-hover/item:text-purple-600">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500 font-medium">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">Need a custom enterprise plan?</span>
                  <Link to="/contact" className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 group/link cursor-pointer transition-colors duration-300">
                    Contact Sales
                    <ArrowRight size={16} strokeWidth={2.5} className="transition-transform duration-500 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <Link to="/contact" className="group relative inline-flex overflow-hidden px-2 py-2 cursor-pointer">
            <span className="invisible text-[15px] font-semibold">Contact Us</span>
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-slate-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">Contact Us</span>
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-purple-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0">Contact Us</span>
          </Link>
            </>
          )}
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-5">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold border-2 border-purple-200">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <button 
                onClick={handleLogout} 
                className="rounded-full bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-[14px] font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/guest" className="group relative inline-flex overflow-hidden px-2 py-2 cursor-pointer">
                <span className="invisible text-[15px] font-semibold">Join as Guest</span>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-slate-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">Join as Guest</span>
                <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold text-purple-600 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0">Join as Guest</span>
              </Link>

              {/* Sign In Button */}
              <Link to="/auth" className="cursor-pointer">
                <button className="relative inline-flex h-11 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-500">
                  <span className="absolute inset-[-1000%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F3E8FF_0%,#9333EA_50%,#F3E8FF_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-900 px-6 py-1 text-[15px] font-bold text-white backdrop-blur-3xl transition-colors duration-500 group-hover:bg-slate-900/90 gap-2">
                    Sign In <ArrowRight size={16} strokeWidth={2.5} className="text-purple-300 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full focus:outline-none transition-colors duration-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[80px] z-40 bg-white border-t border-slate-100 lg:hidden overflow-y-auto shadow-2xl">
          <div className="flex flex-col px-4 py-6 space-y-2">
            
            {user ? (
              <Link to="/history" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-4 text-base font-bold text-slate-900 rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer">
                History
              </Link>
            ) : (
              <>
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-4 text-base font-bold text-slate-900 rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer">
                  Home
                </Link>

                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-4 text-base font-bold text-slate-900 rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer">
                  About Us
                </Link>

                <div className="space-y-1">
                  <button
                    onClick={() => setIsMobileMegaMenuOpen(!isMobileMegaMenuOpen)}
                    className="flex w-full items-center justify-between px-4 py-4 text-base font-bold text-slate-900 rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer"
                  >
                    Resources
                    <ChevronDown size={20} strokeWidth={2.5} className={`transition-transform duration-500 ${isMobileMegaMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isMobileMegaMenuOpen && (
                    <div className="px-3 py-3 space-y-1 bg-slate-50 rounded-2xl mx-2">
                      {resourcesData.map((item, index) => (
                        <Link
                          key={index}
                          to={`/${item.title.toLowerCase().replace(" ", "-")}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-4 px-3 py-3 text-sm font-bold text-slate-800 rounded-xl hover:bg-white hover:text-purple-600 hover:shadow-sm transition-all duration-300 cursor-pointer"
                        >
                          <div className={`p-2 rounded-lg ${item.color}`}>
                            <item.icon size={18} strokeWidth={2.5} />
                          </div>
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-4 text-base font-bold text-slate-900 rounded-2xl hover:bg-slate-50 transition-colors duration-300 cursor-pointer">
                  Contact Us
                </Link>
              </>
            )}

            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="font-bold text-slate-900 text-lg">{user.name}</span>
                  </div>
                  <button 
                    onClick={() => { handleLogout?.(); setIsMobileMenuOpen(false); }}
                    className="w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 transition-colors duration-300 cursor-pointer flex justify-center items-center gap-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/guest" onClick={() => setIsMobileMenuOpen(false)} className="w-full cursor-pointer">
                    <button className="w-full rounded-2xl border-2 border-slate-200 px-4 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 transition-colors duration-300 cursor-pointer flex justify-center items-center gap-2">
                      Join as Guest
                    </button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full cursor-pointer">
                    <button className="relative w-full overflow-hidden rounded-2xl p-[2px] group cursor-pointer">
                      <span className="absolute inset-[-1000%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F3E8FF_0%,#9333EA_50%,#F3E8FF_100%)]" />
                      <span className="inline-flex h-full w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-4 text-base font-bold text-white backdrop-blur-3xl gap-2 transition-colors duration-500 group-hover:bg-slate-900/90">
                        Sign In <ArrowRight size={18} strokeWidth={2.5} className="text-purple-300" />
                      </span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;