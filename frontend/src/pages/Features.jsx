import React from 'react';
import PageLayout from '../components/PageLayout';
import { Video, Shield, Zap, MessageSquare, LayoutTemplate, Users, Maximize, Lock, ArrowRight, Check } from 'lucide-react';

const features = [
  {
    icon: <Video className="w-8 h-8 text-purple-600" />,
    title: 'Crystal Clear 4K Video',
    description: 'Experience meetings in stunning ultra-high definition. Our intelligent codec adapts to your bandwidth in real-time, ensuring zero lag even on spotty connections.',
    color: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  {
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    title: 'Zero-Latency Architecture',
    description: 'Built from the ground up on our custom WebRTC Selective Forwarding Unit (SFU). Audio and video reach your peers in less than 50 milliseconds.',
    color: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  {
    icon: <Shield className="w-8 h-8 text-emerald-600" />,
    title: 'True End-to-End Encryption',
    description: 'Your meetings are secured with AES-256 GCM encryption. Using WebRTC Insertable Streams, even our own servers cannot decrypt your media streams.',
    color: 'bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
    title: 'Rich Real-time Chat',
    description: 'Seamless text collaboration alongside your video. Support for direct messages, file sharing, rich formatting, and persistent chat histories.',
    color: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  {
    icon: <LayoutTemplate className="w-8 h-8 text-pink-600" />,
    title: 'Dynamic Smart Layouts',
    description: 'Our UI automatically shifts based on who is speaking, how many participants there are, and what content is being shared on screen.',
    color: 'bg-pink-100',
    borderColor: 'border-pink-200'
  },
  {
    icon: <Users className="w-8 h-8 text-indigo-600" />,
    title: 'Massive Scale',
    description: 'Host intimate 1-on-1s or broadcast to 10,000+ viewers simultaneously without breaking a sweat or requiring external streaming services.',
    color: 'bg-indigo-100',
    borderColor: 'border-indigo-200'
  }
];

export default function Features() {
  return (
    <PageLayout
      title="Powerful Features"
      subtitle="Everything you need to host, manage, and scale professional video experiences."
      maxWidth="max-w-7xl"
    >
      <div className="text-center max-w-3xl mx-auto mb-20 mt-10">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
          Engineered for performance. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Designed for humans.</span>
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          Confera isn't just another wrapper around an old video API. We built our entire infrastructure from scratch to guarantee sub-second latencies and uncompromised security.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-[0_8px_30px_rgb(147,51,234,0.08)] hover:border-purple-200 transition-all duration-500 overflow-hidden"
          >
            <div className={`absolute -right-20 -top-20 w-40 h-40 ${feature.color} rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />

            <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border ${feature.borderColor}`}>
              {feature.icon}
            </div>

            <h3 className="font-heading text-xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-purple-600 transition-colors duration-300">
              {feature.title}
            </h3>
            <p className="text-slate-600 leading-relaxed mb-0">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-32 mb-16">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 lg:p-20 overflow-hidden relative isolate">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/30 blur-[100px] rounded-full -z-10" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600/30 blur-[100px] rounded-full -z-10" />

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block py-1.5 px-3 rounded-full bg-purple-500/20 text-purple-300 text-sm font-bold tracking-wide uppercase mb-6 border border-purple-500/30">
                Developer First
              </span>
              <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                Integrate video in minutes, not months.
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-10">
                Use our pre-built UI components for a plug-and-play experience, or drop down to our Core SDK to build completely custom video layouts. You own the entire experience.
              </p>

              <ul className="space-y-4 mb-10">
                {['React & Next.js native SDKs', 'Fully typed TypeScript APIs', 'Custom Webhooks & Event routing'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-medium">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-purple-300" strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <a href="/documentation" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold py-4 px-8 rounded-full hover:bg-slate-50 transition-colors duration-300 group">
                Read Documentation
                <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 rounded-3xl blur-2xl transform rotate-3" />
              <div className="relative bg-[#0a0f1c] border border-slate-700/50 rounded-3xl shadow-2xl p-6 font-mono text-sm">
                <div className="flex gap-2 mb-4 border-b border-slate-800 pb-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-slate-300 space-y-2">
                  <p><span className="text-purple-400">import</span> {'{ VideoRoom }'} <span className="text-purple-400">from</span> <span className="text-emerald-400">'@confera/react'</span>;</p>
                  <br />
                  <p><span className="text-purple-400">export default function</span> <span className="text-blue-400">App</span>() {'{'}</p>
                  <p className="pl-4"><span className="text-purple-400">return</span> (</p>
                  <p className="pl-8">{'<VideoRoom'}</p>
                  <p className="pl-12"><span className="text-indigo-300">token</span>=<span className="text-emerald-400">"eyJhbGciOiJIUz..."</span></p>
                  <p className="pl-12"><span className="text-indigo-300">theme</span>=<span className="text-emerald-400">"dark"</span></p>
                  <p className="pl-12"><span className="text-indigo-300">onLeave</span>={'{() => router.push("/")}'}</p>
                  <p className="pl-8">{'/>'}</p>
                  <p className="pl-4">);</p>
                  <p>{'}'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
}


