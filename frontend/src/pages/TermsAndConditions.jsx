import React from 'react';
import PageLayout from '../components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <PageLayout
      title="Terms of Service"
      subtitle="Last updated: December 29, 2025. Please read these terms carefully before using our services."
    >
      {/* Centered, max-width container for optimal reading length */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-16 max-w-4xl mx-auto">

        {/* Upgraded Back Link with Hover Animation */}
        <div className="mb-12">
          <Link to="/" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors no-underline">
            <ArrowLeft size={16} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        {/* Section 1 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-0 mb-5 tracking-tight">
          1. Agreement to Terms
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          By accessing our website and using our video conferencing services, you agree to be bound by these Terms of Service
          and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of
          these terms, you are prohibited from accessing this site.
        </p>

        {/* Section 2 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-12 mb-5 tracking-tight">
          2. Use License
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-6">
          Permission is granted to temporarily download one copy of the materials on Confera's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>

        {/* Custom styled list instead of default bullets */}
        <ul className="space-y-4 mb-12 text-lg text-slate-600">
          {[
            "Modify or copy the materials;",
            "Use the materials for any commercial purpose or for any public display;",
            "Attempt to reverse engineer any software contained on Confera's website;",
            "Remove any copyright or other proprietary notations from the materials."
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-2.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Section 3 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-12 mb-5 tracking-tight">
          3. User Accounts
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          When you create an account with us, you must provide us information that is accurate, complete, and current at all times.
          Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>

        {/* Section 4 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-12 mb-5 tracking-tight">
          4. Acceptable Use
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          You agree not to use the Service to transmit any content that is unlawful, offensive, upsetting, intended to disgust,
          threatening, libelous, defamatory, obscene or otherwise objectionable.
        </p>

        <hr className="my-12 border-slate-200" />

        <p className="text-base font-medium text-slate-500 mb-0">
          Contact us at <a href="mailto:confera.noreply@gmail.com" className="text-purple-600 hover:text-purple-700 underline underline-offset-4 decoration-purple-200 hover:decoration-purple-600 transition-all">confera.noreply@gmail.com</a> for any questions regarding these terms.
        </p>
      </div>
    </PageLayout>
  );
}