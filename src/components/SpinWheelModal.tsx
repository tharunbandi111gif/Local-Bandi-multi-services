import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, X, Gift, Check, ShieldCheck, Zap, RotateCcw } from 'lucide-react';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardWon?: (code: string, discountPct: number) => void;
  isSundaySpecial?: boolean;
  sundayClaimCount?: number;
  maxSundayClaims?: number;
  onSpinSuccess?: () => void;
}

const WHEEL_SECTORS = [
  { label: '15% OFF', pct: 15, color: '#f59e0b', textColor: '#0f172a' },
  { label: '12% OFF', pct: 12, color: '#10b981', textColor: '#ffffff' },
  { label: '10% OFF', pct: 10, color: '#6366f1', textColor: '#ffffff' },
  { label: '14% OFF', pct: 14, color: '#ec4899', textColor: '#ffffff' },
  { label: '8% OFF', pct: 8, color: '#8b5cf6', textColor: '#ffffff' },
  { label: '5% OFF', pct: 5, color: '#14b8a6', textColor: '#ffffff' },
  { label: '100% OFFER', pct: 15, color: '#3b82f6', textColor: '#ffffff' },
  { label: '1% OFF', pct: 1, color: '#f43f5e', textColor: '#ffffff' },
];

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  onRewardWon,
  isSundaySpecial = false,
  sundayClaimCount = 0,
  maxSundayClaims = 1000,
  onSpinSuccess
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<{
    code: string;
    discountPct: number;
    label: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isTodaySunday = new Date().getDay() === 0; // 0 = Sunday (00:00 - 23:59)
  const isLimitReached = isSundaySpecial && sundayClaimCount >= maxSundayClaims;

  const handleSpin = () => {
    if (isSpinning || wonReward || isLimitReached || !isTodaySunday) return;

    setIsSpinning(true);

    // Real-time discount truly between 1% to 15% OFF
    const possiblePct = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const chosenPct = possiblePct[Math.floor(Math.random() * possiblePct.length)];

    // Spin physics: 5 full rotations (1800 deg) + angle for sector
    const sectorAngle = 360 / WHEEL_SECTORS.length;
    const targetSectorIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);

    const extraDegree = (WHEEL_SECTORS.length - targetSectorIndex) * sectorAngle - (sectorAngle / 2);
    const totalNewRotation = rotation + 1800 + (360 - (rotation % 360)) + extraDegree;

    setRotation(totalNewRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const code = `SPIN${chosenPct}OFF`;
      const rewardObj = {
        code,
        discountPct: chosenPct,
        label: `FLAT ${chosenPct}% OFF ON ORDER`
      };
      setWonReward(rewardObj);
      if (onRewardWon) {
        onRewardWon(code, chosenPct);
      }
      if (onSpinSuccess) {
        onSpinSuccess();
      }
    }, 3800);
  };

  const handleCopyCode = () => {
    if (!wonReward) return;
    navigator.clipboard.writeText(wonReward.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10008] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-amber-500/40 rounded-[2.5rem] p-6 max-w-md w-full text-center text-white relative shadow-2xl overflow-hidden"
        >
          {/* Top Close Button */}
          <button
            onClick={onClose}
            disabled={isSpinning}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Header */}
          <div className="space-y-1.5 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-spin" />
              <span>Sunday Special Reward</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 uppercase tracking-tight">
              100% OFFER GET
            </h2>
            <p className="text-[11px] text-slate-300 font-medium max-w-xs mx-auto">
              Every Sunday Special! Spin the lucky wheel to unlock your guaranteed offer today.
            </p>

            {isSundaySpecial && isTodaySunday && (
              <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl inline-block max-w-xs w-full">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-amber-400 uppercase">First 1,000 Sunday Members:</span>
                  <span className="text-white bg-slate-950 px-2 py-0.5 rounded-md border border-amber-500/40">{sundayClaimCount} / {maxSundayClaims} Claimed</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden border border-white/10">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (sundayClaimCount / maxSundayClaims) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {!wonReward ? (
            /* WHEEL VIEW */
            <div className="space-y-6 my-2">
              <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                {/* Pointer / Needle */}
                <div className="absolute -top-3 z-30 left-1/2 -translate-x-1/2">
                  <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)]" />
                </div>

                {/* Outer Ring */}
                <div className="w-full h-full rounded-full border-4 border-amber-400 p-1 bg-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] relative overflow-hidden">
                  {/* Rotating Wheel Container */}
                  <div
                    className="w-full h-full rounded-full relative overflow-hidden transition-transform ease-out"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transitionDuration: isSpinning ? '3.8s' : '0s',
                      transitionTimingFunction: 'cubic-bezier(0.15, 0.90, 0.20, 1.00)'
                    }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {WHEEL_SECTORS.map((sector, idx) => {
                        const totalSectors = WHEEL_SECTORS.length;
                        const angle = 360 / totalSectors;
                        const startAngle = idx * angle;
                        const endAngle = (idx + 1) * angle;

                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;

                        const x1 = 50 + 50 * Math.cos(startRad);
                        const y1 = 50 + 50 * Math.sin(startRad);
                        const x2 = 50 + 50 * Math.cos(endRad);
                        const y2 = 50 + 50 * Math.sin(endRad);

                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                        // Label position
                        const midAngle = (startAngle + angle / 2);
                        const midRad = (midAngle * Math.PI) / 180;
                        const labelX = 50 + 32 * Math.cos(midRad);
                        const labelY = 50 + 32 * Math.sin(midRad);

                        return (
                          <g key={idx}>
                            <path d={pathData} fill={sector.color} stroke="#0f172a" strokeWidth="0.8" />
                            <text
                              x={labelX}
                              y={labelY}
                              fill={sector.textColor}
                              fontSize="4"
                              fontWeight="900"
                              textAnchor="middle"
                              alignmentBaseline="middle"
                              transform={`rotate(${midAngle + 90}, ${labelX}, ${labelY})`}
                              className="uppercase tracking-widest font-mono"
                            >
                              {sector.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Wheel Center Cap */}
                  <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-lg z-20">
                    <Trophy className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                </div>
              </div>

              {/* Action Spin Button */}
              {!isTodaySunday ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-black text-amber-400 uppercase tracking-wide">Sunday Special Only (00:00 - 23:59)</p>
                  <p className="text-[10px] text-slate-300">The Sunday Spin Wheel is active every Sunday from 00:00 to 23:59. Please come back on Sunday to spin &amp; win your offer!</p>
                </div>
              ) : isLimitReached ? (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-black text-red-400 uppercase tracking-wide">Sunday Limit Reached! (1000/1000)</p>
                  <p className="text-[10px] text-slate-300">All 1,000 free Sunday spins have been claimed for today. Please come back next Sunday!</p>
                </div>
              ) : (
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || isLimitReached || !isTodaySunday}
                  className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                    isSpinning 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                      : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 scale-100 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {isSpinning ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>SPINNING LUCKY WHEEL...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>TAP TO SPIN NOW!</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* REWARD WON VIEW */
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 my-2 text-center"
            >
              <div className="p-4 bg-gradient-to-b from-amber-500/20 to-slate-950 rounded-2xl border border-amber-500/40 space-y-2">
                <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-amber-500/40">
                  <Gift className="w-6 h-6 stroke-[2.5]" />
                </div>

                <div className="text-xs font-black text-amber-400 uppercase tracking-widest font-mono">
                  🎉 YOU WON A SPECIAL DISCOUNT!
                </div>
                <h3 className="text-2xl font-black text-white font-mono">
                  {wonReward.label}
                </h3>

                {/* Coupon Code Display */}
                <div className="p-3 bg-slate-950 rounded-xl border border-dashed border-amber-400/60 flex items-center justify-between gap-2 max-w-xs mx-auto">
                  <div className="text-left font-mono">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Coupon Code:</span>
                    <span className="text-base font-black text-amber-400">{wonReward.code}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{copied ? 'COPIED!' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              {/* Terms & Conditions Box */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10.5px] font-black text-amber-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Reward Terms &amp; Conditions</span>
                </div>
                <ul className="text-[10px] text-slate-300 space-y-1 list-disc list-inside font-medium leading-relaxed">
                  <li>Valid on your next order with a minimum order value of <strong className="text-amber-400 font-bold">₹599 and above</strong>.</li>
                  <li>Grants a guaranteed discount between <strong className="text-emerald-400 font-bold">1% to 15% OFF</strong> on total cart value.</li>
                  <li>Use code <strong className="text-yellow-400 font-mono font-bold">{wonReward.code}</strong> at checkout.</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                GOT IT, CLAIM IN CART
              </button>
            </motion.div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
