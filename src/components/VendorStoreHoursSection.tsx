import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Power, 
  Check, 
  AlertCircle, 
  Calendar, 
  Sparkles, 
  Sun, 
  Moon, 
  Save, 
  CheckCircle2 
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { VendorProfile, StoreHours } from '../types';

interface VendorStoreHoursSectionProps {
  profile: VendorProfile;
  onStatusChange?: (isOnline: boolean) => void;
  onProfileUpdated?: (updatedProfile: Partial<VendorProfile>) => void;
}

// Convert "HH:mm" to "hh:mm A" (e.g. "08:00" -> "08:00 AM")
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const padM = m < 10 ? `0${m}` : m;
  return `${displayH}:${padM} ${period}`;
}

// Calculate whether current time is within store hours
export function checkStoreHoursStatus(storeHours?: StoreHours): {
  isWithin: boolean;
  isOpenDay: boolean;
  statusText: string;
  nextEventText: string;
} {
  const defaultHours: StoreHours = {
    enabled: true,
    openTime: '08:00',
    closeTime: '22:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    ...(storeHours || {})
  };

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = (defaultHours.openTime || '08:00').split(':').map(Number);
  const [closeH, closeM] = (defaultHours.closeTime || '22:00').split(':').map(Number);

  const openMinutes = (openH || 0) * 60 + (openM || 0);
  const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

  const daysList = defaultHours.days && defaultHours.days.length > 0 
    ? defaultHours.days 
    : [0, 1, 2, 3, 4, 5, 6];

  const isOpenDay = daysList.includes(currentDay);

  let isWithin = false;
  if (isOpenDay) {
    if (closeMinutes > openMinutes) {
      // Normal schedule (e.g. 08:00 to 22:00)
      isWithin = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } else {
      // Overnight schedule (e.g. 18:00 to 02:00)
      isWithin = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
  }

  const formattedOpen = formatTime12h(defaultHours.openTime || '08:00');
  const formattedClose = formatTime12h(defaultHours.closeTime || '22:00');

  let statusText = '';
  let nextEventText = '';

  if (!defaultHours.enabled) {
    statusText = 'Automatic schedule disabled (Manual store status)';
    nextEventText = 'Store toggle is handled manually';
  } else if (!isOpenDay) {
    statusText = 'Store Closed Today (Off-day on schedule)';
    nextEventText = `Next opens on active operating days at ${formattedOpen}`;
  } else if (isWithin) {
    statusText = `Open Now (${formattedOpen} - ${formattedClose})`;
    nextEventText = `Will automatically close at ${formattedClose}`;
  } else {
    statusText = `Closed Now (${formattedOpen} - ${formattedClose})`;
    nextEventText = `Will automatically open at ${formattedOpen}`;
  }

  return {
    isWithin,
    isOpenDay,
    statusText,
    nextEventText
  };
}

export const VendorStoreHoursSection: React.FC<VendorStoreHoursSectionProps> = ({
  profile,
  onStatusChange,
  onProfileUpdated
}) => {
  const currentHours = profile.storeHours || {
    enabled: true,
    openTime: '08:00',
    closeTime: '22:00',
    days: [0, 1, 2, 3, 4, 5, 6]
  };

  const [enabled, setEnabled] = useState<boolean>(currentHours.enabled ?? true);
  const [openTime, setOpenTime] = useState<string>(currentHours.openTime || '08:00');
  const [closeTime, setCloseTime] = useState<string>(currentHours.closeTime || '22:00');
  const [days, setDays] = useState<number[]>(currentHours.days || [0, 1, 2, 3, 4, 5, 6]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [nowTick, setNowTick] = useState<Date>(new Date());

  // Update tick every 30 seconds for live clock updates
  useEffect(() => {
    const timer = setInterval(() => setNowTick(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync state if profile changes externally
  useEffect(() => {
    if (profile.storeHours) {
      setEnabled(profile.storeHours.enabled ?? true);
      setOpenTime(profile.storeHours.openTime || '08:00');
      setCloseTime(profile.storeHours.closeTime || '22:00');
      setDays(profile.storeHours.days || [0, 1, 2, 3, 4, 5, 6]);
    }
  }, [profile.storeHours]);

  const scheduleEvaluation = useMemo(() => {
    return checkStoreHoursStatus({
      enabled,
      openTime,
      closeTime,
      days
    });
  }, [enabled, openTime, closeTime, days, nowTick]);

  const toggleDay = (dayIndex: number) => {
    setDays(prev => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev; // Keep at least one active day
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  };

  const applyPreset = (preset: { name: string; open: string; close: string }) => {
    setOpenTime(preset.open);
    setCloseTime(preset.close);
    setEnabled(true);
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    try {
      const newStoreHours: StoreHours = {
        enabled,
        openTime,
        closeTime,
        days
      };

      // Determine whether store should be open right now based on saved settings
      let newIsOnline = profile.isOnline;
      if (enabled) {
        newIsOnline = scheduleEvaluation.isWithin;
      }

      await updateDoc(doc(db, 'vendors', profile.id), {
        storeHours: newStoreHours,
        isOnline: newIsOnline,
        isOpen: newIsOnline,
        updatedAt: serverTimestamp()
      });

      if (onProfileUpdated) {
        onProfileUpdated({
          storeHours: newStoreHours,
          isOnline: newIsOnline,
          isOpen: newIsOnline
        });
      }

      if (onStatusChange && newIsOnline !== profile.isOnline) {
        onStatusChange(newIsOnline);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving store hours:", err);
      alert("Failed to save store hours. Please check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const dayLabels = [
    { idx: 1, label: 'Mon' },
    { idx: 2, label: 'Tue' },
    { idx: 3, label: 'Wed' },
    { idx: 4, label: 'Thu' },
    { idx: 5, label: 'Fri' },
    { idx: 6, label: 'Sat' },
    { idx: 0, label: 'Sun' }
  ];

  return (
    <div id="vendor-store-hours-section" className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
      {/* Title & Live Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-black text-gray-900 uppercase italic">
                Store Operating Hours
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase rounded-lg border border-indigo-100">
                Auto-Toggling
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Automatically set store Online/Offline based on your daily schedule
            </p>
          </div>
        </div>

        {/* Master Auto-Toggle Switch */}
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 self-start sm:self-auto">
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 pl-2">
            Auto-Schedule
          </span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`w-12 h-7 rounded-full transition-colors relative flex items-center px-1 ${
              enabled ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Live Schedule Status Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
        enabled
          ? scheduleEvaluation.isWithin
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {enabled && scheduleEvaluation.isWithin && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              enabled
                ? scheduleEvaluation.isWithin ? 'bg-emerald-500' : 'bg-amber-500'
                : 'bg-gray-400'
            }`} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wide">
              {scheduleEvaluation.statusText}
            </p>
            <p className="text-[10px] font-bold text-gray-500 mt-0.5">
              {scheduleEvaluation.nextEventText} • Local Time: {nowTick.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`px-2.5 py-1 rounded-xl text-[8.5px] font-black uppercase tracking-wider ${
            profile.isOnline 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-rose-600 text-white shadow-sm'
          }`}>
            Current Store: {profile.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Time Pickers Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Opening Time
            </label>
            <span className="text-xs font-black text-indigo-600">
              {formatTime12h(openTime)}
            </span>
          </div>
          <input
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-indigo-500 outline-none shadow-2xs"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              Closing Time
            </label>
            <span className="text-xs font-black text-indigo-600">
              {formatTime12h(closeTime)}
            </span>
          </div>
          <input
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-indigo-500 outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Operating Days Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            Active Operating Days
          </label>
          <span className="text-[10px] font-bold text-gray-400">
            {days.length === 7 ? 'All 7 Days' : `${days.length} days active`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {dayLabels.map(day => {
            const isSelected = days.includes(day.idx);
            return (
              <button
                key={day.idx}
                type="button"
                onClick={() => toggleDay(day.idx)}
                className={`flex-1 min-w-[44px] py-2.5 rounded-xl text-xs font-black uppercase transition-all active:scale-95 text-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Schedule Presets */}
      <div className="pt-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">
          Quick Schedule Templates
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Standard Retail', open: '09:00', close: '21:00' },
            { name: 'All-Day Kitchen', open: '07:00', close: '23:00' },
            { name: 'Morning Bandi', open: '06:00', close: '14:00' },
            { name: 'Evening / Dinner', open: '16:00', close: '23:30' }
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-800 rounded-xl text-[10px] font-bold border border-gray-200 hover:border-indigo-200 active:scale-95 transition"
            >
              ⚡ {preset.name} ({formatTime12h(preset.open)} - {formatTime12h(preset.close)})
            </button>
          ))}
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[10px] text-gray-400 font-medium">
          When Auto-Schedule is enabled, the store will switch to Online at {formatTime12h(openTime)} and turn Offline at {formatTime12h(closeTime)}.
        </p>

        <button
          type="button"
          onClick={handleSaveHours}
          disabled={isSaving}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
            saveSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-100'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
          }`}
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Hours Saved & Synced!
            </>
          ) : isSaving ? (
            'Saving Schedule...'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Store Hours
            </>
          )}
        </button>
      </div>
    </div>
  );
};
