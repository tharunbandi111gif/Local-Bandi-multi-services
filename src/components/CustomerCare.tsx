import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, User, Briefcase, Bike, ChevronRight, MessageSquare, ShieldCheck, HeartHandshake, Clock, HelpCircle, Send, Search, CheckCheck, Camera } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { SupportMessage } from '../types';

interface FAQItem {
  q: string;
  a: string;
}

interface CustomerCareProps {
  isOpen: boolean;
  onClose: () => void;
  supportPhone: string;
  secondaryPhone?: string;
  initialType?: 'user' | 'vendor' | 'delivery' | 'marriage';
  branchId: string;
}

const CUSTOMER_CARE_QA: Record<'user' | 'vendor' | 'delivery' | 'marriage', FAQItem[]> = {
  user: [
    { q: "How to place an order?", a: "Select a category, choose a vendor, add items to cart, and proceed to checkout with your address." },
    { q: "How to join as a vendor?", a: "Go to Profile > Partner Network. Choose 'Join as Vendor', fill the application, and pay the registration fee. Our team verified normally in 24 hours." },
    { q: "What is the return policy?", a: "As we deal with fresh farm products, returns are accepted only at the time of delivery if quality is not met." },
    { q: "Can I cancel my order?", a: "Orders can be cancelled before they are accepted by the vendor. Once 'In Preparation', cancellation may not be possible." }
  ],
  vendor: [
    { q: "How to join as a vendor?", a: "Click on 'Join Partner Network' in the Profile section, fill the Vendor Application form, and pay the one-time registration fee. Our team will verify your shop within 24-48 hours." },
    { q: "How do I get paid?", a: "Payments (Weekly) are settled every Monday. You can request a payout from your Vendor Console when your balance is above ₹500." },
    { q: "Need admin approval for property?", a: "Yes, first-time property members and all vendors must get approval from the admin. Once approved first time, you can add more projects easily." },
    { q: "How to contact Admin directly?", a: "You can use this chat or call the Founder Support Line provided in this help desk." }
  ],
  delivery: [
    { q: "How to join as a delivery partner?", a: "Open 'Partner Network' in your Profile, select 'Delivery Partner', and upload your Aadhar and DL. Once verified, you can start taking orders locally." },
    { q: "How are trips assigned?", a: "Orders are assigned based on your proximity to the vendor and your current workload (Automatic Mode)." },
    { q: "Incentives for workers?", a: "Yes, we provide performance-based bonuses and night-shift incentives for active delivery partners." }
  ],
  marriage: [
    { q: "How to register in Marriage Bureau?", a: "Navigate to the Marriage Bureau section from the Home screen, click 'Create Profile', and fill in your details along with photos." },
    { q: "Who can see my details?", a: "Contact details are only shared after both parties express interest and mutual consent. Your privacy is our priority." },
    { q: "Is there a chatting option?", a: "Yes, only in the Marriage Bureau section, we provide direct chatting and call options once a match is mutually accepted." }
  ]
};

export default function CustomerCare({ isOpen, onClose, supportPhone, secondaryPhone, initialType = 'user', branchId }: CustomerCareProps) {
  const [careType, setCareType] = useState<'user' | 'vendor' | 'delivery' | 'marriage'>(initialType);
  const [view, setView] = useState<'faq' | 'chat'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasReviewedFaq, setHasReviewedFaq] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [message, setMessage] = useState('');
  const [showSupportNumber, setShowSupportNumber] = useState(false);
  const [showCallbackPicker, setShowCallbackPicker] = useState(false);
  const [callbackTime, setCallbackTime] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  useEffect(() => {
    if (isOpen) {
      setCareType(initialType);
      setView('faq');
      setHasReviewedFaq(false);
      setShowSupportNumber(false);
      setShowCallbackPicker(false);
      setExpandedFaq(null);
      
      if (auth.currentUser) {
        const q = query(
          collection(db, 'support_chats'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          
          if (fetchedMessages.length === 0) {
            setMessages([
              { id: 'welcome', senderId: 'bot', senderName: 'Bot', senderType: 'bot', text: "Hi! I'm your Local Bandi Assistant. Looking for help? Check our FAQs first or ask me anything here.", timestamp: { toDate: () => new Date() } } as any
            ]);
          } else {
            setMessages(fetchedMessages);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'support_chats');
        });

        return () => unsubscribe();
      } else {
        setMessages([
          { 
            id: 'welcome', 
            senderId: 'bot', 
            senderName: 'Bot', 
            text: "Hi! I'm your Local Bandi Assistant. Please log in to chat with a live agent or request a callback.", 
            senderType: 'bot', 
            timestamp: new Date().toISOString() 
          }
        ]);
      }
    }
  }, [isOpen, initialType]);

  const handleRequestCallback = async () => {
    if (!callbackTime) return;
    
    const text = `I would like a callback at: ${callbackTime}`;
    await handleSendMessage(text);
    setShowCallbackPicker(false);
    setShowSupportNumber(true); // Now we show the number as requested
    
    // Bot confirmation
    if (auth.currentUser) {
      setTimeout(async () => {
        await addDoc(collection(db, 'support_chats'), {
          userId: auth.currentUser!.uid,
          userName: auth.currentUser!.displayName || 'User',
          senderId: 'bot',
          senderName: 'Bot',
          text: `Got it! We've scheduled your callback for ${callbackTime}. You can also reach us at +91 ${supportPhone} if it's urgent.`,
          senderType: 'bot',
          careType: careType,
          branchId: branchId,
          timestamp: serverTimestamp(),
          isRead: false
        });
      }, 1000);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || message;
    if (!textToSend.trim()) return;

    // Check for keywords but don't show number immediately anymore
    const lowerText = textToSend.toLowerCase();
    const isDirectCallRequest = lowerText.includes('call') || 
                                lowerText.includes('phone') || 
                                lowerText.includes('number');

    if (isDirectCallRequest && !showSupportNumber) {
      // Don't show number yet, suggest callback
      if (!textOverride) {
        setMessages(prev => [...prev, {
          id: `bot-sug-${Date.now()}`,
          senderId: 'bot',
          senderName: 'Bot',
          text: "I can help with that. Would you like to schedule a callback at your preferred time, or see our support number directly?",
          senderType: 'bot',
          timestamp: new Date().toISOString()
        } as any]);
      }
    }
    
    if (!auth.currentUser) {
      setMessages(prev => [...prev, { 
        id: `temp-${Date.now()}`, 
        senderId: 'temp-user',
        senderName: 'Guest',
        text: textToSend, 
        senderType: 'user' as const, 
        timestamp: new Date().toISOString() 
      }]);
      setMessage('');
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: `temp-bot-${Date.now()}`, 
          senderId: 'bot',
          senderName: 'Bot',
          text: "Please sign in to save your conversation and request a formal callback.", 
          senderType: 'bot' as const, 
          timestamp: new Date().toISOString() 
        }]);
      }, 1000);
      if (view === 'faq') setView('chat');
      return;
    }

    const { uid, displayName, email } = auth.currentUser;
    const path = 'support_chats';

    if (view === 'faq') setView('chat');

    try {
      await addDoc(collection(db, path), {
        userId: uid,
        userName: displayName || email || 'Anonymous User',
        userEmail: email || '',
        senderId: uid,
        senderName: displayName || email || 'User',
        text: textToSend,
        senderType: 'user',
        careType: careType,
        branchId: branchId,
        timestamp: serverTimestamp(),
        isRead: false
      });

      if (!textOverride) setMessage('');

      // Mark unread messages from admin as read
      messages.filter(m => m.senderType === 'admin' && !(m as any).isRead).forEach(m => {
        updateDoc(doc(db, path, m.id), { isRead: true });
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Directly show chat for Marriage Bureau if requested
  const isMarriageBureau = careType === 'marriage';

  const resetFlow = () => {
    setView('faq');
    setHasReviewedFaq(false);
    setSearchQuery('');
  };

  const filteredFaqs = CUSTOMER_CARE_QA[careType].filter(item => 
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative bg-white dark:bg-slate-900 w-full h-full flex flex-col shadow-2xl overflow-hidden transition-all duration-500"
          >
            {/* Header */}
            <div className="px-8 pt-10 pb-6 flex items-center justify-between shrink-0 border-b border-gray-50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter transition-colors">Local Bandi Care</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">Founder Support Desk • Live Online</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-4 bg-gray-100 dark:bg-slate-800 rounded-2xl text-gray-400 hover:bg-gray-900 hover:text-white dark:hover:bg-slate-700 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Type Selector (Only in FAQ) */}
            {view === 'faq' && (
              <div className="px-8 py-6 bg-gray-50/50 dark:bg-slate-800/30 shrink-0 transition-colors border-b border-gray-50 dark:border-slate-800">
                <div className="max-w-4xl mx-auto flex bg-white dark:bg-slate-900 p-1.5 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800 overflow-x-auto scrollbar-hide">
                  {(['user', 'vendor', 'delivery', 'marriage'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setCareType(type); resetFlow(); }}
                      className={`flex-1 min-w-[100px] py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center justify-center ${
                        careType === type ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {type === 'user' && <User className="w-3.5 h-3.5" />}
                      {type === 'vendor' && <Briefcase className="w-3.5 h-3.5" />}
                      {type === 'delivery' && <Bike className="w-3.5 h-3.5" />}
                      {type === 'marriage' && <HeartHandshake className="w-3.5 h-3.5" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-slate-950 transition-colors">
              <AnimatePresence mode="wait">
                {view === 'faq' ? (
                  <motion.div 
                    key="faq"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    className="flex-1 overflow-y-auto px-8 py-12 scrollbar-hide"
                  >
                    <div className="max-w-4xl mx-auto space-y-12">
                      <div className="text-center space-y-4">
                        <h2 className="text-5xl font-black text-gray-900 dark:text-white italic tracking-tighter">How can we help?</h2>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Search our knowledge base or talk to a live agent</p>
                      </div>

                      <div className="relative group max-w-2xl mx-auto w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for answers, orders, payments..."
                          className="w-full bg-white dark:bg-slate-900 py-7 pl-16 pr-8 rounded-[3rem] font-bold text-lg outline-none border-4 border-transparent focus:border-indigo-50 dark:focus:border-indigo-900/30 transition-all shadow-2xl shadow-gray-100 dark:shadow-none"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {filteredFaqs.map((faq, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group"
                          >
                            <div className="flex items-start gap-5">
                              <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                <HelpCircle className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-3 italic leading-tight">{faq.q}</h4>
                                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium italic">{faq.a}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {filteredFaqs.length === 0 && (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] shadow-inner">
                          <Search className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                          <p className="text-xl font-bold text-gray-400 uppercase tracking-wider italic">No matching answers found</p>
                          <button onClick={() => setSearchQuery('')} className="mt-4 text-indigo-600 font-bold uppercase text-sm tracking-wider border-b-2 border-indigo-600">Clear Search</button>
                        </div>
                      )}

                      <div className="pt-20 border-t border-gray-100 dark:border-slate-800 text-center">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8 italic">Still stuck? Our human support is online</p>
                        <button 
                          onClick={() => setView('chat')}
                          className="px-16 py-7 bg-indigo-600 text-white rounded-[3rem] font-black text-base uppercase tracking-wider shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all"
                        >
                          Talk to Live Agent
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 transition-colors shadow-2xl"
                  >
                    <div className="px-8 py-6 bg-gray-50/50 dark:bg-slate-800/20 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setView('faq')} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 active:scale-90 transition-all">
                          <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                        </button>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white italic tracking-tight">Active Resolution Session</p>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                             <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Agent Connection Establised</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-full flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">End-To-End Protection</span>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-8 sm:px-20 py-8 space-y-8 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:opacity-80">
                      {messages.map((msg) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          key={msg.id} 
                          className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex flex-col ${msg.senderType === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[65%] space-y-2`}>
                            <div className={`p-6 rounded-[2.5rem] shadow-xl transition-all ${
                              msg.senderType === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100/50 dark:shadow-none' 
                                : msg.senderType === 'admin'
                                  ? 'bg-yellow-400 text-gray-900 rounded-bl-none shadow-yellow-100 dark:shadow-none'
                                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-bl-none shadow-gray-50/50 dark:shadow-none'
                            }`}>
                              <p className="text-sm sm:text-base font-bold leading-relaxed">{msg.text}</p>
                              <div className={`flex items-center gap-1.5 mt-4 opacity-50 ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <p className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                  {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                                   msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                                   new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {msg.senderType === 'user' && <ShieldCheck className="w-3 h-3" />}
                              </div>
                            </div>

                            {msg.senderType === 'bot' && (msg.text.includes('+91') || msg.text.includes(supportPhone)) && showSupportNumber && (
                              <motion.a 
                                whileTap={{ scale: 0.95 }}
                                href={`tel:${supportPhone}`}
                                className="inline-flex items-center gap-3 bg-emerald-500 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/20"
                              >
                                <Phone className="w-4 h-4" />
                                Call Founder Directly
                              </motion.a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="px-8 py-10 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 shrink-0">
                      <div className="max-w-4xl mx-auto space-y-8">
                        {showCallbackPicker && (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 shadow-2xl flex flex-col sm:flex-row items-center gap-6"
                          >
                            <div className="text-left shrink-0">
                               <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1 italic">Schedule Callback</p>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Our founder will call you</p>
                            </div>
                            <input 
                              type="datetime-local" 
                              value={callbackTime}
                              onChange={(e) => setCallbackTime(e.target.value)}
                              className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all dark:text-white"
                            />
                            <div className="flex gap-3 w-full sm:w-auto">
                              <button 
                                onClick={handleRequestCallback}
                                className="flex-1 sm:flex-none px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={() => setShowCallbackPicker(false)}
                                className="p-5 bg-gray-100 dark:bg-slate-700 text-gray-400 rounded-2xl"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </motion.div>
                        )}

                        <div className="flex flex-wrap gap-4 items-center justify-center">
                          <button 
                            onClick={() => setShowCallbackPicker(true)}
                            className="px-8 py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-sm"
                          >
                            <Clock className="w-4 h-4" />
                            Request Callback
                          </button>
                          <button 
                            onClick={() => {
                              setShowSupportNumber(true);
                              handleSendMessage("I want to speak with support now.");
                            }}
                            className="px-8 py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all shadow-sm"
                          >
                            <Phone className="w-4 h-4" />
                            Voice Support
                          </button>
                          <div className="p-2 px-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 flex items-center gap-3 opacity-80">
                             <ShieldCheck className="w-4 h-4 text-emerald-500" />
                             <p className="text-[10px] font-bold italic text-gray-400 dark:text-gray-500 uppercase tracking-widest">Secure Terminal</p>
                          </div>
                        </div>

                        <div className="relative group">
                          <textarea 
                            rows={1}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="Message our resolution team..."
                            className="w-full bg-white dark:bg-slate-900 px-8 py-7 pr-40 rounded-[3rem] font-bold text-lg outline-none border-4 border-transparent focus:border-indigo-50 dark:focus:border-indigo-900/30 transition-all shadow-2xl shadow-gray-100 dark:shadow-none resize-none min-h-[80px] max-h-[250px] dark:text-white"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <button className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                              <Camera className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleSendMessage()}
                              disabled={!message.trim()}
                              className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all disabled:opacity-50 disabled:grayscale group-hover:bg-indigo-700"
                            >
                              <Send className="w-7 h-7" />
                            </button>
                          </div>
                        </div>
                        <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">Press Enter to Send • Shift+Enter for new line</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Global Footer (When in FAQ) */}
            {view === 'faq' && (
              <div className="px-8 py-8 bg-gray-900 shrink-0 sticky bottom-0 z-10">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-indigo-400 backdrop-blur-xl border border-white/5 shadow-2xl">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-white italic tracking-tighter transition-colors">Founder Resolution Hub</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-80">Our specialized team is ready to help</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setView('chat')}
                    className="w-full sm:w-auto px-12 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-wider shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-indigo-700"
                  >
                    <span>Start Help Session</span>
                    <ChevronRight className="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
