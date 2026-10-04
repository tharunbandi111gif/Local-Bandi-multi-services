import React, { useState, useEffect } from 'react';
import { TrendingDown, X, ChevronRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface PriceDropAlertData {
  product: Product;
  oldPrice: number;
  newPrice: number;
  discountPercent: number;
}

interface PriceDropToastProps {
  onOpenProduct?: (product: Product) => void;
}

export const PriceDropToast: React.FC<PriceDropToastProps> = ({ onOpenProduct }) => {
  const [currentAlert, setCurrentAlert] = useState<PriceDropAlertData | null>(null);

  useEffect(() => {
    const handlePriceDrop = (e: Event) => {
      const customEvent = e as CustomEvent<PriceDropAlertData>;
      if (customEvent.detail && customEvent.detail.product) {
        setCurrentAlert(customEvent.detail);
      }
    };

    window.addEventListener('price_drop_alert', handlePriceDrop);
    return () => window.removeEventListener('price_drop_alert', handlePriceDrop);
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!currentAlert) return;
    const timer = setTimeout(() => {
      setCurrentAlert(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [currentAlert]);

  if (!currentAlert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[130] pointer-events-auto"
      >
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/40 backdrop-blur-xl flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                  Price Drop Alert!
                </span>
                <span className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-md">
                  -{currentAlert.discountPercent}% OFF
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100 truncate">
                {currentAlert.product.name}
              </p>
              <div className="flex items-center gap-2 text-[11px] mt-0.5">
                <span className="font-black text-amber-300">₹{currentAlert.newPrice}</span>
                <span className="text-slate-400 line-through">₹{currentAlert.oldPrice}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 relative z-10">
            {onOpenProduct && (
              <button
                type="button"
                onClick={() => {
                  onOpenProduct(currentAlert.product);
                  setCurrentAlert(null);
                }}
                className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition active:scale-95"
              >
                View <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCurrentAlert(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
