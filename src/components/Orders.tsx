import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Package, ChevronRight, Clock, AlertTriangle, X, MapPin, 
  Bike, Check, Search, Filter, StickyNote, Save, ClipboardList, 
  TrendingUp, Loader2, Star, Edit2, Printer, Receipt, Tag,
  RotateCcw, History, ShoppingBag, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RealtimeOrderBillModal from './RealtimeOrderBillModal';
import ShippingLabelModal from './ShippingLabelModal';
import { LanguageCode, Transaction, CartItem } from '../types';
import { translations } from '../translations';
import { referralService } from '../lib/referral';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { downloadCSV } from '../lib/exportUtils';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface OrdersProps {
  onBack: () => void;
  onReorder?: (orderId: string, items?: any[]) => void;
  onTrackOrder?: (orderId: string) => void;
  onEditOrder?: (orderId: string) => void;
  language: LanguageCode;
}

export default function Orders({ onBack, onReorder, onTrackOrder, onEditOrder, language }: OrdersProps) {
  const { user } = useFirebase();
  const t = translations[language].orders || translations['en-IN'].orders;
  const common = translations[language].common || translations['en-IN'].common;
  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('cached_user_orders');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_user_orders');
      return !(cached && JSON.parse(cached).length > 0);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleOrderUpdate = (e: any) => {
      try {
        const cached = localStorage.getItem('cached_user_orders');
        if (cached) {
          setOrders(JSON.parse(cached));
        }
      } catch {}
    };
    window.addEventListener('orders_updated', handleOrderUpdate);
    return () => window.removeEventListener('orders_updated', handleOrderUpdate);
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let throttleId: any = null;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (throttleId) clearTimeout(throttleId);

      throttleId = setTimeout(() => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().timestamp || doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          displayDate: doc.data().timestamp ? new Date(doc.data().timestamp).toLocaleDateString() : 'Just now'
        }));
        
        // Sort client side to avoid index requirement
        const sorted = docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setOrders(sorted);
        setLoading(false);
        try {
          localStorage.setItem('cached_user_orders', JSON.stringify(sorted));
        } catch {}
      }, 50);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => {
      if (throttleId) clearTimeout(throttleId);
      unsubscribe();
    };
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
  const [selectedBillOrder, setSelectedBillOrder] = useState<any | null>(null);
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [selectedShippingOrder, setSelectedShippingOrder] = useState<any | null>(null);
  const [showShippingModal, setShowShippingModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'history' | 'active' | 'all'>('history');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [orderToReorder, setOrderToReorder] = useState<string | null>(null);
  const [orderToReorderItems, setOrderToReorderItems] = useState<any[] | null>(null);
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
      case 'Delivered': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'OutForDelivery':
      case 'In Transit': return 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse';
      case 'ReadyForPickup': return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'Preparing': return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'Accepted': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'Pending':
      case 'Processing':
      case 'Placed': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'Editing': return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border border-rose-300';
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

  const handleSimulateDelivery = async (orderId: string, currentCompletedDates: string[] = [], currentRemainingVal: number = 30) => {
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const updatedDates = [...(currentCompletedDates || [])];
    if (updatedDates.includes(todayStr)) {
      alert("Today's service delivery has already been logged!");
      return;
    }
    updatedDates.push(todayStr);
    const newRemaining = Math.max(0, 30 - updatedDates.length);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        completedDates: updatedDates,
        remainingDays: newRemaining,
        updatedAt: serverTimestamp()
      });
      setSelectedOrderDetail(prev => prev ? { ...prev, completedDates: updatedDates, remainingDays: newRemaining } : null);
    } catch (err) {
      console.error("Failed to update subscription details:", err);
    }
  };

  const openCancelModal = (orderId: string) => {
    setOrderToCancel(orderId);
    setCancellationStep('confirm');
  };

  const isPastOrder = (status: string) => {
    const s = String(status || '').toLowerCase();
    return ['delivered', 'cancelled', 'completed', 'refunded'].includes(s);
  };
  const isActiveOrder = (status: string) => {
    const s = String(status || '').toLowerCase();
    return ['pending', 'accepted', 'assigned', 'preparing', 'picked-up', 'picked_up', 'pickedup', 'readyforpickup', 'ready', 'outfordelivery', 'in transit', 'processing', 'editing', 'placed'].includes(s);
  };

  const pastOrdersCount = orders.filter(o => isPastOrder(o.status)).length;
  const activeOrdersCount = orders.filter(o => isActiveOrder(o.status)).length;

  const filteredOrders = orders.filter(order => {
    // 1. View Mode segregation
    if (viewMode === 'history' && !isPastOrder(order.status)) {
      return false;
    }
    if (viewMode === 'active' && !isActiveOrder(order.status)) {
      return false;
    }

    // 2. Status filter
    let matchesStatus = true;
    if (filterStatus !== 'All') {
      if (filterStatus === 'Active') {
        matchesStatus = isActiveOrder(order.status);
      } else if (filterStatus === 'In Transit') {
        matchesStatus = ['OutForDelivery', 'In Transit'].includes(order.status);
      } else if (filterStatus === 'Preparing') {
        matchesStatus = ['Preparing', 'Processing'].includes(order.status);
      } else if (filterStatus === 'Past') {
        matchesStatus = isPastOrder(order.status);
      } else {
        matchesStatus = order.status === filterStatus;
      }
    }
    
    // 3. Date filter
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const orderDate = new Date(order.date || order.createdAt || Date.now());
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

    const sq = (searchQuery || '').toLowerCase();
    const orderIdStr = (order.id || '').toLowerCase();
    const itemsStr = (order.items ? (typeof order.items === 'string' ? order.items : JSON.stringify(order.items)) : '').toLowerCase();
    const matchesSearch = !sq || orderIdStr.includes(sq) || itemsStr.includes(sq);

    return matchesStatus && matchesDate && matchesSearch;
  });

  const statusFilters = viewMode === 'history' 
    ? [
        { id: 'All', label: 'All Past Orders' },
        { id: 'Delivered', label: 'Delivered (Completed)' },
        { id: 'Cancelled', label: 'Cancelled' }
      ]
    : viewMode === 'active'
    ? [
        { id: 'All', label: 'All Active' },
        { id: 'Preparing', label: 'Preparing' },
        { id: 'ReadyForPickup', label: 'Ready for Pickup' },
        { id: 'In Transit', label: 'Out for Delivery' }
      ]
    : [
        { id: 'All', label: 'All Orders' },
        { id: 'Active', label: 'Active & In-Transit' },
        { id: 'Preparing', label: 'Preparing' },
        { id: 'ReadyForPickup', label: 'Ready for Pickup' },
        { id: 'In Transit', label: 'Out for Delivery' },
        { id: 'Delivered', label: 'Delivered' },
        { id: 'Cancelled', label: 'Cancelled' }
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

      {/* Primary Navigation Segment: Order History vs Active vs All */}
      <div className="bg-white px-6 pt-3 pb-2 border-b border-gray-100">
        <div className="flex bg-gray-100/90 p-1.5 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setViewMode('history');
              setFilterStatus('All');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-yellow-600" />
            <span>Order History</span>
            {pastOrdersCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                viewMode === 'history' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {pastOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('active');
              setFilterStatus('All');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'active'
                ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-indigo-600" />
            <span>Active</span>
            {activeOrdersCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                viewMode === 'active' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('all');
              setFilterStatus('All');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>All ({orders.length})</span>
          </button>
        </div>
      </div>

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
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={order.status}
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xs ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </motion.span>
                </AnimatePresence>
              </div>
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
                <p className="font-extrabold text-gray-900">{Array.isArray(order.items) ? order.items.length : (typeof order.items === 'number' ? order.items : (order.items ? String(order.items) : 1))} {common.items}</p>
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

            {/* Delivery OTP & Payment Verification Banner */}
            {(order.requiresDeliveryOtp || String(order.paymentMethod || '').toLowerCase() === 'cod' || String(order.paymentMethod || '').toLowerCase() === 'cash') ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">Cash on Delivery Handover OTP</span>
                    <span className="text-[9px] text-amber-800 font-medium block">Provide code to rider upon cash payment &amp; handoff</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-base font-black px-3 py-1 bg-white rounded-xl text-amber-950 border border-amber-300 shadow-xs tracking-widest">
                  {order.deliveryOtp || '1234'}
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block">Paid Online ({String(order.paymentMethod || 'UPI').toUpperCase()})</span>
                    <span className="text-[9px] text-emerald-700 font-medium block">Contactless delivery &bull; No OTP required for handover</span>
                  </div>
                </div>
                <span className="text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono">No OTP Needed</span>
              </div>
            )}

            {/* Live Progress Timeline for Active Orders (5 Stages: accepted, assigned, preparing, picked-up, delivered) */}
            {isActiveOrder(order.status) && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackOrder?.(order.id);
                }}
                className="p-3.5 bg-yellow-50/60 border border-yellow-200/80 rounded-3xl space-y-2 cursor-pointer hover:bg-yellow-100/50 transition-colors"
              >
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Tracking Sync</span>
                  </span>
                  <span className="text-amber-700 font-mono">View Map &amp; ETA →</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[
                    { key: 'accepted', label: 'Accepted' },
                    { key: 'assigned', label: 'Assigned' },
                    { key: 'preparing', label: 'Preparing' },
                    { key: 'picked-up', label: 'Picked-Up' },
                    { key: 'delivered', label: 'Delivered' }
                  ].map((st, i) => {
                    // Compute stage progression index
                    const s = String(order.status || '').toLowerCase().replace(/[\s_-]+/g, '');
                    let currentIdx = 0;
                    if (s.includes('deliver') || s === 'completed') currentIdx = 4;
                    else if (s.includes('pickup') || s.includes('picked') || s.includes('transit') || s.includes('outfordelivery') || s.includes('ready')) currentIdx = 3;
                    else if (s.includes('prepar') || s.includes('process')) currentIdx = 2;
                    else if (s.includes('assign')) currentIdx = 1;
                    else currentIdx = 0; // accepted / pending

                    const isDone = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={st.key} className="flex flex-col items-center text-center">
                        <div className={`w-full h-1.5 rounded-full mb-1 transition-all ${isCurrent ? 'bg-amber-500 animate-pulse' : isDone ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={`${st.key}-${isCurrent ? 'curr' : isDone ? 'done' : 'idle'}`}
                            initial={{ opacity: 0, y: 3 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -3 }}
                            transition={{ duration: 0.2 }}
                            className={`text-[8px] font-black uppercase tracking-tighter ${isCurrent ? 'text-amber-950 font-extrabold' : isDone ? 'text-emerald-700' : 'text-gray-400'}`}
                          >
                            {st.label}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Order History Details Card with Final Status & Items Preview */}
            {isPastOrder(order.status) && (
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-3xl space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    Past Order Summary
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    order.status === 'Delivered' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {order.status === 'Delivered' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-rose-600" />}
                    <span>Final Status: {order.status}</span>
                  </span>
                </div>

                {order.orderItems && order.orderItems.length > 0 ? (
                  <div className="pt-1 space-y-1.5 border-t border-slate-200/60">
                    <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Ordered Items:</p>
                    {order.orderItems.slice(0, 3).map((it: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-gray-800 font-bold truncate max-w-[75%]">
                          <span className="text-amber-600 font-mono font-black">{it.quantity || 1}x</span> {it.name}
                        </span>
                        <span className="font-mono font-bold text-gray-700">₹{(it.price || 0) * (it.quantity || 1)}</span>
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <p className="text-[9px] font-bold text-indigo-500 italic">
                        +{order.orderItems.length - 3} more items in this order
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[9.5px] font-bold text-slate-400">Total Paid: ₹{order.total}</p>
                )}
              </div>
            )}

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
            
            <div className="pt-2 flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBillOrder(order);
                  setShowBillModal(true);
                }}
                className="py-4 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-amber-200 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                title="Print Real-time Tax Bill"
              >
                <Printer className="w-3.5 h-3.5 text-amber-600" />
                <span>Bill</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedShippingOrder(order);
                  setShowShippingModal(true);
                }}
                className="py-4 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-200 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                title="Print Shipping Label (Order ID & Address)"
              >
                <Tag className="w-3.5 h-3.5 text-slate-700" />
                <span>Label</span>
              </button>
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
                    setOrderToReorderItems(order.orderItems || order.items || null);
                  }}
                  className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-350 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-yellow-400/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Add all items from this order to cart"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-900" />
                  <span>{t.reorder || 'Reorder'}</span>
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

                {selectedOrderDetail.isMonthlySubscription && (
                  <section className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100 space-y-4 font-sans">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Subscription Calendar</h4>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">30-Day Automated Direct Deliveries</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl block border border-indigo-100">
                          {selectedOrderDetail.remainingDays ?? 30} Days Left
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5 pt-1.5">
                      {Array.from({ length: 30 }).map((_, index) => {
                        const dayNum = index + 1;
                        const isCompleted = (selectedOrderDetail.completedDates ?? []).length >= dayNum;
                        return (
                          <div 
                            key={dayNum} 
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center border text-[8px] font-black transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-50/50' 
                                : 'bg-white border-indigo-50 text-slate-400'
                            }`}
                          >
                            <span className="opacity-60 text-[7px] uppercase font-bold">D</span>
                            <span className="text-xs font-extrabold">{dayNum}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => handleSimulateDelivery(selectedOrderDetail.id, selectedOrderDetail.completedDates, selectedOrderDetail.remainingDays ?? 30)}
                      className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer text-center"
                    >
                      Log Simulated Delivery
                    </button>
                    
                    <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wide">
                      Deliveries are completed daily. Track status updates here.
                    </p>
                  </section>
                )}

                <section className="p-6 bg-gray-900 rounded-[2rem] text-white space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/50">
                    <span>Order Summary</span>
                    <span>{selectedOrderDetail.status}</span>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/70">Subtotal ({selectedOrderDetail.items} items)</span>
                      <span className="text-xs font-black">₹{selectedOrderDetail.subtotal || selectedOrderDetail.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/70">Delivery Distance</span>
                      <span className="text-xs font-black text-amber-400">{selectedOrderDetail.distanceKm || selectedOrderDetail.deliveryDistanceKm || 2.5} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/70">Delivery Fee</span>
                      <span className="text-xs font-black text-white">
                        {selectedOrderDetail.deliveryFee ? `₹${selectedOrderDetail.deliveryFee}` : (
                          Number(selectedOrderDetail.distanceKm || 2.5) <= 3 ? '₹25' : `₹${25 + Math.ceil(Number(selectedOrderDetail.distanceKm || 2.5) - 3) * 10}`
                        )}
                      </span>
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
                <button 
                  onClick={() => {
                    setSelectedBillOrder(selectedOrderDetail);
                    setShowBillModal(true);
                  }}
                  className="w-full py-4.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-400/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Download / Print Official Bill
                </button>
                <button 
                  onClick={() => {
                    setSelectedShippingOrder(selectedOrderDetail);
                    setShowShippingModal(true);
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-amber-400" />
                  Print Shipping Label (Order ID &amp; Address)
                </button>
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
                    setOrderToReorderItems(selectedOrderDetail.orderItems || selectedOrderDetail.items || null);
                  }}
                  className="w-full py-5 bg-yellow-400 hover:bg-yellow-350 text-gray-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-gray-900" />
                  <span>Reorder All Items</span>
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
                      onReorder?.(orderToReorder, orderToReorderItems || undefined);
                      setOrderToReorder(null);
                      setOrderToReorderItems(null);
                      setSelectedOrderDetail(null);
                    }}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-350 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:scale-95 transition-all text-[10px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-900" />
                    <span>Confirm Reorder &amp; Add to Cart</span>
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
      <RealtimeOrderBillModal
        isOpen={showBillModal}
        onClose={() => {
          setShowBillModal(false);
          setSelectedBillOrder(null);
        }}
        order={selectedBillOrder}
      />
      <ShippingLabelModal
        isOpen={showShippingModal}
        onClose={() => {
          setShowShippingModal(false);
          setSelectedShippingOrder(null);
        }}
        order={selectedShippingOrder}
      />
    </div>
  );
}
