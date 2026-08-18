import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, Category, Product, Service, CartItem, LanguageCode } from './types';
import Splash from './components/Splash';
import Login from './components/Login';
import Home from './components/Home';

// Static imports for robust bundle resolution
import LocationSelection from './components/LocationSelection';
import CategoryListing from './components/CategoryListing';
import ProductDetails from './components/ProductDetails';
import ServiceBooking from './components/ServiceBooking';
import Cart from './components/Cart';
import Wishlist from './components/Wishlist';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Payment from './components/Payment';
import OrderConfirmation from './components/OrderConfirmation';
import Notifications from './components/Notifications';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import TrackOrder from './components/TrackOrder';
import Onboarding from './components/Onboarding';
import MaintenanceScreen from './components/MaintenanceScreen';
import DeliveryDashboard from './components/DeliveryDashboard';
import VendorDashboard from './components/VendorDashboard';
import MarriageBureau from './components/MarriageBureau';
import RealEstate from './components/RealEstate';
import TaskManager from './components/TaskManager';
import CustomerCare from './components/CustomerCare';
import PartnerPortal from './components/PartnerPortal';
import AdminPortal from './components/AdminPortal';
import DeliveryPartnerApp from './components/DeliveryPartnerApp';

import { referralService } from './lib/referral';
import { PRODUCTS, SERVICES, REWARDS } from './constants';
import { VendorProfile } from './types';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { useTranslation } from './i18n';
import { serverTimestamp, collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { resetSandbox } from './lib/firestore-wrapper';

import { useFirebase } from './contexts/FirebaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertCircle, Power, RefreshCw, Users, Truck, ArrowRight, ShieldCheck, ShieldAlert, Bike } from 'lucide-react';
import BranchManager from './components/BranchManager';
import { Branch } from './types';
import { isPointInBranchBoundaries, getCoordsFromAddress } from './lib/geofencing';

import { SafeZone } from './components/common/SafeZone';
import FloatingAppSwitcher from './components/common/FloatingAppSwitcher';
import AccessDenied from './components/AccessDenied';

function AppModeSelector({ onSelect }: { onSelect: (mode: 'customer' | 'partner' | 'rider' | 'admin') => void }) {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 text-white font-sans selection:bg-indigo-500">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-3"
        >
          <div className="w-20 h-20 bg-white rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/10 border-4 border-slate-900 overflow-hidden relative" id="app_mode_logo">
            <img src="/src/assets/images/local_bandi_logo_1785784124975.jpg" className="w-full h-full object-cover" alt="Local Bandi Logo" />
          </div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-yellow-500">Local Bandi Multi Services</p>
          <h1 className="text-3xl font-black italic tracking-tighter leading-none text-white uppercase sm:text-4xl">Platform Entry</h1>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs mx-auto uppercase tracking-wide">
            Select the standalone application you want to run. All systems stay fully synchronized with the same central databases.
          </p>
        </motion.div>

        {/* Option cards */}
        <div className="space-y-4">
          
          {/* Card 1: Customer UI */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onClick={() => onSelect('customer')}
            className="group relative bg-slate-900 hover:bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 p-6 rounded-[2rem] text-left cursor-pointer transition-all hover:shadow-2xl duration-300"
            id="app_mode_btn_customer"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-20 h-20 text-slate-100" />
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-transform group-hover:scale-105">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-indigo-400 transition-colors">Customer Console</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-bold">
                  Place fresh orders, request OP hospital visits, view catalogs, and order groceries or food at home.
                </p>
                <div className="pt-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <span>Enter Application</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Partner & Vendor portal */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={() => onSelect('partner')}
            className="group relative bg-slate-900 hover:bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 p-6 rounded-[2rem] text-left cursor-pointer transition-all hover:shadow-2xl duration-300"
            id="app_mode_btn_partner"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Truck className="w-20 h-20 text-slate-100" />
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-transform group-hover:scale-105">
                <Truck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors">Merchant Portal</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-bold">
                  Exclusively for local Store and Food Cart Owners to review products, adjust prices, and prepare customer orders.
                </p>
                <div className="pt-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <span>Enter Platform</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Standalone Delivery Partner App */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            onClick={() => onSelect('rider')}
            className="group relative bg-slate-900 hover:bg-slate-900/60 border border-white/5 hover:border-amber-500/30 p-6 rounded-[2rem] text-left cursor-pointer transition-all hover:shadow-2xl duration-300"
            id="app_mode_btn_rider"
          >
            <div className="absolute top-0 right-0 p-6 opacity-3 group-hover:opacity-8 transition-opacity">
              <Bike className="w-20 h-20 text-slate-100" />
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/30 transition-transform group-hover:scale-105">
                <Bike className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-amber-500 transition-colors">Delivery Partner App</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-bold">
                  Dedicated driver console linking directly with dispatch hubs. Secure login via PIN, real-time trip pools, earn ledgers, and live support chat.
                </p>
                <div className="pt-2 text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <span>Open Rider Terminal</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Master Admin Portal */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => onSelect('admin')}
            className="group relative bg-slate-900 hover:bg-slate-900/60 border border-white/5 hover:border-yellow-500/30 p-6 rounded-[2rem] text-left cursor-pointer transition-all hover:shadow-2xl duration-300"
            id="app_mode_btn_admin"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert className="w-20 h-20 text-slate-100" />
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-yellow-505/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 group-hover:bg-yellow-500/20 group-hover:border-yellow-500/30 transition-transform group-hover:scale-105">
                <ShieldAlert className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-yellow-500 transition-colors">Master Admin Control Panel</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-bold">
                  Dedicated system console for platform administrators to regulate store approvals, chat helpdesks, catalog indexes, and app configuration togglers.
                </p>
                <div className="pt-2 text-[9px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <span>Secure Entrance</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer info lock */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]"
        >
          Standalone deployment &bull; khammam
        </motion.p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <FloatingAppSwitcher currentApp="customer" />
    </ThemeProvider>
  );
}

function AppContent() {
  const { user, userProfile, isAdmin: isFirebaseAdmin, isSuperAdmin: isFirebaseSuperAdmin, isBranchAdmin: isFirebaseBranchAdmin, branchId: userBranchId, loading, login, logout, isLoggingOut } = useFirebase();
  const [passcodeAuthenticated, setPasscodeAuthenticated] = useState(() => {
    return localStorage.getItem('admin_session_active') === 'true';
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setPasscodeAuthenticated(localStorage.getItem('admin_session_active') === 'true');
    };
    window.addEventListener('admin_session_updated', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('admin_session_updated', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Segregated roles: Tarun (master admin) has absolute Super Admin control over all portals.
  const isSuperAdmin = isFirebaseSuperAdmin || 
                       user?.email === 'tharunbandi111@gmail.com' || 
                       user?.email === 'tarunbandi111@gmail.com' ||
                       user?.phoneNumber === '+918790729816' ||
                       user?.phoneNumber === '+917416574197' ||
                       passcodeAuthenticated;
  const isBranchAdmin = isFirebaseBranchAdmin || isSuperAdmin || passcodeAuthenticated;
  const isAdmin = isFirebaseAdmin || isSuperAdmin || passcodeAuthenticated || (localStorage.getItem('admin_session_active') === 'true');

  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeVendorProfile, setActiveVendorProfile] = useState<VendorProfile | null>(null);

  const navigateTo = React.useCallback(async (screen: Screen, id?: string) => {
    if (id) {
      setSelectedOrderId(id);
    } else {
      setSelectedOrderId(null);
    }

    if (id && screen === 'vendor') {
      if (id === 'admin-store') {
        const adminStoreData = {
          id: 'admin-store',
          businessName: 'Local Bandi Multi Services Preparations',
          ownerName: 'Admin Hub',
          service: 'Operations',
          status: 'Approved',
          revenue: 0,
          pendingPayout: 0,
          itemsCount: 0,
          rating: 5.0,
          isOnline: true,
          branchId: 'khammam_main'
        };
        setActiveVendorProfile(adminStoreData as any);
        
        if (isAdmin) {
          try {
            const vDoc = await getDoc(doc(db, 'vendors', 'admin-store'));
            if (!vDoc.exists()) {
              await setDoc(doc(db, 'vendors', 'admin-store'), adminStoreData);
              
              // Bootstrap some products for admin-store
              const bootstrapProducts = [
                { name: 'Pure Homemade Ghee', price: 650, unit: '500ml', category: 'dairy', image: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E', description: 'Hand-churned pure buffalo milk ghee.', isAvailable: true, vendorId: 'admin-store', createdAt: serverTimestamp(), branchId: 'khammam_main' },
                { name: 'Authentic Sambar Powder', price: 90, unit: '100g', category: 'groceries', image: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E', description: 'Traditional family recipe masala.', isAvailable: true, vendorId: 'admin-store', createdAt: serverTimestamp(), branchId: 'khammam_main' },
                { name: 'Fresh Dosa Batter', price: 45, unit: '1kg', category: 'dairy', image: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E', description: 'Stone-ground fresh batter for crispy dosas.', isAvailable: true, vendorId: 'admin-store', createdAt: serverTimestamp(), branchId: 'khammam_main' }
              ];

              for (const p of bootstrapProducts) {
                await addDoc(collection(db, 'products'), p);
              }
            }
          } catch (e) { 
            console.error("Admin store bootstrap failed:", e); 
          }
        }
      } else {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const vendorDoc = await getDoc(doc(db, 'vendors', id));
          if (vendorDoc.exists()) {
            setActiveVendorProfile({ id: vendorDoc.id, ...vendorDoc.data() } as VendorProfile);
          }
        } catch (e) {
          console.error("Failed to load vendor profile for navigation", e);
        }
      }
    }
    if (screen !== 'confirmation') {
      setIsOrderSubmitLocked(false);
    }
    setCurrentScreen(screen);
  }, [isAdmin]);

  const [isOrderSubmitLocked, setIsOrderSubmitLocked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<Product | Service | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedReward, setSelectedReward] = useState<any | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [location, setLocation] = useState(() => localStorage.getItem('lokal_user_location') || 'Select Location');
  const [currentBranchId, setCurrentBranchId] = useState<string>(() => localStorage.getItem('lokal_branch_id') || 'khammam_main');

  // Lock branch for Branch Admins
  useEffect(() => {
    if (isBranchAdmin && userBranchId && currentBranchId !== userBranchId) {
      setCurrentBranchId(userBranchId);
      localStorage.setItem('lokal_branch_id', userBranchId);
    }
  }, [isBranchAdmin, userBranchId, currentBranchId]);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [coverageZones, setCoverageZones] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'coverage_zones'), (snap) => {
      setCoverageZones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to coverage_zones:", err);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const selected = branches.find(b => b.id === currentBranchId);
    setCurrentBranch(selected || null);
  }, [branches, currentBranchId]);

  const isBranchOffline = currentBranch?.status === 'Offline';
  const { language: selectedLanguage, setLanguage: setSelectedLanguage } = useTranslation();
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
      setBranches(bList);
      
      // If we are in "Select Location" or newly selecting, we might need to update branchId
    }, (err) => {
      console.warn("Failed to subscribe to branches (likely quota hit). Fallback to default branch.");
      setBranches([
        {
          id: 'khammam_main',
          name: 'Khammam Main Branch',
          location: 'Khammam Center',
          city: 'Khammam',
          district: 'Khammam',
          state: 'Telangana',
          pincodes: ['507001', '507002', '507003'],
          status: 'Active',
          adminId: 'default_admin',
          adminName: 'Tharun Bandi',
          contactPhone: '8790729816',
          vendorsCount: 15,
          ordersCount: 120,
          revenue: 45000,
          profitShare: 10,
          joinDate: new Date(),
          agreementExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ]);
      handleFirestoreError(err, OperationType.LIST, 'branches');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (location !== 'Select Location' && branches.length > 0 && !isBranchAdmin) {
      // Find matching branch
      const lowerLoc = (location || '').toLowerCase();
      const pincodeMatch = (location || '').match(/\d{6}/);
      const pincode = pincodeMatch ? pincodeMatch[0] : null;

      // Score-based matching for better accuracy
      const scoredBranches = branches.map(b => {
        let score = 0;
        const branchName = (b.name || '').toLowerCase();
        const branchLoc = (b.location || '').toLowerCase();
        const branchCity = (b.city || '').toLowerCase();
        const branchDistrict = (b.district || '').toLowerCase();

        // Highest Priority: Pincode match
        if (pincode && b.pincodes?.includes(pincode)) score += 100;

        // High Priority: Exact location/name match
        if (lowerLoc === branchLoc || lowerLoc === branchName) score += 80;
        else if (lowerLoc.includes(branchLoc) || lowerLoc.includes(branchName)) score += 50;

        // Medium Priority: City/District match
        if (branchCity && lowerLoc.includes(branchCity)) score += 30;
        if (branchDistrict && lowerLoc.includes(branchDistrict)) score += 20;

        // Bonus: Reverse inclusion (e.g., search term is more specific than branch name)
        if (branchLoc.includes(lowerLoc) || branchName.includes(lowerLoc)) score += 40;

        return { branch: b, score };
      });

      const matched = scoredBranches
        .filter(sb => sb.score > 0)
        .sort((a, b) => b.score - a.score)[0]?.branch;
      
      if (matched && matched.id !== currentBranchId) {
        setCurrentBranchId(matched.id);
        localStorage.setItem('lokal_branch_id', matched.id);
      } else if (!matched && lowerLoc.includes('khammam')) {
        setCurrentBranchId('khammam_main');
        localStorage.setItem('lokal_branch_id', 'khammam_main');
      } else if (!matched) {
        // If still not matched, we might want to flag this
        console.log("No specific branch matched for:", location);
      }
    }
  }, [location, branches, isBranchAdmin, currentBranchId]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'promoCodes'), where('status', '==', 'Active'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to promo codes (likely quota hit). Fallback to defaults.");
      setPromoCodes([
        { id: 'WELCOME100', code: 'WELCOME100', discountType: 'Flat', discountValue: 100, minOrderValue: 300, status: 'Active', description: 'Flat ₹100 off on orders above ₹300' },
        { id: 'LOKALFREE', code: 'LOKALFREE', discountType: 'FreeDelivery', discountValue: 0, minOrderValue: 150, status: 'Active', description: 'Free Delivery on orders above ₹150' },
        { id: 'FESTIVE50', code: 'FESTIVE50', discountType: 'Percentage', discountValue: 15, minOrderValue: 200, status: 'Active', description: '15% off on all products/services up to ₹100' }
      ]);
      handleFirestoreError(err, OperationType.LIST, 'promoCodes');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Auto-redirect based on auth state
    if (!loading && !isLoggingOut) {
      const storedPhone = localStorage.getItem('user_phone') || localStorage.getItem('lokal_user_phone');
      const isUserAuthenticated = !!user || !!storedPhone;

      if (isUserAuthenticated) {
        // Only redirect TO home/location if we're on login/splash AND not trying to log out
        // We'll rely on currentScreen state
        if (currentScreen === 'login' || currentScreen === 'splash') {
          if (location === 'Select Location') {
            navigateTo('location');
          } else {
            navigateTo('home');
          }
        }
      } else {
        // If logged out and not on public screens, go to login
        const publicScreens: Screen[] = ['login', 'splash', 'onboarding'];
        if (!publicScreens.includes(currentScreen)) {
          navigateTo('login');
        }
      }
    }
  }, [user, loading, isLoggingOut, currentScreen, location, navigateTo]);

  useEffect(() => {
    // Automatic Location Detection
    if (location === 'Select Location' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            if (data && data.display_name) {
              const detectedLoc = data.display_name;
              setLocation(detectedLoc);
              localStorage.setItem('lokal_user_location', detectedLoc);
            }
          } catch (e) {
            console.error("Auto location error:", e);
          }
        },
        (err) => console.log("Geolocation permission denied or error:", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [location]);

  const handleLocationSelect = React.useCallback(async (newLoc: string) => {
    setLocation(newLoc);
    localStorage.setItem('lokal_user_location', newLoc);
    
    // Clear old coords first
    localStorage.removeItem('lokal_user_lat');
    localStorage.removeItem('lokal_user_lng');

    try {
      const coords = await getCoordsFromAddress(newLoc);
      if (coords) {
        localStorage.setItem('lokal_user_lat', String(coords.lat));
        localStorage.setItem('lokal_user_lng', String(coords.lng));
        
        // Also update user profile if authenticated
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            latitude: coords.lat,
            longitude: coords.lng,
            fullAddress: newLoc
          }).catch(err => console.warn("Failed to update profile coordinates:", err));
        }
      }
    } catch (err) {
      console.warn("Could not geocode selected address:", err);
    }

    setCurrentScreen('home');
  }, [user]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('lokal_maintenance_mode') === 'true');
  const [hospitalPrices, setHospitalPrices] = useState<Record<string, { price: number; isActive: boolean }>>({
    'Govt Hospital': { price: 0, isActive: true },
    'KIMS Hospital': { price: 300, isActive: true },
    'Mamatha Hospital': { price: 200, isActive: true },
    'Prathima Hospital': { price: 250, isActive: true }
  });

  useEffect(() => {
    if (!db) return;
    
    let basePrices: Record<string, { price: number; isActive: boolean }> = {
      'Govt Hospital': { price: 0, isActive: true },
      'KIMS Hospital': { price: 300, isActive: true },
      'Mamatha Hospital': { price: 200, isActive: true },
      'Prathima Hospital': { price: 250, isActive: true }
    };

    const unsubPrices = onSnapshot(doc(db, 'settings', 'hospital_prices'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, any>;
        const normalized: Record<string, { price: number; isActive: boolean }> = {};
        Object.entries(data).forEach(([key, val]) => {
          if (typeof val === 'number') {
            normalized[key] = { price: val, isActive: true };
          } else if (val && typeof val === 'object') {
            normalized[key] = { price: val.price ?? 0, isActive: val.isActive ?? true };
          }
        });
        basePrices = { ...basePrices, ...normalized };
        setHospitalPrices({ ...basePrices });
      }
    }, (err) => {
      console.warn("Failed to subscribe to hospital_prices (likely quota hit). Using default prices.");
      setHospitalPrices({ ...basePrices });
      handleFirestoreError(err, OperationType.GET, 'settings/hospital_prices');
    });

    const unsubPartners = onSnapshot(
      query(collection(db, 'vendors'), where('type', '==', 'HospitalOP'), where('status', '==', 'Approved')),
      (snap) => {
        const vendorPrices: Record<string, { price: number; isActive: boolean }> = {};
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.businessName) {
            vendorPrices[data.businessName] = {
              price: Number(data.opFee || 151),
              isActive: data.isOnline !== false
            };
          }
        });
        setHospitalPrices(prev => ({
          ...basePrices,
          ...prev,
          ...vendorPrices
        }));
      },
      (err) => {
        console.warn("Failed to subscribe to hospital vendors (likely quota hit). Using default hospitals.");
        const defaultVendorPrices: Record<string, { price: number; isActive: boolean }> = {
          'Khammam General Hospital': { price: 50, isActive: true },
          'Sanjeevani Children Hospital': { price: 150, isActive: true },
          'Lotus Hospital': { price: 200, isActive: true },
          'Care Hospital': { price: 180, isActive: true }
        };
        setHospitalPrices(prev => ({
          ...basePrices,
          ...prev,
          ...defaultVendorPrices
        }));
        handleFirestoreError(err, OperationType.LIST, 'vendors');
      }
    );

    return () => {
      unsubPrices();
      unsubPartners();
    };
  }, []);

  const [adminSessionActive, setAdminSessionActive] = useState(() => localStorage.getItem('admin_session_active') === 'true');
  const [showCustomerCare, setShowCustomerCare] = useState(false);
  const [supportCareType, setSupportCareType] = useState<'user' | 'vendor' | 'delivery' | 'marriage'>('user');

  useEffect(() => {
    const handleOpenSupport = (e: Event) => {
      const customEvent = e as CustomEvent;
      const initialMessage = customEvent.detail?.message || '';
      
      setSupportCareType('user');
      setShowCustomerCare(true);
      
      if (initialMessage) {
        localStorage.setItem('support_prefilled_complaint', initialMessage);
      }
    };
    window.addEventListener('open_customer_care', handleOpenSupport);
    return () => window.removeEventListener('open_customer_care', handleOpenSupport);
  }, []);

  const [globalError, setGlobalError] = useState<{message: string, recovery: string} | null>(null);
  const [sandboxActive, setSandboxActive] = useState(() => localStorage.getItem('quota_exceeded_sandbox') === 'true');

  useEffect(() => {
    const handleStatus = (e: Event) => {
      const ce = e as CustomEvent;
      setSandboxActive(ce.detail.active);
    };
    window.addEventListener('sandbox_status_changed', handleStatus as any);
    return () => window.removeEventListener('sandbox_status_changed', handleStatus as any);
  }, []);
  const [supportInfo] = useState(() => {
    const saved = localStorage.getItem('supportInfo');
    return saved ? JSON.parse(saved) : { 
      phone: '7416574197', 
      secondaryPhone: '8790729816',
      email: 'Localbandimultiservices@gmail.com' 
    };
  });

  useEffect(() => {
    if (!user) {
      setActiveVendorProfile(null);
      return;
    }
    const q = query(collection(db, 'vendors'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setActiveVendorProfile({ id: snap.docs[0].id, ...snap.docs[0].data() } as VendorProfile);
      } else {
        // Fallback for demo or already logged in states from localStorage
        const vendors = JSON.parse(localStorage.getItem('approvedVendors') || '[]');
        if (vendors.length > 0) {
          setActiveVendorProfile(vendors[0]);
        }
      }
    }, (err) => {
      console.warn("Failed to subscribe to active vendor profile. Fallback to localStorage.");
      const vendors = JSON.parse(localStorage.getItem('approvedVendors') || '[]');
      if (vendors.length > 0) {
        setActiveVendorProfile(vendors[0]);
      } else {
        const role = localStorage.getItem('user_role');
        if (role === 'vendor') {
          setActiveVendorProfile({
            id: 'mock_vendor_id',
            userId: user.uid,
            businessName: 'Lokal Vendor Shop',
            ownerName: 'Tharun Bandi',
            type: 'Groceries',
            phone: '8790729816',
            status: 'Approved',
            isOnline: true,
            branchId: currentBranchId || 'khammam_main'
          } as any);
        }
      }
      handleFirestoreError(err, OperationType.LIST, 'vendors');
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handleSync = () => {
      setIsMaintenanceMode(localStorage.getItem('lokal_maintenance_mode') === 'true');
      setAdminSessionActive(localStorage.getItem('admin_session_active') === 'true');
    };
    
    const handleOpenCare = (e: any) => {
      if (e.detail && e.detail.type) {
        setSupportCareType(e.detail.type);
      } else {
        setSupportCareType('user');
      }
      setShowCustomerCare(true);
    };
    const handleCustomNavigate = (e: any) => {
      if (typeof e.detail === 'string') {
        navigateTo(e.detail as any);
      } else if (e.detail && e.detail.screen) {
        navigateTo(e.detail.screen, e.detail.id);
      }
    };
    const handleGlobalError = (e: any) => {
      setGlobalError(e.detail);
    };

    const handleOnline = () => {
      setGlobalError({ 
        message: "Connectivity Restored", 
        recovery: "Syncing data with cloud servers. Your changes will be updated now." 
      });
      setTimeout(() => setGlobalError(null), 3000);
    };

    window.addEventListener('maintenance_mode_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('open_customer_care', handleOpenCare);
    window.addEventListener('navigate', handleCustomNavigate);
    window.addEventListener('lokal_error', handleGlobalError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => {
      setGlobalError({ 
        message: "Network Lost", 
        recovery: "Operating in Offline Mode. We'll sync once connection returns." 
      });
    });
    return () => {
      window.removeEventListener('maintenance_mode_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('open_customer_care', handleOpenCare);
      window.removeEventListener('navigate', handleCustomNavigate);
      window.removeEventListener('lokal_error', handleGlobalError);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    // Add notification when maintenance mode status changes
    const addMaintenanceNotification = () => {
      const newNotif = {
        id: `maint-${Date.now()}`,
        title: isMaintenanceMode ? '🛠️ Maintenance Started' : '✅ System Online',
        message: isMaintenanceMode 
          ? 'Local Bandi Multi Services is upgrading its infrastructure. New orders are paused temporarily.' 
          : 'Maintenance complete! You can now place orders for your favorite local items.',
        timestamp: Date.now(),
        read: false
      };
      const saved = localStorage.getItem('lokal_notifications');
      const current = saved ? JSON.parse(saved) : [];
      localStorage.setItem('lokal_notifications', JSON.stringify([newNotif, ...current]));
      window.dispatchEvent(new CustomEvent('notifications_updated'));
    };

    // Only skip on initial load if we want, but user asked for notifications when it toggles
    // We'll track previous state to avoid notification on first mount
    if (localStorage.getItem('lokal_prev_maintenance') !== null) {
      const prev = localStorage.getItem('lokal_prev_maintenance') === 'true';
      if (prev !== isMaintenanceMode) {
        addMaintenanceNotification();
      }
    }
    localStorage.setItem('lokal_prev_maintenance', isMaintenanceMode.toString());
  }, [isMaintenanceMode]);

  const [localInventory, setLocalInventory] = useState<(Product | Service)[]>([]);

  useEffect(() => {
    if (!db || !currentBranchId) return;

    // Fetch cloud inventory for BOTH products and services across categories
    const productsQ = query(collection(db, 'products'), limit(500));
    const unsub = onSnapshot(productsQ, (snap) => {
      const cloudItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product | Service));
      
      // Merge: Start with hardcoded defaults, then filter them by branch if they have one, 
      // then priority-merge cloud items
      const merged = new Map<string, Product | Service>();
      
      // 1. Add hardcoded items that are either global or match current branch
      [...PRODUCTS, ...SERVICES].forEach(item => {
        if (!item.branchId || item.branchId === currentBranchId || currentBranchId === 'khammam_main') {
          merged.set(item.id, item);
        }
      });

      // 2. Overwrite with real database items saved in categories (takes precedence)
      cloudItems.forEach(item => {
        if (!item.branchId || item.branchId === currentBranchId || currentBranchId === 'khammam_main') {
          merged.set(item.id, item);
        }
      });
      
      setLocalInventory(Array.from(merged.values()));
    }, err => {
      console.warn("Failed to subscribe to cloud inventory (likely cloud quota hit). Merging default items:", err);
      const merged = new Map<string, Product | Service>();
      [...PRODUCTS, ...SERVICES].forEach(item => {
        if (!item.branchId || item.branchId === currentBranchId) {
          merged.set(item.id, item);
        }
      });
      setLocalInventory(Array.from(merged.values()));
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    return () => unsub();
  }, [currentBranchId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      referralService.savePendingReferral(ref);
      // Clean up the URL to keep it pretty
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    referralService.initializeNewUser();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('localInventory', JSON.stringify(localInventory));
    }, 1000);
    return () => clearTimeout(timer);
  }, [localInventory]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    if (saved !== null) {
      setNotificationsEnabled(saved === 'true');
    }
  }, []);

  const toggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('notificationsEnabled', String(next));
      return next;
    });
  };

  const addToCart = React.useCallback((product: Product, quantity: number = 1) => {
    const stock = product.stock ?? 10;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = Math.min(stock, currentQty + quantity);
      
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { ...product, quantity: newQty }];
    });
  }, []);

  const toggleWishlist = React.useCallback((id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const removeFromCart = React.useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = React.useCallback((id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const handleUpdateCartItem = React.useCallback((id: string, updatedFields: Partial<CartItem>) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    }));
  }, []);

  const updateLocation = (newLoc: string) => {
    setLocation(newLoc);
    localStorage.setItem('lokal_user_location', newLoc);
    
    // Quick branch check for Khammam
    if (newLoc && typeof newLoc === 'string' && newLoc.toLowerCase().includes('khammam')) {
      setCurrentBranchId('khammam_main');
      localStorage.setItem('lokal_branch_id', 'khammam_main');
    }
  };


  const handleReorder = async (orderId: string) => {
    setEditingOrderId(null);
    // Try to find the order in firestore logic (fetching one-off is fine for reorder trigger)
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        if (orderData.orderItems) {
          orderData.orderItems.forEach((item: CartItem) => {
            const currentItem = localInventory.find(i => i.id === item.id);
            if (currentItem) {
              addToCart(currentItem as Product, item.quantity);
            } else {
              addToCart(item as Product, item.quantity);
            }
          });
        }
      }
    } catch (e) {
      console.error("Failed to reorder from Firestore", e);
    }
    navigateTo('cart');
  };

  const completeOrder = async (paymentMethod: string = 'upi', tipAmount: number = 0) => {
    console.log(`[Order Flow] Initiating completeOrder with paymentMethod: "${paymentMethod}", tipAmount: ₹${tipAmount}, cart items: ${cart.length}`);

    // Unlock double-submit lock if cart has items
    if (cart.length > 0 && isOrderSubmitLocked) {
      setIsOrderSubmitLocked(false);
    }

    const effectiveUserId = user?.uid || `guest_${Date.now()}`;
    const effectiveCustomerName = userProfile?.name || user?.displayName || 'Lokal Bandi Customer';
    const effectiveCustomerPhone = userProfile?.phone || user?.phoneNumber || '8790729816';

    // Determine branch without throwing false mismatch errors or forcing Customer Care redirects
    const checkMatchedBranch = () => {
      if (!location || location === 'Select Location' || branches.length === 0) return null;
      const lowerLoc = (location || '').toLowerCase();
      const pincodeMatch = (location || '').match(/\d{6}/);
      const pincode = pincodeMatch ? pincodeMatch[0] : null;

      const scoredBranches = branches.map(b => {
        let score = 0;
        const branchName = (b.name || '').toLowerCase();
        const branchLoc = (b.location || '').toLowerCase();
        const branchCity = (b.city || '').toLowerCase();
        const branchDistrict = (b.district || '').toLowerCase();

        if (pincode && b.pincodes?.includes(pincode)) score += 100;
        if (lowerLoc === branchLoc || lowerLoc === branchName) score += 80;
        else if (lowerLoc.includes(branchLoc) || lowerLoc.includes(branchName)) score += 50;
        if (branchCity && lowerLoc.includes(branchCity)) score += 30;
        if (branchDistrict && lowerLoc.includes(branchDistrict)) score += 20;
        if (branchLoc.includes(lowerLoc) || branchName.includes(lowerLoc)) score += 40;

        return { branch: b, score };
      });

      const matched = scoredBranches
        .filter(sb => sb.score > 0)
        .sort((a, b) => b.score - a.score)[0]?.branch;

      return matched || null;
    };

    // Find matched branch or fallback to current branch / active branch seamlessly
    const activeBranchToUse = checkMatchedBranch() || branches.find(b => b.id === currentBranchId) || branches[0] || { id: currentBranchId || 'main', name: 'Main Branch' };
    const branchIdToSave = activeBranchToUse.id || currentBranchId || 'main';

    // Geofencing check - log warning if out of bounds but DO NOT block checkout or redirect to customer care
    try {
      const coords = await getCoordsFromAddress(location, userProfile);
      if (coords) {
        const { lat, lng } = coords;
        const { inside, hasZones } = isPointInBranchBoundaries(lat, lng, branchIdToSave, coverageZones);
        if (hasZones && !inside) {
          console.warn(`[Order Note]: Delivery location "${location}" is slightly outside designated boundary for branch "${activeBranchToUse.name}", proceeding with order placement.`);
        }
      }
    } catch (err) {
      console.warn("Geofencing check warning during checkout:", err);
    }

    const subtotal = cart.reduce((acc, i) => {
      const itemCost = i.price * i.quantity;
      return acc + (i.isMonthlySubscription ? itemCost * 30 : itemCost);
    }, 0);
    const rewardCost = selectedReward ? selectedReward.rewardPrice : 0;
    const tax = 0;
    
    const getAppDeliveryFee = (itemsList: any[], subtotalVal: number) => {
      if (itemsList.length === 0) return 0;
      const isMilkOrWaterItem = (item: any) => {
        const name = (item.name || '').toLowerCase();
        const category = (item.category || '').toLowerCase();
        return name.includes('milk') || name.includes('water') || category === 'water' || category === 'dairy' || category === 'milk';
      };
      const milkWaterItems = itemsList.filter(isMilkOrWaterItem);
      const otherItems = itemsList.filter(item => !isMilkOrWaterItem(item));
      
      let baseFee = 0;
      if (otherItems.length > 0) {
        if (subtotalVal >= 469) {
          baseFee = 0;
        } else {
          let maxFee = 0;
          otherItems.forEach(item => {
            let itemFee = 15;
            const category = (item.category || '').toLowerCase();
            const name = (item.name || '').toLowerCase();
            if (category === 'groceries' || category === 'veg') {
              itemFee = 10;
            } else if (category === 'meat') {
              itemFee = 15;
            } else if (category === 'food') {
              const isTiffin = name.includes('idly') || name.includes('dosa') || name.includes('wada') || name.includes('chapati') || name.includes('tiffin');
              itemFee = isTiffin ? 15 : 20;
            } else if (['services', 'travel', 'marriage', 'events', 'construction', 'mechanics', 'maids'].includes(category)) {
              itemFee = 0;
            }
            if (itemFee > maxFee) maxFee = itemFee;
          });
          baseFee = maxFee;
        }
      }
      let milkWaterFee = 0;
      if (milkWaterItems.length > 0) {
        const hasSingleMilkWater = milkWaterItems.some(item => !item.isMonthlySubscription);
        if (hasSingleMilkWater) {
          milkWaterFee = 5;
        }
      }
      return baseFee + milkWaterFee;
    };

    const deliveryFee = getAppDeliveryFee(cart, subtotal);
    const finalTotal = subtotal + tax + deliveryFee + rewardCost + tipAmount;

    const isMonthlyOrder = cart.some(i => i.isMonthlySubscription);
    const orderId = editingOrderId || ((isMonthlyOrder ? 'SUB-' : 'ORD-') + Math.floor(1000 + Math.random() * 9000));
    
    // Prepare order items including reward if any
    const orderItems: any[] = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      isMonthlySubscription: item.isMonthlySubscription || false
    }));

    if (selectedReward) {
      orderItems.push({
        id: selectedReward.id,
        name: selectedReward.name + ' (Reward Item)',
        price: selectedReward.rewardPrice,
        quantity: 1,
        image: selectedReward.img
      });
    }

    // Create or Update order in Firestore
    const vendorId = cart[0]?.vendorId || 'global';
    
    // Find vendor details to store in order for rider
    let vendorName = 'Local Bandi Merchant';
    let vendorPhone = '';
    let pickupAddress = 'Main Market, City Center';
    let pickupLocation = { lat: 19.842, lng: 78.598 };

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      if (vendorId !== 'global') {
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
        if (vendorDoc.exists()) {
          const vData = vendorDoc.data();
          vendorName = vData.businessName || vData.name || vendorName;
          vendorPhone = vData.phone || vendorPhone;
          pickupAddress = vData.address || pickupAddress;
          if (vData.location) pickupLocation = vData.location;
        }
      }
    } catch (e) {
      console.warn("Failed to enrichment order with vendor details", e);
    }

    // Create or Update order in Firestore
    const orderRecord: any = {
      id: orderId,
      userId: effectiveUserId,
      customerName: effectiveCustomerName,
      customerPhone: effectiveCustomerPhone,
      deliveryAddress: location === 'Select Location' ? 'Khammam Main Center' : location,
      deliveryLocation: { lat: 19.845, lng: 78.601 }, // Default to Wardha area if geolocation fails
      items: orderItems.reduce((acc, i) => acc + i.quantity, 0),
      orderItems,
      rewardItem: selectedReward || null,
      total: finalTotal,
      tipAmount: tipAmount,
      vendorId: vendorId,
      vendorName: vendorName,
      vendorPhone: vendorPhone,
      pickupAddress: pickupAddress,
      pickupLocation: pickupLocation,
      branchId: currentBranchId, // Essential for data isolation
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'Pending (COD)' : 'Paid (UPI)',
      isMonthlySubscription: isMonthlyOrder,
      remainingDays: isMonthlyOrder ? 30 : 0,
      completedDates: [],
      updatedAt: serverTimestamp(),
      adminAccepted: false
    };

    if (!editingOrderId) {
      orderRecord.status = 'Pending';
      orderRecord.deliveryPartnerId = null;
      orderRecord.createdAt = serverTimestamp();
      orderRecord.timestamp = new Date().toISOString();
    } else {
      orderRecord.status = 'Pending'; // Return to pending after editing
      orderRecord.isEdited = true;
      orderRecord.lastEditAt = serverTimestamp();
    }

    console.log('[Order Flow] Prepared order document payload:', {
      orderId,
      customerName: orderRecord.customerName,
      paymentMethod: orderRecord.paymentMethod,
      paymentStatus: orderRecord.paymentStatus,
      total: orderRecord.total,
      branchId: orderRecord.branchId,
      itemsCount: orderRecord.items
    });

    try {
      const { setDoc, getDoc, doc, updateDoc } = await import('firebase/firestore');
      const { integrationService } = await import('./services/integrationService');

      console.log(`[Order Flow] Writing order document to Firestore collection "orders", doc ID: "${orderId}"...`);

      if (editingOrderId) {
        await updateDoc(doc(db, 'orders', orderId), orderRecord);
      } else {
        await setDoc(doc(db, 'orders', orderId), orderRecord);
      }

      console.log(`[Order Flow] Successfully committed order "${orderId}" to Firestore with paymentStatus: "${orderRecord.paymentStatus}"`);

      // Explicit verification check: ensure the document exists in Firestore before completing navigation
      console.log(`[Order Flow] Verifying document existence for order "${orderId}"...`);
      const orderSnap = await getDoc(doc(db, 'orders', orderId));
      if (!orderSnap.exists()) {
        console.error(`[Order Flow Error] Document verification failed! Order "${orderId}" not found in Firestore after setDoc.`);
        alert("⚠️ Order Verification Warning: We encountered a network issue verifying your saved order. The application will refresh now to sync your status.");
        window.location.reload();
        return;
      }
      console.log(`[Order Flow Verification] Verified order "${orderId}" exists in Firestore with status "${orderSnap.data()?.status}"!`);

      // Real-time SMS Gateway Integration
      const phone = userProfile?.phone || user?.phoneNumber;
      if (phone) {
        integrationService.sendSMS(
          phone, 
          `Local Bandi Multi Services: Order ${orderId} for ₹${finalTotal} placed! Track here: https://lokalbharat.app/track/${orderId}`
        ).catch(err => console.error("[Order Flow Warning] Order SMS dispatch error:", err));
      }

      setSelectedOrderId(orderId);
      setEditingOrderId(null);
      setCart([]);
      setSelectedReward(null);
      setIsOrderSubmitLocked(true); // Engages the foolproof double-submit lock!
      console.log(`[Order Flow] Navigating to order confirmation screen for order "${orderId}"`);
      navigateTo('confirmation');
    } catch (err) {
      console.error(`[Order Flow Error] Failed to write order document "${orderId}" to Firestore:`, err);
      setIsOrderSubmitLocked(false);
      const errorMsg = (err as Error)?.message || String(err);
      alert(`❌ Order Submission Failed: Unable to record order in Firestore database (${errorMsg}). Please check network connectivity and try again.`);
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
      throw err;
    }
  };

  const viewCategory = React.useCallback((category: Category) => {
    if (category.id === 'realestate') {
      navigateTo('realEstate');
      return;
    }
    if (category.id === 'marriage') {
      navigateTo('marriageBureau');
      return;
    }
    setSelectedCategory(category);
    navigateTo('category');
  }, [navigateTo]);

  const viewItem = React.useCallback((item: Product | Service) => {
    setSelectedItem(item);
    const serviceCategoryIds = ['services', 'emergency', 'travel', 'marriage', 'events', 'maids', 'mechanics', 'construction', 'care', 'jobs', 'driving_school', 'beauty_parlour'];
    if (serviceCategoryIds.includes(item.category)) {
      navigateTo('service');
    } else {
      navigateTo('product');
    }
  }, [navigateTo]);

  const handleEditOrder = async (orderId: string) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        
        // Populate cart with existing items
        if (orderData.orderItems) {
          const newCart: CartItem[] = [];
          orderData.orderItems.forEach((item: any) => {
            // Priority: Find in local inventory, then use order's raw data
            const inventoryItem = localInventory.find(li => li.id === item.id);
            if (inventoryItem) {
              newCart.push({ ...inventoryItem, quantity: item.quantity } as CartItem);
            } else {
              // Ensure we have basic fields for Cart to work
              newCart.push({
                ...item,
                price: item.price || 0,
                name: item.name || 'Legacy Item',
                image: item.image || 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
                category: item.category || 'groceries',
                quantity: item.quantity || 1
              } as CartItem);
            }
          });
          setCart(newCart);
          setEditingOrderId(orderId);
          
          // Mark order as Editing to prevent vendor/rider from acting on it
          const { updateDoc, serverTimestamp } = await import('firebase/firestore');
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'Editing',
            updatedAt: serverTimestamp()
          });
          
          navigateTo('cart');
        }
      }
    } catch (e) {
      console.error("Failed to edit order", e);
      alert("Error editing order. Please try again.");
    }
  };

  useEffect(() => {
    if (user && currentScreen === 'location') {
      // Auto-detect location on login/landing on location screen
      const handleAutoDetect = async () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
              const data = await res.json();
              if (data.display_name) {
                handleLocationSelect(data.display_name);
              }
            } catch (e) {
              console.warn("Auto-location failed", e);
            }
          }, (err) => {
            console.warn("Geolocation permission denied or failed", err);
          });
        }
      };
      handleAutoDetect();
    }
  }, [user, currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SafeZone name="Splash"><Splash onFinish={() => {
          const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
          if (hasSeenOnboarding) {
            navigateTo('login');
          } else {
            navigateTo('onboarding');
          }
        }} /></SafeZone>;
      case 'onboarding':
        return <SafeZone name="Onboarding"><Onboarding 
          onComplete={() => {
            localStorage.setItem('hasSeenOnboarding', 'true');
            navigateTo('login');
          }} 
          onLocationSelect={() => {
            localStorage.setItem('hasSeenOnboarding', 'true');
            navigateTo('location');
          }}
        /></SafeZone>;
      case 'login':
        return <SafeZone name="Login"><Login onLogin={() => {
          const loc = localStorage.getItem('lokal_user_location') || location;
          if (loc && loc !== 'Select Location') {
            navigateTo('home');
          } else {
            navigateTo('location');
          }
        }} /></SafeZone>;
      case 'location':
        return <SafeZone name="Location"><LocationSelection 
          onSelect={handleLocationSelect} 
          userProfile={userProfile}
          currentLocation={location}
        /></SafeZone>;
      case 'home':
        return <SafeZone name="Home"><Home 
          location={location}
          language={selectedLanguage}
          onCategoryClick={viewCategory}
          onProductClick={viewItem}
          cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
          wishlistCount={wishlist.length}
          onNavigate={(s, id) => navigateTo(s as any, id)}
          user={user}
          userProfile={userProfile}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          isBranchAdmin={isBranchAdmin}
          onAdminAuth={setPasscodeAuthenticated}
          localInventory={localInventory}
          setLocalInventory={setLocalInventory}
          setShowCustomerCare={setShowCustomerCare}
          hospitalPrices={hospitalPrices}
          setHospitalPrices={setHospitalPrices}
          currentBranchId={currentBranchId}
          onLocationChange={handleLocationSelect}
          currentBranch={currentBranch}
        /></SafeZone>;
      case 'branchManager':
        if (!isSuperAdmin && !isBranchAdmin && !isAdmin && userProfile?.role !== 'branchAdmin') {
          return (
            <SafeZone name="Access Denied">
              <AccessDenied requiredRole="Branch Admin" onNavigate={(s) => navigateTo(s as Screen)} />
            </SafeZone>
          );
        }
        return <SafeZone name="Branch Manager"><BranchManager onBack={() => navigateTo('home')} masterAdminName="Tarun Bandi" /></SafeZone>;
      case 'category':
        return <SafeZone name="Category Listing"><CategoryListing 
          category={selectedCategory!}
          language={selectedLanguage}
          onBack={() => navigateTo('home')}
          onProductClick={viewItem}
          isAdmin={isAdmin}
          localInventory={localInventory}
          hospitalPrices={hospitalPrices}
          currentBranchId={currentBranchId}
          onBookHospitalOP={(data) => {
            (window as any).pendingLocalPayment = {
              amount: data.amount,
              type: 'hospital_booking',
              metadata: data,
              onComplete: async (method: string) => {
                try {
                  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                  await addDoc(collection(db, 'hospital_bookings'), {
                    ...data,
                    userId: user?.uid,
                    status: 'pending',
                    paymentMethod: method,
                    paymentStatus: method === 'cod' ? 'Hand Cash' : 'Paid (UPI)',
                    createdAt: serverTimestamp()
                  });
                  alert("OP Booking Confirmed! Show the confirmation in Hospital.");
                  navigateTo('home');
                } catch (err) {
                  console.error("Booking save error:", err);
                }
              }
            };
            navigateTo('payment');
          }}
        /></SafeZone>;
      case 'product':
        return <SafeZone name="Product Details"><ProductDetails 
          product={selectedItem as Product}
          onBack={() => navigateTo('category')}
          isInWishlist={wishlist.includes(selectedItem?.id || '')}
          onToggleWishlist={toggleWishlist}
          cart={cart}
          onAddToCart={(p, q) => {
            addToCart(p, q);
            navigateTo('cart');
          }}
          hospitalPrices={hospitalPrices}
          onBookHospitalOP={(data) => {
            (window as any).pendingLocalPayment = {
              amount: data.amount,
              type: 'hospital_booking',
              metadata: data,
              onComplete: async (method: string) => {
                try {
                  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                  await addDoc(collection(db, 'hospital_bookings'), {
                    ...data,
                    userId: user?.uid,
                    status: 'pending',
                    paymentMethod: method,
                    paymentStatus: method === 'cod' ? 'Hand Cash' : 'Paid (UPI)',
                    createdAt: serverTimestamp()
                  });
                  alert("OP Booking Confirmed! Show the confirmation in Hospital.");
                  navigateTo('home');
                } catch (err) {
                  console.error("Booking save error:", err);
                }
              }
            };
            navigateTo('payment');
          }}
          isAdmin={isAdmin}
        /></SafeZone>;
      case 'wishlist':
        return <SafeZone name="Wishlist"><Wishlist 
          wishlistIds={wishlist}
          language={selectedLanguage}
          onBack={() => navigateTo('home')}
          onProductClick={viewItem}
          onRemove={toggleWishlist}
        /></SafeZone>;
      case 'service':
        return <SafeZone name="Service Booking"><ServiceBooking 
          service={selectedItem as Service}
          onBack={() => navigateTo('category')}
          location={location}
          onUpdateLocation={(newLoc) => {
            setLocation(newLoc);
            localStorage.setItem('lokal_user_location', newLoc);
          }}
          onBook={async (dateText, timeText) => {
            if (!user) {
              alert("Please login to confirm booking!");
              navigateTo('login');
              return;
            }
            const svc = selectedItem as Service;
            if (!svc) return;

            const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
            const directItem: CartItem = {
              id: svc.id,
              name: svc.name + ` (${dateText} @ ${timeText})`,
              price: svc.price,
              image: svc.image || '',
              category: svc.category,
              description: svc.description,
              quantity: 1
            };

            const orderRecord: any = {
              id: orderId,
              userId: user.uid,
              customerName: userProfile?.name || user.displayName || 'Guest User',
              customerPhone: userProfile?.phone || user.phoneNumber || '',
              deliveryAddress: location,
              deliveryLocation: { lat: 17.2550, lng: 80.1600 },
              items: 1,
              orderItems: [
                {
                  id: directItem.id,
                  name: directItem.name,
                  price: directItem.price,
                  quantity: 1,
                  image: directItem.image
                }
              ],
              rewardItem: null,
              total: svc.price,
              tipAmount: 0,
              vendorId: 'global',
              vendorName: 'Local Bandi Service Partner',
              vendorPhone: '',
              pickupAddress: 'Service Hub Office',
              pickupLocation: { lat: 17.2473, lng: 80.1514 },
              branchId: currentBranchId,
              paymentMethod: 'cod',
              paymentStatus: 'Pending (COD)',
              updatedAt: serverTimestamp(),
              adminAccepted: false,
              status: 'Pending',
              deliveryPartnerId: null,
              createdAt: serverTimestamp(),
              timestamp: new Date().toISOString()
            };

            try {
              await setDoc(doc(db, 'orders', orderId), orderRecord);

              try {
                const { integrationService } = await import('./services/integrationService');
                const phone = userProfile?.phone || user.phoneNumber;
                if (phone) {
                  integrationService.sendSMS(
                    phone, 
                    `Lokal SOS: Your service for ${svc.name} is booked on ${dateText} at ${timeText}! Order ID: ${orderId}. Total: ₹${svc.price}`
                  ).catch(err => console.error("Service Booking SMS error:", err));
                }
              } catch (smsErr) {
                console.warn("SMS gateway import or execution failed", smsErr);
              }

              setCart([directItem]);
              setSelectedOrderId(orderId);
              navigateTo('confirmation');
            } catch (err) {
              console.error("Direct Service Booking save error:", err);
              alert("Failed to confirm booking. Please try again!");
            }
          }}
          isAdmin={isAdmin}
        /></SafeZone>;
      case 'cart':
        return <SafeZone name="Cart"><Cart 
          items={cart}
          language={selectedLanguage}
          onBack={() => navigateTo('home')}
          onUpdateQty={updateQuantity}
          onRemove={removeFromCart}
          onCheckout={() => navigateTo('payment')}
          selectedRewardId={selectedReward?.id || null}
          onSelectReward={(id) => {
            const reward = REWARDS.find(r => r.id === id);
            setSelectedReward(reward || null);
          }}
          promoCodes={promoCodes}
          isAdmin={isAdmin}
          onUpdateCartItem={handleUpdateCartItem}
        /></SafeZone>;
      case 'profile':
        return <SafeZone name="Profile"><Profile 
          onBack={() => navigateTo('home')}
          onNavigate={(s, id) => navigateTo(s as Screen, id)}
          language={selectedLanguage}
          isAdmin={isAdmin}
        /></SafeZone>;
      case 'settings':
        return <SafeZone name="Settings"><Settings 
          onBack={() => navigateTo('profile')}
          onLogout={async () => {
            try {
              await logout();
              navigateTo('login');
            } catch (e) {
              console.error("Logout failed:", e);
            }
          }}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={toggleNotifications}
          onNavigate={(s) => navigateTo(s as Screen)}
        /></SafeZone>;
      case 'orders':
        return <SafeZone name="Orders"><Orders 
          onBack={() => navigateTo('profile')}
          onReorder={handleReorder}
          onTrackOrder={(id) => navigateTo('tracking', id)}
          onEditOrder={handleEditOrder}
          language={selectedLanguage}
        /></SafeZone>;
      case 'tracking':
        return <SafeZone name="Tracking"><TrackOrder 
          orderId={selectedOrderId || 'ORD-9021'} 
          onBack={() => navigateTo('orders')}
          onEditOrder={handleEditOrder}
          language={selectedLanguage}
        /></SafeZone>;
      case 'notifications':
        return <SafeZone name="Notifications"><Notifications onBack={() => navigateTo('profile')} /></SafeZone>;
      case 'privacy':
        return <SafeZone name="Privacy"><PrivacyPolicy onBack={() => navigateTo('settings')} language={selectedLanguage} /></SafeZone>;
      case 'terms':
        return <SafeZone name="Terms"><TermsOfService onBack={() => navigateTo('settings')} language={selectedLanguage} /></SafeZone>;
      case 'payment':
        const subtotal = cart.reduce((acc, i) => {
          const itemCost = i.price * i.quantity;
          return acc + (i.isMonthlySubscription ? itemCost * 30 : itemCost);
        }, 0);
        const rewardCost = selectedReward ? selectedReward.rewardPrice : 0;
        const tax = 0;
        
        const getPaymentDeliveryFee = (itemsList: any[], subtotalVal: number) => {
          if (itemsList.length === 0) return 0;
          const isMilkOrWaterItem = (item: any) => {
            const name = (item.name || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            return name.includes('milk') || name.includes('water') || category === 'water' || category === 'dairy' || category === 'milk';
          };
          const milkWaterItems = itemsList.filter(isMilkOrWaterItem);
          const otherItems = itemsList.filter(item => !isMilkOrWaterItem(item));
          
          let baseFee = 0;
          if (otherItems.length > 0) {
            if (subtotalVal >= 469) {
              baseFee = 0;
            } else {
              let maxFee = 0;
              otherItems.forEach(item => {
                let itemFee = 15;
                const category = (item.category || '').toLowerCase();
                const name = (item.name || '').toLowerCase();
                if (category === 'groceries' || category === 'veg') {
                  itemFee = 10;
                } else if (category === 'meat') {
                  itemFee = 10;
                } else if (category === 'food') {
                  const isTiffin = name.includes('idly') || name.includes('dosa') || name.includes('wada') || name.includes('chapati') || name.includes('tiffin');
                  itemFee = isTiffin ? 15 : 20;
                } else if (['services', 'travel', 'marriage', 'events', 'construction', 'mechanics', 'maids'].includes(category)) {
                  itemFee = 0;
                }
                if (itemFee > maxFee) maxFee = itemFee;
              });
              baseFee = maxFee;
            }
          }
          let milkWaterFee = 0;
          if (milkWaterItems.length > 0) {
            const hasSingleMilkWater = milkWaterItems.some(item => !item.isMonthlySubscription);
            if (hasSingleMilkWater) {
              milkWaterFee = 5;
            }
          }
          return baseFee + milkWaterFee;
        };

        const deliveryFee = getPaymentDeliveryFee(cart, subtotal);
        let displayTotal = subtotal + tax + deliveryFee + rewardCost;
        let onCompleteCallback: (method?: string, tip?: number) => void | Promise<void> = (method, tip) => completeOrder(method || 'upi', tip || 0);
        let onBackCallback: () => void | Promise<void> = () => navigateTo('cart');

        // Check for ad-hoc payments (Hospital OP, Marriage Subscription, etc.)
        const pendingPayment = (window as any).pendingLocalPayment;
        if (pendingPayment) {
          displayTotal = pendingPayment.amount;
          onCompleteCallback = async (method?: string) => {
            await pendingPayment.onComplete(method || 'upi');
            (window as any).pendingLocalPayment = null;
            await navigateTo('home');
          };
          onBackCallback = async () => {
            (window as any).pendingLocalPayment = null;
            await navigateTo('home');
          };
        }

        return <SafeZone name="Payment"><Payment 
          onBack={onBackCallback}
          onComplete={onCompleteCallback}
          amount={displayTotal}
          userProfile={userProfile}
          currentLocation={location}
        /></SafeZone>;
      case 'confirmation':
        return <SafeZone name="Confirmation"><OrderConfirmation 
          items={cart}
          orderId={selectedOrderId || 'NEW-ORDER'}
          onHome={() => {
            setCart([]);
            navigateTo('home');
          }}
        /></SafeZone>;
      case 'delivery':
        const isDeliveryAuthorized = Boolean(
          isAdmin || 
          isSuperAdmin || 
          userProfile?.role === 'delivery' || 
          localStorage.getItem('isDeliveryPartner') === 'true'
        );
        if (!isDeliveryAuthorized) {
          return (
            <SafeZone name="Access Denied">
              <AccessDenied requiredRole="Delivery Partner" onNavigate={(s) => navigateTo(s as Screen)} />
            </SafeZone>
          );
        }
        const dProfileId = selectedOrderId || (isAdmin ? 'admin-rider' : undefined);
        return <SafeZone name="Delivery"><DeliveryDashboard profileId={dProfileId} onBack={() => navigateTo('profile')} isAdmin={isAdmin} /></SafeZone>;
      case 'vendor':
        const isVendorAuthorized = Boolean(
          isAdmin || 
          isSuperAdmin || 
          userProfile?.role === 'vendor' || 
          localStorage.getItem('isVendor') === 'true' ||
          Boolean(activeVendorProfile)
        );
        if (!isVendorAuthorized) {
          return (
            <SafeZone name="Access Denied">
              <AccessDenied requiredRole="Vendor Partner" onNavigate={(s) => navigateTo(s as Screen)} />
            </SafeZone>
          );
        }
        const vProfileId = selectedOrderId || (activeVendorProfile?.id) || (isAdmin ? 'admin-store' : undefined);
        return vProfileId ? (
          <SafeZone name="Vendor Dashboard"><VendorDashboard profileId={vProfileId} onBack={() => navigateTo(isAdmin ? 'home' : 'profile')} isAdmin={isAdmin} /></SafeZone>
        ) : (
          <SafeZone name="Access Denied">
            <AccessDenied requiredRole="Vendor Partner" onNavigate={(s) => navigateTo(s as Screen)} />
          </SafeZone>
        );
      case 'marriageBureau':
        return <SafeZone name="Marriage Bureau"><MarriageBureau 
          onBack={() => navigateTo('home')} 
          language={selectedLanguage} 
          isAdmin={isAdmin}
        /></SafeZone>;
      case 'realEstate':
        return <SafeZone name="Real Estate"><RealEstate 
          onClose={() => navigateTo('home')} 
        /></SafeZone>;
      case 'tasks':
        return <SafeZone name="Tasks"><TaskManager onBack={() => navigateTo('home')} /></SafeZone>;
      default:
        return <SafeZone name="Splash"><Splash onFinish={() => navigateTo('login')} /></SafeZone>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto h-screen bg-slate-900 flex items-center justify-center p-8 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-black mb-2 tracking-tight">Initializing Local Bandi Multi Services</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Connecting to secured servers...</p>
        </motion.div>
      </div>
    );
  }

  // Regular customers proceed directly to renderScreen() with clean customer view
  // Administrative screens (like branchManager) perform their own internal role checks.

  return (
    <>
      <div className="max-w-md mx-auto h-screen bg-gray-50 overflow-hidden relative shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full"
          >
            <React.Suspense fallback={
              <div className="h-full flex flex-col items-center justify-center bg-white p-8">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse italic">Lokal Syncing...</p>
              </div>
            }>
              {(!isAdmin && isBranchOffline && currentScreen !== 'splash' && currentScreen !== 'login') ? (
                <div className="h-full bg-slate-900 flex items-center justify-center p-8 text-center">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-8"
                  >
                    <div className="w-24 h-24 bg-rose-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto ring-8 ring-rose-500/10">
                      <Power className="w-12 h-12 text-rose-500" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-black text-white italic tracking-tighter">BRANCH OFFLINE</h2>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                        The {currentBranch?.name || 'local'} branch is currently offline for maintenance or administrative updates.
                      </p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Message from HQ</p>
                      <p className="text-xs font-bold text-slate-300 italic">"We maintain high service standards. Please check back shortly or select another location."</p>
                    </div>
                    <button 
                      onClick={() => navigateTo('location')}
                      className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-transform"
                    >
                      Change Location
                    </button>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Secured by Local Bandi Multi Services</p>
                  </motion.div>
                </div>
              ) : renderScreen()}
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
        {(isMaintenanceMode && !adminSessionActive && !isAdmin) && <MaintenanceScreen />}

      </div>
      <CustomerCare 
        isOpen={showCustomerCare} 
        onClose={() => setShowCustomerCare(false)} 
        supportPhone={supportInfo.phone}
        secondaryPhone={supportInfo.secondaryPhone}
        initialType={supportCareType}
        branchId={currentBranchId}
        language={selectedLanguage}
      />

      <AnimatePresence>
        {globalError && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGlobalError(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-2 border-rose-100"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 italic">Operation Update</h3>
              <p className="text-gray-600 text-sm font-bold leading-relaxed mb-6">{globalError.message}</p>
              
              {globalError.recovery && (
                <div className="bg-emerald-50 p-4 rounded-2xl mb-8 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1 italic">Action Suggested</p>
                  <p className="text-xs font-bold text-emerald-600 leading-relaxed uppercase">{globalError.recovery}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCustomerCare(true)}
                  className="flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase text-[10px] tracking-widest"
                >
                  Get Help
                </button>
                <button 
                  onClick={() => setGlobalError(null)}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
