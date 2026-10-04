import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, CheckCircle2, Clock, ShoppingBag, Bike, Check, 
  Sparkles, AlertCircle, ChevronRight, ShieldCheck 
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface OrderProgressBarProps {
  orderId: string;
  initialStatus?: string;
  compact?: boolean;
}

interface OrderStage {
  id: string;
  label: string;
  shortLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  etaText: string;
}

const ORDER_STAGES: OrderStage[] = [
  {
    id: 'Pending',
    label: 'Order Placed',
    shortLabel: 'Placed',
    desc: 'Order received by the dispatch grid and sent to the store',
    icon: Package,
    etaText: 'Confirming in ~2 mins'
  },
  {
    id: 'Accepted',
    label: 'Order Accepted',
    shortLabel: 'Confirmed',
    desc: 'Store confirmed your items and routed to preparation queue',
    icon: CheckCircle2,
    etaText: 'Starting prep shortly'
  },
  {
    id: 'Preparing',
    label: 'Preparing Items',
    shortLabel: 'Preparing',
    desc: 'Fresh packing, quality checks, and sanitary packaging in progress',
    icon: Clock,
    etaText: 'Ready in ~10-12 mins'
  },
  {
    id: 'ReadyForPickup',
    label: 'Ready for Pickup',
    shortLabel: 'Ready',
    desc: 'Sealed package staged at counter awaiting delivery partner pickup',
    icon: ShoppingBag,
    etaText: 'Partner arriving at store'
  },
  {
    id: 'OutForDelivery',
    label: 'Out for Delivery',
    shortLabel: 'In Transit',
    desc: 'Delivery partner has picked up your package and is on the way',
    icon: Bike,
    etaText: 'Arriving in ~8-15 mins'
  },
  {
    id: 'Delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
    desc: 'Order successfully delivered to your registered doorstep',
    icon: Check,
    etaText: 'Delivered & Completed'
  }
];

export default function OrderProgressBar({ orderId, initialStatus = 'Pending', compact = false }: OrderProgressBarProps) {
  const [currentStatus, setCurrentStatus] = useState<string>(initialStatus);
  const [selectedStageIdx, setSelectedStageIdx] = useState<number | null>(null);

  // Real-time Firestore sync
  useEffect(() => {
    if (!orderId || orderId === 'NEW-ORDER') return;

    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.status) {
            setCurrentStatus(data.status);
          }
        }
      }, (err) => {
        console.warn('[OrderProgressBar] Realtime listener error, fallback to initial state:', err);
      });
    } catch (err) {
      console.warn('[OrderProgressBar] Failed to set up snapshot listener:', err);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [orderId]);

  // Map any alias status into the 6 canonical stages
  const getStageIndex = (status: string): number => {
    const normalized = (status || '').toLowerCase().replace(/[\s_-]+/g, '');
    if (normalized.includes('placed') || normalized === 'pending') return 0;
    if (normalized.includes('accept') || normalized === 'confirmed') return 1;
    if (normalized.includes('prep') || normalized === 'processing') return 2;
    if (normalized.includes('ready') || normalized.includes('pickup')) return 3;
    if (normalized.includes('out') || normalized.includes('transit') || normalized.includes('delivery')) return 4;
    if (normalized.includes('deliver') || normalized === 'completed') return 5;
    return 0; // Default to step 1
  };

  const activeIndex = getStageIndex(currentStatus);
  const activeStage = ORDER_STAGES[activeIndex] || ORDER_STAGES[0];
  const displayedStage = selectedStageIdx !== null ? ORDER_STAGES[selectedStageIdx] : activeStage;

  // Percentage filled: 0 -> 16.7%, 1 -> 33.3%, 2 -> 50%, 3 -> 66.7%, 4 -> 83.3%, 5 -> 100%
  const progressPercentage = Math.round(((activeIndex + 1) / ORDER_STAGES.length) * 100);

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-6 sm:p-7 shadow-md border border-slate-100 space-y-5 text-left relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with stage badge & real-time connectivity status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider font-mono">
              Stage {activeIndex + 1} of 6
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.75 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8.5px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Sync</span>
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{activeStage.label}</span>
            {activeIndex === 5 && <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />}
          </h3>
        </div>

        <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-2xl border sm:border-0 border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Estimated Progress</p>
          <div className="flex items-baseline gap-1 sm:justify-end">
            <span className="text-base font-black text-emerald-600 font-mono">{progressPercentage}%</span>
            <span className="text-[10px] font-bold text-slate-500">• {activeStage.etaText}</span>
          </div>
        </div>
      </div>

      {/* Visual Multi-Segment Progress Bar Track */}
      <div className="relative pt-3 pb-2 z-10">
        {/* Background Track */}
        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
          {/* Animated Gradient Fill */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-500 shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* 6 Stage Milestone Nodes */}
        <div className="grid grid-cols-6 pt-3 relative">
          {ORDER_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            const isSelected = selectedStageIdx === idx;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageIdx(selectedStageIdx === idx ? null : idx)}
                className="flex flex-col items-center text-center group cursor-pointer relative focus:outline-none"
                title={`${stage.label} - Click to preview details`}
              >
                {/* Milestone Node Circle */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                        : isCurrent 
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 font-black shadow-amber-500/30' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </motion.div>

                  {/* Pulsing beacon dot for the active stage */}
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                  )}
                </div>

                {/* Stage Short Label */}
                <span className={`mt-2 text-[8px] sm:text-[9.5px] font-black uppercase tracking-tighter leading-none line-clamp-1 transition-colors ${
                  isCurrent 
                    ? 'text-slate-900 font-extrabold' 
                    : isCompleted 
                      ? 'text-emerald-700' 
                      : 'text-slate-400'
                }`}>
                  {stage.shortLabel}
                </span>

                {/* Micro step number */}
                <span className="text-[7.5px] font-mono font-bold text-slate-400 mt-0.5">
                  0{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active / Inspected Stage Detail Info Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayedStage.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className={`p-4 rounded-3xl border transition-all ${
            displayedStage.id === activeStage.id
              ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-indigo-500/20 shadow-lg shadow-indigo-950/20'
              : 'bg-slate-50 text-slate-900 border-slate-200/80'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              displayedStage.id === activeStage.id ? 'bg-amber-400 text-slate-950' : 'bg-white text-indigo-600 border border-slate-200'
            }`}>
              <displayedStage.icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${
                    displayedStage.id === activeStage.id ? 'text-white' : 'text-slate-900'
                  }`}>
                    {displayedStage.label}
                  </h4>
                  {displayedStage.id === activeStage.id && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[8px] font-black uppercase font-mono">
                      Current
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold font-mono ${
                  displayedStage.id === activeStage.id ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {displayedStage.etaText}
                </span>
              </div>

              <p className={`text-[11px] font-medium leading-relaxed mt-1 ${
                displayedStage.id === activeStage.id ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {displayedStage.desc}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer reassurance badge */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-0.5 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lokal Decentralized Dispatch Verification</span>
        </span>
        <span className="font-mono text-slate-400">Order #{orderId}</span>
      </div>
    </div>
  );
}
