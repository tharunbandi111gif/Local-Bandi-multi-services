import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Timer, 
  Edit3, 
  Check, 
  X, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VendorOrder } from '../types';

interface VendorOrderPrepTimerProps {
  order: VendorOrder;
  compact?: boolean;
  onUpdatePrepTime?: (orderId: string, prepTimeMinutes: number) => Promise<void> | void;
  onMarkReady?: (orderId: string) => Promise<void> | void;
}

export const VendorOrderPrepTimer: React.FC<VendorOrderPrepTimerProps> = ({
  order,
  compact = false,
  onUpdatePrepTime,
  onMarkReady
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [isEditingPrep, setIsEditingPrep] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update timer every second
  useEffect(() => {
    // Only run interval if order is actively preparing or accepted
    if (!['Preparing', 'Accepted'].includes(order.status)) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [order.status]);

  // Configured prep time in minutes (default 15 minutes if not specified)
  const prepMinutes = order.prepTimeMinutes && order.prepTimeMinutes > 0 ? order.prepTimeMinutes : 15;

  // Resolve start time
  const startTimeMs = useMemo(() => {
    if (order.prepStartedAt) {
      const parsed = new Date(order.prepStartedAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (order.createdAt) {
      const parsed = new Date(order.createdAt).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return Date.now();
  }, [order.prepStartedAt, order.createdAt]);

  const targetTimeMs = startTimeMs + prepMinutes * 60 * 1000;
  const totalDurationMs = prepMinutes * 60 * 1000;
  const elapsedMs = Math.max(0, now - startTimeMs);
  const remainingMs = targetTimeMs - now;
  const isOverdue = remainingMs <= 0;

  // Percentage complete (clamped between 0 and 100 for the bar)
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

  // Format MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const formattedRemaining = formatTime(remainingMs);

  // Apply prep time change
  const handleApplyPrepTime = async (minutes: number) => {
    if (minutes < 1 || minutes > 180) return;
    setIsUpdating(true);
    try {
      if (onUpdatePrepTime) {
        await onUpdatePrepTime(order.id, minutes);
      }
      setIsEditingPrep(false);
    } catch (err) {
      console.error("Failed to update prep time:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val) && val > 0) {
      handleApplyPrepTime(val);
    }
  };

  // If order is completed or cancelled, don't show active timer
  if (['ReadyForPickup', 'PickedUp', 'Delivered', 'Cancelled'].includes(order.status)) {
    return null;
  }

  // COMPACT HEADER BADGE (Used in card header bar)
  if (compact) {
    if (order.status === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-500" />
          <span>Prep: {prepMinutes}m</span>
        </span>
      );
    }

    if (['Preparing', 'Accepted'].includes(order.status)) {
      if (isOverdue) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-rose-500 text-white border border-rose-600 shadow-sm animate-pulse">
            <AlertTriangle className="w-3 h-3 text-white" />
            <span>Overdue +{formattedRemaining}</span>
          </span>
        );
      }

      const isUrgent = remainingMs <= 5 * 60 * 1000; // less than 5 mins
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black shadow-sm transition-colors ${
          isUrgent 
            ? 'bg-amber-500 text-slate-950 border border-amber-400 animate-pulse' 
            : 'bg-emerald-600 text-white border border-emerald-500'
        }`}>
          <Timer className="w-3 h-3" />
          <span>{formattedRemaining} left</span>
        </span>
      );
    }

    return null;
  }

  // EXPANDED DETAILED VIEW (Rendered inside the order card)
  const isUrgent = !isOverdue && remainingMs <= 5 * 60 * 1000;

  return (
    <div className="rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm"
      style={{
        backgroundColor: isOverdue 
          ? '#fff1f2' 
          : isUrgent 
          ? '#fffbeb' 
          : '#f0fdf4',
        borderColor: isOverdue 
          ? '#fecdd3' 
          : isUrgent 
          ? '#fde68a' 
          : '#bbf7d0'
      }}
    >
      <div className="p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
              isOverdue 
                ? 'bg-rose-500 text-white animate-bounce' 
                : isUrgent 
                ? 'bg-amber-500 text-slate-950' 
                : 'bg-emerald-500 text-white'
            }`}>
              {isOverdue ? (
                <AlertTriangle className="w-4 h-4" />
              ) : isUrgent ? (
                <Flame className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  Kitchen Prep Timer
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOverdue 
                    ? 'bg-rose-600 text-white' 
                    : isUrgent 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {isOverdue ? 'Overdue' : isUrgent ? 'Almost Ready' : 'In Progress'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">
                {isOverdue 
                  ? 'Prep time has elapsed! Please prioritize packaging.'
                  : `Target prep: ${prepMinutes} mins (${progressPercent.toFixed(0)}% elapsed)`}
              </p>
            </div>
          </div>

          {/* Large Countdown Digits */}
          <div className="text-right">
            <div className={`font-mono font-black text-2xl sm:text-3xl tracking-tight leading-none ${
              isOverdue 
                ? 'text-rose-600' 
                : isUrgent 
                ? 'text-amber-600' 
                : 'text-emerald-700'
            }`}>
              {isOverdue ? `+${formattedRemaining}` : formattedRemaining}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {isOverdue ? 'Delayed Time' : 'Time Remaining'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden mb-4 p-0.5 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all duration-300 ${
              isOverdue 
                ? 'bg-rose-500 shadow-sm shadow-rose-300' 
                : isUrgent 
                ? 'bg-amber-500 shadow-sm shadow-amber-300' 
                : 'bg-emerald-500 shadow-sm shadow-emerald-300'
            }`}
          />
        </div>

        {/* Configurable Prep Time Toolbar */}
        <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 mr-1">
              Adjust Prep Time:
            </span>

            {/* Quick Presets */}
            {[10, 15, 20, 30].map(mins => (
              <button
                key={mins}
                type="button"
                disabled={isUpdating}
                onClick={() => handleApplyPrepTime(mins)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight transition active:scale-95 ${
                  prepMinutes === mins
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                }`}
              >
                {mins}m
              </button>
            ))}

            {/* Incremental Adjusters */}
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleApplyPrepTime(Math.max(5, prepMinutes - 5))}
                title="Minus 5 minutes"
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-black active:scale-95 transition shadow-2xs"
              >
                -5m
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleApplyPrepTime(prepMinutes + 5)}
                title="Add 5 minutes"
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-black active:scale-95 transition shadow-2xs"
              >
                +5m
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleApplyPrepTime(prepMinutes + 10)}
                title="Add 10 minutes"
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-black active:scale-95 transition shadow-2xs"
              >
                +10m
              </button>
            </div>

            {/* Custom Minutes Input Toggle */}
            {!isEditingPrep ? (
              <button
                type="button"
                onClick={() => {
                  setCustomMinutes(prepMinutes.toString());
                  setIsEditingPrep(true);
                }}
                className="px-2 py-1 rounded-lg text-[9px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 transition active:scale-95 shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Custom</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Mins"
                  className="w-14 px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="p-1 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-800"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPrep(false)}
                  className="p-1 bg-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Mark Ready Button directly on timer */}
          {onMarkReady && (
            <button
              type="button"
              onClick={() => onMarkReady(order.id)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all ml-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Ready</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOrderPrepTimer;
