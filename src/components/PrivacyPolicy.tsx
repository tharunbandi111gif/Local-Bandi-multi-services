import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../translations';

interface PrivacyPolicyProps {
  onBack: () => void;
  language: LanguageCode;
}

export default function PrivacyPolicy({ onBack, language }: PrivacyPolicyProps) {
  const t = translations[language].settings || translations['en-IN'].settings;
  
  return (
    <div className="h-full w-full bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 border-b border-gray-50 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{t.privacyPolicy}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2.5xl flex items-center justify-center mb-4 border border-blue-100">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Privacy & Data Governance</p>
          <h3 className="text-2.5xl font-black text-gray-900 leading-none">Your Privacy & Consent</h3>
          <p className="text-xs text-gray-400 mt-2 font-mono">Last updated: July 2026</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 text-gray-600">
          <div className="p-5 bg-blue-50/50 border border-blue-200/50 rounded-2.5rem text-blue-900 text-xs leading-relaxed">
            <strong className="block font-black uppercase tracking-wider mb-1">🛡️ WE DEFEND YOUR DATA:</strong>
            Local Bandi Multi Services utilizes strict security measures. We do not sell your personal data to advertisers. Any data collected is strictly for operations (e.g. matching deliveries, booking medical queues, and connecting marital bios).
          </div>

          {/* Section 1: Information We Collect */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              1. Information We Collect
            </h4>
            <p className="text-sm leading-relaxed">
              To operate the Local Bandi platform across its multi-service modules, we collect:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-gray-700">
              <li>
                <strong className="text-gray-900">User Profiles:</strong> Verified mobile phone numbers (validated via OTP), names, profile tags, and saved delivery locations.
              </li>
              <li>
                <strong className="text-gray-900">Real-Time Location Data:</strong> Continuous geographical location tracking of delivery riders to estimate precise drop-offs and dispatch nearest logistics resources. Customer locations are monitored during active delivery windows.
              </li>
              <li>
                <strong className="text-gray-900">Marriage Bureau Bio-Data:</strong> Marital profile documentation including age, profession, family background, and photographs uploaded with user consent.
              </li>
              <li>
                <strong className="text-gray-900">Healthcare Details:</strong> Direct out-patient details and specific hospital tags to obtain official OP medical slips.
              </li>
              <li>
                <strong className="text-gray-900">Partner & Rider Credentials:</strong> Uploaded vehicle registration certificates, driver licenses, photo identity proofs, and bank accounts for settlement tracking.
              </li>
            </ul>
          </section>

          {/* Section 2: How We Use Data */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              2. How We Utilize Your Information
            </h4>
            <p className="text-sm leading-relaxed text-gray-500">
              The data we collect is strictly applied to perform real-world operational logistics and keep the platform secured:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 font-medium">
              <li>Route optimization and automated dispatch calculations for food, grocery, and parcel shipments.</li>
              <li>Filing live out-patient tokens and booking queue records at our integrated medical facilities.</li>
              <li>Providing a verified matchmaking index for certified subscribers of the Lokal Marriage Bureau.</li>
              <li>Processing secure payouts and settling digital ledgers for our riders and local franchise operators.</li>
            </ul>
          </section>

          {/* Section 3: Data Protection & Sharing */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              3. Strict Zero-Leak Sharing Guidelines
            </h4>
            <p className="text-sm leading-relaxed">
              We never trade, auction, or leverage your private data for third-party monetization. Information is shared strictly under the following operational scopes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-500">
              <li><strong className="text-gray-800">To Delivery Partners:</strong> Sharing customer contact details and exact coordinates to ensure accurate and timely order handovers.</li>
              <li><strong className="text-gray-800">To Regional Franchises:</strong> Sharing branch specific data to regional office operators for dispute resolution and order fulfillment audits.</li>
              <li><strong className="text-gray-800">To Matchmaking Candidates:</strong> Sharing Marriage Bureau bios exclusively with other verified matrimonial candidates based on strict customer opt-ins.</li>
            </ul>
          </section>

          {/* Section 4: Data Security and Local Persistence */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-gray-100 space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">
              🛡️ Infrastructure Security & Encryption
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              All personal details, transaction ledgers, partner certificates, and marital records are secured using robust encryption (HTTPS/TLS) during transmission and stored safely in Firestore. User sessions on local devices are kept isolated using authenticated tokens to block unauthorized entry.
            </p>
          </section>

          {/* Section 5: Deletion Requests */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              5. Profile Deletion & Opt-Out Rights
            </h4>
            <p className="text-sm leading-relaxed">
              We respect your right to control your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-500">
              <li><strong className="text-gray-800">Matrimonial Deletion:</strong> Users of the Lokal Marriage Bureau can take down or permanently freeze their matchmaking profiles instantly through their profile settings or support team.</li>
              <li><strong className="text-gray-800">Partner Resignation:</strong> Delivery partners and local vendors can terminate their listings, which triggers immediate archiving and permanent deletion of ID proofs after mandatory tax/legal clearance periods.</li>
            </ul>
          </section>

          {/* Support and Contact Details */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
            <p>© 2026 Local Bandi Multi Services. All rights reserved.</p>
            <p className="text-right">Privacy Officer Desk: privacy@localbandi.app | +91 7416574197</p>
          </div>
        </div>
      </div>
    </div>
  );
}
