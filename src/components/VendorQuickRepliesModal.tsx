import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Share2, 
  Clock, 
  Bike, 
  PackageCheck, 
  AlertTriangle, 
  PhoneCall, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VendorOrder } from '../types';

export interface QuickReplyTemplate {
  id: string;
  title: string;
  category: 'status' | 'timing' | 'clarification' | 'custom';
  textTemplate: string;
  icon?: string;
}

const DEFAULT_QUICK_REPLIES: QuickReplyTemplate[] = [
  {
    id: 'qr-prep',
    title: 'Order is being prepared',
    category: 'status',
    textTemplate: 'Hello {customerName}, we have accepted your order #{orderId} and our kitchen is freshly preparing it right now. Estimated prep time is {prepTime}. Thank you for your patience!',
    icon: 'cooking'
  },
  {
    id: 'qr-rider',
    title: 'Rider is assigned',
    category: 'status',
    textTemplate: 'Hi {customerName}, a delivery partner ({riderName}) has been assigned to order #{orderId} and is heading to our store to collect your fresh order.',
    icon: 'bike'
  },
  {
    id: 'qr-ready',
    title: 'Order is packed & ready',
    category: 'status',
    textTemplate: 'Hi {customerName}, order #{orderId} is safely packed and ready for handover. The delivery partner will be departing shortly!',
    icon: 'package'
  },
  {
    id: 'qr-dispatched',
    title: 'Order out for delivery',
    category: 'status',
    textTemplate: 'Great news {customerName}! Your order #{orderId} has been picked up by {riderName} and is now out for delivery to {deliveryAddress}.',
    icon: 'truck'
  },
  {
    id: 'qr-delay-10',
    title: 'Slight delay (+10 mins)',
    category: 'timing',
    textTemplate: 'Dear {customerName}, our kitchen is experiencing a slight peak rush. Your order #{orderId} will take an extra 10 minutes to ensure top quality. We apologize for the delay!',
    icon: 'clock'
  },
  {
    id: 'qr-rain-delay',
    title: 'Weather / Traffic delay',
    category: 'timing',
    textTemplate: 'Hi {customerName}, due to local weather/traffic conditions, delivery of order #{orderId} may take a few extra minutes. Your rider is driving safely with your package.',
    icon: 'alert'
  },
  {
    id: 'qr-landmark',
    title: 'Need address landmark',
    category: 'clarification',
    textTemplate: 'Hello {customerName}, could you please reply with a nearby landmark or building name for delivery to {deliveryAddress} so our partner can find you easily?',
    icon: 'map'
  },
  {
    id: 'qr-item-out',
    title: 'Item substitution query',
    category: 'clarification',
    textTemplate: 'Hi {customerName}, an item from your order #{orderId} is currently out of stock. We have a fresh alternative available—please let us know if we should substitute or refund!',
    icon: 'refresh'
  },
  {
    id: 'qr-call-us',
    title: 'Tried calling you',
    category: 'clarification',
    textTemplate: 'Hi {customerName}, we tried calling your phone regarding order #{orderId}. Please give us a quick call back or message us here when convenient.',
    icon: 'phone'
  },
  {
    id: 'qr-thankyou',
    title: 'Order delivered / Thank you',
    category: 'status',
    textTemplate: 'Thank you for ordering with {storeName}! Your order #{orderId} has been completed. We hope you love it! Have a wonderful day.',
    icon: 'heart'
  }
];

interface VendorQuickRepliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: VendorOrder | any | null;
  storeName?: string;
  onSendToChat?: (text: string) => void;
}

export const VendorQuickRepliesModal: React.FC<VendorQuickRepliesModalProps> = ({
  isOpen,
  onClose,
  order,
  storeName = 'Local Bandi Store',
  onSendToChat
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customReplies, setCustomReplies] = useState<QuickReplyTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('lokal_vendor_custom_quick_replies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  // Persist custom replies
  const handleSaveCustomReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    const newReply: QuickReplyTemplate = {
      id: `custom-qr-${Date.now()}`,
      title: newTitle.trim(),
      category: 'custom',
      textTemplate: newText.trim()
    };

    const updated = [newReply, ...customReplies];
    setCustomReplies(updated);
    try {
      localStorage.setItem('lokal_vendor_custom_quick_replies', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist custom quick replies', err);
    }

    setNewTitle('');
    setNewText('');
    setShowAddCustom(false);
    setActiveCategory('custom');
  };

  const handleDeleteCustomReply = (id: string) => {
    const updated = customReplies.filter(r => r.id !== id);
    setCustomReplies(updated);
    try {
      localStorage.setItem('lokal_vendor_custom_quick_replies', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist custom quick replies', err);
    }
  };

  // Interpolate dynamic template placeholders
  const formatReplyText = (template: string) => {
    const customerName = order?.customerName || 'Customer';
    const orderId = order?.id ? order.id.slice(-6).toUpperCase() : 'LOKAL';
    const riderName = order?.deliveryPartnerName || (order?.deliveryPartnerId ? 'Assigned Rider' : 'our delivery rider');
    const deliveryAddress = order?.deliveryAddress || 'your address';
    const prepTime = `${order?.prepTimeMinutes || 15} minutes`;

    return template
      .replace(/{customerName}/g, customerName)
      .replace(/{orderId}/g, orderId)
      .replace(/{riderName}/g, riderName)
      .replace(/{storeName}/g, storeName)
      .replace(/{deliveryAddress}/g, deliveryAddress)
      .replace(/{prepTime}/g, prepTime);
  };

  // All replies combined
  const allReplies = useMemo(() => {
    return [...customReplies, ...DEFAULT_QUICK_REPLIES];
  }, [customReplies]);

  // Filtered replies
  const filteredReplies = useMemo(() => {
    return allReplies.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.textTemplate.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allReplies, activeCategory, searchQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (text: string) => {
    const phone = order?.customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    if (cleanPhone) {
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  const handleSendSMS = (text: string) => {
    const phone = order?.customerPhone || '';
    const encoded = encodeURIComponent(text);
    window.open(`sms:${phone}?body=${encoded}`, '_self');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide">
                  Quick Replies
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Instant Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {order ? (
                  <>Order <span className="font-mono font-bold text-amber-300">#{order.id.slice(-6).toUpperCase()}</span> for <span className="text-white font-bold">{order.customerName}</span></>
                ) : (
                  'Common responses for customer queries'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Context Bar (if order is provided) */}
        {order && (
          <div className="bg-amber-50/80 px-6 py-3 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider">Customer:</span>
              <span className="font-bold text-slate-900">{order.customerName}</span>
              {order.customerPhone && (
                <span className="font-mono text-slate-600 text-[11px] bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {order.customerPhone}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-amber-950">
              <span className="text-[10px] font-black uppercase tracking-wider">Status:</span>
              <span className="font-extrabold uppercase px-2 py-0.5 rounded-md text-[10px] bg-amber-200/70 text-amber-900">
                {order.status}
              </span>
              {order.deliveryPartnerName && (
                <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                  <Bike className="w-3 h-3 text-indigo-600" />
                  {order.deliveryPartnerName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search replies (e.g. prepared, rider, delay, landmark)..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-slate-900 transition text-slate-900 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Custom</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Replies' },
              { id: 'status', label: 'Order Status' },
              { id: 'timing', label: 'Delays & Timing' },
              { id: 'clarification', label: 'Queries & Help' },
              { id: 'custom', label: `My Custom (${customReplies.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Custom Reply Drawer/Form */}
        <AnimatePresence>
          {showAddCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-indigo-50/70 border-b border-indigo-100 px-6 py-4"
            >
              <form onSubmit={handleSaveCustomReply} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Create Custom Quick Reply
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Template Title (e.g. Free Dessert Included)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-900 outline-none focus:border-indigo-600"
                />

                <textarea
                  rows={2}
                  placeholder="Message Text (use {customerName}, {orderId}, {riderName}, {prepTime} for dynamic variables)"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-medium text-slate-900 outline-none focus:border-indigo-600 resize-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 shadow-sm shadow-indigo-200"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
          {filteredReplies.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold uppercase tracking-wider">No quick replies found</p>
              <p className="text-[11px] mt-1">Try another search keyword or create a custom reply.</p>
            </div>
          ) : (
            filteredReplies.map((reply) => {
              const formattedMessage = formatReplyText(reply.textTemplate);
              const isCopied = copiedId === reply.id;

              return (
                <div
                  key={reply.id}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {reply.title}
                      </span>
                      <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tracking-wider">
                        {reply.category}
                      </span>
                    </div>

                    {reply.category === 'custom' && (
                      <button
                        onClick={() => handleDeleteCustomReply(reply.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Delete custom reply"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Formatted Message Bubble Preview */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs text-slate-800 leading-relaxed font-medium">
                    {formattedMessage}
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(reply.id, formattedMessage)}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black tracking-wider uppercase transition flex items-center gap-1 border active:scale-95 ${
                          isCopied
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Send on WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(formattedMessage)}
                        className="px-3 py-1.5 rounded-xl text-[10.5px] font-black tracking-wider uppercase transition flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Send via SMS */}
                      {order?.customerPhone && (
                        <button
                          type="button"
                          onClick={() => handleSendSMS(formattedMessage)}
                          className="px-3 py-1.5 rounded-xl text-[10.5px] font-black tracking-wider uppercase transition flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs active:scale-95"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>SMS</span>
                        </button>
                      )}
                    </div>

                    {/* Send to in-app chat callback (if in support/queries tab) */}
                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onSendToChat(formattedMessage);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-[10.5px] font-black tracking-wider uppercase bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 active:scale-95 transition shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Insert into Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500 shrink-0">
          <span>
            {order ? `Sending updates to ${order.customerName}` : 'Speeding up customer support communication'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorQuickRepliesModal;
