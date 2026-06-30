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

          <section className="bg-slate-50 p-6 rounded-[2rem] border border-gray-150 space-y-4">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span>💳 Payment & Refund Policy</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-sans tracking-normal font-extrabold normal-case">Updated En-IN</span>
            </h4>
            <div className="text-sm leading-relaxed space-y-3 font-medium text-gray-700">
              <p>
                Kindly review the following platform guidelines regarding digital payments, cancellation fees, and refund settlements on the Local Bandi platform:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong className="text-gray-900">Payment Authorization:</strong> We support secure payments with 256-bit transactional encryption using authorized UPI networks, netbanking, and credit/debit card issuers.
                </li>
                <li>
                  <strong className="text-gray-900">Order Cancellation:</strong> You are fully eligible for a 100% refund if the order is cancelled prior to being accepted and marked in preparation by the merchant store. If cancelled after preparation has commenced, a processing/waste compensation fee may be applied.
                </li>
                <li>
                  <strong className="text-gray-900">UPI Refunds (Instant - 1 Day):</strong> For all successfully processed cancellations made on UPI payments (GPay, PhonePe, Paytm, etc.), refunds will be processed and credited back to your original source account within <strong className="text-gray-900 underline">a few hours or up to 1 business day</strong>.
                </li>
                <li>
                  <strong className="text-gray-900">Credit & Debit Card Refunds (3 - 10 Days):</strong> For payments settled via Credit Cards, Debit Cards, or standard Netbanking gateways, the gateway partners and bank networks require a clear settlement window. These refunds are released instantly on our end but can take <strong className="text-gray-900 underline">3 to 10 business days</strong> to be credited to your card statement.
                </li>
                <li>
                  <strong className="text-gray-900">Merchants & Riders Terms:</strong> Settlement balances, escrow holds, cash collection matching, ride offsets, and cancellation compensations are governed directly by our digital ledgers. Arbitrage or ledger adjustments can be contested within 7 calendar days of occurrence.
                </li>
              </ul>
              <p className="text-xs text-gray-400 italic">
                Thank you for cooperating with Local Bandi Multi Services. We guarantee complete transparency in handling your funds. Should you encounter any discrepancies, please reach support at 7416574197.
              </p>
            </div>
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
