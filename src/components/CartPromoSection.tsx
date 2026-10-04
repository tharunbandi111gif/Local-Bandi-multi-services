import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Sparkles, 
  Clock, 
  X, 
  ArrowRight,
  Percent,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, LanguageCode } from '../types';
import { isGoldenHourActive, getNextGoldenHourSlotText } from '../types/attractionCampaigns';

export interface AppliedPromoData {
  id: string;
  type: 'percent' | 'flat' | 'shipping';
  value: number;
  label: string;
}

interface CartPromoSectionProps {
  subtotal: number;
  items: CartItem[];
  appliedPromo: AppliedPromoData | null;
  onApplyPromo: (promo: AppliedPromoData) => void;
  onRemovePromo: () => void;
  promosList?: any[];
  language?: LanguageCode;
}

export interface ValidationFeedback {
  status: 'idle' | 'valid' | 'warning' | 'invalid';
  message: string;
  promo?: AppliedPromoData;
  potentialDiscount?: number;
  minRequired?: number;
  amountNeeded?: number;
}

const POPULAR_PROMOS = [
  { 
    code: 'LOKAL10', 
    type: 'percent' as const, 
    value: 10, 
    minSpend: 0, 
    desc: '10% instant off on your order' 
  },
  { 
    code: 'WELCOME50', 
    type: 'flat' as const, 
    value: 50, 
    minSpend: 300, 
    desc: '₹50 Flat OFF on orders above ₹300' 
  },
  { 
    code: 'FREESHIP', 
    type: 'shipping' as const, 
    value: 0, 
    minSpend: 200, 
    desc: 'Free delivery on orders above ₹200' 
  },
  { 
    code: 'BANDI100', 
    type: 'flat' as const, 
    value: 100, 
    minSpend: 399, 
    desc: '₹100 Mega Discount on orders above ₹399' 
  },
  { 
    code: 'GOLDEN50', 
    type: 'percent' as const, 
    value: 50, 
    minSpend: 99, 
    desc: '50% Golden Hour Flash Drop (Max ₹50)' 
  }
];

export const CartPromoSection: React.FC<CartPromoSectionProps> = ({
  subtotal,
  items,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  promosList
}) => {
  const [inputValue, setInputValue] = useState(appliedPromo?.id || '');
  const [isFocused, setIsFocused] = useState(false);

  // Sync input if appliedPromo changes externally
  useEffect(() => {
    if (appliedPromo) {
      setInputValue(appliedPromo.id);
    }
  }, [appliedPromo]);

  const isGoldenHourItem = (item: CartItem) => {
    try {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      return (
        item.id.startsWith('flash-') ||
        (item as any).isFlashDrop === true ||
        name.includes('floor cleaner') ||
        name.includes('dish wash') ||
        name.includes('fabric conditioner') ||
        cat.includes('golden') ||
        cat.includes('flash')
      );
    } catch {
      return false;
    }
  };

  // Real-time validation computation based on current input and subtotal
  const validation: ValidationFeedback = useMemo(() => {
    const raw = inputValue.toUpperCase().trim();
    if (!raw) {
      return {
        status: 'idle',
        message: 'Enter promo code to apply instant savings'
      };
    }

    // Check GOLDEN50 / Flash Rush
    if (['GOLDEN50', 'FLASHRUSH50', 'FLASH50', 'FLAT50', 'FLASHRUSH', 'GOLDENHOUR', 'GOLDENHOUR50'].includes(raw)) {
      if (!isGoldenHourActive()) {
        return {
          status: 'warning',
          message: `⏰ Golden Hour slot is currently closed. Active 6-8 AM & 4-7 PM everyday. (${getNextGoldenHourSlotText()})`
        };
      }
      const qualifying = items.filter(isGoldenHourItem);
      if (qualifying.length === 0) {
        return {
          status: 'warning',
          message: '🛍️ Add at least 1 Golden Hour item (e.g. Floor Cleaner, Dish Wash) to use this code.'
        };
      }
      if (subtotal < 99) {
        const needed = 99 - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to activate 50% Golden Hour Drop (Min ₹99 required).`,
          minRequired: 99,
          amountNeeded: needed
        };
      }
      const flashTotal = qualifying.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const discount = Math.min(50, Math.round(flashTotal * 0.5));
      return {
        status: 'valid',
        message: `🎉 Valid! Flat 50% Golden Hour Drop will save ₹${discount} on your qualifying items!`,
        potentialDiscount: discount,
        promo: {
          id: raw,
          type: 'percent',
          value: 50,
          label: `${raw} (Flat 50% Golden Hour Drop)`
        }
      };
    }

    // Check FREEDEL75 / FREESHIP
    if (['FREEDEL75', 'FREESHIP'].includes(raw)) {
      const minSpend = raw === 'FREESHIP' ? 200 : 0;
      if (subtotal < minSpend) {
        const needed = minSpend - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to qualify for Free Delivery (Min ₹${minSpend}).`,
          minRequired: minSpend,
          amountNeeded: needed
        };
      }
      return {
        status: 'valid',
        message: '🚚 Valid! Free standard delivery will be unlocked for this order.',
        promo: {
          id: raw,
          type: 'shipping',
          value: 0,
          label: `${raw} (Free Delivery Unlocked)`
        }
      };
    }

    // Check BANDI100
    if (raw === 'BANDI100') {
      if (subtotal < 399) {
        const needed = 399 - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to qualify for ₹100 Flat Off (Min ₹399).`,
          minRequired: 399,
          amountNeeded: needed
        };
      }
      return {
        status: 'valid',
        message: '🎉 Valid! Instant ₹100 flat discount will be deducted from your bill.',
        potentialDiscount: 100,
        promo: {
          id: raw,
          type: 'flat',
          value: 100,
          label: `${raw} (Flat ₹100 Local Bandi Reward)`
        }
      };
    }

    // Check BIRYANI99
    if (raw === 'BIRYANI99') {
      if (subtotal < 199) {
        const needed = 199 - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more for Biryani Feast Offer (Min ₹199).`,
          minRequired: 199,
          amountNeeded: needed
        };
      }
      return {
        status: 'valid',
        message: '🍗 Valid! ₹45 Biryani Feast discount ready to apply.',
        potentialDiscount: 45,
        promo: {
          id: raw,
          type: 'flat',
          value: 45,
          label: `${raw} (₹45 Biryani Feast Offer)`
        }
      };
    }

    // Check GROUPPOOL
    if (['GROUPPOOL20', 'GROUPPOOL25', 'GROUPPOOL', 'GROUPBUY'].includes(raw)) {
      if (subtotal < 2500) {
        const needed = 2500 - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to unlock 20% Group Buy Pool discount (Min ₹2,500).`,
          minRequired: 2500,
          amountNeeded: needed
        };
      }
      const disc = Math.round(subtotal * 0.2);
      return {
        status: 'valid',
        message: `👥 Valid! Group Buy Pool will save ₹${disc} (20% OFF) + Free Delivery.`,
        potentialDiscount: disc,
        promo: {
          id: raw,
          type: 'percent',
          value: 20,
          label: `${raw} (20% Group Buy Pool Offer)`
        }
      };
    }

    // Check SPIN wheel coupons
    if (raw.startsWith('SPIN')) {
      if (subtotal < 599) {
        const needed = 599 - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to apply Spin Wheel Coupon (Min ₹599).`,
          minRequired: 599,
          amountNeeded: needed
        };
      }
      const matchedPct = parseInt(raw.replace(/\D/g, ''), 10) || 15;
      const finalDiscountPct = Math.min(15, Math.max(1, matchedPct));
      const disc = Math.round(subtotal * (finalDiscountPct / 100));
      return {
        status: 'valid',
        message: `🎡 Valid! Spin Wheel coupon gives ${finalDiscountPct}% OFF (Saving ₹${disc}).`,
        potentialDiscount: disc,
        promo: {
          id: raw,
          type: 'percent',
          value: finalDiscountPct,
          label: `${raw} (${finalDiscountPct}% OFF Spin Prize)`
        }
      };
    }

    // Check QUIZ coupons
    const QUIZ_COUPONS: Record<string, number> = {
      'QUIZ15OFF': 15,
      'QUIZ10OFF': 10,
      'QUIZ04OFF': 4,
      'QUIZ25OFF': 15,
      'QUIZ08OFF': 4
    };
    if (QUIZ_COUPONS[raw] !== undefined) {
      if (subtotal < 499) {
        const needed = 499 - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to use Quiz Coupon (Min ₹499).`,
          minRequired: 499,
          amountNeeded: needed
        };
      }
      const itemsUnder100 = items.filter(it => it.price < 100);
      if (itemsUnder100.length === 0) {
        return {
          status: 'warning',
          message: '🧠 Add at least 1 product priced below ₹100 to apply your Quiz coupon.'
        };
      }
      const pct = QUIZ_COUPONS[raw];
      return {
        status: 'valid',
        message: `🧠 Valid! Unlocks ${pct}% OFF on one item under ₹100.`,
        promo: {
          id: raw,
          type: 'percent',
          value: pct,
          label: `${raw} (${pct}% OFF Quiz Discount)`
        }
      };
    }

    // Check against passed or standard promo lists
    const allPromos = promosList && promosList.length > 0 ? promosList : POPULAR_PROMOS;
    const found = allPromos.find((p: any) => 
      ((p.code || p.id)?.toUpperCase() === raw) && p.status !== 'Inactive'
    );

    if (found) {
      if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
        return {
          status: 'invalid',
          message: '❌ This promo code has expired.'
        };
      }
      if (found.usageLimit && (found.usageCount || 0) >= found.usageLimit) {
        return {
          status: 'invalid',
          message: '❌ This promo code has reached its maximum usage limit.'
        };
      }
      const minReq = found.minOrderAmount || found.minSpend || 0;
      if (minReq > 0 && subtotal < minReq) {
        const needed = minReq - subtotal;
        return {
          status: 'warning',
          message: `Add ₹${needed} more to unlock this offer (Min. order ₹${minReq}).`,
          minRequired: minReq,
          amountNeeded: needed
        };
      }

      const pType = found.type === 'percentage' ? 'percent' : (found.type === 'fixed' ? 'flat' : found.type);
      let disc = 0;
      if (pType === 'percent') {
        disc = Math.round(subtotal * (found.value / 100));
      } else if (pType === 'flat') {
        disc = Math.min(found.value, subtotal);
      }

      return {
        status: 'valid',
        message: `✨ Valid code! Offers ${pType === 'percent' ? `${found.value}% OFF (Saving ₹${disc})` : (pType === 'shipping' ? 'Free Delivery' : `₹${found.value} OFF`)}.`,
        potentialDiscount: disc,
        promo: {
          id: found.code || found.id,
          type: pType,
          value: found.value,
          label: found.label || `${found.code || found.id} Applied`
        }
      };
    }

    // If input is short, keep guidance
    if (raw.length < 3) {
      return {
        status: 'idle',
        message: 'Keep typing promo code...'
      };
    }

    // If not matched
    return {
      status: 'invalid',
      message: '❌ Unrecognized promo code. Please check spelling or select from available offers.'
    };
  }, [inputValue, subtotal, items, promosList]);

  // Handle applying the validated promo
  const handleApply = () => {
    if (validation.status === 'valid' && validation.promo) {
      onApplyPromo(validation.promo);
    }
  };

  const handleChipClick = (code: string) => {
    setInputValue(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (validation.status === 'valid') {
        handleApply();
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    if (appliedPromo) {
      onRemovePromo();
    }
  };

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Apply Promo Code
            </h3>
            <p className="text-[10px] font-semibold text-slate-400">
              Instant savings on your cart
            </p>
          </div>
        </div>

        {appliedPromo ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" />
            Code Applied
          </span>
        ) : (
          <span className="text-[9.5px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
            Offers Available
          </span>
        )}
      </div>

      {/* Input Box with Real-Time Indicator */}
      <div className="relative">
        <div className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 bg-slate-50/70 ${
          appliedPromo 
            ? 'border-emerald-500 bg-emerald-50/40' 
            : validation.status === 'valid'
            ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white'
            : validation.status === 'warning'
            ? 'border-amber-400 bg-amber-50/20'
            : validation.status === 'invalid' && inputValue.trim().length >= 3
            ? 'border-rose-400 bg-rose-50/20'
            : isFocused 
            ? 'border-slate-900 bg-white shadow-xs' 
            : 'border-slate-200 hover:border-slate-300'
        }`}>
          {/* Left Icon */}
          <div className="pl-4 pr-2 text-slate-400">
            <Ticket className={`w-5 h-5 transition-colors ${
              appliedPromo 
                ? 'text-emerald-600' 
                : validation.status === 'valid' 
                ? 'text-emerald-500' 
                : 'text-slate-400'
            }`} />
          </div>

          {/* Text Input */}
          <input
            type="text"
            value={inputValue}
            disabled={!!appliedPromo}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER COUPON CODE"
            className="w-full py-3.5 pr-28 text-sm font-black tracking-wider uppercase bg-transparent outline-none text-slate-900 placeholder:text-slate-300 disabled:text-slate-600"
          />

          {/* Right Action Area */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {/* Clear Button */}
            {inputValue && !appliedPromo && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                title="Clear code"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Apply / Remove Button */}
            {!appliedPromo ? (
              <button
                type="button"
                onClick={handleApply}
                disabled={validation.status !== 'valid'}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1 ${
                  validation.status === 'valid'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer animate-pulse'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Apply</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRemovePromo}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 active:scale-95 transition"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status Icon Indicator */}
        <div className="absolute right-28 top-1/2 -translate-y-1/2 pointer-events-none">
          {!appliedPromo && inputValue.trim().length > 0 && (
            <>
              {validation.status === 'valid' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in" />
              )}
              {validation.status === 'warning' && (
                <AlertCircle className="w-4 h-4 text-amber-500 animate-scale-in" />
              )}
              {validation.status === 'invalid' && inputValue.trim().length >= 3 && (
                <XCircle className="w-4 h-4 text-rose-500 animate-scale-in" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Real-Time Live Feedback Banner */}
      <AnimatePresence mode="wait">
        {!appliedPromo && inputValue.trim().length > 0 && (
          <motion.div
            key={validation.status + validation.message}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 transition-all border ${
              validation.status === 'valid'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-2xs'
                : validation.status === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200 shadow-2xs'
                : validation.status === 'invalid'
                ? 'bg-rose-50 text-rose-900 border-rose-200 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {validation.status === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {validation.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
              {validation.status === 'invalid' && <XCircle className="w-4 h-4 text-rose-600" />}
              {validation.status === 'idle' && <Info className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="flex-1 text-[11px] font-bold leading-relaxed">
              <span>{validation.message}</span>
              {validation.amountNeeded !== undefined && validation.amountNeeded > 0 && (
                <p className="text-[10px] font-medium text-amber-700 mt-0.5">
                  Current cart subtotal is ₹{subtotal}. Add ₹{validation.amountNeeded} more to unlock.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applied Promo Banner */}
      {appliedPromo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  {appliedPromo.id}
                </span>
                <span className="text-[9px] font-black bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                  Applied
                </span>
              </div>
              <p className="text-[10.5px] font-medium text-emerald-800">
                {appliedPromo.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemovePromo}
            className="text-[10px] font-black uppercase text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs active:scale-95 transition"
          >
            Change
          </button>
        </motion.div>
      )}

      {/* Available Promo Code Chips */}
      {!appliedPromo && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Available Deals & Codes:</span>
            <span className="text-slate-400 font-normal">Tap to apply</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {POPULAR_PROMOS.map((promo) => {
              const isEligible = subtotal >= promo.minSpend;
              const isSelected = inputValue.toUpperCase() === promo.code;

              return (
                <button
                  key={promo.code}
                  type="button"
                  onClick={() => handleChipClick(promo.code)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : isEligible
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  <Tag className="w-3 h-3 opacity-70" />
                  <span>{promo.code}</span>
                  <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : isEligible 
                      ? 'bg-emerald-200 text-emerald-900' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {promo.type === 'percent' ? `${promo.value}%` : promo.type === 'shipping' ? 'FREE' : `₹${promo.value}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CartPromoSection;
