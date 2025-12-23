import React from 'react';
import styled from 'styled-components';
import { 
  Shield, Zap, Users, Video, CheckCircle, Globe, Play, 
  MonitorUp, MessageSquare, Lock, Wifi, Smartphone, 
  Server, Code, ChevronRight, Check
} from 'lucide-react';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 
import { Link } from 'react-router-dom';
import '../index.css'
const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-indigo-100 overflow-x-hidden">
      <Navbar />

      <main className="relative pt-32 pb-20 px-6 lg:px-8 bg-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-indigo-50 to-white rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="font-outfit text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900">
              Connect deeper <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                anywhere.
              </span>
            </h1>
            
            <p className="font-outfit text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Experience the next evolution of video conferencing. 
              Crystal clear 4K video, spatial audio, and zero-latency collaboration for teams that move fast.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link to="/auth" style={{ textDecoration: 'none' }}>
                <GetStartedBtnStyle>
                  <button className="button">
                    Start Free Meeting
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </GetStartedBtnStyle>
              </Link>
              <button className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                 <Play className="w-4 h-4 fill-current" />
                 Watch Demo
              </button>
            </div>
          </div>

          <div className="relative h-[500px] w-full flex items-center justify-center hidden md:flex">
            
             <div className="relative z-10 w-full max-w-sm aspect-[4/5] bg-slate-50 rounded-[2.5rem] border-8 border-slate-900 shadow-2xl shadow-indigo-500/20 transform -rotate-2 overflow-hidden">
                
                <img 
                    src="https://images.unsplash.com/photo-1616587894289-86480e533129?q=80&w=2070&auto=format&fit=crop" 
                    alt="App Interface Preview" 
                    className="w-full h-full object-cover" 
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <Video size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">HD Video Calls</p>
                            <p className="text-xs text-slate-500">Crystal clear quality.</p>
                        </div>
                    </div>
                </div>

             </div>

             <div className="absolute -z-10 top-8 right-16 w-full max-w-sm aspect-[4/5] bg-indigo-100/50 rounded-[2.5rem] transform rotate-3 border border-indigo-200" />
          </div>
        </div>
      </main>

      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Trusted by 2,000+ teams and developers</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale">
                <div className="font-bold text-xl text-slate-500 flex items-center gap-2"><Zap size={20}/> ACME Corp</div>
                <div className="font-bold text-xl text-slate-500 flex items-center gap-2"><Globe size={20}/> GlobalTech</div>
                <div className="font-bold text-xl text-slate-500 flex items-center gap-2"><Shield size={20}/> SecureNet</div>
                <div className="font-bold text-xl text-slate-500 flex items-center gap-2"><Code size={20}/> DevHouse</div>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4">
               <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                  <Lock size={12} className="text-green-500"/> WebRTC Powered
               </span>
               <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                  <Shield size={12} className="text-indigo-500"/> End-to-End Encrypted
               </span>
               <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                  <Globe size={12} className="text-blue-500"/> Browser Based
               </span>
            </div>
         </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Everything you need to collaborate</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">Powerful features wrapped in a simple interface. No bloat, just performance.</p>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Video, title: "HD Video & Audio", desc: "Crystal clear 4K video rendering with noise cancellation." },
                { icon: MonitorUp, title: "One-click Screen Share", desc: "Share your entire screen, window, or a specific tab instantly." },
                { icon: MessageSquare, title: "Real-time Chat", desc: "Text, emojis, and link sharing without interrupting the flow." },
                { icon: Users, title: "Multi-participant", desc: "Host group calls with stable low-latency connections." },
                { icon: Globe, title: "No Downloads", desc: "Runs entirely in the browser. Send a link, start a meeting." },
                { icon: Shield, title: "Secure by Design", desc: "Peer-to-peer encryption ensures your data stays private." },
              ].map((feature, idx) => (
                 <div key={idx} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-6 group-hover:scale-110 transition-transform">
                       <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                 </div>
              ))}
           </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-50">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-16">Start meeting in seconds</h2>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
               <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10" />

               {[
                 { num: "1", title: "Create Room", desc: "Click 'New Meeting' to generate a unique secure room ID." },
                 { num: "2", title: "Share Link", desc: "Copy the code or link and send it to your team or friends." },
                 { num: "3", title: "Join Instantly", desc: "Guests join via browser. No login or installs required." },
               ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-200 mb-6">
                        {step.num}
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                     <p className="text-slate-600">{step.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      <section className="py-24 px-6 bg-white">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12">Built for every conversation</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { icon: Users, title: "Remote Teams", desc: "Daily stand-ups & sprint planning." },
                 { icon: MonitorUp, title: "Online Classes", desc: "Tutoring and interactive workshops." },
                 { icon: Code, title: "Tech Interviews", desc: "Live coding sessions with zero lag." },
                 { icon: Video, title: "Communities", desc: "Casual hangouts and group events." },
               ].map((item, idx) => (
                  <div key={idx} className="p-6 border border-slate-200 rounded-2xl hover:shadow-lg transition-shadow">
                     <item.icon className="w-8 h-8 text-indigo-500 mb-4" />
                     <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                     <p className="text-slate-500 text-sm mt-2">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      <section className="py-24 px-6 bg-indigo-900 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none" />
         
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
               <h2 className="text-3xl md:text-5xl font-bold mb-6">Why we are different</h2>
               <p className="text-indigo-200 text-lg mb-8">Most tools are bloated, slow, and require heavy installs. We built Cenfora for speed, privacy, and simplicity.</p>
               
               <div className="space-y-4">
                  {[
                    "Faster join time than Zoom/Teams",
                    "No application installation required",
                    "Optimized for unstable/low bandwidth",
                    "Privacy-first P2P architecture",
                    "Clean, distraction-free interface"
                  ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                           <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="font-medium">{item}</span>
                     </div>
                  ))}
               </div>
            </div>
            <div className="bg-indigo-800/50 backdrop-blur-md p-8 rounded-3xl border border-indigo-500/30">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                     <Zap className="text-white" />
                  </div>
                  <div>
                     <h3 className="font-bold text-xl">Lightning Fast</h3>
                     <p className="text-indigo-300 text-sm">Benchmarks vs Competitors</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                     <div className="flex justify-between text-sm mb-1"><span>Cenfora</span> <span className="font-bold">0.4s</span></div>
                     <div className="h-3 bg-indigo-950 rounded-full overflow-hidden">
                        <div className="h-full w-[90%] bg-gradient-to-r from-green-400 to-emerald-500" />
                     </div>
                  </div>
                  <div>
                     <div className="flex justify-between text-sm mb-1 text-indigo-300"><span>Competitor Z</span> <span>4.2s</span></div>
                     <div className="h-3 bg-indigo-950 rounded-full overflow-hidden">
                        <div className="h-full w-[30%] bg-indigo-700" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <section className="py-24 px-6 bg-slate-50">
         <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-500 mb-12">No hidden fees. Cancel anytime.</p>
            
            <div className="grid md:grid-cols-2 gap-8 items-start">
               <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-slate-900 mb-6">$0</div>
                  <ul className="space-y-3 text-left mb-8">
                     {["Unlimited 1-on-1 meetings", "40 min group limit", "Screen sharing", "HD Quality"].map(feat => (
                        <li key={feat} className="flex items-center gap-2 text-slate-600">
                           <CheckCircle size={18} className="text-slate-400"/> {feat}
                        </li>
                     ))}
                  </ul>
                  <button className="w-full py-3 rounded-xl border-2 border-slate-900 text-slate-900 font-bold hover:bg-slate-50 transition-colors">Start Free</button>
               </div>
               
               <div className="bg-white p-8 rounded-3xl border-2 border-indigo-600 shadow-xl relative">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-slate-900 mb-6">$12<span className="text-lg font-normal text-slate-500">/mo</span></div>
                  <ul className="space-y-3 text-left mb-8">
                     {["Unlimited group time", "Recording & Transcripts", "Admin Controls", "Custom Branding", "Priority Support"].map(feat => (
                        <li key={feat} className="flex items-center gap-2 text-slate-600">
                           <CheckCircle size={18} className="text-indigo-600"/> {feat}
                        </li>
                     ))}
                  </ul>
                  <button className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Get Pro</button>
               </div>
            </div>
         </div>
      </section>

      <section className="py-20 px-6 bg-white border-t border-slate-100">
         <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
               <div className="w-18 h-18 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                  <Lock size={24} />
               </div>
               <h3 className="font-bold text-xl mb-2">End-to-End Encrypted</h3>
               <p className="text-slate-500 text-md">Media streams are encrypted using DTLS-SRTP. We cannot see or hear your meetings.</p>
            </div>
            <div className="p-6">
               <div className="w-18 h-18 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                  <Server size={24} />
               </div>
               <h3 className="font-bold text-xl mb-2">Scalable Infrastructure</h3>
               <p className="text-slate-500 text-md">Powered by global edge nodes to ensure low latency regardless of your location.</p>
            </div>
            <div className="p-6">
               <div className="w-18 h-18 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                  <Wifi size={24} />
               </div>
               <h3 className="font-bold text-xl mb-2">99.9% Uptime</h3>
               <p className="text-slate-500 text-md">Reliable connection management keeps you online even when your network flickers.</p>
            </div>
         </div>
      </section>

      <section className="py-24 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-900 to-purple-900 opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[150px] opacity-30 pointer-events-none" />
            
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Ready to connect?</h2>
               <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto">Join thousands of users experiencing the future of video communication today.</p>
               
               <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                  <Link to="/auth" style={{ textDecoration: 'none' }}>
                     <button className="px-8 py-4 bg-white text-indigo-900 font-bold text-lg rounded-full hover:bg-indigo-50 transition-colors shadow-xl shadow-white/10">
                        Create Your Room Now
                     </button>
                  </Link>
                  <br></br>
                  <p className="text-sm text-slate-400">Free forever during beta. No credit card.</p>
               </div>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
};

// --- STYLED COMPONENTS ---
const GetStartedBtnStyle = styled.div`
  .button {
    position: relative;
    transition: all 0.3s ease-in-out;
    box-shadow: 0px 10px 20px rgba(79, 70, 229, 0.2);
    padding-block: 1rem;
    padding-inline: 2rem;
    background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #ffff;
    gap: 12px;
    font-weight: 700;
    border: 2px solid #ffffff;
    outline: none;
    overflow: hidden;
    font-size: 1.1rem;
    font-family: 'Outfit', sans-serif;
  }

  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0px 15px 25px rgba(79, 70, 229, 0.4);
  }

  .button::before {
    content: "";
    position: absolute;
    width: 100px;
    height: 100%;
    background-image: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 30%,
      rgba(255, 255, 255, 0.8),
      rgba(255, 255, 255, 0) 70%
    );
    top: 0;
    left: -100px;
    opacity: 0.6;
  }

  .button:hover::before {
    animation: shine 1.5s ease-out infinite;
  }

  @keyframes shine {
    0% { left: -100px; }
    60% { left: 100%; }
    to { left: 100%; }
  }
`;

export default LandingPage;