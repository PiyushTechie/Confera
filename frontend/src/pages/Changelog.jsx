import React from 'react';
import PageLayout from '../components/PageLayout';

const changelogData = [
  {
    version: 'v2.4.0',
    date: 'February 12, 2026',
    tag: 'Feature',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    title: 'Advanced Polling & Q&A Module',
    content: (
      <>
        <p>We're thrilled to introduce the highly requested Polling and Q&A module. Hosts can now engage their audience with real-time interactive tools directly within the meeting interface.</p>
        <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
          <li><strong>Live Polling:</strong> Create multiple-choice polls on the fly. Results can be shared instantly or hidden until the end.</li>
          <li><strong>Q&A Moderation:</strong> Attendees can submit questions, upvote favorites, and hosts can mark them as answered or dismiss them.</li>
          <li><strong>Analytics Export:</strong> Post-meeting reports now include all poll data and Q&A transcripts in CSV format.</li>
        </ul>
      </>
    )
  },
  {
    version: 'v2.3.2',
    date: 'January 28, 2026',
    tag: 'Improvement',
    tagColor: 'bg-blue-100 text-blue-700 border-blue-200',
    title: 'SFU Routing Optimization',
    content: (
      <>
        <p>This release focuses entirely on under-the-hood performance. We've rolled out a major update to our WebRTC Selective Forwarding Unit (SFU) logic.</p>
        <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-600">
          <li>Reduced average glass-to-glass latency by 15% across European regions.</li>
          <li>Improved dynamic bitrate allocation for users on fluctuating 4G/5G connections.</li>
          <li>Fixed a bug where screen sharing could briefly artifact when toggling full-screen mode.</li>
        </ul>
      </>
    )
  },
  {
    version: 'v2.3.0',
    date: 'January 10, 2026',
    tag: 'Feature',
    tagColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    title: 'Collaborative Whiteboard Integration',
    content: (
      <>
        <p>Brainstorming just got easier. We've integrated a powerful, infinite-canvas collaborative whiteboard natively into the meeting room.</p>
        <p className="mt-4">You no longer need to share your screen and use a third-party app. Simply click the "Whiteboard" icon in the toolbar to start drawing, adding sticky notes, and wireframing together in real-time.</p>
      </>
    )
  },
  {
    version: 'v2.2.5',
    date: 'December 18, 2025',
    tag: 'Bug Fix',
    tagColor: 'bg-rose-100 text-rose-700 border-rose-200',
    title: 'Audio device selection & UI fixes',
    content: (
      <>
        <ul className="list-disc pl-5 space-y-2 text-slate-600">
          <li>Fixed an issue where Bluetooth headphones (specifically AirPods) would sometimes not be recognized when joining a meeting mid-call.</li>
          <li>Resolved a UI glitch where the participant list would not scroll correctly on Safari 17.</li>
          <li>Security patch for a minor vulnerability in the WebSocket handshake (thanks to our Bug Bounty program!).</li>
        </ul>
      </>
    )
  }
];

export default function Changelog() {
  return (
    <PageLayout
      title="Changelog"
      subtitle="New updates and improvements to Confera."
    >
      <div className="max-w-3xl mx-auto mt-10">

        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-0 md:space-y-16 space-y-10 pb-20">

          {changelogData.map((item, index) => (
            <div key={index} className="relative pl-8 md:pl-12">

              <div className="absolute top-1.5 -left-[9px] w-4 h-4 rounded-full bg-white border-4 border-purple-600 shadow-sm z-10" />

              <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="font-heading text-2xl font-bold text-slate-900 m-0">
                      {item.version}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium text-sm">
                    {item.date}
                  </span>
                </div>

                <h3 className="font-heading text-xl font-bold text-slate-900 mb-4">
                  {item.title}
                </h3>

                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
                  {item.content}
                </div>

              </div>
            </div>
          ))}

        </div>

      </div>
    </PageLayout>
  );
}
