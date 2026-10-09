import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { Check } from 'lucide-react';

const Toggle = ({ enabled, setEnabled, disabled }) => {
  return (
    <button
      type="button"
      className={`${enabled ? 'bg-purple-600' : 'bg-slate-200'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'} 
      relative inline-flex h-7 w-12 items-center flex-shrink-0 rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-purple-600/20`}
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && setEnabled(!enabled)}
      disabled={disabled}
    >
      <span
        aria-hidden="true"
        className={`${enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none flex h-6 w-6 items-center justify-center transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ease-in-out`}
      >
        <Check className={`w-3.5 h-3.5 text-purple-600 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
      </span>
    </button>
  );
};

export default function CookieSettings() {
  const [performance, setPerformance] = useState(true);
  const [functional, setFunctional] = useState(false);
  const [targeting, setTargeting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <PageLayout
      title="Cookie Settings"
      subtitle="Manage your cookie preferences. We use cookies to improve your experience and for analytics."
    >
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-16 max-w-4xl mx-auto mt-6">

        <div className="flex flex-col">

          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-10 border-b border-slate-100">
            <div className="flex-1 pr-0 sm:pr-8">
              <h3 className="font-heading text-xl font-bold text-slate-900 mb-2 mt-0 tracking-tight">Strictly Necessary Cookies</h3>
              <p className="text-slate-600 text-base leading-relaxed mb-0">
                These cookies are necessary for the website to function and cannot be switched off in our systems.
                They are usually only set in response to actions made by you which amount to a request for services,
                such as setting your privacy preferences, logging in or filling in forms.
              </p>
            </div>
            <div className="pt-1 shrink-0">
              <Toggle enabled={true} setEnabled={() => { }} disabled={true} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 py-10 border-b border-slate-100">
            <div className="flex-1 pr-0 sm:pr-8">
              <h3 className="font-heading text-xl font-bold text-slate-900 mb-2 mt-0 tracking-tight">Performance Cookies</h3>
              <p className="text-slate-600 text-base leading-relaxed mb-0">
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                They help us to know which pages are the most and least popular and see how visitors move around the site.
              </p>
            </div>
            <div className="pt-1 shrink-0">
              <Toggle enabled={performance} setEnabled={setPerformance} disabled={false} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 py-10 border-b border-slate-100">
            <div className="flex-1 pr-0 sm:pr-8">
              <h3 className="font-heading text-xl font-bold text-slate-900 mb-2 mt-0 tracking-tight">Functional Cookies</h3>
              <p className="text-slate-600 text-base leading-relaxed mb-0">
                These cookies enable the website to provide enhanced functionality and personalisation.
                They may be set by us or by third party providers whose services we have added to our pages.
              </p>
            </div>
            <div className="pt-1 shrink-0">
              <Toggle enabled={functional} setEnabled={setFunctional} disabled={false} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 py-10">
            <div className="flex-1 pr-0 sm:pr-8">
              <h3 className="font-heading text-xl font-bold text-slate-900 mb-2 mt-0 tracking-tight">Targeting Cookies</h3>
              <p className="text-slate-600 text-base leading-relaxed mb-0">
                These cookies may be set through our site by our advertising partners.
                They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
              </p>
            </div>
            <div className="pt-1 shrink-0">
              <Toggle enabled={targeting} setEnabled={setTargeting} disabled={false} />
            </div>
          </div>

        </div>

        <div className="mt-6 pt-8 flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-200">
          {isSaved && (
            <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1.5 animate-pulse">
              <Check size={16} /> Preferences saved successfully
            </span>
          )}
          <button
            onClick={handleSave}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-10 rounded-full shadow-md transition-all active:scale-95 cursor-pointer outline-none focus:ring-4 focus:ring-slate-900/20"
          >
            Save Preferences
          </button>
        </div>

      </div>
    </PageLayout>
  );
}