import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Store, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Wallet, 
  Star,
  ChevronRight,
  HelpCircle,
  LogOut,
  Power,
  TrendingUp,
  Box,
  IndianRupee,
  MoreVertical,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Camera,
  Link as LinkIcon
} from 'lucide-react';
import { VendorProfile, Product, VendorOrder, SupportMessage } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

interface VendorDashboardProps {
  profileId: string;
  onBack: () => void;
}

export default function VendorDashboard({ profileId, onBack }: VendorDashboardProps) {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'inventory' | 'sales' | 'profile' | 'support'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Pending' | 'Preparing' | 'Ready' | 'Cancelled'>('All');
  const [orderDateFilter, setOrderDateFilter] = useState('');
  
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);

  useEffect(() => {
    if (!profileId) return;

    // Listen to vendor profile
    const unsubProfile = onSnapshot(doc(db, 'vendors', profileId), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as VendorProfile);
      }
    }, err => handleFirestoreError(err, OperationType.GET, `vendors/${profileId}`));

    // Listen to inventory (assuming products with vendorId)
    const qInv = query(collection(db, 'products'), where('vendorId', '==', profileId));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'products'));

    // Listen to orders
    const qOrders = query(collection(db, 'orders'), where('vendorId', '==', profileId));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as VendorOrder)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'orders'));

    return () => {
      unsubProfile();
      unsubInv();
      unsubOrders();
    };
  }, [profileId]);

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemImageDraft, setItemImageDraft] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState<VendorOrder | null>(null);

  // Status Handlers
  const toggleOnline = async () => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'vendors', profile.id), {
        isOnline: !profile.isOnline,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vendors/${profile.id}`);
    }
  };

  const updateOrderStatus = async (orderId: string, nextStatus: VendorOrder['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      if (showOrderDetails?.id === orderId) {
        setShowOrderDetails(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const toggleProductAvailability = async (productId: string) => {
    const item = inventory.find(p => p.id === productId);
    if (!item) return;
    try {
      await updateDoc(doc(db, 'products', productId), {
        isAvailable: !item.isAvailable,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;
    const formData = new FormData(e.currentTarget);
    try {
      const newProduct = {
        name: formData.get('name') as string,
        price: Number(formData.get('price')),
        unit: formData.get('unit') as string,
        category: formData.get('category') as string,
        image: itemImageDraft || 'https://images.unsplash.com/photo-1542838132-92c5330049d2?w=400',
        isAvailable: true,
        description: formData.get('description') as string,
        vendorId: profile.id,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'products'), newProduct);
      setIsAddingProduct(false);
      setItemImageDraft('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: formData.get('name') as string,
        price: Number(formData.get('price')),
        unit: formData.get('unit') as string,
        category: formData.get('category') as string,
        image: itemImageDraft || editingProduct.image,
        description: formData.get('description') as string,
        updatedAt: serverTimestamp()
      });
      setEditingProduct(null);
      setItemImageDraft('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${editingProduct.id}`);
    }
  };

  // Support Chat Logic (Consistent with Delivery Dashboard)
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChats = () => {
      const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
      const myChat = allChats[profile.id];
      if (myChat) setSupportMessages(myChat.messages);
    };
    loadChats();
    window.addEventListener('support_message_received', loadChats);
    return () => window.removeEventListener('support_message_received', loadChats);
  }, [profile.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: SupportMessage = {
      id: `v-msg-${Date.now()}`,
      senderId: profile.id,
      senderName: profile.businessName,
      senderType: 'partner',
      text: chatInput,
      timestamp: now
    };

    const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
    const myChat = allChats[profile.id] || { partnerId: profile.id, partnerName: profile.businessName, messages: [], lastMessageTimestamp: now, unreadCount: 0 };
    myChat.messages.push(newMsg);
    myChat.lastMessageTimestamp = now;
    myChat.unreadCount = (myChat.unreadCount || 0) + 1;
    allChats[profile.id] = myChat;

    localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
    setSupportMessages(prev => [...prev, newMsg]);
    setChatInput('');
    window.dispatchEvent(new CustomEvent('support_message_sent'));
  };

  if (!profile) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Entering Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="px-6 pt-12 pb-6 bg-white sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center font-black text-gray-900 border-2 border-white shadow-sm overflow-hidden">
                {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" alt="Store" /> : profile.businessName[0]}
             </div>
             <div>
               <h1 className="text-sm font-black uppercase tracking-widest text-gray-900 leading-none mb-1">{profile.businessName}</h1>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Merchant Console</span>
                 <span className="w-1 h-1 bg-gray-300 rounded-full" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter italic">Verified</span>
               </div>
             </div>
          </div>
        </div>
        
        <button 
          onClick={toggleOnline}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
            profile.isOnline ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Power className={`w-3.5 h-3.5 ${profile.isOnline ? 'animate-pulse' : ''}`} />
          {profile.isOnline ? 'Open' : 'Closed'}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-6 py-8 space-y-8"
            >
              {/* High Level Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[60px] opacity-20 -mr-10 -mt-10" />
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                       <IndianRupee className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Today's Sales</p>
                    <h3 className="text-3xl font-black">₹4,821</h3>
                    <div className="mt-3 flex items-center gap-1.5">
                       <TrendingUp className="w-3 h-3 text-emerald-400" />
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">+12% vs yest.</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-rows-2 gap-4">
                  <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900">{orders.filter(o => o.status === 'Pending').length}</h4>
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">New Orders</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900">{profile.rating}</h4>
                      <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Avg Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                     <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest">Duty Alert</h4>
                    <p className="text-[10px] font-bold text-indigo-100">Ensure your GPS is enabled for orders.</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </div>

              {/* Recent Activity Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Pipeline</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full">View All</button>
                </div>
                
                <div className="space-y-4">
                   {orders.slice(0, 3).map(order => (
                     <div 
                      key={order.id} 
                      onClick={() => setShowOrderDetails(order)}
                      className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            order.status === 'Pending' ? 'bg-orange-50 text-orange-500' : 
                            order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
                          }`}>
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-sm font-black text-gray-900">{order.customerName}</h5>
                              <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">{order.id}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400">₹{order.totalAmount} • {order.items.length} items • {order.createdAt}</p>
                          </div>
                       </div>
                       <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                         order.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                         order.status === 'Preparing' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                       }`}>
                         {order.status}
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inventory' && (
            <motion.div 
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-6 py-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 italic">Store Inventory</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{inventory.length} items listed today</p>
                </div>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-gray-200 active:scale-95 transition-all"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              {/* Inventory Search & Filters */}
              <div className="relative">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                 <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, category, SKU..."
                  className="w-full bg-white border border-gray-100 h-14 pl-14 pr-6 rounded-[2rem] font-bold text-sm outline-none focus:border-yellow-400 transition-all shadow-sm"
                 />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 gap-4">
                {inventory.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                  <div key={item.id} className={`bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 group transition-all ${!item.isAvailable ? 'opacity-60 bg-gray-50' : ''}`}>
                    <div className="w-20 h-20 rounded-3xl bg-gray-200 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center">
                          <X className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[13px] font-black text-gray-900 truncate pr-2 uppercase italic">{item.name}</h4>
                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{item.unit}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                         <span className="text-sm font-black text-gray-900">₹{item.price}</span>
                         <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[7px] font-black uppercase text-gray-500">{item.category}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditingProduct(item)}
                          className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-1.2"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button 
                          onClick={() => toggleProductAvailability(item.id)}
                          className={`flex-[2] py-2 rounded-xl text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all text-center ${
                            item.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-6 py-8 space-y-6"
            >
              <div className="flex flex-col gap-4 sticky top-0 bg-gray-50/80 backdrop-blur-md py-4 z-20">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 italic">Live Orders</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input 
                        type="date" 
                        value={orderDateFilter}
                        onChange={(e) => setOrderDateFilter(e.target.value)}
                        className="bg-white border border-gray-100 rounded-xl px-2 py-1.5 text-[8px] font-black uppercase outline-none shadow-sm focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                   {['All', 'Pending', 'Preparing', 'Ready', 'Cancelled'].map(f => (
                     <button 
                      key={f} 
                      onClick={() => setOrderStatusFilter(f as any)}
                      className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all shrink-0 ${
                        orderStatusFilter === f 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border border-gray-100 text-gray-400'
                      }`}
                     >
                       {f}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                {orders
                  .filter(o => {
                    if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
                    if (orderDateFilter) {
                      const orderDate = o.createdAt.split('T')[0];
                      if (orderDate !== orderDateFilter) return false;
                    }
                    return true;
                  })
                  .map(order => (
                  <div key={order.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-gray-200">
                             <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-black text-gray-900 uppercase">#{order.id}</h4>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{order.createdAt} • {order.paymentMethod}</p>
                          </div>
                       </div>
                       <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         order.status === 'Pending' ? 'bg-orange-50 text-orange-500' : 
                         order.status === 'Preparing' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'
                       }`}>
                         {order.status}
                       </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Customer</p>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-black text-gray-900">{order.customerName}</h5>
                              <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg active:scale-95 transition-all">
                                 <Phone className="w-3.5 h-3.5" />
                              </button>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total</p>
                            <p className="text-lg font-black text-gray-900">₹{order.totalAmount}</p>
                         </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4">
                         {order.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                             <p className="text-[11px] font-bold text-gray-600 italic">
                               <span className="text-gray-900 mr-2">{item.quantity}x</span> {item.name}
                             </p>
                             <p className="text-[11px] font-black text-gray-900">₹{item.price * item.quantity}</p>
                           </div>
                         ))}
                      </div>

                      <div className="flex gap-3">
                         {order.status === 'Pending' && (
                           <>
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                                className="flex-1 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'Preparing')}
                                className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-gray-200 active:scale-95 transition-all"
                              >
                                Accept Order
                              </button>
                           </>
                         )}
                         {order.status === 'Preparing' && (
                           <button 
                            onClick={() => updateOrderStatus(order.id, 'Ready')}
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                           >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Ready for Pickup
                           </button>
                         )}
                         {order.status === 'Ready' && (
                            <div className="w-full py-4 bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2">
                               <Clock className="w-4 h-4 animate-spin-slow" />
                               Waiting for Delivery Agent
                            </div>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'sales' && (
            <motion.div 
              key="sales"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-8 space-y-8"
            >
               <div className="bg-gray-900 rounded-[3rem] p-10 text-white text-center flex flex-col items-center relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-400 rounded-full blur-[100px] opacity-10" />
                  <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4">Merchant Revenue</p>
                  <h3 className="relative z-10 text-5xl font-black mb-4 italic">₹{profile.revenue}</h3>
                  <div className="relative z-10 flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">+₹842 from last week</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Payout</p>
                     <h4 className="text-xl font-black text-gray-900 mb-4">₹{profile.pendingPayout}</h4>
                     <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-gray-200">Withdrawal</button>
                  </div>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Withdrawals</p>
                     <h4 className="text-xl font-black text-orange-500 mb-4">₹{profile.totalPaid || 0}</h4>
                     <button className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl text-[8px] font-black uppercase tracking-widest">History</button>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Weekly Performance</h4>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm h-48 flex items-end justify-between px-8">
                     {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                       <div key={i} className="flex flex-col items-center gap-3">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            className={`w-4 rounded-full ${i === 3 ? 'bg-indigo-600' : 'bg-gray-100'}`}
                          />
                          <span className="text-[8px] font-black text-gray-400 uppercase">M T W T F S S'[i]</span>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-8 space-y-8"
            >
               <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gray-200 border-4 border-white shadow-2xl overflow-hidden group">
                       {profile.photo ? <img src={profile.photo} className="w-full h-full object-cover" alt="Profile" /> : <Store className="w-full h-full p-8 text-gray-400" />}
                       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Edit3 className="w-8 h-8 text-white" />
                       </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic">{profile.businessName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Managed by {profile.ownerName}</p>
               </div>

               <div className="space-y-3">
                  {[
                    { icon: Phone, label: 'Contact Support', value: profile.phone, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { icon: Star, label: 'Shop Rating', value: `${profile.rating} Out of 5.0`, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                    { icon: Package, label: 'Inventory Size', value: `${inventory.length} Active Items`, color: 'text-indigo-500', bg: 'bg-indigo-50' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center gap-5 shadow-sm active:bg-gray-50 transition-colors cursor-pointer">
                       <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                          <p className="text-sm font-black text-gray-900">{item.value}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                    </div>
                  ))}
               </div>

               <div className="pt-8">
                 <button onClick={onBack} className="w-full py-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <LogOut className="w-4 h-4" />
                    Terminate Console Session
                 </button>
               </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div 
               key="support"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="h-full flex flex-col"
            >
              <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  {supportMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-[2rem] text-xs font-bold leading-relaxed shadow-sm ${
                        msg.senderType === 'partner' ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-100' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm shadow-gray-50'
                      }`}>
                        {msg.text}
                        <p className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-60 ${msg.senderType === 'partner' ? 'text-right' : ''}`}>{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
              
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-2 bg-gray-50 p-2 rounded-[2rem]">
                  <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Describe your issue..."
                    className="flex-1 bg-transparent px-5 py-3 font-bold text-[13px] outline-none"
                  />
                  <button className="p-3 bg-gray-900 text-white rounded-full shadow-lg shadow-gray-200 active:scale-90 transition-all">
                    <Save className="w-5 h-5 rotate-90" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Quick Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 pb-8 z-50 flex items-center justify-between">
        {[
          { id: 'home', icon: Store, label: 'Home' },
          { id: 'orders', icon: ClipboardList, label: 'Orders' },
          { id: 'inventory', icon: Box, label: 'Items' },
          { id: 'sales', icon: BarChart3, label: 'Sales' },
          { id: 'profile', icon: Settings, label: 'Store' }
        ].map((btn) => (
          <button 
            key={btn.id}
            onClick={() => setActiveTab(btn.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all relative ${
              activeTab === btn.id ? 'text-gray-900' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            {activeTab === btn.id && (
              <motion.div layoutId="nav-bg" className="absolute -inset-x-4 -inset-y-2 bg-yellow-400/10 rounded-2xl -z-10" />
            )}
            <btn.icon className={`w-5 h-5 ${activeTab === btn.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">{btn.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals & Sheets */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingProduct(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 40 }}
               className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8"
            >
               <h3 className="text-2xl font-black text-gray-900 italic mb-6">List New Item</h3>
               <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                     {/* Image Selection Option */}
                     <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Item Image</label>
                       <div className="flex gap-4">
                         <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group relative">
                           {itemImageDraft ? (
                             <img src={itemImageDraft} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                           ) : (
                             <div className="flex flex-col items-center gap-1">
                               <Camera className="w-6 h-6 text-gray-300" />
                               <span className="text-[8px] font-black text-gray-300 uppercase">Preview</span>
                             </div>
                           )}
                         </div>
                         <div className="flex-1 space-y-2">
                           <div className="relative">
                             <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                             <input 
                               value={itemImageDraft}
                               onChange={(e) => setItemImageDraft(e.target.value)}
                               placeholder="Paste image URL here..."
                               className="w-full bg-gray-50 pl-11 pr-4 h-12 rounded-xl font-bold text-[11px] outline-none focus:border-yellow-400 border-2 border-transparent transition-all"
                             />
                           </div>
                           <p className="text-[8px] font-bold text-gray-400 px-2 leading-tight uppercase">TIP: Provide high-quality image URL for better sales.</p>
                         </div>
                       </div>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Item Name</label>
                        <input name="name" required placeholder="e.g. Basmati Rice" className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Price (₹)</label>
                          <input name="price" type="number" required placeholder="0.00" className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Unit</label>
                          <input name="unit" required placeholder="1kg, 500ml..." className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Category</label>
                        <select name="category" className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all appearance-none cursor-pointer">
                           <option>Groceries</option>
                           <option>Vegetables</option>
                           <option>Dairy</option>
                           <option>Snacks</option>
                        </select>
                     </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-gray-200">Publish to Live</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProduct(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 40 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 40 }}
               className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-8"
            >
               <h3 className="text-2xl font-black text-gray-900 italic mb-6">Modify Item</h3>
               <form onSubmit={handleUpdateProduct} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                     {/* Image Selection Option */}
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Update Image</label>
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group relative">
                            <img src={itemImageDraft || editingProduct.image} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Camera className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="relative">
                              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                value={itemImageDraft || editingProduct.image}
                                onChange={(e) => setItemImageDraft(e.target.value)}
                                placeholder="Paste new image URL..."
                                className="w-full bg-gray-50 pl-11 pr-4 h-12 rounded-xl font-bold text-[11px] outline-none focus:border-yellow-400 border-2 border-transparent transition-all"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => setItemImageDraft('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400')}
                              className="text-[8px] font-black text-indigo-600 uppercase tracking-widest px-2 hover:underline"
                            >
                              Reset to Default
                            </button>
                          </div>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Item Name</label>
                        <input name="name" defaultValue={editingProduct.name} required className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Price (₹)</label>
                          <input name="price" type="number" defaultValue={editingProduct.price} required className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Unit</label>
                          <input name="unit" defaultValue={editingProduct.unit} required className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none focus:border-yellow-400 border-2 border-transparent transition-all" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Category</label>
                        <select name="category" defaultValue={editingProduct.category} className="w-full bg-gray-50 px-6 h-14 rounded-2xl font-bold text-sm outline-none appearance-none cursor-pointer">
                           <option>Groceries</option>
                           <option>Vegetables</option>
                           <option>Dairy</option>
                           <option>Snacks</option>
                        </select>
                     </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px]">Back</button>
                    <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-100">Update Listing</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
