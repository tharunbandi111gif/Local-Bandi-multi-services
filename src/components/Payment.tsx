import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Wallet, Landmark, Phone, CheckCircle2, ShieldCheck, MapPin, ChevronRight, Sparkles, Smartphone, QrCode, Banknote, HelpCircle, User, Info, ClipboardList, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface PaymentProps {
  onBack: () => void | Promise<void>;
  onComplete: (method: string, tipAmount?: number) => void | Promise<void>;
  amount: number;
  userProfile?: any;
  currentLocation?: string;
}

export default function Payment({ onBack, onComplete, amount, userProfile, currentLocation }: PaymentProps) {
  const [step, setStep] = useState<'address' | 'payment'>(() => {
    const pending = (window as any).pendingLocalPayment;
    if (pending && (pending.type === 'hospital_op' || pending.type === 'marriage_sub')) {
      return 'payment';
    }
    return 'address';
  });
  const [selectedMethod, setSelectedMethod] = useState('gpay');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [tipSelection, setTipSelection] = useState<number>(0);

  const finalAmountIncludingTip = amount + tipSelection;

  useEffect(() => {
    // Fetch Admin Payment Config
    const unsub = onSnapshot(doc(db, 'settings', 'payment_config'), (snapshot) => {
      if (snapshot.exists()) {
        setPaymentConfig(snapshot.data());
      }
    });
    return () => unsub();
  }, []);

  const [address, setAddress] = useState(() => {
    const defaultAddr = userProfile?.addresses?.find((a: any) => a.isDefault) || userProfile?.addresses?.[0];
    return {
      name: defaultAddr?.recipientName || userProfile?.name || 'Customer',
      phone: defaultAddr?.phone || userProfile?.phone || '',
      details: defaultAddr?.address || userProfile?.fullAddress || '',
      area: currentLocation || '',
      city: 'Khammam',
      pincode: defaultAddr?.pincode || '507001'
    };
  });

  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const paymentMethods = [
    { id: 'gpay', name: 'Google Pay', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
    { id: 'phonepe', name: 'PhonePe', icon: Phone, color: 'bg-purple-100 text-purple-600' },
    { id: 'bhim', name: 'BHIM UPI', icon: QrCode, color: 'bg-orange-100 text-orange-600' },
    { id: 'upi', name: 'UPI ID', icon: QrCode, color: 'bg-teal-100 text-teal-600' },
    { id: 'cod', name: 'Cash on Delivery', icon: Banknote, color: 'bg-emerald-100 text-emerald-600', badge: 'Popular' },
    { id: 'card', name: 'Credit / Debit Card', icon: CreditCard, color: 'bg-blue-50 text-blue-500' },
    { id: 'wallet', name: 'Local Bandi Wallet', icon: Wallet, color: 'bg-indigo-100 text-indigo-600' },
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

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  const executeComplete = async (method: string) => {
    setProcessingOrder(true);
    setLoading(true);
    try {
      await onComplete(method, tipSelection);
    } catch (err: any) {
      console.error("[Payment Error] Failed to complete order:", err);
      setPaymentError(err?.message || "Failed to process order. Please try again.");
      setProcessingOrder(false);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentError(null);

    // Helper to write transaction logs
    const logPaymentTxn = async (method: string) => {
      try {
        await addDoc(collection(db, 'audit_logs'), {
          type: 'payment_success',
          amount: finalAmountIncludingTip,
          tipAmount: tipSelection,
          method: method,
          status: 'SUCCESS',
          customerName: userProfile?.name || userProfile?.fullName || 'Lokal Bandi User',
          customerPhone: userProfile?.phone || '',
          deliveryLocation: currentLocation || 'System Service Ingress',
          txnId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Audit logger non-blocking warning:", err);
      }
    };

    // 1. Credit / Debit Card validation
    if (selectedMethod === 'card') {
      if (!cardHolder.trim()) {
        setPaymentError("Please enter the cardholder's name.");
        return;
      }
      const rawCard = cardNumber.replace(/\s/g, '');
      if (rawCard.length < 12 || rawCard.length > 19) {
        setPaymentError("Please enter a valid Credit/Debit card number (12-19 digits).");
        return;
      }
      if (!cardExpiry.trim() || !cardExpiry.includes('/')) {
        setPaymentError("Please enter a valid expiry date in MM/YY format.");
        return;
      }
      const [mmStr, yyStr] = cardExpiry.split('/');
      const mm = parseInt(mmStr, 10);
      if (isNaN(mm) || mm < 1 || mm > 12) {
        setPaymentError("Expiry month must be between 01 and 12.");
        return;
      }
      if (cardCvv.length < 3 || cardCvv.length > 4) {
        setPaymentError("Please enter a valid 3 or 4-digit CVV code.");
        return;
      }

      setLoading(true);
      setProcessingOrder(true);
      setTimeout(async () => {
        await logPaymentTxn('card');
        await executeComplete('card');
      }, 1500);
      return;
    }

    // 2. UPI payment validation
    if (['gpay', 'phonepe', 'bhim', 'upi'].includes(selectedMethod)) {
      let finalUpi = upiIdInput.trim();
      if (!finalUpi) {
        if (selectedMethod === 'upi') {
          setPaymentError("Please enter your UPI ID.");
          return;
        } else {
          // For GPay / PhonePe / BHIM app intent, fallback to phone handle or admin VPA
          finalUpi = `${userProfile?.phone || '8790729816'}@${selectedMethod === 'gpay' ? 'okaxis' : selectedMethod === 'phonepe' ? 'ybl' : 'upi'}`;
        }
      } else if (!finalUpi.includes('@')) {
        finalUpi = `${finalUpi}@${selectedMethod === 'gpay' ? 'okaxis' : selectedMethod === 'phonepe' ? 'ybl' : 'upi'}`;
      }

      // Using Direct UPI with the user's requested VPA
      const upiId = paymentConfig?.upiId || '8790729816-4@ybl';
      const holder = paymentConfig?.accountHolder || 'Local Bandi Multi Services';
      window.open(`upi://pay?pa=${upiId}&pn=${holder}&am=${finalAmountIncludingTip}&cu=INR`);
      setLoading(true);
      setProcessingOrder(true);
      setTimeout(async () => {
        await logPaymentTxn(selectedMethod);
        await executeComplete(selectedMethod);
      }, 1500);
      return;
    }

    // 3. Net Banking validation
    if (selectedMethod === 'nb') {
      if (!selectedBank) {
        setPaymentError("Please select a bank for Net Banking transfer.");
        return;
      }
      setLoading(true);
      setProcessingOrder(true);
      setTimeout(async () => {
        await logPaymentTxn(`netbanking-${selectedBank}`);
        await executeComplete('nb');
      }, 1500);
      return;
    }

    // 4. Cash on Delivery
    if (selectedMethod === 'cod') {
      // Small delay for realism
      setLoading(true);
      setProcessingOrder(true);
      setTimeout(async () => {
        await logPaymentTxn('cod');
        await executeComplete('cod');
      }, 1000);
      return;
    }

    // Default fallback
    setLoading(true);
    setProcessingOrder(true);
    setTimeout(async () => {
      await logPaymentTxn(selectedMethod);
      await executeComplete(selectedMethod);
    }, 1500);
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
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] font-bold text-yellow-700 uppercase">
                         {userProfile?.fullAddress || userProfile?.addresses?.length > 0 ? 'Verified via Profile' : 'Verification Required'}
                       </p>
                       <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${userProfile?.fullAddress || userProfile?.addresses?.length > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                </div>

                {userProfile?.addresses?.length > 1 && (
                  <button 
                    onClick={() => setShowAddressPicker(true)}
                    className="mb-6 w-full py-3 bg-white/50 hover:bg-white rounded-xl border border-yellow-200 text-[10px] font-black uppercase tracking-widest text-yellow-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Change Delivery Address
                  </button>
                )}

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
                    <h3 className="text-4xl font-black italic tracking-tighter">₹{finalAmountIncludingTip}</h3>
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

              {/* Rider Support Tip Options Section */}
              <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-2 border-yellow-400/20 rounded-[2.5rem] p-6 text-left space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-yellow-400/15 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-905 uppercase tracking-wide leading-none">Rider Support Tip</h4>
                    <p className="text-[10px] text-slate-500 mt-1">100% of tip goes directly to increase partner’s payout</p>
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  {[0, 10, 20, 30, 50].map((tAmt) => (
                    <button
                      key={tAmt}
                      type="button"
                      onClick={() => setTipSelection(tAmt)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        tipSelection === tAmt
                          ? 'bg-yellow-400 text-slate-905 font-black scale-105 shadow-md shadow-yellow-100'
                          : 'bg-white text-slate-600 border border-slate-150 hover:border-slate-300'
                      }`}
                    >
                      {tAmt === 0 ? 'No Tip' : `₹${tAmt}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-4">
                   <ClipboardList className="w-4 h-4 text-gray-400" />
                   <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Bill Summary</h3>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500 italic">
                      <span>Total Invoice Value</span>
                      <span className="text-gray-900">₹{amount}</span>
                   </div>
                   {tipSelection > 0 && (
                     <div className="flex justify-between items-center text-xs font-bold text-gray-500 italic">
                        <span>Rider Support Tip</span>
                        <span className="text-yellow-600 font-extrabold">+ ₹{tipSelection}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center border-t border-gray-50 pt-3 text-xs font-black text-gray-800 uppercase tracking-tight">
                      <span>Total Payable</span>
                      <span className="text-slate-905 text-sm font-black">₹{finalAmountIncludingTip}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 italic">
                      <span>App Charges</span>
                      <span className="text-emerald-600 font-black">INCLUDED</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 italic">
                      <span>Delivery Information</span>
                      <span className="text-gray-900 underline">Standard</span>
                   </div>
                </div>
              </div>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Select Payment Method</h3>
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-widest">Encrypted</div>
                </div>

                {/* Display Admin Direct Settlement Option */}
                <div className="mb-6 p-6 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 flex gap-2">
                     <Smartphone className="w-4 h-4 text-white/50" />
                     <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Instant Settlement</p>
                  <h4 className="text-xl font-black italic tracking-tight mb-4">Direct App-to-Admin UPI</h4>
                  
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none">Beneficiary ID</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('8790729816-4@ybl');
                          alert('UPI ID Copied!');
                        }}
                        className="text-[8px] font-bold text-white bg-white/10 px-2 py-1 rounded-md"
                      >
                        COPY
                      </button>
                    </div>
                    <p className="font-mono text-sm font-black break-all">8790729816-4@ybl</p>
                  </div>

                  <button 
                    onClick={() => window.open(`upi://pay?pa=8790729816-4@ybl&pn=Local Bandi Multi Services&am=${finalAmountIncludingTip}&cu=INR`)}
                    className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    Open UPI App Automatically
                  </button>
                </div>


                {paymentConfig?.gatewayStatus === 'ManualLink' && paymentConfig?.accountNumber && (
                   <div className="mb-6 bg-slate-50 p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-slate-900 rounded-xl text-white">
                            <Landmark className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transfer to Bank</p>
                            <p className="text-sm font-black text-slate-900">{paymentConfig.bankName}</p>
                         </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
                         <div className="flex justify-between">
                            <p className="text-[9px] font-black uppercase text-slate-400">A/C Holder</p>
                            <p className="text-xs font-black text-slate-900">{paymentConfig.accountHolder}</p>
                         </div>
                         <div className="flex justify-between">
                            <p className="text-[9px] font-black uppercase text-slate-400">A/C Number</p>
                            <p className="text-xs font-black text-slate-900">{paymentConfig.accountNumber}</p>
                         </div>
                         <div className="flex justify-between">
                            <p className="text-[9px] font-black uppercase text-slate-400">IFSC Code</p>
                            <p className="text-xs font-black text-indigo-600 font-mono tracking-tighter">{paymentConfig.ifscCode}</p>
                         </div>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 mt-4 leading-relaxed italic text-center">
                         * Please share the screenshot of payment on WhatsApp after transfer for manual verification.
                      </p>
                   </div>
                 )}

                 <div className="space-y-4">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`w-full p-4 rounded-[2rem] border-2 transition-all relative ${
                          selectedMethod === method.id 
                          ? 'border-yellow-400 bg-yellow-50 shadow-md shadow-yellow-105/50' 
                          : 'border-gray-50 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div 
                          onClick={() => setSelectedMethod(method.id)}
                          className="flex items-center gap-4 cursor-pointer"
                        >
                          <div className={`p-3 rounded-2xl ${method.color} shadow-sm shrink-0`}>
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
                            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center ring-4 ring-yellow-101 shrink-0 animate-scale-in">
                              <CheckCircle2 className="w-4 h-4 text-gray-900" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Expandable Credit/Debit Card Fields */}
                        {selectedMethod === 'card' && method.id === 'card' && (
                          <div className="mt-4 p-4 border-t border-yellow-200/60 space-y-4 text-left">
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Secure Card Details</p>
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cardholder Name</label>
                              <input 
                                type="text"
                                placeholder="e.g. THARUN BANDI"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none font-bold text-xs shadow-sm transition-colors"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Card Number</label>
                              <input 
                                type="text"
                                maxLength={19}
                                placeholder="4111 2222 3333 4444"
                                value={cardNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                                  setCardNumber(formatted);
                                }}
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none font-bold text-xs shadow-sm transition-colors"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="grid grid-cols-1 gap-2">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                <input 
                                  type="text"
                                  maxLength={5}
                                  placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 2) {
                                      val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                    }
                                    setCardExpiry(val);
                                  }}
                                  className="w-full bg-white p-3 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none font-bold text-xs shadow-sm transition-colors text-center"
                                />
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">CVV</label>
                                <input 
                                  type="password"
                                  maxLength={4}
                                  placeholder="123"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                  className="w-full bg-white p-3 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none font-bold text-xs shadow-sm transition-colors text-center"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expandable UPI ID field for GPay/PhonePe/BHIM/UPI */}
                        {['gpay', 'phonepe', 'bhim', 'upi'].includes(selectedMethod) && ['gpay', 'phonepe', 'bhim', 'upi'].includes(method.id) && selectedMethod === method.id && (
                          <div className="mt-4 p-4 border-t border-yellow-200/60 space-y-3 text-left">
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">UPI Credentials</p>
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                                {selectedMethod === 'upi' ? 'Enter your UPI ID' : 'Enter your UPI ID (Optional)'}
                              </label>
                              <div className="relative">
                                <input 
                                  type="text"
                                  placeholder="e.g. tharun@upi"
                                  value={upiIdInput}
                                  onChange={(e) => setUpiIdInput(e.target.value)}
                                  className="w-full bg-white p-3 pr-16 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none font-bold text-xs shadow-sm transition-colors"
                                />
                                <span className="absolute right-3 top-3 text-[9px] font-black text-gray-400 select-none uppercase tracking-widest">Secure</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Net Banking Choice Bank Selection */}
                        {selectedMethod === 'nb' && method.id === 'nb' && (
                          <div className="mt-4 p-4 border-t border-yellow-200/60 space-y-3 text-left">
                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Net Banking securely</p>
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Choose Bank</label>
                              <select 
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="w-full bg-white p-3 rounded-xl border border-gray-200 focus:border-yellow-400 outline-none font-bold text-xs shadow-sm transition-colors"
                              >
                                <option value="">-- Select Bank --</option>
                                <option value="SBI">State Bank of India (SBI)</option>
                                <option value="HDFC">HDFC Bank</option>
                                <option value="ICICI">ICICI Bank</option>
                                <option value="AXIS">Axis Bank</option>
                                <option value="KOTAK">Kotak Mahindra Bank</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
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

              {paymentError && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-[10px] font-bold text-center italic">
                  {paymentError}
                </div>
              )}

              <div className="pb-6">
                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2.5rem] font-black shadow-2xl shadow-yellow-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg italic tracking-tight disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {processingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-6 text-white text-center"
          >
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-black italic uppercase tracking-tight">Processing Payment & Confirming Order...</h3>
            <p className="text-xs text-slate-300 font-medium max-w-xs mt-2">
              Please wait while your order details are securely recorded and transmitted. Do not close or refresh this page.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddressPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 italic">Select Address</h3>
                <button onClick={() => setShowAddressPicker(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {userProfile?.addresses?.map((addr: any) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setAddress({
                        name: addr.recipientName || userProfile.name || '',
                        phone: addr.phone || userProfile.phone || '',
                        details: addr.address || '',
                        area: currentLocation || '',
                        city: 'Khammam',
                        pincode: addr.pincode || ''
                      });
                      setShowAddressPicker(false);
                    }}
                    className="w-full p-6 rounded-3xl border border-gray-100 bg-gray-50 text-left hover:border-yellow-400 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-black text-gray-900">{addr.label}</p>
                      {addr.isDefault && <span className="text-[8px] font-black bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase">Default</span>}
                    </div>
                    <p className="text-xs font-bold text-gray-500 line-clamp-2">{addr.address}</p>
                    <p className="text-[10px] font-black text-gray-400 mt-2 italic">{addr.recipientName} • {addr.phone}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

