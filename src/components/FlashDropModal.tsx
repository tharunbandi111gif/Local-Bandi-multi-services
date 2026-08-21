import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Clock, Zap, Check, Copy, ShoppingBag, ArrowRight, X, Sparkles, Tag, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { 
  FlashDropConfig, 
  getLocalAttractionConfig,
  isGoldenHourActive,
  getGoldenHourTimerSeconds,
  getNextGoldenHourSlotText
} from '../types/attractionCampaigns';

interface FlashDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPromo?: (code: string, discount: number) => void;
  onSelectCategory?: (categoryId: string) => void;
  onAddToCart?: (item: any) => void;
  onNavigateToCart?: () => void;
  config?: FlashDropConfig;
}

export const FlashDropModal: React.FC<FlashDropModalProps> = ({
  isOpen,
  onClose,
  onApplyPromo,
  onSelectCategory,
  onAddToCart,
  onNavigateToCart,
  config
}) => {
  const [copied, setCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);
  const [goldenHourState, setGoldenHourState] = useState(getGoldenHourTimerSeconds());

  const activeConfig = config || getLocalAttractionConfig().flashDrop;
  const promoCode = 'GOLDEN50';

  useEffect(() => {
    const timer = setInterval(() => {
      setGoldenHourState(getGoldenHourTimerSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSecs = Math.max(0, goldenHourState.seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const formattedTime = hours > 0 
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleApplyCoupon = () => {
    if (onApplyPromo) {
      onApplyPromo(promoCode, 50);
    }
    setIsApplied(true);
    setCopied(true);
    try {
      navigator.clipboard?.writeText?.(promoCode);
    } catch (_) {}
    setTimeout(() => setCopied(false), 2500);
  };

  const flashItems = (activeConfig.items && activeConfig.items.length > 0)
    ? activeConfig.items.filter(it => it.isActive !== false)
    : [
        {
          id: 'flash-floor-cleaner',
          name: 'Citrus Fresh Antibacterial Floor Cleaner (2 Litre)',
          category: 'household',
          unit: '2 Litre Bottle',
          mrp: 198,
          price: 99,
          discount: '50% OFF (Up to ₹50)',
          image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          stock: '8 left in stock'
        },
        {
          id: 'flash-dishwash-gel',
          name: 'Concentrated Lemon Power Dish Wash Gel (1 Litre)',
          category: 'household',
          unit: '1 Litre Squeeze Bottle',
          mrp: 150,
          price: 75,
          discount: '50% OFF (Up to ₹50)',
          image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          stock: '12 left in stock'
        },
        {
          id: 'flash-fabric-conditioner',
          name: 'Spring Blossom Soft Care Fabric Conditioner (1 Litre)',
          category: 'household',
          unit: '1 Litre Ergonomic Pack',
          mrp: 220,
          price: 110,
          discount: '50% OFF (Up to ₹50)',
          image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
          stock: '6 left in stock'
        }
      ];

  const handleAddItem = (item: any) => {
    if (onAddToCart) {
      onAddToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.mrp,
        image: item.image,
        category: item.category,
        isFlashDrop: true,
        quantity: 1
      });
      setAddedItemIds(prev => [...prev, item.id]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 flex flex-col max-h-[90vh]"
        >
          {/* Header with energetic Golden-Hour gradient */}
          <div className="relative p-5 pb-6 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-amber-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                {goldenHourState.isActive ? '⚡ Golden Hour Active' : '⏰ Golden Hour Slots'}
              </span>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-yellow-300 text-[11px] font-mono font-black border border-white/20">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{goldenHourState.label}: {formattedTime}</span>
              </div>
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white leading-tight">
              {activeConfig.title || 'Flat 50% Golden Hour Drop'}
            </h3>
            <p className="text-xs text-orange-100 font-medium mt-1">
              Active 6:00 AM – 8:00 AM & 4:00 PM – 7:00 PM everyday! Applies strictly to selected items (Floor Cleaner, Dish Wash, Fabric Conditioner) up to ₹50 maximum.
            </p>
          </div>

          {/* Golden Hour Rules & Notice */}
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Rules:</strong> Selected products only • Max discount ₹50 • Morning 6–8 AM & Evening 4–7 PM.</span>
          </div>

          {/* Golden Coupon Action Ribbon */}
          <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg text-amber-400 tracking-wider">
                    {promoCode}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 uppercase">
                    50% OFF (Up to ₹50)
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {isApplied ? '✅ Coupon applied for eligible items at checkout' : 'Min order ₹99 • Valid during active Golden Hour slots'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleApplyCoupon}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer w-full sm:w-auto ${
                  isApplied
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-amber-400 hover:bg-amber-350 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>50% Code Applied</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Apply GOLDEN50</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Flash items catalog */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Eligible Golden Hour Products ({flashItems.length})
              </h4>
              <span className="text-[10px] text-amber-400 font-bold">⚡ Max ₹50 OFF</span>
            </div>

            <div className="space-y-2.5">
              {flashItems.map((item) => {
                const isAdded = addedItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded text-[9px] font-black uppercase">
                          {item.discount}
                        </span>
                        <span className="text-[9.5px] text-amber-400 font-semibold">{item.stock}</span>
                      </div>
                      <h5 className="font-bold text-xs text-white truncate">{item.name}</h5>
                      <p className="text-[10px] text-slate-400">{item.unit}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-emerald-400">₹{item.price}</span>
                        <span className="text-xs text-slate-500 line-through">₹{item.mrp}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddItem(item)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-400 hover:bg-amber-350 text-slate-950'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                handleApplyCoupon();
                onClose();
                if (onSelectCategory) {
                  onSelectCategory(activeConfig.targetCategory || 'grocery');
                }
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View More Products</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                handleApplyCoupon();
                onClose();
                if (onNavigateToCart) {
                  onNavigateToCart();
                }
              }}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 fill-slate-950" />
              <span>Go to Cart</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
