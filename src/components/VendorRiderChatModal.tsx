import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, Phone, Bike, Store, Clock, 
  CheckCheck, AlertCircle, MessageSquare, 
  MapPin, Package, Sparkles, RefreshCw, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, updateDoc, doc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'vendor' | 'rider' | 'admin';
  text: string;
  createdAt: any;
  timestampStr?: string;
  read?: boolean;
}

interface VendorRiderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  currentUserRole: 'vendor' | 'rider';
  currentUserId: string;
  currentUserName: string;
  partnerName: string;
  partnerPhone?: string;
  partnerRole: 'vendor' | 'rider';
  orderItems?: Array<{ name: string; quantity: number; price?: number }>;
  orderTotal?: number;
  deliveryAddress?: string;
  orderStatus?: string;
  onUpdateDeliveryStatus?: (newStatus: string) => void;
}

const QUICK_REPLIES_VENDOR = [
  "📦 Order is packed & ready for pickup at counter!",
  "⏱️ Prep needs ~3 more mins, thank you for waiting.",
  "⚠️ Please handle with care: contains liquid / hot items.",
  "📍 Counter entrance is on the left side of the store.",
  "✅ Verified items match receipt, ready to dispatch."
];

const QUICK_REPLIES_RIDER = [
  "🛵 I have arrived at the merchant store.",
  "🚦 Heavy traffic, arriving at store in 3-5 mins.",
  "📦 Order safely collected! En route to customer.",
  "📍 Arrived at customer doorstep.",
  "❓ Need clarification on pickup bag / invoice."
];

export const VendorRiderChatModal: React.FC<VendorRiderChatModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  currentUserRole,
  currentUserId,
  currentUserName,
  partnerName,
  partnerPhone,
  partnerRole,
  orderItems = [],
  orderTotal,
  deliveryAddress,
  orderStatus,
  onUpdateDeliveryStatus
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'order_summary'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const localKey = `lokal_order_chat_${orderId}`;

  // Real-time synchronization
  useEffect(() => {
    if (!isOpen || !orderId) return;

    // Load initial local cache
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load local chat cache", e);
    }

    // Subscribe to real-time Firestore order chat messages
    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'order_messages'),
        where('orderId', '==', orderId),
        orderBy('createdAt', 'asc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ChatMessage[] = snapshot.docs.map(d => {
            const data = d.data();
            let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (data.createdAt) {
              if (data.createdAt.toDate) {
                timeStr = data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else if (typeof data.createdAt === 'string') {
                timeStr = new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            }
            return {
              id: d.id,
              orderId: data.orderId || orderId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderRole: data.senderRole,
              text: data.text,
              createdAt: data.createdAt,
              timestampStr: timeStr,
              read: data.read ?? true
            };
          });

          setMessages(loaded);
          try {
            localStorage.setItem(localKey, JSON.stringify(loaded));
          } catch (e) {
            // ignore
          }
        }
      }, (err) => {
        console.warn("Firestore order_messages sync fallback to local mode:", err);
      });
    } catch (err) {
      console.warn("Error setting up order_messages query:", err);
    }

    return () => unsubscribe();
  }, [isOpen, orderId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || !orderId || isSending) return;

    setIsSending(true);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tempMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      orderId,
      senderId: currentUserId || 'current-user',
      senderName: currentUserName || (currentUserRole === 'vendor' ? 'Merchant' : 'Delivery Partner'),
      senderRole: currentUserRole,
      text: content,
      createdAt: new Date().toISOString(),
      timestampStr: nowStr,
      read: false
    };

    // Optimistic UI update
    const updated = [...messages, tempMessage];
    setMessages(updated);
    try {
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}

    setInputText('');

    try {
      await addDoc(collection(db, 'order_messages'), {
        orderId,
        senderId: currentUserId || 'current-user',
        senderName: currentUserName || (currentUserRole === 'vendor' ? 'Merchant' : 'Delivery Partner'),
        senderRole: currentUserRole,
        text: content,
        createdAt: serverTimestamp(),
        read: false
      });
    } catch (err) {
      console.warn("Failed to write to Firestore order_messages, saved locally:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const quickReplies = currentUserRole === 'vendor' ? QUICK_REPLIES_VENDOR : QUICK_REPLIES_RIDER;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
              partnerRole === 'rider' ? 'bg-blue-600 shadow-blue-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
            }`}>
              {partnerRole === 'rider' ? <Bike className="w-6 h-6" /> : <Store className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  {partnerRole === 'rider' ? 'Assigned Delivery Partner' : 'Merchant Store'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                {partnerName || (partnerRole === 'rider' ? 'Delivery Rider' : 'Merchant')}
              </h3>
              <p className="text-[11px] text-slate-400">
                Order #{orderNumber || (orderId ? orderId.slice(-6).toUpperCase() : '---')}
                {orderStatus && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-white text-[9px] font-bold">
                    {orderStatus}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {partnerPhone && (
              <a
                href={`tel:${partnerPhone}`}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-emerald-400 flex items-center justify-center transition-all active:scale-95"
                title={`Call ${partnerName}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-white text-indigo-600 shadow-sm border-t border-x border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px]">
              {messages.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('order_summary')}
            className={`px-4 py-2.5 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'order_summary'
                ? 'bg-white text-indigo-600 shadow-sm border-t border-x border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Order Summary & Instructions</span>
          </button>
        </div>

        {/* Body */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60">
            {/* Quick Replies Bar */}
            <div className="p-2.5 bg-white border-b border-slate-100 overflow-x-auto scrollbar-hide flex gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 self-center pl-1">
                Quick:
              </span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition-all border border-slate-200 active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700 uppercase">
                    Order Dispatch Channel
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Direct real-time line between {partnerName || 'partner'} and you. Send instructions, item packaging updates, or pickup status.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderRole === currentUserRole || m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-black text-slate-400">
                          {isMe ? 'You' : m.senderName || (m.senderRole === 'vendor' ? 'Merchant' : 'Delivery Rider')}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                          m.senderRole === 'rider' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {m.senderRole}
                        </span>
                      </div>
                      <div
                        className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
                        }`}
                      >
                        {m.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 font-medium">
                        <span>{m.timestampStr || 'Just now'}</span>
                        {isMe && <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  currentUserRole === 'vendor'
                    ? "Message assigned rider (e.g. ready for pickup)..."
                    : "Message merchant store (e.g. arrived outside)..."
                }
                className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder:text-slate-400 text-sm font-medium px-4 py-3 rounded-2xl outline-none border border-transparent focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all active:scale-95"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* Order Summary Tab */
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Order Reference
                  </p>
                  <h4 className="text-lg font-black text-slate-900">
                    #{orderNumber || (orderId ? orderId.slice(-6).toUpperCase() : '---')}
                  </h4>
                </div>
                {orderTotal !== undefined && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Bill Total
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      ₹{orderTotal}
                    </p>
                  </div>
                )}
              </div>

              {deliveryAddress && (
                <div className="p-3 bg-slate-50 rounded-2xl flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-slate-700">Drop Address: </span>
                    {deliveryAddress}
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Order Items ({orderItems.length})
              </p>
              {orderItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No item details available</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-[10px]">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                      {item.price && (
                        <span className="font-black text-slate-700">
                          ₹{item.price * item.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Status Update for Delivery Partner */}
            {currentUserRole === 'rider' && onUpdateDeliveryStatus && (
              <div className="bg-indigo-50/70 p-5 rounded-3xl border border-indigo-100 space-y-3">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  Quick Dispatch Status Updates
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateDeliveryStatus('PickedUp')}
                    className="p-3 bg-white hover:bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-wider border border-emerald-200 transition-all text-center"
                  >
                    Mark Picked Up
                  </button>
                  <button
                    onClick={() => onUpdateDeliveryStatus('OutForDelivery')}
                    className="p-3 bg-white hover:bg-blue-50 text-blue-700 rounded-2xl text-xs font-black uppercase tracking-wider border border-blue-200 transition-all text-center"
                  >
                    Out for Delivery
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VendorRiderChatModal;
