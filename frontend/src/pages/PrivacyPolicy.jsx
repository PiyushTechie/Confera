import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/BrandLogo.png';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* --- NEW REPEATING WATERMARK PATTERN --- */}
      {/* 1. fixed: Stays in place while you scroll
          2. inset-[-50%]: Makes the div huge (extending far beyond the screen) so when we rotate it, we don't see empty corners.
          3. -rotate-12: Tilts the entire grid of logos.
          4. z-0: Puts it behind everything.
      */}
      <div 
        className="fixed inset-[-50%] z-0 pointer-events-none opacity-[0.03] -rotate-12"
        style={{
            backgroundImage: `url(${brandLogo})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '80px', // Adjust this to make logos smaller/larger
            backgroundPosition: 'center'
        }}
      />
      {/* --------------------------------------- */}


      <div className="max-w-4xl mx-auto relative z-10">
        <Link 
          to="/auth" 
          className="inline-flex items-center text-slate-600 hover:text-indigo-600 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Sign In
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 px-8 py-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Privacy Policy</h1>
                <p className="text-indigo-100 mt-2">Last updated: December 29, 2025</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8 text-slate-600 leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p>
                Welcome to Cenfora. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy will inform you as to how we look after your personal data when you visit our 
                website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. The Data We Collect</h2>
              <p className="mb-4">We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. How We Use Your Data</h2>
              <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party).</li>
                <li>To enable video conferencing features and real-time communication.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
                used or accessed in an unauthorized way, altered or disclosed. We use industry-standard encryption for 
                video transmission.
              </p>
            </section>
            
            <div className="border-t border-slate-200 pt-8 mt-8">
              <p className="text-sm text-slate-500">
                If you have any questions about this privacy policy, please contact us at support@cenfora.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}