import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Clock,
  MapPin,
  PhoneOff,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Store,
  Send,
  Search,
  X,
  CloudRain,
  Wrench,
  ShieldAlert,
  DollarSign,
  Package,
  MessageSquareQuote,
  Sparkles
} from 'lucide-react';

export interface QuickReplyItem {
  id: string;
  category: 'arrival' | 'location' | 'order' | 'emergency';
  text: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: string;
  color: string;
}

export const PREDEFINED_RIDER_QUICK_REPLIES: QuickReplyItem[] = [
  // Arrival & Transit
  {
    id: 'qr-arriving-now',
    category: 'arrival',
    shortLabel: 'Arriving now',
    text: '🛵 Arriving now at your location. Please be ready to receive your order.',
    icon: Navigation,
    badge: 'Popular',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'qr-running-5m',
    category: 'arrival',
    shortLabel: 'Running 5 mins late',
    text: '⏱️ Running 5 minutes late due to traffic. Arriving shortly!',
    icon: Clock,
    badge: 'Transit',
    color: 'from-amber-500 to-yellow-600'
  },
  {
    id: 'qr-running-15m',
    category: 'arrival',
    shortLabel: 'Running 10-15 mins late',
    text: '⏳ Heavy traffic congestion on the route. Delayed by approx 10-15 mins.',
    icon: Clock,
    color: 'from-amber-600 to-orange-600'
  },
  {
    id: 'qr-reached-store',
    category: 'arrival',
    shortLabel: 'Reached store / pickup',
    text: '🏪 Reached the pickup store. Waiting for vendor order handover.',
    icon: Store,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'qr-order-picked',
    category: 'arrival',
    shortLabel: 'Order picked up',
    text: '📦 Order safely picked up from store. Starting GPS navigation to destination.',
    icon: Package,
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'qr-reached-door',
    category: 'arrival',
    shortLabel: 'At doorstep / gate',
    text: '🚪 Reached customer building/doorstep. Please collect the parcel.',
    icon: CheckCircle2,
    color: 'from-emerald-600 to-green-600'
  },

  // Location & Address
  {
    id: 'qr-cant-find-location',
    category: 'location',
    shortLabel: 'Cannot find location',
    text: '📍 Cannot find customer location. Please share nearby landmark or pinpoint on map.',
    icon: MapPin,
    badge: 'Urgent',
    color: 'from-rose-500 to-pink-600'
  },
  {
    id: 'qr-phone-unreachable',
    category: 'location',
    shortLabel: 'Customer not answering',
    text: '📞 Customer phone is ringing / unreachable. Tried calling multiple times.',
    icon: PhoneOff,
    badge: 'Call Issue',
    color: 'from-rose-600 to-red-600'
  },
  {
    id: 'qr-gate-locked',
    category: 'location',
    shortLabel: 'Gate locked / Security issue',
    text: '🛑 Gate locked / Society security not permitting entry without approval.',
    icon: AlertTriangle,
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'qr-wrong-address',
    category: 'location',
    shortLabel: 'Incorrect address listed',
    text: '🗺️ The provided address does not match GPS coordinates. Support assistance requested.',
    icon: MapPin,
    color: 'from-violet-500 to-purple-600'
  },

  // Orders & Payment
  {
    id: 'qr-store-delay',
    category: 'order',
    shortLabel: 'Store prep delay',
    text: '⏳ Store is preparing the fresh items. Delay of 5-10 minutes from merchant end.',
    icon: Store,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'qr-cash-change',
    category: 'order',
    shortLabel: 'Need cash change for ₹500',
    text: '💵 Customer needs cash change for ₹500 on Cash on Delivery order.',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'qr-item-damaged',
    category: 'order',
    shortLabel: 'Item spillage / Damaged',
    text: '⚠️ Item container spillage/damage noticed during transit. Need hub approval.',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-600'
  },
  {
    id: 'qr-customer-cancel',
    category: 'order',
    shortLabel: 'Customer refused delivery',
    text: '🚫 Customer refused delivery / requested instant order cancellation.',
    icon: X,
    color: 'from-rose-600 to-red-700'
  },

  // Weather & Emergency
  {
    id: 'qr-rain-delay',
    category: 'emergency',
    shortLabel: 'Heavy rain delay',
    text: '🌧️ Heavy rain and waterlogging on transit route. Riding safely at slow speed.',
    icon: CloudRain,
    color: 'from-sky-500 to-blue-600'
  },
  {
    id: 'qr-bike-breakdown',
    category: 'emergency',
    shortLabel: 'Vehicle breakdown / Puncture',
    text: '⚠️ Bike mechanical breakdown/tyre puncture. Requesting immediate order re-assignment.',
    icon: Wrench,
    badge: 'Critical',
    color: 'from-red-500 to-orange-600'
  },
  {
    id: 'qr-emergency-help',
    category: 'emergency',
    shortLabel: 'Emergency Dispatch Help',
    text: '🆘 Emergency support needed! On-road incident requiring dispatcher intervention.',
    icon: ShieldAlert,
    badge: 'SOS',
    color: 'from-rose-600 to-red-600'
  }
];

interface RiderQuickRepliesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReply: (replyText: string, autoSend?: boolean) => void;
  theme?: 'dark' | 'light';
}

export const RiderQuickRepliesDrawer: React.FC<RiderQuickRepliesDrawerProps> = ({
  isOpen,
  onClose,
  onSelectReply,
  theme = 'dark'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'arrival' | 'location' | 'order' | 'emergency'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Replies', icon: Zap },
    { id: 'arrival', label: 'Arrival & Transit', icon: Navigation },
    { id: 'location', label: 'Location & Map', icon: MapPin },
    { id: 'order', label: 'Orders & Cash', icon: Package },
    { id: 'emergency', label: 'Weather & SOS', icon: AlertTriangle },
  ];

  const filteredReplies = PREDEFINED_RIDER_QUICK_REPLIES.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      item.shortLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendInstant = (reply: QuickReplyItem) => {
    onSelectReply(reply.text, true);
    onClose();
  };

  const handleInsertDraft = (reply: QuickReplyItem) => {
    onSelectReply(reply.text, false);
    onClose();
  };

  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative w-full sm:max-w-xl max-h-[85vh] flex flex-col rounded-t-[2.5rem] sm:rounded-[2.5rem] border shadow-2xl overflow-hidden z-10 ${
              isDark 
                ? 'bg-slate-905 border-amber-500/30 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Grab handle for mobile gesture */}
            <div className="w-12 h-1.5 bg-slate-500/40 rounded-full mx-auto mt-3 sm:hidden" />

            {/* Header */}
            <div className={`p-5 pb-3 border-b flex items-center justify-between ${
              isDark ? 'border-white/10' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <MessageSquareQuote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      Rider Quick Replies
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      1-Tap Send
                    </span>
                  </div>
                  <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Send instant predefined status updates without typing while driving
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 pb-2">
              <div className={`relative flex items-center rounded-2xl border px-3.5 py-2.5 ${
                isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}>
                <Search className={`w-4 h-4 mr-2.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quick messages (e.g. Arriving, 5 mins, Location)..."
                  className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold scale-100'
                        : isDark
                          ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Replies List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
              {filteredReplies.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matching quick replies found</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="text-[10px] text-amber-400 font-bold underline"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                filteredReplies.map((reply) => {
                  const Icon = reply.icon;
                  return (
                    <div
                      key={reply.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                        isDark 
                          ? 'bg-slate-900/90 border-white/5 hover:border-amber-500/40 hover:bg-slate-900' 
                          : 'bg-slate-50 border-slate-200/80 hover:border-amber-500/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${reply.color} text-white shrink-0 mt-0.5 shadow-sm`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-black uppercase tracking-tight">
                              {reply.shortLabel}
                            </h4>
                            {reply.badge && (
                              <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                {reply.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-[11.5px] mt-1 font-medium leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {reply.text}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleInsertDraft(reply)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                          title="Insert as draft into chatbox"
                        >
                          Draft
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleSendInstant(reply)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-350 hover:to-yellow-350 active:scale-95 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                          title="Send immediately with 1 tap"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Tip */}
            <div className={`px-5 py-3 border-t text-[10px] font-bold flex items-center justify-between ${
              isDark ? 'bg-slate-950 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>One-tap replies keep you safe while on road</span>
              </span>
              <span className="font-mono text-amber-400">{filteredReplies.length} options</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Compact horizontal quick reply chips toolbar for embedding directly above the chat input
 */
interface QuickReplyChipsBarProps {
  onSelectReply: (replyText: string, autoSend?: boolean) => void;
  onOpenDrawer: () => void;
  theme?: 'dark' | 'light';
}

export const QuickReplyChipsBar: React.FC<QuickReplyChipsBarProps> = ({
  onSelectReply,
  onOpenDrawer,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const TOP_CHIPS = [
    { label: '🛵 Arriving now', text: '🛵 Arriving now at your location. Please be ready to receive your order.' },
    { label: '⏱️ Running 5 mins late', text: '⏱️ Running 5 minutes late due to traffic. Arriving shortly!' },
    { label: '📍 Cannot find location', text: '📍 Cannot find customer location. Please share nearby landmark or pinpoint on map.' },
    { label: '📞 Customer not answering', text: '📞 Customer phone is ringing / unreachable. Tried calling multiple times.' },
    { label: '🏪 Reached store', text: '🏪 Reached the pickup store. Waiting for vendor order handover.' },
    { label: '📦 Order picked up', text: '📦 Order safely picked up from store. Starting GPS navigation to destination.' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1.5 px-1 shrink-0">
      <button
        type="button"
        onClick={onOpenDrawer}
        className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 shrink-0 shadow-xs hover:bg-amber-350 active:scale-95 transition-all cursor-pointer"
        title="Open full Quick Replies drawer"
      >
        <Zap className="w-3 h-3 fill-slate-950" />
        <span>Quick Replies</span>
      </button>

      {TOP_CHIPS.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectReply(chip.text, true)}
          className={`px-3 py-1.5 rounded-xl text-[10.5px] font-bold whitespace-nowrap shrink-0 transition-all border cursor-pointer active:scale-95 ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/10 hover:border-amber-400/40'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-amber-500/40 shadow-xs'
          }`}
          title="Tap to send instantly"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};
