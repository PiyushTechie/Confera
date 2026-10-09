import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Check, X, ArrowRight, Zap } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    description: 'Perfect for small teams and personal use getting started with video.',
    priceMonthly: '$0',
    priceAnnually: '$0',
    cta: 'Get Started Free',
    popular: false,
    features: [
      { name: 'Up to 40 participants per room', included: true },
      { name: '45-minute meeting limit', included: true },
      { name: 'HD Video (720p)', included: true },
      { name: 'Screen sharing', included: true },
      { name: 'Cloud recording', included: false },
      { name: 'Custom branding', included: false },
      { name: 'SSO Integration', included: false },
      { name: '24/7 Phone Support', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'For growing organizations that need advanced collaboration tools.',
    priceMonthly: '$15',
    priceAnnually: '$12',
    cta: 'Start Pro Trial',
    popular: true,
    features: [
      { name: 'Up to 100 participants per room', included: true },
      { name: 'Unlimited meeting duration', included: true },
      { name: 'Full HD Video (1080p)', included: true },
      { name: 'Screen sharing & annotations', included: true },
      { name: '10GB Cloud storage', included: true },
      { name: 'Custom branding', included: true },
      { name: 'SSO Integration', included: false },
      { name: 'Priority Email Support', included: true },
    ],
  },
  {
    name: 'Enterprise',
    description: 'Dedicated infrastructure and advanced security for large-scale operations.',
    priceMonthly: 'Custom',
    priceAnnually: 'Custom',
    cta: 'Contact Sales',
    popular: false,
    features: [
      { name: 'Up to 10,000 participants', included: true },
      { name: 'Unlimited meeting duration', included: true },
      { name: '4K Ultra HD Video', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Unlimited recording', included: true },
      { name: 'White-labeling', included: true },
      { name: 'SAML & SSO Integration', included: true },
      { name: '24/7 Dedicated Support', included: true },
    ],
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <PageLayout
      title="Simple, transparent pricing"
      subtitle="No hidden fees. No surprise charges. Choose the plan that scales with your team."
      maxWidth="max-w-7xl"
    >
      {/* Billing Toggle */}
      <div className="flex justify-center mt-10 mb-12">
        <div className="relative flex items-center p-1 bg-white border border-slate-200 rounded-full shadow-sm">
          <button
            onClick={() => setAnnual(false)}
            className={`relative z-10 w-36 py-2.5 text-sm font-semibold rounded-full transition-colors duration-200 cursor-pointer outline-none
              ${!annual ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`relative z-10 w-36 py-2.5 text-sm font-semibold rounded-full transition-colors duration-200 cursor-pointer outline-none
              ${annual ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Annual
          </button>
          <div
            className={`absolute top-1 bottom-1 w-36 bg-slate-100 border border-slate-200 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] z-0
              ${annual ? 'translate-x-36' : 'translate-x-0'}`}
          />
          {/* Savings Badge */}
          <div className="absolute -top-4 -right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wider flex items-center gap-1 z-20 transform rotate-12 shadow-sm">
            <Zap size={10} className="fill-green-600" /> Save 20%
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid lg:grid-cols-3 max-w-7xl mx-auto border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {tiers.map((tier, idx) => {
          const isPro = tier.popular;

          return (
            <div
              key={idx}
              className={`flex flex-col p-8 border-r border-slate-200 last:border-r-0
                ${isPro ? 'bg-violet-600' : 'bg-white'}`}
            >
              {isPro && (
                <span className="inline-block self-start mb-4 bg-white/20 text-violet-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Most popular
                </span>
              )}

              {/* Tier name */}
              <div className={`text-xs font-bold uppercase tracking-widest mb-2
                ${isPro ? 'text-violet-300' : 'text-slate-400'}`}>
                {tier.name}
              </div>

              {/* Price */}
              <div className={`text-5xl font-extrabold tracking-tight leading-none
                ${isPro ? 'text-white' : 'text-slate-900'}`}>
                {annual ? tier.priceAnnually : tier.priceMonthly}
              </div>

              {tier.priceMonthly !== 'Custom' ? (
                <>
                  <div className={`text-sm mt-1.5 mb-1 ${isPro ? 'text-violet-300' : 'text-slate-400'}`}>
                    per user / month
                  </div>
                  <div className={`text-xs font-semibold mb-6 min-h-[1rem]
                    ${isPro ? 'text-violet-200' : 'text-green-600'}`}>
                    {annual ? 'Billed annually' : ''}
                  </div>
                </>
              ) : (
                <>
                  <div className={`text-sm mt-1.5 mb-1 ${isPro ? 'text-violet-300' : 'text-slate-400'}`}>
                    Volume pricing
                  </div>
                  <div className="min-h-[1rem] mb-6" />
                </>
              )}

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] mb-7 cursor-pointer border
                  ${isPro
                    ? 'bg-white text-violet-700 border-transparent hover:bg-violet-50'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
              >
                {tier.cta}
              </button>

              {/* Features */}
              <div className={`text-xs font-bold uppercase tracking-widest mb-3
                ${isPro ? 'text-violet-400/60' : 'text-slate-300'}`}>
                What's included
              </div>

              <div className="space-y-0">
                {tier.features.map((feature, fIdx) => (
                  <div
                    key={fIdx}
                    className={`flex items-start gap-2.5 py-2 border-t
                      ${isPro ? 'border-white/10' : 'border-slate-100'}`}
                  >
                    <div className={`mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center
                      ${feature.included
                        ? (isPro ? 'bg-white/20' : 'bg-violet-100')
                        : (isPro ? 'bg-black/15' : 'bg-slate-100 border border-slate-200')}`}
                      style={{ width: 18, height: 18 }}
                    >
                      {feature.included
                        ? <Check size={10} strokeWidth={3} className={isPro ? 'text-white' : 'text-violet-600'} />
                        : <X size={10} strokeWidth={3} className={isPro ? 'text-white/30' : 'text-slate-300'} />
                      }
                    </div>
                    <span className={`text-sm leading-snug
                      ${feature.included
                        ? (isPro ? 'text-violet-100 font-medium' : 'text-slate-700 font-medium')
                        : (isPro ? 'text-white/25 line-through' : 'text-slate-300 line-through')}`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <div className="mt-8 max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1.5">Need something more specific?</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md">
              Custom SLAs, on-premise deployments, and volume discounts for large organizations.
            </p>
          </div>
          <a
            href="/contact"
            className="shrink-0 inline-flex items-center gap-2 bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] text-sm no-underline group"
          >
            Contact Sales
            <ArrowRight size={16} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </PageLayout>
  );
}