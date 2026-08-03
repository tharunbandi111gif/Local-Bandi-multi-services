import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Package, MapPin, Share2, Home, Bike, Phone, MessageSquare, Navigation, Sparkles, Trophy, Zap } from 'lucide-react';
import { CartItem } from '../types';
import LiveMap from './LiveMap';
import { SpinWheelModal } from './SpinWheelModal';

interface OrderConfirmationProps {
  items: CartItem[];
  orderId: string;
  onHome: () => void;
}

export default function OrderConfirmation({ items, orderId, onHome }: OrderConfirmationProps) {
  const [riderPos, setRiderPos] = useState<[number, number]>([17.2505, 80.1450]);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const vendorPos: [number, number] = [17.2473, 80.1514];
  const customerPos: [number, number] = [17.2550, 80.1600];
  
  const total = items.reduce((acc, item) => {
    const base = item.price * item.quantity;
    return acc + (item.isMonthlySubscription ? base * 30 : base);
  }, 0);
  const finalTotal = Math.round(total * 1.05) + (total > 500 ? 0 : 40);

  useEffect(() => {
    const interval = setInterval(() => {
      setRiderPos(prev => {
        const dLat = (customerPos[0] - prev[0]) * 0.05;
        const dLng = (customerPos[1] - prev[1]) * 0.05;
        return [prev[0] + dLat, prev[1] + dLng];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: 'Lokal SOS - Order Confirmed! 🚀',
      text: `Just placed an order ${orderId} on Lokal SOS for ₹${finalTotal}! Super fast 15-min delivery for medicines, water & more in our community. Join the Lokal revolution!`,
      url: window.location.origin
    };

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} \n\nCheck it out here: ${shareData.url}`);
        alert("Link copied to clipboard! Share it with your friends.");
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col font-sans">
      <header className="px-6 pt-12 pb-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 italic tracking-tight">Order Confirmed</h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Arriving in 22 mins</p>
          </div>
        </div>
        <button onClick={onHome} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Home className="w-6 h-6 text-gray-900" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Tracking Map Card */}
        <section id="live-map-section" className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Tracking</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400">Rider is on the way</span>
            </div>
          </div>
          
          <div className="h-80 w-full rounded-[3rem] overflow-hidden shadow-xl border-4 border-white relative group">
            <LiveMap riderLoc={riderPos} vendorLoc={vendorPos} customerLoc={customerPos} interactive={true} />
            
            <div className="absolute bottom-6 left-6 right-6 z-[1000]">
              <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bike className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-900">Ravi Shankar</p>
                  <p className="text-[10px] font-bold text-gray-500">Yamaha MT-15 • AP 39 AX 1234</p>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Order Details */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="text-center pb-4 border-b border-gray-50">
            <span className="px-3.5 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full">
              Woohoo! Placed Successfully 🎉
            </span>
            <p className="text-xs text-gray-500 font-bold mt-2 font-sans">
              Your order is booked and locked on the decentralised dispatch grid. Keep a watch on delivery updates.
            </p>
          </div>

          {/* 1ST ORDER DELIVERED SPIN & WIN BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-5 border border-amber-400/40 shadow-xl space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[9px] font-black uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-spin" />
                <span>1st Order Delivered Reward</span>
              </div>
              <span className="text-[9.5px] font-mono font-extrabold text-amber-300">100% Free Wheel</span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                🎰 SPIN &amp; WIN TO FREE 100%!
              </h3>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5">
                Spin the lucky round wheel to unlock your exclusive delivered order reward!
              </p>
            </div>

            <button
              onClick={() => setShowSpinWheel(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>SPIN LUCKY WHEEL NOW</span>
            </button>
          </div>

          <div className="flex items-center justify-between pb-6 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                <h4 className="text-lg font-black text-gray-900 italic tracking-tighter">#{orderId}</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</p>
              <h4 className="text-lg font-black text-yellow-600 italic tracking-tighter">₹{finalTotal}</h4>
            </div>
          </div>

          {/* SUMMARY OF ITEMS ORDERED */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Summary of Items Ordered</h4>
            <div className="divide-y divide-gray-50">
              {items && items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5.5 h-5.5 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-[10px]">{item.quantity}x</span>
                    <span className="font-bold text-gray-800 uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="font-black text-gray-700 font-mono">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Address</p>
                <p className="text-sm font-bold text-gray-900 leading-relaxed">Flat 402, Sai Residency, Opp. NTR Park, Khammam - 507001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Only Monthly plan chosen customers activation callback request section */}
        {items.some(i => i.isMonthlySubscription) && (
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/20 rounded-[2.5rem] p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-300 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Phone className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-slate-100">Monthly Plan Chosen</h4>
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Verification ID: #{orderId}</p>
              </div>
            </div>
            <p className="text-[11px] text-indigo-150 leading-relaxed font-semibold text-slate-300">
              Only monthly basis plans chosen customer can should inform to customer service or request a callback for final service activation slot times and subscription verification.
            </p>
            <div className="flex gap-2.5 pt-1.5 font-sans">
              <a 
                href="mailto:Localbandimultiservices@gmail.com?subject=Monthly Subscription Activation Request&body=Hi support, I have subscribed copy of Order ID: #{orderId}. Please call me back to confirm slot, delivery times, and activate my monthly direct program." 
                className="flex-1 py-3 text-center bg-transparent border-2 border-indigo-500/20 text-white font-black text-[9px] uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
              >
                Call / Contact Service
              </a>
              <button 
                onClick={() => {
                  alert("✓ Callback requested successfully! Customer support will reach you via Localbandimultiservices@gmail.com or call within morning daily slots 9:20 AM to 5:00 PM.");
                }}
                className="flex-1 py-3 bg-yellow-400 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl shadow-lg cursor-pointer hover:bg-yellow-350 active:scale-95 transition-all text-center"
              >
                Request Callback
              </button>
            </div>
          </div>
        )}

        <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-xl font-black italic tracking-tighter mb-2">Invite Friends, Get ₹50</h4>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-[0.2em] mb-6">Your Referral Code: BH-WIN-50</p>
            <button className="px-8 py-4 bg-yellow-400 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              Share Now
            </button>
          </div>
          <Navigation className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
        <button 
          onClick={() => {
            alert("✓ Connecting to Lokal Live Dispatch network... Active order tracker initialized!");
            const trackingEl = document.getElementById('live-map-section');
            if (trackingEl) {
              trackingEl.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="w-full py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
        >
          <Bike className="w-4 h-4 animate-bounce" />
          <span>Track Order</span>
        </button>

        <button 
          onClick={handleShare}
          className="w-full py-4.5 bg-yellow-50 border-2 border-yellow-105 text-yellow-700 hover:bg-yellow-100 rounded-[2rem] font-black flex items-center justify-center gap-2.5 active:scale-95 transition-all text-xs uppercase"
        >
          <Share2 className="w-4 h-4" />
          Share with Neighbors
        </button>

        <button 
          onClick={onHome}
          className="w-full py-4.5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl shadow-gray-200 active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          Return to Home
        </button>
      </div>

      <SpinWheelModal
        isOpen={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
      />
    </div>
  );
}
