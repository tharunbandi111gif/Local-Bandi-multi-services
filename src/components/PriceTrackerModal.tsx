import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  TrendingDown, 
  Check, 
  X, 
  ArrowDown, 
  Sparkles, 
  ShieldCheck, 
  List, 
  Trash2,
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, PriceSubscription } from '../types';
import { 
  isProductTracked, 
  getProductSubscription, 
  subscribeToPriceDrop, 
  unsubscribeFromPriceDrop,
  getPriceSubscriptions
} from '../utils/priceTracker';

interface PriceTrackerModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onOpenProduct?: (product: Product) => void;
}

export const PriceTrackerModal: React.FC<PriceTrackerModalProps> = ({
  product,
  isOpen,
  onClose,
  userId,
  onOpenProduct
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PriceSubscription | undefined>(undefined);
  const [notifyMode, setNotifyMode] = useState<'any' | 'target'>('any');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [showAllTracked, setShowAllTracked] = useState(false);
  const [allSubs, setAllSubs] = useState<PriceSubscription[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      const tracked = isProductTracked(product.id);
      setIsSubscribed(tracked);
      const sub = getProductSubscription(product.id);
      setSubscription(sub);
      if (sub && sub.targetPrice) {
        setNotifyMode('target');
        setTargetPriceInput(sub.targetPrice.toString());
      } else {
        setNotifyMode('any');
        // Default target to ~10% lower
        setTargetPriceInput(Math.max(1, Math.round(product.price * 0.9)).toString());
      }
      setAllSubs(getPriceSubscriptions());
      setSuccessMsg(null);
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setSaving(true);
    try {
      const target = notifyMode === 'target' ? parseFloat(targetPriceInput) : undefined;
      const newSub = await subscribeToPriceDrop(product, target, userId);
      setIsSubscribed(true);
      setSubscription(newSub);
      setAllSubs(getPriceSubscriptions());
      setSuccessMsg(
        target
          ? `Subscribed! We will notify you when price drops below ₹${target}.`
          : `Subscribed! You'll get an in-app alert on any price reduction.`
      );
      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async (prodId: string = product.id) => {
    setSaving(true);
    try {
      await unsubscribeFromPriceDrop(prodId, userId);
      if (prodId === product.id) {
        setIsSubscribed(false);
        setSubscription(undefined);
      }
      setAllSubs(getPriceSubscriptions());
      setSuccessMsg('Price tracking stopped for this product.');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const setDiscountPreset = (percent: number) => {
    const discounted = Math.round(product.price * (1 - percent / 100));
    setTargetPriceInput(Math.max(1, discounted).toString());
    setNotifyMode('target');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Price Tracker
                </span>
                {isSubscribed && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Active
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-gray-900 mt-0.5">
                {showAllTracked ? 'All Tracked Products' : 'Price Drop Notifications'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAllTracked(!showAllTracked)}
              className={`p-2 rounded-xl text-xs font-black transition-colors ${
                showAllTracked ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showAllTracked ? 'Back to product' : 'View all tracked items'}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {showAllTracked ? (
            /* View All Subscribed Products */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
                <span>Active Trackers ({allSubs.length})</span>
                <span className="text-[10px] text-gray-400">Notifies in real-time</span>
              </div>

              {allSubs.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <BellOff className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-500">No products tracked yet</p>
                  <p className="text-[11px] text-gray-400">Subscribe to price drops to receive instant alerts!</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {allSubs.map((sub) => (
                    <div 
                      key={sub.id}
                      className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-3 hover:bg-amber-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {sub.productImage ? (
                          <img src={sub.productImage} alt={sub.productName} className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0">
                            ₹
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-gray-900 truncate">{sub.productName}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            <span className="font-bold text-gray-500">Tracked at: ₹{sub.initialPrice}</span>
                            {sub.targetPrice && (
                              <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                Target ≤ ₹{sub.targetPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onOpenProduct && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenProduct({
                                id: sub.productId,
                                name: sub.productName,
                                price: sub.currentPrice,
                                image: sub.productImage || '',
                                category: sub.category || 'general',
                                description: ''
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-white"
                            title="View product details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUnsubscribe(sub.productId)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                          title="Remove tracker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowAllTracked(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-wider transition"
              >
                Back to current product
              </button>
            </div>
          ) : (
            /* Product Subscription Configuration */
            <>
              {/* Product Preview Card */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-sm shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xl shrink-0">
                    ₹
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-gray-900 truncate">{product.name}</h4>
                  <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-black text-emerald-600">₹{product.price}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                    )}
                    <span className="text-[10px] font-bold text-gray-400">Current Price</span>
                  </div>
                </div>
              </div>

              {/* Status or Configuration Form */}
              {isSubscribed ? (
                <div className="space-y-4 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">You are subscribed!</p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        {subscription?.targetPrice 
                          ? `Alerting you when price falls to or below ₹${subscription.targetPrice}`
                          : `Alerting you on any price reduction below ₹${subscription?.initialPrice || product.price}`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSubscribed(false)}
                      className="flex-1 py-2.5 bg-white border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-50 transition active:scale-95"
                    >
                      Update Target
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleUnsubscribe()}
                      className="flex-1 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-rose-100 transition active:scale-95"
                    >
                      Stop Tracking
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 block mb-2">
                      When should we notify you?
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setNotifyMode('any')}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          notifyMode === 'any'
                            ? 'border-amber-500 bg-amber-50/70 text-gray-900 shadow-sm'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black">Any Price Drop</span>
                          {notifyMode === 'any' && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Instant alert for any reduction below ₹{product.price}</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNotifyMode('target')}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          notifyMode === 'target'
                            ? 'border-amber-500 bg-amber-50/70 text-gray-900 shadow-sm'
                            : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black">Target Price</span>
                          {notifyMode === 'target' && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">Only alert if price reaches your target threshold</p>
                      </button>
                    </div>
                  </div>

                  {notifyMode === 'target' && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black uppercase tracking-wider text-gray-600">
                          Target Price (₹)
                        </label>
                        <span className="text-[10px] font-bold text-gray-400">Current: ₹{product.price}</span>
                      </div>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                        <input
                          type="number"
                          value={targetPriceInput}
                          onChange={(e) => setTargetPriceInput(e.target.value)}
                          placeholder="e.g. 200"
                          max={product.price}
                          min={1}
                          className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-black text-gray-900 outline-none focus:border-amber-500 shadow-inner"
                        />
                      </div>

                      {/* Quick percentage discount presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Presets:</span>
                        {[5, 10, 15, 20, 25].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDiscountPreset(pct)}
                            className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-black text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition"
                          >
                            -{pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subscribe Action Button */}
                  <button
                    type="button"
                    disabled={saving || (notifyMode === 'target' && (!targetPriceInput || parseFloat(targetPriceInput) <= 0))}
                    onClick={handleSubscribe}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-98 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-amber-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    {saving ? 'Activating Tracker...' : 'Subscribe to Price Drops'}
                  </button>
                </div>
              )}

              {/* Informational notice */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start gap-2.5 text-[10.5px] text-gray-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  You'll receive instant in-app alerts in your notification center as soon as the vendor discounts this product. You can unsubscribe anytime.
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
