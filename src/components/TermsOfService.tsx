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
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 border-b border-gray-50 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900 tracking-tight">{t.termsOfService}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-6">
          <div className="w-16 h-16 bg-purple-50 rounded-2.5xl flex items-center justify-center mb-4 border border-purple-100">
            <Scale className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Official Legal Agreement</p>
          <h3 className="text-2.5xl font-black text-gray-900 leading-none">Local Bandi Terms & Conditions</h3>
          <p className="text-xs text-gray-400 mt-2 font-mono">Last updated: July 2026</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 text-gray-600">
          <div className="p-5 bg-amber-50/50 border border-amber-200/50 rounded-2.5rem text-amber-900 text-xs leading-relaxed">
            <strong className="block font-black uppercase tracking-wider mb-1">⚠️ IMPORTANT PLEASE READ:</strong>
            These Terms govern your usage of the Local Bandi Super-App platform. By accessing or downloading any part of the Local Bandi app, registering a user account, onboarding as a service partner/delivery rider, or listing as an authorized vendor/franchise owner, you explicitly agree to these legally binding terms.
          </div>

          {/* Section 1: Platform Overview */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              1. Scope of Multi-Services Super-App
            </h4>
            <p className="text-sm leading-relaxed">
              Local Bandi operates as a hyper-local multi-service aggregator connecting customers, independent merchants, freelance delivery partners, specialized service providers, and regional franchise operators. Our service suite includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs font-medium text-gray-700">
              <li><strong className="text-gray-900">Delivery Services:</strong> Food, vegetables, groceries, pharmaceutical products, and parcel deliveries.</li>
              <li><strong className="text-gray-900">Home Services & Maintenance:</strong> Plumbing, electrical, carpentry, cleaning, painters, and household repairs.</li>
              <li><strong className="text-gray-900">Healthcare OP Desk:</strong> Live out-patient desk tickets, token registrations, and priority hospital OP queue booking intermediation.</li>
              <li><strong className="text-gray-900">Lokal Marriage Bureau:</strong> Custom matrimonial profile publishing, regional bio-data sharing, and matchmaking coordination.</li>
              <li><strong className="text-gray-900">Real Estate & Rentals:</strong> Hyper-local property listings, commercial rentals, and verified agricultural land intermediation.</li>
            </ul>
          </section>

          {/* Section 2: Account Security */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              2. User Obligations & High-Security Devices
            </h4>
            <p className="text-sm leading-relaxed">
              Users must provide accurate, current, and complete details (name, phone number, and delivery location). You are solely responsible for all actions taken through your mobile phone number.
            </p>
            <p className="text-xs text-gray-500 italic bg-gray-50 p-4 rounded-xl border border-gray-100">
              💡 <strong className="text-gray-700">Founder Control Limit:</strong> For security audits and to prevent commercial misuse, a single user or administrative account may only log in on authorized devices (with a strict platform ceiling of six (6) concurrently active physical devices). Any excess login attempts will be automatically flagged and held for manual review.
            </p>
          </section>

          {/* Section 3: Booking & Delivery Terms */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              3. Service Fulfillment & Dispute Redressal
            </h4>
            <p className="text-sm leading-relaxed">
              While Local Bandi does standard verification and verification checks on all registered vendors, freelancers, and healthcare partners, the final execution of services is performed by these independent third parties:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-500">
              <li><strong className="text-gray-800">Fulfillment:</strong> Merchant listings, menu items, and pricing are set directly by the vendors.</li>
              <li><strong className="text-gray-800">Hospital Appointments:</strong> Hospital OP bookings intermediated by the platform are subject to unexpected delays, sudden emergency prioritization, and doctor availability shifts.</li>
              <li><strong className="text-gray-800">Matrimony Rules:</strong> Local Bandi Marriage Bureau handles profiles with utmost confidentiality, but users are strictly advised to run independent background checks. The platform is not responsible for any post-matchmaking discrepancies.</li>
            </ul>
          </section>

          {/* Section 4: Refund and Cancel Policies */}
          <section className="bg-slate-50 p-6 rounded-[2rem] border border-gray-150 space-y-4">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span>💳 Payment & Refund Rules</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-sans tracking-normal font-extrabold normal-case">Updated En-IN</span>
            </h4>
            <div className="text-sm leading-relaxed space-y-3 font-medium text-gray-700">
              <p>
                Our payment and cancellation policies ensure transparent, reliable operations for both consumers and service partners:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2 text-xs">
                <li>
                  <strong className="text-gray-900">Secured Gateways:</strong> We integrate authorized 256-bit encrypted transactions via instant UPI (GPay, PhonePe, Paytm), Netbanking, and Credit/Debit cards.
                </li>
                <li>
                  <strong className="text-gray-900">Grace Cancellation Window:</strong> A customer can cancel their order with 100% refund eligibility prior to the vendor accepting the order. Once food/grocery preparation begins, or a delivery rider is dispatched, a reasonable cancellation fee may apply.
                </li>
                <li>
                  <strong className="text-gray-900">Instant UPI Refunds (0 - 24 Hours):</strong> Successful refunds for UPI transactions are processed instantly and credited back to the source account within <span className="underline font-bold text-gray-900">a few hours up to 1 business day</span>.
                </li>
                <li>
                  <strong className="text-gray-900">Card & Netbanking Refunds (3 - 10 Days):</strong> Credit/Debit card transactions undergo settlement rounds across acquiring banks. Although released instantly on our server, card statements may reflect the refund within <span className="underline font-bold text-gray-900">3 to 10 banking days</span>.
                </li>
              </ul>
              <p className="text-xs text-slate-400 italic">
                Any billing concerns, wallet disputes, or escrow adjustments can be submitted for review through the customer desk within 7 days.
              </p>
            </div>
          </section>

          {/* Section 5: Franchise and Delivery Rider Terms */}
          <section className="space-y-3">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
              5. Regional Franchise Branch Offices & Riders
            </h4>
            <p className="text-sm leading-relaxed">
              Authorized Regional Franchises operate with local administrative oversight inside their designated PIN-codes and local regions:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-500">
              <li>Franchise administrators must secure branch passcodes and maintain verified local operations.</li>
              <li>Onboarded delivery partners must follow safety directives, maintain verified vehicle documents, and honor assigned orders in their designated circles.</li>
              <li>Platform commissions, payouts, and penalty models are subject to periodic structural adjustments governed by the Founder Panel.</li>
            </ul>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className="p-6 bg-red-50/20 border border-red-100 rounded-[2rem] space-y-2">
            <h4 className="font-black text-red-950 uppercase text-xs tracking-widest flex items-center gap-2">
              🚨 Limitation of Liability
            </h4>
            <p className="text-xs text-red-900 leading-relaxed font-medium">
              In no event shall Local Bandi, its founders, or directors be liable for any indirect, incidental, special, or consequential damages resulting from the use of third-party products, food ingredients, partner delays, matchmaker profiles, or property listings.
            </p>
          </section>

          {/* Contact Details */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono">
            <p>© 2026 Local Bandi Multi Services. All rights reserved.</p>
            <p className="text-right">Support: +91 7416574197 | contact@localbandi.app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
