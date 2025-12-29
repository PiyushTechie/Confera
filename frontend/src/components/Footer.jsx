import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
// 1. Import the logo image
import brandLogo from '../assets/BrandLogo.png';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Top Section: Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Column 1: Brand & Description */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {/* 2. Replaced Video Icon with Image */}
              <img 
                src={brandLogo} 
                alt="Cenfora Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
              />
            </Link>
            <p className="text-slate-500 text-md leading-relaxed max-w-xs mb-6">
              Making video communication seamless, secure, and accessible for everyone. Connect deeper, anywhere.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 cursor-pointer rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 cursor-pointer rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 cursor-pointer rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-xl">Product</h4>
            <ul className="space-y-3 text-md text-slate-500">
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Features</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Pricing</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Integrations</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Changelog</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-lg">Company</h4>
            <ul className="space-y-3 text-md text-slate-500">
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">About Us</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Careers</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Blog</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors cursor-pointer">Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-lg">Get in touch</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <span className="block text-md font-semibold text-slate-400 uppercase mb-4">General Inquiries</span>
                <a href="mailto:piyushprajapati7120@gmail.com" className="hover:text-indigo-600 transition-colors break-words text-md cursor-pointer">
                  piyushprajapati7120@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-md">
            © {new Date().getFullYear()} Cenfora Inc. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-md text-slate-500 font-medium">
             <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors cursor-pointer">Privacy Policy</Link>
             <Link to="/terms-and-conditions" className="hover:text-indigo-600 transition-colors cursor-pointer">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;