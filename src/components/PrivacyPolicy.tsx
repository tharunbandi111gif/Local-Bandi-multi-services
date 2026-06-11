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
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 border-b border-gray-50">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900">{t.privacyPolicy}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 prose prose-gray max-w-none">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Security First</p>
          <h3 className="text-2xl font-black text-gray-900">Your Privacy Matters</h3>
        </div>

        <div className="space-y-6 text-gray-600">
          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Introduction</h4>
            <p className="text-sm leading-relaxed">
              At Local Bandi Multi Services, we take your privacy seriously. This Privacy Policy explains how we collect, use, and share your personal information.
            </p>
          </section>

          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Data Collection</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Profile Information: Name, phone number, and address provided during registration.</li>
              <li>Location Data: To provide search results from your local area.</li>
              <li>Usage Data: Information about how you interact with our services and products.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">How We Use Data</h4>
            <p className="text-sm leading-relaxed">
              We use your data to process orders, improve our services, and communicate with you about your account and updates.
            </p>
          </section>

          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Data Sharing</h4>
            <p className="text-sm leading-relaxed">
              We do not sell your personal data. We share only necessary information with local vendors and delivery partners to fulfill your requests.
            </p>
          </section>

          <section className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Contact Us</h4>
            <p className="text-xs text-gray-500">
              If you have any questions about this Privacy Policy, please contact our support team at privacy@lokal.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
