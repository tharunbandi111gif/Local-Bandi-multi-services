import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Search, CheckCircle2, XCircle, Power, 
  Layers, Package, SlidersHorizontal, RefreshCw, 
  CheckSquare, Square, Sparkles, Filter, Store, 
  AlertCircle, ChevronRight, ShieldCheck, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Branch, Category, Product } from '../types';
import { CATEGORIES, PRODUCTS } from '../constants';
import { getCategory3DAsset } from '../utils/category3DAssets';

interface FranchiseInventoryManagerProps {
  branches: Branch[];
  currentBranchId?: string;
  isSuperAdmin?: boolean;
}

export const FranchiseInventoryManager: React.FC<FranchiseInventoryManagerProps> = ({
  branches,
  currentBranchId = 'all',
  isSuperAdmin = false
}) => {
  // Selected franchise branch (default to passed currentBranchId or first branch)
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return currentBranchId || (branches.length > 0 ? branches[0].id : 'all');
  });

  const [activeSection, setActiveSection] = useState<'categories' | 'products'>('categories');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Category & Product visibility maps: true = online, false = offline
  const [categoryStatus, setCategoryStatus] = useState<Record<string, boolean>>({});
  const [productStatus, setProductStatus] = useState<Record<string, boolean>>({});

  const activeBranch = branches.find(b => b.id === selectedBranchId) || (selectedBranchId === 'all' ? { id: 'all', name: 'Global (All Franchise Locations)', city: 'All Areas' } : null);

  // Storage key for local offline resilience
  const storageKey = `lokal_branch_inventory_${selectedBranchId}`;

  // Load and listen to Firestore branch inventory controls
  useEffect(() => {
    // Initialize default states (all online by default)
    const initialCats: Record<string, boolean> = {};
    CATEGORIES.forEach(c => { initialCats[c.id] = true; });

    const initialProds: Record<string, boolean> = {};
    PRODUCTS.forEach(p => { initialProds[p.id] = true; });

    // Load from local storage first
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.categories) setCategoryStatus({ ...initialCats, ...parsed.categories });
        else setCategoryStatus(initialCats);

        if (parsed.products) setProductStatus({ ...initialProds, ...parsed.products });
        else setProductStatus(initialProds);
      } else {
        setCategoryStatus(initialCats);
        setProductStatus(initialProds);
      }
    } catch (e) {
      setCategoryStatus(initialCats);
      setProductStatus(initialProds);
    }

    // Subscribe to Firestore branch inventory doc
    const docRef = doc(db, 'branch_catalog_visibility', selectedBranchId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.categories) {
          setCategoryStatus(prev => ({ ...initialCats, ...data.categories }));
        }
        if (data.products) {
          setProductStatus(prev => ({ ...initialProds, ...data.products }));
        }
        // Sync local storage
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            categories: data.categories || {},
            products: data.products || {}
          }));
        } catch (e) {}
      }
    }, (err) => {
      console.warn("Firestore branch catalog visibility offline fallback:", err);
    });

    return () => unsubscribe();
  }, [selectedBranchId]);

  // Persist status updates to Firestore and LocalStorage
  const persistChanges = async (newCats: Record<string, boolean>, newProds: Record<string, boolean>) => {
    setSavingStatus('Syncing changes...');
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        categories: newCats,
        products: newProds
      }));

      // Broadcast event so active customer tabs immediately update
      window.dispatchEvent(new CustomEvent('branch_inventory_updated', {
        detail: { branchId: selectedBranchId, categories: newCats, products: newProds }
      }));

      await setDoc(doc(db, 'branch_catalog_visibility', selectedBranchId), {
        branchId: selectedBranchId,
        branchName: activeBranch?.name || selectedBranchId,
        categories: newCats,
        products: newProds,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSavingStatus('Saved & Synced Live!');
      setTimeout(() => setSavingStatus(null), 2500);
    } catch (err) {
      console.warn("Error saving branch catalog visibility:", err);
      setSavingStatus('Saved locally (Offline Mode)');
      setTimeout(() => setSavingStatus(null), 2500);
    }
  };

  // Toggle single category online/offline
  const toggleCategory = (categoryId: string) => {
    const current = categoryStatus[categoryId] !== false; // default true
    const nextVal = !current;
    const updatedCats = { ...categoryStatus, [categoryId]: nextVal };
    setCategoryStatus(updatedCats);
    persistChanges(updatedCats, productStatus);
  };

  // Toggle single product online/offline
  const toggleProduct = (productId: string) => {
    const current = productStatus[productId] !== false; // default true
    const nextVal = !current;
    const updatedProds = { ...productStatus, [productId]: nextVal };
    setProductStatus(updatedProds);
    persistChanges(categoryStatus, updatedProds);
  };

  // Bulk actions for Categories: Select All / Deselect All
  const handleBulkCategories = (status: boolean) => {
    const updated: Record<string, boolean> = {};
    CATEGORIES.forEach(c => {
      updated[c.id] = status;
    });
    setCategoryStatus(updated);
    persistChanges(updated, productStatus);
  };

  // Bulk actions for Products: Select All / Deselect All (scoped to current category filter if not 'all')
  const handleBulkProducts = (status: boolean) => {
    const updated: Record<string, boolean> = { ...productStatus };
    const targetProducts = categoryFilter === 'all' 
      ? PRODUCTS 
      : PRODUCTS.filter(p => p.category === categoryFilter);

    targetProducts.forEach(p => {
      updated[p.id] = status;
    });

    setProductStatus(updated);
    persistChanges(categoryStatus, updated);
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let prods = PRODUCTS;
    if (categoryFilter !== 'all') {
      prods = prods.filter(p => p.category === categoryFilter);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      prods = prods.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }
    return prods;
  }, [categoryFilter, searchQuery]);

  // Summary counts
  const totalCatsCount = CATEGORIES.length;
  const onlineCatsCount = CATEGORIES.filter(c => categoryStatus[c.id] !== false).length;
  const offlineCatsCount = totalCatsCount - onlineCatsCount;

  const totalProdsCount = PRODUCTS.length;
  const onlineProdsCount = PRODUCTS.filter(p => productStatus[p.id] !== false).length;
  const offlineProdsCount = totalProdsCount - onlineProdsCount;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Branch Selector */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-1">
                <Store className="w-3 h-3" />
                Franchise Branch Inventory Management
              </span>
              {savingStatus && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest animate-pulse border border-emerald-200">
                  {savingStatus}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Catalogue Online / Offline Controls
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Customize product and category visibility for your franchise location. Turn services online or offline instantly, bulk toggle with 'Select All' / 'Deselect All', and reflect live changes to customer screens.
            </p>
          </div>

          {/* Franchise Location Picker */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1 min-w-[260px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              Target Franchise Location
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">🌐 All Franchise Locations (Global Default)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.city || 'Regional Area'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Live Categories</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-900">{onlineCatsCount}</span>
              <span className="text-xs font-bold text-slate-400">/ {totalCatsCount}</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">
              {onlineCatsCount === totalCatsCount ? '100% Online' : `${offlineCatsCount} Offline`}
            </span>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/60">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Live Products</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-900">{onlineProdsCount}</span>
              <span className="text-xs font-bold text-slate-400">/ {totalProdsCount}</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-2 inline-block">
              {onlineProdsCount === totalProdsCount ? 'All Products Online' : `${offlineProdsCount} Offline`}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Offline Categories</p>
            <p className="text-2xl font-black text-slate-700 mt-1">{offlineCatsCount}</p>
            <span className="text-[9px] text-slate-500 font-bold block mt-2">Hidden in this branch</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Offline Products</p>
            <p className="text-2xl font-black text-slate-700 mt-1">{offlineProdsCount}</p>
            <span className="text-[9px] text-slate-500 font-bold block mt-2">Temporarily unlisted</span>
          </div>
        </div>
      </div>

      {/* Main Controls Header: Section Switcher & Search */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Section Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('categories')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSection === 'categories'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({CATEGORIES.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('products')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSection === 'products'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Individual Products ({PRODUCTS.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSection === 'categories' ? "Search categories by name..." : "Search products by name or category..."}
            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: CATEGORIES TOGGLE */}
      {activeSection === 'categories' && (
        <div className="space-y-4">
          {/* Bulk Action Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider">
                Category Bulk Actions for {activeBranch?.name || selectedBranchId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkCategories(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All (All Online)</span>
              </button>
              <button
                onClick={() => handleBulkCategories(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Deselect All (All Offline)</span>
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => {
              const isOnline = categoryStatus[cat.id] !== false;
              const asset3D = getCategory3DAsset(cat.id);
              const relatedProds = PRODUCTS.filter(p => p.category === cat.id);

              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-3xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isOnline 
                      ? 'border-indigo-100 shadow-sm hover:shadow-md' 
                      : 'border-slate-200 bg-slate-50/80 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {/* 3D Asset Preview */}
                      <div className="w-14 h-14 rounded-2xl p-1 bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-200/60 shadow-inner flex items-center justify-center relative overflow-hidden">
                        <img
                          src={asset3D.image}
                          alt={cat.name}
                          className="w-full h-full object-contain filter drop-shadow-md"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>';
                          }}
                        />
                      </div>

                      {/* Status Toggle Switch */}
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className={`group relative flex items-center w-14 h-8 rounded-full p-1 transition-all duration-300 shadow-inner cursor-pointer ${
                            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={`Toggle ${cat.name} ${isOnline ? 'Offline' : 'Online'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center text-[10px] font-black ${
                            isOnline ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-400'
                          }`}>
                            <Power className="w-3 h-3" />
                          </div>
                        </button>
                        <span className={`text-[9px] font-black tracking-widest uppercase ${
                          isOnline ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {cat.description || `${relatedProds.length} products available`}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold text-[10px]">
                      {relatedProds.length} Items Listed
                    </span>
                    <button
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        setActiveSection('products');
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-black text-[10px] uppercase tracking-wider flex items-center gap-1"
                    >
                      <span>Manage Items</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: INDIVIDUAL PRODUCTS TOGGLE */}
      {activeSection === 'products' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories ({PRODUCTS.length})
            </button>
            {CATEGORIES.map(c => {
              const count = PRODUCTS.filter(p => p.category === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    categoryFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    categoryFilter === c.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bulk Action Bar for Products */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider">
                Product Bulk Actions {categoryFilter !== 'all' ? `in ${categoryFilter}` : '(All)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkProducts(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All ({filteredProducts.length} Online)</span>
              </button>
              <button
                onClick={() => handleBulkProducts(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Deselect All (Offline)</span>
              </button>
            </div>
          </div>

          {/* Products List / Grid */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Showing {filteredProducts.length} products
              </span>
              <span className="text-xs font-bold text-slate-500">
                Location: <strong className="text-slate-800">{activeBranch?.name || selectedBranchId}</strong>
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const isOnline = productStatus[prod.id] !== false;
                const asset3D = getCategory3DAsset(prod.category);

                return (
                  <div
                    key={prod.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isOnline ? 'hover:bg-slate-50/60' : 'bg-slate-50/70 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Product Thumbnail or 3D fallback */}
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                        <img
                          src={prod.image || asset3D.image}
                          alt={prod.name}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = asset3D.image;
                          }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-wider">
                            {prod.category}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isOnline 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}>
                            {isOnline ? 'Online' : 'Offline / Hidden'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {prod.name}
                        </h4>
                        <p className="text-xs font-black text-indigo-600 mt-0.5">
                          ₹{prod.price}
                          {prod.unit && <span className="text-[10px] text-slate-400 font-bold ml-1">/ {prod.unit}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Toggle and Action Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-right sm:text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Branch Visibility
                        </p>
                        <p className={`text-xs font-black ${isOnline ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {isOnline ? 'Live in App' : 'Turned Off'}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleProduct(prod.id)}
                        className={`group relative flex items-center w-14 h-8 rounded-full p-1 transition-all duration-300 shadow-inner cursor-pointer ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={`Turn ${prod.name} ${isOnline ? 'Offline' : 'Online'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center text-[10px] font-black ${
                          isOnline ? 'translate-x-6 text-emerald-600' : 'translate-x-0 text-slate-400'
                        }`}>
                          <Power className="w-3 h-3" />
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseInventoryManager;
