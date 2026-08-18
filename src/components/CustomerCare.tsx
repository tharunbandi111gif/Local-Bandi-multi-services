import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, User, Briefcase, Bike, ChevronRight, MessageSquare, ShieldCheck, HeartHandshake, Clock, HelpCircle, Send, Search, CheckCheck, Camera, ShieldAlert, Globe, Zap } from 'lucide-react';
import { RiderQuickRepliesDrawer, QuickReplyChipsBar } from './RiderQuickRepliesDrawer';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, setDoc } from 'firebase/firestore';
import { SupportMessage, LanguageCode } from '../types';
import { LANGUAGES } from '../constants';
import { useTranslation } from '../i18n';
import LanguageSelectorModal from './common/LanguageSelectorModal';
import { getLocalizedCustomerCareContent } from '../utils/localizedContent';

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
  language?: LanguageCode;
}

const CUSTOMER_CARE_QA: Record<'user' | 'vendor' | 'delivery' | 'marriage', FAQItem[]> = {
  user: [
    { q: "How to place an order?", a: "Select a category, choose a vendor, add items to cart, and proceed to checkout with your address." },
    { q: "How to join as a vendor?", a: "Go to Profile > Partner Network. Choose 'Join as Vendor', fill the application, and pay the registration fee. Our team verified normally in 24 hours." },
    { q: "What is the return policy?", a: "As we deal with fresh farm products, returns are accepted only at the time of delivery if quality is not met." },
    { q: "Can I cancel my order?", a: "Orders can be cancelled before they are accepted by the vendor. Once 'In Preparation', cancellation may not be possible." },
    { q: "How long do UPI refunds take after cancellation?", a: "For cancelled orders paid using UPI (GPay, PhonePe, Paytm), refunds are highly prioritized and take only a few hours or up to 1 business day." },
    { q: "How long do Card refunds take after cancellation?", a: "Card refunds (Debit/Credit Cards) or Netbanking gateway refunds are released immediately by our system but take between 3 to 10 business days depending on banking card networks." },
    { q: "What are the phone customer support & callback hours?", a: "Our phone callback support is available daily from 09:20 AM to 05:00 PM. We are committed to solving all customer support issues as soon as possible!" },
    { q: "Can I upload screenshots/photos for my service problems?", a: "Yes, absolutely! Whether it's the Marriage Bureau, Real Estate postings, Hospital OP services, or delivery issues, you can upload screenshots/receipts/proofs directly in the live chat to fast-track your resolution." }
  ],
  vendor: [
    { q: "How to join as a vendor?", a: "Click on 'Join Partner Network' in the Profile section, fill the Vendor Application form, and pay the one-time registration fee. Our team will verify your shop within 24-48 hours." },
    { q: "How do I get paid?", a: "Payments (Weekly) are settled every Monday. You can request a payout from your Vendor Console when your balance is above ₹500." },
    { q: "What is the customer refund policy impact on vendors?", a: "If an order is cancelled by the customer before preparation, it is refunded fully and no merchant charges occur. If the store cancels after accepting, or customer cancels due to incorrect prep, cost offsets may apply as per merchant guidelines." },
    { q: "Need admin approval for property?", a: "Yes, first-time property members and all vendors must get approval from the admin. Once approved first time, you can add more projects easily." },
    { q: "How to contact Admin directly?", a: "You can use this chat or call the Founder Support Line provided in this help desk." },
    { q: "What are the hours for phone support & callbacks?", a: "Merchant & Vendor phone support and callback requests are accepted daily between 09:20 AM and 05:00 PM. Our team dedicates itself to resolving any operational bottlenecks as soon as possible." },
    { q: "Can we send photos/screenshots to customer support?", a: "Yes, vendors and clients across all services (Real Estate, OP, Marriage Bureau) can upload photos or receipt screenshots inside the live Help Session chat to quickly resolve order/payout mismatches." }
  ],
  delivery: [
    { q: "How to join as a delivery partner?", a: "Open 'Partner Network' in your Profile, select 'Delivery Partner', and upload your Aadhar and DL. Once verified, you can start taking orders locally." },
    { q: "How are trips assigned?", a: "Orders are assigned based on your proximity to the vendor and your current workload (Automatic Mode)." },
    { q: "What if an order gets cancelled during delivery?", a: "If an order is cancelled after you have picked up the items or are on-route, a compensatory cancellation pay is credited to your wallet, and you must return the items safely to the vendor." },
    { q: "Incentives for workers?", a: "Yes, we provide performance-based bonuses and night-shift incentives for active delivery partners." },
    { q: "How to request a fallback/callback phone support slot?", a: "You can request a voice callback daily from 09:20 AM to 05:00 PM. We strive to solve rider issues on-road as soon as possible." },
    { q: "Can riders or customers upload images/screenshots in chats?", a: "Yes, users from all segments—including Marriage Bureau, Real estate, local shops, and hospital OPs—can attach photos or screenshots in active support chats to resolve disputes rapidly." }
  ],
  marriage: [
    { q: "How to register in Marriage Bureau?", a: "Navigate to the Marriage Bureau section from the Home screen, click 'Create Profile', and fill in your details along with photos." },
    { q: "Who can see my details?", a: "Contact details are only shared after both parties express interest and mutual consent. Your privacy is our priority." },
    { q: "Is there a chatting option?", a: "Yes, only in the Marriage Bureau section, we provide direct chatting and call options once a match is mutually accepted." },
    { q: "When is customer support of Marriage Bureau open for callbacks?", a: "Our phone callback assistance is open every day from 09:20 AM to 05:00 PM. We investigate and resolve matchmaking or subscription issues as soon as possible." },
    { q: "Can I chat and upload photos/screenshots to Marriage customer care?", a: "Yes! For Marriage Bureau, Real Estate, Hospital OP, and general services, you can upload profile screenshots, payment receipts, or verification photos in the chat for instant admin resolution." }
  ]
};

export default function CustomerCare({ isOpen, onClose, supportPhone, secondaryPhone, initialType = 'user', branchId, language = 'en-IN' }: CustomerCareProps) {
  const { language: currentLanguage, setLanguage: setCurrentLanguage } = useTranslation();
  const [showLangModal, setShowLangModal] = useState(false);
  const t = getLocalizedCustomerCareContent(currentLanguage);

  const [careType, setCareType] = useState<'user' | 'vendor' | 'delivery' | 'marriage'>(initialType);
  const [view, setView] = useState<'faq' | 'chat' | 'complaints'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasReviewedFaq, setHasReviewedFaq] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [message, setMessage] = useState('');
  const [showQuickRepliesDrawer, setShowQuickRepliesDrawer] = useState(false);
  const [showSupportNumber, setShowSupportNumber] = useState(false);
  const [showCallbackPicker, setShowCallbackPicker] = useState(false);
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Support Complaint Form States
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  const [complaintCategory, setComplaintCategory] = useState<'Payment Issue' | 'Delivery Boy Behavior' | 'Order Issue' | 'Other'>('Payment Issue');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintOrderId, setComplaintOrderId] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert("Please select a photo/screenshot smaller than 2.5MB.");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      console.error("Failed to read image file.");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  // Sync user orders and complaints in real-time
  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;

    // 1. Sync orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const ordersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserOrders(ordersData);
    }, (err) => console.warn("Failed to stream orders in care:", err));

    // 2. Sync complaints
    const complaintsQuery = query(
      collection(db, 'support_complaints'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubComplaints = onSnapshot(complaintsQuery, (snap) => {
      const complaintsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserComplaints(complaintsData);
    }, (err) => console.warn("Failed to stream complaints in care:", err));

    return () => {
      unsubOrders();
      unsubComplaints();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCareType(initialType);
      setView('faq');
      setHasReviewedFaq(false);
      setShowSupportNumber(false);
      setShowCallbackPicker(false);
      setExpandedFaq(null);
      setComplaintSuccess(false);
      setComplaintDescription('');
      setComplaintOrderId('');
      
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
    if (!callbackTime) {
      setCallbackError("Please select a date and time.");
      return;
    }
    
    const selectedDate = new Date(callbackTime);
    if (isNaN(selectedDate.getTime())) {
      setCallbackError("Please select a valid date and time.");
      return;
    }
    
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // Support hours: 9:20 AM (560) to 5:00 PM (1020)
    const minTime = 9 * 60 + 20;
    const maxTime = 17 * 60;
    
    if (timeInMinutes < minTime || timeInMinutes > maxTime) {
      setCallbackError("⚠️ Callback request accepted only for 09:20 AM to 05:00 PM daily. Please pick a slot within these hours. Our team is dedicated to solving your problems as soon as possible!");
      return;
    }
    
    setCallbackError(null);
    const timeString = selectedDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    const text = `I would like a phone callback at: ${timeString}`;
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
          text: `Got it! We've scheduled your callback for ${timeString}. We are dedicated to solving your problems as soon as possible! You can also reach us at +91 ${supportPhone} during active hours.`,
          senderType: 'bot',
          careType: careType,
          branchId: branchId,
          timestamp: serverTimestamp(),
          isRead: false
        });
      }, 1000);
    }
  };

  const handleSendMessage = async (textOverride?: string, customImage?: string) => {
    const textToSend = textOverride || message;
    const imageToSend = customImage || selectedImage;
    if (!textToSend.trim() && !imageToSend) return;

    // Check for keywords but don't show number immediately anymore
    const lowerText = (textToSend || '').toLowerCase();
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
        imageUrl: imageToSend || undefined,
        senderType: 'user' as const, 
        timestamp: new Date().toISOString() 
      }]);
      setMessage('');
      setSelectedImage(null);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: `temp-bot-${Date.now()}`, 
          senderId: 'bot',
          senderName: 'Bot',
          text: "Please sign in to save your conversation, request a callback, or send photos/screenshots.", 
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
        imageUrl: imageToSend || null,
        senderType: 'user',
        careType: careType,
        branchId: branchId,
        timestamp: serverTimestamp(),
        isRead: false
      });

      if (!textOverride) setMessage('');
      setSelectedImage(null);
      
      // Mark unread messages from admin as read
      messages.filter(m => m.senderType === 'admin' && !(m as any).isRead).forEach(m => {
        updateDoc(doc(db, path, m.id), { isRead: true });
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !complaintDescription.trim()) return;

    setIsSubmittingComplaint(true);
    const { uid, displayName, email, phoneNumber } = auth.currentUser;
    const complaintId = `COMP-${Date.now()}`;

    // Try to find if there's a branchId on the selected order to route properly!
    let orderBranchId = branchId;
    if (complaintOrderId) {
      const selectedOrder = userOrders.find(o => o.id === complaintOrderId);
      if (selectedOrder && selectedOrder.branchId) {
        orderBranchId = selectedOrder.branchId;
      }
    }

    try {
      await setDoc(doc(db, 'support_complaints', complaintId), {
        id: complaintId,
        userId: uid,
        customerName: displayName || email || 'User',
        customerPhone: phoneNumber || '',
        orderId: complaintOrderId || 'N/A',
        category: complaintCategory,
        description: complaintDescription,
        status: 'Pending',
        adminAnswer: '',
        branchId: orderBranchId || 'central',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Also post a system notification/msg to support_chats so the customer support can get an alert or message!
      await addDoc(collection(db, 'support_chats'), {
        userId: uid,
        userName: displayName || email || 'User',
        senderId: 'system',
        senderName: 'System',
        text: `🚨 [COMPLAINT SUBMITTED] Ticket ID: ${complaintId} | Category: ${complaintCategory} | Order ID: ${complaintOrderId || 'None'} | Description: ${complaintDescription}`,
        senderType: 'bot',
        careType: careType,
        branchId: orderBranchId || 'central',
        timestamp: serverTimestamp(),
        isRead: false
      });

      setComplaintDescription('');
      setComplaintOrderId('');
      setComplaintSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'support_complaints');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Directly show chat for Marriage Bureau if requested
  const isMarriageBureau = careType === 'marriage';

  const resetFlow = () => {
    setView('faq');
    setHasReviewedFaq(false);
    setSearchQuery('');
  };

  const sq = (searchQuery || '').toLowerCase();
  const filteredFaqs = (CUSTOMER_CARE_QA[careType] || []).filter(item => 
    !sq ||
    (item.q || '').toLowerCase().includes(sq) || 
    (item.a || '').toLowerCase().includes(sq)
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
            <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white italic tracking-tighter">Local Bandi Care</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Founder Support Desk • Live Online</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLangModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                  title="Select App Language / 24 Languages"
                >
                  <Globe className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  <span>{LANGUAGES.find(l => l.code === currentLanguage)?.native || 'Language'}</span>
                </button>

                {/* View Tabs */}
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setView('faq')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      view === 'faq' 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    FAQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('chat')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      view === 'chat' 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    Live Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('complaints')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      view === 'complaints' 
                        ? 'bg-indigo-600 text-white shadow' 
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    Complaints
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-400 hover:bg-gray-900 hover:text-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                ) : view === 'chat' ? (
                  <motion.div 
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 transition-colors shadow-2xl"
                  >
                    <div className="px-4 sm:px-6 py-2.5 bg-gray-50/80 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setView('faq')} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-90 transition-all cursor-pointer" title="Back to FAQ">
                          <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                        </button>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white italic tracking-tight">Active Resolution Session</p>
                          <div className="flex items-center gap-1.5">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                             <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Agent Connection Established</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800/40">
                        <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">End-To-End Protected</span>
                      </div>
                    </div>

                    {/* Messages Area - Expanded for Conversation Space */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-6 space-y-4 bg-slate-50/60 dark:bg-slate-950/80">
                      {messages.map((msg) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.97, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          key={msg.id} 
                          className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex flex-col ${msg.senderType === 'user' ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[78%] space-y-1`}>
                            {/* Sender Label */}
                            <div className="flex items-center gap-1.5 px-1">
                              <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                                {msg.senderType === 'user' ? (msg.senderName || 'You') : msg.senderType === 'admin' ? 'Support Specialist' : 'Local Bandi Assistant'}
                              </span>
                            </div>

                            <div className={`px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl shadow-sm transition-all ${
                              msg.senderType === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100/50 dark:shadow-none' 
                                : msg.senderType === 'admin'
                                  ? 'bg-amber-400 text-gray-950 rounded-bl-none shadow-amber-100 dark:shadow-none font-medium'
                                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-bl-none shadow-gray-100/50 dark:shadow-none'
                            }`}>
                              {msg.imageUrl && (
                                <div className="mb-3 overflow-hidden rounded-xl border border-black/10 max-w-full">
                                  <img 
                                    src={msg.imageUrl} 
                                    alt="Uploaded Support Proof" 
                                    className="max-h-60 object-contain mx-auto rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <p className="text-sm sm:text-base font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <div className={`flex items-center gap-1.5 mt-2 opacity-60 ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <p className="text-[9px] font-bold uppercase tracking-wider leading-none">
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
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-emerald-700 transition-all mt-1"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                Call Support ({supportPhone})
                              </motion.a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area - Streamlined & Compact */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 shrink-0">
                      <div className="max-w-4xl mx-auto space-y-3">
                        {/* Quick action bar */}
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowCallbackPicker(true)}
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all shadow-xs cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Request Callback</span>
                            </button>
                            <button 
                              onClick={() => {
                                setShowSupportNumber(true);
                                handleSendMessage("I want to speak with support now.");
                              }}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all shadow-xs cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Voice Support</span>
                            </button>
                          </div>

                          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 opacity-80">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <p className="text-[10px] font-bold italic text-gray-500 dark:text-gray-400 uppercase tracking-wider">Direct Resolution Channel</p>
                          </div>
                        </div>

                        {/* Callback picker popup card */}
                        {showCallbackPicker && (
                          <motion.div 
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-xl space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                              <div>
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest italic font-mono">Schedule Callback Slot</p>
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase">Hours: 09:20 AM - 05:00 PM Daily</h4>
                              </div>
                              <button 
                                onClick={() => { setShowCallbackPicker(false); setCallbackError(null); }}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                              <input 
                                type="datetime-local" 
                                value={callbackTime}
                                onChange={(e) => {
                                  setCallbackTime(e.target.value);
                                  setCallbackError(null);
                                }}
                                className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold outline-none dark:text-white"
                              />
                              <button 
                                onClick={handleRequestCallback}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                              >
                                Confirm Slot
                              </button>
                            </div>

                            {callbackError && (
                              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                {callbackError}
                              </p>
                            )}
                          </motion.div>
                        )}

                        {/* Screenshot preview attachment */}
                        {selectedImage && (
                          <motion.div 
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={selectedImage} 
                                alt="Screenshot attachment preview" 
                                className="w-12 h-12 object-cover rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-left font-sans">
                                 <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Attachment Ready</p>
                                 <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Will send with message</p>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setSelectedImage(null)}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Remove
                            </button>
                          </motion.div>
                        )}

                        {/* One-tap Quick Replies toolbar if Rider/Delivery Care */}
                        {careType === 'delivery' && (
                          <div className="pt-1">
                            <QuickReplyChipsBar
                              onSelectReply={(text, autoSend) => {
                                if (autoSend) {
                                  handleSendMessage(text);
                                } else {
                                  setMessage(text);
                                }
                              }}
                              onOpenDrawer={() => setShowQuickRepliesDrawer(true)}
                              theme="light"
                            />
                          </div>
                        )}

                        {/* Text input row */}
                        <div className="relative flex items-center gap-2">
                          {careType === 'delivery' && (
                            <button
                              type="button"
                              onClick={() => setShowQuickRepliesDrawer(true)}
                              className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-2xl transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
                              title="Open Quick Replies Drawer"
                            >
                              <Zap className="w-5 h-5 fill-amber-500" />
                            </button>
                          )}
                          <input 
                            type="file"
                            ref={imageInputRef}
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <div className="flex-1 relative flex items-center">
                            <textarea 
                              rows={1}
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                              placeholder={careType === 'delivery' ? "Ask support or select a Quick Reply above..." : "Type your message to support..."}
                              className="w-full bg-white dark:bg-slate-900 px-4 py-3 pr-11 rounded-2xl font-medium text-sm sm:text-base outline-none border border-gray-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all shadow-xs resize-none min-h-[46px] max-h-[160px] dark:text-white font-sans"
                            />
                            <button 
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              title="Attach photo or screenshot"
                              className={`absolute right-2.5 p-2 rounded-xl transition-colors cursor-pointer ${
                                selectedImage 
                                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                                  : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                              }`}
                            >
                              <Camera className="w-5 h-5" />
                            </button>
                          </div>

                          <button 
                            onClick={() => handleSendMessage()}
                            disabled={!message.trim() && !selectedImage}
                            className="px-5 py-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                          >
                            <Send className="w-4 h-4 mr-1.5" />
                            <span>Send</span>
                          </button>
                        </div>

                        {/* Quick Replies Drawer */}
                        <RiderQuickRepliesDrawer
                          isOpen={showQuickRepliesDrawer}
                          onClose={() => setShowQuickRepliesDrawer(false)}
                          onSelectReply={(text, autoSend) => {
                            if (autoSend) {
                              handleSendMessage(text);
                            } else {
                              setMessage(text);
                            }
                          }}
                          theme="light"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="complaints"
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 25 }}
                    className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 scrollbar-hide bg-white dark:bg-slate-900"
                  >
                    <div className="max-w-4xl mx-auto grid md:grid-cols-12 gap-8">
                      {/* Left side: Submit Complaint Ticket */}
                      <div className="md:col-span-12 lg:col-span-7 bg-gray-50 dark:bg-slate-950 p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl">
                            <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white italic tracking-tight">Submit Complaint Ticket</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fast-track response from customer service</p>
                          </div>
                        </div>

                        {complaintSuccess ? (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl text-center space-y-4"
                          >
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none">
                              <CheckCheck className="w-6 h-6" />
                            </div>
                            <h5 className="text-lg font-black text-emerald-900 dark:text-emerald-400">Complaint Logged Successfully!</h5>
                            <p className="text-xs text-emerald-700 dark:text-emerald-500 font-bold max-w-xs mx-auto leading-relaxed">
                              Your support ticket is now routed directly to our local branch and master administrators. You will receive an alert once resolved.
                            </p>
                            <button 
                              type="button"
                              onClick={() => setComplaintSuccess(false)}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                            >
                              Log Another Ticket
                            </button>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleSubmitComplaint} className="space-y-4">
                            {/* Category Selection */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Complaint Category</span>
                              <div className="grid grid-cols-2 gap-2">
                                {(['Payment Issue', 'Delivery Boy Behavior', 'Order Issue', 'Other'] as const).map((cat) => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setComplaintCategory(cat)}
                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition-all cursor-pointer border ${
                                      complaintCategory === cat
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-950/45'
                                        : 'bg-white dark:bg-slate-900 text-slate-500 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Linked Order Dropdown */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Linked Order ID (Optional)</label>
                              <div className="relative">
                                <select
                                  value={complaintOrderId}
                                  onChange={(e) => setComplaintOrderId(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold outline-none text-slate-705 dark:text-slate-200 cursor-pointer"
                                >
                                  <option value="">-- No Order Selected --</option>
                                  {userOrders.map((ord) => (
                                    <option key={ord.id} value={ord.id}>
                                      ID: {ord.id} ({ord.items ? `${ord.items.length} items` : ''} - ₹{ord.totalAmount} - {new Date(ord.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <p className="text-[9px] text-gray-400 font-bold italic">Select the order related to your complaint for immediate dispatch actions</p>
                            </div>

                            {/* Details Text Area */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Describe Your Complaint</label>
                              <textarea
                                required
                                rows={4}
                                value={complaintDescription}
                                onChange={(e) => setComplaintDescription(e.target.value)}
                                placeholder="Explain of delivery delay, paid double via UPI, missing items, or delivery agent attitude..."
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-semibold outline-none text-slate-700 dark:text-slate-200 focus:border-rose-500"
                              />
                            </div>

                            {/* Submit Button */}
                            <button
                              type="submit"
                              disabled={isSubmittingComplaint || !complaintDescription.trim()}
                              className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg cursor-pointer"
                            >
                              {isSubmittingComplaint ? 'Submitting Ticket...' : 'Dispatch Ticket to Support'}
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Right side: Ticket History & Answers */}
                      <div className="md:col-span-12 lg:col-span-5 space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white italic tracking-tight font-sans">Support History</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">View past tickets and admin answers</p>
                          </div>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
                          {userComplaints.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-950 p-6 rounded-[2rem] border border-dashed border-gray-200 dark:border-slate-800">
                              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active complaints found</p>
                            </div>
                          ) : (
                            userComplaints.map((ticket) => (
                              <motion.div
                                key={ticket.id}
                                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm space-y-3.5"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="px-2 py-1 bg-gray-150 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-wider border border-gray-100 dark:border-slate-750">
                                    {ticket.id}
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                    ticket.status === 'Pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                    ticket.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                                    ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {ticket.status}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest block">{ticket.category}</span>
                                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                    "{ticket.description}"
                                  </p>
                                </div>

                                {ticket.orderId && ticket.orderId !== 'N/A' && (
                                  <div className="text-[9px] font-semibold text-slate-400 uppercase">
                                    Linked Order: <span className="font-extrabold text-indigo-500">{ticket.orderId}</span>
                                  </div>
                                )}

                                {/* Admin Official Answer */}
                                {ticket.adminAnswer ? (
                                  <div className="bg-indigo-50/50 dark:bg-indigo-910/10 p-4 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center gap-1.5">
                                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                      <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider">Official Resolution Answer</span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                                      {ticket.adminAnswer}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-xl border border-dashed border-amber-200/40 dark:border-amber-950/10 text-center">
                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest italic leading-none">
                                      Awaiting service desk review...
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            ))
                          )}
                        </div>
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

            <LanguageSelectorModal
              isOpen={showLangModal}
              onClose={() => setShowLangModal(false)}
              selectedLanguage={currentLanguage}
              onSelectLanguage={(code) => {
                setCurrentLanguage(code);
                localStorage.setItem('lokal_app_language', code);
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
