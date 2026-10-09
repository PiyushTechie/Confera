import React from 'react';
import { ServerCrash, RefreshCcw, WifiOff, AlertTriangle } from 'lucide-react';
import PageLayout from '../components/PageLayout';

export default function ServerError500() {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">

        {/* Animated Visual */}
        <div className="relative mb-12">
          {/* Pulsing red background glow */}
          <div className="absolute inset-0 bg-rose-500/20 blur-[60px] rounded-full w-56 h-56 mx-auto animate-pulse -z-10" />

          <div className="relative group">
            {/* Main Server Icon with Glitch/Shake effect */}
            <div className="animate-[wiggle_4s_ease-in-out_infinite] bg-white p-8 rounded-[2.5rem] shadow-2xl border-2 border-rose-100 z-10 relative">
              <ServerCrash className="w-24 h-24 text-rose-500" strokeWidth={1.5} />

              {/* Floating warning triangles */}
              <div className="absolute -top-6 -left-4 animate-bounce" style={{ animationDelay: '0.1s' }}>
                <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
                  <WifiOff className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Sparks / Particles using pure CSS */}
            <div className="absolute top-0 right-10 w-2 h-2 bg-amber-400 rounded-full animate-[spark_2s_ease-out_infinite]" />
            <div className="absolute bottom-10 left-0 w-2 h-2 bg-rose-400 rounded-full animate-[spark_3s_ease-out_infinite_1s]" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-8xl font-black text-slate-900 tracking-tighter mb-4 opacity-10">500</h1>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-heading">
          Houston, we have a problem.
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-10 text-lg leading-relaxed">
          Our media servers are currently experiencing turbulence. Our engineering team has been notified and is on it.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 w-full sm:w-auto justify-center group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
        </div>

      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes spark {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-50px) scale(0); opacity: 0; }
        }
      `}</style>
    </PageLayout>
  );
}
