import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  CheckCircle2, 
  Package, 
  Bike, 
  Clock, 
  Wallet, 
  Star, 
  HelpCircle, 
  MoreVertical,
  LogOut,
  Power,
  ClipboardList,
  Send,
  ShieldCheck
} from 'lucide-react';
import { DeliveryOrder, DeliveryPartnerProfile, SupportMessage } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, serverTimestamp } from 'firebase/firestore';

interface DeliveryDashboardProps {
  onBack: () => void;
}

export default function DeliveryDashboard({ onBack }: DeliveryDashboardProps) {
  const { user } = useFirebase();
  const [isBanned, setIsBanned] = useState(false);
  const [profile, setProfile] = useState<DeliveryPartnerProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    // Listen for this specific delivery partner's profile
    const q = query(collection(db, 'deliveryPartners'), where('phone', '==', user.phoneNumber?.replace('+91', '') || ''));
    
    // Fallback search by name if phone mismatch (for testing)
    // In production, we should use UID. For now we use phone as requested.
    
    const unsub = onSnapshot(collection(db, 'deliveryPartners'), (snapshot) => {
      const me = snapshot.docs.find(d => d.data().phone === user.phoneNumber?.replace('+91', ''))?.data() as DeliveryPartnerProfile;
      if (me) {
        setProfile(me);
        if (me.status === 'Banned') {
          setIsBanned(true);
        }
      }
    }, err => handleFirestoreError(err, OperationType.GET, 'deliveryPartners'));

    return () => unsub();
  }, [user]);

  const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'history' | 'performance' | 'support'>('home');
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = () => {
      const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
      const myChat = allChats[profile.id];
      if (myChat) {
        setMessages(myChat.messages);
      } else {
        const welcomeMsg: SupportMessage = {
          id: 'welcome-1',
          senderId: 'admin',
          senderName: 'Lokal Support',
          senderType: 'admin',
          text: "Welcome to Lokal Support! How can we help you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([welcomeMsg]);
      }
    };
    loadMessages();
    
    // Listen for new messages from admin
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lokal_support_chats') {
        loadMessages();
      }
    };
    const handleCustomEvent = () => loadMessages();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('support_message_received', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('support_message_received', handleCustomEvent);
    };
  }, [profile.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'support') {
      scrollToBottom();
    }
  }, [messages, isTyping, activeTab]);

  const [tripHistory, setTripHistory] = useState([
    { id: 'DO-8889', date: 'Today, 12:30 PM', amount: 45, status: 'Completed', address: 'MG Road to Civil Lines' },
    { id: 'DO-8887', date: 'Yesterday, 8:45 PM', amount: 45, status: 'Completed', address: 'Railway Station to Gandhi Nagar' },
    { id: 'DO-8886', date: 'Yesterday, 6:15 PM', amount: 60, status: 'Completed', address: 'Market Area to Sai Temple' },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: SupportMessage = { 
      id: `msg-${Date.now()}`, 
      senderId: profile.id, 
      senderName: profile.name,
      senderType: 'partner',
      text: chatMessage, 
      timestamp: now 
    };

    const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
    const myChat = allChats[profile.id] || { partnerId: profile.id, partnerName: profile.name, messages: [], lastMessageTimestamp: now };
    
    myChat.messages.push(newMsg);
    myChat.lastMessageTimestamp = now;
    // For admin to see it's unread
    myChat.unreadCount = (myChat.unreadCount || 0) + 1;
    
    allChats[profile.id] = myChat;
    localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
    setMessages(prev => [...prev, newMsg]);
    setChatMessage('');
    
    // Notify admin
    window.dispatchEvent(new CustomEvent('support_message_sent'));
  };

  if (!profile && !isBanned) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }
  if (isBanned) {
    return (
      <div className="h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-rose-900">
           <Power className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-black italic mb-4">Account Suspended</h2>
        <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">
          Your delivery partner account has been terminated by the Founder Panel. 
          Please contact our support team for any clarifications.
        </p>
        <button 
          onClick={onBack}
          className="w-full p-5 bg-white text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px]"
        >
          Logout Session
        </button>
      </div>
    );
  }

  if (activeTab === 'support') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20 shadow-sm">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-xs">LS</div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Partner Support</h2>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">● Online Now</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-4 rounded-[2rem] text-[13px] font-bold leading-relaxed shadow-sm ${
                  msg.senderType === 'partner' ? 'bg-indigo-600 text-white rounded-br-[4px]' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-[4px]'
                }`}>
                  {msg.text}
                  <p className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-60 ${msg.senderType === 'partner' ? 'text-right' : ''}`}>{msg.timestamp}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white p-4 rounded-[2rem] rounded-bl-[4px] border border-slate-100 shadow-sm flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] pb-28">
          <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-100 p-2 rounded-[2rem] border-2 border-transparent focus-within:border-indigo-400 transition-all">
            <input 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type your issue..."
              className="flex-1 bg-transparent px-4 py-2 font-bold text-sm outline-none placeholder:text-slate-400"
            />
            <button 
              disabled={!chatMessage.trim()}
              className="p-3 bg-gray-900 text-white rounded-full active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  useEffect(() => {
    // In production, we would listen for new orders assigned to this partner in Firestore.
  }, [profile?.status, activeOrder]);

  const handleStatusToggle = async () => {
    if (!profile) return;
    try {
      const nextOnline = !profile.isOnline;
      await updateDoc(doc(db, 'deliveryPartners', profile.id), {
        isOnline: nextOnline,
        status: nextOnline ? 'Online' : 'Offline',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${profile.id}`);
    }
  };

  const handleAcceptOrder = () => {
    if (activeOrder) {
      setActiveOrder({ ...activeOrder, status: 'Accepted' });
    }
  };

  const handlePickup = () => {
    if (activeOrder) {
      setActiveOrder({ ...activeOrder, status: 'PickedUp' });
    }
  };

  const handleDeliver = () => {
    if (activeOrder) {
      setActiveOrder({ ...activeOrder, status: 'Delivered' });
      const payout = 45; // Simulated payout
      setProfile(prev => ({
        ...prev,
        earnings: prev.earnings + payout,
        trips: prev.trips + 1
      }));
      // Reset after a delay
      setTimeout(() => setActiveOrder(null), 2000);
    }
  };

  const openInGoogleMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (showProfile) {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setShowProfile(false)} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Partner Details</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
            <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-sm">
               <img src="https://i.pravatar.cc/150?u=suresh" className="w-full h-full object-cover" alt="Suresh" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-slate-900 leading-none">Suresh Kumar</h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-400">ID: LKL-7829-DEL</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Verified Partner</span>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100">Bike Rider</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col items-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Account Status</p>
                <p className="text-sm font-black text-emerald-500 uppercase tracking-widest">Active</p>
             </div>
             <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col items-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Duty Hours</p>
                <p className="text-sm font-black text-slate-900">124.5 h</p>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Documents & Verification</h4>
            <div className="space-y-3">
              {[
                { label: 'Aadhaar Card', status: 'Verified', date: '24 Apr', color: 'emerald' },
                { label: 'Driving License', status: 'Verified', date: '24 Apr', color: 'emerald' },
                { label: 'Vehicle RC', status: 'Verified', date: '25 Apr', color: 'emerald' },
                { label: 'Insurance Policy', status: 'Expiring Soon', date: '30 Jun', color: 'orange', warning: true }
              ].map((doc, i) => (
                <div key={i} className={`p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all ${doc.warning ? 'bg-orange-50/30 border-orange-100' : 'bg-white border-slate-50 shadow-sm'}`}>
                  <div>
                    <p className="text-xs font-black text-slate-900">{doc.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">Last validated on {doc.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${doc.warning ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400 rounded-full -mr-12 -mt-12 blur-3xl opacity-20"></div>
             <div className="relative z-10">
               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">Professional Hub</h5>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                     </div>
                     <div>
                        <p className="text-[13px] font-black leading-none mb-1">Rider of the Month</p>
                        <p className="text-[10px] font-bold text-indigo-300 capitalize">Awarded on Mar 12, 2024</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                     </div>
                     <div>
                        <p className="text-[13px] font-black leading-none mb-1">Safety First Badge</p>
                        <p className="text-[10px] font-bold text-indigo-300 capitalize">100% Secure Deliveries</p>
                     </div>
                  </div>
               </div>
             </div>
          </div>

          <button onClick={onBack} className="w-full p-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
             <LogOut className="w-4 h-4" />
             Logout Partner Session
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === 'performance') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Performance</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-400 rounded-full blur-[80px] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex justify-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 text-yellow-400 fill-yellow-400" />)}
              </div>
              <h3 className="text-4xl font-black text-slate-900">4.9</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Excellent (254 Ratings)</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Customer Feedback</h4>
            <div className="space-y-3">
              {[
                { name: 'Rahul M.', text: 'Very polite and delivered on time!', stars: 5, time: '2h ago' },
                { name: 'Sneha G.', text: 'Excellent service, items were handled carefully.', stars: 5, time: '5h ago' }
              ].map((review, i) => (
                <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-black text-slate-900">{review.name}</p>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{review.time}</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 mb-2 italic">"{review.text}"</p>
                  <div className="flex gap-0.5">
                    {[...Array(review.stars)].map((_, j) => <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'history') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Trip History</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
          {tripHistory.map((trip) => (
            <div key={trip.id} className="bg-white p-5 rounded-[2rem] border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm font-black text-slate-900">{trip.id}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{trip.date}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase">
                  ₹{trip.amount} Payout
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 truncate">{trip.address}</p>
              </div>
            </div>
          ))}
          {tripHistory.length === 0 && (
            <div className="py-12 text-center grayscale opacity-50">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase">No trips found</p>
            </div>
          )}
        </div>
        
        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'earnings') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Earnings</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full -mr-16 -mt-16 blur-3xl opacity-20"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Balance</p>
            <h3 className="text-4xl font-black mb-6">₹{profile.earnings}</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (profile.pendingPayout === 0) {
                    alert("No pending payout to withdraw.");
                    return;
                  }
                  alert("Withdrawal request sent to Founder Panel for ₹" + profile.pendingPayout);
                }}
                className="flex-1 py-3 bg-yellow-400 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
              >
                Withdrawal Request
              </button>
              <button onClick={() => setActiveTab('history')} className="flex-1 py-3 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-sm active:bg-white/20 transition-all">History</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recent Transactions</h4>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 mb-0.5">Trip Payout #DO-{8890-i}</p>
                  <p className="text-[10px] font-bold text-slate-400">Today, 12:30 PM</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">+₹45</p>
                  <p className="text-[9px] font-bold text-slate-400 font-mono">Credited</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-slate-100 rounded-xl mr-2">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => setShowProfile(true)} className="relative group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group-hover:border-indigo-400 transition-all">
              <img src="https://i.pravatar.cc/150?u=suresh" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex flex-col ml-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">DP Console</h2>
            <p className="text-[10px] font-bold text-slate-400">v1.2.0-Alpha</p>
          </div>
        </div>
        <button 
          onClick={handleStatusToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
            profile.status === 'Online' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Power className="w-3 h-3" />
          {profile.status}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* Availability Toggle - Large Card */}
        <div className={`mb-8 p-6 rounded-[2.5rem] border transition-all duration-500 ${
          profile.status === 'Online' 
            ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-200' 
            : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                profile.status === 'Online' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Availability</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  profile.status === 'Online' ? 'text-emerald-100' : 'text-slate-400'
                }`}>
                  {profile.status === 'Online' ? 'Ready for Orders' : 'Currently Offline'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleStatusToggle}
              className={`w-16 h-8 rounded-full relative transition-colors duration-300 ${
                profile.status === 'Online' ? 'bg-white/40' : 'bg-slate-200'
              }`}
            >
              <motion.div 
                animate={{ x: profile.status === 'Online' ? 32 : 4 }}
                className={`w-6 h-6 rounded-full bg-white absolute top-1 shadow-sm`}
              />
            </button>
          </div>
          {profile.status === 'Offline' && (
            <p className="text-[10px] font-medium opacity-60 leading-relaxed italic">
              Go online to start receiving orders in Wardha region.
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button onClick={() => setActiveTab('earnings')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm active:scale-95 transition-all">
            <Wallet className="w-5 h-5 text-indigo-500 mb-2" />
            <span className="text-xs font-black text-slate-900">₹{profile.earnings}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Earnings</span>
          </button>
          <button onClick={() => setActiveTab('performance')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm active:scale-95 transition-all">
            <Star className="w-5 h-5 text-yellow-500 mb-2" />
            <span className="text-xs font-black text-slate-900">{profile.rating}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Rating</span>
          </button>
          <button onClick={() => setActiveTab('history')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm active:scale-95 transition-all">
            <Bike className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-xs font-black text-slate-900">{profile.trips}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Trips</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {profile.status === 'Offline' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Bike className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 italic">Waiting for You</h3>
              <p className="text-sm font-bold text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                Flip the switch above to start your duty.
              </p>
            </motion.div>
          ) : !activeOrder ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
                <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl border border-emerald-50">
                  <Navigation className="w-12 h-12 text-emerald-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 animate-pulse">Searching for Orders...</h3>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">GPS Active: Wardha, MH</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 p-8 shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">New Order</h4>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{activeOrder.id}</span>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    ₹45 Earnings
                  </div>
                </div>

                <div className="space-y-6 relative ml-2">
                  <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-slate-100 border-l border-dashed border-slate-300"></div>
                  
                  <div className="flex gap-4 relative group cursor-pointer" onClick={() => activeOrder && openInGoogleMaps(activeOrder.pickupLocation.lat, activeOrder.pickupLocation.lng, 'Vendor')}>
                    <div className="w-4 h-4 bg-orange-400 rounded-full ring-4 ring-orange-50 shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Pickup From Vendor</p>
                        <Navigation className="w-3 h-3 text-orange-400" />
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{activeOrder.pickupAddress}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative group cursor-pointer" onClick={() => activeOrder && openInGoogleMaps(activeOrder.deliveryLocation.lat, activeOrder.deliveryLocation.lng, 'Customer')}>
                    <div className="w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-emerald-50 shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Delivery To Customer</p>
                        <Navigation className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{activeOrder.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  {activeOrder.status === 'Pending' ? (
                    <>
                      <button 
                        onClick={() => setActiveOrder(null)}
                        className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={handleAcceptOrder}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                      >
                        Accept Order
                      </button>
                    </>
                  ) : activeOrder.status === 'Accepted' ? (
                    <button 
                      onClick={handlePickup}
                      className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Confirm Pickup
                    </button>
                  ) : activeOrder.status === 'PickedUp' ? (
                    <button 
                      onClick={handleDeliver}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Delivered
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-emerald-100 text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" />
                       Order Completed!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Sheet */}
              {activeOrder.status !== 'Pending' && activeOrder.status !== 'Delivered' && (
                <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (activeOrder.status === 'Accepted') {
                        openInGoogleMaps(activeOrder.pickupLocation.lat, activeOrder.pickupLocation.lng, 'Vendor');
                      } else {
                        openInGoogleMaps(activeOrder.deliveryLocation.lat, activeOrder.deliveryLocation.lng, 'Customer');
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all"
                  >
                    <Navigation className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {activeOrder.status === 'Accepted' ? 'To Vendor' : 'To Customer'}
                    </span>
                  </button>
                  <button 
                    onClick={() => window.open(`tel:${activeOrder.customerPhone}`)}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all"
                  >
                    <PhoneCall className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Call Cust.</span>
                  </button>
                  <button onClick={() => setActiveTab('support')} className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all col-span-2">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Support Helper</span>
                  </button>
                </div>
              )}
              
              {/* Map View Placeholder */}
              <div className="h-48 bg-slate-200 rounded-[2.5rem] relative overflow-hidden shadow-inner">
                {true && <img src="https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=800&q=80" className="w-full h-full object-cover opacity-50 grayscale" alt="Map" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-200 via-transparent to-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                   <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center ring-4 ring-white/30">
                      <Bike className="w-6 h-6 text-indigo-600" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function QuickNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (s: any) => void }) {
  return (
    <div className="fixed bottom-8 left-6 right-6 bg-gray-900 rounded-3xl p-3 flex justify-between shadow-2xl z-50">
      <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl ${activeTab === 'home' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Clock className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('history')} className={`p-3 rounded-2xl ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><ClipboardList className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('earnings')} className={`p-3 rounded-2xl ${activeTab === 'earnings' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Wallet className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('performance')} className={`p-3 rounded-2xl ${activeTab === 'performance' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Star className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('support')} className={`p-3 rounded-2xl ${activeTab === 'support' ? 'bg-white/10 text-white' : 'text-gray-400'} active:scale-95 transition-all outline-none`}><HelpCircle className="w-6 h-6" /></button>
    </div>
  );
}
