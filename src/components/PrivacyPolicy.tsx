import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { LanguageCode } from '../types';
import { getLocalizedPrivacyPolicy } from '../utils/localizedContent';

interface PrivacyPolicyProps {
  onBack: () => void;
  language: LanguageCode;
}

export default function PrivacyPolicy({ onBack, language }: PrivacyPolicyProps) {
  const content = getLocalizedPrivacyPolicy(language);
  
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
          <div className="w-16 h-16 bg-blue-50 rounded-2.5xl flex items-center justify-center mb-4 border border-blue-100">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{content.subtitle}</p>
          <h3 className="text-2.5xl font-black text-gray-900 leading-none">{content.appName}</h3>
          <p className="text-xs text-gray-400 mt-2 font-mono">{content.lastUpdated}</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 text-gray-600">
          <div className="p-5 bg-blue-50/50 border border-blue-200/50 rounded-2.5rem text-blue-900 text-xs leading-relaxed">
            <strong className="block font-black uppercase tracking-wider mb-1">{content.bannerHeader}</strong>
            {content.bannerBody}
          </div>

          {/* Section 1: Information We Collect */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              {content.s1Title}
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-xs text-gray-700">
              {content.s1Points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </section>

          {/* Section 2: How We Use Data */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              {content.s2Title}
            </h4>
            <p className="text-sm leading-relaxed text-gray-500">
              {content.s2Body}
            </p>
          </section>

          {/* Section 3: Data Protection & Sharing */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              {content.s3Title}
            </h4>
            <p className="text-sm leading-relaxed">
              {content.s3Body}
            </p>
          </section>

          {/* Section 4: Data Security and Local Persistence */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              {content.s4Title}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {content.s4Body}
            </p>
          </section>

          {/* Section 5: Deletion Requests */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              {content.s5Title}
            </h4>
            <p className="text-sm leading-relaxed">
              {content.s5Body}
            </p>
          </section>

          {/* Support and Contact Details */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
            <p>{content.copyright}</p>
            <p className="text-right">{content.support}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
