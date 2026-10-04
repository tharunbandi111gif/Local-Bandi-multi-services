import React, { useState } from 'react';
import { ArrowLeft, Shield, ExternalLink, Check, Copy, FileText, ChevronRight, Lock } from 'lucide-react';
import { LanguageCode } from '../types';
import { getLocalizedPrivacyPolicy } from '../utils/localizedContent';
import { APP_LEGAL_POLICIES, LEGAL_ENTITIES } from '../data/legalPolicies';

interface PrivacyPolicyProps {
  onBack: () => void;
  language: LanguageCode;
  initialApp?: 'customer' | 'delivery' | 'vendor' | 'branch' | 'admin';
}

export default function PrivacyPolicy({ onBack, language, initialApp = 'customer' }: PrivacyPolicyProps) {
  const [selectedAppKey, setSelectedAppKey] = useState<'customer' | 'delivery' | 'vendor' | 'branch' | 'admin'>(initialApp);
  const [copiedLink, setCopiedLink] = useState(false);
  const content = getLocalizedPrivacyPolicy(language);
  const currentApp = APP_LEGAL_POLICIES[selectedAppKey];

  const handleCopyPlayStoreLink = () => {
    const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://localbandimultiservices.in';
    const link = `${origin}/privacy-${selectedAppKey}.html`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      prompt('Copy this Play Store Privacy Policy URL:', link);
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
            <p className="text-[11px] font-mono text-gray-500">Google Play Store & DPDPA Compliant</p>
          </div>
        </div>
        <button
          onClick={handleCopyPlayStoreLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all border border-blue-200 cursor-pointer"
          title="Copy official URL for Google Play Console"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied URL!' : 'Copy Play Store URL'}</span>
        </button>
      </header>

      {/* 5-App Switcher Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-2.5 overflow-x-auto shrink-0 flex items-center gap-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0 mr-1">App Policy:</span>
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
            <div className="w-16 h-16 bg-blue-50 rounded-2.5xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 mb-2">
              <Lock className="w-3 h-3" />
              <span>Package: {currentApp.packageId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {currentApp.appName}
            </h1>
            <p className="text-xs text-gray-500 font-medium max-w-xl mx-auto mt-2">
              {currentApp.privacySummary}
            </p>
            
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Role</span>
                <span className="text-xs font-bold text-gray-800 truncate block">{currentApp.targetRole}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Effective Date</span>
                <span className="text-xs font-bold text-gray-800 block">{currentApp.effectiveDate}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Encryption</span>
                <span className="text-xs font-bold text-gray-800 block">AES-256 / TLS 1.3</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black uppercase text-gray-400 block">Data Deletion</span>
                <span className="text-xs font-bold text-emerald-600 block">Self-Service &lt; 30d</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`/privacy-${selectedAppKey}.html`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Standalone Web Page</span>
              </a>
              <button
                onClick={handleCopyPlayStoreLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link for Google Play Store Console</span>
              </button>
            </div>
          </div>

          {/* Section 1: Itemized Data Collection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              <span>1. Data Collected & Specific Purposes</span>
            </h3>
            <p className="text-xs text-gray-500">
              The following data points are collected specifically for the <strong>{currentApp.shortName}</strong>:
            </p>

            <div className="space-y-3">
              {currentApp.dataCollection.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">{item.category}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      item.isOptional ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.isOptional ? 'OPTIONAL' : 'CORE FUNCTIONALITY'}
                    </span>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                    {item.dataPoints.map((dp, dIdx) => (
                      <li key={dIdx}>{dp}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                    <strong className="text-gray-700">Purpose:</strong> {item.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Google Play Sensitive Permissions Disclosures */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              <span>2. Google Play Sensitive Permissions Disclosures</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {currentApp.permissionsUsed.map((p, idx) => (
                <div key={idx} className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-1.5 border border-slate-800">
                  <div className="flex items-center gap-2 font-mono text-xs text-yellow-400 font-bold">
                    <span>{p.permission}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">{p.description}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950 p-2.5 rounded-lg border border-white/5">
                    <strong>Prominent Disclosure:</strong> {p.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Data Storage, Retention & Security */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              <span>3. Data Storage & Security Measures</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <strong className="text-blue-900 block mb-1">Storage Provider</strong>
                <span className="text-gray-700">{currentApp.storageAndRetention.storageProvider}</span>
              </div>
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <strong className="text-blue-900 block mb-1">Cryptographic Standards</strong>
                <span className="text-gray-700">{currentApp.storageAndRetention.encryptionAtRest} &bull; {currentApp.storageAndRetention.encryptionInTransit}</span>
              </div>
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 sm:col-span-2">
                <strong className="text-blue-900 block mb-1">Retention Limitations</strong>
                <span className="text-gray-700">{currentApp.storageAndRetention.retentionPolicy}</span>
              </div>
            </div>
            
            <div className="pt-2">
              <strong className="text-xs font-black text-gray-900 uppercase block mb-2">Platform Safeguards:</strong>
              <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1.5">
                {currentApp.securityMeasures.map((sm, idx) => (
                  <li key={idx}>{sm}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 4: Data Deletion & Grievance */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-600 rounded-full" />
              <span>4. Data Deletion Protocol & Grievance Desk</span>
            </h3>
            
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <strong className="font-black uppercase tracking-wider block">How to Request Full Data Erasure:</strong>
              <ol className="list-decimal pl-5 space-y-1 text-emerald-900 font-medium">
                {currentApp.dataDeletionProcedure.inAppSteps.map((st, idx) => (
                  <li key={idx}>{st}</li>
                ))}
              </ol>
              <p className="pt-1 text-[11px] text-emerald-800">
                <strong>Email Request:</strong> {currentApp.dataDeletionProcedure.emailProcedure}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 font-mono space-y-1">
              <p><strong>Operating Entity:</strong> {LEGAL_ENTITIES.companyName}</p>
              <p><strong>Grievance Officer:</strong> {LEGAL_ENTITIES.grievanceOfficer} ({LEGAL_ENTITIES.contactEmail})</p>
              <p><strong>Address:</strong> {LEGAL_ENTITIES.grievanceAddress}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
