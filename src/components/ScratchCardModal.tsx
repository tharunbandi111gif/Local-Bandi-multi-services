import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, X, Check, Copy, PartyPopper, ShieldCheck } from 'lucide-react';
import { ScratchRewardItem, ScratchCardConfig, getLocalAttractionConfig, DEFAULT_SCRATCH_REWARDS } from '../types/attractionCampaigns';

interface ScratchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (couponCode: string, discountPct: number) => void;
  config?: ScratchCardConfig;
}

export const ScratchCardModal: React.FC<ScratchCardModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
  config
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alreadyClaimedToday, setAlreadyClaimedToday] = useState(false);

  // Active configuration
  const activeConfig = config || getLocalAttractionConfig().scratchCard;
  const activeRewards = (activeConfig.rewards && activeConfig.rewards.filter(r => r.isActive).length > 0)
    ? activeConfig.rewards.filter(r => r.isActive)
    : DEFAULT_SCRATCH_REWARDS;

  const [selectedReward, setSelectedReward] = useState<ScratchRewardItem>(activeRewards[0] || DEFAULT_SCRATCH_REWARDS[0]);

  useEffect(() => {
    if (isOpen) {
      const todayKey = new Date().toISOString().split('T')[0];
      const lastScratchedDate = typeof window !== 'undefined' ? localStorage.getItem('lokal_scratch_last_date') : null;
      const hasClaimed = lastScratchedDate === todayKey;
      setAlreadyClaimedToday(hasClaimed);

      // Pick random surprise reward from active admin rewards (capped strictly below 8 rupees)
      const currentActiveRewards = (activeConfig.rewards && activeConfig.rewards.filter(r => r.isActive).length > 0)
        ? activeConfig.rewards.filter(r => r.isActive)
        : DEFAULT_SCRATCH_REWARDS;
      const randomReward = currentActiveRewards[Math.floor(Math.random() * currentActiveRewards.length)] || DEFAULT_SCRATCH_REWARDS[0];
      setSelectedReward(randomReward);
      setIsScratched(false);
      setScratchPercentage(0);
      setCopied(false);

      if (!hasClaimed) {
        // Initialize canvas
        setTimeout(() => {
          initCanvas();
        }, 100);
      }
    }
  }, [isOpen, activeConfig]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 280;
    canvas.height = 180;

    // Draw scratchable gold gradient
    const gradient = ctx.createLinearGradient(0, 0, 280, 180);
    gradient.addColorStop(0, '#f59e0b');
    gradient.addColorStop(0.5, '#fbbf24');
    gradient.addColorStop(1, '#d97706');

    ctx.fillStyle = gradient;
    ctx.roundRect ? ctx.roundRect(0, 0, 280, 180, 16) : ctx.rect(0, 0, 280, 180);
    ctx.fill();

    // Add metallic sparkle patterns
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 280;
      const y = Math.random() * 180;
      const r = Math.random() * 4 + 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text on scratch surface
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH HERE ✨', 140, 85);
    
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText('Swipe finger or cursor to reveal surprise!', 140, 110);
  };

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparentPixels = 0;
      const totalPixels = imgData.data.length / 4;

      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) {
          transparentPixels += 4;
        }
      }

      const percent = Math.min(100, Math.round((transparentPixels / totalPixels) * 100));
      setScratchPercentage(percent);

      if (percent > 45 && !isScratched) {
        setIsScratched(true);
        try {
          const todayKey = new Date().toISOString().split('T')[0];
          localStorage.setItem('lokal_scratch_last_date', todayKey);
        } catch {
          // ignore
        }
        if (onRewardClaimed) {
          onRewardClaimed(selectedReward.code, selectedReward.discount);
        }
        // Confetti trigger
        try {
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        } catch {
          // ignore vibration error
        }
      }
    } catch {
      // ignore context error
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.touches[0]) {
      scratch(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => setIsDrawing(false);

  const copyCoupon = () => {
    navigator.clipboard.writeText(selectedReward.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative bg-slate-900 border border-amber-500/30 rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl overflow-hidden text-center text-white space-y-4"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>{activeConfig.headerBadge || 'Daily Lucky Scratch & Win'}</span>
        </div>

        <div>
          <h3 className="text-xl font-black italic tracking-tight text-white">
            {activeConfig.title || 'Scratch Your Mystery Gift!'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {activeConfig.subtitle || 'Exclusive instant discount for Local Bandi customers today.'}
          </p>
        </div>

        {/* Main Content: Daily Unlocked Card OR Limit Reached */}
        {alreadyClaimedToday ? (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-3xl">
              🎁
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black uppercase text-amber-400">Today's Lucky Card Claimed</h4>
              <p className="text-xs text-slate-300 px-4 leading-relaxed">
                Every customer gets <strong className="text-white font-bold">1 lucky scratch card daily</strong>. Your next mystery reward unlocks tomorrow at 00:00 AM!
              </p>
            </div>
            <div className="p-3 bg-slate-950/80 border border-white/10 rounded-2xl text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Limit: 1 Daily Scratch Card</span>
              <span className="text-emerald-400 font-bold">✓ Active for Today</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Scratch Card Canvas Container */}
            <div className="relative w-[280px] h-[180px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-amber-400/40 bg-slate-950 flex items-center justify-center">
              {/* Underneath Reward Card */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 p-4 flex flex-col items-center justify-center space-y-1">
                <span className="text-4xl">{selectedReward.emoji}</span>
                <h4 className="text-lg font-black text-amber-400 uppercase tracking-tight">
                  {selectedReward.title}
                </h4>
                <p className="text-[10px] text-slate-300">{selectedReward.desc}</p>
                <div className="pt-1.5">
                  <span className="font-mono font-black text-xs px-3 py-1 bg-amber-400 text-slate-950 rounded-lg shadow-sm">
                    {selectedReward.code}
                  </span>
                </div>
              </div>

              {/* Scratchable Canvas Layer */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`absolute inset-0 w-full h-full cursor-crosshair touch-none transition-opacity duration-500 ${
                  isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />
            </div>

            {/* Scratch Progress / Revealed Reward CTA */}
            {isScratched ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-3 pt-2"
              >
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-left">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Coupon Code</p>
                    <p className="text-sm font-mono font-black text-white">{selectedReward.code}</p>
                  </div>
                  <button
                    onClick={copyCoupon}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-[10px] uppercase rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (onRewardClaimed) onRewardClaimed(selectedReward.code, selectedReward.discount);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-350 hover:to-yellow-350 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Apply Offer & Start Ordering</span>
                </button>
              </motion.div>
            ) : (
              <div className="space-y-1 pt-1 text-[11px] text-slate-400">
                <div className="flex items-center justify-between px-1">
                  <span>Scratch Progress</span>
                  <span className="font-mono text-amber-400 font-bold">{scratchPercentage}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-200"
                    style={{ width: `${scratchPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-500 pt-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Instant Wallet & Checkout Auto-Credit Guaranteed</span>
        </div>
      </motion.div>
    </div>
  );
};
