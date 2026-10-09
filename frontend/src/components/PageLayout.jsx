import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const PageLayout = ({ children, title, subtitle, maxWidth = "max-w-4xl" }) => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      {/* Page Header Area */}
      {(title || subtitle) && (
        <div className="bg-white border-b border-slate-200 pt-32 pb-16 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {title && <h1 className="text-4xl md:text-5xl font-bold text-slate-900 font-heading tracking-tight mb-4">{title}</h1>}
            {subtitle && <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow w-full">
        <div className={`${(title || subtitle) ? 'py-12 md:py-20' : 'pt-32 pb-20'} px-6 lg:px-8 ${maxWidth} mx-auto`}>
          <div className="prose prose-slate prose-indigo max-w-none">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PageLayout;
