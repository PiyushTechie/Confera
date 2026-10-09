import React from 'react';
import PageLayout from '../components/PageLayout';
import { Shield, Lock, Server, FileCheck, KeyRound, EyeOff, CheckCircle2 } from 'lucide-react';

const securityFeatures = [
  {
    icon: <Lock className="w-8 h-8 text-indigo-600" />,
    title: 'End-to-End Encryption',
    description: 'When enabled, media streams are encrypted using WebRTC Insertable Streams before leaving the device. Keys are managed purely by the clients; our servers never see the raw data.',
  },
  {
    icon: <Shield className="w-8 h-8 text-emerald-600" />,
    title: 'In-Transit Security',
    description: 'All traffic, including signaling and REST API requests, is forced over HTTPS and WSS using TLS 1.3. Media is secured using DTLS-SRTP as per WebRTC standards.',
  },
  {
    icon: <Server className="w-8 h-8 text-purple-600" />,
    title: 'Data Residency',
    description: 'Choose where your data lives. We offer geographic isolation in US, EU, and APAC regions to help you comply with local data sovereignty laws.',
  },
  {
    icon: <KeyRound className="w-8 h-8 text-amber-500" />,
    title: 'Access Control',
    description: 'Integrate your existing Identity Provider (IdP) via SAML 2.0 or OpenID Connect. Enforce Multi-Factor Authentication (MFA) across your entire organization.',
  },
  {
    icon: <EyeOff className="w-8 h-8 text-rose-500" />,
    title: 'No Data Mining',
    description: 'We do not sell your data, and we do not use your meeting content to train AI models. You own your data, period.',
  },
  {
    icon: <FileCheck className="w-8 h-8 text-blue-500" />,
    title: 'Compliance',
    description: 'Confera is built to meet the stringent requirements of SOC 2 Type II, HIPAA, and GDPR. Regular third-party penetration testing ensures our defenses stay sharp.',
  }
];

export default function Security() {
  return (
    <PageLayout
      title="Security & Privacy"
      subtitle="Enterprise-grade security built into every layer of our architecture."
      maxWidth="max-w-7xl"
    >
      
      {/* Hero Security Stat */}
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 mb-20 mt-10 shadow-2xl relative overflow-hidden isolate border border-slate-800 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-900 to-slate-900 -z-10" />
        <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-6" strokeWidth={1.5} />
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
          Your privacy is our product.
        </h2>
        <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">
          In a world of data brokers, Confera takes a different approach. We build tools that protect your intellectual property and sensitive conversations. We make money by providing a great service, not by monetizing your data.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {securityFeatures.map((feat, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
              {feat.icon}
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">
              {feat.title}
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              {feat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Certifications Box */}
      <div className="bg-indigo-50/50 rounded-3xl p-10 md:p-16 border border-indigo-100 mb-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="md:w-1/2">
            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-4">Certified Secure</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              Our infrastructure is audited annually by independent security firms. We maintain strict compliance with global privacy regulations to ensure your peace of mind.
            </p>
            <div className="flex gap-4 flex-wrap">
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 font-bold text-sm text-slate-700 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SOC 2 Type II
              </span>
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 font-bold text-sm text-slate-700 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> HIPAA
              </span>
              <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 font-bold text-sm text-slate-700 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> GDPR Compliant
              </span>
            </div>
          </div>
          
          <div className="md:w-1/2 w-full">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4">Report a Vulnerability</h4>
              <p className="text-sm text-slate-600 mb-6">
                We take security reports seriously. If you believe you've found a vulnerability, please reach out to our security team. We run a private bug bounty program.
              </p>
              <a href="mailto:security@confera.com" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm">
                Email Security Team
              </a>
            </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
}
