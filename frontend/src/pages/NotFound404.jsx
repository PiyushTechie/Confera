import React from 'react';
import { Link } from 'react-router-dom';
import { VideoOff, Search, ArrowLeft, Home } from 'lucide-react';
import PageLayout from '../components/PageLayout';

export default function NotFound404() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        
        {/* Animated Visual */}
        <div className="relative mb-12">
          {/* Background glow */}
          <div className="absolute inset-0 bg-purple-500/20 blur-[50px] rounded-full w-48 h-48 mx-auto -z-10" />
          
          <div className="relative flex items-center justify-center">
            {/* Main Camera Icon - Floating */}
            <div className="animate-[float_6s_ease-in-out_infinite] bg-white p-6 rounded-3xl shadow-xl border border-slate-200 z-10 relative">
              <VideoOff className="w-20 h-20 text-slate-400" strokeWidth={1.5} />
              
              {/* Question mark overlay */}
              <div className="absolute -top-4 -right-4 bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white animate-bounce">
                ?
              </div>
            </div>

            {/* Orbiting element */}
            <div className="absolute w-48 h-48 animate-[spin_10s_linear_infinite]">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow-md border border-slate-100">
                <Search className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-8xl font-black text-slate-900 tracking-tighter mb-4 opacity-10">404</h1>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-heading">
          Meeting Not Found
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg leading-relaxed">
          Looks like this meeting room doesn't exist, or the link has expired. 
          Let's get you back to familiar territory.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm w-full sm:w-auto justify-center group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          
          <Link 
            to="/"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md w-full sm:w-auto justify-center group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Back to Home
          </Link>
        </div>

      </div>

      {/* Inject custom keyframe since we didn't add it to tailwind config */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </PageLayout>
  );
}
