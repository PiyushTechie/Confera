import React from 'react';
import PageLayout from '../components/PageLayout';
import { MessageCircle, Calendar, Github, Twitter, ArrowRight } from 'lucide-react';

const communityLinks = [
  {
    icon: <MessageCircle className="w-7 h-7 text-[#5865F2]" />,
    title: 'Discord Server',
    description: 'Join our official Discord server to chat with other developers, share your projects, and get real-time help from the community.',
    buttonText: 'Join Discord',
    link: '#',
    hoverBorder: 'group-hover:border-[#5865F2]/40',
    hoverShadow: 'group-hover:shadow-[0_8px_30px_rgb(88,101,242,0.15)]',
    iconBg: 'bg-[#5865F2]/10'
  },
  {
    icon: <Github className="w-7 h-7 text-slate-800" />,
    title: 'GitHub Discussions',
    description: 'Participate in deeper technical discussions, request features, and report bugs on our official GitHub repository.',
    buttonText: 'View GitHub',
    link: '#',
    hoverBorder: 'group-hover:border-slate-400',
    hoverShadow: 'group-hover:shadow-[0_8px_30px_rgb(15,23,42,0.08)]',
    iconBg: 'bg-slate-100'
  },
  {
    icon: <Twitter className="w-7 h-7 text-[#1DA1F2]" />,
    title: 'Twitter Community',
    description: 'Follow us for the latest updates, feature announcements, and community highlights. Tag us to share your setup!',
    buttonText: 'Follow @Confera',
    link: '#',
    hoverBorder: 'group-hover:border-[#1DA1F2]/40',
    hoverShadow: 'group-hover:shadow-[0_8px_30px_rgb(29,161,242,0.15)]',
    iconBg: 'bg-[#1DA1F2]/10'
  },
  {
    icon: <Calendar className="w-7 h-7 text-purple-600" />,
    title: 'Community Events',
    description: 'Attend our monthly town halls, technical deep dives, and virtual meetups hosted by the Confera team.',
    buttonText: 'View Schedule',
    link: '#',
    hoverBorder: 'group-hover:border-purple-400',
    hoverShadow: 'group-hover:shadow-[0_8px_30px_rgb(147,51,234,0.15)]',
    iconBg: 'bg-purple-50'
  }
];

export default function Community() {
  return (
    <PageLayout
      title="Confera Community"
      subtitle="Connect, collaborate, and build with thousands of other developers and creators."
    >
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mt-10">
        {communityLinks.map((item, index) => (
          <a
            key={index}
            href={item.link}
            className={`group flex flex-col rounded-[2rem] p-8 sm:p-10 bg-white border border-slate-200 transition-all duration-500 hover:-translate-y-1 ${item.hoverBorder} ${item.hoverShadow} outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer no-underline`}
          >
            <div className={`${item.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110`}>
              {item.icon}
            </div>

            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-3">
              {item.title}
            </h3>

            <p className="text-slate-600 leading-relaxed mb-10 flex-grow">
              {item.description}
            </p>

            <div className="flex items-center gap-2 font-semibold text-slate-900 group-hover:text-purple-600 transition-colors duration-300 mt-auto">
              {item.buttonText}
              <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1.5" strokeWidth={2.5} />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-24 rounded-[2.5rem] p-10 md:p-20 text-center relative overflow-hidden isolate shadow-2xl border border-slate-800">
        <div className="absolute inset-0 -z-20 bg-slate-900" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-900 to-slate-900" />
        <div className="absolute -top-40 -right-40 -z-10 w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -left-40 -z-10 w-96 h-96 bg-purple-600/20 blur-3xl rounded-full" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Contribute to Confera
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mb-10 leading-relaxed">
            We believe in the power of open source and community-driven development.
            Whether you're fixing a bug, improving documentation, or building a new integration,
            your contributions are always welcome.
          </p>
          <button className="bg-white text-slate-900 font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all duration-300 active:scale-95 cursor-pointer">
            Read Contribution Guide
          </button>
        </div>
      </div>
    </PageLayout>
  );
}