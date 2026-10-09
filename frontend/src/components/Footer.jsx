import React from 'react';
import { Github, Twitter, Linkedin, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/BrandLogo.png';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 mb-16">
          
          <div className="col-span-2 lg:col-span-2 flex flex-col items-start">
            <Link to="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
              <img 
                src={brandLogo} 
                alt="Confera Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
              />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-8">
              Confera is the modern video conferencing solution for teams that value speed, security, and simplicity. Built on advanced SFU architecture for zero-latency collaboration.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" aria-label="GitHub" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                <Github size={18} />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="lg:col-start-3">
            <h4 className="font-heading font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link to="/features" className="hover:text-indigo-600 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link></li>
              <li><Link to="/security" className="hover:text-indigo-600 transition-colors">Security</Link></li>
              <li><Link to="/changelog" className="hover:text-indigo-600 transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="font-heading font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link to="/documentation" className="hover:text-indigo-600 transition-colors">Documentation</Link></li>
              <li><Link to="/community" className="hover:text-indigo-600 transition-colors">Community</Link></li>
              <li><Link to="/help-center" className="hover:text-indigo-600 transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h4 className="font-heading font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link to="/about" className="hover:text-indigo-600 transition-colors">About</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Blog</Link></li>
              <li><Link to="#" className="hover:text-indigo-600 transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-indigo-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 5: Contact Info */}
          <div>
            <h4 className="font-heading font-bold text-slate-900 mb-6 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <a href="mailto:confera.noreply@gmail.com" className="hover:text-indigo-600 transition-colors break-words font-medium">
                  confera.noreply@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  Mumbai, Maharashtra<br/>
                  India
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} Confera Inc. All rights reserved.
          </p>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-500 font-medium">
             <Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
             <Link to="/terms-and-conditions" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
             <Link to="/cookie-settings" className="hover:text-indigo-600 transition-colors">Cookie Settings</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;