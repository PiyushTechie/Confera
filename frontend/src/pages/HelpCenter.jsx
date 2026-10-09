import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Search, ChevronDown, MonitorPlay, Settings, CreditCard, Shield } from 'lucide-react';

const categories = [
  { icon: <MonitorPlay className="w-7 h-7 text-purple-600" />, title: 'Getting Started', desc: 'Setting up your first meeting.' },
  { icon: <Settings className="w-7 h-7 text-purple-600" />, title: 'Account Settings', desc: 'Manage your profile and preferences.' },
  { icon: <CreditCard className="w-7 h-7 text-purple-600" />, title: 'Billing & Subscriptions', desc: 'Invoices, plans, and payments.' },
  { icon: <Shield className="w-7 h-7 text-purple-600" />, title: 'Security & Privacy', desc: 'Learn how we keep you safe.' },
];

const faqs = [
  {
    question: 'How do I invite participants to my meeting?',
    answer: 'Once you start a meeting or schedule one, you will be provided with a unique meeting URL. You can copy this link and share it via email, chat, or calendar invite with anyone you want to join.'
  },
  {
    question: 'Do guests need an account to join?',
    answer: 'No, guests can join any Confera meeting directly from their browser without needing to create an account or download any software. They just need the meeting link.'
  },
  {
    question: 'How many people can join a single meeting?',
    answer: 'The number of participants depends on your plan. The free tier supports up to 100 participants per meeting, while enterprise plans can support up to 10,000 view-only attendees.'
  },
  {
    question: 'Are my meetings encrypted?',
    answer: 'Yes, all Confera meetings are secured with industry-standard DTLS-SRTP encryption for audio and video streams, ensuring your communications remain private.'
  }
];

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <PageLayout
      title="How can we help?"
      subtitle="Search our knowledge base or browse categories below to find the answers you need."
    >

      <div className="relative max-w-2xl mx-auto -mt-4 mb-20 group">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full pl-16 pr-4 py-4 rounded-full border-2 border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 transition-all outline-none text-lg text-slate-900 placeholder-slate-400"
          placeholder="Search for articles, tutorials..."
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button className="bg-slate-900 text-white px-8 py-2.5 rounded-full font-bold hover:bg-slate-800 shadow-md transition-colors cursor-pointer">
            Search
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <h3 className="font-heading text-2xl font-bold text-slate-900 mb-6 mt-0">Browse by Category</h3>
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="group bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-start gap-5 hover:border-purple-300 hover:shadow-[0_8px_30px_rgb(147,51,234,0.08)] transition-all duration-500 cursor-pointer no-underline"
            >
              <div className="bg-purple-50 p-4 rounded-2xl group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-500 shrink-0">
                {category.icon}
              </div>
              <div className="mt-1">
                <h4 className="font-heading font-bold text-xl text-slate-900 mb-2 mt-0 group-hover:text-purple-600 transition-colors duration-300">
                  {category.title}
                </h4>
                <p className="text-slate-600 mb-0 leading-relaxed text-sm">
                  {category.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-2xl font-bold text-slate-900 mb-6 mt-0">Frequently Asked Questions</h3>
        <div className="space-y-4 mb-10">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-colors duration-300 overflow-hidden shadow-sm ${isOpen ? 'border-purple-300' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between focus:outline-none cursor-pointer bg-transparent"
                >
                  <span className="font-heading font-bold text-lg text-slate-900 text-left pr-4">
                    {faq.question}
                  </span>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <div
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-slate-600 mb-0 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </PageLayout>
  );
}