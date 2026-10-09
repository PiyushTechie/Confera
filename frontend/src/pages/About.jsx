import React from 'react';
import PageLayout from '../components/PageLayout';
import { Users, Target, Globe, Shield } from 'lucide-react';

const stats = [
  { label: 'Active Users', value: '2M+' },
  { label: 'Countries', value: '150+' },
  { label: 'Meetings Hosted', value: '50M+' },
  { label: 'Uptime', value: '99.99%' },
];

const values = [
  {
    icon: <Users className="w-6 h-6 text-indigo-600" />,
    title: 'User-Centric',
    description: 'We build features that our users actually need, prioritizing ease of use and accessibility above all else.',
  },
  {
    icon: <Shield className="w-6 h-6 text-indigo-600" />,
    title: 'Security First',
    description: 'Enterprise-grade security is built into our core, ensuring your communications remain private and protected.',
  },
  {
    icon: <Target className="w-6 h-6 text-indigo-600" />,
    title: 'Innovation',
    description: 'We continuously push the boundaries of what is possible in real-time video communication technology.',
  },
  {
    icon: <Globe className="w-6 h-6 text-indigo-600" />,
    title: 'Global Scale',
    description: 'Our distributed infrastructure ensures low latency and high quality video, no matter where you are.',
  },
];

export default function About() {
  return (
    <PageLayout
      title="About Confera"
      subtitle="We're on a mission to make remote collaboration feel as natural as being in the same room."
      maxWidth="max-w-7xl"
    >
      <div className="space-y-16">

        <section className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            At Confera, we believe that distance should never be a barrier to meaningful collaboration.
            Our mission is to provide a reliable, frictionless video conferencing platform that empowers teams
            to work together efficiently, whether they are across the office or across the globe.
          </p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 mt-0">{value.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-0">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
