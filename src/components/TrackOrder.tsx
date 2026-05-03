import React from 'react';
import { ArrowLeft, MapPin, Truck, Package, CheckCircle, Clock, Bike, Star, Phone, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { LanguageCode } from '../types';
import { translations } from '../translations';

interface TrackOrderProps {
  orderId: string;
  onBack: () => void;
  language: LanguageCode;
}

export default function TrackOrder({ orderId, onBack, language }: TrackOrderProps) {
  const t = translations[language].tracking || translations['en-IN'].tracking;
  
  const steps = [
    { id: 'processing', label: t.processing, icon: Package, completed: true, current: false },
    { id: 'shipped', label: t.shipped, icon: Truck, completed: true, current: false },
    { id: 'transit', label: t.outForDelivery, icon: MapPin, completed: false, current: true },
    { id: 'delivered', label: t.delivered, icon: CheckCircle, completed: false, current: false },
  ];

  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - startPos.x,
      y: clientY - startPos.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900">{t.title}</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{orderId}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {/* Map View */}
        <div className="bg-gray-100 h-64 rounded-[2.5rem] mt-4 mb-8 relative overflow-hidden shadow-inner group">
          <img 
            src="https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=800&q=80" 
            className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-50 transition-opacity"
            alt="Map"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          
          {/* Animated Delivery Dot */}
          <motion.div 
            animate={{ 
              x: [100, 250, 200, 150],
              y: [150, 100, 180, 150]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute z-20"
          >
            <div className="relative">
              <motion.div 
                animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-yellow-400 rounded-full"
              />
              <div className="relative w-12 h-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center border-2 border-yellow-400 transform -rotate-12">
                <Bike className="w-6 h-6 text-gray-900" />
              </div>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded-lg text-[7px] font-black uppercase whitespace-nowrap shadow-xl">
                Moving towards you
              </div>
            </div>
          </motion.div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
             <MapPin className="w-12 h-12 text-rose-500" />
          </div>
        </div>

        {/* Live Partner Card */}
        <div className="bg-gray-900 rounded-[2.5rem] p-6 text-white mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400 rounded-full blur-[60px] opacity-20 transition-all group-hover:opacity-40"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Status</p>
              </div>
              <h3 className="text-2xl font-black italic tracking-tight">On the way</h3>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Estimated Arrival</p>
              <p className="text-xl font-black text-yellow-400">12 Mins</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10">
            <div className="relative">
              <img src="https://i.pravatar.cc/150?u=suresh" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20" alt="Partner" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black">Suresh Kumar</p>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-bold text-gray-300">4.9 • Super Partner</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
                <Phone className="w-4 h-4" />
              </button>
              <button className="w-11 h-11 bg-yellow-400 text-gray-900 rounded-2xl flex items-center justify-center hover:bg-yellow-500 transition-all active:scale-90">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="space-y-10 pl-6 border-l-2 border-gray-50 ml-6 relative mb-12">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div className={`absolute -left-[2.75rem] top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                step.completed ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 
                step.current ? 'bg-yellow-400 shadow-xl shadow-yellow-100 ring-4 ring-yellow-50 scale-110' : 'bg-gray-50 text-gray-300'
              }`}>
                {step.completed ? <CheckCircle className="w-4 h-4 text-white" /> : 
                 step.current ? <Bike className="w-4 h-4 text-gray-900" /> : 
                 <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />}
              </div>
              <div className="flex justify-between items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h4 className={`text-sm font-black ${step.current ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{step.completed ? 'Completed' : step.current ? 'Arriving' : 'Upcoming'}</p>
                </div>
                <Clock className={`w-4 h-4 ${step.current ? 'text-yellow-500' : 'text-gray-100'}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Details Section */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Order Details</h3>
          <div className="space-y-4">
            {[
              { name: 'Fresh Buffalo Milk', qty: 2, price: 160 },
              { name: 'Organic Tomatoes', qty: 1, price: 40 },
              { name: 'Chicken Curry Cut', qty: 1, price: 280 }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900">{item.name}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Qty: {item.qty} × ₹{item.price/item.qty}</span>
                </div>
                <span className="text-sm font-black text-gray-900">₹{item.price}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-gray-900 rounded-[2rem] p-6 text-white flex justify-between items-center shadow-xl shadow-gray-200">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Amount Paid</p>
              <p className="text-2xl font-black">₹495</p>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest">Paid via Wallet</span>
            </div>
          </div>
        </div>

        <button className="w-full mt-10 py-5 bg-gray-100 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3">
          Contact Delivery Partner
        </button>
      </div>
    </div>
  );
}
