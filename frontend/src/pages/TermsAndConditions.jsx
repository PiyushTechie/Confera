import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/BrandLogo.png';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      <div 
        className="fixed inset-[-50%] z-0 pointer-events-none opacity-[0.07] -rotate-12"
        style={{
            backgroundImage: `url(${brandLogo})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '180px',
            backgroundPosition: 'center'
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link 
          to="/auth" 
          className="inline-flex items-center text-slate-600 hover:text-indigo-600 transition-colors mb-8 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Sign In
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Terms of Service</h1>
                <p className="text-slate-400 mt-2">Last updated: December 29, 2025</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-8 text-slate-600 leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing our website and using our video conferencing services, you agree to be bound by these Terms of Service 
                and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of 
                these terms, you are prohibited from accessing this site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Use License</h2>
              <p className="mb-4">Permission is granted to temporarily download one copy of the materials on Cenfora's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>modify or copy the materials;</li>
                <li>use the materials for any commercial purpose or for any public display;</li>
                <li>attempt to reverse engineer any software contained on Cenfora's website;</li>
                <li>remove any copyright or other proprietary notations from the materials.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. User Accounts</h2>
              <p>
                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
                Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Acceptable Use</h2>
              <p>
                You agree not to use the Service to transmit any content that is unlawful, offensive, upsetting, intended to disgust, 
                threatening, libelous, defamatory, obscene or otherwise objectionable.
              </p>
            </section>

            <div className="border-t border-slate-200 pt-8 mt-8">
              <p className="text-sm text-slate-500">
                Contact us at legal@cenfora.com for any questions regarding these terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}