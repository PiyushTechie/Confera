import React from 'react';
import PageLayout from '../components/PageLayout';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <PageLayout
      title="Privacy Policy"
      subtitle="Last updated: December 29, 2025. Learn about how we collect, use, and protect your data."
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
          1. Introduction
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          Welcome to Confera. We respect your privacy and are committed to protecting your personal data.
          This privacy policy will inform you as to how we look after your personal data when you visit our
          website and tell you about your privacy rights and how the law protects you.
        </p>

        {/* Section 2 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-12 mb-5 tracking-tight">
          2. The Data We Collect
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-6">
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
        </p>

        {/* Custom styled list */}
        <ul className="space-y-4 mb-12 text-lg text-slate-600">
          <li className="flex items-start gap-3">
            <span className="mt-2.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600"></span>
            <span><strong className="text-slate-900 font-semibold">Identity Data:</strong> includes first name, last name, username or similar identifier.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600"></span>
            <span><strong className="text-slate-900 font-semibold">Contact Data:</strong> includes email address and telephone numbers.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-2.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600"></span>
            <span><strong className="text-slate-900 font-semibold">Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</span>
          </li>
        </ul>

        {/* Section 3 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-12 mb-5 tracking-tight">
          3. How We Use Your Data
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-6">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>

        {/* Custom styled list */}
        <ul className="space-y-4 mb-12 text-lg text-slate-600">
          {[
            "Where we need to perform the contract we are about to enter into or have entered into with you.",
            "Where it is necessary for our legitimate interests (or those of a third party).",
            "To enable video conferencing features and real-time communication."
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-2.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Section 4 */}
        <h2 className="font-heading text-2xl font-bold text-slate-900 mt-12 mb-5 tracking-tight">
          4. Data Security
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-12">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
          used or accessed in an unauthorized way, altered or disclosed. We use industry-standard encryption for
          video transmission.
        </p>

        <hr className="my-12 border-slate-200" />

        <p className="text-base font-medium text-slate-500 mb-0">
          If you have any questions about this privacy policy, please contact us at <a href="mailto:confera.noreply@gmail.com" className="text-purple-600 hover:text-purple-700 underline underline-offset-4 decoration-purple-200 hover:decoration-purple-600 transition-all">confera.noreply@gmail.com</a>
        </p>
      </div>
    </PageLayout>
  );
}