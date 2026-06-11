import React from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../translations';

interface TermsOfServiceProps {
  onBack: () => void;
  language: LanguageCode;
}

export default function TermsOfService({ onBack, language }: TermsOfServiceProps) {
  const t = translations[language].settings || translations['en-IN'].settings;

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 border-b border-gray-50">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900">{t.termsOfService}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 prose prose-gray max-w-none">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
            <Scale className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Legal Agreement</p>
          <h3 className="text-2xl font-black text-gray-900">User Terms</h3>
        </div>

        <div className="space-y-6 text-gray-600">
          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Acceptance of Terms</h4>
            <p className="text-sm leading-relaxed">
              By using the Local Bandi Multi Services app, you agree to follow these Terms of Service. If you don't agree, please stop using the app.
            </p>
          </section>

          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">User Responsibilities</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for keeping your account secure.</li>
              <li>You must use the app in accordance with local laws.</li>
            </ul>
          </section>

          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Vendor Services</h4>
            <p className="text-sm leading-relaxed">
              Lokal provides a platform to connect you with local vendors. While we perform basic checks, the quality and fulfillment of services are the responsibility of the vendor.
            </p>
          </section>

          <section>
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Payment Terms</h4>
            <p className="text-sm leading-relaxed">
              Payments are processed securely through our partners. Refunds and cancellations are subject to vendor-specific policies.
            </p>
          </section>

          <section className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">Termination</h4>
            <p className="text-xs text-gray-500">
              We reserve the right to suspend or terminate your account if you violate these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
