import React, { useState } from 'react';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Truck, Receipt, Tag, Ticket, Check, X, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, LanguageCode } from '../types';
import { translations } from '../translations';

interface CartProps {
  items: CartItem[];
  language: LanguageCode;
  onBack: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const VALID_PROMOS = [
  { id: 'LOKAL10', type: 'percent' as const, value: 10, label: '10% LOCAL DISCOUNT', minSubtotal: 0 },
  { id: 'WELCOME50', type: 'flat' as const, value: 50, label: '₹50 WELCOME OFFER', minSubtotal: 300 },
  { id: 'FREESHIP', type: 'shipping' as const, value: 0, label: 'FREE DELIVERY CODE', minSubtotal: 200 },
  { id: 'BHARATH', type: 'percent' as const, value: 15, label: '15% MISSION DISCOUNT', minSubtotal: 500 }
];

export default function Cart({ items, language, onBack, onUpdateQty, onRemove, onCheckout }: CartProps) {
  const t = translations[language].cart || translations['en-IN'].cart;
  const common = translations[language].common || translations['en-IN'].common;
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ id: string, type: 'percent' | 'flat' | 'shipping', value: number, label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Calculate discount
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') {
      discount = Math.round(subtotal * (appliedPromo.value / 100));
    } else if (appliedPromo.type === 'flat') {
      discount = Math.min(appliedPromo.value, subtotal);
    }
  }

  const taxes = Math.round((subtotal - discount) * 0.05);
  
  // Dynamic delivery charge logic
  const getDeliveryFee = () => {
    if (items.length === 0) return 0;
    if (appliedPromo?.type === 'shipping') return 0;
    
    let maxFee = 0;
    items.forEach(item => {
      let itemFee = 15; // Default rest of items
      
      const category = item.category.toLowerCase();
      const name = item.name.toLowerCase();
      
      if (category === 'groceries' || category === 'veg') {
        itemFee = 10;
      } else if (category === 'meat') {
        itemFee = 15;
      } else if (category === 'food') {
        const isTiffin = name.includes('idly') || name.includes('dosa') || name.includes('wada') || name.includes('chapati') || name.includes('tiffin');
        itemFee = isTiffin ? 15 : 20;
      } else if (category === 'water' || category === 'dairy') {
        itemFee = 0;
      } else if (['services', 'travel', 'marriage', 'events', 'construction', 'mechanics', 'maids'].includes(category)) {
        itemFee = 0;
      }
      
      if (itemFee > maxFee) maxFee = itemFee;
    });
    
    return maxFee;
  };

  const delivery = getDeliveryFee();
  const total = Math.max(0, subtotal - discount + taxes + delivery);

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    setPromoError(null);

    const foundPromo = VALID_PROMOS.find(p => p.id === code);

    if (!foundPromo) {
      setPromoError('Invalid promo code');
    } else if (subtotal < foundPromo.minSubtotal) {
      setPromoError(`Min. order of ₹${foundPromo.minSubtotal} required`);
    } else {
      setAppliedPromo({
        id: foundPromo.id,
        type: foundPromo.type,
        value: foundPromo.value,
        label: foundPromo.label
      });
      setPromoError(null);
    }

    if (!foundPromo || (foundPromo && subtotal < foundPromo.minSubtotal)) {
      setTimeout(() => setPromoError(null), 3000);
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-full w-full bg-white flex flex-col p-6 items-center justify-center text-center font-sans">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="absolute top-12 left-6 p-2 bg-gray-100 rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </motion.button>
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-yellow-50 w-40 h-40 rounded-[4rem] flex items-center justify-center mb-10 relative group"
        >
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              y: [0, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <ShoppingBag className="w-20 h-20 text-yellow-500 drop-shadow-xl" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-2 -right-2 bg-white p-4 rounded-3xl shadow-xl border border-yellow-100"
          >
            <Plus className="w-6 h-6 text-yellow-600" />
          </motion.div>
        </motion.div>

        <h3 className="text-3xl font-black text-gray-900 mb-2 italic font-display">{t.emptyTitle}</h3>
        <p className="text-gray-400 font-bold mb-10 max-w-[240px] leading-relaxed uppercase text-[10px] tracking-widest">{t.emptySub}</p>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-12 py-5 bg-gray-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 active:scale-95 transition-all text-xs"
        >
          {t.startShopping}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-50">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h2 className="text-xl font-black text-gray-900 flex-1">{t.title} ({items.length})</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-40">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-4 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
            >
              {item.image && <img src={item.image} className="w-24 h-24 rounded-2xl object-cover" alt={item.name} />}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-gray-900 leading-tight pr-6">{item.name}</h3>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-yellow-600 font-extrabold">₹{item.price}</p>
                    <span className="text-[10px] font-black text-gray-300 uppercase">× {item.quantity}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 bg-gray-50 w-max px-2 py-1.5 rounded-xl border border-gray-100">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onUpdateQty(item.id, -1)} 
                      className={`p-1 rounded-lg transition-colors ${item.quantity <= 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-white'}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </motion.button>
                    
                    <div className="w-6 flex justify-center">
                      <AnimatePresence mode="wait">
                        <motion.span 
                          key={item.quantity}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-sm font-black text-gray-900"
                        >
                          {item.quantity}
                        </motion.span>
                      </AnimatePresence>
                    </div>

                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onUpdateQty(item.id, 1)} 
                      className="p-1 text-gray-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                  <motion.p 
                    key={item.price * item.quantity}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="font-black text-gray-900"
                  >
                    ₹{item.price * item.quantity}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{t.deliveryOptions}</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center p-4 rounded-[2rem] border-2 border-yellow-400 bg-yellow-50 active:scale-95 transition-all">
              <Truck className="w-6 h-6 text-yellow-600 mb-2" />
              <span className="text-[10px] font-black uppercase text-yellow-700">Standard</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">Estimated Fee</span>
              <span className="text-sm font-black text-gray-900">₹{delivery}</span>
            </button>
            <button className="flex flex-col items-center p-4 rounded-[2rem] border-2 border-gray-100 bg-white opacity-50 cursor-not-allowed">
              <Zap className="w-6 h-6 text-gray-400 mb-2" />
              <span className="text-[10px] font-black uppercase text-gray-500">Express</span>
              <span className="text-sm font-black text-gray-400">Unavailable</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{t.promoCode}</h3>
          <div className="relative">
            <input 
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder={t.promoPlaceholder}
              disabled={!!appliedPromo}
              className={`w-full bg-gray-50 py-4 pl-12 pr-32 rounded-2xl font-bold placeholder:text-gray-300 outline-none border-2 transition-all ${
                promoError ? 'border-red-500 animate-shake' : 
                appliedPromo ? 'border-green-500 bg-green-50' : 'border-transparent focus:border-yellow-400'
              }`}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Ticket className={`w-5 h-5 ${appliedPromo ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            {!appliedPromo ? (
              <button 
                onClick={handleApplyPromo}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                {t.apply}
              </button>
            ) : (
              <button 
                onClick={() => { setAppliedPromo(null); setPromoCode(''); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-100 text-green-600 rounded-xl"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
          {promoError && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">{promoError}</p>}
          {appliedPromo && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{appliedPromo.label} APPLIED</span>
            </div>
          )}
        </section>

        {/* Delivery Fee Info */}
        <section className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Truck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-800">Delivery Fee Guide</h3>
              <p className="text-[8px] font-bold text-amber-600/60 uppercase">Local Khammam Delivery Charges</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { cat: 'Groceries', fee: '₹10', icon: '🛒' },
              { cat: 'Meat/Fish', fee: '₹15', icon: '🥩' },
              { cat: 'Fast Food', fee: '₹20', icon: '🍔' },
              { cat: 'Tiffins', fee: '₹15', icon: '🍱' },
              { cat: 'Milk/Water', fee: 'FREE', icon: '💧' },
              { cat: 'Services', fee: 'N/A', icon: '🛠️' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-white/80 p-2.5 rounded-2xl border border-amber-50 shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1.5">
                  <span className="text-[10px] grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                  {item.cat}
                </span>
                <span className={`text-[10px] font-black ${item.fee === 'FREE' ? 'text-emerald-500' : 'text-gray-900'}`}>{item.fee}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2 items-start bg-amber-100/30 p-3 rounded-xl border border-amber-200/20">
            <div className="mt-0.5">
              <Check className="w-3 h-3 text-amber-600" />
            </div>
            <p className="text-[9px] font-bold text-amber-800 leading-tight italic">
              Note: The highest applicable delivery fee among all categories in your cart is charged as a single flat fee.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 p-8 rounded-[2.5rem] space-y-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">{t.orderSummary}</h3>
          </div>
          
          {/* Detailed Item List in Summary */}
          <div className="space-y-3 pb-4 border-b border-gray-200">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700">{item.name}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">₹{item.price} × {item.quantity}</span>
                </div>
                <span className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-600 font-bold text-sm">
              <span>{t.subtotal}</span>
              <span>₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  <span>{t.discount} ({appliedPromo?.id})</span>
                </div>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 font-bold text-sm">
              <span>{t.taxes}</span>
              <span>₹{taxes}</span>
            </div>
            <div className="flex justify-between text-gray-600 font-bold text-sm">
              <span>{t.shipping}</span>
              <span className={delivery === 0 ? 'text-emerald-500' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
            </div>
          </div>

          <div className="h-px bg-gray-200 mt-2"></div>
          <div className="flex justify-between text-gray-900 font-black text-xl pt-2">
            <span>{t.grandTotal}</span>
            <motion.span 
              key={total}
              initial={{ scale: 1.1, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#ca8a04' }}
              className="text-yellow-600"
            >
              ₹{total}
            </motion.span>
          </div>
        </section>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0 z-10">
        <button 
          onClick={onCheckout}
          className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-xl shadow-gray-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          {t.checkout} - ₹{total}
        </button>
      </div>
    </div>
  );
}
