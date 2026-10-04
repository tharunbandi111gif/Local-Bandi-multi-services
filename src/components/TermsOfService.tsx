import React, { useState } from 'react';
import { ArrowLeft, Scale, ExternalLink, Check, Copy, FileText, ChevronRight } from 'lucide-react';
import { LanguageCode } from '../types';
import { getLocalizedTermsOfService } from '../utils/localizedContent';
import { APP_LEGAL_POLICIES, LEGAL_ENTITIES } from '../data/legalPolicies';

interface TermsOfServiceProps {
  onBack: () => void;
  language: LanguageCode;
  initialApp?: 'customer' | 'delivery' | 'vendor' | 'branch' | 'admin';
}

export default function TermsOfService({ onBack, language, initialApp = 'customer' }: TermsOfServiceProps) {
  const [selectedAppKey, setSelectedAppKey] = useState<'customer' | 'delivery' | 'vendor' | 'branch' | 'admin'>(initialApp);
  const [copiedLink, setCopiedLink] = useState(false);
  const content = getLocalizedTermsOfService(language);
  const currentApp = APP_LEGAL_POLICIES[selectedAppKey];

  const handleCopyPlayStoreLink = () => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://localbandimultiservices.in';
    const link = `${origin}/terms-${selectedAppKey}.html`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      prompt('Copy this Play Store Terms of Service URL:', link);
    });
  };

  const appTabs = [
    { key: 'customer', label: 'Customer App', color: 'border-yellow-400 text-yellow-600 bg-yellow-50' },
    { key: 'delivery', label: 'Delivery Partner', color: 'border-blue-500 text-blue-600 bg-blue-50' },
    { key: 'vendor', label: 'Vendor & Merchant', color: 'border-emerald-500 text-emerald-600 bg-emerald-50' },
    { key: 'branch', label: 'Branch Admin', color: 'border-amber-500 text-amber-600 bg-amber-50' },
    { key: 'admin', label: 'Master Admin', color: 'border-rose-500 text-rose-600 bg-rose-50' },
  ] as const;

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-gray-200 bg-white shrink-0 shadow-xs">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">{content.title}</h2>
            <p className="text-[11px] font-mono text-gray-500">Official Operational Agreement & Terms</p>
          </div>
        </div>
        <button
          onClick={handleCopyPlayStoreLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-all border border-purple-200 cursor-pointer"
          title="Copy official Terms URL"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied URL!' : 'Copy Terms URL'}</span>
        </button>
      </header>

      {/* 5-App Switcher Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 overflow-x-auto shrink-0 flex items-center gap-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0 mr-1">App Terms:</span>
        {appTabs.map(tab => {
          const isActive = selectedAppKey === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedAppKey(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? `${tab.color} shadow-xs font-black`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-purple-50 rounded-2.5xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
              <Scale className="w-8 h-8 text-purple-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100 mb-2">
              <span>Agreement Version: {currentApp.version}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {currentApp.appName}
            </h1>
            <p className="text-xs text-gray-500 font-medium max-w-xl mx-auto mt-2">
              {currentApp.termsSummary}
            </p>

            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Role</span>
                <span className="text-xs font-bold text-gray-800 truncate block">{currentApp.targetRole}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Jurisdiction</span>
                <span className="text-xs font-bold text-gray-800 block">Telangana / AP, India</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Governing Law</span>
                <span className="text-xs font-bold text-gray-800 block">IT Act 2000 / DPDPA</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Dispute Window</span>
                <span className="text-xs font-bold text-gray-800 block">30 Days Mediation</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`/terms-${selectedAppKey}.html`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Standalone Web Page</span>
              </a>
              <button
                onClick={handleCopyPlayStoreLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Terms Link for Play Store</span>
              </button>
            </div>
          </div>

          {/* Section 1: Application-Specific Highlights */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full" />
              <span>Operational Terms & Conditions</span>
            </h3>

            {currentApp.termsHighlights.map((th, idx) => (
              <div key={idx} className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2">
                <h4 className="text-sm font-black text-purple-950 uppercase tracking-wide">
                  {idx + 1}. {th.sectionTitle}
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {th.content}
                </p>
                <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                  {th.clauses.map((c, cIdx) => (
                    <li key={cIdx}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Section 2: Universal Legal Boilerplate */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4 text-xs text-gray-600">
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
              Intellectual Property &amp; Non-Compete
            </h3>
            <p>
              All software, logos, trademarks, interfaces, algorithms, and backend databases remain the exclusive intellectual property of {LEGAL_ENTITIES.companyName}. Decompilation, scraping, or misuse is punishable under the IT Act 2000.
            </p>
            <h3 className="text-base font-black text-gray-900 uppercase tracking-tight pt-2">
              Governing Law &amp; Jurisdiction
            </h3>
            <p>
              This agreement is governed by the laws of India. Courts of competent jurisdiction in Telangana / Andhra Pradesh shall have exclusive authority over all disputes.
            </p>
            <div className="pt-4 border-t border-gray-100 font-mono text-[11px] text-gray-400">
              <p>&copy; 2026 {LEGAL_ENTITIES.companyName}. All Rights Reserved.</p>
              <p>Legal & Grievance: {LEGAL_ENTITIES.contactEmail}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
