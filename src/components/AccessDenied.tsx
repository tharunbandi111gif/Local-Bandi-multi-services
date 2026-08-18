import React from 'react';
import { ShieldAlert, ArrowLeft, Phone, Lock, Home, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface AccessDeniedProps {
  requiredRole: string;
  reason?: string;
  onNavigate: (screen: Screen) => void;
}

export default function AccessDenied({ requiredRole, reason, onNavigate }: AccessDeniedProps) {
  return (
    <div className="h-full w-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-rose-500/20 rounded-[2.5rem] p-8 text-center relative z-10 shadow-2xl space-y-6"
      >
        {/* Icon Header */}
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 rounded-full text-rose-300 text-[10px] font-black uppercase tracking-widest">
            <Lock className="w-3 h-3" />
            <span>403 &bull; Access Denied</span>
          </div>
          <h2 className="text-2xl font-black text-white italic tracking-tight font-display">
            Role Permission Required
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed px-2">
            {reason || `This section is restricted to authorized ${requiredRole} accounts. Your current profile does not have approved permissions to access this screen.`}
          </p>
        </div>

        {/* Security Requirement Box */}
        <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Required Role</span>
            <span className="text-amber-400 font-bold">{requiredRole}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>RBAC Verification</span>
            <span className="text-rose-400 font-bold">Strict Server Gate</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug pt-1">
            If you have submitted a partner registration, please allow our team to verify your credentials. Once approved by the Master Admin, your dashboard will activate automatically.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => onNavigate('profile')}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-400/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            Return to My Profile
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Customer Home
          </button>

          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_customer_care'));
            }}
            className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3 h-3 text-emerald-400" />
            Contact Support &bull; 7416574197
          </button>
        </div>
      </motion.div>
    </div>
  );
}
