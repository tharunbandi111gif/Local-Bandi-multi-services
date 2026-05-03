import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Wallet, Landmark, Phone, CheckCircle2, ShieldCheck, MapPin, ChevronRight, Sparkles, Smartphone, QrCode, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function Payment({ onBack, onComplete }: PaymentProps) {
  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [selectedMethod, setSelectedMethod] = useState('gpay');
  const [isVerifying, setIsVerifying] = useState(false);

  const [address, setAddress] = useState({
    name: 'Bharat Kumar',
    phone: '9876543210',
    details: 'Flat 402, Sai Residency',
    area: 'Opp. NTR Park',
    city: 'Khammam',
    pincode: '507001'
  });

  const paymentMethods = [
    { id: 'gpay', name: 'Google Pay', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
    { id: 'phonepe', name: 'PhonePe', icon: Phone, color: 'bg-purple-100 text-purple-600' },
    { id: 'bhim', name: 'BHIM UPI', icon: QrCode, color: 'bg-orange-100 text-orange-600' },
    { id: 'cod', name: 'Cash on Delivery', icon: Banknote, color: 'bg-emerald-100 text-emerald-600', badge: 'Popular' },
    { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, color: 'bg-blue-50 text-blue-500' },
    { id: 'wallet', name: 'Lokal Wallet', icon: Wallet, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'nb', name: 'Net Banking', icon: Landmark, color: 'bg-slate-100 text-slate-600' },
  ];

  const handleConfirmAddress = () => {
    setIsVerifying(true);
    // Simulate a brief verification check
    setTimeout(() => {
      setIsVerifying(false);
      setStep('payment');
    }, 800);
  };

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white border-b border-gray-50">
        <button onClick={step === 'payment' ? () => setStep('address') : onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900 italic tracking-tight">
          {step === 'address' ? 'Confirm Address' : 'Payment'}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <AnimatePresence mode="wait">
          {step === 'address' ? (
            <motion.div 
              key="address"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-yellow-50 rounded-[2.5rem] p-8 border-2 border-yellow-200 relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Delivery Destination</h3>
                    <p className="text-[10px] font-bold text-yellow-700 uppercase">Verification Required</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest ml-1">Customer Name</label>
                    <input 
                      value={address.name}
                      onChange={(e) => setAddress({...address, name: e.target.value})}
                      className="bg-white/80 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      value={address.phone}
                      onChange={(e) => setAddress({...address, phone: e.target.value})}
                      className="bg-white/80 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest ml-1">Address Details</label>
                    <textarea 
                      rows={2}
                      value={address.details}
                      onChange={(e) => setAddress({...address, details: e.target.value})}
                      className="bg-white/80 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm shadow-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest ml-1">City</label>
                      <input 
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                        className="bg-white/80 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest ml-1">Pincode</label>
                      <input 
                        value={address.pincode}
                        maxLength={6}
                        onChange={(e) => setAddress({...address, pincode: e.target.value.replace(/\D/g, '')})}
                        className="bg-white/80 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-yellow-400/10 rounded-full" />
              </div>

              <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-3xl border border-blue-100">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-blue-800 leading-relaxed italic">
                  Please double-check your delivery address. Our partners use this information to ensure fast and accurate delivery to your doorstep.
                </p>
              </div>

              <div className="pb-10">
                <button 
                  onClick={handleConfirmAddress}
                  disabled={isVerifying}
                  className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Confirm Address & Proceed <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="flex justify-between items-start mb-10 z-10 relative">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Payable Amount</p>
                    <h3 className="text-4xl font-black italic tracking-tighter">₹474</h3>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <ShieldCheck className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div className="flex items-center gap-3 z-10 relative">
                  <div className="w-8 h-5 bg-white/20 rounded-md"></div>
                  <p className="text-xs font-bold text-white/80 leading-none">Safe & Secure checkout</p>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full"></div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Select Payment Method</h3>
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-widest">Encrypted</div>
                </div>
                <div className="space-y-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-[2rem] border-2 transition-all active:scale-[0.98] relative ${
                          selectedMethod === method.id 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-gray-50 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className={`p-3 rounded-2xl ${method.color} shadow-sm`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block font-black text-gray-900 lowercase italic tracking-tight text-lg leading-none">{method.name.toLowerCase()}</span>
                          {method.badge && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase tracking-widest rounded-md leading-none">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        {selectedMethod === method.id && (
                          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center ring-4 ring-yellow-100 shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-gray-900" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="p-6 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-900">Guaranteed Delivery</p>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">In next 45-60 minutes</p>
                </div>
              </div>

              <div className="pb-6">
                <button 
                  onClick={onComplete}
                  className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2.5rem] font-black shadow-2xl shadow-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg italic tracking-tight"
                >
                  Pay Securely Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

