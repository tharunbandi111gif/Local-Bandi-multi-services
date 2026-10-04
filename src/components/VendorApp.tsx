import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  LogOut, 
  Power, 
  Volume2, 
  VolumeX, 
  Building2, 
  IndianRupee, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Layers, 
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  Sparkles
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import VendorDashboard from './VendorDashboard';
import PartnerOnboarding from './PartnerOnboarding';
import FloatingAppSwitcher from './common/FloatingAppSwitcher';
import StoreMapModal from './StoreMapModal';

export default function VendorApp() {
  const { user, userProfile, logout, login } = useFirebase();
  const [activeVendorProfile, setActiveVendorProfile] = useState<any | null>(null);
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedMapStore, setSelectedMapStore] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync available branches
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBranches(bList);
    }, (err) => {
      console.warn("Branches sync error:", err);
    });
    return () => unsub();
  }, []);

  // Sync vendor profiles
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'vendors'), (snap) => {
      const vList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVendorList(vList);

      // Auto-match if current user phone matches vendor
      const currentPhone = (user?.phoneNumber || localStorage.getItem('user_phone') || userProfile?.phone || '').replace(/\D/g, '').slice(-10);
      if (currentPhone && currentPhone.length >= 10) {
        const matched = vList.find((v: any) => (v.phone || '').replace(/\D/g, '').slice(-10) === currentPhone);
        if (matched) {
          setActiveVendorProfile(matched);
        }
      }
      setLoading(false);
    }, (err) => {
      console.warn("Vendor list sync error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [user, userProfile]);

  // Handle store select
  const handleSelectStore = (store: any) => {
    setActiveVendorProfile(store);
    localStorage.setItem('active_vendor_id', store.id);
  };

  // If active vendor profile is selected, render the rich VendorDashboard
  if (activeVendorProfile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        {/* Top Operational Bar */}
        <header className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base leading-tight">{activeVendorProfile.businessName || activeVendorProfile.storeName || 'Vendor Merchant'}</h1>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${activeVendorProfile.isOnline !== false ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40' : 'bg-rose-400/30 text-rose-100 border border-rose-300/40'}`}>
                  {activeVendorProfile.isOnline !== false ? 'Store Open' : 'Store Closed'}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">{activeVendorProfile.address || 'Khammam Central Branch'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveVendorProfile(null)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Switch Store
            </button>
          </div>
        </header>

        {/* Core Vendor Dashboard */}
        <main className="flex-1 pb-16">
          <VendorDashboard 
            profileId={activeVendorProfile.id} 
            onBack={() => setActiveVendorProfile(null)} 
          />
        </main>

        <FloatingAppSwitcher currentApp="vendor" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-2">
              Local Bandi <span className="text-emerald-400 font-semibold text-sm px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/50">Merchant App</span>
            </h1>
            <p className="text-xs text-slate-400">Merchant catalog, live order dispatch & revenue settlements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowOnboarding(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Register Store
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-800 to-slate-800 border border-emerald-500/30 p-6 shadow-xl">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Direct Merchant Portal
            </span>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Manage Your Restaurant or Grocery Store</h2>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Accept incoming customer orders, manage product stock, schedule deliveries, and track weekly bank payouts with zero commission surprises.
            </p>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setShowOnboarding(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                Register New Merchant Store
              </button>
            </div>
          </div>
        </div>

        {/* Quick Store Selector / Search */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-white text-base">Select Your Registered Store</h3>
              <p className="text-xs text-slate-400">Choose your store below or enter your registered phone number</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search store or phone..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs">Loading registered stores...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vendorList
                .filter((v: any) => {
                  if (!searchPhone) return true;
                  const query = searchPhone.toLowerCase();
                  const name = (v.businessName || v.storeName || '').toLowerCase();
                  const phone = (v.phone || '').toLowerCase();
                  const owner = (v.ownerName || '').toLowerCase();
                  return name.includes(query) || phone.includes(query) || owner.includes(query);
                })
                .map((vendor: any, index: number) => {
                  const branchObj = branches.find(b => b.id === vendor.branchId);
                  return (
                    <motion.div
                      key={vendor.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.35, 
                        delay: Math.min(index * 0.06, 0.5), 
                        ease: 'easeOut' 
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectStore(vendor)}
                      className="cursor-pointer bg-slate-900/70 hover:bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 rounded-xl p-4 transition flex flex-col justify-between gap-3 shadow-md group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold overflow-hidden">
                            {vendor.photo ? (
                              <img src={vendor.photo} alt={vendor.businessName} className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition">
                              {vendor.businessName || vendor.storeName || 'Unnamed Store'}
                            </h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              {vendor.ownerName || 'Merchant Partner'}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {vendor.phone || 'No phone set'}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${vendor.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                          {vendor.status || 'Active'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {branchObj?.name || 'Khammam Central'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMapStore(vendor);
                            }}
                            className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                            title="View exact store pin location on map"
                          >
                            <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                            <span>View on Map</span>
                          </button>
                        </div>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                          Launch Store <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

              {vendorList.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Store className="w-10 h-10 text-slate-600" />
                  <p className="text-sm">No registered stores found yet.</p>
                  <button 
                    onClick={() => setShowOnboarding(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Register First Store
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Store Registration Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button 
              onClick={() => setShowOnboarding(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-2"
            >
              ✕
            </button>
            <PartnerOnboarding 
              userId={user?.uid || 'guest_vendor'}
              defaultType="Vendor"
              onClose={() => setShowOnboarding(false)}
              onSuccess={() => {
                setShowOnboarding(false);
              }} 
            />
          </div>
        </div>
      )}

      {/* Store Map Pin Modal */}
      {selectedMapStore && (
        <StoreMapModal
          isOpen={!!selectedMapStore}
          onClose={() => setSelectedMapStore(null)}
          store={selectedMapStore}
          isAdmin={userProfile?.role === 'admin' || userProfile?.role === 'masterAdmin' || (userProfile as any)?.isAdmin}
          onCoordinatesUpdated={(storeId, lat, lng) => {
            setVendorList(prev => prev.map(v => v.id === storeId ? { ...v, lat, lng, coordinates: { lat, lng } } : v));
          }}
        />
      )}

      <FloatingAppSwitcher currentApp="vendor" />
    </div>
  );
}
