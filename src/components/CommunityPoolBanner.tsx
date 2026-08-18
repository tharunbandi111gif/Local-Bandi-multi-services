import React, { useState, useEffect } from 'react';
import { Users, Clock, Flame, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { 
  AttractionCampaignsConfig, 
  getLocalAttractionConfig, 
  subscribeToAttractionConfig 
} from '../types/attractionCampaigns';

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
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 35);
  const [poolMembers, setPoolMembers] = useState(53);
  const [hasJoinedPool, setHasJoinedPool] = useState(false);

  useEffect(() => {
    if (propConfig) {
      setConfig(propConfig);
      return;
    }
    const unsubscribe = subscribeToAttractionConfig((updated) => {
      setConfig(updated);
      if (updated.groupPool) {
        setPoolMembers(updated.groupPool.currentJoined || 53);
      }
      if (updated.flashDrop?.durationMinutes) {
        setTimeLeft(updated.flashDrop.durationMinutes * 60);
      }
    });
    return () => unsubscribe();
  }, [propConfig]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return (config.flashDrop?.durationMinutes || 15) * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config.flashDrop?.durationMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const targetMembers = config.groupPool?.targetMembers || 54;

  const handleJoinPool = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasJoinedPool) {
      setPoolMembers(targetMembers);
      setHasJoinedPool(true);
      try {
        localStorage.setItem('lokal_group_pool_unlocked', 'true');
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
              className="relative overflow-hidden rounded-[2rem] p-4 bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white shadow-lg cursor-pointer group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[9px] font-black uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-yellow-300 animate-bounce" />
                  <span>{config.flashDrop?.badge || 'Golden Hour Drop'}</span>
                </div>
                
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 text-[10px] font-mono font-black text-yellow-300">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-base font-black italic tracking-tight uppercase leading-tight">
                  {config.flashDrop?.title || 'Flat 50% Off Flash Rush'}
                </h4>
                <p className="text-[11px] text-orange-100 font-medium line-clamp-1">
                  {config.flashDrop?.description || 'Floor Cleaner, Dish Wash Gel & Fabric Conditioner at direct 50% OFF!'}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-1 border-t border-white/20 text-[10px] font-bold">
                <span className="text-yellow-200">{config.flashDrop?.stockText || 'Limited units available right now'}</span>
                <span className="flex items-center gap-0.5 text-white underline group-hover:translate-x-0.5 transition-transform">
                  {config.flashDrop?.ctaText || 'Claim 50% Deal'} <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Scratch & Win Attraction Card */}
          {showScratchCard && (
            <div 
              onClick={onOpenScratchCard}
              className="relative overflow-hidden rounded-[2rem] p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white border border-purple-500/30 shadow-lg cursor-pointer group"
            >
              <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-[9px] font-black uppercase tracking-wider text-purple-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>{config.scratchCard?.headerBadge || 'Daily Lucky Gift'}</span>
                </div>
                
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  Daily 1 Time
                </span>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-base font-black italic tracking-tight text-white uppercase leading-tight">
                  {config.scratchCard?.title || 'Daily Lucky Mystery Scratch Card'}
                </h4>
                <p className="text-[11px] text-purple-200 font-medium">
                  {config.scratchCard?.subtitle || 'Scratch daily for surprise cash discount off your basket!'}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-1 border-t border-white/10 text-[10px] font-bold">
                <span className="text-amber-300">Tap to scratch with finger</span>
                <span className="flex items-center gap-0.5 text-purple-300 underline group-hover:translate-x-0.5 transition-transform">
                  Scratch Now <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Community Neighborhood Pool (Hyperlocal Group Buy: 54 members target, flat 20% discount) */}
      {showGroupPool && (
        <div className="p-3.5 rounded-[2rem] bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shrink-0 mt-0.5 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h5 className="text-xs font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">
                  {config.groupPool?.title || 'Neighborhood Group Buy Pool'}
                </h5>
                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                  {poolMembers}/{targetMembers} Joined via Referral
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5 font-medium">
                {hasJoinedPool 
                  ? (config.groupPool?.unlockedDescription || "🎉 Referral target reached (54/54 joined)! You unlocked 1-Time Flat 20% Group Buy Pool Discount!")
                  : (config.groupPool?.lockedDescription || `Share referral link with 54 neighbors to unlock 1-Time Flat ${config.groupPool?.discountAmount || 20}% Group Discount + FREE Delivery!`)}
              </p>
            </div>
          </div>

          <button
            onClick={handleJoinPool}
            className={`shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
              hasJoinedPool
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {hasJoinedPool 
                ? 'Pool Unlocked (Flat 20% OFF)' 
                : `Unlock Flat ${config.groupPool?.discountAmount || 20}% Pool`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

