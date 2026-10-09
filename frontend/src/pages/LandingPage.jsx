import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Globe, Shield, Zap, Sparkles, MessageSquare, 
  MonitorUp, Code, Lock, Play, ChevronRight, CheckCircle, 
  ArrowRight, Users, LayoutDashboard, Share2
} from 'lucide-react';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 
import CursorGrid from '../components/CursorGrid';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import '../index.css';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const rotatingTexts = ["actually work.", "build culture.", "drive results.", "empower teams."];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    {
      id: 0,
      title: "Create Instant Rooms",
      icon: <Zap size={20} />,
      content: "Generate a secure, randomized meeting link in milliseconds. No downloads, no waiting rooms unless you want them.",
      image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop"
    },
    {
      id: 1,
      title: "Share Seamlessly",
      icon: <Share2 size={20} />,
      content: "Send the link via Slack, Email, or SMS. Guests join instantly through their browser on any device.",
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Collaborate Live",
      icon: <LayoutDashboard size={20} />,
      content: "Crystal clear 4K video, synchronized whiteboards, and real-time chat ensure your team stays aligned.",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc] text-slate-900 selection:bg-indigo-100 overflow-x-hidden font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <main className="relative pt-32 pb-32 px-6 lg:px-8 border-b border-slate-100 bg-white overflow-hidden min-h-screen flex items-center justify-center">
        <CursorGrid color="#4f46e5" />
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 pt-10 px-6 lg:px-8 w-full pointer-events-none">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 max-w-5xl mx-auto pointer-events-auto"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-medium text-sm shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Introducing Confera v2.0
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-heading text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight text-slate-900 drop-shadow-sm max-w-4xl mx-auto">
              Meetings that <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">empower teams.</span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto pt-4">
              Enterprise-grade video conferencing that runs natively in your browser. Lightning-fast, secure, and designed for professional teams.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link to="/auth" style={{ textDecoration: 'none' }}>
                  <Button size="lg" variant="primary" icon={<ArrowRight className="w-5 h-5" />} iconPosition="right">
                    Start a Free Meeting
                  </Button>
              </Link>
              <Button size="lg" variant="outline" icon={<Play className="w-4 h-4 fill-current" />}>
                 Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Dashboard mock removed per user request */}
        </div>
      </main>

      {/* --- LOGO CLOUD --- */}
      <section className="py-12 border-y border-slate-100 bg-white">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Trusted by the world's most innovative teams</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="font-heading font-bold text-2xl flex items-center gap-2"><Zap size={24}/> Linear</div>
                <div className="font-heading font-bold text-2xl flex items-center gap-2"><Globe size={24}/> Vercel</div>
                <div className="font-heading font-bold text-2xl flex items-center gap-2"><Shield size={24}/> Stripe</div>
                <div className="font-heading font-bold text-2xl flex items-center gap-2"><Code size={24}/> GitHub</div>
            </div>
         </div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <section className="py-32 px-6 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-20"
           >
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6">Designed for speed. <br/> Engineered for scale.</h2>
              <p className="text-slate-500 text-xl max-w-2xl mx-auto">Everything you need to run high-quality video meetings without the heavy desktop apps.</p>
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
              {/* Big Tile */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="md:col-span-2 md:row-span-2 rounded-[2rem] bg-white border border-slate-200 p-10 flex flex-col justify-between relative overflow-hidden shadow-sm hover:shadow-xl group"
              >
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-50 to-transparent opacity-50" />
                 <div className="relative z-10">
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                        <Video size={28} />
                    </div>
                    <h3 className="font-heading text-3xl font-bold text-slate-900 mb-4">Mediasoup SFU Architecture</h3>
                    <p className="text-slate-600 text-lg max-w-md">Our advanced Selective Forwarding Unit (SFU) routes video efficiently, saving your CPU and allowing hundreds of participants with crystal clear 4K rendering.</p>
                 </div>
                 <div className="relative z-10 w-full flex-1 mt-8 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                    <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop" alt="Meeting" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 </div>
              </motion.div>

              {/* Small Tile 1 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-[2rem] bg-slate-900 text-white p-10 flex flex-col relative overflow-hidden shadow-xl"
              >
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6">
                    <Lock size={24} />
                 </div>
                 <h3 className="font-heading text-2xl font-bold mb-3">Enterprise Security</h3>
                 <p className="text-slate-400">End-to-End encryption via DTLS-SRTP. We cannot see or hear your meetings. Ever.</p>
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-30" />
              </motion.div>

              {/* Small Tile 2 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-[2rem] bg-white border border-slate-200 p-10 flex flex-col shadow-sm hover:shadow-xl group"
              >
                 <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                    <Globe size={24} />
                 </div>
                 <h3 className="font-heading text-2xl font-bold text-slate-900 mb-3">Runs in the Browser</h3>
                 <p className="text-slate-600">Send a link, and they're in. Works perfectly on Chrome, Safari, Firefox, and mobile.</p>
              </motion.div>
              
              {/* Small Tile 3 */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="md:col-span-3 rounded-[2rem] bg-white border border-slate-200 p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm hover:shadow-xl"
              >
                 <div className="flex-1">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                        <MessageSquare size={24} />
                    </div>
                    <h3 className="font-heading text-3xl font-bold text-slate-900 mb-4">Real-time Collaboration</h3>
                    <p className="text-slate-600 text-lg">More than just video. Share your screen instantly, drop files in the chat, use live emoji reactions, and draw together on the synchronized whiteboard.</p>
                 </div>
                 <div className="flex-1 w-full h-48 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden">
                    <div className="flex -space-x-4">
                        {["👍","❤️","🎉","😂"].map((emoji, i) => (
                            <motion.div 
                                key={i}
                                animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl border border-slate-100"
                            >
                                {emoji}
                            </motion.div>
                        ))}
                    </div>
                 </div>
              </motion.div>

           </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (TABS) --- */}
      <section className="py-32 px-6 bg-white border-y border-slate-100">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
               <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6">How it works</h2>
               <p className="text-slate-500 text-xl mb-10">We stripped away the complexity so you can focus on the conversation.</p>
               
               <div className="space-y-4">
                  {tabs.map((tab, idx) => (
                     <div 
                        key={tab.id}
                        onClick={() => setActiveTab(idx)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all border ${activeTab === idx ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-100' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                     >
                        <div className="flex items-center gap-4 mb-2">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {tab.icon}
                           </div>
                           <h3 className={`font-heading text-xl font-bold ${activeTab === idx ? 'text-slate-900' : 'text-slate-500'}`}>{tab.title}</h3>
                        </div>
                        <AnimatePresence>
                           {activeTab === idx && (
                              <motion.p 
                                 initial={{ opacity: 0, height: 0 }}
                                 animate={{ opacity: 1, height: 'auto' }}
                                 exit={{ opacity: 0, height: 0 }}
                                 className="text-slate-600 mt-4 ml-14"
                              >
                                 {tab.content}
                              </motion.p>
                           )}
                        </AnimatePresence>
                     </div>
                  ))}
               </div>
            </div>

            <div className="relative h-[600px] w-full rounded-[2.5rem] bg-slate-50 border border-slate-200 overflow-hidden shadow-2xl">
               <AnimatePresence mode="wait">
                  <motion.img 
                     key={activeTab}
                     src={tabs[activeTab].image}
                     initial={{ opacity: 0, scale: 1.05 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.5 }}
                     className="absolute inset-0 w-full h-full object-cover"
                     alt="Feature preview"
                  />
               </AnimatePresence>
            </div>
         </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 px-6 bg-white border-t border-slate-100">
         <div className="max-w-7xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="text-center mb-16"
            >
               <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-4">Loved by remote teams</h2>
               <p className="text-slate-500 text-xl max-w-2xl mx-auto">Don't just take our word for it. Hear from the people who use Confera every day.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { quote: "Confera completely changed how our engineering team does standups. The zero latency screen sharing is magic.", author: "Sarah Jenkins", role: "CTO at TechCorp" },
                 { quote: "We ditched Zoom for Confera last month. The browser-based approach means our clients never have to install anything.", author: "Michael Chang", role: "Product Manager" },
                 { quote: "The best SFU video conferencing tool I've ever used. The crystal clear 4K rendering is unmatched.", author: "Emily Rodriguez", role: "Lead Designer" }
               ].map((test, idx) => (
                  <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: idx * 0.1 }}
                     key={idx} 
                     className="p-8 rounded-3xl bg-[#fafbfc] border border-slate-200"
                  >
                     <div className="flex text-yellow-400 mb-4">
                        {[1,2,3,4,5].map(star => (
                           <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                     </div>
                     <p className="text-slate-700 text-lg mb-6 leading-relaxed">"{test.quote}"</p>
                     <div>
                        <p className="font-heading font-bold text-slate-900">{test.author}</p>
                        <p className="text-sm text-slate-500">{test.role}</p>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* --- PRICING --- */}
      <section className="py-32 px-6 bg-[#fafbfc]">
         <div className="max-w-5xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-slate-500 mb-20 text-xl"
            >
              No hidden fees. Cancel anytime.
            </motion.p>
            
            <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-md text-left"
               >
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2">Basic</h3>
                  <p className="text-slate-500 mb-6">For casual hangouts</p>
                  <div className="font-heading text-6xl font-extrabold text-slate-900 mb-8">$0</div>
                  <ul className="space-y-5 mb-10">
                     {["Unlimited 1-on-1 meetings", "40 min group limit", "Basic Screen Sharing", "Standard Quality"].map(feat => (
                        <li key={feat} className="flex items-center gap-3 text-slate-700">
                           <CheckCircle size={20} className="text-indigo-500"/> <span className="font-medium text-lg">{feat}</span>
                        </li>
                     ))}
                  </ul>
                  <button className="w-full py-4 rounded-full border-2 border-slate-200 text-slate-900 font-bold hover:border-slate-900 hover:bg-slate-50 transition-colors">Start Free</button>
               </motion.div>
               
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="bg-slate-900 text-white p-12 rounded-[2.5rem] shadow-2xl relative text-left transform md:-translate-y-8 md:scale-105 border border-slate-700"
               >
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[2.5rem] pointer-events-none" />
                  <div className="absolute -top-5 right-10 bg-indigo-500 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg shadow-indigo-500/50">POPULAR</div>
                  
                  <h3 className="font-heading text-2xl font-bold text-white mb-2">Pro</h3>
                  <p className="text-slate-400 mb-6">For power users & teams</p>
                  <div className="font-heading text-6xl font-extrabold text-white mb-8">$12<span className="text-2xl font-normal text-slate-500">/mo</span></div>
                  <ul className="space-y-5 mb-10 relative z-10">
                     {["Unlimited group meetings", "4K Video Quality", "Cloud Recording", "Custom Branding", "Priority Support"].map(feat => (
                        <li key={feat} className="flex items-center gap-3 text-slate-300">
                           <CheckCircle size={20} className="text-indigo-400"/> <span className="font-medium text-lg">{feat}</span>
                        </li>
                     ))}
                  </ul>
                  <button className="w-full py-4 rounded-full bg-indigo-500 text-white font-bold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/30 relative z-10">Get Pro</button>
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- MASSIVE CTA FOOTER --- */}
      <section className="py-32 px-6">
         <div className="max-w-6xl mx-auto rounded-[3rem] p-16 text-center relative overflow-hidden bg-slate-900 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 opacity-90" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
               <h2 className="font-heading text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">Ready to revolutionize your meetings?</h2>
               <p className="text-indigo-100 text-xl mb-12">Join thousands of teams already using Confera to collaborate faster and better.</p>
               
               <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                  <Link to="/auth" style={{ textDecoration: 'none' }}>
                     <button className="px-10 py-5 bg-white text-indigo-900 font-bold text-lg rounded-full hover:bg-indigo-50 transition-all shadow-xl shadow-white/10 hover:scale-105 active:scale-95">
                        Create Your Free Room
                     </button>
                  </Link>
               </div>
               <p className="text-sm text-indigo-200 mt-6">No credit card required. Free forever on Basic.</p>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;