import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Sparkles, ChevronRight, Layers, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Category, LanguageCode } from '../types';
import { getCategory3DAsset } from '../utils/category3DAssets';
import { getLocalizedCategoryName } from '../utils/localizedContent';
import { getServiceOperationalRadiusKm, validateServiceGeofence } from '../lib/geofencing';

interface AllCategoriesExplorerProps {
  categories: Category[];
  language: LanguageCode;
  onBack: () => void;
  onCategoryClick: (cat: Category) => void;
  currentBranch?: any;
  userCoords?: { lat: number; lng: number } | null;
  coverageZones?: any[];
}

type CategoryGroup = 'all' | 'essentials' | 'food' | 'services' | 'health' | 'commercial';

export default function AllCategoriesExplorer({
  categories,
  language,
  onBack,
  onCategoryClick,
  currentBranch,
  userCoords,
  coverageZones = [],
}: AllCategoriesExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroup>('all');
  const [pausedNoticeCat, setPausedNoticeCat] = useState<(Category & { reason?: string; isOutOfRadius?: boolean }) | null>(null);

  const isServiceDisabledInBranch = (catId: string) => {
    if (!currentBranch) return false;
    const disabledList = Array.isArray(currentBranch.disabledServices) ? currentBranch.disabledServices : [];
    if (disabledList.includes(catId)) return true;
    if (currentBranch.serviceControls && currentBranch.serviceControls[catId] === false) return true;
    if (currentBranch.categoryConfigs?.[catId]?.online === false) return true;
    return false;
  };

  const groupMap: Record<CategoryGroup, string[]> = {
    all: [],
    essentials: ['meat', 'dairy', 'water', 'groceries', 'household', 'bakery', 'sweets'],
    food: ['food', 'catering', 'bakery', 'sweets', 'groceries', 'dairy'],
    services: ['maids', 'mechanics', 'construction', 'services', 'auto_garage', 'beauty_parlour', 'events', 'religious', 'driving_school'],
    health: ['pharmacy', 'hospital_op', 'care', 'emergency', 'pets'],
    commercial: ['realestate', 'marriage', 'jobs', 'chitfund', 'education', 'handicrafts', 'travel', 'sports', 'footwear', 'books', 'gifts', 'electronics', 'fancy', 'agriculture']
  };

  const filteredCategories = useMemo(() => {
    const hiddenList = Array.isArray(currentBranch?.hiddenCategories) ? currentBranch.hiddenCategories : [];
    const configs = currentBranch?.categoryConfigs || {};

    let list = categories
      .filter((c) => {
        if (!c || c.deleted) return false;
        if (hiddenList.includes(c.id)) return false;
        if (configs[c.id]?.visible === false) return false;
        return true;
      })
      .map((c) => {
        const cfg = configs[c.id];
        if (!cfg) return c;
        return {
          ...c,
          name: cfg.name || c.name,
          image: cfg.image || c.image,
          icon: cfg.icon || c.icon,
          order: cfg.order ?? c.order,
        };
      })
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    if (selectedGroup !== 'all') {
      const allowedIds = groupMap[selectedGroup] || [];
      list = list.filter(c => allowedIds.includes(c.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const localized = (getLocalizedCategoryName(c.id, language) || '').toLowerCase();
        return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || localized.includes(q);
      });
    }
    return list;
  }, [categories, selectedGroup, searchQuery, language, currentBranch]);

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col overflow-hidden">
      {/* 3D Visual Header */}
      <header className="px-5 pt-11 pb-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button 
            type="button"
            onClick={onBack} 
            className="p-2 hover:bg-slate-100 rounded-2xl transition-colors active:scale-95 text-slate-800"
            title="Go back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>All Services & Categories</span>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                {filteredCategories.length}
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {currentBranch?.name || 'Khammam Direct'} • Live Regional Services
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-xs">
            <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
        </div>

        {/* Real-time Category Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all services, groceries, repairs..."
            className="w-full bg-slate-100/90 py-2.5 pl-10 pr-9 rounded-2xl font-bold text-xs text-slate-900 outline-none border border-transparent focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 -mx-2 px-2">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'essentials', label: 'Daily Essentials' },
            { id: 'food', label: 'Food & Meals' },
            { id: 'health', label: 'Health & OP' },
            { id: 'services', label: 'Home & Repairs' },
            { id: 'commercial', label: 'Special Services' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedGroup(tab.id as CategoryGroup)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                selectedGroup === tab.id
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 3D Visual Cards Grid Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pb-24">
            {filteredCategories.map((cat, idx) => {
              const asset3D = getCategory3DAsset(cat.id);
              const catImage = (cat.image && cat.image.length > 25 && !cat.image.includes('placeholder')) ? cat.image : asset3D.image;
              const isPaused = isServiceDisabledInBranch(cat.id);
              const serviceGeo = userCoords
                ? validateServiceGeofence({
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    branch: currentBranch,
                    coverageZones,
                    serviceId: cat.id,
                  })
                : null;
              const isOutOfRadius = Boolean(serviceGeo && serviceGeo.serviceOnline && !serviceGeo.eligible);
              const serviceRadiusKm = getServiceOperationalRadiusKm(currentBranch, cat.id);

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
                  whileHover={{ y: isPaused || isOutOfRadius ? 0 : -4, scale: isPaused || isOutOfRadius ? 1 : 1.03 }}
                  whileTap={{ scale: 0.94, y: 1 }}
                  onClick={() => {
                    if (isPaused) {
                      setPausedNoticeCat({ ...cat, isOutOfRadius: false });
                      return;
                    }
                    if (isOutOfRadius && serviceGeo) {
                      setPausedNoticeCat({ ...cat, isOutOfRadius: true, reason: serviceGeo.reason });
                      return;
                    }
                    onCategoryClick(cat);
                  }}
                  className={`clay-card-3d p-3 border border-slate-100 hover:border-indigo-300 shadow-[0_8px_18px_-4px_rgba(0,0,0,0.12)] flex flex-col items-center justify-between text-center cursor-pointer group active:scale-95 relative ${isPaused || isOutOfRadius ? 'opacity-70' : ''}`}
                >
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl p-1 flex items-center justify-center mb-2">
                    <div className={`w-full h-full rounded-2xl p-1.5 flex items-center justify-center relative tile-3d-depth ${asset3D.shadow || 'shadow-slate-400/30'} bg-gradient-to-b from-white to-slate-100/90 border border-white ${isPaused || isOutOfRadius ? 'grayscale-[0.5]' : ''}`}>
                      <img 
                        src={catImage} 
                        alt={cat.name} 
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)] transition-transform duration-200 group-hover:scale-110" 
                        loading="lazy"
                      />
                      <div className="absolute inset-x-1.5 top-1 h-2.5 rounded-t-xl bg-gradient-to-b from-white/90 to-transparent pointer-events-none" />
                    </div>

                    {isPaused ? (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[7.5px] font-black uppercase tracking-wider shadow-md">
                        Offline
                      </span>
                    ) : isOutOfRadius ? (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[7px] font-black uppercase tracking-wider shadow-md">
                        &gt;{serviceRadiusKm}km
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight">
                    {currentBranch?.categoryConfigs?.[cat.id]?.name || getLocalizedCategoryName(cat.id, language) || cat.name}
                  </h3>
                  
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1">
                    {isPaused ? 'Paused in Region' : `${serviceRadiusKm} km radius`}
                  </span>

                  <div className={`mt-2 w-full pt-1.5 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider ${isPaused || isOutOfRadius ? 'text-rose-500' : 'text-indigo-600 group-hover:text-indigo-800'}`}>
                    <span>{isPaused ? 'Offline' : isOutOfRadius ? 'Out of Zone' : 'Explore'}</span>
                    {!isPaused && !isOutOfRadius && <ChevronRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
              <Layers className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-black text-slate-700 mb-1">No Services Found</h4>
            <p className="text-xs font-bold text-slate-400 max-w-xs leading-relaxed">
              No matching categories found for "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGroup('all');
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Paused / Out-of-Boundary Modal */}
      {pausedNoticeCat && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="max-w-sm w-full bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-rose-100">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-2xl">
              {pausedNoticeCat.isOutOfRadius ? '📍' : '⏸️'}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider">
                {pausedNoticeCat.isOutOfRadius ? 'Outside Operational Radius' : 'Service Offline in Region'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">{pausedNoticeCat.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {pausedNoticeCat.reason || `${pausedNoticeCat.name} is temporarily offline in ${currentBranch?.name || 'your region'}.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPausedNoticeCat(null)}
              className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
