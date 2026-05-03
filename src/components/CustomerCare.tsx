import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, User, Briefcase, Bike, ChevronRight, MessageSquare, ShieldCheck, HeartHandshake } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

interface CustomerCareProps {
  isOpen: boolean;
  onClose: () => void;
  supportPhone: string;
}

const CUSTOMER_CARE_QA: Record<'user' | 'vendor' | 'delivery', FAQItem[]> = {
  user: [
    { q: "How to place an order?", a: "Select a category, choose a vendor, add items to cart, and proceed to checkout with your address." },
    { q: "What is the return policy?", a: "As we deal with fresh farm products, returns are accepted only at the time of delivery if quality is not met." },
    { q: "How to contact the vendor directly?", a: "Once your order is confirmed, the vendor's verified phone number will be shared in your order details." },
    { q: "Can I cancel my order?", a: "Orders can be cancelled before they are accepted by the vendor. Once 'In Preparation', cancellation may not be possible." },
    { q: "How do I check my rewards?", a: "Go to Profile > Wallet to see your refer-and-earn rewards and referral history." }
  ],
  vendor: [
    { q: "How do I get paid?", a: "Payments are settled weekly. You can request a payout from your Vendor Console when your balance is above ₹500." },
    { q: "How to add new products?", a: "Go to Vendor Console > Store Inventory > Add Item. Fill in the details and we'll verify it." },
    { q: "My shop is visible but I'm not getting orders?", a: "Ensure your 'Shop Status' is toggled to ONLINE and you have high-quality product images." },
    { q: "How to update store hours?", a: "Currently, you can toggle your shop status manually. Scheduled hours are coming soon!" },
    { q: "What are the commission charges?", a: "We charge a minimal transaction fee to maintain the platform. Check your vendor agreement for details." }
  ],
  delivery: [
    { q: "How are trips assigned?", a: "Orders are assigned based on your proximity to the vendor and your current workload (Automatic Mode)." },
    { q: "When can I remit my earnings?", a: "Earnings can be remitted daily after 8 PM. Request settlement from your Rider Dashboard." },
    { q: "What if the customer is unreachable?", a: "Attempt to call 3 times. If no response, contact Support via the app and do not leave the location." },
    { q: "How to update vehicle information?", a: "Contact Admin via the support number to update your KYC and vehicle details." },
    { q: "Are there extra incentives for night delivery?", a: "Yes, night shifts (8 PM - 12 AM) carry an additional ₹10 bonus per successful delivery." }
  ]
};

export default function CustomerCare({ isOpen, onClose, supportPhone }: CustomerCareProps) {
  const [careType, setCareType] = useState<'user' | 'vendor' | 'delivery'>('user');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative bg-white w-full max-w-2xl h-full sm:h-[80vh] sm:rounded-[4rem] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between shrink-0 border-b border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter">Lokal Care</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Founder Support Desk</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-gray-100 rounded-2xl text-gray-400 hover:bg-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Type Selector */}
            <div className="px-8 py-6 bg-gray-50/50 shrink-0">
              <div className="flex bg-white p-1.5 rounded-[2rem] shadow-sm border border-gray-100">
                {(['user', 'vendor', 'delivery'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setCareType(type)}
                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${
                      careType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {type === 'user' && <User className="w-3 h-3" />}
                    {type === 'vendor' && <Briefcase className="w-3 h-3" />}
                    {type === 'delivery' && <Bike className="w-3 h-3" />}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Q&A List */}
            <div className="flex-1 overflow-y-auto px-8 py-4 space-y-4">
              <div className="flex items-center gap-2 mb-6">
                 <MessageSquare className="w-4 h-4 text-indigo-500" />
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Common Questions</h4>
              </div>
              
              {CUSTOMER_CARE_QA[careType].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all group cursor-default">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black text-[10px]">
                      Q
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                        {item.q}
                      </p>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-50">
                        <p className="text-sm font-bold text-gray-500 leading-relaxed italic">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Support */}
            <div className="p-8 bg-gray-900 shrink-0">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-400 backdrop-blur-md">
                     <Phone className="w-5 h-5 animate-pulse" />
                   </div>
                   <div>
                     <p className="text-xs font-black text-white italic">Urgent Support?</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Available 9 AM - 9 PM</p>
                   </div>
                 </div>
                 <a 
                   href={`tel:${supportPhone}`}
                   className="w-full md:w-auto px-10 py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition-all text-center"
                 >
                   Call +91 {supportPhone}
                 </a>
               </div>
               
               <div className="mt-8 flex items-center justify-center gap-4 border-t border-white/5 pt-6">
                 <div className="flex items-center gap-1.5 opacity-40">
                   <ShieldCheck className="w-3.5 h-3.5 text-white" />
                   <span className="text-[8px] font-black text-white uppercase tracking-widest italic">Encrypted Connection</span>
                 </div>
                 <div className="w-1 h-1 bg-white/20 rounded-full" />
                 <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest italic">Lokal Bharath Founder Desk v1.0</p>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
