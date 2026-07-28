import React from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { LanguageCode } from '../types';
import { getLocalizedTermsOfService } from '../utils/localizedContent';

interface TermsOfServiceProps {
  onBack: () => void;
  language: LanguageCode;
}

export default function TermsOfService({ onBack, language }: TermsOfServiceProps) {
  const content = getLocalizedTermsOfService(language);

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 border-b border-gray-50 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{content.title}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-6">
          <div className="w-16 h-16 bg-purple-50 rounded-2.5xl flex items-center justify-center mb-4 border border-purple-100">
            <Scale className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">{content.officialAgreement}</p>
          <h3 className="text-2.5xl font-black text-gray-900 leading-none">{content.appName}</h3>
          <p className="text-xs text-gray-400 mt-2 font-mono">{content.lastUpdated}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 text-gray-600">
          <div className="p-5 bg-amber-50/50 border border-amber-200/50 rounded-2.5rem text-amber-900 text-xs leading-relaxed">
            <strong className="block font-black uppercase tracking-wider mb-1">{content.warningHeader}</strong>
            {content.warningBody}
          </div>

          {/* Section 1: Platform Overview */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              {content.s1Title}
            </h4>
            <p className="text-sm leading-relaxed">
              {content.s1Body}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-gray-700">
              {content.s1Points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </section>

          {/* Section 2: Account Security */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              {content.s2Title}
            </h4>
            <p className="text-sm leading-relaxed">
              {content.s2Body}
            </p>
            <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
              {content.s2Note}
            </p>
          </section>

          {/* Section 3: Booking & Delivery Terms */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              {content.s3Title}
            </h4>
            <p className="text-sm leading-relaxed">
              {content.s3Body}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-500">
              {content.s3Points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </section>

          {/* Section 4: Refund and Cancel Policies */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-gray-150 space-y-4">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span>💳 {content.s4Title}</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-sans tracking-normal font-extrabold normal-case">Verified</span>
            </h4>
            <div className="text-sm leading-relaxed space-y-3 font-medium text-gray-700">
              <p>{content.s4Body}</p>
              <ul className="list-disc pl-5 space-y-2 mt-2 text-xs">
                {content.s4Points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 5: Franchise and Delivery Rider Terms */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              {content.s5Title}
            </h4>
            <p className="text-sm leading-relaxed">
              {content.s5Body}
            </p>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="p-6 bg-red-50/20 border border-red-100 rounded-[2rem] space-y-2">
            <h4 className="font-black text-red-950 uppercase text-xs tracking-widest flex items-center gap-2">
              {content.s6Title}
            </h4>
            <p className="text-xs text-red-900 leading-relaxed font-medium">
              {content.s6Body}
            </p>
          </section>

          {/* Contact Details */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
            <p>{content.copyright}</p>
            <p className="text-right">{content.support}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
