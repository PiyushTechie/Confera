import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Copy, Check } from 'lucide-react';

const sidebarLinks = [
  {
    title: 'Getting Started',
    links: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quick-start', label: 'Quick Start' },
      { id: 'installation', label: 'Installation' },
    ]
  },
  {
    title: 'Core Concepts',
    links: [
      { id: 'rooms-meetings', label: 'Rooms & Meetings' },
      { id: 'participants', label: 'Participants' },
      { id: 'audio-video', label: 'Audio & Video Tracks' },
    ]
  },
  {
    title: 'Advanced Features',
    links: [
      { id: 'recording', label: 'Recording' },
      { id: 'webhooks', label: 'Webhooks' },
      { id: 'encryption', label: 'End-to-End Encryption' },
    ]
  }
];

const CodeBlock = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 rounded-2xl overflow-hidden bg-[#0a0f1c] border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-[#0f172a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
          </div>
          {filename && <span className="ml-2 text-xs font-medium text-slate-400 font-mono">{filename}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
          title="Copy code"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-slate-300 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('introduction');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-140px 0px -70% 0px', threshold: 0 }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      <Navbar />

      <div className="flex-grow flex w-full max-w-[90rem] mx-auto pt-32 px-4 sm:px-6 lg:px-8">

        <aside className="w-64 shrink-0 hidden lg:block h-[calc(100vh-8rem)] sticky top-32 overflow-y-auto pb-10 pr-8">
          <nav className="space-y-8">
            {sidebarLinks.map((section, idx) => (
              <div key={idx}>
                <h5 className="font-heading font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">
                  {section.title}
                </h5>
                <ul className="space-y-1 border-l border-slate-200/80 ml-1">
                  {section.links.map((link) => {
                    const isActive = activeSection === link.id;
                    return (
                      <li key={link.id}>
                        <button
                          onClick={() => scrollToSection(link.id)}
                          className={`block w-full text-left text-sm font-medium py-1.5 pl-4 -ml-[1px] border-l-2 transition-colors cursor-pointer outline-none
                            ${isActive
                              ? 'border-purple-600 text-purple-600'
                              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                            }`}
                        >
                          {link.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex-grow max-w-3xl pb-32 lg:pl-12 lg:border-l lg:border-slate-200/60">
          <article className="prose-custom">
            <section id="introduction" className="mb-16 scroll-mt-36">
              <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase mb-3">Getting Started</p>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                Introduction
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Welcome to the Confera Documentation. Here you will find comprehensive guides and documentation to help you start working with Confera as quickly as possible, as well as support if you get stuck.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                Confera is a modern, developer-friendly video conferencing platform. We provide a scalable infrastructure for building real-time audio, video, and data applications utilizing advanced WebRTC SFU architecture.
              </p>
            </section>

            <section id="quick-start" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Quick Start
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Ready to jump right in? The quickest way to get started is by including our pre-built UI components via your terminal.
              </p>
              <CodeBlock filename="Terminal" language="bash" code="npm install @confera/react-sdk" />
              <p className="text-slate-600 leading-relaxed mb-6 mt-8">
                Once installed, import and use the <code className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200">{"<VideoRoom />"}</code> component directly in your application:
              </p>
              <CodeBlock
                filename="App.jsx"
                language="jsx"
                code={`import { VideoRoom } from '@confera/react-sdk';

export default function App() {
  return (
    <VideoRoom 
      token="YOUR_ACCESS_TOKEN" 
      roomName="daily-standup" 
      theme="dark"
    />
  );
}`}
              />
            </section>

            <section id="installation" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Installation
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                If you are building a custom UI, you will want to install our Core SDK instead of the pre-built React components. This gives you full control over the WebRTC connections and layout.
              </p>
              <CodeBlock filename="Terminal" language="bash" code="npm install @confera/core-sdk" />
            </section>

            <section id="rooms-meetings" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase mb-3">Core Concepts</p>
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Rooms & Meetings
              </h2>
              <p className="text-slate-600 leading-relaxed">
                A Room is the fundamental building block of Confera. It represents a virtual space where Participants can connect, publish Tracks (audio/video), and subscribe to the Tracks of others. Rooms can be configured to be public, private, or gated behind specific authentication tokens.
              </p>
            </section>

            <section id="participants" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Participants
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Any client connected to a Room is a Participant. Participants can have different roles (e.g., Host, Guest, Presenter) which dictate their permissions within the room, such as the ability to mute others, kick users, or initiate screen sharing.
              </p>
            </section>

            <section id="audio-video" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Audio & Video Tracks
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Media in Confera is handled via Tracks. A Participant can publish multiple Tracks simultaneously—for example, a camera video track, a microphone audio track, and a high-resolution screen share video track. Our SFU ensures these tracks are routed efficiently to all subscribers.
              </p>
            </section>

            <section id="recording" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <p className="text-sm font-semibold text-purple-600 tracking-wide uppercase mb-3">Advanced Features</p>
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Recording
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Confera offers cloud-based composite recording. You can trigger a recording via our REST API. The recording engine joins your room as a hidden participant, captures the specified layout, and outputs a high-quality MP4 file directly to your configured AWS S3 bucket.
              </p>
            </section>

            <section id="webhooks" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                Webhooks
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Listen to real-time events happening inside your rooms. Configure webhooks in your Confera dashboard to receive HTTP POST payloads when a room starts, when a participant joins or leaves, or when a recording finishes processing.
              </p>
            </section>

            <section id="encryption" className="mb-16 scroll-mt-36 border-t border-slate-200 pt-10">
              <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight mb-6">
                End-to-End Encryption
              </h2>
              <p className="text-slate-600 leading-relaxed">
                For highly sensitive meetings, Confera supports WebRTC Insertable Streams for true End-to-End Encryption (E2EE). When enabled, media packets are encrypted on the sender's client and can only be decrypted by the recipient's client. The Confera servers routing the data cannot access the underlying media.
              </p>
            </section>

          </article>
        </main>
      </div>

      <Footer />
    </div>
  );
}