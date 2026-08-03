import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Trophy, 
  Award, 
  Crown, 
  ShieldCheck, 
  Medal, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  DollarSign, 
  ChevronRight, 
  Info, 
  Flame, 
  Calendar, 
  BarChart3, 
  CheckCircle2, 
  Gift, 
  Sun, 
  Moon, 
  CloudRain
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';

// ==========================================
// 1. RIDER LEVEL SYSTEM UTILITIES & TYPES
// ==========================================

export interface RiderLevelInfo {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Legend';
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowColor: string;
  minTrips: number;
  nextLevelTrips: number;
  currentLevelTrips: number;
  targetTrips: number;
  progressPercent: number;
  perks: string[];
}

export function getRiderLevelInfo(completedTrips: number = 0): RiderLevelInfo {
  if (completedTrips >= 750) {
    return {
      level: 'Legend',
      color: 'text-rose-400',
      badgeBg: 'bg-gradient-to-r from-rose-500/25 via-pink-500/25 to-purple-500/25',
      badgeBorder: 'border-rose-500/50',
      badgeText: 'text-rose-300',
      glowColor: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      minTrips: 750,
      nextLevelTrips: 1000,
      currentLevelTrips: completedTrips - 750,
      targetTrips: 250,
      progressPercent: Math.min(100, Math.round(((completedTrips - 750) / 250) * 100)),
      perks: [
        '👑 VIP 1.2x Surge Pay Multiplier on All Trips',
        '⚡ Priority Dispatch Guarantee across Khammam',
        '⛽ ₹100 Daily Fuel Voucher Reimbursement',
        '☎️ Instant Dedicated VIP Dispatch Support'
      ]
    };
  } else if (completedTrips >= 350) {
    return {
      level: 'Platinum',
      color: 'text-cyan-400',
      badgeBg: 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25',
      badgeBorder: 'border-cyan-500/50',
      badgeText: 'text-cyan-300',
      glowColor: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]',
      minTrips: 350,
      nextLevelTrips: 750,
      currentLevelTrips: completedTrips - 350,
      targetTrips: 400,
      progressPercent: Math.min(100, Math.round(((completedTrips - 350) / 400) * 100)),
      perks: [
        '🛡️ Zero Platform Commission during Peak Hours',
        '⚡ Express Dispatch Allocation Priority',
        '☕ Unlimited Refreshments at Local Partner Hubs',
        '🎁 +10% Extra Tip Match Program'
      ]
    };
  } else if (completedTrips >= 150) {
    return {
      level: 'Gold',
      color: 'text-amber-400',
      badgeBg: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25',
      badgeBorder: 'border-amber-500/50',
      badgeText: 'text-amber-300',
      glowColor: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      minTrips: 150,
      nextLevelTrips: 350,
      currentLevelTrips: completedTrips - 150,
      targetTrips: 200,
      progressPercent: Math.min(100, Math.round(((completedTrips - 150) / 200) * 100)),
      perks: [
        '🏅 Priority Order Selection in High-Demand Zones',
        '⛽ 5% Fuel CashBack Rewards',
        '🎁 +5% Tip Bonus Match on 5-Star Deliveries',
        '🚀 Preferred Long-Distance Bonus Pay'
      ]
    };
  } else if (completedTrips >= 50) {
    return {
      level: 'Silver',
      color: 'text-slate-200',
      badgeBg: 'bg-gradient-to-r from-slate-400/25 to-slate-200/25',
      badgeBorder: 'border-slate-300/50',
      badgeText: 'text-slate-100',
      glowColor: 'shadow-[0_0_10px_rgba(203,213,225,0.3)]',
      minTrips: 50,
      nextLevelTrips: 150,
      currentLevelTrips: completedTrips - 50,
      targetTrips: 100,
      progressPercent: Math.min(100, Math.round(((completedTrips - 50) / 100) * 100)),
      perks: [
        '🥈 Silver Rider Badge on Dispatch Profile',
        '⚡ Early Access to Surge Heatmap Zones',
        '🎁 5% Tip Match Eligibility on Peak Hours'
      ]
    };
  } else {
    return {
      level: 'Bronze',
      color: 'text-orange-400',
      badgeBg: 'bg-gradient-to-r from-amber-800/25 to-orange-600/25',
      badgeBorder: 'border-orange-500/50',
      badgeText: 'text-orange-300',
      glowColor: 'shadow-[0_0_8px_rgba(249,115,22,0.25)]',
      minTrips: 0,
      nextLevelTrips: 50,
      currentLevelTrips: completedTrips,
      targetTrips: 50,
      progressPercent: Math.min(100, Math.round((completedTrips / 50) * 100)),
      perks: [
        '🥉 Standard Instant Daily/Weekly Payouts',
        '🚴 Full Dispatch Pool Access',
        ' Complete 50 trips to unlock Silver Rank perks!'
      ]
    };
  }
}

// Header Compact Badge
export const RiderLevelHeaderBadge: React.FC<{ completedTrips?: number }> = ({ completedTrips = 124 }) => {
  const levelInfo = getRiderLevelInfo(completedTrips);

  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${levelInfo.badgeBg} ${levelInfo.badgeBorder} ${levelInfo.glowColor} cursor-pointer transition-all hover:scale-105 shrink-0`}
      title={`Rider Level: ${levelInfo.level} (${completedTrips} trips completed)`}
    >
      {levelInfo.level === 'Legend' && <Crown className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />}
      {levelInfo.level === 'Platinum' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
      {levelInfo.level === 'Gold' && <Award className="w-3.5 h-3.5 text-amber-400" />}
      {levelInfo.level === 'Silver' && <Medal className="w-3.5 h-3.5 text-slate-200" />}
      {levelInfo.level === 'Bronze' && <Zap className="w-3.5 h-3.5 text-orange-400" />}

      <span className={`text-[9px] font-black uppercase tracking-wider font-mono ${levelInfo.badgeText}`}>
        {levelInfo.level} Rider
      </span>
    </div>
  );
};

// Full Rider Level Progress Card
export const RiderLevelProgressCard: React.FC<{ completedTrips?: number }> = ({ completedTrips = 124 }) => {
  const levelInfo = getRiderLevelInfo(completedTrips);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-[2.2rem] p-5 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${levelInfo.badgeBg} ${levelInfo.badgeBorder} ${levelInfo.glowColor}`}>
            {levelInfo.level === 'Legend' && <Crown className="w-6 h-6 text-rose-400 fill-rose-400 animate-bounce" />}
            {levelInfo.level === 'Platinum' && <ShieldCheck className="w-6 h-6 text-cyan-400" />}
            {levelInfo.level === 'Gold' && <Award className="w-6 h-6 text-amber-400" />}
            {levelInfo.level === 'Silver' && <Medal className="w-6 h-6 text-slate-200" />}
            {levelInfo.level === 'Bronze' && <Zap className="w-6 h-6 text-orange-400" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded-full border ${levelInfo.badgeBg} ${levelInfo.badgeBorder} ${levelInfo.badgeText}`}>
                {levelInfo.level} Rank
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {completedTrips} Trips Completed
              </span>
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight mt-0.5">
              Rider Tier Progress &amp; Perks
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block font-mono">Next Tier</span>
          <span className="text-xs font-black text-amber-400 font-mono">
            {levelInfo.level === 'Legend' ? 'Max Rank' : `${levelInfo.nextLevelTrips - completedTrips} Trips Left`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[9.5px] font-mono font-bold">
          <span className="text-slate-300">Level Completion ({levelInfo.progressPercent}%)</span>
          <span className="text-amber-400">{completedTrips} / {levelInfo.nextLevelTrips} Trips</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-950 p-0.5 border border-white/10 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              levelInfo.level === 'Legend' ? 'bg-gradient-to-r from-rose-500 to-purple-500' :
              levelInfo.level === 'Platinum' ? 'bg-gradient-to-r from-cyan-500 to-blue-400' :
              levelInfo.level === 'Gold' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              levelInfo.level === 'Silver' ? 'bg-gradient-to-r from-slate-400 to-slate-200' :
              'bg-gradient-to-r from-amber-700 to-orange-500'
            }`}
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Active Level Perks */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-white/5 space-y-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono block">
          ⚡ Active {levelInfo.level} Perks &amp; Bonuses:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {levelInfo.perks.map((perk, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[10.5px] font-bold text-slate-200 bg-slate-900/90 p-2 rounded-xl border border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPACT 'TIP TREND' DASHBOARD CARD
// ==========================================

export const TipTrendDashboardCard: React.FC<{
  chartData?: Array<{ date: string; Tips: number; Earnings: number; trips: number }>;
}> = ({ chartData }) => {
  const [selectedWindow, setSelectedWindow] = useState<'all' | 'lunch' | 'dinner'>('all');

  // Default 7-day tip accumulation mock dataset if none provided
  const sample7DayData = chartData || [
    { date: 'Mon', Tips: 120, Earnings: 640, trips: 14 },
    { date: 'Tue', Tips: 160, Earnings: 720, trips: 16 },
    { date: 'Wed', Tips: 110, Earnings: 580, trips: 12 },
    { date: 'Thu', Tips: 190, Earnings: 810, trips: 18 },
    { date: 'Fri', Tips: 240, Earnings: 980, trips: 21 },
    { date: 'Sat', Tips: 310, Earnings: 1250, trips: 26 },
    { date: 'Sun', Tips: 350, Earnings: 1400, trips: 28 },
  ];

  const total7DayTips = sample7DayData.reduce((acc, curr) => acc + (curr.Tips || 0), 0);
  const total7DayEarnings = sample7DayData.reduce((acc, curr) => acc + (curr.Earnings || 0), 0);
  const total7DayTrips = sample7DayData.reduce((acc, curr) => acc + (curr.trips || 0), 0);
  const avgTipPerTrip = total7DayTrips > 0 ? Math.round(total7DayTips / total7DayTrips) : 0;
  const tipToEarningsRatio = total7DayEarnings > 0 ? ((total7DayTips / total7DayEarnings) * 100).toFixed(1) : '0';

  return (
    <div className="bg-slate-900 border border-amber-500/20 rounded-[2.2rem] p-5 space-y-4 shadow-xl relative overflow-hidden" id="compact-tip-trend-card">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[8.5px] font-black uppercase">
                7-Day Tip Accumulation
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                +{tipToEarningsRatio}% Earnings Boost
              </span>
            </div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight mt-0.5">
              Tip Trend &amp; Peak Work Windows
            </h4>
          </div>
        </div>

        {/* Window Selector */}
        <div className="flex bg-slate-950 p-1 border border-white/10 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setSelectedWindow('all')}
            className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              selectedWindow === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            All 7 Days
          </button>
          <button
            onClick={() => setSelectedWindow('lunch')}
            className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              selectedWindow === 'lunch' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            ☀️ Lunch Peak
          </button>
          <button
            onClick={() => setSelectedWindow('dinner')}
            className={`px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              selectedWindow === 'dinner' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌙 Dinner Peak
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 text-left">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider block font-mono">7-Day Tips</span>
          <p className="text-xs sm:text-sm font-mono font-black text-amber-400">₹{total7DayTips}</p>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 text-left">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider block font-mono">Avg / Trip</span>
          <p className="text-xs sm:text-sm font-mono font-black text-emerald-400">₹{avgTipPerTrip}</p>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 text-left">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider block font-mono">Tip Ratio</span>
          <p className="text-xs sm:text-sm font-mono font-black text-indigo-400">{tipToEarningsRatio}%</p>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 text-left">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider block font-mono">Peak Window</span>
          <p className="text-xs sm:text-sm font-mono font-black text-rose-400">7-9:30 PM</p>
        </div>
      </div>

      {/* Visual Bar Chart comparing Daily Tips vs Overall Earnings */}
      <div className="h-36 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sample7DayData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
            <ChartTooltip 
              contentStyle={{ 
                backgroundColor: '#090d16', 
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '10px',
                color: '#fff'
              }}
            />
            <Bar dataKey="Tips" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Customer Tips" />
            <Bar dataKey="Earnings" fill="#10B981" opacity={0.3} radius={[4, 4, 0, 0]} name="Total Earnings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Work Hours Recommendation Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-orange-500/15 border border-amber-500/30 rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-amber-300 font-mono tracking-wider">
            Optimal Work Hours for Maximum Tips:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-950/80 p-2 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Lunch Window (12 PM - 2 PM)</span>
            </div>
            <span className="font-mono font-black text-emerald-400">+42% Tips</span>
          </div>

          <div className="bg-slate-950/80 p-2 rounded-xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold">Dinner Window (7:30 PM - 9:30 PM)</span>
            </div>
            <span className="font-mono font-black text-emerald-400">+65% Tips</span>
          </div>
        </div>
      </div>

    </div>
  );
};
