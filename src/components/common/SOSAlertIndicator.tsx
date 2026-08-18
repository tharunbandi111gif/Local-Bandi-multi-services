import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, MapPin, Clock, Phone, AlertTriangle, 
  ExternalLink, Copy, Check, Navigation, ShieldCheck, 
  Radio, RadioTower, CheckCircle2, ChevronRight, X, Volume2, VolumeX,
  Car, User, Building2, Flame, RefreshCw
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SOSAlert } from '../../types';

interface SOSAlertIndicatorProps {
  alert: SOSAlert;
  variant?: 'card' | 'banner' | 'compact' | 'modal';
  onClose?: () => void;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  isAdmin?: boolean;
}

export function SOSAlertIndicator({
  alert,
  variant = 'card',
  onClose,
  onAcknowledge,
  onResolve,
  isAdmin = true
}: SOSAlertIndicatorProps) {
  const [copied, setCopied] = useState(false);
  const [elapsedText, setElapsedText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Calculate elapsed time from transmitted timestamp
  useEffect(() => {
    const calculateElapsed = () => {
      let timeMs = 0;
      if (alert.isoTimestamp) {
        timeMs = new Date(alert.isoTimestamp).getTime();
      } else if (alert.timestamp?.seconds) {
        timeMs = alert.timestamp.seconds * 1000;
      } else if (alert.timestamp?.toMillis) {
        timeMs = alert.timestamp.toMillis();
      } else if (alert.timestamp) {
        timeMs = new Date(alert.timestamp).getTime();
      } else {
        timeMs = Date.now();
      }

      const diffSecs = Math.floor((Date.now() - timeMs) / 1000);
      if (diffSecs < 10) {
        setElapsedText('Just now');
      } else if (diffSecs < 60) {
        setElapsedText(`${diffSecs}s ago`);
      } else if (diffSecs < 3600) {
        const mins = Math.floor(diffSecs / 60);
        setElapsedText(`${mins}m ago`);
      } else {
        const hours = Math.floor(diffSecs / 3600);
        setElapsedText(`${hours}h ${Math.floor((diffSecs % 3600) / 60)}m ago`);
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 5000);
    return () => clearInterval(interval);
  }, [alert.timestamp, alert.isoTimestamp]);

  const handleCopyCoords = () => {
    const lat = alert.latitude || alert.coordinates?.lat || 0;
    const lng = alert.longitude || alert.coordinates?.lng || 0;
    const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(coordStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus: 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED') => {
    if (!alert.id) return;
    setIsUpdating(true);
    try {
      const alertRef = doc(db, 'sos_alerts', alert.id);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      if (newStatus === 'RESOLVED') {
        updateData.resolvedAt = serverTimestamp();
      }
      await updateDoc(alertRef, updateData);
      if (newStatus === 'ACKNOWLEDGED' && onAcknowledge) onAcknowledge(alert.id);
      if (newStatus === 'RESOLVED' && onResolve) onResolve(alert.id);
    } catch (err) {
      console.error('Failed to update SOS alert status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const lat = alert.latitude || alert.coordinates?.lat || 17.2473;
  const lng = alert.longitude || alert.coordinates?.lng || 80.1514;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const isActive = alert.status === 'ACTIVE';
  const isAcknowledged = alert.status === 'ACKNOWLEDGED' || alert.status === 'DISPATCHED';
  const isResolved = alert.status === 'RESOLVED';

  // Compact Variant (Pill / Indicator in Header)
  if (variant === 'compact') {
    return (
      <div 
        onClick={() => setShowFullDetails(true)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer select-none transition-all shadow-lg ${
          isActive
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25 shadow-rose-950/30 animate-pulse'
            : isAcknowledged
            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-rose-500' : isAcknowledged ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider">
          🚨 SOS Triggered: <span className="font-mono">{alert.exactTime || 'Live'}</span> ({lat.toFixed(4)}°, {lng.toFixed(4)}°)
        </span>
      </div>
    );
  }

  // Header Banner Variant
  if (variant === 'banner') {
    return (
      <div className={`w-full rounded-2xl border p-3.5 sm:p-4 text-left transition-all ${
        isActive 
          ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-rose-500/40 shadow-xl shadow-rose-950/40' 
          : 'bg-slate-900 border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isActive ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                  SOS TRIGGERED
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-300">
                  {alert.exactTime} &bull; {elapsedText}
                </span>
              </div>
              <p className="text-xs font-black text-white mt-0.5">
                {alert.name} ({alert.phone}) &bull; <span className="font-mono text-emerald-400">{lat.toFixed(5)}°N, {lng.toFixed(5)}°E</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center gap-1 transition-all shadow-md"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Live Coordinates</span>
            </a>
            <button
              onClick={handleCopyCoords}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
              title="Copy Coordinates"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isAdmin && isActive && (
              <button
                onClick={() => handleStatusChange('ACKNOWLEDGED')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-xl transition-all"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Primary Comprehensive Card Layout
  return (
    <div className={`rounded-[2rem] border overflow-hidden text-left transition-all ${
      isActive
        ? 'bg-slate-900/95 border-rose-500/40 shadow-2xl shadow-rose-950/30 ring-1 ring-rose-500/20'
        : isAcknowledged
        ? 'bg-slate-900 border-amber-500/30'
        : 'bg-slate-900/80 border-emerald-500/20 opacity-90'
    }`}>
      {/* Top Banner Alert Bar */}
      <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${
        isActive 
          ? 'bg-gradient-to-r from-rose-950/60 via-rose-900/40 to-slate-900 border-rose-500/30' 
          : 'bg-slate-950/60 border-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border relative ${
            isActive ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-white/10 text-slate-400'
          }`}>
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            {isActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                isActive 
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-950/40' 
                  : isAcknowledged 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isActive ? '🚨 SOS TRIGGERED' : isAcknowledged ? '⚠️ DISPATCH IN PROGRESS' : '✓ RESOLVED'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
                {alert.severity || 'CRITICAL'} SEVERITY
              </span>
              {alert.branchName && (
                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-500/20">
                  {alert.branchName}
                </span>
              )}
            </div>
            <h4 className="text-sm sm:text-base font-black text-white mt-1 leading-tight flex items-center gap-2">
              <span>{alert.name || 'Emergency Dispatch Rider'}</span>
              <span className="text-xs font-mono font-normal text-slate-400">({alert.phone})</span>
            </h4>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-1.5 justify-end text-rose-400 font-mono text-xs font-black">
            <Clock className="w-3.5 h-3.5" />
            <span>{alert.exactTime || 'Live'}</span>
          </div>
          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
            {alert.exactDate || 'Today'} &bull; <span className="text-amber-400">{elapsedText}</span>
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* TRANSMITTED DATA PANEL: EXACT TIME & PRECISE COORDINATES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Exact Time Transmitted Box */}
          <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-rose-500" /> Exact Transmitted Time
              </span>
              <span className="text-[8px] bg-rose-500/10 text-rose-300 font-black px-1.5 py-0.5 rounded font-mono">
                PRECISION: SECONDS
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-white font-mono tracking-tight flex items-center gap-2">
                <span>{alert.exactTime || 'Just Now'}</span>
                <span className="text-[10px] font-sans font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {elapsedText}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {alert.exactDate || 'Current Session'} {alert.isoTimestamp ? `(${new Date(alert.isoTimestamp).toLocaleTimeString()})` : ''}
              </p>
            </div>
          </div>

          {/* Precise Coordinates Transmitted Box */}
          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 font-mono">
                <Navigation className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Precise GPS Coordinates
              </span>
              <button
                onClick={handleCopyCoords}
                className="text-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copied ? 'Copied!' : 'Copy GPS'}</span>
              </button>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-emerald-400 font-mono tracking-tight">
                {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate" title={alert.address || 'Transmitted Corridor Position'}>
                📍 {alert.address || 'Dispatch corridor near active route'}
              </p>
            </div>
          </div>
        </div>

        {/* Incident Trigger & Vehicle Details */}
        <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-3.5 text-xs text-slate-300 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Trigger Source:</span>
            <span className="text-[10px] font-black text-rose-300 bg-rose-950/50 px-2.5 py-0.5 rounded-lg border border-rose-800/30 flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-500" />
              {alert.triggerType || 'Collision Detector Telemetry Spike (32.4 m/s²)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
            {alert.vehicleType && (
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">Vehicle Type</span>
                <span className="font-bold text-white">{alert.vehicleType}</span>
              </div>
            )}
            {alert.vehicleNumber && (
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">Vehicle No.</span>
                <span className="font-bold text-amber-400">{alert.vehicleNumber}</span>
              </div>
            )}
            {alert.supervisorName && (
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">Supervisor</span>
                <span className="font-bold text-indigo-300">{alert.supervisorName}</span>
              </div>
            )}
            {alert.supervisorPhone && (
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">Officer Contact</span>
                <a href={`tel:${alert.supervisorPhone}`} className="font-bold text-emerald-400 hover:underline">
                  {alert.supervisorPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Transmitted Diagnostic Logs */}
        {alert.transmittedLogs && alert.transmittedLogs.length > 0 && (
          <div className="bg-slate-950 rounded-2xl p-3 border border-white/5 text-[9.5px] font-mono space-y-1 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Transmitted Telemetry & Dispatch Stream:
            </span>
            {alert.transmittedLogs.map((logStr, idx) => (
              <div key={idx} className="text-slate-400 leading-tight">
                &bull; {logStr}
              </div>
            ))}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Open Google Maps in New Tab */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/30 cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Satellite GPS Map</span>
            </a>

            {/* Direct Phone Dial */}
            {alert.phone && (
              <a
                href={`tel:${alert.phone}`}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border border-white/5"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call {alert.name?.split(' ')[0] || 'Rider'}</span>
              </a>
            )}

            {/* Police Emergency 112 */}
            <a
              href="tel:112"
              className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <span>🚔 Dial 112 Police</span>
            </a>
          </div>

          {/* Admin Workflow Control: Acknowledge & Resolve */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              {isActive && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('ACKNOWLEDGED')}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {isUpdating ? 'Updating...' : 'Acknowledge SOS'}
                </button>
              )}

              {!isResolved && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('RESOLVED')}
                  disabled={isUpdating}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-emerald-600 hover:text-white disabled:opacity-50 text-slate-300 font-black uppercase text-[10px] tracking-wider rounded-xl transition-all border border-white/10 cursor-pointer"
                >
                  {isUpdating ? 'Updating...' : '✓ Mark Resolved'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SOSAlertIndicator;
