import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Truck, Package, CheckCircle, Clock, Bike, Star, Phone, HelpCircle, Loader2, Edit3 } from 'lucide-react';
import { motion } from 'motion/react';
import { LanguageCode } from '../types';
import { translations } from '../translations';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import LiveMap from './LiveMap';

interface TrackOrderProps {
  orderId: string;
  onBack: () => void;
  onEditOrder?: (orderId: string) => void;
  language: LanguageCode;
}

export default function TrackOrder({ orderId, onBack, onEditOrder, language }: TrackOrderProps) {
  const t = translations[language].tracking || translations['en-IN'].tracking;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);

  const handleSubmitRating = async () => {
    if (!order || !order.deliveryPartnerId) return;
    setIsSubmittingRating(true);
    try {
      const { doc, getDoc, updateDoc, addDoc, collection } = await import('firebase/firestore');
      
      // 1. Update the delivery partner profile average rating
      const partnerRef = doc(db, 'deliveryPartners', order.deliveryPartnerId);
      const partnerSnap = await getDoc(partnerRef);
      if (partnerSnap.exists()) {
        const pData = partnerSnap.data();
        const currentAvg = Number(pData.rating) || 5.0;
        const currentCount = Number(pData.ratingCount) || 1;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + selectedStars) / newCount).toFixed(2));
        
        await updateDoc(partnerRef, {
          rating: newAvg,
          ratingCount: newCount
        });
      }
      
      // 2. Log review in 'reviews' collection for admin moderation
      await addDoc(collection(db, 'reviews'), {
        orderId: order.id,
        userName: order.customerName || 'Anonymous Rider Feedback',
        rating: selectedStars,
        comment: feedbackComment.trim() || 'Quick and professional delivery service.',
        vendorName: `Rider: ${order.deliveryPartnerName || 'Express Dispatcher'}`,
        riderId: order.deliveryPartnerId,
        type: 'rider',
        createdAt: new Date().toISOString()
      });
      
      // 3. Mark rated state inside the order doc itself so they don't rate again
      await updateDoc(doc(db, 'orders', order.id), {
        riderRating: selectedStars,
        riderFeedback: feedbackComment.trim()
      });
      
      setSubmitSuccess(true);
    } catch (err) {
      console.error("Failed submitting rider feedback:", err);
      alert('Could not submit feedback at this moment.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
      if (snapshot.exists()) {
        setOrder({ id: snapshot.id, ...snapshot.data() });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  const steps = [
    { id: 'Editing', label: 'Order being edited', icon: Edit3, completed: false, current: order?.status === 'Editing' },
    { id: 'Pending', label: 'Order Received', icon: Package, completed: order?.status !== 'Cancelled', current: order?.status === 'Pending' },
    { id: 'Accepted', label: 'Confirmed', icon: CheckCircle, completed: ['Accepted', 'Preparing', 'ReadyForPickup', 'OutForDelivery', 'Delivered'].includes(order?.status), current: order?.status === 'Accepted' },
    { id: 'Preparing', label: 'Preparing Food', icon: Clock, completed: ['Preparing', 'ReadyForPickup', 'OutForDelivery', 'Delivered'].includes(order?.status), current: order?.status === 'Preparing' },
    { id: 'ReadyForPickup', label: 'Ready for Pickup', icon: Package, completed: ['ReadyForPickup', 'OutForDelivery', 'Delivered'].includes(order?.status), current: order?.status === 'ReadyForPickup' },
    { id: 'OutForDelivery', label: 'Out for Delivery', icon: Bike, completed: ['OutForDelivery', 'Delivered'].includes(order?.status), current: order?.status === 'OutForDelivery' },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle, completed: order?.status === 'Delivered', current: order?.status === 'Delivered' },
  ];

  if (loading) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Locating your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg font-black text-gray-900 mb-4 italic">Order Not Found</p>
        <button onClick={onBack} className="text-yellow-500 font-bold underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black text-gray-900">{t.title}</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{orderId}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24">
        {/* Map View */}
        <div className="h-64 mt-4 mb-8 relative z-0">
          {(() => {
            const vLoc: [number, number] = order.pickupLocation && typeof order.pickupLocation.lat === 'number' 
              ? [order.pickupLocation.lat, order.pickupLocation.lng] 
              : [17.2473, 80.1514];
            const cLoc: [number, number] = order.deliveryLocation && typeof order.deliveryLocation.lat === 'number' 
              ? [order.deliveryLocation.lat, order.deliveryLocation.lng] 
              : [17.2580, 80.1650];
            const rLoc: [number, number] | undefined = ['OutForDelivery', 'ReadyForPickup', 'Preparing'].includes(order.status)
              ? [(vLoc[0] + cLoc[0]) / 2 + 0.001, (vLoc[1] + cLoc[1]) / 2 - 0.001]
              : undefined;

            return (
              <LiveMap 
                vendorLoc={vLoc}
                customerLoc={cLoc}
                riderLoc={rLoc}
                interactive={true}
              />
            );
          })()}
        </div>

        {/* Live Partner Card */}
        <div className="bg-gray-900 rounded-[2.5rem] p-6 text-white mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400 rounded-full blur-[60px] opacity-20 transition-all group-hover:opacity-40"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Status</p>
              </div>
              <h3 className="text-2xl font-black italic tracking-tight">{order.status}</h3>
            </div>
            {order.status !== 'Cancelled' && (
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Estimated Arrival</p>
                <p className="text-xl font-black text-yellow-400">12 Mins</p>
              </div>
            )}
          </div>

          {order.deliveryPartnerName && (
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl backdrop-blur-md border border-white/10">
              <div className="relative">
                <img src={`https://i.pravatar.cc/150?u=${order.deliveryPartnerId}`} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20" alt="Partner" />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black">{order.deliveryPartnerName}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-bold text-gray-300">4.9 • Super Partner</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Post-Delivery Rider Feedback / Rating */}
        {order.status === 'Delivered' && order.deliveryPartnerId && (
          <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent border-2 border-yellow-400/20 rounded-[2.5rem] p-6 mb-8 text-left space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-yellow-400/15 rounded-xl flex items-center justify-center">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide leading-none">Rate your Delivery Partner</h4>
                <p className="text-[10px] text-slate-500 mt-1">Help us maintain top-tier clinical logistics</p>
              </div>
            </div>

            {order.riderRating !== undefined ? (
              <div className="bg-emerald-500/10 border border-emerald-500/15 p-4 rounded-3xl text-center space-y-2">
                <p className="text-emerald-600 text-xs font-black uppercase tracking-widest leading-none">Feedback Received ✓</p>
                <div className="flex justify-center gap-1 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= order.riderRating ? 'text-yellow-500 fill-yellow-500' : 'text-slate-200'}`} />
                  ))}
                </div>
                {order.riderFeedback && (
                  <p className="text-[10.5px] text-slate-600 italic">" {order.riderFeedback} "</p>
                )}
              </div>
            ) : submitSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-3xl text-center">
                <p className="text-emerald-600 text-xs font-black uppercase tracking-widest leading-none">✓ Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => setSelectedStars(s)}
                      className="p-1 cursor-pointer transition-all hover:scale-125 focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${s <= selectedStars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Review Comments (Optional)</label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="E.g., Delivered lightning fast, politely handled, highly hygienic..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-yellow-400 p-4 rounded-3xl text-slate-800 text-xs font-bold leading-normal placeholder:text-slate-400 focus:outline-none resize-none h-20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={isSubmittingRating}
                  className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-150 text-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-yellow-100/40 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingRating ? 'Transmitting Ratings...' : 'Submit Delivery Feedback'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tracking Timeline */}
        <div className="space-y-10 pl-6 border-l-2 border-gray-50 ml-6 relative mb-12">
          <div className="flex items-center justify-between pr-4 -mt-2 mb-4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest -ml-6">Live Progress</h3>
             {['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Editing'].includes(order.status) && onEditOrder && (
               <button 
                 onClick={() => {
                   if(confirm("Add more items to this order? You can keep adding until it's picked up.")) {
                     onEditOrder(orderId);
                   }
                 }}
                 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl whitespace-nowrap active:scale-95 transition-all"
               >
                 Edit Order
               </button>
             )}
          </div>
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div className={`absolute -left-[2.75rem] top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                step.completed ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 
                step.current ? 'bg-yellow-400 shadow-xl shadow-yellow-100 ring-4 ring-yellow-50 scale-110' : 'bg-gray-50 text-gray-300'
              }`}>
                {step.completed ? <CheckCircle className="w-4 h-4 text-white" /> : 
                 step.current ? <Bike className="w-4 h-4 text-gray-900" /> : 
                 <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />}
              </div>
              <div className="flex justify-between items-center bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <h4 className={`text-sm font-black ${step.current ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{step.completed ? 'Completed' : step.current ? 'Arriving' : 'Upcoming'}</p>
                </div>
                <Clock className={`w-4 h-4 ${step.current ? 'text-yellow-500' : 'text-gray-100'}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Details Section */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Order Details</h3>
          <div className="space-y-4">
            {order.orderItems?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900">{item.name}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Qty: {item.quantity} × ₹{item.price}</span>
                </div>
                <span className="text-sm font-black text-gray-900">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-gray-900 rounded-[2rem] p-6 text-white flex justify-between items-center shadow-xl shadow-gray-200">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Amount Paid</p>
              <p className="text-2xl font-black">₹{order.total}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
