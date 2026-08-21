import React, { useState, useEffect } from 'react';
import { Users, Clock, Flame, Sparkles, ChevronRight, Zap, Lock, Gift, CheckCircle2 } from 'lucide-react';
import { 
  AttractionCampaignsConfig, 
  getLocalAttractionConfig, 
  subscribeToAttractionConfig,
  isGoldenHourActive,
  getGoldenHourTimerSeconds,
  getNextGoldenHourSlotText,
  getScratchCardEligibility
} from '../types/attractionCampaigns';
import { db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

interface CommunityPoolBannerProps {
  onOpenScratchCard: () => void;
  onOpenFlashDeal?: () => void;
  onSelectCategory?: (cat: string) => void;
  campaignConfig?: AttractionCampaignsConfig;
}

export const CommunityPoolBanner: React.FC<CommunityPoolBannerProps> = ({
  onOpenScratchCard,
  onOpenFlashDeal,
  campaignConfig: propConfig
}) => {
  const [config, setConfig] = useState<AttractionCampaignsConfig>(propConfig || getLocalAttractionConfig());
  const [goldenHourState, setGoldenHourState] = useState(getGoldenHourTimerSeconds());
  const [scratchEligibility, setScratchEligibility] = useState(getScratchCardEligibility());
  const [poolMembers, setPoolMembers] = useState(5);
  const [hasJoinedPool, setHasJoinedPool] = useState(false);

  useEffect(() => {
    // Check local unlocked state
    try {
      const isUnlocked = localStorage.getItem('lokal_group_pool_unlocked') === 'true';
      if (isUnlocked) setHasJoinedPool(true);
    } catch {}

    if (propConfig) {
      setConfig(propConfig);
      return;
    }

    // Real-time Firestore sync
    const unsubscribe = subscribeToAttractionConfig((updated) => {
      setConfig(updated);
      if (updated.groupPool) {
        setPoolMembers(updated.groupPool.currentJoined || 5);
      }
    });
    return () => unsubscribe();
  }, [propConfig]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGoldenHourState(getGoldenHourTimerSeconds());
      setScratchEligibility(getScratchCardEligibility());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalSecs = Math.max(0, goldenHourState.seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  const formattedTime = hours > 0 
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const targetMembers = config.groupPool?.targetMembers || 6;
  const minOrderAmt = config.groupPool?.minOrderAmount || 2500;

  const handleJoinPool = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasJoinedPool) {
      setPoolMembers(targetMembers);
      setHasJoinedPool(true);
      try {
        localStorage.setItem('lokal_group_pool_unlocked', 'true');
        localStorage.setItem('lokal_active_promo', 'GROUPPOOL20');
        // Real-time Firestore sync for all app users
        const docRef = doc(db, 'settings', 'attraction_campaigns');
        await updateDoc(docRef, {
          'groupPool.currentJoined': targetMembers,
          updatedAt: new Date().toISOString()
        }).catch((err) => {
          console.warn("Firestore pool sync notice:", err);
        });
      } catch {
        // ignore
      }
    }
  };

  const showFlashDrop = config.flashDrop?.isEnabled !== false;
  const showScratchCard = config.scratchCard?.isEnabled !== false;
  const showGroupPool = config.groupPool?.isEnabled !== false;

  // If all three are disabled by Master Admin, render nothing
  if (!showFlashDrop && !showScratchCard && !showGroupPool) {
    return null;
  }

  const gridColsClass = (showFlashDrop && showScratchCard) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

  return (
    <div className="space-y-3 my-4 px-4">
      {/* 1. Golden Hour Flash Drop & Scratch Card Row */}
      {(showFlashDrop || showScratchCard) && (
        <div className={`grid ${gridColsClass} gap-3`}>
          {/* Flash Drop Card */}
          {showFlashDrop && (
            <div 
              onClick={onOpenFlashDeal}
              className={`relative overflow-hidden rounded-[2rem] p-4 text-white shadow-lg cursor-pointer group transition-all ${
                goldenHourState.isActive 
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 ring-2 ring-yellow-400/50' 
                  : 'bg-gradient-to-br from-slate-800 via-amber-950 to-orange-950 border border-amber-500/30'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-amber-300">
                  <Flame className={`w-3.5 h-3.5 ${goldenHourState.isActive ? 'text-yellow-300 animate-bounce' : 'text-amber-400'}`} />
                  <span>{goldenHourState.isActive ? '⚡ Golden Hour Active' : '⏰ Golden Hour Slots'}</span>
                </div>
                
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 text-[10px] font-mono font-black text-yellow-300 border border-white/10">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-base font-black italic tracking-tight uppercase leading-tight flex items-center gap-1.5">
                  <span>{config.flashDrop?.title || 'Flat 50% Golden Hour Drop'}</span>
                </h4>
                <p className="text-[11px] text-orange-100/90 font-medium line-clamp-1">
                  Selected items only (Max ₹50 off) • 6-8 AM & 4-7 PM Daily
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-1 border-t border-white/20 text-[10px] font-bold">
                <span className="text-yellow-200">
                  {goldenHourState.isActive ? '🔥 50% Active Now (Max ₹50)' : getNextGoldenHourSlotText()}
                </span>
                <span className="flex items-center gap-0.5 text-white underline group-hover:translate-x-0.5 transition-transform">
                  View Items <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Scratch & Win Attraction Card */}
          {showScratchCard && (
            <div 
              onClick={onOpenScratchCard}
              className={`relative overflow-hidden rounded-[2rem] p-4 text-white shadow-lg cursor-pointer group transition-all ${
                scratchEligibility.isEligible
                  ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 border border-purple-500/40 ring-1 ring-purple-400/30'
                  : 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-indigo-500/20 opacity-90'
              }`}
            >
              <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-[9px] font-black uppercase tracking-wider text-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>{config.scratchCard?.headerBadge || 'Daily Mystery Gift'}</span>
                </div>
                
                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {scratchEligibility.badge}
                </span>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-base font-black italic tracking-tight text-white uppercase leading-tight">
                  {config.scratchCard?.title || 'Daily Lucky Scratch Card'}
                </h4>
                <p className="text-[11px] text-purple-200 font-medium line-clamp-1">
                  {scratchEligibility.message}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-bold">
                <span className="text-amber-300">
                  {scratchEligibility.isEligible ? '✨ 1 Daily Scratch Available' : '🔒 First 7 Days & 4th Month Week 1'}
                </span>
                <span className="flex items-center gap-0.5 text-purple-300 underline group-hover:translate-x-0.5 transition-transform">
                  {scratchEligibility.isEligible ? 'Scratch Now' : 'Check Card'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Community Neighborhood Pool (6 members target, Min Order ₹2,500, flat 20% discount) */}
      {showGroupPool && (
        <div className="p-4 rounded-[2rem] bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border border-emerald-300 dark:border-emerald-700/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shrink-0 mt-0.5 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                  {config.groupPool?.title || 'Neighborhood Group Buy Pool'}
                </h5>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100 border border-emerald-400/40">
                  {poolMembers}/{targetMembers} Members Joined
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-200 dark:bg-teal-800 text-teal-950 dark:text-teal-100">
                  Min. Order ₹{minOrderAmt.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1 font-medium">
                {hasJoinedPool 
                  ? `🎉 Group of ${targetMembers} joined! Flat ${config.groupPool?.discountAmount || 20}% Pool Discount + FREE Delivery unlocked on orders min ₹${minOrderAmt.toLocaleString('en-IN')}!`
                  : `Assemble ${targetMembers} neighbors in a pool to unlock 1-Time Flat ${config.groupPool?.discountAmount || 20}% Group Discount + FREE Delivery on orders min ₹${minOrderAmt.toLocaleString('en-IN')}.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleJoinPool}
            className={`shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
              hasJoinedPool
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95'
            }`}
          >
            {hasJoinedPool ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            <span>
              {hasJoinedPool 
                ? 'Pool Active (Flat 20% OFF)' 
                : `Join 6-Member Pool (20% OFF)`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

