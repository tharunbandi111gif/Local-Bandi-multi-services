import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Settings, Users, Store, Bike, 
  HelpCircle, CheckCircle, AlertTriangle, XCircle, 
  Search, Plus, MapPin, Trash2, Edit2, 
  FileText, LogOut, ArrowRight, Activity, 
  BarChart2, RefreshCw, Send, DollarSign, 
  Heart, Building, Percent, Power, Laptop, ShieldCheck,
  Star, Check, X, Shield, Globe, AlertCircle
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, onSnapshot, query, where, doc, 
  getDoc, setDoc, updateDoc, deleteDoc, addDoc, 
  serverTimestamp, limit, orderBy 
} from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SafeZone } from './common/SafeZone';
import { CATEGORIES, PRODUCTS } from '../constants';
import LogisticsHeatmap from './LogisticsHeatmap';
import OrderTrendsChart from './OrderTrendsChart';

export default function AdminPortal() {
  const { user, login, logout, userProfile, isSuperAdmin: isFbSuperAdmin } = useFirebase();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('local_admin_sessions_authorized') === 'true';
  });
  const [adminPasscode, setAdminPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logistics' | 'approvals' | 'marriage' | 'real_estate' | 'catalog' | 'vendors' | 'riders' | 'chat' | 'systems' | 'founder'>('dashboard');

  // --- LOGISTICS HUB STATES ---
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [logisticsFilter, setLogisticsFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Preparing' | 'OutForDelivery' | 'Delivered' | 'Cancelled'>('All');
  const [bulkSelectedOrderIds, setBulkSelectedOrderIds] = useState<string[]>([]);

  // App metrics state
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalSales: 0,
    totalVendors: 0,
    totalRiders: 0,
    pendingVendors: 0,
    pendingRiders: 0,
    systemMode: 'Online'
  });

  // DB Sync States
  const [vendors, setVendors] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [hospitalPrices, setHospitalPrices] = useState<any>({});
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('lokal_maintenance_mode') === 'true');

  // Custom Category and Catalog Management States
  const [categories, setCategories] = useState<any[]>([]);
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'categories'>('products');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    id: '', name: '', icon: 'ShoppingBag', color: 'bg-emerald-50', image: ''
  });

  // Modal / Operations States
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', price: '', originalPrice: '', unit: '', category: 'groceries', 
    image: '', description: '', isAvailable: true, vendorId: 'admin-store', branchId: 'khammam_main',
    subCategory: '', stock: ''
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // --- GATEWAY & LOGGER STATES ---
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [smsProvider, setSmsProvider] = useState<'msg91' | 'twilio' | 'plivo'>('msg91');
  const [smsApiKey, setSmsApiKey] = useState('MSG91_SECURE_AUTH_KEY_9283749');
  const [smsSenderId, setSmsSenderId] = useState('LKLBND');
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'paytm' | 'cashfree' | 'stripe'>('razorpay');
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>('sandbox');
  const [paymentUpiId, setPaymentUpiId] = useState('8790729816-4@ybl');
  const [paymentHolder, setPaymentHolder] = useState('Local Bandi Multi Services');

  // --- FOUNDER CONTROL PANEL STATES ---
  const [banners, setBanners] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dispatchConfig, setDispatchConfig] = useState<any>({ autoAssign: true });

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', description: '', image: '', route: 'restaurant', status: 'active'
  });

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', status: 'active'
  });

  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5, comment: ''
  });

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [branchForm, setBranchForm] = useState({
    id: '', name: '', city: 'Khammam', revenue: 0, status: 'Active', adminEmail: ''
  });

  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<string | null>(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: '', price: '', isActive: true, description: '', phone: ''
  });

  // Marriage bureau management states
  const [marriageProfiles, setMarriageProfiles] = useState<any[]>([]);
  const [editingMarriageProfile, setEditingMarriageProfile] = useState<any | null>(null);
  const [marriageSearchQuery, setMarriageSearchQuery] = useState('');

  // Real Estate management states
  const [properties, setProperties] = useState<any[]>([]);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [realEstateSearchQuery, setRealEstateSearchQuery] = useState('');

  // Authentication validation
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Master high-security validation passcode (Standard passcode '1122' or '7416')
    if (adminPasscode === '1122' || adminPasscode === '7416' || isFbSuperAdmin) {
      localStorage.setItem('local_admin_sessions_authorized', 'true');
      localStorage.setItem('admin_session_active', 'true');
      setIsAdminAuthenticated(true);
      setAuthError('');
      triggerToast('🔑 Secure Session Authorized Successfully');
    } else {
      setAuthError('❌ Invalid high-security authorization master passcode.');
      setIsAdminAuthenticated(false);
    }
  };

  const handleAdminLogout = async () => {
    localStorage.removeItem('local_admin_sessions_authorized');
    localStorage.removeItem('admin_session_active');
    setIsAdminAuthenticated(false);
    setAdminPasscode('');
    triggerToast('🔒 Session closed securely');
  };

  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleSaveSmsConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'sms_config'), {
        provider: smsProvider,
        apiKey: smsApiKey,
        senderId: smsSenderId,
        updatedAt: new Date().toISOString()
      });
      triggerToast('📲 SMS OTP transmitter settings synced successfully!');
    } catch (err: any) {
      triggerToast('❌ Error saving SMS configuration.');
    }
  };

  const handleSavePaymentConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'payment_config'), {
        gateway: paymentGateway,
        mode: paymentMode,
        upiId: paymentUpiId,
        accountHolder: paymentHolder,
        updatedAt: new Date().toISOString()
      });
      triggerToast('💰 UPI / Card Payment routing parameters updated!');
    } catch (err: any) {
      triggerToast('❌ Error saving Payment configuration.');
    }
  };

  // real-time synchronization of databases
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    // 1. Sync Vendors
    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVendors(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'vendors');
    });

    // 2. Sync Riders
    const unsubRiders = onSnapshot(collection(db, 'deliveryPartners'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRiders(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'deliveryPartners');
    });

    // 3. Sync Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      if (snap.empty) {
        // Automatically seed first 30 products into Firestore if database is empty
        PRODUCTS.slice(0, 30).forEach(async (p) => {
          const productData = p as any;
          await setDoc(doc(db, 'products', p.id), {
            ...productData,
            isAvailable: productData.isAvailable ?? true,
            vendorId: productData.vendorId || 'admin-store',
            branchId: productData.branchId || 'khammam_main',
            createdAt: new Date().toISOString()
          }).catch(e => console.warn("Failed seeding product:", p.id, e));
        });
        return;
      }
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    // 4. Sync Hospital prices configuration settings with automatic default seeder fallback
    const unsubHospitals = onSnapshot(doc(db, 'settings', 'hospital_prices'), (snap) => {
      if (snap.exists() && Object.keys(snap.data() || {}).length > 0) {
        setHospitalPrices(snap.data());
      } else {
        const defaultHospitals = {
          'Govt Hospital': { price: 0, isActive: true, description: 'General government health clinic, consulting and diagnostics OP center.', phone: '08742-224522' },
          'KIMS Hospital': { price: 300, isActive: true, description: 'Premium multi-specialty regional super specialty diagnosis consulting.', phone: '9123456789' },
          'Mamatha Hospital': { price: 200, isActive: true, description: 'Charity trust medical teaching college, operational OP.', phone: '9876543215' },
          'Prathima Hospital': { price: 250, isActive: true, description: 'Clinical emergency triage, wellness outpatient consultations.', phone: '9988776655' }
        };
        setHospitalPrices(defaultHospitals);
        // Safely write default configuration to Firestore
        setDoc(doc(db, 'settings', 'hospital_prices'), defaultHospitals)
          .catch(e => console.warn("Auto-seeding default hospital prices failed:", e));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/hospital_prices');
    });

    // 5. Sync Promo Codes and Auto-Publish array for Customer app checkout fallback
    const unsubPromo = onSnapshot(collection(db, 'promoCodes'), (snap) => {
      if (snap.empty) {
        const defaultPromo = [
          { id: 'LOKAL100', code: 'LOKAL100', type: 'flat', value: 100, minOrder: 400, description: 'Lokal flat discount coupon', status: 'active', createdAt: new Date().toISOString() },
          { id: 'FESTIVE20', code: 'FESTIVE20', type: 'percentage', value: 20, minOrder: 500, description: 'Festive special discount coupon', status: 'active', createdAt: new Date().toISOString() },
          { id: 'WELCOME30', code: 'WELCOME30', type: 'flat', value: 30, minOrder: 150, description: 'Welcome coupon for first time order', status: 'active', createdAt: new Date().toISOString() }
        ];
        defaultPromo.forEach(async (codeDoc) => {
          await setDoc(doc(db, 'promoCodes', codeDoc.id), codeDoc)
            .catch(e => console.warn("Failed seeding promo code:", codeDoc.id, e));
        });
        return;
      }

      const rawList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPromoCodes(rawList);

      // Map format with dual properties to satisfy both AdminPortal and Home/App checkout
      const homeFormattedList = rawList.map((item: any) => ({
        id: item.code || item.id,
        type: item.type === 'percentage' ? 'percent' : 'flat',
        value: Number(item.value) || 0,
        label: `${item.type === 'percentage' ? item.value + '%' : '₹' + item.value} LOKAL PROMO`,
        minSubtotal: Number(item.minOrder || item.minSubtotal) || 0,
        isActive: item.status === 'active' || item.isActive === true
      }));

      // Set the dynamic configuration document
      setDoc(doc(db, 'settings', 'promo_codes'), { list: homeFormattedList })
        .catch(err => console.warn("Failed syncing formatted list to settings/promo_codes:", err));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'promoCodes');
    });

    // 6. Sync Support chats
    const unsubChats = onSnapshot(collection(db, 'support_chats'), (snap) => {
      setSupportChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'support_chats');
    });

    // 6.b Sync Dynamic Categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      if (snap.empty) {
        CATEGORIES.forEach(async (cat) => {
          await setDoc(doc(db, 'categories', cat.id), {
            ...cat,
            createdAt: new Date().toISOString()
          }).catch(e => console.warn("Failed seeding category:", cat.id, e));
        });
        return;
      }
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'categories');
    });

    // 7. Sync orders for quick metrics helper
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      let revenue = 0;
      let active = 0;
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.total) revenue += Number(d.total) || 0;
        if (['Pending', 'Preparing', 'On Trip'].includes(d.status)) active++;
      });
      setStats(prev => ({
        ...prev,
        activeOrders: active,
        totalSales: revenue
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    // 8. Sync Banners
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snap) => {
      if (snap.empty) {
        const defaultBans = [
          { 
            id: 'ban_103', 
            type: 'top',
            title: 'Careful Travel Drivers', 
            sub: 'Safe Car & Bus Rentals for All Vehicles', 
            desc: 'Professional drivers we have for halting as you wish',
            color: 'bg-slate-900', 
            img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
            categoryId: 'travel',
            cta: 'Book Driver',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_101', 
            type: 'top',
            title: 'Fresh Farm Milk', 
            sub: 'Direct from local farms to your home', 
            color: 'bg-blue-600', 
            img: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=800&q=80',
            productId: 'd1',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_102', 
            type: 'top',
            title: 'Mineral Water 20L', 
            sub: 'Pure & Certified Quality', 
            color: 'bg-cyan-600', 
            img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
            productId: 'w1',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_201', 
            type: 'bottom',
            title: 'Expert Maid Services', 
            sub: 'Experienced Cooks & Sweepers', 
            color: 'bg-emerald-600', 
            img: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=800&q=80',
            categoryId: 'maids',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_202', 
            type: 'bottom',
            title: 'Maintenance Pro', 
            sub: 'Electricians, Plumbers, Painters', 
            color: 'bg-orange-600', 
            img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
            categoryId: 'services',
            createdAt: new Date().toISOString()
          }
        ];
        defaultBans.forEach(async (b) => {
          await setDoc(doc(db, 'banners', b.id), b)
            .catch(e => console.warn("Failed seeding banner:", b.id, e));
        });
        return;
      }
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to banners:", err);
    });

    // 9. Sync Reviews
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to reviews:", err);
    });

    // 10. Sync Branches
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to branches:", err);
    });

    // 11. Sync Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to users:", err);
    });

    // 12. Full Orders Sync for Dispatch Overrides
    const unsubOrdersFull = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to full orders:", err);
    });

    // 13. Sync Dispatch Automation Toggle Config
    const unsubDispatchConfig = onSnapshot(doc(db, 'settings', 'dispatch_config'), (snap) => {
      if (snap.exists()) {
        setDispatchConfig(snap.data());
      } else {
        setDispatchConfig({ autoAssign: true });
      }
    }, (err) => {
      console.warn("Failed to subscribe to dispatch configuration:", err);
    });

    // 14. Sync Marriage Profiles
    const unsubMarriage = onSnapshot(collection(db, 'marriageProfiles'), (snap) => {
      setMarriageProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to marriageProfiles:", err);
    });

    // 14b. Sync Real Estate properties
    const unsubProperties = onSnapshot(collection(db, 'properties'), (snap) => {
      setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to properties:", err);
    });

    // 15. Sync Audit Logs
    const unsubAuditLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setAuditLogs(list);
    }, (err) => {
      console.warn("Audit logs error:", err);
    });

    // 16. Sync SMS Settings
    const unsubSmsConfig = onSnapshot(doc(db, 'settings', 'sms_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.provider) setSmsProvider(data.provider);
        if (data.apiKey) setSmsApiKey(data.apiKey);
        if (data.senderId) setSmsSenderId(data.senderId);
      }
    });

    // 17. Sync Payment Settings
    const unsubPayConfig = onSnapshot(doc(db, 'settings', 'payment_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.gateway) setPaymentGateway(data.gateway);
        if (data.mode) setPaymentMode(data.mode);
        if (data.upiId) setPaymentUpiId(data.upiId);
        if (data.accountHolder) setPaymentHolder(data.accountHolder);
      }
    });

    return () => {
      unsubVendors();
      unsubRiders();
      unsubProducts();
      unsubHospitals();
      unsubPromo();
      unsubChats();
      unsubCategories();
      unsubOrders();
      unsubBanners();
      unsubReviews();
      unsubBranches();
      unsubUsers();
      unsubOrdersFull();
      unsubDispatchConfig();
      unsubMarriage();
      unsubAuditLogs();
      unsubSmsConfig();
      unsubPayConfig();
      unsubProperties();
    };
  }, [isAdminAuthenticated]);

  // Derive counts and updates for local metrics overview
  useEffect(() => {
    const pendVendors = vendors.filter(v => v.status === 'Pending').length;
    const pendRiders = riders.filter(r => r.status === 'Pending').length;
    setStats(prev => ({
      ...prev,
      totalVendors: vendors.length,
      totalRiders: riders.length,
      pendingVendors: pendVendors,
      pendingRiders: pendRiders,
      systemMode: isMaintenanceMode ? 'Maintenance 🛠️' : 'Live Operations ⚡'
    }));
  }, [vendors, riders, isMaintenanceMode]);

  // --- AUTOMATED DISPATCH ASSIGNMENT SERVICE & TIME HANDLERS ---
  const handleAutoReassignOrder = async (orderId: string, currentRiderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Find other online and approved riders
      const onlineRiders = riders.filter(r => r.isOnline && r.status === 'Approved' && r.id !== currentRiderId);
      if (onlineRiders.length === 0) {
        console.warn(`[Auto-Assign Service] No other active online pilots for Order #${orderId.slice(0, 4)}`);
        return;
      }

      // Compute closest available rider (using deliveryLocation or fallback)
      const oLat = order.deliveryLocation?.lat || order.lat || 17.2473;
      const oLng = order.deliveryLocation?.lng || order.lng || 80.1514;

      let closestRider: any = null;
      let minDistance = Infinity;

      onlineRiders.forEach(r => {
        const rLat = r.lat || r.coordinates?.lat || r.location?.lat || 17.2473;
        const rLng = r.lng || r.coordinates?.lng || r.location?.lng || 80.1514;
        const dist = Math.sqrt(Math.pow(rLat - oLat, 2) + Math.pow(rLng - oLng, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closestRider = r;
        }
      });

      if (closestRider) {
        await updateDoc(doc(db, 'orders', order.id), {
          riderId: closestRider.id,
          deliveryPartnerId: closestRider.id,
          riderName: closestRider.name,
          deliveryPartnerName: closestRider.name,
          riderPhone: closestRider.phone || '9876543210',
          deliveryPartnerPhone: closestRider.phone || '9876543210',
          status: 'Assigned',
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        triggerToast(`⚡ Dispatch Timeout: Reassigned order #${order.id.slice(0, 4)} to closest rider: ${closestRider.name}`);
      }
    } catch (e) {
      console.error("[Auto-Assign Service ERROR]:", e);
    }
  };

  // Run periodic checks for orders which have been pending/assigned for more than 15 minutes
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const interval = setInterval(() => {
      const fifteenMinutesMs = 15 * 60 * 1000;
      const now = Date.now();

      orders.forEach(ord => {
        const hasRider = !!(ord.riderId || ord.deliveryPartnerId);
        const isPendingAssigned = ord.status === 'Pending' || ord.status === 'Assigned';

        if (hasRider && isPendingAssigned) {
          const lastActiveTimeRef = ord.assignedAt || ord.updatedAt || ord.timestamp || ord.createdAt;
          if (lastActiveTimeRef) {
            let lastActiveMs = now;
            try {
              if (lastActiveTimeRef.seconds) {
                lastActiveMs = lastActiveTimeRef.seconds * 1000;
              } else if (typeof lastActiveTimeRef.toMillis === 'function') {
                lastActiveMs = lastActiveTimeRef.toMillis();
              } else {
                lastActiveMs = new Date(lastActiveTimeRef).getTime();
              }
            } catch (_) {
              lastActiveMs = now;
            }

            const elapsed = now - lastActiveMs;
            if (elapsed > fifteenMinutesMs) {
              const rId = ord.riderId || ord.deliveryPartnerId;
              handleAutoReassignOrder(ord.id, rId);
            }
          }
        }
      });
    }, 15000); // scan every 15 seconds

    return () => clearInterval(interval);
  }, [orders, riders, isAdminAuthenticated]);

  // Bulk Dispatch updates
  const handleExecuteBulkAssign = async (riderId: string) => {
    if (!riderId || bulkSelectedOrderIds.length === 0) return;
    const selectedRider = riders.find(r => r.id === riderId);
    if (!selectedRider) return;

    try {
      const batchPromises = bulkSelectedOrderIds.map(orderId => {
        return updateDoc(doc(db, 'orders', orderId), {
          riderId: selectedRider.id,
          deliveryPartnerId: selectedRider.id,
          riderName: selectedRider.name,
          deliveryPartnerName: selectedRider.name,
          riderPhone: selectedRider.phone || '9876543210',
          deliveryPartnerPhone: selectedRider.phone || '9876543210',
          status: 'Preparing', // Move to preparing so the rider gets it instantly
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(batchPromises);
      triggerToast(`✓ Bulk Dispatched ${bulkSelectedOrderIds.length} orders to ${selectedRider.name}`);
      setBulkSelectedOrderIds([]);
    } catch (err) {
      console.error(err);
      triggerToast(`❌ Bulk assignment failed`);
    }
  };

  // System mode updates
  const handleToggleMaintenance = async () => {
    try {
      const nextMode = !isMaintenanceMode;
      localStorage.setItem('lokal_maintenance_mode', String(nextMode));
      setIsMaintenanceMode(nextMode);
      window.dispatchEvent(new CustomEvent('maintenance_mode_changed', { detail: nextMode }));
      
      // Update config settings under settings db node as well
      await setDoc(doc(db, 'settings', 'system_maintenance'), {
        isUnderMaintenance: nextMode,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'Master Admin Node'
      }, { merge: true });

      triggerToast(`🚨 System Mode Toggled to ${nextMode ? 'DOWNTIME' : 'LIVE CONSOLE'}`);
    } catch (e) {
      console.error(e);
      alert('Error updating database configs');
    }
  };

  // Vendor approvals & suspensions operations
  const handleUpdateVendorStatus = async (id: string, status: 'Approved' | 'Banned' | 'Pending') => {
    try {
      await updateDoc(doc(db, 'vendors', id), { status });
      triggerToast(`✓ Vendor status updated to: ${status}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Rider approvals & status operations
  const handleUpdateRiderStatus = async (id: string, status: 'Approved' | 'Banned' | 'Pending', isOnline?: boolean) => {
    try {
      const updates: any = { status };
      if (typeof isOnline === 'boolean') {
        updates.isOnline = isOnline;
        updates.status = isOnline ? 'Online' : 'Offline';
      }
      await updateDoc(doc(db, 'deliveryPartners', id), updates);
      triggerToast(`✓ Rider status updated successfully`);
    } catch (err) {
      console.error(err);
    }
  };

  // Payout updates helper
  const handleSettleRiderCash = async (riderId: string) => {
    try {
      await updateDoc(doc(db, 'deliveryPartners', riderId), {
        cashInHand: 0,
        earnings: 0,
        trips: 0
      });
      triggerToast(`💸 Cash in hand cleared & finalized for payment`);
    } catch (err) {
      console.error(err);
    }
  };

  // --- FOUNDER PANEL HANDLERS (BANNERS, PROMOS, REVIEWS, BRANCHES, DISPATCH, HOSPITALS) ---

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), {
          title: bannerForm.title.trim(),
          description: bannerForm.description.trim(),
          image: bannerForm.image.trim(),
          route: bannerForm.route,
          status: bannerForm.status,
          updatedAt: serverTimestamp()
        });
        triggerToast('✓ Banner saved successfully');
      } else {
        await addDoc(collection(db, 'banners'), {
          title: bannerForm.title.trim(),
          description: bannerForm.description.trim(),
          image: bannerForm.image.trim(),
          route: bannerForm.route,
          status: bannerForm.status,
          createdAt: serverTimestamp()
        });
        triggerToast('✓ Created new promotional slide banner');
      }
      setShowBannerModal(false);
      setEditingBanner(null);
      setBannerForm({ title: '', description: '', image: '', route: 'restaurant', status: 'active' });
    } catch (e) {
      console.error(e);
      alert('Error updating brochure banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Permanently delete this promotional slide?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      triggerToast('✓ Brochure slide deleted successfully');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code.trim() || !promoForm.value) return;
    try {
      const codeId = promoForm.code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      const pData = {
        code: codeId,
        type: promoForm.type,
        value: Number(promoForm.value),
        minOrder: Number(promoForm.minOrder || 0),
        maxDiscount: Number(promoForm.maxDiscount || 9999),
        status: promoForm.status,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'promoCodes', codeId), pData);
      triggerToast(`✓ Promo code ${codeId} saved and published`);
      
      setShowPromoModal(false);
      setEditingPromo(null);
      setPromoForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', status: 'active' });
    } catch (e) {
      console.error(e);
      alert('Failed saving promo coupon');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'promoCodes', id));
      triggerToast('✓ Promo code has been deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReviewModerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      await updateDoc(doc(db, 'reviews', editingReview.id), {
        comment: reviewForm.comment.trim(),
        rating: Number(reviewForm.rating),
        moderatedAt: serverTimestamp()
      });
      triggerToast('✓ Review comment moderated successfully');
      setEditingReview(null);
    } catch (e) {
      console.error(e);
      alert('Review update failed');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Remove this review and star-rating from customer log?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      triggerToast('✓ Review comment deleted from record');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.id.trim() || !branchForm.name.trim()) return;
    try {
      const bId = branchForm.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      const bData = {
        id: bId,
        name: branchForm.name.trim(),
        city: branchForm.city.trim(),
        revenue: Number(branchForm.revenue || 0),
        status: branchForm.status,
        adminEmail: branchForm.adminEmail.trim(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'branches', bId), bData);
      triggerToast(`✓ Franchise Branch ${branchForm.name} operationalized!`);
      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchForm({ id: '', name: '', city: 'Khammam', revenue: 0, status: 'Active', adminEmail: '' });
    } catch (e) {
      console.error(e);
      alert('Failed to configure franchise branch');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to permanently disable and delete this Franchise/Pranchege?')) return;
    try {
      await deleteDoc(doc(db, 'branches', id));
      triggerToast('✓ Franchise hub records purged');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAutoDispatch = async () => {
    try {
      const nextMode = !dispatchConfig.autoAssign;
      await setDoc(doc(db, 'settings', 'dispatch_config'), {
        autoAssign: nextMode,
        updatedAt: serverTimestamp()
      });
      triggerToast(`📡 Dispatch allocation set to ${nextMode ? 'AUTOMATED RUNTIME' : 'MANUAL ROUTING'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualAssignOrder = async (orderId: string, riderId: string) => {
    if (!riderId) return;
    try {
      const selectedRider = riders.find(r => r.id === riderId);
      await updateDoc(doc(db, 'orders', orderId), {
        riderId,
        deliveryPartnerId: riderId,
        riderName: selectedRider?.name || 'Assigned Driver',
        deliveryPartnerName: selectedRider?.name || 'Assigned Driver',
        riderPhone: selectedRider?.phone || '9876543210',
        deliveryPartnerPhone: selectedRider?.phone || '9876543210',
        status: 'Preparing', // Instantly dispatch item
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Order manually dispatched & accepted on behalf of ${selectedRider?.name}`);
    } catch (e) {
      console.error(e);
      alert('Routing overrides dispatcher assign failed');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Accepted',
        adminAccepted: true,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Order accepted and routed to dispatch.`);
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to accept order.`);
    }
  };

  const handleCancelOrderEx = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✕ Order has been cancelled.`);
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to cancel order.`);
    }
  };

  const handleUpdateOrderStatusEx = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        adminAccepted: true,
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Status manual override: ${newStatus}`);
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to update status.`);
    }
  };

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalForm.name.trim()) return;
    try {
      const hName = hospitalForm.name.trim();
      const updated = {
        ...hospitalPrices,
        [hName]: {
          price: Number(hospitalForm.price) || 0,
          isActive: hospitalForm.isActive,
          description: hospitalForm.description.trim(),
          phone: hospitalForm.phone.trim()
        }
      };
      await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      triggerToast(`✓ Hospital ${hName} saved dynamically`);
      setShowHospitalModal(false);
      setEditingHospital(null);
      setHospitalForm({ name: '', price: '', isActive: true, description: '', phone: '' });
    } catch (e) {
      console.error(e);
      alert('Failed saving hospital registry');
    }
  };

  const handleDeleteHospitalObj = async (name: string) => {
    if (!confirm(`Delete ${name} hospital from master clinical directory?`)) return;
    try {
      const updated = { ...hospitalPrices };
      delete updated[name];
      await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      triggerToast('✓ Deleted hospital from active networks successfully');
    } catch (e) {
      console.error(e);
    }
  };

  // --- Marriage Profiles Handlers ---
  const handleApproveMarriageProfile = async (id: string) => {
    try {
      await updateDoc(doc(db, 'marriageProfiles', id), {
        isApproved: true,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Profile Approved Successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to approve profile.");
    }
  };

  const handleRejectMarriageProfile = async (id: string) => {
    if (confirm("Reject and Delete this profile permanently?")) {
      try {
        await deleteDoc(doc(db, 'marriageProfiles', id));
        triggerToast("✓ Profile Rejected & Removed successfully.");
      } catch (err) {
        console.error(err);
        triggerToast("❌ Failed to reject profile.");
      }
    }
  };

  const handleSuspendMarriageProfile = async (id: string, name: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "Suspend" : "Unsuspend";
    if (confirm(`${actionText} profile for ${name}?`)) {
      try {
        await updateDoc(doc(db, 'marriageProfiles', id), {
          isApproved: !currentStatus,
          updatedAt: serverTimestamp()
        });
        triggerToast(`✓ Profile ${actionText}ed successfully!`);
      } catch (err) {
        console.error(err);
        triggerToast(`❌ Failed to ${actionText.toLowerCase()} profile.`);
      }
    }
  };

  const handleSaveMarriageProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarriageProfile) return;
    try {
      await updateDoc(doc(db, 'marriageProfiles', editingMarriageProfile.id), {
        ...editingMarriageProfile,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Marriage Profile Updated Successfully!");
      setEditingMarriageProfile(null);
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to update marriage profile.");
    }
  };

  // --- Real Estate Property Handlers ---
  const handleApproveProperty = async (id: string) => {
    try {
      await updateDoc(doc(db, 'properties', id), {
        isApproved: true,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Property Listing Approved Successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to approve property listing.");
    }
  };

  const handleRejectProperty = async (id: string) => {
    if (confirm("Reject and Suspend this property listing? This sets approved to false.")) {
      try {
        await updateDoc(doc(db, 'properties', id), {
          isApproved: false,
          updatedAt: serverTimestamp()
        });
        triggerToast("✓ Property Listing Suspended & Unapproved successfully.");
      } catch (err) {
        console.error(err);
        triggerToast("❌ Failed to suspend property.");
      }
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Delete this property listing permanently? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        triggerToast("✓ Property Listing Deleted permanently.");
      } catch (err) {
        console.error(err);
        triggerToast("❌ Failed to delete property listing.");
      }
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    try {
      await updateDoc(doc(db, 'properties', editingProperty.id), {
        ...editingProperty,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Property Listing Updated Successfully!");
      setEditingProperty(null);
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to update property listing.");
    }
  };

  // Chat reply handlers
  const handleSendChatMessage = async () => {
    if (!activeChat || !chatMessage.trim()) return;
    try {
      const msgData = {
        senderId: 'admin',
        text: chatMessage,
        createdAt: new Date().toISOString(),
        senderName: 'Lokal Master Admin'
      };
      
      const chatRef = doc(db, 'chats', activeChat.id);
      const chatDoc = await getDoc(chatRef);
      const currentMessages = chatDoc.exists() ? (chatDoc.data().messages || []) : [];
      
      await setDoc(chatRef, {
        messages: [...currentMessages, msgData],
        lastMessage: chatMessage,
        updatedAt: serverTimestamp(),
        unreadCountStatus: 0
      }, { merge: true });

      setChatMessage('');
      triggerToast('✓ Reply dispatched successfully.');
    } catch (e) {
      console.error(e);
    }
  };

  // Hospital OP price settings updates
  const handleUpdateHospitalPrice = async (name: string, price: number, isActive: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'hospital_prices'), {
        [name]: { price, isActive }
      }, { merge: true });
      triggerToast('✓ Medical OP prices saved successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Category Management Handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id.trim() || !categoryForm.name.trim()) return;
    try {
      const catId = categoryForm.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      const data = {
        id: catId,
        name: categoryForm.name.trim(),
        icon: categoryForm.icon.trim() || 'ShoppingBag',
        color: categoryForm.color.trim() || 'bg-emerald-50',
        image: categoryForm.image.trim() || '',
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'categories', catId), data);
      triggerToast(editingCategory ? '✓ Category details updated' : '🎉 New Category added successfully');

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ id: '', name: '', icon: 'ShoppingBag', color: 'bg-emerald-50', image: '' });
    } catch (err) {
      console.error(err);
      alert('Error updating category database');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category? Items might become unclassified.")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      triggerToast('🗑️ Category deleted from database');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategoryClick = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({
      id: cat.id || '',
      name: cat.name || '',
      icon: cat.icon || 'ShoppingBag',
      color: cat.color || 'bg-emerald-50',
      image: cat.image || ''
    });
    setShowCategoryModal(true);
  };

  // Inventory Save Handlers
  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: itemForm.name,
        price: Number(itemForm.price),
        unit: itemForm.unit,
        category: itemForm.category,
        image: itemForm.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        description: itemForm.description,
        isAvailable: itemForm.isAvailable,
        vendorId: itemForm.vendorId || 'admin-store',
        branchId: itemForm.branchId || 'khammam_main',
        updatedAt: serverTimestamp()
      };

      // Set optional edit values if provided
      if (itemForm.originalPrice) {
        data.originalPrice = Number(itemForm.originalPrice);
      } else {
        data.originalPrice = null;
      }

      if (itemForm.subCategory) {
        data.subCategory = itemForm.subCategory;
      } else {
        data.subCategory = '';
      }

      if (itemForm.stock) {
        data.stock = Number(itemForm.stock);
      } else {
        data.stock = null;
      }

      const activeVendorProfile = vendors.find(v => v.id === itemForm.vendorId);
      if (activeVendorProfile) {
        data.hotelName = activeVendorProfile.businessName || activeVendorProfile.name || '';
      }

      if (editingItem) {
        await updateDoc(doc(db, 'products', editingItem.id), data);
        triggerToast('✓ Item updated in catalog');
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp()
        });
        triggerToast('🎉 New listing added to catalog');
      }

      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({
        name: '', price: '', originalPrice: '', unit: '', category: 'groceries', 
        image: '', description: '', isAvailable: true, vendorId: 'admin-store', branchId: 'khammam_main',
        subCategory: '', stock: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error updating catalog database');
    }
  };

  // Delete inventory catalog item
  const handleDeleteCatalogItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing permanently from the database?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      triggerToast('🗑️ Listing deleted from database');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCatalogItemClick = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      price: String(item.price || ''),
      originalPrice: item.originalPrice ? String(item.originalPrice) : '',
      unit: item.unit || '',
      category: item.category || 'groceries',
      image: item.image || '',
      description: item.description || '',
      isAvailable: item.isAvailable ?? true,
      vendorId: item.vendorId || 'admin-store',
      branchId: item.branchId || 'khammam_main',
      subCategory: item.subCategory || '',
      stock: item.stock ? String(item.stock) : ''
    });
    setShowItemModal(true);
  };

  // Chart statistics configuration
  const chartData = [
    { name: 'Active Onboard', Merchants: vendors.length, Riders: riders.length },
    { name: 'Pending Review', Merchants: stats.pendingVendors, Riders: stats.pendingRiders },
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 font-sans text-white flex flex-col justify-between p-8 relative overflow-hidden">
        {/* Background ambient lock */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

        <div className="my-auto space-y-8 max-w-sm w-full mx-auto relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-400/10 border-2 border-yellow-400/20 rounded-[2.2rem] flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-yellow-500">Local Bandi Multi Services</p>
            <h2 className="text-3xl font-black italic tracking-tighter leading-none mt-1 uppercase">MASTER SECURITY</h2>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-wide font-medium leading-relaxed">
              Standalone master administration terminal. This system demands dual-layered clearance credentials.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-2xl">
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Admin Passcode</label>
              <input 
                type="password" 
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-center text-xl font-black tracking-widest text-yellow-400 focus:outline-none focus:border-yellow-400/50 transition-all"
              />
            </div>

            {authError && <p className="text-rose-500 text-[10px] font-black uppercase text-center leading-relaxed">{authError}</p>}

            <button 
              type="submit"
              className="w-full py-4.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-900/10 active:scale-95"
            >
              Verify System Passcode
            </button>
          </form>

          {user && (
            <div className="flex justify-center">
              <button 
                onClick={logout}
                className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Change Authenticated Account
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">
          Standalone Control Node &bull; Secured with SHA-256
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-white flex flex-col justify-between">
      {/* Dynamic Toast notifications */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] bg-slate-900 border border-yellow-400/20 px-6 py-4.5 rounded-full shadow-2xl flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-100">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Admin Navigation Header */}
      <div className="bg-slate-900/90 border-b border-white/5 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
            <img src="/src/assets/images/lokal_bharath_logo_1777014931353.png" className="w-full h-full object-cover" alt="Local Bandi Logo" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none uppercase">Master Admin Console</h1>
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Khammam Platform Administrator</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['dashboard', 'logistics', 'approvals', 'marriage', 'real_estate', 'catalog', 'vendors', 'riders', 'chat', 'systems', 'founder'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-yellow-400 text-slate-900 shadow-md shadow-yellow-950/20' : 'bg-slate-950/45 hover:bg-slate-850 text-slate-400 border border-white/5'}`}
            >
              {tab}
            </button>
          ))}

          <button 
            onClick={handleAdminLogout}
            className="p-2.5 bg-rose-500/15 border border-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            title="Settle Admin Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Terminal Contents body */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* TAB 1: DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Laptop className="w-32 h-32" />
              </div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1 italic">Authorized session node</p>
              <h2 className="text-xl font-black italic tracking-tight">Enterprise Overview Console</h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xl">
                This panel aggregates key performance signals, merchant onboarding application arrays, and online delivery agent data across all branches.
              </p>
            </div>

            {/* Micro details metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Database Revenue</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-emerald-400">₹{stats.totalSales.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Deliveries</p>
                <span className="text-2xl font-black text-indigo-400">{stats.activeOrders} Ongoing</span>
              </div>
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Verified Partners</p>
                <span className="text-2xl font-black text-slate-100">{stats.totalVendors + stats.totalRiders} fleet</span>
              </div>
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pending Approvals</p>
                <span className="text-2xl font-black text-yellow-400">{stats.pendingVendors + stats.pendingRiders} profiles</span>
              </div>
            </div>

            {/* 30-Day performance dynamic trends chart */}
            <OrderTrendsChart orders={orders} branches={branches} />

            {/* Chart visualization & Onboarding review quick look block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Onboarding & Approval Metrics</h3>
                <div className="h-64 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <YAxis stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                      <Bar dataKey="Merchants" fill="#818cf8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Riders" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Maintenance & System control fast card */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Global Operations Node</h3>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Status</p>
                      <p className="text-sm font-black text-yellow-400 mt-1">{stats.systemMode}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMaintenanceMode ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      <Power className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Toggling Maintenance blocks customer checkout. Merchants and riders remain online but cannot execute customer deliveries.
                  </p>
                </div>

                <button
                  onClick={handleToggleMaintenance}
                  className={`w-full py-4.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4 ${isMaintenanceMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
                >
                  {isMaintenanceMode ? 'Re-enable Live Systems' : 'Pause Live Systems (Downtime)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1B: LOGISTICS & LIVE ORDERS HUB */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem]">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-yellow-400">
                  <Activity className="w-5 h-5 text-yellow-500 stroke-[2.5] animate-pulse" />
                  <span>Interactive Logistics & Order Dispatch Control Room</span>
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Monitor live platform orders, execute merchant confirmations, and match idle delivery riders using real-time telemetry.
                </p>
              </div>

              {/* General Statistics */}
              <div className="flex gap-4">
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[100px]">
                  <p className="text-[8px] font-black uppercase text-slate-505 tracking-wider">Awaiting Accept</p>
                  <p className="text-sm font-black text-amber-500 mt-0.5">
                    {orders.filter(o => o.status === 'Pending').length}
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[100px]">
                  <p className="text-[8px] font-black uppercase text-slate-505 tracking-wider">In Kitchen / Preparing</p>
                  <p className="text-sm font-black text-indigo-400 mt-0.5">
                    {orders.filter(o => ['Accepted', 'Preparing'].includes(o.status)).length}
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[100px]">
                  <p className="text-[8px] font-black uppercase text-slate-505 tracking-wider">Out for Delivery</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">
                    {orders.filter(o => o.status === 'OutForDelivery' || o.status === 'PickedUp').length}
                  </p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Order List: spans 5 cols */}
              <div className="lg:col-span-5 bg-slate-900 border border-white/5 p-5 rounded-[2.5rem] space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Orders Stream</h3>
                  <span className="px-2 py-0.5 bg-slate-950 text-[8.5px] font-mono text-slate-300 rounded border border-white/5 uppercase">
                    {orders.length} Total
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
                  {(['All', 'Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'] as const).map(f => {
                    const count = f === 'All' ? orders.length : orders.filter(o => {
                      if (f === 'Accepted') return o.status === 'Accepted';
                      if (f === 'Preparing') return o.status === 'Preparing';
                      if (f === 'OutForDelivery') return o.status === 'OutForDelivery' || o.status === 'PickedUp';
                      return o.status === f;
                    }).length;

                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setLogisticsFilter(f);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${logisticsFilter === f ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-950/60 hover:bg-slate-950 text-slate-400 border border-white/5'}`}
                      >
                        {f === 'OutForDelivery' ? 'In Transit' : f} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Bulk Actions Command Center */}
                {(() => {
                  const pendingOrders = orders.filter(o => o.status === 'Pending');
                  const hasPending = pendingOrders.length > 0;
                  
                  return (
                    <div className="bg-slate-950/65 p-3.5 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">Bulk Dispatch Desk</span>
                        {hasPending && (
                          <button
                            type="button"
                            onClick={() => {
                              const pendingIds = pendingOrders.map(o => o.id);
                              const allIncluded = pendingIds.every(id => bulkSelectedOrderIds.includes(id));
                              if (allIncluded) {
                                setBulkSelectedOrderIds(prev => prev.filter(id => !pendingIds.includes(id)));
                              } else {
                                setBulkSelectedOrderIds(prev => Array.from(new Set([...prev, ...pendingIds])));
                              }
                            }}
                            className="text-yellow-400 hover:text-yellow-350 uppercase tracking-widest font-black transition-all cursor-pointer text-[8.5px]"
                          >
                            {pendingOrders.every(o => bulkSelectedOrderIds.includes(o.id)) ? 'Deselect All' : '✓ Select All Pending'}
                          </button>
                        )}
                      </div>

                      {bulkSelectedOrderIds.length > 0 ? (
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 space-y-2.5">
                          <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wide">
                            📦 {bulkSelectedOrderIds.length} Pending Orders Selected
                          </p>

                          <div className="flex flex-col gap-2">
                            <select
                              onChange={(e) => handleExecuteBulkAssign(e.target.value)}
                              defaultValue=""
                              className="bg-slate-950 border border-white/10 px-2.5 py-2 rounded-xl text-[9.5px] font-black uppercase text-white outline-none cursor-pointer"
                            >
                              <option value="" disabled>Choose Dispatch Rider</option>
                              {riders.filter(r => r.status === 'Approved' && r.isOnline).map(r => (
                                <option key={r.id} value={r.id}>{r.name.toUpperCase()} (ONLINE)</option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => setBulkSelectedOrderIds([])}
                              className="w-full py-1.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-xl text-[8px] text-slate-450 font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                              Reset Selected Cache
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                          Engage dispatch overlays by tapping checkboxes on any "Pending" status order card listed below.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Filtered Order feed list */}
                <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                  {orders.filter(o => {
                    if (logisticsFilter === 'All') return true;
                    if (logisticsFilter === 'Accepted') return o.status === 'Accepted';
                    if (logisticsFilter === 'Preparing') return o.status === 'Preparing';
                    if (logisticsFilter === 'OutForDelivery') return o.status === 'OutForDelivery' || o.status === 'PickedUp';
                    return o.status === logisticsFilter;
                  }).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-[10px] uppercase font-bold border border-dashed border-white/5 rounded-2xl">
                      No matching orders found under filter: {logisticsFilter}
                    </div>
                  ) : (
                    orders.filter(o => {
                      if (logisticsFilter === 'All') return true;
                      if (logisticsFilter === 'Accepted') return o.status === 'Accepted';
                      if (logisticsFilter === 'Preparing') return o.status === 'Preparing';
                      if (logisticsFilter === 'OutForDelivery') return o.status === 'OutForDelivery' || o.status === 'PickedUp';
                      return o.status === logisticsFilter;
                    }).map((ord) => {
                      const isSelected = selectedOrderId === ord.id;
                      const hasRider = !!(ord.riderId || ord.deliveryPartnerId);
                      const isPending = ord.status === 'Pending';
                      
                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderId(ord.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${isSelected ? 'bg-slate-950 border-yellow-400/40 shadow-lg shadow-yellow-950/10' : 'bg-slate-950/50 hover:bg-slate-950 border-white/5'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2.5">
                              {/* Checkbox for Bulk Dispatch selection (available when status is Pending) */}
                              {isPending && (
                                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="checkbox"
                                    checked={bulkSelectedOrderIds.includes(ord.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setBulkSelectedOrderIds(prev => 
                                        checked ? [...prev, ord.id] : prev.filter(id => id !== ord.id)
                                      );
                                    }}
                                    className="w-4 h-4 rounded border-white/10 text-indigo-500 bg-slate-950 focus:ring-0 cursor-pointer accent-indigo-500"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-mono font-black text-xs text-white uppercase tracking-tight flex items-center gap-1.5">
                                  <span>Order #{ord.id.slice(0, 8).toUpperCase()}</span>
                                  {isPending && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                  {ord.vendorName || 'Branch Hub'} • ₹{ord.total}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              ord.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                              ['Accepted', 'Preparing'].includes(ord.status) ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                              ['OutForDelivery', 'PickedUp'].includes(ord.status) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                              ord.status === 'Delivered' ? 'bg-slate-500/15 text-slate-450 border border-white/5' :
                              'bg-rose-500/15 text-rose-500 border border-rose-500/10'
                            }`}>
                              {ord.status === 'PickedUp' || ord.status === 'OutForDelivery' ? 'In Transit' : ord.status}
                            </span>
                          </div>

                          {/* 15-Minute Driver Acceptance Timeout Telemetry Bar */}
                          {(() => {
                            if (!hasRider || (ord.status !== 'Pending' && ord.status !== 'Assigned')) return null;
                            const lastActiveTimeRef = ord.assignedAt || ord.updatedAt || ord.timestamp || ord.createdAt;
                            if (!lastActiveTimeRef) return null;
                            let lastActiveMs = Date.now();
                            try {
                              if (lastActiveTimeRef.seconds) {
                                lastActiveMs = lastActiveTimeRef.seconds * 1000;
                              } else if (typeof lastActiveTimeRef.toMillis === 'function') {
                                lastActiveMs = lastActiveTimeRef.toMillis();
                              } else {
                                lastActiveMs = new Date(lastActiveTimeRef).getTime();
                              }
                            } catch (_) {
                              return null;
                            }
                            const elapsedSec = Math.floor((Date.now() - lastActiveMs) / 1000);
                            const elapsedMin = Math.floor(elapsedSec / 60);
                            const percent = Math.min(100, Math.round((elapsedSec / (15 * 60)) * 100));

                            return (
                              <div className="mt-3 p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between text-[8px] font-mono text-rose-300">
                                  <span className="flex items-center gap-1 uppercase">
                                    <AlertCircle className="w-3 h-3 text-rose-450 animate-pulse" />
                                    <span>Acceptance Hold: {elapsedMin}m {elapsedSec % 60}s ({percent}%)</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rId = ord.riderId || ord.deliveryPartnerId;
                                      handleAutoReassignOrder(ord.id, rId);
                                    }}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-sans font-black uppercase text-[7px] transition-all cursor-pointer"
                                    title="Manually force reassign to next closest rider instantly for testing"
                                  >
                                    Re-Assign
                                  </button>
                                </div>
                                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })()}

                          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400">
                            <span>
                              {(ord.orderItems?.length || ord.items || 0)} item{(ord.orderItems?.length || ord.items || 0) !== 1 ? 's' : ''}
                            </span>
                            <span className="font-medium">
                              Rider: <span className={hasRider ? "text-emerald-400 font-bold" : "text-amber-500 font-black animate-pulse"}>
                                {ord.riderName || ord.deliveryPartnerName || '🚨 UNASSIGNED'}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Order Master Detail Panel: spans 7 cols */}
              <div className="lg:col-span-7 space-y-6">
                {/* Real-time Heatmap visualizer displaying pending hotspots & fleet coordinates */}
                <LogisticsHeatmap
                  orders={orders}
                  riders={riders}
                  vendors={vendors}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
                  onDispatchOrderToRider={(orderId, riderId) => handleManualAssignOrder(orderId, riderId)}
                />

                {(() => {
                  const activeOrd = orders.find(o => o.id === selectedOrderId);
                  if (!activeOrd) {
                    return (
                      <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] text-center space-y-3 min-h-[160px] flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-950/60 border border-white/5 flex items-center justify-center text-slate-550 shadow-inner">
                          <Activity className="w-6 h-6 text-slate-500 animate-pulse" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Radar Telemetry Standby</h3>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal font-semibold">
                          Click any thermal hotspot glow point on the interactive map above, or select an order from the list stream to initiate rider matching.
                        </p>
                      </div>
                    );
                  }

                  // Find Best Rider Recommendation
                  // Rule: rider is online (or in approved status), has fewest active ongoing orders
                  const getRiderMetrics = (rider: any) => {
                    const activeCount = orders.filter(o => 
                      (o.riderId === rider.id || o.deliveryPartnerId === rider.id) && 
                      !['Delivered', 'Cancelled'].includes(o.status)
                    ).length;
                    return { activeCount };
                  };

                  const approvedRiders = riders.filter(r => r.status === 'Approved');
                  const onlineRiders = approvedRiders.filter(r => r.isOnline);
                  
                  // Sort online riders by lowest workload
                  let bestRider: any = null;
                  if (onlineRiders.length > 0) {
                    bestRider = [...onlineRiders].sort((a,b) => {
                      return getRiderMetrics(a).activeCount - getRiderMetrics(b).activeCount;
                    })[0];
                  } else if (approvedRiders.length > 0) {
                    // Fallback to offline approved riders
                    bestRider = [...approvedRiders].sort((a,b) => {
                      return getRiderMetrics(a).activeCount - getRiderMetrics(b).activeCount;
                    })[0];
                  }

                  return (
                    <div className="space-y-6 text-left">
                      {/* Section A: Selected Order Details */}
                      <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <div>
                            <span className="text-[9px] font-black text-indigo-400 bg-indigo-505/10 border border-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Active Workspace
                            </span>
                            <h3 className="text-base font-black uppercase text-white mt-2">
                              Order #{activeOrd.id.slice(0, 8).toUpperCase()}
                            </h3>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[8px] font-black text-slate-505 uppercase tracking-widest">Total Transaction Value</span>
                            <p className="text-lg font-black text-emerald-400">₹{activeOrd.total}</p>
                          </div>
                        </div>

                        {/* Customer & Merchant Blocks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Restaurant / Hub</h4>
                            <p className="text-xs font-extrabold text-white">{activeOrd.vendorName || 'Central Hub'}</p>
                            <p className="text-[10px] text-slate-550 font-semibold">{activeOrd.vendorAddress || 'Main branch'}</p>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Delivery Address</h4>
                            <p className="text-xs font-extrabold text-white">{activeOrd.userName || activeOrd.customerName || 'Anonymous Customer'}</p>
                            <p className="text-[10px] text-slate-300 font-medium">{activeOrd.address || 'Standard Handover'}</p>
                            {(activeOrd.phone || activeOrd.userPhone) && (
                              <p className="text-[10px] font-mono text-slate-550 mt-1">📞 {activeOrd.phone || activeOrd.userPhone}</p>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Line Items ({activeOrd.orderItems?.length || activeOrd.items || 0})</h4>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {(activeOrd.orderItems || []).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-white">
                                  {item.name} <span className="text-yellow-400 text-[10px] ml-1">x{item.quantity}</span>
                                </span>
                                <span className="font-bold text-slate-400">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Accept / Control Logic Row for Order Status */}
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {activeOrd.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptOrder(activeOrd.id)}
                              className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-950/20 animate-pulse"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                              <span>Accept & Confirm Order</span>
                            </button>
                          )}

                          {activeOrd.status !== 'Cancelled' && activeOrd.status !== 'Delivered' && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrderEx(activeOrd.id)}
                              className="px-5 py-4 bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border border-rose-500/10 cursor-pointer"
                              title="Cancel platform order immediately"
                            >
                              Cancel Order
                            </button>
                          )}

                          {/* Quick manual overrides and force actions */}
                          <div className="w-full flex items-center gap-2 mt-2 bg-slate-950 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">Status Override:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {['Accepted', 'Preparing', 'OutForDelivery', 'Delivered'].map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateOrderStatusEx(activeOrd.id, st)}
                                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer ${activeOrd.status === st ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'}`}
                                >
                                  {st === 'OutForDelivery' ? 'In Transit' : st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Fleet Assignment (The Best Order Assignment View) */}
                      <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <div>
                            <h4 className="text-sm font-black uppercase text-yellow-400 tracking-tight flex items-center gap-2">
                              <Bike className="w-4 h-4 text-yellow-500" />
                              <span>Dynamic Fleet Dispatch & Rider Matrix</span>
                            </h4>
                            <p className="text-[8.5px] text-slate-500 uppercase tracking-widest font-mono">Real-time matching logs based on online telemetry & task workload</p>
                          </div>

                          {bestRider && (
                            <button
                              type="button"
                              onClick={() => handleManualAssignOrder(activeOrd.id, bestRider.id)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 cursor-pointer"
                            >
                              <span>⚡ Auto-Dispatch {bestRider.name.split(' ')[0]}</span>
                            </button>
                          )}
                        </div>

                        {/* List of Riders with details */}
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {riders.filter(r => r.status === 'Approved').length === 0 ? (
                            <p className="text-center py-6 text-slate-500 text-[9px] font-mono uppercase">No approved delivery riders registered in database</p>
                          ) : (
                            riders.filter(r => r.status === 'Approved').map(rider => {
                              const isOnline = rider.isOnline;
                              const { activeCount } = getRiderMetrics(rider);
                              const isSuggested = bestRider?.id === rider.id;
                              const isCurrentlyAssigned = activeOrd.riderId === rider.id || activeOrd.deliveryPartnerId === rider.id;

                              return (
                                <div
                                  key={rider.id}
                                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                    isCurrentlyAssigned 
                                      ? 'bg-indigo-950/50 border-indigo-500/40' 
                                      : isSuggested 
                                        ? 'bg-slate-950 border-emerald-500/40 shadow-md shadow-emerald-950/5' 
                                        : 'bg-slate-950/70 border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Availability Dot */}
                                    <div className="relative">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-905 text-slate-600 border border-white/5'}`}>
                                        {rider.name.slice(0, 1).toUpperCase()}
                                      </div>
                                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    </div>

                                    <div>
                                      <p className="text-xs font-black text-white flex items-center gap-2">
                                        <span>{rider.name}</span>
                                        {isCurrentlyAssigned && (
                                          <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 text-[8px] font-black uppercase rounded">Assigned</span>
                                        )}
                                        {isSuggested && (
                                          <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[8px] font-black uppercase rounded animate-pulse">🏆 Suggested Match</span>
                                        )}
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span>{rider.phone || 'N/A Phone'}</span>
                                        <span>•</span>
                                        <span className={`font-black ${activeCount === 0 ? 'text-emerald-400' : activeCount === 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                                          {activeCount === 0 ? 'IDLE (0 Active)' : `${activeCount} Ongoing Job${activeCount !== 1 ? 's' : ''}`}
                                        </span>
                                        {isOnline && rider.customStatus && rider.customStatus !== 'Available' && (
                                          <>
                                            <span>•</span>
                                            <span className="text-yellow-400 font-extrabold text-[8px] bg-yellow-400/10 border border-yellow-400/20 px-1 py-0.5 rounded font-mono">
                                              🕒 {rider.customStatus}
                                            </span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleManualAssignOrder(activeOrd.id, rider.id)}
                                    disabled={isCurrentlyAssigned}
                                    className={`px-4.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      isCurrentlyAssigned 
                                        ? 'bg-slate-900 text-slate-555 border border-white/5 cursor-not-allowed' 
                                        : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 hover:shadow-md'
                                    }`}
                                  >
                                    {isCurrentlyAssigned ? 'Assigned' : 'Dispatch'}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTNER APPROVALS HUB */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Onboarding Approval Queues</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Approve registered merchants and logistics crews</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Vendors Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-indigo-400">Pending Merchants ({vendors.filter(v => v.status === 'Pending').length})</h3>
                  <Store className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {vendors.filter(v => v.status === 'Pending').length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending merchant reviews</p>
                    </div>
                  ) : (
                    vendors.filter(v => v.status === 'Pending').map((v) => (
                      <div key={v.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{v.businessName || v.name}</h4>
                            <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-full">{v.service || 'groceries'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">Owner: {v.ownerName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Phone: {v.phone}</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal italic">{v.address || 'Address not listed'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateVendorStatus(v.id, 'Approved')}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateVendorStatus(v.id, 'Banned')}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Riders Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-emerald-400">Pending Riders ({riders.filter(r => r.status === 'Pending').length})</h3>
                  <Bike className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {riders.filter(r => r.status === 'Pending').length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending rider applications</p>
                    </div>
                  ) : (
                    riders.filter(r => r.status === 'Pending').map((r) => (
                      <div key={r.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{r.name}</h4>
                            <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-full">{r.vehicleType || 'Bike'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">Plate Number: {r.vehicleNumber || 'Pending verification'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Phone: {r.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateRiderStatus(r.id, 'Approved', true)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Approve Partner
                          </button>
                          <button 
                            onClick={() => handleUpdateRiderStatus(r.id, 'Banned')}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: MARRIAGE BUREAU MANAGER */}
        {activeTab === 'marriage' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Marriage Bureau Directory</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Profiles: {marriageProfiles.length} | Pending Approval: {marriageProfiles.filter(p => !p.isApproved).length}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, profession..."
                  value={marriageSearchQuery}
                  onChange={(e) => setMarriageSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Profiles Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marriageProfiles.filter(p => {
                const query = marriageSearchQuery.toLowerCase();
                const fullName = `${p.name || ''} ${p.surname || ''}`.toLowerCase();
                return fullName.includes(query) || 
                       (p.profession || '').toLowerCase().includes(query) ||
                       (p.religion || '').toLowerCase().includes(query) ||
                       (p.caste || '').toLowerCase().includes(query);
              }).length === 0 ? (
                <div className="col-span-full text-center py-16 bg-slate-900 border border-white/5 rounded-[2.5rem]">
                  <Heart className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No marriage profiles matched criteria</p>
                </div>
              ) : (
                marriageProfiles.filter(p => {
                  const query = marriageSearchQuery.toLowerCase();
                  const fullName = `${p.name || ''} ${p.surname || ''}`.toLowerCase();
                  return fullName.includes(query) || 
                         (p.profession || '').toLowerCase().includes(query) ||
                         (p.religion || '').toLowerCase().includes(query) ||
                         (p.caste || '').toLowerCase().includes(query);
                }).map((p) => (
                  <div key={p.id} className="bg-slate-905 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                    
                    {/* Corner Status indicator */}
                    <div className="absolute top-4 right-4 z-15">
                      {p.isApproved ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full">
                          Approved
                        </span>
                      ) : (
                        <span className="bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Avatar and Main Info Container */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-slate-950 flex items-center justify-center relative">
                          {p.image ? (
                            <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                          ) : (
                            <Heart className="w-6 h-6 text-slate-705 fill-current" />
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-black text-white text-sm tracking-tight">{p.name} {p.surname}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                            {p.gender || 'Male'} • {p.age || 'N/A'} Years • {p.height || 'N/A'}
                          </p>
                          <p className="text-[9px] font-bold text-yellow-500 tracking-wider uppercase mt-1">
                            {p.profession || 'Self-Employed'}
                          </p>
                        </div>
                      </div>

                      {/* Detail attributes bullet lists */}
                      <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4.5 text-left space-y-2">
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-semibold text-slate-400 font-mono">
                          <div><span className="text-slate-550">RELIGION:</span> {p.religion || 'N/A'}</div>
                          <div><span className="text-slate-550">CASTE:</span> {p.caste || 'N/A'}</div>
                          <div><span className="text-slate-550">STATUS:</span> {p.maritalStatus || 'Unmarried'}</div>
                          <div><span className="text-slate-550">NATIVE:</span> {p.nativePlace || 'Khammam'}</div>
                        </div>

                        <div className="border-t border-white/5 pt-2 mt-1 space-y-1 text-[9px] text-slate-400 uppercase tracking-tighter">
                          <p><span className="text-slate-550">Father:</span> {p.fatherName || 'N/A'} ({p.fatherProfession || 'N/A'})</p>
                          <p><span className="text-slate-550">Mother:</span> {p.motherName || 'N/A'} ({p.motherProfession || 'N/A'})</p>
                          <p className="font-bold text-emerald-400 tracking-normal mt-1 text-[10px] select-all">📞 {p.phone || 'No phone listed'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls button bar */}
                    <div className="flex gap-2 mt-4.5">
                      {!p.isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveMarriageProfile(p.id)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-950/20"
                          >
                            Approve Profile
                          </button>
                          <button
                            onClick={() => setEditingMarriageProfile(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectMarriageProfile(p.id)}
                            className="p-2.5 bg-rose-950/40 border border-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            title="Reject/Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSuspendMarriageProfile(p.id, `${p.name} ${p.surname}`, p.isApproved)}
                            className="flex-1 py-2.5 bg-amber-600/15 border border-amber-500/10 text-amber-400 hover:bg-amber-600 hover:text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Suspend Profile
                          </button>
                          <button
                            onClick={() => setEditingMarriageProfile(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectMarriageProfile(p.id)}
                            className="p-2.5 bg-rose-950/40 border border-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            title="Reject/Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2B: LOKAL REAL ESTATE MANAGER */}
        {activeTab === 'real_estate' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Lokal Real Estate Portals</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Properties: {properties.length} | Pending Verification: {properties.filter(p => !p.isApproved).length}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query area, title, price..."
                  value={realEstateSearchQuery}
                  onChange={(e) => setRealEstateSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Properties Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {properties.filter(p => {
                const query = realEstateSearchQuery.toLowerCase();
                const titleStr = (p.title || '').toLowerCase();
                const descStr = (p.description || '').toLowerCase();
                const areaStr = (p.location?.area || '').toLowerCase();
                return titleStr.includes(query) || descStr.includes(query) || areaStr.includes(query);
              }).length === 0 ? (
                <div className="col-span-full text-center py-16 bg-slate-900 border border-white/5 rounded-[2.5rem]">
                  <Building className="w-10 h-10 text-slate-705 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No real estate catalogs matched query</p>
                </div>
              ) : (
                properties.filter(p => {
                  const query = realEstateSearchQuery.toLowerCase();
                  const titleStr = (p.title || '').toLowerCase();
                  const descStr = (p.description || '').toLowerCase();
                  const areaStr = (p.location?.area || '').toLowerCase();
                  return titleStr.includes(query) || descStr.includes(query) || areaStr.includes(query);
                }).map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-white/5 bg-slate-900/60 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                    {/* Status badge */}
                    <div className="absolute top-4 right-4 z-15">
                      {p.isApproved ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full">
                          Approved LIVE
                        </span>
                      ) : (
                        <span className="bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Image cover */}
                      <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center relative">
                        {p.image ? (
                          <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                        ) : (
                          <Building className="w-10 h-10 text-slate-700" />
                        )}
                        <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur text-yellow-400 px-3 py-1 text-[10px] font-black rounded-lg">
                          ₹{p.price}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-black text-white text-sm tracking-tight truncate">{p.title}</h3>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                          {p.category || 'For Sale'} • {p.type || 'Residential'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.location?.area || 'Unspecified Area'}, {p.location?.city || 'Khammam'}</span>
                        </p>
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 italic font-sans">{p.description}</p>
                      </div>

                      {/* Property Specs badges */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-center text-[9px] font-bold text-slate-400 font-mono">
                        <div>
                          <p className="text-slate-600 text-[8px] uppercase">SQFT</p>
                          <p className="text-white font-black">{p.details?.sqft || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-[8px] uppercase">BDS</p>
                          <p className="text-white font-black">{p.details?.bedrooms || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-[8px] uppercase">FACING</p>
                          <p className="text-white font-black">{p.details?.facing || p.facing || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls button bar */}
                    <div className="flex gap-2 mt-4.5">
                      {!p.isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveProperty(p.id)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-950/20"
                          >
                            Approve Listing
                          </button>
                          <button
                            onClick={() => setEditingProperty(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Listing Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-2.5 bg-slate-950 border border-rose-500/10 text-rose-500 hover:bg-rose-950/70 hover:text-white rounded-xl transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRejectProperty(p.id)}
                            className="flex-1 py-2.5 bg-amber-600/15 border border-amber-500/10 text-amber-500 hover:bg-amber-600 hover:text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Suspend/Reject
                          </button>
                          <button
                            onClick={() => setEditingProperty(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Listing Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-2.5 bg-slate-950 border border-rose-500/10 text-rose-504 hover:bg-rose-950/70 hover:text-white rounded-xl transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM CATALOG / INVENTORY MANAGER */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Consolidated Store Catalogs</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Create, update or delete products globally</p>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto">
                <button
                  onClick={() => setCatalogSubTab('products')}
                  className={`flex-1 sm:flex-none py-2 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${catalogSubTab === 'products' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Products
                </button>
                <button
                  onClick={() => setCatalogSubTab('categories')}
                  className={`flex-1 sm:flex-none py-2 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${catalogSubTab === 'categories' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Categories
                </button>
              </div>

              {catalogSubTab === 'products' ? (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm({
                      name: '', price: '', originalPrice: '', unit: '', category: 'groceries', 
                      image: '', description: '', isAvailable: true, vendorId: 'admin-store', branchId: 'khammam_main',
                      subCategory: '', stock: ''
                    });
                    setShowItemModal(true);
                  }}
                  className="w-full sm:w-auto py-3 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Product</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({
                      id: '', name: '', icon: 'ShoppingBag', color: 'bg-emerald-50', image: ''
                    });
                    setShowCategoryModal(true);
                  }}
                  className="w-full sm:w-auto py-3 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              )}
            </div>

            {catalogSubTab === 'products' ? (
              <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {products.length === 0 ? (
                    <div className="col-span-full text-center p-12">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No custom listings synced in this catalog</p>
                    </div>
                  ) : (
                    products.map((item) => (
                      <div key={item.id} className="bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="aspect-video relative select-none bg-slate-900 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-8 h-8 text-slate-700" />
                          )}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                            <span className="bg-slate-900/90 text-[9px] font-black uppercase tracking-widest text-slate-300 px-2.5 py-1 rounded-full">{item.category}</span>
                            {item.subCategory && (
                              <span className="bg-indigo-900/90 text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full">{item.subCategory}</span>
                            )}
                          </div>
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="px-3 py-1 bg-rose-600 text-white rounded-full font-black uppercase tracking-widest text-[9px]">Out of stock</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-snug line-clamp-1">{item.name}</h4>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-slate-200 text-[12px] font-bold">₹{item.price} per {item.unit}</span>
                              {item.originalPrice && (
                                <span className="text-slate-400 line-through text-[10px] font-bold">₹{item.originalPrice}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic line-clamp-2 mt-2 leading-normal">{item.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2.5 border-t border-white/5 pt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              <span>Vendor: {item.hotelName || item.vendorId || 'Central'}</span>
                              {item.stock !== undefined && item.stock !== null && (
                                <span className="text-amber-400 border-l border-white/10 pl-2">Stock: {item.stock} qty</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCatalogItemClick(item)}
                              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCatalogItem(item.id)}
                              className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {categories.length === 0 ? (
                    <div className="col-span-full text-center p-12">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No categories registered in standard directory</p>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden p-4 flex flex-col justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 text-lg font-black shrink-0 ${cat.color || 'bg-slate-100'}`}>
                            {cat.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-4 line-clamp-1">{cat.name}</h4>
                            <span className="text-[10px] font-bold text-indigo-400 font-mono block mt-1">ID: {cat.id}</span>
                            {cat.color && (
                              <span className="inline-block mt-1 font-mono text-[8px] bg-slate-900/60 border border-white/5 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{cat.color}</span>
                            )}
                          </div>
                        </div>

                        {cat.image && (
                          <div className="aspect-video relative rounded-lg overflow-hidden bg-slate-900">
                            <img src={cat.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                          </div>
                        )}

                        <div className="flex gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => handleEditCategoryClick(cat)}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Edit2 className="w-3 h-3 text-yellow-400" />
                            <span>Modify</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MERCHANT list */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Integrated Store Directory</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Review and manage verified business profiles</p>
            </header>

            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-4.5 px-6">Merchant Store</th>
                      <th className="py-4.5 px-6">Proprietor</th>
                      <th className="py-4.5 px-6">Telephone</th>
                      <th className="py-4.5 px-6">Location</th>
                      <th className="py-4.5 px-6 text-center">Status</th>
                      <th className="py-4.5 px-6 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {vendors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 font-bold uppercase tracking-widest text-[10px]">No store merchants registered</td>
                      </tr>
                    ) : (
                      vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6 font-black text-white uppercase tracking-tight">{v.businessName || v.name}</td>
                          <td className="py-4 px-6">{v.ownerName || 'Unknown Owner'}</td>
                          <td className="py-4 px-6 font-mono text-[11px]">{v.phone}</td>
                          <td className="py-4 px-6 font-medium text-slate-400 line-clamp-1">{v.address || 'Khammam'}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>{v.status || 'Reviewing'}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {v.status === 'Approved' ? (
                              <button 
                                onClick={() => handleUpdateVendorStatus(v.id, 'Banned')}
                                className="px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Suspend Store
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateVendorStatus(v.id, 'Approved')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-950/20"
                              >
                                Approve Store
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RIDER FLEET STATUS */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Active Rider Fleet Control</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verify logins, trip logs, earnings, and cash handovers</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {riders.length === 0 ? (
                <div className="col-span-full text-center p-12 bg-slate-900 border border-white/5 rounded-[2.5rem]">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No registered logistic agents parsed</p>
                </div>
              ) : (
                riders.map((r) => (
                  <div key={r.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-4 flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{r.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${r.status === 'Approved' || r.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-500'}`}>{r.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{r.vehicleType} • Plate: {r.vehicleNumber || 'TS-04'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Primary: {r.phone}</p>
                      {r.isOnline && r.customStatus && r.customStatus !== 'Available' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[8.5px] font-black uppercase rounded font-mono">
                          🕒 {r.customStatus}
                        </div>
                      )}

                      <div className="mt-4 p-4.5 bg-slate-950/60 rounded-2xl border border-white/5 grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Payout</p>
                          <p className="text-sm font-black text-emerald-400 mt-0.5">₹{r.earnings || 0}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cash on Hand (COD)</p>
                          <p className="text-sm font-black text-yellow-500 mt-0.5">₹{r.cashInHand || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSettleRiderCash(r.id)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-indigo-900/10"
                      >
                        Settle & Finalize
                      </button>
                      <button 
                        onClick={() => handleUpdateRiderStatus(r.id, 'Banned')}
                        className="px-3.5 py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        Suspend Rider
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: MULTI-CHANNEL SUPPORT CHAT DESK */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Frictionless Support Desk</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Engage with customers and service providers in real time</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px] bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              
              {/* Chat Directory list */}
              <div className="border-r border-white/5 h-full flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operational Queries</span>
                </div>
                <div className="flex-1 divide-y divide-white/5">
                  {supportChats.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-bold uppercase">No active communication nodes</p>
                  ) : (
                    supportChats.map((chat) => (
                      <div 
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className={`p-4.5 cursor-pointer transition-colors text-left flex justify-between items-center ${activeChat?.id === chat.id ? 'bg-slate-950/80' : 'hover:bg-slate-950/30'}`}
                      >
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{chat.userName || 'Local Guest'}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 leading-normal font-medium">{chat.lastMessage || 'Channel established'}</p>
                        </div>
                        {chat.unreadCountStatus > 0 && (
                          <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center bounce animate-pulse">{chat.unreadCountStatus}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Messages Log Panel */}
              <div className="col-span-2 h-full flex flex-col justify-between bg-slate-950/40 relative">
                {activeChat ? (
                  <>
                    <header className="p-4.5 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                      <div className="text-left">
                        <h4 className="text-sm font-black uppercase text-white tracking-tight">{activeChat.userName}</h4>
                        <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Active Chat Console</span>
                      </div>
                      <button 
                        onClick={() => setActiveChat(null)}
                        className="p-1.5 bg-slate-950 border border-white/5 text-slate-400 hover:text-white rounded-lg"
                      >
                        Close
                      </button>
                    </header>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto h-[350px]">
                      {(activeChat.messages || []).map((msg: any, index: number) => {
                        const isAdminMsg = msg.senderId === 'admin';
                        return (
                          <div 
                            key={index}
                            className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`p-4 rounded-[1.8rem] max-w-sm text-left ${isAdminMsg ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                              <p className="text-xs leading-relaxed font-bold">{msg.text}</p>
                              <span className="text-[8px] font-black uppercase text-slate-400/90 tracking-wider block mt-1.5 text-right">{msg.senderName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick message reply form bar */}
                    <div className="p-4 bg-slate-900 border-t border-white/5 flex gap-3">
                      <input 
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        placeholder="Write support response..."
                        className="flex-1 bg-slate-950 border border-white/10 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-yellow-400/40"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="p-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase transition-all shadow-md active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <HelpCircle className="w-12 h-12 text-slate-700 mb-3" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Select a support ticket channel to reply</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: GLOBAL CODES & MEDICAL SETTINGS */}
        {activeTab === 'systems' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Promo code engine configurator */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-yellow-400">Promo Coupons Database</h3>
                  <Percent className="w-5 h-5 text-yellow-400" />
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto">
                  {promoCodes.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No promo codes registered</p>
                  ) : (
                    promoCodes.map((p) => (
                      <div key={p.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-white tracking-widest">{p.code}</p>
                          <p className="text-[10px] text-slate-400">{p.type === 'percentage' ? `${p.value}% Off` : `₹${p.value} Flat Off`} • Status: {p.status}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest rounded-full">{p.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hospital Consultation Prices Configurator */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-rose-400">Hospital Consultation OPD Prices</h3>
                  <Building className="w-5 h-5 text-rose-400" />
                </div>

                <div className="space-y-3 px-1.5 max-h-[350px] overflow-y-auto">
                  {Object.entries(hospitalPrices).length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No local hospitals in database records</p>
                  ) : (
                    Object.entries(hospitalPrices).map(([name, data]: [string, any]) => (
                      <div key={name} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{name}</p>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">Fee: ₹{data.price ?? 0} • Status: {data.isActive ? 'Online' : 'Offline'}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateHospitalPrice(name, Number(data.price ?? 0), !data.isActive)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${data.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                          >
                            {data.isActive ? 'Deactivate OP' : 'Activate OP'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* SECOND GRID ROW: MASTER INTEGRATIONS CONFIGURATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* SMS Dynamic Transmitter Center & Gateway Logs */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">SMS Gateway Config & Logs</h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Platform-wide OTP secure transmitters controller</p>
                    </div>
                    <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-500 text-[8.5px] font-black tracking-wider uppercase rounded-full">TRANS-MTR</span>
                  </div>

                  {/* Settings form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Gateway Provider</label>
                      <select
                        value={smsProvider}
                        onChange={(e: any) => setSmsProvider(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-yellow-500 text-slate-300"
                      >
                        <option value="msg91">MSG91 Enterprise</option>
                        <option value="twilio">Twilio Programmable SMS</option>
                        <option value="plivo">Plivo Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Sender alphacode</label>
                      <input
                        type="text"
                        value={smsSenderId}
                        onChange={(e) => setSmsSenderId(e.target.value)}
                        placeholder="e.g. LKLBND"
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-widest outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Secure Auth Secret / API Key</label>
                    <input
                      type="password"
                      value={smsApiKey}
                      onChange={(e) => setSmsApiKey(e.target.value)}
                      placeholder="Enter Provider API Auth Key"
                      className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveSmsConfig}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Save SMS Config
                    </button>
                  </div>
                </div>

                {/* Subpanel list: Live logs */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">🚨 Live Dispatched SMS Stream logs</p>
                  <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl max-h-[160px] overflow-y-auto font-mono text-[9px] space-y-2">
                    {auditLogs.filter(log => ['sms_otp', 'onboarding_otp'].includes(log.type)).length === 0 ? (
                      <p className="text-center py-6 text-slate-600 uppercase">Gateway quiet. Ready for verification dispatches.</p>
                    ) : (
                      auditLogs.filter(log => ['sms_otp', 'onboarding_otp'].includes(log.type)).map((log) => (
                        <div key={log.id} className="p-2 border-b border-white/5 last:border-0 flex flex-col gap-0.5 text-left text-slate-300">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>+91 {log.phoneNumber} ({log.type === 'sms_otp' ? 'Login' : 'Onboard'})</span>
                            <span className="text-emerald-400 font-extrabold bg-emerald-400/10 px-1 py-0.2 rounded text-[7px]">[ {log.status || 'DELIVERED'} ]</span>
                          </div>
                          <p className="text-white mt-1 font-mono">{log.message}</p>
                          <span className="text-[7.5px] text-slate-500 mt-0.5">Code: {log.code} • Date: {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Integrated Merchant Payment Gateway Config & Live Settlements */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Payment Gateways & Router</h3>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Collect platform commissions & dispatch pay-ins</p>
                    </div>
                    <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-500 text-[8.5px] font-black tracking-wider uppercase rounded-full">GATE-WAY</span>
                  </div>

                  {/* Settings form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Gateway Engine</label>
                      <select
                        value={paymentGateway}
                        onChange={(e: any) => setPaymentGateway(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-yellow-500 text-slate-300"
                      >
                        <option value="razorpay">Razorpay Checkout</option>
                        <option value="paytm">Paytm Merchant API</option>
                        <option value="cashfree">Cashfree Core</option>
                        <option value="stripe">Stripe international</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Processing Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e: any) => setPaymentMode(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-yellow-500 text-slate-300"
                      >
                        <option value="sandbox">Sandbox (Simulation)</option>
                        <option value="live">Live Production (Real)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-2">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Merchant Pay-in VPA UPI ID</label>
                      <input
                        type="text"
                        value={paymentUpiId}
                        onChange={(e) => setPaymentUpiId(e.target.value)}
                        placeholder="e.g. 8790729816@ybl"
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Merchant Account Holder</label>
                      <input
                        type="text"
                        value={paymentHolder}
                        onChange={(e) => setPaymentHolder(e.target.value)}
                        placeholder="Holder Full Name"
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSavePaymentConfig}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Save Payment Config
                    </button>
                  </div>
                </div>

                {/* Subpanel list: Live Logs */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">💵 Real-Time Platform Revenue Settlements</p>
                  <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl max-h-[160px] overflow-y-auto font-mono text-[9px] space-y-2">
                    {auditLogs.filter(log => log.type === 'payment_success').length === 0 ? (
                      <p className="text-center py-6 text-slate-600 uppercase">No customer pay-ins recorded yet in this cycle.</p>
                    ) : (
                      auditLogs.filter(log => log.type === 'payment_success').map((log) => (
                        <div key={log.id} className="p-2 border-b border-white/5 last:border-0 flex justify-between items-start text-left text-slate-300">
                          <div>
                            <div className="flex items-center gap-1.5 font-extrabold text-white">
                              <span>₹{log.amount}</span>
                              <span className="text-[7px] text-slate-500">({log.method?.toUpperCase()})</span>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-0.5 truncate max-w-[200px]">Loc: {log.deliveryLocation}</p>
                            <span className="text-[7.5px] text-slate-500">Ref: {log.txnId} • {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-400 font-extrabold bg-emerald-400/10 px-1 py-0.2 rounded text-[7px]">[ SUCCESS ]</span>
                            <p className="text-[7px] text-slate-500 mt-1 truncate max-w-[90px]">{log.customerName}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 8: FOUNDER PREMIUM MASTER PANEL */}
        {activeTab === 'founder' && (
          <div className="space-y-6">
            
            {/* Founders Intro card */}
            <div className="relative bg-slate-900 border border-yellow-400/20 p-8 rounded-[2.5rem] overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl text-left space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">Platform Founder Override Panel</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Khammam Platform Founder Dashboard</h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  High-security panel overrides for regional promotion campaigns, branch franchises, hospital networks, custom dispatcher automation triggers, and user-merchant review moderations.
                </p>
              </div>
            </div>

            {/* A: LOGISTICS HUB (MEMBER LOGISTICS) */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Member Logistics Hub</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Live registered platform profiles status log</p>
                </div>
                <Users className="w-5 h-5 text-yellow-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logged Customers</p>
                  <p className="text-2xl font-black text-white">{users.filter(u => u.role === 'customer' || !u.role).length}</p>
                  <p className="text-[8.5px] font-bold text-emerald-400 uppercase tracking-tight">👤 Real-Time logins</p>
                </div>
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Onboarded Merchants</p>
                  <p className="text-2xl font-black text-white">{vendors.length}</p>
                  <p className="text-[8.5px] font-bold text-yellow-500 uppercase tracking-tight">🏪 Approved outlets</p>
                </div>
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Delivery Fleet</p>
                  <p className="text-2xl font-black text-white">{riders.length}</p>
                  <p className="text-[8.5px] font-bold text-indigo-400 uppercase tracking-tight">🏍️ Riders on dispatch</p>
                </div>
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Khammam Staff Team</p>
                  <p className="text-2xl font-black text-white">{users.filter(u => ['branchAdmin', 'admin', 'staff'].includes(u.role)).length}</p>
                  <p className="text-[8.5px] font-bold text-amber-500 uppercase tracking-tight">🔑 Administrators active</p>
                </div>
              </div>
            </div>

            {/* B: ORDER DISPATCH ASSIGNMENT POWER TOGGLE & MANUAL ROUTING CONSOLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Order Assignment Mode Toggle */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Auto-Dispatch Engine</h3>
                    <Power className={`w-5 h-5 ${dispatchConfig.autoAssign ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    When active, incoming customer orders automatically search and bid the nearest available online rider. Toggle OFF to hold orders in central manual routing queue.
                  </p>
                </div>

                <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500">Dispatch Status Mode</p>
                    <p className={`text-xs font-black uppercase tracking-wider ${dispatchConfig.autoAssign ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {dispatchConfig.autoAssign ? '🤖 FULLY AUTOMATIC' : '🎮 MANUAL ALLOCATION'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoDispatch}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all ${dispatchConfig.autoAssign ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-450 hover:text-slate-900'}`}
                  >
                    Change Mode
                  </button>
                </div>
              </div>

              {/* Manual Routing Console (List of Unassigned or Active Orders to force assign rider) */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] lg:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Manual Routing Override</h3>
                    <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full">Override Console</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal font-medium">
                    Force route and dispatch any open orders to any registered rider in real-time.
                  </p>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {orders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-[10px] font-black uppercase border border-dashed border-white/5 rounded-xl">
                      No active open orders awaiting rider dispatch
                    </div>
                  ) : (
                    orders.filter(o => ['Pending', 'Preparing'].includes(o.status)).map((ord) => (
                      <div key={ord.id} className="bg-slate-950/70 border border-white/5 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-extrabold text-white">#{ord.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{ord.vendorName || 'General Hub'} • Total: ₹{ord.total}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Rider: <span className="text-indigo-400 font-extrabold">{ord.riderName || 'UNASSIGNED 🚨'}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => handleManualAssignOrder(ord.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 p-2 rounded-lg text-[9px] font-black uppercase text-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Choose Dispatch Rider</option>
                            {riders.filter(r => r.status === 'Approved' || r.isOnline).map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.isOnline ? 'ONLINE' : 'OFFLINE'})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* C: BANNER MANAGER & PROMO CODES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Home Slide Banner Manager */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Category Promotion Banners</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">App home interactive carousel slides</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBanner(null);
                      setBannerForm({ title: '', description: '', image: '', route: 'restaurant', status: 'active' });
                      setShowBannerModal(true);
                    }}
                    className="p-2.5 bg-yellow-400 text-slate-900 hover:bg-yellow-300 rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Slide</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 font-sans">
                  {banners.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No slide banners configured yet</p>
                  ) : (
                    banners.map((b) => (
                      <div key={b.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                        {b.image && (
                          <img src={b.image} className="w-16 h-12 rounded-lg object-cover bg-slate-900 shrink-0 border border-white/5" alt="Banner thumb" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate uppercase">{b.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{b.description}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full">Route: {b.route}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingBanner(b);
                              setBannerForm({
                                title: b.title || '',
                                description: b.description || '',
                                image: b.image || '',
                                route: b.route || 'restaurant',
                                status: b.status || 'active'
                              });
                              setShowBannerModal(true);
                            }}
                            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Promo Coupon creation & edit */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">App Discount Coupons</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Platform coupon codes & campaigns</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', status: 'active' });
                      setShowPromoModal(true);
                    }}
                    className="p-2.5 bg-yellow-400 text-slate-900 hover:bg-yellow-300 rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create Promo</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 font-sans">
                  {promoCodes.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No promo coupons published yet</p>
                  ) : (
                    promoCodes.map((p) => (
                      <div key={p.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-white tracking-widest italic">{p.code}</p>
                          <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
                            {p.type === 'percentage' ? `${p.value}% OFF` : `₹${p.value} OFF`} • Min Order: ₹{p.minOrder || 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPromo(p);
                              setPromoForm({
                                code: p.code || '',
                                type: p.type || 'percentage',
                                value: String(p.value || ''),
                                minOrder: String(p.minOrder || ''),
                                maxDiscount: String(p.maxDiscount || ''),
                                status: p.status || 'active'
                              });
                              setShowPromoModal(true);
                            }}
                            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* D: USER REVIEWS & COMMENTS MODERATOR */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Customer Comments & Review Moderation</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Acknowledge feedback & remove spam registers</p>
                </div>
                <Star className="w-5 h-5 text-yellow-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-500 text-[10px] font-black uppercase">
                    No registered user reviews online
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-white text-xs">{rev.userName || 'Anonymous Client'}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= (rev.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">About Outlet / Product: <span className="text-indigo-400 font-extrabold">{rev.vendorName || rev.productName || 'General service'}</span></p>
                        <p className="text-slate-200 mt-1.5 italic">"{rev.comment || 'No description comments registered.'}"</p>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => {
                            setEditingReview(rev);
                            setReviewForm({ rating: rev.rating || 5, comment: rev.comment || '' });
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 active:scale-95 text-center"
                        >
                          Moderate Raw
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-rose-500/10 text-center"
                        >
                          Delete Comment
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* E: HOSPITALS master CRUD */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Khammam OP Hospital Directory</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">CRUD medical consulting and hospital OPD registries</p>
                </div>
                <button
                  onClick={() => {
                    setEditingHospital(null);
                    setHospitalForm({ name: '', price: '', isActive: true, description: '', phone: '' });
                    setShowHospitalModal(true);
                  }}
                  className="p-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-rose-950/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Register Clinical Hospital</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
                {Object.entries(hospitalPrices).length === 0 ? (
                  <p className="col-span-3 text-center py-12 text-slate-500 text-[10px] font-black uppercase animate-pulse">No hospitals configured in master database registry</p>
                ) : (
                  Object.entries(hospitalPrices).map(([name, data]: [string, any]) => (
                    <div key={name} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-white uppercase tracking-tight text-xs">{name}</p>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${data.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {data.isActive ? 'Active' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-sm font-black text-emerald-400 mt-1">Fee: ₹{data.price ?? 0}</p>
                        {data.phone && <p className="text-[10px] text-slate-400 font-mono font-semibold">Tel: {data.phone}</p>}
                        {data.description && <p className="text-[10px] text-slate-400 italic leading-relaxed">"{data.description}"</p>}
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => {
                            setEditingHospital(name);
                            setHospitalForm({
                              name,
                              price: String(data.price ?? ''),
                              isActive: data.isActive ?? true,
                              description: data.description || '',
                              phone: data.phone || ''
                            });
                            setShowHospitalModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 active:scale-95 text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteHospitalObj(name)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-550 text-rose-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-rose-500/10 text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* F: FRANCHISES BRANCH network */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Lokal Franchise Branch Office Networks</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Manage regional administrative branches & charter logs</p>
                </div>
                <button
                  onClick={() => {
                    setEditingBranch(null);
                    setBranchForm({ id: '', name: '', city: 'Khammam', revenue: 0, status: 'Active', adminEmail: '' });
                    setShowBranchModal(true);
                  }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Charter Franchise</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/5 text-xs font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-white/5 text-slate-400 uppercase tracking-widest text-[9px] font-black">
                      <th className="py-3.5 px-4 font-normal">Branch Slug</th>
                      <th className="py-3.5 px-4 font-normal">Office Name</th>
                      <th className="py-3.5 px-4 font-normal">Region Metro</th>
                      <th className="py-3.5 px-4 font-normal">Charter Principal Email</th>
                      <th className="py-3.5 px-4 text-right font-normal">Charter Capital</th>
                      <th className="py-3.5 px-4 text-right font-normal">Status</th>
                      <th className="py-3.5 px-4 text-right font-normal">Action Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {branches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-505 text-[10px] font-black uppercase">No physical hub franchises registered</td>
                      </tr>
                    ) : (
                      branches.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-950/75 transition-colors font-semibold">
                          <td className="py-3.5 px-4 font-mono text-indigo-400 font-extrabold">{b.id}</td>
                          <td className="py-3.5 px-4 text-white font-extrabold uppercase">{b.name}</td>
                          <td className="py-3.5 px-4 text-slate-300 font-extrabold">{b.city || 'Khammam'}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 font-medium">{b.adminEmail || 'admin@lokalbandi.com'}</td>
                          <td className="py-3.5 px-4 text-right text-emerald-400 font-black">₹{(b.revenue ?? 0).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${b.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-405'}`}>
                              {b.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingBranch(b);
                                  setBranchForm({
                                    id: b.id || '',
                                    name: b.name || '',
                                    city: b.city || 'Khammam',
                                    revenue: b.revenue || 0,
                                    status: b.status || 'Active',
                                    adminEmail: b.adminEmail || ''
                                  });
                                  setShowBranchModal(true);
                                }}
                                className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded border border-white/5"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBranch(b.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded transition-all border border-rose-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Standalone footer layout */}
      <div className="border-t border-white/5 bg-slate-950 p-6 text-center select-none">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
          Secured Enterprise Application &bull; Lokal Bandi master branch Khammam
        </p>
      </div>

      {/* PRODUCT LISTING ADD/EDIT MODAL */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingItem ? 'Edit Product Option' : 'Create Product option'}</h3>
              </div>
              
              <form onSubmit={handleSaveCatalogItem} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input 
                    type="text" required 
                    value={itemForm.name} 
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., Premium Homemade Ghee" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Price (INR)</label>
                    <input 
                      type="number" required 
                      value={itemForm.price} 
                      onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black" 
                      placeholder="650" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Original Price (Strike)</label>
                    <input 
                      type="number" 
                      value={itemForm.originalPrice} 
                      onChange={(e) => setItemForm({...itemForm, originalPrice: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="E.g., 720 (optional)" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Unit description</label>
                    <input 
                      type="text" required 
                      value={itemForm.unit} 
                      onChange={(e) => setItemForm({...itemForm, unit: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="500ml / 1kg" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Stock quantity</label>
                    <input 
                      type="number" 
                      value={itemForm.stock} 
                      onChange={(e) => setItemForm({...itemForm, stock: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="E.g., 50 (optional)" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Catalog Category</label>
                    <select 
                      value={itemForm.category} 
                      onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Sub-category Label</label>
                    <input 
                      type="text" 
                      value={itemForm.subCategory} 
                      onChange={(e) => setItemForm({...itemForm, subCategory: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="Veg, Pure cow (optional)" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Assigned Store Vendor</label>
                  <select 
                    value={itemForm.vendorId} 
                    onChange={(e) => setItemForm({...itemForm, vendorId: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                  >
                    <option value="admin-store">Lokal Central Hub (Admin)</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.businessName || v.name || v.ownerName} ({v.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Image Resource Link</label>
                  <input 
                    type="url" 
                    value={itemForm.image} 
                    onChange={(e) => setItemForm({...itemForm, image: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="https://images.unsplash.com/photo-..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Product Description</label>
                  <textarea 
                    value={itemForm.description} 
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold h-16" 
                    placeholder="Hand-churned pure traditional Ghee from local cow farms." 
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-950 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available in Catalog?</span>
                  <button
                    type="button"
                    onClick={() => setItemForm({...itemForm, isAvailable: !itemForm.isAvailable})}
                    className={`py-1 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${itemForm.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'}`}
                  >
                    {itemForm.isAvailable ? 'Active' : 'Out of stock'}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-900/10 active:scale-95"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CATEGORY ADD/EDIT MODAL */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              </div>
              
              <form onSubmit={handleSaveCategory} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Category ID (Machine slug)</label>
                  <input 
                    type="text" required 
                    disabled={!!editingCategory}
                    value={categoryForm.id} 
                    onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-mono disabled:opacity-50" 
                    placeholder="e.g. food, dairy, household" 
                  />
                  <p className="text-[8px] text-slate-500 font-bold uppercase leading-snug">Unique machine identifier, numbers & letters only. Cannot be changed later.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Display Name</label>
                  <input 
                    type="text" required 
                    value={categoryForm.name} 
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., Meat & Eggs" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Lucide Icon name</label>
                    <input 
                      type="text" 
                      value={categoryForm.icon} 
                      onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="ShoppingBag" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Tailwind Color class</label>
                    <input 
                      type="text" 
                      value={categoryForm.color} 
                      onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="bg-emerald-50" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Thumbnail Image URL</label>
                  <input 
                    type="url" 
                    value={categoryForm.image} 
                    onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="https://images.unsplash.com/photo-..." 
                  />
                  <p className="text-[8px] text-slate-500 font-bold uppercase leading-snug">Provide an Unsplash graphic to render a rich picture tile for users (optional).</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-900/10 active:scale-95"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BANNER EDIT/ADD MODAL */}
      <AnimatePresence>
        {showBannerModal && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Laptop className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingBanner ? 'Edit Promo Banner' : 'Create Promo Banner'}</h3>
              </div>
              
              <form onSubmit={handleSaveBanner} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Banner Title</label>
                  <input 
                    type="text" required 
                    value={bannerForm.title} 
                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., 50% Ghee Sale!" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Description Subtext</label>
                  <input 
                    type="text" required 
                    value={bannerForm.description} 
                    onChange={(e) => setBannerForm({...bannerForm, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., Homemade traditional products..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Redirect Route Trigger</label>
                  <select 
                    value={bannerForm.route} 
                    onChange={(e) => setBannerForm({...bannerForm, route: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                  >
                    <option value="restaurant">restaurant (Food Dispatch)</option>
                    <option value="groceries">groceries (Fresh Veg/Fruits)</option>
                    <option value="organic">organic (Pure Farm Ghee/Honey)</option>
                    <option value="medical">medical (Clinical OPD Consultations)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Public Banner Image Link</label>
                  <input 
                    type="url" required 
                    value={bannerForm.image} 
                    onChange={(e) => setBannerForm({...bannerForm, image: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    placeholder="https://images.unsplash.com/photo-..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Display Status</label>
                  <select 
                    value={bannerForm.status} 
                    onChange={(e) => setBannerForm({...bannerForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white"
                  >
                    <option value="active">Active (On Screen)</option>
                    <option value="scheduled">Scheduled (Hidden)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowBannerModal(false); setEditingBanner(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Slide
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROMO CODE MODAL */}
      <AnimatePresence>
        {showPromoModal && (
          <div className="fixed inset-0 z-[10003] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Percent className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingPromo ? 'Edit Coupon Code' : 'Generate Coupon Code'}</h3>
              </div>
              
              <form onSubmit={handleSavePromo} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Coupon Code (All Caps)</label>
                  <input 
                    type="text" required 
                    disabled={!!editingPromo}
                    value={promoForm.code} 
                    onChange={(e) => setPromoForm({...promoForm, code: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black tracking-widest placeholder-slate-600 disabled:opacity-50" 
                    placeholder="BHARATH50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Discount Type</label>
                    <select 
                      value={promoForm.type} 
                      onChange={(e) => setPromoForm({...promoForm, type: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                    >
                      <option value="percentage">Percentage %</option>
                      <option value="flat">Flat ₹ Discount</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Discount Value</label>
                    <input 
                      type="number" required 
                      value={promoForm.value} 
                      onChange={(e) => setPromoForm({...promoForm, value: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black" 
                      placeholder="E.g. 10 or 150" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Minimum Order</label>
                    <input 
                      type="number" 
                      value={promoForm.minOrder} 
                      onChange={(e) => setPromoForm({...promoForm, minOrder: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-semibold" 
                      placeholder="E.g. 100" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Max Cap Discount</label>
                    <input 
                      type="number" 
                      value={promoForm.maxDiscount} 
                      onChange={(e) => setPromoForm({...promoForm, maxDiscount: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-semibold" 
                      placeholder="E.g. 200" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider text-slate-500">Validity Status</label>
                  <select 
                    value={promoForm.status} 
                    onChange={(e) => setPromoForm({...promoForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                  >
                    <option value="active">Active & Redeemable</option>
                    <option value="expired">Expired/Revoked</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowPromoModal(false); setEditingPromo(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVIEW MODERATE MODAL */}
      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 z-[10004] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">Moderate Review</h3>
              </div>
              
              <form onSubmit={handleSaveReviewModerate} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Star Rating (1-5)</label>
                  <select 
                    value={reviewForm.rating} 
                    onChange={(e) => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black text-yellow-400"
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Comment Text</label>
                  <textarea 
                    value={reviewForm.comment} 
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold h-24" 
                    placeholder="Type moderated review text..." 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingReview(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Moderate & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FRANCHISE BRANCH MODAL */}
      <AnimatePresence>
        {showBranchModal && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingBranch ? 'Configure Franchise' : 'Charter New Franchise'}</h3>
              </div>
              
              <form onSubmit={handleSaveBranch} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Branch Slug ID (e.g. khammam_main)</label>
                  <input 
                    type="text" required 
                    disabled={!!editingBranch}
                    value={branchForm.id} 
                    onChange={(e) => setBranchForm({...branchForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-mono disabled:opacity-50" 
                    placeholder="khammam_main" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Franchise Office Name</label>
                  <input 
                    type="text" required 
                    value={branchForm.name} 
                    onChange={(e) => setBranchForm({...branchForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-sans" 
                    placeholder="E.g. Khammam City HQ" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">HQ City Registry</label>
                    <input 
                      type="text" required 
                      value={branchForm.city} 
                      onChange={(e) => setBranchForm({...branchForm, city: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-xs font-bold" 
                      placeholder="Khammam" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Charter Capital (Revenue)</label>
                    <input 
                      type="number" 
                      value={branchForm.revenue} 
                      onChange={(e) => setBranchForm({...branchForm, revenue: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-xs font-bold" 
                      placeholder="0" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Admin Principal Email</label>
                  <input 
                    type="email" required 
                    value={branchForm.adminEmail} 
                    onChange={(e) => setBranchForm({...branchForm, adminEmail: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-semibold" 
                    placeholder="admin@lokalbandi.com" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider text-slate-500">Operation Status</label>
                  <select 
                    value={branchForm.status} 
                    onChange={(e) => setBranchForm({...branchForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white"
                  >
                    <option value="Active">Active Operational</option>
                    <option value="Maintenance">Maintenance Break</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowBranchModal(false); setEditingBranch(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Franchise
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOSPITAL CRUD MODAL */}
      <AnimatePresence>
        {showHospitalModal && (
          <div className="fixed inset-0 z-[10006] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Building className="w-6 h-6 text-rose-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingHospital ? 'Edit Clinic OP Record' : 'Registry New Hospital'}</h3>
              </div>
              
              <form onSubmit={handleSaveHospital} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Hospital Name</label>
                  <input 
                    type="text" required 
                    disabled={!!editingHospital}
                    value={hospitalForm.name} 
                    onChange={(e) => setHospitalForm({...hospitalForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold uppercase placeholder-slate-600 disabled:opacity-50" 
                    placeholder="E.g. Mamata General Hospital" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Standard OPD Fee (₹)</label>
                    <input 
                      type="number" required 
                      value={hospitalForm.price} 
                      onChange={(e) => setHospitalForm({...hospitalForm, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black text-emerald-400" 
                      placeholder="200" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Clinical Telephone</label>
                    <input 
                      type="text" 
                      value={hospitalForm.phone} 
                      onChange={(e) => setHospitalForm({...hospitalForm, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="08742-2244" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Departments & Description</label>
                  <textarea 
                    value={hospitalForm.description} 
                    onChange={(e) => setHospitalForm({...hospitalForm, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium h-16" 
                    placeholder="Cardiology, Paediatrics and General OPD..." 
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-950 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Include in Active OPD?</span>
                  <button
                    type="button"
                    onClick={() => setHospitalForm({...hospitalForm, isActive: !hospitalForm.isActive})}
                    className={`py-1 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${hospitalForm.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}
                  >
                    {hospitalForm.isActive ? 'Online' : 'offline'}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowHospitalModal(false); setEditingHospital(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Hospital
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MARRIAGE RECORD EDIT MODAL */}
      <AnimatePresence>
        {editingMarriageProfile && (
          <div className="fixed inset-0 z-[10007] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-yellow-405 fill-current" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Edit Marriage Profile</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Ref Profile ID: {editingMarriageProfile.id}</p>
                </div>
              </div>

              <form onSubmit={handleSaveMarriageProfile} className="space-y-4 text-left">
                
                {/* Visual Section: Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Candidate Name</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.name || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, name: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Candidate Surname</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.surname || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, surname: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Section: Demographics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Gender</label>
                    <select 
                      value={editingMarriageProfile.gender || 'Male'}
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, gender: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Age (Years)</label>
                    <input 
                      type="number" required
                      value={editingMarriageProfile.age || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, age: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Height</label>
                    <input 
                      type="text" required
                      value={editingMarriageProfile.height || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, height: e.target.value})}
                      placeholder="e.g. 5ft 6in"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Contact and Dob */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Candidate Phone</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.phone || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-yellow-400 font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.dob || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, dob: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Education and Profession */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Academic Education</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.education || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, education: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Profession/Occupation</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.profession || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, profession: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-yellow-400 font-mono" 
                    />
                  </div>
                </div>

                {/* Religion and Caste */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Religion</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.religion || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, religion: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Caste Community</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.caste || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, caste: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Marital Status and Native */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Marital Status</label>
                    <select 
                      value={editingMarriageProfile.maritalStatus || 'Unmarried'}
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, maritalStatus: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                    >
                      <option value="Unmarried">Unmarried</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widow">Widow / Widower</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Native Location</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.nativePlace || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, nativePlace: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Skin tone and Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Skin Complexion</label>
                    <select 
                      value={editingMarriageProfile.skinTone || 'Fair'}
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, skinTone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                    >
                      <option value="Fair">Fair</option>
                      <option value="Wheatish">Wheatish</option>
                      <option value="Complexion">Complexion</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Photo Image URL</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.image || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, image: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium font-mono" 
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Section: Parents */}
                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Father's Full Name</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.fatherName || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, fatherName: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Father's Profession</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.fatherProfession || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, fatherProfession: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Mother's Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mother's Full Name</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.motherName || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, motherName: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mother's Profession</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.motherProfession || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, motherProfession: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Address representation */}
                <div className="space-y-1 border-t border-white/5 pt-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Residential Contact Address</label>
                  <textarea 
                    value={editingMarriageProfile.address || ''} 
                    onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, address: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium h-14 font-mono" 
                    placeholder="Provide neighborhood street address details..."
                  />
                </div>

                {/* Action CTA Buttons */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingMarriageProfile(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Apply Modifications
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REAL ESTATE PROPERTY EDIT MODAL */}
      <AnimatePresence>
        {editingProperty && (
          <div className="fixed inset-0 z-[10007] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3 text-left">
                <Building className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Edit Real Estate Listing</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Ref Property ID: {editingProperty.id}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProperty} className="space-y-4 text-left">
                {/* Field: Title */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Listing Name / Title</label>
                  <input 
                    type="text" required
                    value={editingProperty.title || ''} 
                    onChange={(e) => setEditingProperty({...editingProperty, title: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                  />
                </div>

                {/* Grid Category, Type & Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      value={editingProperty.category || 'For Sale'}
                      onChange={(e) => setEditingProperty({...editingProperty, category: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono font-medium"
                    >
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                      <option value="Lease">Lease</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Type</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Apartment"
                      value={editingProperty.type || ''} 
                      onChange={(e) => setEditingProperty({...editingProperty, type: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Price (₹)</label>
                    <input 
                      type="text" required
                      value={editingProperty.price || ''} 
                      onChange={(e) => setEditingProperty({...editingProperty, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Specs Section Bedrooms, Sqft & Facing */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Bedrooms</label>
                    <input 
                      type="text"
                      value={editingProperty.details?.bedrooms || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        details: { ...editingProperty.details, bedrooms: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Area (Sqft)</label>
                    <input 
                      type="text"
                      value={editingProperty.details?.sqft || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        details: { ...editingProperty.details, sqft: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Facing Direction</label>
                    <input 
                      type="text"
                      placeholder="e.g. East"
                      value={editingProperty.facing || editingProperty.details?.facing || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        facing: e.target.value,
                        details: { ...editingProperty.details, facing: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Form fields: Location details */}
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Area / Neighborhood</label>
                    <input 
                      type="text" required
                      value={editingProperty.location?.area || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        location: { ...editingProperty.location, area: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">City</label>
                    <input 
                      type="text" required
                      value={editingProperty.location?.city || 'Khammam'} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        location: { ...editingProperty.location, city: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    />
                  </div>
                </div>

                {/* Field: Description */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={editingProperty.description || ''} 
                    onChange={(e) => setEditingProperty({...editingProperty, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium h-14" 
                    placeholder="Enter details on property facilities, location advantage etc..."
                  />
                </div>

                {/* Action CTA Buttons */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingProperty(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Apply Modifications
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
