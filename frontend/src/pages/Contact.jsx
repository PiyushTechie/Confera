import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Mail, MapPin, Phone, MessageSquare, Check, Loader2, ArrowRight } from 'lucide-react';
import server from '../environment.js';

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${server}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <PageLayout
      title="Contact Us"
      subtitle="We'd love to hear from you. Please fill out this form or get in touch using the information below."
      maxWidth="max-w-7xl"
    >
      <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 mt-6">

        <div className="lg:col-span-2 space-y-8 h-full">
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white h-full shadow-2xl relative overflow-hidden isolate border border-slate-800">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full -z-10" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-indigo-600/10 blur-3xl rounded-full -z-10" />

            <h3 className="font-heading text-3xl font-bold mb-10 mt-0 text-white tracking-tight">Get in touch</h3>

            <div className="space-y-8">
              <a href="mailto:confera.noreply@gmail.com" className="group flex items-start gap-5 no-underline outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-purple-400">
                <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-purple-500/20 transition-colors duration-300 shrink-0">
                  <Mail className="w-6 h-6 text-purple-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-lg mb-1 mt-0 text-white">Email</h4>
                  <p className="text-slate-400 group-hover:text-purple-200 transition-colors duration-300 mb-0 break-all">
                    confera.noreply@gmail.com
                  </p>
                </div>
              </a>

              <div className="group flex items-start gap-5">
                <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-purple-500/20 transition-colors duration-300 shrink-0">
                  <Phone className="w-6 h-6 text-purple-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-lg mb-1 mt-0 text-white">Phone</h4>
                  <p className="text-slate-400 group-hover:text-purple-200 transition-colors duration-300 mb-0 break-words">+91 (800) 123-4567</p>
                </div>
              </div>

              <div className="group flex items-start gap-5">
                <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-purple-500/20 transition-colors duration-300 shrink-0">
                  <MapPin className="w-6 h-6 text-purple-300 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-lg mb-1 mt-0 text-white">Office</h4>
                  <p className="text-slate-400 group-hover:text-purple-200 transition-colors duration-300 mb-0 leading-relaxed break-words">
                    Mumbai, Maharashtra<br />
                    India
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 pt-8 border-t border-slate-700/50">
              <div className="flex items-center gap-3 text-slate-300 font-medium">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <span>Support available 24/7</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="firstName" className="block font-heading text-sm font-bold text-slate-900 mb-2">First name</label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 outline-none transition-all text-slate-900 placeholder-slate-400"
                  placeholder="John"
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="lastName" className="block font-heading text-sm font-bold text-slate-900 mb-2">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 outline-none transition-all text-slate-900 placeholder-slate-400"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block font-heading text-sm font-bold text-slate-900 mb-2">Email address</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 outline-none transition-all text-slate-900 placeholder-slate-400"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block font-heading text-sm font-bold text-slate-900 mb-2">Subject</label>
              <div className="relative">
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 outline-none transition-all bg-white text-slate-900 appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a topic</option>
                  <option value="Sales Inquiry">Sales Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing Question">Billing Question</option>
                  <option value="Other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block font-heading text-sm font-bold text-slate-900 mb-2">Message</label>
              <textarea
                id="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:ring-4 focus:ring-purple-600/10 focus:border-purple-400 outline-none transition-all resize-none text-slate-900 placeholder-slate-400"
                placeholder="How can we help you?"
                required
              />
            </div>

            {status === 'error' && (
              <div className="text-red-500 text-sm font-bold px-2">
                {errorMessage}
              </div>
            )}

            {status === 'success' && (
              <div className="flex items-center gap-3 text-emerald-700 text-sm font-bold bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                <div className="bg-emerald-100 p-1 rounded-full shrink-0">
                  <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                </div>
                Message sent successfully! We'll get back to you soon.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold py-4 px-8 rounded-full shadow-md transition-all cursor-pointer outline-none focus:ring-4 focus:ring-slate-900/20 active:scale-95 group"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <ArrowRight size={18} strokeWidth={2.5} className="text-purple-400 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </PageLayout>
  );
}