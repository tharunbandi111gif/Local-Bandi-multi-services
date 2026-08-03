import React, { useState } from 'react';
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, Truck, Receipt, Tag, Ticket, Check, X, Zap, Sparkles, Plane, Car, MapPin, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, LanguageCode } from '../types';
import { translations } from '../translations';
import { getLocalizedProductName } from '../utils/localizedContent';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface CartProps {
  items: CartItem[];
  language: LanguageCode;
  onBack: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  selectedRewardId: string | null;
  onSelectReward: (rewardId: string | null) => void;
  promoCodes?: any[];
  isAdmin?: boolean;
  onUpdateCartItem?: (id: string, updatedFields: Partial<CartItem>) => void;
  rewardsList?: any[];
}

const DEFAULT_PROMOS = [
  { id: 'LOKAL10', type: 'percent' as const, value: 10, label: '10% LOCAL DISCOUNT', minSubtotal: 0 },
  { id: 'WELCOME50', type: 'flat' as const, value: 50, label: '₹50 WELCOME OFFER', minSubtotal: 300 },
  { id: 'FREESHIP', type: 'shipping' as const, value: 0, label: 'FREE DELIVERY CODE', minSubtotal: 200 }
];

export default function Cart({ items, language, onBack, onUpdateQty, onRemove, onCheckout, selectedRewardId, onSelectReward, promoCodes, isAdmin, onUpdateCartItem, rewardsList }: CartProps) {
  const t = translations[language].cart || translations['en-IN'].cart;
  const common = translations[language].common || translations['en-IN'].common;
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ id: string, type: 'percent' | 'flat' | 'shipping', value: number, label: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [showMonthlyConfirm, setShowMonthlyConfirm] = useState(false);
  const [selectedQuizTargetItemId, setSelectedQuizTargetItemId] = useState<string | null>(null);

  const itemsUnder100 = items.filter(item => item.price < 100);

  React.useEffect(() => {
    if (itemsUnder100.length > 0 && !selectedQuizTargetItemId) {
      setSelectedQuizTargetItemId(itemsUnder100[0].id);
    }
  }, [items, selectedQuizTargetItemId]);

  const isMonthlyPlanEligible = (item: CartItem) => {
    const category = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return (
      name.includes('milk') || 
      name.includes('water') || 
      name.includes('driver') || 
      name.includes('maid') || 
      name.includes('beauty') || 
      name.includes('parlor') || 
      name.includes('mechanic') || 
      category === 'water' || 
      category === 'dairy' || 
      category === 'milk' || 
      category === 'services' || 
      category === 'mechanics' || 
      category === 'maids'
    );
  };

  const getItemCartPrice = (item: CartItem) => {
    const base = item.price * item.quantity;
    if (item.isMonthlySubscription) {
      return base * 30; // 30 days subscription total
    }
    return base;
  };

  const subtotal = items.reduce((acc, item) => acc + getItemCartPrice(item), 0);

  const promosToUse = promoCodes && promoCodes.length > 0 ? promoCodes : DEFAULT_PROMOS;

  // Sorting items by price (Lowest First)
  const sortedItems = [...items].sort((a, b) => a.price - b.price);

  // Rewards logic
  const [rewardsUnder15, setRewardsUnder15] = useState(() => [
    { id: 'icecream_cup', name: 'Ice Cream Cup', originalPrice: 15, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=100&h=100&fit=crop' },
    { id: 'fivestar', name: '5-Star Chocolate', originalPrice: 10, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100&h=100&fit=crop' },
    { id: 'munch', name: 'Munch Large', originalPrice: 15, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=100&h=100&fit=crop' }
  ]);

  const [rewardsUnder40, setRewardsUnder40] = useState(() => [
    { id: 'sugar_500g', name: 'Sugar 1/2 KG', originalPrice: 28, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=100&h=100&fit=crop' },
    { id: 'oil_250ml', name: 'Cooking Oil 250ml', originalPrice: 40, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbad88c5?w=100&h=100&fit=crop' },
    { id: 'pooja_samagri', name: 'Pooja Samagri Kit', originalPrice: 35, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1582236371565-491d40a59719?w=100&h=100&fit=crop' },
    { id: 'sprite_500ml', name: 'Cool Drink 500ml', originalPrice: 40, rewardPrice: 1, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&h=100&fit=crop' }
  ]);

  React.useEffect(() => {
    if (rewardsList && rewardsList.length > 0) {
      setRewardsUnder15(rewardsList.filter(r => Number(r.originalPrice || 0) < 25));
      setRewardsUnder40(rewardsList.filter(r => Number(r.originalPrice || 0) >= 25));
    }
  }, [rewardsList]);

  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editRewardName, setEditRewardName] = useState('');
  const [editRewardOriginal, setEditRewardOriginal] = useState(0);
  const [editRewardPromo, setEditRewardPromo] = useState(0);
  const [editRewardImage, setEditRewardImage] = useState('');

  const handleDeleteReward = async (rewardId: string) => {
    if (!window.confirm("Are you sure you want to delete this promotional reward item?")) return;
    try {
      if (db) {
        await deleteDoc(doc(db, 'rewards', rewardId));
      }
    } catch (e) {
      console.error("Failed to delete reward from Firestore:", e);
    }
    setRewardsUnder15(prev => prev.filter(r => r.id !== rewardId));
    setRewardsUnder40(prev => prev.filter(r => r.id !== rewardId));
    if (selectedRewardId === rewardId) {
      onSelectReward(null);
    }
  };

  const handleStartEditReward = (reward: any) => {
    setEditingRewardId(reward.id);
    setEditRewardName(reward.name);
    setEditRewardOriginal(reward.originalPrice);
    setEditRewardPromo(reward.rewardPrice);
    setEditRewardImage(reward.img || reward.image || '');
  };

  const handleSaveReward = async () => {
    const finalImg = editRewardImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
    try {
      if (db && editingRewardId) {
        await updateDoc(doc(db, 'rewards', editingRewardId), {
          name: editRewardName,
          originalPrice: Number(editRewardOriginal || 0),
          rewardPrice: Number(editRewardPromo || 0),
          img: finalImg
        });
      }
    } catch (e) {
      console.error("Failed to save reward to Firestore:", e);
    }
    setRewardsUnder15(prev => prev.map(r => r.id === editingRewardId ? { ...r, name: editRewardName, originalPrice: Number(editRewardOriginal || 0), rewardPrice: Number(editRewardPromo || 0), img: finalImg } : r));
    setRewardsUnder40(prev => prev.map(r => r.id === editingRewardId ? { ...r, name: editRewardName, originalPrice: Number(editRewardOriginal || 0), rewardPrice: Number(editRewardPromo || 0), img: finalImg } : r));
    setEditingRewardId(null);
  };

  let applicableRewards = [];
  if (subtotal >= 899) {
    applicableRewards = [...rewardsUnder40, ...rewardsUnder15];
  } else if (subtotal >= 299) {
    applicableRewards = rewardsUnder15;
  }

  const selectedReward = selectedRewardId ? [...rewardsUnder15, ...rewardsUnder40].find(r => r.id === selectedRewardId) : null;
  const rewardCost = selectedReward ? selectedReward.rewardPrice : 0;

  // Calculate discount
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.id.startsWith('QUIZ') || ['QUIZ25OFF', 'QUIZ15OFF', 'QUIZ08OFF'].includes(appliedPromo.id)) {
      // Quiz Coupon: applies % discount to ONLY 1 product priced below ₹100
      const targetItem = items.find(i => i.id === selectedQuizTargetItemId && i.price < 100) || itemsUnder100[0];
      if (targetItem) {
        discount = Math.round(targetItem.price * (appliedPromo.value / 100));
      }
    } else if (appliedPromo.type === 'percent') {
      discount = Math.round(subtotal * (appliedPromo.value / 100));
    } else if (appliedPromo.type === 'flat') {
      discount = Math.min(appliedPromo.value, subtotal);
    }
  }

  const taxes = 0;
  
  const isMilkOrWater = (item: CartItem) => {
    const name = (item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    return name.includes('milk') || name.includes('water') || category === 'water' || category === 'dairy' || category === 'milk';
  };

  // Dynamic delivery charge logic
  const getDeliveryFee = () => {
    if (items.length === 0) return 0;
    if (appliedPromo?.id === 'FREESHIP' || appliedPromo?.type === 'shipping') return 0;
    
    const milkWaterItems = items.filter(isMilkOrWater);
    const otherItems = items.filter(item => !isMilkOrWater(item));
    
    let baseFee = 0;
    
    if (otherItems.length > 0) {
      if (subtotal >= 469) {
        baseFee = 0;
      } else {
        let maxFee = 0;
        otherItems.forEach(item => {
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
          } else if (['services', 'travel', 'marriage', 'events', 'construction', 'mechanics', 'maids'].includes(category)) {
            itemFee = 0;
          }
          
          if (itemFee > maxFee) maxFee = itemFee;
        });
        baseFee = maxFee;
      }
    }
    
    let milkWaterFee = 0;
    if (milkWaterItems.length > 0) {
      const hasSingleMilkWater = milkWaterItems.some(item => !item.isMonthlySubscription);
      if (hasSingleMilkWater) {
        milkWaterFee = 5;
      }
    }
    
    return baseFee + milkWaterFee;
  };

  const delivery = getDeliveryFee();
  const total = Math.max(0, subtotal - discount + taxes + delivery + rewardCost);

  const QUIZ_COUPONS: Record<string, number> = {
    'QUIZ25OFF': 25,
    'QUIZ15OFF': 15,
    'QUIZ08OFF': 8
  };

  const handleApplyPromo = () => {
    const userInput = promoCode.toUpperCase().trim();
    setPromoError(null);

    // Explicitly handle Spin Wheel 1st Order Delivered Coupons (e.g. SPIN15OFF, SPIN10OFF)
    if (userInput.startsWith('SPIN')) {
      if (subtotal < 599) {
        setPromoError('Min. order subtotal of ₹599 required to apply Spin Wheel Coupon!');
        return;
      }
      const matchedPct = parseInt(userInput.replace(/\D/g, ''), 10) || 15;
      const finalDiscountPct = Math.min(15, Math.max(0, matchedPct));
      setAppliedPromo({
        id: userInput,
        type: 'percent',
        value: finalDiscountPct,
        label: `${userInput} (${finalDiscountPct}% OFF)`
      });
      setPromoError(null);
      return;
    }

    // Explicitly handle 40-sec Quiz coupons
    if (QUIZ_COUPONS[userInput] !== undefined) {
      if (subtotal < 499) {
        setPromoError('Min. order subtotal of ₹499 required to apply Quiz Coupon!');
        return;
      }
      if (itemsUnder100.length === 0) {
        setPromoError('Add at least 1 product priced below ₹100 to apply Quiz Coupon!');
        return;
      }
      const quizDiscountPct = QUIZ_COUPONS[userInput];
      setAppliedPromo({
        id: userInput,
        type: 'percent',
        value: quizDiscountPct,
        label: `${userInput} (${quizDiscountPct}% OFF on 1 Item < ₹100)`
      });
      if (!selectedQuizTargetItemId && itemsUnder100.length > 0) {
        setSelectedQuizTargetItemId(itemsUnder100[0].id);
      }
      setPromoError(null);
      return;
    }

    const foundPromo = promosToUse.find(p => (p.code || p.id) === userInput && p.status !== 'Inactive');

    if (!foundPromo) {
      setPromoError('Invalid or expired promo code');
    } else if (foundPromo.minOrderAmount && subtotal < foundPromo.minOrderAmount) {
      setPromoError(`Min. order of ₹${foundPromo.minOrderAmount} required`);
    } else if (foundPromo.expiryDate && new Date(foundPromo.expiryDate) < new Date()) {
      setPromoError('Promo code has expired');
    } else if (foundPromo.usageLimit && foundPromo.usageCount >= foundPromo.usageLimit) {
      setPromoError('Promo code usage limit reached');
    } else {
      setAppliedPromo({
        id: foundPromo.id,
        type: foundPromo.type === 'percentage' ? 'percent' : (foundPromo.type === 'fixed' ? 'flat' : foundPromo.type),
        value: foundPromo.value,
        label: `${foundPromo.code} Applied`
      });
      setPromoError(null);
    }

    if (promoError) {
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
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
             <Plane className="w-5 h-5 text-gray-400" />
             <span className="text-[7px] font-black text-gray-300 uppercase tracking-tighter">Flights</span>
          </div>
          <div className="flex flex-col items-center">
             <Car className="w-5 h-5 text-gray-400" />
             <span className="text-[7px] font-black text-gray-300 uppercase tracking-tighter">Cabs</span>
          </div>
          <div className="flex flex-col items-center">
             <MapPin className="w-5 h-5 text-indigo-400" />
             <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter">Travel</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-40">
        <AnimatePresence>
          {sortedItems.map((item) => (
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
                    {isAdmin ? (
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => onUpdateCartItem?.(item.id, { name: e.target.value })}
                        className="font-extrabold text-gray-900 leading-tight pr-6 bg-slate-50 border border-indigo-200 rounded-lg p-1 w-full text-xs focus:ring-1 focus:ring-indigo-500 mr-2"
                        placeholder="Item Name"
                      />
                    ) : (
                      <h3 className="font-extrabold text-gray-900 leading-tight pr-6">{getLocalizedProductName(item.name, language)}</h3>
                    )}
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isAdmin ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-indigo-500 font-black">Price: ₹</span>
                        <input 
                          type="number"
                          value={item.price}
                          onChange={(e) => onUpdateCartItem?.(item.id, { price: Number(e.target.value || 0) })}
                          className="w-16 font-extrabold text-yellow-600 bg-slate-50 border border-indigo-200 rounded-lg p-1 text-xs text-center focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <p className="text-yellow-600 font-extrabold text-xs">
                          {item.isMonthlySubscription ? `₹${item.price * 30} / Month` : `₹${item.price}`}
                        </p>
                        {item.isMonthlySubscription && (
                          <span className="text-[8px] font-bold text-gray-400 uppercase">
                            (Daily Service Base: ₹{item.price})
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[10px] font-black text-gray-300 uppercase">× {item.quantity}</span>
                  </div>
                  
                  {isMonthlyPlanEligible(item) && (
                    <div className="mt-2.5 bg-indigo-50/70 p-2.5 rounded-2xl border border-indigo-100 flex flex-col gap-1.5 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-indigo-805 tracking-wider">Plan Delivery Offer</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {item.isMonthlySubscription ? 'FREE DELIVERY' : '₹5 Single Delivery'}
                        </span>
                      </div>
                      <div className="flex gap-2.5">
                        <button 
                          type="button"
                          onClick={() => onUpdateCartItem?.(item.id, { isMonthlySubscription: false })}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                            !item.isMonthlySubscription 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                              : 'bg-white text-indigo-700 border border-indigo-100 hover:bg-indigo-50/50'
                          }`}
                        >
                          Single Order
                        </button>
                        <button 
                          type="button"
                          onClick={() => onUpdateCartItem?.(item.id, { isMonthlySubscription: true })}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                            item.isMonthlySubscription 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                              : 'bg-white text-indigo-700 border border-indigo-100 hover:bg-indigo-50/50'
                          }`}
                        >
                          Monthly (30 Days)
                        </button>
                      </div>
                    </div>
                  )}
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

        {/* Low Price Challenge / Rewards Section */}
        {applicableRewards.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Low Price Challenge
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase tracking-widest">
                {subtotal >= 899 ? 'Win 2 Items' : 'Win 1 Item'}
              </span>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
              {applicableRewards.map((reward) => (
                <div key={reward.id} className="relative group flex-shrink-0">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectReward(selectedRewardId === reward.id ? null : reward.id)}
                    className={`w-32 p-3 rounded-3xl border-2 transition-all relative overflow-hidden ${
                      selectedRewardId === reward.id 
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' 
                      : 'border-gray-100 bg-white opacity-80'
                    }`}
                  >
                    <img src={reward.img} alt={reward.name} className="w-full h-16 rounded-xl object-cover mb-2" />
                    <p className="text-[9px] font-black leading-tight text-gray-900 h-6 line-clamp-2">{reward.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[8px] font-bold text-gray-400 line-through">₹{reward.originalPrice}</span>
                      <span className="text-xs font-black text-emerald-600">₹{reward.rewardPrice}</span>
                    </div>
                    {selectedRewardId === reward.id && (
                      <div className="absolute top-2 right-2 p-1 bg-emerald-500 rounded-full text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </motion.div>

                  {/* Admin Control Badges */}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-1 z-10 bg-white/95 p-1 rounded-xl shadow-lg border border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditReward(reward);
                        }}
                        className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center"
                        title="Edit Reward"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReward(reward.id);
                        }}
                        className="p-1 bg-red-500 hover:bg-red-400 text-white rounded-lg flex items-center justify-center"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Admin Active Editing Panel */}
            {isAdmin && editingRewardId && (
              <div className="p-4 bg-indigo-50/80 border border-indigo-200/50 rounded-2xl space-y-3 shadow-inner">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Overwrite Challenge Reward
                  </h4>
                  <button 
                    onClick={() => setEditingRewardId(null)} 
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-3">
                    <label className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Reward Name / Title</label>
                    <input 
                      type="text" 
                      value={editRewardName} 
                      onChange={(e) => setEditRewardName(e.target.value)} 
                      className="w-full bg-white text-xs font-bold p-2.5 rounded-xl border border-indigo-100 text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Original ₹</label>
                    <input 
                      type="number" 
                      value={editRewardOriginal} 
                      onChange={(e) => setEditRewardOriginal(Number(e.target.value || 0))} 
                      className="w-full bg-white text-xs font-bold p-2.5 rounded-xl border border-indigo-100 text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-indigo-500 tracking-wider">Challenge ₹</label>
                    <input 
                      type="number" 
                      value={editRewardPromo} 
                      onChange={(e) => setEditRewardPromo(Number(e.target.value || 0))} 
                      className="w-full bg-white text-xs font-bold p-2.5 rounded-xl border border-indigo-100 text-slate-800 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleSaveReward}
                      className="w-full py-2.5 bg-indigo-600 font-black hover:bg-indigo-500 text-white rounded-xl text-[9px] uppercase tracking-widest text-center shadow-md active:scale-95 transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[10px] font-bold text-emerald-800 leading-relaxed italic">
                {subtotal >= 899 
                  ? "Exclusive Level: You unlocked the ₹40 segment items for just ₹1! Challenge mandatory." 
                  : "Level Unlocked: Add any item above for just ₹1 with your current bill!"}
              </p>
            </div>
          </section>
        )}

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

          {/* Target Product Selection for Quiz Coupons */}
          {appliedPromo && (appliedPromo.id.startsWith('QUIZ') || ['QUIZ25OFF', 'QUIZ15OFF', 'QUIZ08OFF'].includes(appliedPromo.id)) && itemsUnder100.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300/80 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                  Select 1 Product Under ₹100 for {appliedPromo.value}% Discount
                </span>
                <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  Quiz Special
                </span>
              </div>

              <p className="text-[10px] text-amber-900 leading-relaxed font-medium">
                Your <strong>{appliedPromo.value}% OFF Quiz Discount</strong> applies to <strong>ONLY ONE product priced below ₹100</strong>. Choose your item below:
              </p>

              <div className="space-y-1.5">
                {itemsUnder100.map(item => {
                  const isSelected = item.id === (selectedQuizTargetItemId || itemsUnder100[0]?.id);
                  const itemDiscount = Math.round(item.price * (appliedPromo.value / 100));
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedQuizTargetItemId(item.id)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100/90 border-amber-500 shadow-sm font-bold text-slate-900'
                          : 'bg-white border-amber-200/60 text-slate-700 hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {item.image && <img src={item.image} className="w-8 h-8 rounded-lg object-cover" alt="" />}
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{getLocalizedProductName(item.name, language)}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Original: ₹{item.price}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-emerald-600 font-mono block">
                          -₹{itemDiscount} OFF
                        </span>
                        {isSelected && (
                          <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-800 bg-amber-300/60 px-1.5 py-0.5 rounded">
                            Applied
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="text-[9.5px] text-amber-800/90 font-mono italic pt-1 border-t border-amber-200/60">
                * Offer Terms: Min order subtotal ₹499 required. Coupon applies exclusively to 1 product &lt; ₹100.
              </div>
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
            {sortedItems.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700">{getLocalizedProductName(item.name, language)}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">₹{item.price} × {item.quantity}</span>
                </div>
                <span className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
            {selectedReward && (
              <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {selectedReward.name} (Reward)
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600/40 uppercase tracking-tighter line-through">₹{selectedReward.originalPrice}</span>
                </div>
                <span className="text-sm font-black text-emerald-600">₹{selectedReward.rewardPrice}</span>
              </div>
            )}
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
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const hasMonthly = items.some(item => item.isMonthlySubscription);
            if (hasMonthly) {
              setShowMonthlyConfirm(true);
            } else {
              onCheckout();
            }
          }}
          className="w-full relative overflow-hidden group py-5 bg-gray-900 text-white rounded-[2.5rem] font-black shadow-2xl shadow-gray-300 flex items-center justify-between px-8 active:scale-95 transition-all cursor-pointer"
        >
          {/* Subtle animated gradient overlay */}
          <motion.div 
            animate={{ 
              x: ['-100%', '200%'],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear",
              repeatDelay: 1
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
          />
          
          <div className="flex flex-col items-start relative z-10">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 group-hover:text-yellow-400 transition-colors">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm uppercase tracking-widest">{t.checkout}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 mx-4 hidden sm:block" />

          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              key={total}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-black text-yellow-400 flex items-center gap-1"
            >
              <span className="text-xs text-yellow-400/60 font-bold">₹</span>
              {total}
            </motion.div>
            <div className="bg-white/10 p-2 rounded-full group-hover:bg-yellow-400 group-hover:text-gray-900 transition-all duration-300">
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Monthly Plan Confirmation Dialog Modal overlay */}
      <AnimatePresence>
        {showMonthlyConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-6 overflow-hidden relative shadow-2xl font-sans"
            >
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
                Verify Monthly Basis Subscription
              </h3>
              
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-4 bg-indigo-50/50 py-1.5 px-3 rounded-lg w-max">
                Pre-Payment Authorization Required
              </p>

              <div className="space-y-3 max-h-60 overflow-y-auto mb-6 pr-1">
                {items.filter(item => item.isMonthlySubscription).map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 uppercase">{getLocalizedProductName(item.name, language)}</p>
                      <p className="text-[9px] font-bold text-slate-400">₹{item.price}/day × 30 days subscription</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-indigo-600">₹{item.price * item.quantity * 30}</p>
                      <p className="text-[9px] font-bold text-slate-400">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-[10px] text-amber-800 font-semibold mb-6 leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-1">🚨 Direct Advanced Prepayment:</span>
                As requested, subscription services require advanced payment for the chosen month first. Completed daily deliveries can be tracked on your monthly calendar dashboard.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMonthlyConfirm(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Modify Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthlyConfirm(false);
                    onCheckout();
                  }}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                >
                  Agree & Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
