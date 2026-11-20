import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Eye, EyeOff, Power, MapPin, Navigation, Save,
  Sliders, RotateCcw, CheckCircle2, AlertTriangle, Globe, Layers, Trash2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Branch, BranchCategoryConfig, Category } from '../types';
import { CATEGORIES } from '../constants';
import { getBranchCoordinates, CITY_COORDINATES } from '../lib/geofencing';
import { getCategory3DAsset } from '../utils/category3DAssets';

interface RegionalCategoryManagerProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranchId?: (branchId: string) => void;
  allowBranchSwitch?: boolean;
  categories?: Category[];
  isSuperAdmin?: boolean;
  onBranchUpdated?: (branchId: string, patch: Partial<Branch>) => void;
  onToast?: (msg: string) => void;
}

export default function RegionalCategoryManager({
  branches,
  selectedBranchId,
  onSelectBranchId,
  allowBranchSwitch = false,
  categories: propCategories,
  isSuperAdmin = false,
  onBranchUpdated,
  onToast,
}: RegionalCategoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'offline' | 'hidden'>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingCoords, setEditingCoords] = useState<{ lat: string; lng: string; radius: string }>({
    lat: '',
    lng: '',
    radius: '5',
  });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatForm, setEditCatForm] = useState<{ name: string; order: string; radiusKm: string; image: string }>({
    name: '',
    order: '',
    radiusKm: '',
    image: '',
  });

  const activeBranch: Branch = useMemo(() => {
    const found = branches.find((b) => b.id === selectedBranchId) || branches[0];
    if (found) return found;
    return {
      id: selectedBranchId || 'khammam_main',
      name: 'Khammam Main Branch',
      location: 'Khammam Center',
      city: 'Khammam',
      status: 'Active',
      adminId: 'master_admin',
      adminName: 'Tharun Bandi',
      joinDate: '',
      agreementExpiry: '',
      profitShare: 10,
      contactPhone: '8790729816',
      vendorsCount: 0,
      ordersCount: 0,
      revenue: 0,
      deliveryRadius: 5,
      serviceControls: {},
      disabledServices: [],
      serviceRadii: {},
      hiddenCategories: [],
      categoryConfigs: {},
    };
  }, [branches, selectedBranchId]);

  useEffect(() => {
    const coords = getBranchCoordinates(activeBranch);
    setEditingCoords({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius: String(activeBranch.deliveryRadius || 5),
    });
  }, [activeBranch.id, activeBranch.lat, activeBranch.lng, activeBranch.coordinates?.lat, activeBranch.coordinates?.lng, activeBranch.deliveryRadius]);

  const mergedCategories = useMemo(() => {
    const map = new Map<string, Category>();
    CATEGORIES.forEach((c) => map.set(c.id, c));
    if (propCategories && propCategories.length > 0) {
      propCategories.forEach((c) => {
        if (c && c.id && c.deleted !== true) {
          const prev = map.get(c.id);
          map.set(c.id, { ...(prev || {}), ...c });
        }
      });
    }
    const configs = activeBranch.categoryConfigs || {};
    return Array.from(map.values()).sort((a, b) => {
      const orderA = configs[a.id]?.order ?? a.order ?? 999;
      const orderB = configs[b.id]?.order ?? b.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [propCategories, activeBranch.categoryConfigs]);

  const notify = (msg: string) => {
    if (onToast) onToast(msg);
  };

  const persistBranchPatch = async (patch: Partial<Branch>, toastMsg?: string) => {
    const branchId = activeBranch.id;
    onBranchUpdated?.(branchId, patch);

    try {
      await setDoc(
        doc(db, 'branches', branchId),
        {
          id: branchId,
          ...patch,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Keep branch_service_controls mirrored in real time
      await setDoc(
        doc(db, 'branch_service_controls', branchId),
        {
          branchId,
          serviceControls: patch.serviceControls ?? activeBranch.serviceControls ?? {},
          disabledServices: patch.disabledServices ?? activeBranch.disabledServices ?? [],
          serviceRadii: patch.serviceRadii ?? activeBranch.serviceRadii ?? {},
          hiddenCategories: patch.hiddenCategories ?? activeBranch.hiddenCategories ?? [],
          categoryConfigs: patch.categoryConfigs ?? activeBranch.categoryConfigs ?? {},
          deliveryRadius: patch.deliveryRadius ?? activeBranch.deliveryRadius ?? 5,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});

      // Notify same-tab & cross-app BroadcastChannel listeners immediately
      window.dispatchEvent(
        new CustomEvent('branch_inventory_updated', {
          detail: {
            branchId,
            categories: patch.categoryConfigs ?? activeBranch.categoryConfigs ?? {},
          },
        })
      );
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('localbandi_realtime_sync');
          bc.postMessage({
            type: 'BRANCH_CONTROL_UPDATED',
            branchId,
            updatedAt: Date.now(),
          });
          bc.close();
        } catch {}
      }

      if (toastMsg) notify(toastMsg);
    } catch (err: any) {
      console.error('Failed to persist regional category config:', err);
      notify(`❌ Save failed: ${err?.message || 'Permission or network error'}`);
    }
  };

  const getCatStatus = (catId: string) => {
    const cfg = activeBranch.categoryConfigs?.[catId] || {};
    const disabledList = Array.isArray(activeBranch.disabledServices) ? activeBranch.disabledServices : [];
    const controls = activeBranch.serviceControls || {};
    const hiddenList = Array.isArray(activeBranch.hiddenCategories) ? activeBranch.hiddenCategories : [];

    const isOnline = cfg.online !== false && !disabledList.includes(catId) && controls[catId] !== false;
    const isVisible = cfg.visible !== false && !hiddenList.includes(catId);
    const radiusKm = cfg.radiusKm ?? activeBranch.serviceRadii?.[catId] ?? activeBranch.deliveryRadius ?? 5;
    const displayName = cfg.name || mergedCategories.find((c) => c.id === catId)?.name || catId;
    const order = cfg.order;

    return { isOnline, isVisible, radiusKm, displayName, order, cfg };
  };

  const toggleOnline = async (catId: string) => {
    setSavingId(catId);
    const { isOnline, cfg } = getCatStatus(catId);
    const nextOnline = !isOnline;

    const updatedControls = { ...(activeBranch.serviceControls || {}), [catId]: nextOnline };
    let updatedDisabled = Array.isArray(activeBranch.disabledServices) ? [...activeBranch.disabledServices] : [];
    if (nextOnline) {
      updatedDisabled = updatedDisabled.filter((s) => s !== catId);
    } else if (!updatedDisabled.includes(catId)) {
      updatedDisabled.push(catId);
    }

    const updatedConfigs: Record<string, BranchCategoryConfig> = {
      ...(activeBranch.categoryConfigs || {}),
      [catId]: { ...cfg, online: nextOnline },
    };

    await persistBranchPatch(
      {
        serviceControls: updatedControls,
        disabledServices: updatedDisabled,
        categoryConfigs: updatedConfigs,
      },
      `⚡ [${activeBranch.name}] "${catId}" is now ${nextOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`
    );
    setSavingId(null);
  };

  const toggleVisibility = async (catId: string) => {
    setSavingId(catId);
    const { isVisible, cfg } = getCatStatus(catId);
    const nextVisible = !isVisible;

    let updatedHidden = Array.isArray(activeBranch.hiddenCategories) ? [...activeBranch.hiddenCategories] : [];
    if (nextVisible) {
      updatedHidden = updatedHidden.filter((s) => s !== catId);
    } else if (!updatedHidden.includes(catId)) {
      updatedHidden.push(catId);
    }

    const updatedConfigs: Record<string, BranchCategoryConfig> = {
      ...(activeBranch.categoryConfigs || {}),
      [catId]: { ...cfg, visible: nextVisible },
    };

    await persistBranchPatch(
      {
        hiddenCategories: updatedHidden,
        categoryConfigs: updatedConfigs,
      },
      `👁️ [${activeBranch.name}] "${catId}" is now ${nextVisible ? 'VISIBLE in region' : 'HIDDEN in region'}`
    );
    setSavingId(null);
  };

  const updateServiceRadius = async (catId: string, radiusKm: number) => {
    const cleanKm = Math.max(1, Math.min(100, Number(radiusKm) || 5));
    setSavingId(catId);
    const { cfg } = getCatStatus(catId);

    const updatedRadii = { ...(activeBranch.serviceRadii || {}), [catId]: cleanKm };
    const updatedConfigs: Record<string, BranchCategoryConfig> = {
      ...(activeBranch.categoryConfigs || {}),
      [catId]: { ...cfg, radiusKm: cleanKm },
    };

    await persistBranchPatch(
      {
        serviceRadii: updatedRadii,
        categoryConfigs: updatedConfigs,
      },
      `📍 [${activeBranch.name}] "${catId}" geofence radius set to ${cleanKm} km`
    );
    setSavingId(null);
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    setSavingId(catId);
    const currentHidden = Array.isArray(activeBranch.hiddenCategories) ? activeBranch.hiddenCategories : [];
    const currentDisabled = Array.isArray(activeBranch.disabledServices) ? activeBranch.disabledServices : [];
    const nextHidden = Array.from(new Set([...currentHidden, catId]));
    const nextDisabled = Array.from(new Set([...currentDisabled, catId]));
    const { cfg } = getCatStatus(catId);

    const updatedConfigs: Record<string, BranchCategoryConfig> = {
      ...(activeBranch.categoryConfigs || {}),
      [catId]: {
        ...cfg,
        visible: false,
        online: false,
      },
    };

    await persistBranchPatch(
      {
        hiddenCategories: nextHidden,
        disabledServices: nextDisabled,
        categoryConfigs: updatedConfigs,
      },
      `🗑️ [${activeBranch.name}] "${catName}" removed & taken offline for this branch (synced live to Customer App)`
    );
    setSavingId(null);
  };

  const handleSaveBranchGeo = async () => {
    const lat = parseFloat(editingCoords.lat);
    const lng = parseFloat(editingCoords.lng);
    const radius = Math.max(1, Math.min(100, parseFloat(editingCoords.radius) || 5));

    if (isNaN(lat) || isNaN(lng)) {
      notify('❌ Please enter valid numeric latitude & longitude.');
      return;
    }

    setSavingId('geo_center');
    await persistBranchPatch(
      {
        lat,
        lng,
        coordinates: { lat, lng },
        deliveryRadius: radius,
        deliveryRadiusStatus: 'approved',
        pendingDeliveryRadius: null,
      },
      `📍 [${activeBranch.name}] Geo-center (${lat.toFixed(4)}, ${lng.toFixed(4)}) & default ${radius} km radius saved!`
    );
    setSavingId(null);
  };

  const handleDetectGpsForBranch = () => {
    if (!navigator.geolocation) {
      notify('❌ Browser GPS not available.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEditingCoords((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        notify('📡 Captured current GPS coordinates into branch center fields. Click "Save Geo-Center" to apply.');
      },
      () => notify('❌ Unable to read GPS location.'),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSaveCategoryCustomization = async (catId: string) => {
    setSavingId(catId);
    const { cfg } = getCatStatus(catId);
    const cleanRadius = Math.max(1, Math.min(100, Number(editCatForm.radiusKm) || 5));
    const cleanOrder = editCatForm.order.trim() !== '' ? Number(editCatForm.order) : undefined;

    const nextCfg: BranchCategoryConfig = {
      ...cfg,
      name: editCatForm.name.trim() || undefined,
      image: editCatForm.image.trim() || undefined,
      radiusKm: cleanRadius,
      ...(cleanOrder !== undefined && !isNaN(cleanOrder) ? { order: cleanOrder } : {}),
    };

    await persistBranchPatch(
      {
        serviceRadii: { ...(activeBranch.serviceRadii || {}), [catId]: cleanRadius },
        categoryConfigs: { ...(activeBranch.categoryConfigs || {}), [catId]: nextCfg },
      },
      `✅ Updated regional settings for "${nextCfg.name || catId}"`
    );
    setEditingCatId(null);
    setSavingId(null);
  };

  const handleBulkAction = async (mode: 'enable_all' | 'pause_all' | 'show_all' | 'radius_5') => {
    setSavingId('bulk');
    if (mode === 'enable_all' || mode === 'pause_all') {
      const online = mode === 'enable_all';
      const updatedControls: Record<string, boolean> = {};
      const updatedConfigs: Record<string, BranchCategoryConfig> = { ...(activeBranch.categoryConfigs || {}) };
      const updatedDisabled: string[] = [];

      mergedCategories.forEach((c) => {
        updatedControls[c.id] = online;
        updatedConfigs[c.id] = { ...(updatedConfigs[c.id] || {}), online };
        if (!online) updatedDisabled.push(c.id);
      });

      await persistBranchPatch(
        {
          serviceControls: updatedControls,
          disabledServices: updatedDisabled,
          categoryConfigs: updatedConfigs,
        },
        `⚡ [${activeBranch.name}] All ${mergedCategories.length} services set ${online ? 'ONLINE' : 'OFFLINE'}`
      );
    } else if (mode === 'show_all') {
      const updatedConfigs: Record<string, BranchCategoryConfig> = { ...(activeBranch.categoryConfigs || {}) };
      mergedCategories.forEach((c) => {
        updatedConfigs[c.id] = { ...(updatedConfigs[c.id] || {}), visible: true };
      });
      await persistBranchPatch(
        {
          hiddenCategories: [],
          categoryConfigs: updatedConfigs,
        },
        `👁️ [${activeBranch.name}] All categories set VISIBLE in region`
      );
    } else if (mode === 'radius_5') {
      const defaultKm = activeBranch.deliveryRadius || 5;
      const updatedRadii: Record<string, number> = {};
      const updatedConfigs: Record<string, BranchCategoryConfig> = { ...(activeBranch.categoryConfigs || {}) };
      mergedCategories.forEach((c) => {
        updatedRadii[c.id] = defaultKm;
        updatedConfigs[c.id] = { ...(updatedConfigs[c.id] || {}), radiusKm: defaultKm };
      });
      await persistBranchPatch(
        {
          serviceRadii: updatedRadii,
          categoryConfigs: updatedConfigs,
        },
        `📍 [${activeBranch.name}] Standardized all service radii to ${defaultKm} km`
      );
    }
    setSavingId(null);
  };

  const filteredList = useMemo(() => {
    return mergedCategories.filter((cat) => {
      const { isOnline, isVisible, displayName } = getCatStatus(cat.id);
      if (filterMode === 'online' && !isOnline) return false;
      if (filterMode === 'offline' && isOnline) return false;
      if (filterMode === 'hidden' && isVisible) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          cat.name.toLowerCase().includes(q) ||
          displayName.toLowerCase().includes(q) ||
          cat.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mergedCategories, filterMode, searchTerm, activeBranch]);

  const stats = useMemo(() => {
    let onlineCount = 0;
    let visibleCount = 0;
    mergedCategories.forEach((c) => {
      const st = getCatStatus(c.id);
      if (st.isOnline) onlineCount++;
      if (st.isVisible) visibleCount++;
    });
    return { total: mergedCategories.length, onlineCount, visibleCount };
  }, [mergedCategories, activeBranch]);

  return (
    <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-5 sm:p-6 space-y-5 text-white">
      {/* Header & Branch Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-amber-400">
              Regional Category, Visibility & Per-Service Radius Control
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Configure visible service icons, online/offline toggles & geofence radii per service for {activeBranch.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allowBranchSwitch && branches.length > 0 && (
            <select
              value={activeBranch.id}
              onChange={(e) => onSelectBranchId?.(e.target.value)}
              className="bg-slate-950 border border-amber-500/40 text-amber-300 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.id} ({b.city || 'Region'})
                </option>
              ))}
            </select>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-black text-emerald-300 uppercase">
            {stats.onlineCount}/{stats.total} Online • {stats.visibleCount} Visible
          </div>
        </div>
      </div>

      {/* Branch Geo-Fence Center & Default Radius */}
      <div className="bg-slate-950/70 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              Branch Hub Coordinates & Default Radius
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {['khammam', 'wyra', 'kothagudem', 'hyderabad', 'warangal'].map((cityKey) => (
              <button
                key={cityKey}
                type="button"
                onClick={() => {
                  const [clat, clng] = CITY_COORDINATES[cityKey];
                  setEditingCoords((prev) => ({ ...prev, lat: String(clat), lng: String(clng) }));
                }}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {cityKey}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDetectGpsForBranch}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              Use GPS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Branch Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={editingCoords.lat}
              onChange={(e) => setEditingCoords((p) => ({ ...p, lat: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Branch Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={editingCoords.lng}
              onChange={(e) => setEditingCoords((p) => ({ ...p, lng: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Default Radius (KM)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={editingCoords.radius}
              onChange={(e) => setEditingCoords((p) => ({ ...p, radius: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveBranchGeo}
            disabled={savingId === 'geo_center'}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {savingId === 'geo_center' ? 'Saving...' : 'Save Geo-Center'}
          </button>
        </div>
      </div>

      {/* Search, Filters & Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service or category (e.g. food, groceries, hospital)..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-500 focus:border-amber-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'online', label: 'Online' },
            { id: 'offline', label: 'Offline' },
            { id: 'hidden', label: 'Hidden Icons' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                filterMode === tab.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-950 text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleBulkAction('enable_all')}
            disabled={savingId === 'bulk'}
            className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase cursor-pointer"
          >
            All Online
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('show_all')}
            disabled={savingId === 'bulk'}
            className="px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 rounded-xl text-[9px] font-black uppercase cursor-pointer"
          >
            Show All Icons
          </button>
          <button
            type="button"
            onClick={() => handleBulkAction('radius_5')}
            disabled={savingId === 'bulk'}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-[9px] font-black uppercase cursor-pointer"
          >
            Sync Radius ({activeBranch.deliveryRadius || 5}km)
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleBulkAction('pause_all')}
              disabled={savingId === 'bulk'}
              className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase cursor-pointer"
            >
              Pause All
            </button>
          )}
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1">
        {filteredList.map((cat) => {
          const { isOnline, isVisible, radiusKm, displayName, order, cfg } = getCatStatus(cat.id);
          const asset3D = getCategory3DAsset(cat.id);
          const iconImg = cfg.image || cat.image || asset3D.image;
          const isEditing = editingCatId === cat.id;

          return (
            <div
              key={cat.id}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                !isVisible
                  ? 'bg-slate-950/40 border-slate-700/60 opacity-70'
                  : isOnline
                  ? 'bg-slate-950/90 border-emerald-500/25'
                  : 'bg-slate-950/60 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center shrink-0">
                    <img src={iconImg} alt={displayName} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-white truncate">{displayName}</h4>
                      {order !== undefined && (
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          #{order}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-slate-400 truncate">
                      id: {cat.id} • Radius: <span className="text-amber-300 font-bold">{radiusKm} km</span>
                    </p>
                  </div>
                </div>

                {/* Visibility & Online Quick Toggles */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(cat.id)}
                    disabled={savingId === cat.id}
                    title={isVisible ? 'Visible on Customer App (click to hide)' : 'Hidden in Region (click to show)'}
                    className={`p-1.5 rounded-lg border text-[9px] font-black cursor-pointer transition-all ${
                      isVisible
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800 border-slate-600 text-slate-400'
                    }`}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleOnline(cat.id)}
                    disabled={savingId === cat.id}
                    className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                      isOnline
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-rose-900/70 text-rose-200 border border-rose-500/50'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, displayName)}
                    disabled={savingId === cat.id}
                    title={`Delete / Remove "${displayName}" from ${activeBranch.name}`}
                    className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Per-Service Operational Radius Presets + Customize Button */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[8.5px] font-black uppercase text-slate-500 mr-1">Radius:</span>
                  {[3, 5, 10, 15, 25].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => updateServiceRadius(cat.id, km)}
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold cursor-pointer transition-colors ${
                        radiusKm === km
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {km}km
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      setEditingCatId(null);
                    } else {
                      setEditingCatId(cat.id);
                      setEditCatForm({
                        name: cfg.name || cat.name || '',
                        order: cfg.order !== undefined ? String(cfg.order) : '',
                        radiusKm: String(radiusKm),
                        image: cfg.image || '',
                      });
                    }
                  }}
                  className="text-[9px] font-black uppercase text-amber-400 hover:text-amber-300 cursor-pointer shrink-0"
                >
                  {isEditing ? 'Close' : 'Edit'}
                </button>
              </div>

              {/* Inline Customization Editor */}
              {isEditing && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[8px] font-black uppercase text-slate-400">Regional Label</label>
                      <input
                        value={editCatForm.name}
                        onChange={(e) => setEditCatForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-400">Order #</label>
                      <input
                        type="number"
                        value={editCatForm.order}
                        onChange={(e) => setEditCatForm((p) => ({ ...p, order: e.target.value }))}
                        placeholder="e.g. 1"
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-400">Custom Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editCatForm.radiusKm}
                        onChange={(e) => setEditCatForm((p) => ({ ...p, radiusKm: e.target.value }))}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[8px] font-black uppercase text-slate-400">Custom Icon URL (Optional)</label>
                      <input
                        value={editCatForm.image}
                        onChange={(e) => setEditCatForm((p) => ({ ...p, image: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveCategoryCustomization(cat.id)}
                    className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Save Regional Settings
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
