import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, ChevronRight, Clock, AlertTriangle, X, MapPin, Bike, Check, Search, Filter, StickyNote, Save, ClipboardList, TrendingUp, Loader2, Star, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageCode, Transaction, CartItem } from '../types';
import { translations } from '../translations';
import { referralService } from '../lib/referral';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { downloadCSV } from '../lib/exportUtils';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface OrdersProps {
  onBack: () => void;
  onReorder?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
  onEditOrder?: (orderId: string) => void;
  language: LanguageCode;
}

export default function Orders({ onBack, onReorder, onTrackOrder, onEditOrder, language }: OrdersProps) {
  const { user } = useFirebase();
  const t = translations[language].orders || translations['en-IN'].orders;
  const common = translations[language].common || translations['en-IN'].common;
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp || doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        displayDate: doc.data().timestamp ? new Date(doc.data().timestamp).toLocaleDateString() : 'Just now'
      }));
      
      // Sort client side to avoid index requirement for simple POC
      const sorted = docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setOrders(sorted);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (localStorage.getItem('downloadUserOrders') === 'true' && orders.length > 0) {
      downloadCSV(orders, `orders_export_${user?.uid.slice(0, 5)}`);
      localStorage.removeItem('downloadUserOrders');
    }
  }, [orders, user]);

  useEffect(() => {
    const trackId = localStorage.getItem('trackOrderId');
    if (trackId && onTrackOrder) {
      localStorage.removeItem('trackOrderId');
      onTrackOrder(trackId);
    }
  }, [onTrackOrder]);

  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [orderToReorder, setOrderToReorder] = useState<string | null>(null);
  const [cancellationStep, setCancellationStep] = useState<'confirm' | 'reason'>('confirm');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const REASONS = [
    'Changed Mind',
    'Item Unavailable',
    'Delivery Delay',
    'Found Better Price',
    'Ordered by Mistake',
    'Address Incorrect',
    'Found Better Quality',
    'Personal Emergency',
    'Other'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'OutForDelivery': return 'bg-emerald-100 text-emerald-700';
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      case 'Processing': return 'bg-yellow-100 text-yellow-700';
      case 'Editing': return 'bg-indigo-100 text-indigo-700';
      case 'ReadyForPickup': return 'bg-cyan-100 text-cyan-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isCancellable = (status: string) => {
    return ['Pending', 'Accepted', 'Preparing', 'Editing', 'Placed', 'Processing'].includes(status);
  };

  const isTrackable = (status: string) => {
    return ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'OutForDelivery'].includes(status);
  };

  const handleCancelOrder = async (orderId: string) => {
    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancellationReason: finalReason,
        updatedAt: serverTimestamp()
      });
      setOrderToCancel(null);
      setCancellationStep('confirm');
      setSelectedReason('');
      setCustomReason('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Delivered',
        updatedAt: serverTimestamp()
      });
      setSelectedOrderDetail(prev => prev ? { ...prev, status: 'Delivered' } : null);
      
      // Trigger Referral Reward Logic strictly for the first order
      referralService.handleOrderCompletion(orderId);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const openCancelModal = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancellationStep('confirm');
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const orderDate = new Date(order.date);
      const now = new Date();
      if (dateFilter === 'Custom' && customDate) {
        const selectedDate = new Date(customDate);
        matchesDate = orderDate.toDateString() === selectedDate.toDateString();
      } else if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = orderDate >= sevenDaysAgo;
      } else if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesDate = orderDate >= thirtyDaysAgo;
      }
    }

    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.items + ' items').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesDate && matchesSearch;
  });

  const statusFilters = [
    { id: 'All', label: t.allStatus },
    { id: 'Processing', label: t.processing },
    { id: 'In Transit', label: t.inTransit },
    { id: 'Delivered', label: t.delivered },
    { id: 'Cancelled', label: t.cancelled }
  ];

  const dateFilters = [
    { id: 'All', label: t.allDates },
    { id: 'Last 7 Days', label: t.last7Days },
    { id: 'Last 30 Days', label: t.last30Days },
    { id: 'Custom', label: 'Custom Date' }
  ];

  return (
    <div className="h-full w-full bg-white flex flex-col relative">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between bg-white border-b border-gray-50 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900">{t.title}</h2>
        </div>
        {orders.length > 0 && (
          <button 
            onClick={() => downloadCSV(orders, 'my_orders')}
            className="p-3 bg-yellow-400 rounded-2xl text-gray-900 shadow-sm active:scale-90 transition-transform"
            title="Download CSV"
          >
            <Save className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-yellow-600">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t.searchPlaceholder || "Search by Order ID or items..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-12 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all placeholder:text-gray-300 shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 active:scale-95 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
          {statusFilters.map(filter => {
            const Icon = (() => {
              switch(filter.id) {
                case 'Processing': return Clock;
                case 'In Transit': return Bike;
                case 'Delivered': return Check;
                case 'Cancelled': return X;
                default: return Package;
              }
            })();
            
            return (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 transform active:scale-95 ${
                  filterStatus === filter.id 
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 ring-2 ring-gray-900' 
                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${filterStatus === filter.id ? 'text-yellow-400' : 'text-gray-300'}`} />
                {filter.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {dateFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  dateFilter === filter.id ? 'bg-yellow-400 text-gray-900 shadow-sm shadow-yellow-100' : 'bg-white text-gray-400 border border-gray-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {dateFilter === 'Custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input 
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 text-[10px] font-black uppercase outline-none text-gray-900"
              />
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-20 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading your orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? filteredOrders.map((order) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={order.id} 
            onClick={() => onTrackOrder?.(order.id)}
            className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{order.id}</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">{order.displayDate}</span>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onTrackOrder?.(order.id);
              }}
              className="flex items-center gap-4 bg-gray-50 rounded-3xl p-4 group-hover:bg-gray-100/50 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-gray-900">{order.items} {common.items}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-yellow-600 font-black">₹{order.total}</p>
                  {order.rewardItem && (
                    <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      <Star className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                      <span className="text-[8px] font-black text-indigo-600 uppercase">+ Reward</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                <span className="text-[8px] font-black uppercase text-indigo-400 mt-1">View Details</span>
              </div>
            </div>

            {/* Private Notes Section */}
            <div className="bg-slate-50/50 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-400">Private Note</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingNoteId(order.id);
                    setNoteDraft(orderNotes[order.id] || '');
                  }}
                  className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {orderNotes[order.id] ? 'Edit' : 'Add Note'}
                </button>
              </div>
              
              {editingNoteId === order.id ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={noteDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="E.g. Delivery instructions, quality issues..."
                    className="w-full p-3 bg-white rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-400 outline-none min-h-[80px] resize-none shadow-sm"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderNotes(prev => ({ ...prev, [order.id]: noteDraft }));
                        setEditingNoteId(null);
                      }}
                      className="flex-1 py-4 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <Save className="w-3 h-3" />
                      Save Note
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNoteId(null);
                      }}
                      className="px-6 py-4 bg-gray-100 text-gray-500 rounded-xl text-[9px] font-black uppercase active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : orderNotes[order.id] ? (
                <p className="text-xs font-bold text-gray-600 bg-white p-3 rounded-xl border border-gray-100 shadow-sm leading-relaxed truncate max-h-[4.5em] overflow-hidden">
                  {orderNotes[order.id]}
                </p>
              ) : (
                <p className="text-[10px] font-bold text-gray-300 italic">No private notes added yet.</p>
              )}
            </div>
            
            <div className="pt-2 flex gap-3">
              {['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Editing', 'Placed', 'Processing'].includes(order.status) && onEditOrder && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Add more items to this order?")) {
                      onEditOrder(order.id);
                    }
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Items
                </button>
              )}
              {isTrackable(order.status) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackOrder?.(order.id);
                  }}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-gray-200 active:scale-95 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {t.trackOrder}
                </button>
              )}
              {isCancellable(order.status) ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openCancelModal(order.id);
                  }}
                  className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:bg-rose-100 transition-all border border-rose-100"
                >
                  {t.cancelOrder}
                </button>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrderToReorder(order.id);
                  }}
                  className="flex-1 py-4 bg-yellow-400 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 active:scale-95 transition-all"
                >
                  {t.reorder}
                </button>
              )}
            </div>
          </motion.div>
        )) : (
          <div className="py-32 flex flex-col items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-8 relative"
            >
              <Package className="w-12 h-12 text-gray-200" />
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-2 -right-2 bg-white p-3 rounded-2xl shadow-xl border border-gray-50"
              >
                <Clock className="w-6 h-6 text-yellow-400" />
              </motion.div>
            </motion.div>
            <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter mb-2">{t.noOrders}</h3>
            <p className="text-gray-400 font-bold text-sm max-w-[200px] text-center leading-relaxed">
              Looks like you haven't placed any orders yet.
            </p>
            <button 
              onClick={onBack}
              className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrderDetail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <ClipboardList className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">Order Details</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedOrderDetail.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrderDetail(null)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                <section className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items Ordered</h4>
                    {['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Editing', 'Placed', 'Processing'].includes(selectedOrderDetail.status) && onEditOrder && (
                      <button 
                         onClick={() => {
                           if(confirm("Add more items to this order? You can keep adding until it's picked up.")) {
                             onEditOrder(selectedOrderDetail.id);
                             setSelectedOrderDetail(null);
                           }
                         }}
                         className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                      >
                        Edit Order
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedOrderDetail.orderItems && selectedOrderDetail.orderItems.length > 0 ? selectedOrderDetail.orderItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                          {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-gray-900">{item.name}</p>
                          <p className="text-[10px] font-bold text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-xs font-black text-gray-900">₹{item.price * item.quantity}</p>
                      </div>
                    )) : (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-400 italic">Item details not available for legacy orders</p>
                      </div>
                    )}
                    {selectedOrderDetail.rewardItem && (
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                          {selectedOrderDetail.rewardItem.img ? (
                            <img src={selectedOrderDetail.rewardItem.img} className="w-full h-full object-cover" alt={selectedOrderDetail.rewardItem.name} />
                          ) : (
                            <Star className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                            <p className="text-xs font-black text-indigo-900">{selectedOrderDetail.rewardItem.name}</p>
                          </div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Special Reward Item</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-indigo-600">₹{selectedOrderDetail.rewardItem.rewardPrice || 1}</p>
                          <p className="text-[8px] font-black text-slate-400 line-through">₹{selectedOrderDetail.rewardItem.originalPrice}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="p-6 bg-gray-900 rounded-[2rem] text-white space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                    <span>Order Summary</span>
                    <span>{selectedOrderDetail.status}</span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/70">Subtotal ({selectedOrderDetail.items} items)</span>
                      <span className="text-xs font-black">₹{selectedOrderDetail.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/70">Delivery Fee</span>
                      <span className="text-xs font-black text-emerald-400">FREE</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/20">
                      <span className="text-sm font-black italic tracking-tight">Total Paid</span>
                      <span className="text-xl font-black italic tracking-tight text-white">₹{selectedOrderDetail.total}</span>
                    </div>
                  </div>
                </section>

                {selectedOrderDetail.status === 'Delivered' && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Delivered Successfully</p>
                      <p className="text-[10px] font-bold text-emerald-600">Handed to customer</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-8 flex flex-col gap-3">
                {selectedOrderDetail.status === 'Processing' && (
                  <button 
                    onClick={() => handleCompleteOrder(selectedOrderDetail.id)}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Complete Order (Simulate Success)
                  </button>
                )}
                {isTrackable(selectedOrderDetail.status) && (
                  <button 
                    onClick={() => {
                      onTrackOrder?.(selectedOrderDetail.id);
                      setSelectedOrderDetail(null);
                    }}
                    className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    {t.trackOrder}
                  </button>
                )}
                {['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Editing', 'Placed', 'Processing'].includes(selectedOrderDetail.status) && onEditOrder && (
                  <button 
                    onClick={() => {
                      if(confirm("Edit this order and add more items?")) {
                        onEditOrder(selectedOrderDetail.id);
                        setSelectedOrderDetail(null);
                      }
                    }}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Order Items
                  </button>
                )}
                <button 
                  onClick={() => {
                    setOrderToReorder(selectedOrderDetail.id);
                  }}
                  className="flex-1 py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-yellow-100 active:scale-95 transition-all"
                >
                  Reorder Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderToCancel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%', scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <button 
                  onClick={() => {
                    setOrderToCancel(null);
                    setCancellationStep('confirm');
                  }}
                  className="p-2 bg-gray-50 rounded-full text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cancellationStep === 'confirm' ? (
                <div className="text-center">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">{t.cancelPrompt}</h3>
                  <p className="text-gray-500 font-bold mb-8">
                    {t.cancelSub} <span className="text-gray-900 font-black">{orderToCancel}</span>?
                  </p>
                  
                  <div className="w-full space-y-3">
                    <button 
                      onClick={() => setCancellationStep('reason')}
                      className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-rose-100 active:scale-95 transition-all text-xs"
                    >
                      {translations[language].common?.apply || 'Continue'}
                    </button>
                    <button 
                      onClick={() => setOrderToCancel(null)}
                      className="w-full py-5 bg-gray-100 text-gray-700 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all text-xs"
                    >
                      {t.keepOrder}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">{t.selectReason}</h3>
                  <p className="text-gray-500 font-bold mb-6 text-center text-sm">
                    {t.reasonSub}
                  </p>

                  <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                    {REASONS.map(reason => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 ${
                          selectedReason === reason ? 'bg-yellow-50 border-yellow-400 text-gray-900' : 'bg-gray-50 border-transparent text-gray-500'
                        }`}
                      >
                        {reason === 'Other' ? t.otherReason : reason}
                      </button>
                    ))}
                  </div>

                  {selectedReason === 'Other' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6"
                    >
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder={t.otherPlaceholder}
                        className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-yellow-400 min-h-[100px] resize-none"
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setCancellationStep('confirm')}
                      className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-[2rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                    >
                      {common.back}
                    </button>
                    <button 
                      disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}
                      onClick={() => handleCancelOrder(orderToCancel!)}
                      className={`flex-[2] py-4 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all ${
                        (selectedReason && (selectedReason !== 'Other' || customReason)) ? 'bg-rose-500 text-white shadow-rose-100' : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
                      }`}
                    >
                      {t.confirmCancel}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {orderToReorder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%', scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center animate-bounce">
                  <ClipboardList className="w-5 h-5 text-gray-900" />
                </div>
                <button 
                  onClick={() => setOrderToReorder(null)}
                  className="p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight italic">Confirm Reorder</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-relaxed mb-6">
                  Are you sure you want to duplicate this order? This will copy all items from Order ID <span className="text-gray-900 font-extrabold">{orderToReorder}</span> into your active cart.
                </p>
                
                <div className="w-full space-y-3">
                  <button 
                    onClick={() => {
                      onReorder?.(orderToReorder);
                      setOrderToReorder(null);
                      setSelectedOrderDetail(null);
                    }}
                    className="w-full py-4 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 active:scale-95 transition-all text-[10px]"
                  >
                    Confirm Reorder
                  </button>
                  <button 
                    onClick={() => setOrderToReorder(null)}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all text-[10px]"
                  >
                    Nevermind
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
