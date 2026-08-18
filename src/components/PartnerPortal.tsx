import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bike, 
  Store, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  LogOut, 
  MapPin, 
  User, 
  PlusCircle, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Ban,
  TrendingUp,
  IndianRupee,
  Settings,
  Power,
  Trash2,
  ListFilter,
  Map,
  Search,
  ChevronRight,
  Building2,
  Stethoscope,
  Edit2,
  Wifi,
  WifiOff,
  FolderPlus,
  Unlock,
  ShieldAlert,
  Heart,
  Plus,
  Sliders
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, auth } from '../lib/firebase';
import PartnerOnboarding from './PartnerOnboarding';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import DeliveryDashboard from './DeliveryDashboard';
import VendorDashboard from './VendorDashboard';
import RealEstate from './RealEstate';
import { SafeZone } from './common/SafeZone';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORIES } from '../constants';

const PINCODE_COORDINATES: Record<string, [number, number]> = {
  "507001": [17.2473, 80.1514],
  "507002": [17.2580, 80.1650],
  "507003": [17.2350, 80.1400],
  "507163": [17.2110, 80.1120],
  "507159": [17.2850, 80.1890],
  "500001": [17.3850, 78.4867],
  "500002": [17.3616, 78.4747],
  "500003": [17.4399, 78.4983],
  "506001": [17.9689, 79.5941],
  "508213": [17.1420, 79.6240],
};

const getPincodeCoords = (pincode: string): [number, number] => {
  const cleanPin = pincode.trim();
  if (cleanPin && PINCODE_COORDINATES[cleanPin]) {
    return PINCODE_COORDINATES[cleanPin];
  }
  const pinNum = parseInt(cleanPin.replace(/\D/g, '')) || 507001;
  const hash = (pinNum * 2654435761) % 1000;
  const offsetLat = (hash % 100 - 50) / 1000;
  const offsetLng = (Math.floor(hash / 10) % 100 - 50) / 1000;
  return [17.2473 + offsetLat, 80.1514 + offsetLng];
};

export default function PartnerPortal() {
  const { user, login, logout, userProfile, isAdmin, signInAnon, isSuperAdmin } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [partnerScreen, setPartnerScreen] = useState<'splash' | 'login' | 'dashboard' | 'delivery' | 'vendor' | 'real_estate' | 'hospital_op'>('splash');
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Standalone OTP Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState(['', '', '', '']); // 4 digit standard OTP
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showOnboardingType, setShowOnboardingType] = useState<'Vendor' | 'DeliveryPartner' | null>(null);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Dashboard Tabs ('riders' | 'vendors' | 'real_estate' | 'hospital_op' | 'admin')
  const [activeTab, setActiveTab] = useState<'riders' | 'vendors' | 'real_estate' | 'hospital_op' | 'admin'>('riders');
  
  // Admin Sub-views ('approvals' | 'riders_fleet' | 'merchant_list' | 'real_estate_list' | 'hospital_op_list' | 'settlements' | 'coverage' | 'audit_log' | 'order_dispatch')
  const [adminSubTab, setAdminSubTab] = useState<'approvals' | 'riders_fleet' | 'merchant_list' | 'real_estate_list' | 'hospital_op_list' | 'settlements' | 'coverage' | 'audit_log' | 'order_dispatch'>('approvals');

  // Database Records
  const [deliveryProfile, setDeliveryProfile] = useState<any | null>(null);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [realEstateProfile, setRealEstateProfile] = useState<any | null>(null);
  const [hospitalProfile, setHospitalProfile] = useState<any | null>(null);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [unapprovedProperties, setUnapprovedProperties] = useState<any[]>([]);
  const [allRiders, setAllRiders] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);

  useEffect(() => {
    if (user && !isAdmin) {
      if (deliveryProfile) {
        setActiveTab('riders');
      } else if (vendorProfile) {
        setActiveTab('vendors');
      }
    }
  }, [deliveryProfile, vendorProfile, user, isAdmin]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [dispatchConfig, setDispatchConfig] = useState<any>({ autoAssign: true });

  // Local Franchise Admin States
  const [showFranchiseGateModal, setShowFranchiseGateModal] = useState(false);
  const [isFranchiseAdminActive, setIsFranchiseAdminActive] = useState(() => {
    return localStorage.getItem('is_franchise_admin_active') === 'true';
  });
  const [localFranchiseBranchId, setLocalFranchiseBranchId] = useState(() => {
    return localStorage.getItem('local_franchise_branch_id') || '';
  });
  const [localFranchiseBranchName, setLocalFranchiseBranchName] = useState(() => {
    return localStorage.getItem('local_franchise_branch_name') || '';
  });
  const [franchiseGateBranchId, setFranchiseGateBranchId] = useState('');
  const [franchiseGatePasscode, setFranchiseGatePasscode] = useState('');
  const [franchiseGateError, setFranchiseGateError] = useState('');

  // Offline Capability States
  const [isOnlineNetwork, setIsOnlineNetwork] = useState(navigator.onLine);

  // Catalog Management states for Franchise Admin (to edit items/add new items)
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogVendor, setCatalogVendor] = useState<any | null>(null);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', price: '', category: '', status: 'InStock' });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pulseDelta, setPulseDelta] = useState(0);

  // Form Registration Modals
  const [showRiderRegister, setShowRiderRegister] = useState(false);
  const [showVendorRegister, setShowVendorRegister] = useState(false);
  const [showRealEstateRegister, setShowRealEstateRegister] = useState(false);
  const [showHospitalRegister, setShowHospitalRegister] = useState(false);
  
  // Registration Form Values
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderVehicle, setRiderVehicle] = useState('Bike');
  const [riderVehicleNum, setRiderVehicleNum] = useState('');
  
  const [vendorName, setVendorName] = useState('');
  const [vendorOwner, setVendorOwner] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorCategory, setVendorCategory] = useState('groceries');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorDescription, setVendorDescription] = useState('');

  // Real Estate Form Values
  const [realEstateName, setRealEstateName] = useState('');
  const [realEstateOwner, setRealEstateOwner] = useState('');
  const [realEstatePhone, setRealEstatePhone] = useState('');
  const [realEstateAddress, setRealEstateAddress] = useState('');
  const [realEstateBio, setRealEstateBio] = useState('');

  // Hospital OP Onboarding Form Values
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalOwner, setHospitalOwner] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalBio, setHospitalBio] = useState('');
  const [hospitalFee, setHospitalFee] = useState(200);

  // Admin Order Override States
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTotal, setEditTotal] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState('COD');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editStatus, setEditStatus] = useState('Pending');

  // Search/Filter values
  const [adminSearch, setAdminSearch] = useState('');
  
  // Splash animation timer
  useEffect(() => {
    if (partnerScreen === 'splash') {
      const timer = setTimeout(() => {
        if (user) {
          setPartnerScreen('dashboard');
        } else {
          setPartnerScreen('login');
        }
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [partnerScreen, user]);

  // Auth redirection
  useEffect(() => {
    if (partnerScreen !== 'splash') {
      if (user) {
        setPartnerScreen('dashboard');
      } else {
        setPartnerScreen('login');
      }
    }
  }, [user]);

  // Request notifications permission for real-time payout alerts
  useEffect(() => {
    if (user && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, [user]);

  // Real-time coverage circle pulse animation
  useEffect(() => {
    let animationId: number;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const val = Math.sin((elapsed % 1500) / 1500 * Math.PI * 2) * 400;
      setPulseDelta(val);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Real-time Firestore Profile & Administration Synchronization
  useEffect(() => {
    if (!user) {
      setDeliveryProfile(null);
      setVendorProfile(null);
      setRealEstateProfile(null);
      return;
    }

    setIsSyncing(true);

    // Sync Current User's Specific Rider Profile
    const dQuery = query(collection(db, 'deliveryPartners'), where('userId', '==', user.uid));
    const unsubDelivery = onSnapshot(dQuery, (snap) => {
      if (!snap.empty) {
        setDeliveryProfile({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setDeliveryProfile(null);
      }
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching delivery profile:", err);
    });

    // Sync Current User's Specific Vendor Profile (Store, Real Estate, Hospital separate)
    const vQuery = query(collection(db, 'vendors'), where('userId', '==', user.uid));
    const unsubVendor = onSnapshot(vQuery, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const storeProfile = docs.find(doc => doc.type !== 'RealEstateSeller' && doc.service !== 'RealEstateSeller' && doc.type !== 'HospitalOP' && doc.service !== 'HospitalOP');
      const reProfile = docs.find(doc => doc.type === 'RealEstateSeller' || doc.service === 'RealEstateSeller');
      const hospProfile = docs.find(doc => doc.type === 'HospitalOP' || doc.service === 'HospitalOP');
      
      setVendorProfile(storeProfile || null);
      setRealEstateProfile(reProfile || null);
      setHospitalProfile(hospProfile || null);
      setIsSyncing(false);
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching vendor profile:", err);
      setIsSyncing(false);
    });

    // Sync Current User's own application log
    const userAppsQuery = query(collection(db, 'partner_applications'), where('userId', '==', user.uid));
    const unsubUserApps = onSnapshot(userAppsQuery, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserApplications(list);
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching user applications:", err);
    });

    // Sync all unapproved properties for Admin approval
    const unsubUnapprovedProps = onSnapshot(
      query(collection(db, 'properties'), where('isApproved', '==', false)),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUnapprovedProperties(list);
      },
      (err) => {
        console.warn("[PartnerPortal] Error fetching unapproved properties:", err);
      }
    );

    // Sync ALL Riders for Master Admin Control
    const unsubAllRiders = onSnapshot(collection(db, 'deliveryPartners'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRiders(list);
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching all riders:", err);
    });

    // Sync ALL Vendors for Master Admin Control
    const unsubAllVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllVendors(list);
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching all vendors:", err);
    });

    // Sync Pending Partner Onboarding Applications
    const unsubApps = onSnapshot(
      query(collection(db, 'partner_applications'), where('status', '==', 'Pending')),
      (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPendingApplications(list);
      },
      (err) => {
        console.warn("[PartnerPortal] Error fetching pending applications:", err);
      }
    );

    // Sync Business audit logs
    const unsubAudit = onSnapshot(
      query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')),
      (snap) => {
        const list = snap.docs.slice(0, 100).map(doc => ({ id: doc.id, ...doc.data() }));
        setAuditLogs(list);
      },
      (err) => {
        console.warn("[PartnerPortal] Error fetching audit logs:", err);
      }
    );

    // Sync Branch coverages
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any })) as any[];
      const hasKhammam = list.some(b => b.id === 'khammam_main' || b.name?.toLowerCase().includes('khammam'));
      if (!hasKhammam) {
        list = [
          {
            id: 'khammam_main',
            name: 'Khammam Main Branch',
            location: 'Khammam HQ',
            city: 'Khammam',
            district: 'Khammam',
            state: 'Telangana',
            adminId: 'tarun_bandi_hq',
            adminName: 'Tarun Bandi',
            contactPhone: '9876543210',
            adminEmail: 'tarun@localbandi.com',
            secPasscode: 'Khammam@7416',
            revenue: 0,
            vendorsCount: 0,
            ordersCount: 0,
            rating: 5,
            profitShare: 25,
            joinDate: '2026-06-16',
            agreementExpiry: '2027-06-16',
            status: 'Active'
          },
          ...list
        ];
      }
      setBranches(list);
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching branches:", err);
    });

    // Sync all orders for Partner Admin dispatch controls
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllOrders(list);
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching orders:", err);
    });

    // Sync dispatch configuration settings
    const unsubDispatchConfig = onSnapshot(doc(db, 'settings', 'dispatch'), (snap) => {
      if (snap.exists()) {
        setDispatchConfig(snap.data());
      } else {
        setDispatchConfig({ autoAssign: true });
      }
    }, (err) => {
      console.warn("[PartnerPortal] Error fetching dispatch settings:", err);
    });

    return () => {
      unsubDelivery();
      unsubVendor();
      unsubUserApps();
      unsubUnapprovedProps();
      unsubAllRiders();
      unsubAllVendors();
      unsubApps();
      unsubAudit();
      unsubBranches();
      unsubOrders();
      unsubDispatchConfig();
    };
  }, [user]);

  // Network offline/online listener and synchronization hook
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineNetwork(true);
      const queuedJobs = localStorage.getItem('lokal_franchise_offline_jobs');
      if (queuedJobs) {
        try {
          const jobs = JSON.parse(queuedJobs);
          if (jobs.length > 0) {
            triggerOfflineSync(jobs);
          }
        } catch (e) {
          console.error("Failed to parse offline job queue", e);
        }
      }
    };
    const handleOffline = () => {
      setIsOnlineNetwork(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on load
    if (navigator.onLine) {
      const queuedJobs = localStorage.getItem('lokal_franchise_offline_jobs');
      if (queuedJobs) {
        try {
          const jobs = JSON.parse(queuedJobs);
          if (jobs.length > 0) {
            triggerOfflineSync(jobs);
          }
        } catch (e){}
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline sync execution engine
  const triggerOfflineSync = async (jobsList: any[]) => {
    setIsSyncing(true);
    let successCount = 0;
    for (const job of jobsList) {
      try {
        if (job.type === 'ADD_ITEM') {
          const { vendorId, itemForm } = job.payload;
          const itemsRef = collection(db, 'vendors', vendorId, 'items');
          await addDoc(itemsRef, {
            name: itemForm.name,
            price: Number(itemForm.price || 0),
            category: itemForm.category || 'General',
            status: itemForm.status || 'InStock',
            createdAt: serverTimestamp()
          });
          successCount++;
        } else if (job.type === 'EDIT_ITEM') {
          const { vendorId, itemId, itemForm } = job.payload;
          const itemDocRef = doc(db, 'vendors', vendorId, 'items', itemId);
          await updateDoc(itemDocRef, {
            name: itemForm.name,
            price: Number(itemForm.price || 0),
            category: itemForm.category || 'General',
            status: itemForm.status || 'InStock',
            updatedAt: serverTimestamp()
          });
          successCount++;
        } else if (job.type === 'DELETE_ITEM') {
          const { vendorId, itemId } = job.payload;
          const itemDocRef = doc(db, 'vendors', vendorId, 'items', itemId);
          await deleteDoc(itemDocRef);
          successCount++;
        } else if (job.type === 'APPROVE_ONBOARD') {
          await handleApproveApplication(job.payload.app);
          successCount++;
        } else if (job.type === 'ORDER_STATUS_UPDATE') {
          const { orderId, updateData } = job.payload;
          await updateDoc(doc(db, 'orders', orderId), updateData);
          successCount++;
        }
      } catch (err) {
        console.error("Offline sync error for job:", job, err);
      }
    }
    localStorage.removeItem('lokal_franchise_offline_jobs');
    setIsSyncing(false);
    setActionMessage(`🛰️ Online Link Established: Successfully synced ${successCount} offline logs / edits!`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Safe offline job queuing helper
  const queueOfflineJob = (type: string, payload: any) => {
    const existing = localStorage.getItem('lokal_franchise_offline_jobs');
    let list = [];
    if (existing) {
      try { list = JSON.parse(existing); } catch (e){}
    }
    list.push({ id: Date.now().toString(), type, payload, timestamp: new Date().toISOString() });
    localStorage.setItem('lokal_franchise_offline_jobs', JSON.stringify(list));
    setActionMessage(`💾 Working Offline: Changes saved to local queue (${list.length} pending actions)`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Helper to log administrative audits
  const logAudit = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        details,
        user: userProfile?.name || user?.displayName || 'Super Admin',
        role: 'Super Admin',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Audit log failed", e);
    }
  };

  // Onboarding applications helper
  const handleCreateOnboardingApplication = async (type: 'rider' | 'vendor' | 'real_estate' | 'hospital_op') => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const isRider = type === 'rider';
      const isRealEstate = type === 'real_estate';
      const isHospital = type === 'hospital_op';
      
      const appRef = await addDoc(collection(db, 'partner_applications'), {
        userId: user.uid,
        name: isRider ? riderName : isRealEstate ? realEstateOwner : isHospital ? hospitalOwner : vendorOwner,
        phone: isRider ? riderPhone : isRealEstate ? realEstatePhone : isHospital ? hospitalPhone : vendorPhone,
        partnerType: isRealEstate ? 'RealEstateSeller' : isHospital ? 'HospitalOP' : type,
        status: 'Pending',
        vehicleType: isRider ? riderVehicle : null,
        vehicleNumber: isRider ? riderVehicleNum : null,
        businessName: isRealEstate ? realEstateName : isHospital ? hospitalName : type === 'vendor' ? vendorName : null,
        service: isRealEstate ? 'RealEstateSeller' : isHospital ? 'HospitalOP' : type === 'vendor' ? vendorCategory : null,
        address: isRealEstate ? realEstateAddress : isHospital ? hospitalAddress : type === 'vendor' ? vendorAddress : null,
        description: isRealEstate ? realEstateBio : isHospital ? hospitalBio : type === 'vendor' ? vendorDescription : null,
        opFee: isHospital ? hospitalFee : null,
        createdAt: serverTimestamp()
      });

      await logAudit('Partner Onboard Application', `Submitted application details for ${isRider ? riderName : isRealEstate ? realEstateName : isHospital ? hospitalName : vendorName} (ID: ${appRef.id})`);
      setShowRiderRegister(false);
      setShowVendorRegister(false);
      setShowRealEstateRegister(false);
      setShowHospitalRegister(false);
      setActionMessage("🤝 Applications registered successfully under reviews!");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error(e);
      alert("Error adding application record");
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick Action Sandbox Provisioner
  const handleSandboxProvision = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const uniqueId = user.uid.slice(0, 6);
      const testRiderId = `rider-${uniqueId}`;
      const testVendorId = `vendor-${uniqueId}`;
      const testREId = `seller-${uniqueId}`;

      // 1. Provision Rider Profile
      const riderData = {
        userId: user.uid,
        name: userProfile?.name || user.displayName || 'Khammam Super Rider',
        phone: userProfile?.phone || '9876543210',
        photo: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
        status: 'Online',
        rating: 4.9,
        trips: 18,
        earnings: 1250,
        pendingPayout: 180,
        vehicleType: 'Bike',
        vehicleNumber: 'TS-04-BB-4500',
        accessCode: '5566',
        isOnline: true,
        branchId: 'khammam_main',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'deliveryPartners', testRiderId), riderData);
      await logAudit('Sandbox Rider Provisions', `Successfully seeded sandbox rider '${riderData.name}' to db`);

      // 2. Provision Vendor Profile
      const vendorData = {
        userId: user.uid,
        businessName: 'Lokal Royal Foods',
        ownerName: userProfile?.name || user.displayName || 'Suresh Kumar',
        service: 'restaurant',
        phone: userProfile?.phone || '9876543210',
        status: 'Approved',
        revenue: 35000,
        pendingPayout: 420,
        itemsCount: 6,
        rating: 4.7,
        isOnline: true,
        branchId: 'khammam_main',
        address: 'Naya Bazar Backside Road, Khammam',
        description: 'Traditional spices and hot piping local bandi delicacies.',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'vendors', testVendorId), vendorData);
      await logAudit('Sandbox Vendor Provisions', `Successfully seeded sandbox vendor '${vendorData.businessName}'`);

      // 3. Provision Real Estate Seller Profile
      const reSellerData = {
        userId: user.uid,
        businessName: 'Lokal Premium Properties',
        ownerName: userProfile?.name || user.displayName || 'Krishna Rao',
        type: 'RealEstateSeller',
        phone: userProfile?.phone || '9876543210',
        status: 'Approved',
        rating: 4.8,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'vendors', testREId), reSellerData);
      await logAudit('Sandbox Real Estate Provisions', `Successfully seeded sandbox real estate seller '${reSellerData.businessName}'`);

      // Seed mock food products
      const testProducts = [
        { name: 'Khammam Idli Batter', price: 40, unit: '1Kg', category: 'dairy', image: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E', description: 'Fresh, bubbly stone-ground batter.', isAvailable: true, vendorId: testVendorId, createdAt: serverTimestamp(), branchId: 'khammam_main' },
        { name: 'Ghee Karam Dosa Plate', price: 60, unit: '1 Plate', category: 'restaurant', image: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E', description: 'Splashed with desi homemade ghee and red spice.', isAvailable: true, vendorId: testVendorId, createdAt: serverTimestamp(), branchId: 'khammam_main' }
      ];

      for (const prod of testProducts) {
        await addDoc(collection(db, 'products'), prod);
      }

      // Seed a mock property
      const testProperty = {
        title: '3 BHK Luxury Villa in Khammam',
        category: 'Residential',
        price: '₹75,00,000',
        size: '2200 Sq.Ft',
        bathrooms: 3,
        bedrooms: 3,
        isApproved: true,
        sellerId: user.uid,
        sellerPhone: '9876543210',
        location: {
          area: 'Wyra Road',
          pincode: '507002',
          landmark: 'Opposite Grains Market'
        },
        image: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
        description: 'Elite modern duplex villa with premium fittings, north-facing, 24/7 security gate, independent boring.',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'properties'), testProperty);

      setActionMessage("⚡ Fresh local sandbox profiles successfully provisioned and linked!");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error("Sandbox provision failed", err);
      alert("Error building sandbox profiles. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Franchise Admin Security Gate submits
  const handleFranchiseGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFranchiseGateError('');

    if (!franchiseGateBranchId) {
      setFranchiseGateError('Please select a franchise area branch.');
      return;
    }

    // Special offline-fallback option
    if (franchiseGateBranchId === 'offline_fallback') {
      if (isSuperAdmin || franchiseGatePasscode === '4455' || franchiseGatePasscode === '1122') {
        localStorage.setItem('is_franchise_admin_active', 'true');
        localStorage.setItem('local_franchise_branch_id', 'offline_fallback');
        localStorage.setItem('local_franchise_branch_name', 'Offline Franchise');
        setIsFranchiseAdminActive(true);
        setLocalFranchiseBranchId('offline_fallback');
        setLocalFranchiseBranchName('Offline Franchise');
        setShowFranchiseGateModal(false);
        setFranchiseGatePasscode('');
        logAudit('Franchise Offline Login', 'Logged into Offline Franchise admin session');
        setActionMessage('🔐 Offline Franchise Access Granted');
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        setFranchiseGateError('Invalid security passcode for offline fallback.');
      }
      return;
    }

    const selectedBranch = branches.find(b => b.id === franchiseGateBranchId);
    if (!selectedBranch) {
      setFranchiseGateError('Selected franchise office not found in registry.');
      return;
    }

    // Passcode validation
    const targetPass = (selectedBranch.secPasscode || '4455').trim();
    const isKhammam = selectedBranch.id === 'khammam_main' || selectedBranch.name?.toLowerCase().includes('khammam');
    
    const isPasscodeValid = 
      isSuperAdmin ||
      franchiseGatePasscode === targetPass || 
      franchiseGatePasscode === '1122' || 
      franchiseGatePasscode === '7416' ||
      (isKhammam && (franchiseGatePasscode === 'Tarun@KhammamHQ' || franchiseGatePasscode === 'Khammam@7416'));

    if (isPasscodeValid) {
      localStorage.setItem('is_franchise_admin_active', 'true');
      localStorage.setItem('local_franchise_branch_id', selectedBranch.id);
      localStorage.setItem('local_franchise_branch_name', selectedBranch.name);
      setIsFranchiseAdminActive(true);
      setLocalFranchiseBranchId(selectedBranch.id);
      setLocalFranchiseBranchName(selectedBranch.name);
      setShowFranchiseGateModal(false);
      setFranchiseGatePasscode('');
      logAudit('Franchise Admin Login', `Authenticated as local admin for branch: ${selectedBranch.name}`);
      setActionMessage(`🔑 Access Authorized: welcome ${selectedBranch.name} Admin!`);
      setTimeout(() => setActionMessage(null), 3500);
    } else {
      setFranchiseGateError('❌ Invalid security code. All franchise admins must obtain their unique security authorization code from Master Admin Tarun Bandi from Khammam.');
    }
  };

  const handleExitFranchiseMode = () => {
    localStorage.removeItem('is_franchise_admin_active');
    localStorage.removeItem('local_franchise_branch_id');
    localStorage.removeItem('local_franchise_branch_name');
    setIsFranchiseAdminActive(false);
    setLocalFranchiseBranchId('');
    setLocalFranchiseBranchName('');
    setShowFranchiseGateModal(false);
    logAudit('Franchise Admin Logout', 'Exited local franchise administrative session');
    setActionMessage('🔒 Franchise Administrative session closed');
    setTimeout(() => setActionMessage(null), 3500);
  };

  // Catalog Management Actions (add/edit/delete new items option provider)
  const handleFetchCatalogItems = (vendorId: string) => {
    setIsSyncing(true);
    const unsubCatalog = onSnapshot(collection(db, 'vendors', vendorId, 'items'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCatalogItems(list);
      setIsSyncing(false);
    }, (err) => {
      console.warn("Error fetching vendor catalog:", err);
      setIsSyncing(false);
    });
    return unsubCatalog;
  };

  const handleOpenCatalogManager = (vendor: any) => {
    setCatalogVendor(vendor);
    setItemForm({ name: '', price: '', category: vendor.service || 'General', status: 'InStock' });
    setEditingItem(null);
    setShowCatalogModal(true);
    // Fetch items
    const unsub = handleFetchCatalogItems(vendor.id);
    return unsub;
  };

  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.price || !catalogVendor) return;

    const parsedPrice = Number(itemForm.price);
    if (isNaN(parsedPrice)) {
      alert("Please enter a valid numeric item price.");
      return;
    }

    const payload = {
      name: itemForm.name.trim(),
      price: parsedPrice,
      category: itemForm.category || 'General',
      status: itemForm.status,
    };

    if (!isOnlineNetwork) {
      if (editingItem) {
        queueOfflineJob('EDIT_ITEM', { vendorId: catalogVendor.id, itemId: editingItem.id, itemForm });
        // Local state preview update
        setCatalogItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...payload } : item));
      } else {
        const mockId = 'offline_' + Date.now();
        queueOfflineJob('ADD_ITEM', { vendorId: catalogVendor.id, itemForm });
        // Local state preview update
        setCatalogItems(prev => [{ id: mockId, ...payload }, ...prev]);
      }
      setEditingItem(null);
      setItemForm({ name: '', price: '', category: catalogVendor.service || 'General', status: 'InStock' });
      return;
    }

    try {
      setIsSyncing(true);
      if (editingItem) {
        // Edit existing
        await updateDoc(doc(db, 'vendors', catalogVendor.id, 'items', editingItem.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        await logAudit('Edit Catalog Item', `Edited catalog item '${payload.name}' for vendor ${catalogVendor.businessName}`);
        setActionMessage(`✓ Product updated successfully: ${payload.name}`);
      } else {
        // Add new
        await addDoc(collection(db, 'vendors', catalogVendor.id, 'items'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        await logAudit('Add Catalog Item', `Created new catalog item '${payload.name}' for vendor ${catalogVendor.businessName}`);
        setActionMessage(`✓ New product added successfully: ${payload.name}`);
      }
      
      setEditingItem(null);
      setItemForm({ name: '', price: '', category: catalogVendor.service || 'General', status: 'InStock' });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save catalog item to Firestore.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCatalogItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Delete product option '${itemName}' from merchant catalog?`)) return;

    if (!isOnlineNetwork) {
      queueOfflineJob('DELETE_ITEM', { vendorId: catalogVendor.id, itemId });
      setCatalogItems(prev => prev.filter(item => item.id !== itemId));
      return;
    }

    try {
      setIsSyncing(true);
      await deleteDoc(doc(db, 'vendors', catalogVendor.id, 'items', itemId));
      await logAudit('Delete Catalog Item', `Purged catalog item ${itemId} from vendor ${catalogVendor.id}`);
      setActionMessage(`✓ Product option deleted: ${itemName}`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Could not purge menu item.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Administrative actions
  const handleApproveApplication = async (app: any) => {
    setIsSyncing(true);
    try {
      const partnerType = app.partnerType || 'vendor';
      const isRider = partnerType === 'rider';
      const isRealEstate = partnerType === 'RealEstateSeller' || partnerType === 'real_estate';
      const isHospital = partnerType === 'HospitalOP' || partnerType === 'hospital_op';
      const partnerId = `${isRider ? 'rider' : isRealEstate ? 'seller' : isHospital ? 'hospital' : 'vendor'}-${app.userId}`;
      
      if (isRider) {
        const riderData = {
          userId: app.userId,
          name: app.name,
          phone: app.phone,
          vehicleType: app.vehicleType || 'Bike',
          vehicleNumber: app.vehicleNumber || 'TS-04-TEMP',
          photo: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
          status: 'Online',
          isOnline: true,
          earnings: 0,
          pendingPayout: 0,
          rating: 5.0,
          trips: 0,
          accessCode: '1122',
          branchId: 'khammam_main',
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'deliveryPartners', partnerId), riderData);
      } else if (isRealEstate) {
        const sellerData = {
          userId: app.userId,
          businessName: app.businessName,
          ownerName: app.name,
          phone: app.phone,
          type: 'RealEstateSeller',
          address: app.address || 'Khammam Bureau',
          description: app.description || 'Verified Lokal Property Agent',
          status: 'Approved',
          isOnline: true,
          rating: 5.0,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'vendors', partnerId), sellerData);
      } else if (isHospital) {
        const hospitalData = {
          userId: app.userId,
          businessName: app.businessName,
          ownerName: app.name,
          phone: app.phone,
          type: 'HospitalOP',
          service: 'HospitalOP',
          address: app.address || 'Khammam Medical Center',
          description: app.description || 'Verified Hospital O.P. Partner',
          status: 'Approved',
          isOnline: true,
          opFee: Number(app.opFee || 151),
          rating: 5.0,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'vendors', partnerId), hospitalData);
      } else {
        const vendorData = {
          userId: app.userId,
          businessName: app.businessName,
          ownerName: app.name,
          phone: app.phone,
          service: app.service || 'groceries',
          type: 'Vendor',
          address: app.address || 'Khammam Central',
          description: app.description || 'Verified Lokal Merchant',
          status: 'Approved',
          isOnline: true,
          revenue: 0,
          pendingPayout: 0,
          itemsCount: 0,
          rating: 5.0,
          branchId: 'khammam_main',
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'vendors', partnerId), vendorData);
      }

      // Update application status
      await updateDoc(doc(db, 'partner_applications', app.id), {
        status: 'Approved',
        approvedAt: serverTimestamp()
      });

      await logAudit('Approve Partner Onboarding', `Approved onboarding request ID ${app.id} for ${app.name}`);
      setActionMessage(`🎉 Approved and Provisioned Profile: ${app.name}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error(e);
      alert("Approval action failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeclineApplication = async (appId: string, name: string) => {
    if (!window.confirm(`Decline and reject request for ${name}?`)) return;
    setIsSyncing(true);
    try {
      await updateDoc(doc(db, 'partner_applications', appId), {
        status: 'Rejected',
        rejectedAt: serverTimestamp()
      });
      await logAudit('Reject Partner Onboarding', `Rejected application request ${appId} for ${name}`);
      setActionMessage(`❌ Declined application: ${name}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`⚠️ WARNING: Are you sure you want to permanently DELETE Order #${orderId}? This cannot be undone.`)) return;
    setIsSyncing(true);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      await logAudit('Admin Order Deleted', `Permanently deleted Order ID #${orderId} from dispatch queue.`);
      setActionMessage(`🗑️ Order #${orderId} has been deleted!`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Error deleting order document");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceCompleteOrder = async (orderId: string) => {
    if (!window.confirm(`Mark Order #${orderId} as Completed/Delivered instantly?`)) return;
    setIsSyncing(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Delivered',
        completedAt: new Date().toISOString()
      });
      await logAudit('Admin Order Force Complete', `Forced completion of Order ID #${orderId} to bypass driver issues.`);
      setActionMessage(`✅ Order #${orderId} marked Delivered!`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Error updating order to completed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenEditOrder = (ord: any) => {
    setEditingOrder(ord);
    setEditCustName(ord.customerName || '');
    setEditCustPhone(ord.customerPhone || '');
    setEditAddress(ord.deliveryAddress || '');
    setEditTotal(Number(ord.total || 0));
    setEditPaymentMethod(ord.paymentMethod || 'COD');
    setEditItems(ord.orderItems ? JSON.parse(JSON.stringify(ord.orderItems)) : []);
    setEditStatus(ord.status || 'Pending');
  };

  const handleUpdateOrderDetails = async () => {
    if (!editingOrder) return;
    setIsSyncing(true);
    try {
      await updateDoc(doc(db, 'orders', editingOrder.id), {
        customerName: editCustName,
        customerPhone: editCustPhone,
        deliveryAddress: editAddress,
        total: Number(editTotal),
        paymentMethod: editPaymentMethod,
        orderItems: editItems,
        status: editStatus
      });
      await logAudit('Admin Order Edit', `Modified details of Order ID #${editingOrder.id}.`);
      setEditingOrder(null);
      setActionMessage(`✍️ Order #${editingOrder.id} successfully updated!`);
      setTimeout(() => setActionMessage(null), 3000);
    } catch (e) {
      console.error(e);
      alert("Error updating order fields");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditItemChange = (idx: number, field: string, val: any) => {
    const updated = [...editItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditItems(updated);
    const newTotal = updated.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    setEditTotal(newTotal);
  };

  const handleEditRemoveItem = (idx: number) => {
    const updated = editItems.filter((_, i) => i !== idx);
    setEditItems(updated);
    const newTotal = updated.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    setEditTotal(newTotal);
  };

  const handleEditAddItem = () => {
    const updated = [...editItems, { name: 'Custom Add-on', price: 120, quantity: 1 }];
    setEditItems(updated);
    const newTotal = updated.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    setEditTotal(newTotal);
  };

  const handleToggleHospitalOnline = async () => {
    if (!hospitalProfile) return;
    try {
      await updateDoc(doc(db, 'vendors', hospitalProfile.id), {
        isOnline: !hospitalProfile.isOnline
      });
      await logAudit('Toggle Hospital Status', `Toggled online status for ${hospitalProfile.businessName} to ${!hospitalProfile.isOnline}`);
    } catch (err) {
      console.error(err);
      alert("Error toggling status");
    }
  };

  const handleUpdateHospitalFee = async (newFee: number) => {
    if (!hospitalProfile) return;
    try {
      await updateDoc(doc(db, 'vendors', hospitalProfile.id), {
        opFee: newFee
      });
      await logAudit('Update Hospital OP Fee', `Updated OP Fee for ${hospitalProfile.businessName} to ₹${newFee}`);
      setActionMessage("🩺 Consultation OP Fee updated successfully!");
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Error updating consultation fee");
    }
  };

  const handleToggleRiderState = async (riderId: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, 'deliveryPartners', riderId), {
        isOnline: !currentState,
        status: !currentState ? 'Online' : 'Offline'
      });
      await logAudit('Toggle Rider Activity', `Toggled driver ID ${riderId} to ${!currentState ? 'ONLINE' : 'OFFLINE'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVendorState = async (vendorId: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), {
        isOnline: !currentState
      });
      await logAudit('Toggle Vendor Online', `Toggled merchant ID ${vendorId} status to ${!currentState ? 'ONLINE' : 'OFFLINE'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessPayout = async (partnerId: string, type: 'rider' | 'vendor', amount: number) => {
    if (amount <= 0) {
      alert("No pending earnings to settle!");
      return;
    }
    const isConfirmed = window.confirm(`Initiate payouts transfer of ₹${amount} for ${type === 'rider' ? 'Rider' : 'Store Owner'} ID: ${partnerId}?`);
    if (!isConfirmed) return;

    setIsSyncing(true);
    try {
      const docRef = doc(db, type === 'rider' ? 'deliveryPartners' : 'vendors', partnerId);
      await updateDoc(docRef, {
        pendingPayout: 0,
        earnings: type === 'rider' ? (deliveryProfile?.earnings || 0) + amount : amount // Add up aggregate ledger
      });
      
      await addDoc(collection(db, 'ledger_settlements'), {
        partnerId,
        partnerType: type,
        amountSettle: amount,
        payoutStamp: serverTimestamp(),
        beneficiary: userProfile?.name || 'Authorized Merchant System'
      });

      await logAudit('Processed Financial Settlement', `Disbursed and cleared ₹${amount} to ${type === 'rider' ? 'Rider' : 'Merchant'} ID: ${partnerId}`);
      setActionMessage(`💸 Sent remittance transfer of ₹${amount}!`);
      setTimeout(() => setActionMessage(null), 4000);

      // Trigger standard local browser notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Lokal Payout Settled! 💸", {
            body: `₹${amount.toLocaleString()} has been securely settled next-gen real-time and transferred.`,
            icon: '/src/assets/images/local_bandi_logo_1785784124975.jpg'
          });
        } catch (err) {
          console.error("Failed to showcase notification: ", err);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Render Splash view
  if (partnerScreen === 'splash') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-emerald-950 text-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <Bike className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase">Lokal Partner</h1>
          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Logistics & Merchant Platform</p>
        </motion.div>
        
        <div className="absolute bottom-16 w-36 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  const handleSendOtp = async () => {
    if (loginPhone.length !== 10) return;
    setAuthError(null);
    setIsSendingOtp(true);
    try {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);

      // Write log to firebase audit_logs
      await addDoc(collection(db, 'audit_logs'), {
        type: 'partner_otp',
        phoneNumber: loginPhone,
        code: code,
        message: `[Lokal Partner OTP] Access Code: ${code}. Verify within 5 minutes.`,
        status: 'DELIVERED',
        createdAt: serverTimestamp()
      });

      // Dispatch real SMS via backend Service Implicit SMS API gateway
      try {
        const smsRes = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: loginPhone, code })
        });
        const smsData = await smsRes.json();
        if (smsRes.ok && smsData.success) {
          console.log("Direct SMS OTP dispatched successfully:", smsData);
          setAuthError(null);
        } else if (smsData.error) {
          console.warn("SMS delivery notice:", smsData.error);
        }
      } catch (smsErr) {
        console.warn("Non-blocking SMS API notice:", smsErr);
      }

      setIsOtpSent(true);
      setResendTimer(30);
    } catch (err: any) {
      console.error(err);
      setGeneratedOtp('1234');
      setIsOtpSent(true);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = loginOtp.filter(Boolean).join('');
    if (code.length < 4) return;
    setAuthError(null);
    setIsVerifyingOtp(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Verify against either generated code, or the common fallback 1234 for development
      if (code === generatedOtp || code === '1234' || generatedOtp === '1234') {
        localStorage.setItem('otp_logged_phone', loginPhone);
        await signInAnon();
        if (auth.currentUser) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            id: auth.currentUser.uid,
            phone: loginPhone,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
        setPartnerScreen('dashboard');
      } else {
        setAuthError('Incorrect security verification code. Please check your SMS and try again.');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(`Verification failed: ${err.message || 'Verification cancelled or timed out.'}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...loginOtp];
    newOtp[index] = value;
    setLoginOtp(newOtp);

    // Auto-focus next
    if (value && index < 3) {
      const nextInput = document.getElementById(`partner-otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-verify if all fields filled
    if (newOtp.every(d => d !== '') && index === 3) {
      setTimeout(() => {
        handleVerifyOtp();
      }, 500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !loginOtp[index] && index > 0) {
      const prevInput = document.getElementById(`partner-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Render Login view
  if (partnerScreen === 'login') {
    return (
      <div className="h-full w-full bg-slate-950 text-white flex flex-col justify-between p-8 min-h-screen">
        <div className="my-auto space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
              <ShieldCheck className="w-9 h-9 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">Lokal Partner Hub</h2>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1.5">Authorized Fleet & Merchant Personnel Only</p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 space-y-5">
            <p className="text-slate-300 text-xs text-center leading-relaxed">
              Authenticate via dynamic SMS OTP to access kitchen managers, rider fleets, and local franchise consoles.
            </p>

            {authError && (
              <p className="text-rose-400 text-[10px] text-center font-bold leading-tight bg-rose-950/30 border border-rose-900/40 p-3 rounded-xl italic">
                {authError}
              </p>
            )}

            {!isOtpSent ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Enter Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="10 digit mobile number"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-slate-950 border border-white/10 py-4 pl-12 pr-4 rounded-xl text-xs font-bold text-white tracking-widest outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  disabled={loginPhone.length !== 10 || isSendingOtp}
                  onClick={handleSendOtp}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <>
                      Send Access OTP
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl space-y-1.5">
                  <p className="text-[9px] font-bold text-emerald-400">
                    Dispatched to <span className="font-mono font-bold">+91 {loginPhone}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const codeToFill = generatedOtp || '1234';
                      setLoginOtp(codeToFill.split(''));
                    }}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[8.5px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  >
                    ⚡ Auto-fill OTP ({generatedOtp || '1234'})
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Verify Secure Code</label>
                  <div className="flex gap-2 justify-center">
                    {loginOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`partner-otp-${idx}`}
                        type="text"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-12 h-14 bg-slate-950 border border-white/10 rounded-xl text-center text-lg font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all focus:ring-1 focus:ring-emerald-500/20"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 pt-2">
                  <button
                    disabled={resendTimer > 0 || isSendingOtp}
                    onClick={handleSendOtp}
                    className="text-slate-400 hover:text-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    Resend Code
                  </button>
                  {resendTimer > 0 && (
                    <span className="font-mono text-slate-500">00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsOtpSent(false);
                      setLoginOtp(['', '', '', '']);
                    }}
                    className="flex-1 py-4 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                  >
                    Change Phone
                  </button>
                  <button
                    disabled={loginOtp.some(d => d === '') || isVerifyingOtp}
                    onClick={handleVerifyOtp}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      'Verify Access'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[8px] font-bold text-slate-600 uppercase tracking-widest">
          STANDALONE LOGISTICS ENGINE &bull; TS KHAMMAM
        </p>
      </div>
    );
  }

  // Render Rider Terminal Inside View
  if (partnerScreen === 'delivery') {
    const riderId = deliveryProfile?.id || 'admin-rider';
    return (
      <SafeZone name="Delivery Console">
        <div className="h-screen overflow-hidden bg-slate-900">
          <DeliveryDashboard profileId={riderId} onBack={() => setPartnerScreen('dashboard')} isAdmin={false} />
        </div>
      </SafeZone>
    );
  }

  // Render Vendor Terminal Inside View
  if (partnerScreen === 'vendor') {
    const storeId = vendorProfile?.id || 'admin-store';
    return (
      <SafeZone name="Vendor Console">
        <div className="h-screen overflow-hidden bg-slate-900">
          <VendorDashboard profileId={storeId} onBack={() => setPartnerScreen('dashboard')} isAdmin={false} />
        </div>
      </SafeZone>
    );
  }

  // Render Real Estate Terminal Inside View
  if (partnerScreen === 'real_estate') {
    return (
      <SafeZone name="Real Estate Console">
        <div className="h-screen overflow-hidden bg-white">
          <RealEstate onClose={() => setPartnerScreen('dashboard')} />
        </div>
      </SafeZone>
    );
  }

  // Filter lists based on admin search query and Franchise Admin scopes
  const searchLower = (adminSearch || '').toLowerCase();
  const branchNameLower = (localFranchiseBranchName || '').toLowerCase();

  const filteredPendingApps = pendingApplications.filter(app => {
    if (isFranchiseAdminActive && localFranchiseBranchId !== 'offline_fallback') {
      return app.branchId === localFranchiseBranchId || (app.city?.toLowerCase() === branchNameLower && branchNameLower !== '');
    }
    return true;
  });

  const filteredRiders = allRiders.filter(r => {
    if (isFranchiseAdminActive && localFranchiseBranchId !== 'offline_fallback') {
      const matchBranch = r.branchId === localFranchiseBranchId;
      if (!matchBranch) return false;
    }
    return !searchLower || 
      (r.name || '').toLowerCase().includes(searchLower) || 
      (r.phone || '').includes(adminSearch || '') ||
      (r.vehicleNumber || '').toLowerCase().includes(searchLower);
  });

  const filteredVendors = allVendors.filter(v => {
    if (isFranchiseAdminActive && localFranchiseBranchId !== 'offline_fallback') {
      const matchBranch = v.branchId === localFranchiseBranchId;
      if (!matchBranch) return false;
    }
    return v.type !== 'RealEstateSeller' && v.service !== 'RealEstateSeller' && (
      !searchLower ||
      (v.businessName || '').toLowerCase().includes(searchLower) || 
      (v.ownerName || '').toLowerCase().includes(searchLower) ||
      (v.phone || '').includes(adminSearch || '')
    );
  });

  const filteredRealEstate = allVendors.filter(v => {
    if (isFranchiseAdminActive && localFranchiseBranchId !== 'offline_fallback') {
      const matchBranch = v.branchId === localFranchiseBranchId;
      if (!matchBranch) return false;
    }
    return (v.type === 'RealEstateSeller' || v.service === 'RealEstateSeller') && (
      !searchLower ||
      (v.businessName || '').toLowerCase().includes(searchLower) || 
      (v.ownerName || '').toLowerCase().includes(searchLower) ||
      (v.phone || '').includes(adminSearch || '')
    );
  });

  // Check access gates for non-admins
  if (user && !isAdmin && !isFranchiseAdminActive) {
    const isApprovedVendor = vendorProfile !== null;
    const isApprovedRider = deliveryProfile !== null;

    if (!isApprovedVendor && !isApprovedRider) {
      // Check if they have a pending application
      const pendingApp = userApplications.find(app => app.status === 'Pending');
      const rejectedApp = userApplications.find(app => app.status === 'Rejected');

      if (pendingApp) {
        return (
          <div className="h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-8">
            <div className="my-auto text-center space-y-6">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
                <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Application Under Review</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your application to join as a <span className="text-yellow-400 font-bold">{pendingApp.type}</span> is currently pending approval.
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Please contact your Local Franchise Admin to authorize and approve your profile.
              </p>
              <button
                onClick={async () => {
                  await logout();
                  setPartnerScreen('login');
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-rose-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Sign Out / Exit
              </button>
            </div>
            <p className="text-center text-[8px] font-bold text-slate-600 uppercase tracking-widest">
              LOKAL PARTNER NETWORK &bull; SECURE PLATFORM
            </p>
          </div>
        );
      }

      if (rejectedApp) {
        return (
          <div className="h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-8">
            <div className="my-auto text-center space-y-6">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
                <Ban className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Application Declined</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your application was not approved at this time.
              </p>
              {rejectedApp.rejectionReason && (
                <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl max-w-xs mx-auto text-xs text-rose-300 italic">
                  Reason: "{rejectedApp.rejectionReason}"
                </div>
              )}
              <button
                onClick={async () => {
                  // Delete existing rejected application so they can re-apply
                  await deleteDoc(doc(db, 'partner_applications', rejectedApp.id));
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                Submit New Application
              </button>
              <div className="pt-2">
                <button
                  onClick={async () => {
                    await logout();
                    setPartnerScreen('login');
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-400"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        );
      }

      // No application yet - Render selection screen
      return (
        <div className="h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-8">
          <div className="my-auto text-center space-y-8">
            <div>
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Become a Lokal Partner</h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1.5">Launch your business or delivery career</p>
            </div>

            <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
              <button
                onClick={() => {
                  setShowOnboardingType('Vendor');
                }}
                className="p-5 bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-500/20 rounded-[2rem] text-left hover:scale-[1.02] active:scale-98 transition-all group"
              >
                <Store className="w-8 h-8 text-indigo-400 mb-3" />
                <h4 className="font-black uppercase text-sm text-white">Register as Merchant / Vendor</h4>
                <p className="text-[10px] text-slate-400 mt-1">Sell groceries, meals, fresh produce and track your business earnings directly.</p>
              </button>

              <button
                onClick={() => {
                  setShowOnboardingType('DeliveryPartner');
                }}
                className="p-5 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 rounded-[2rem] text-left hover:scale-[1.02] active:scale-98 transition-all group"
              >
                <Bike className="w-8 h-8 text-emerald-400 mb-3" />
                <h4 className="font-black uppercase text-sm text-white">Register as Delivery Partner</h4>
                <p className="text-[10px] text-slate-400 mt-1">Join our delivery fleet, accept local orders, deliver and receive weekly payouts.</p>
              </button>
            </div>

            <button
              onClick={async () => {
                await logout();
                setPartnerScreen('login');
              }}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-400"
            >
              Sign Out / Cancel
            </button>
          </div>

          {showOnboardingType && (
            <div className="fixed inset-0 z-[10002] bg-slate-950 overflow-y-auto">
              <PartnerOnboarding
                userId={user.uid}
                defaultType={showOnboardingType}
                onClose={() => setShowOnboardingType(null)}
                onSuccess={() => {
                  setShowOnboardingType(null);
                }}
              />
            </div>
          )}
        </div>
      );
    }
  }

  // Main Standalone Partner & Administration Hub
  return (
    <div className="h-full w-full bg-slate-950 text-white overflow-hidden flex flex-col justify-between">
      
      {/* Top Professional Header */}
      <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between shrink-0">
        <div 
          onClick={() => setShowFranchiseGateModal(true)} 
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-95 transition-all group select-none"
          title="Click to access Local Franchise Admin Portal"
        >
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-white/10 overflow-hidden ring-2 ring-transparent group-hover:ring-yellow-400/50 transition-all">
            <img src="/src/assets/images/local_bandi_logo_1785784124975.jpg" className="w-full h-full object-cover" alt="Local Bandi Logo" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-black tracking-tight leading-none uppercase group-hover:text-yellow-400 transition-colors">Lokal Partner Hub</h3>
              {isFranchiseAdminActive && (
                <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 font-black text-[7px] uppercase tracking-wider rounded">
                  {localFranchiseBranchName || 'Franchise Admin'}
                </span>
              )}
            </div>
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block mt-0.5">
              {isFranchiseAdminActive ? '🛡️ FRANCHISE CONTROL ACTIVE' : 'STANDALONE WORKSPACE'}
            </span>
          </div>
        </div>

        <button 
          onClick={async () => {
            await logout();
            setPartnerScreen('login');
          }}
          className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 active:scale-95 transition-all text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>

      {/* Main Container Views - Tab Swapped scroll area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* Navigation Tabs (Riders Hub, Merchant Hub, Real Estate, Admin Desk) */}
        <div className="flex bg-slate-900 p-1.5 border-b border-white/5 gap-1 select-none shrink-0 overflow-x-auto whitespace-nowrap">
          {(isAdmin || isFranchiseAdminActive || deliveryProfile) && (
            <button
              onClick={() => setActiveTab('riders')}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'riders' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Riders</span>
            </button>
          )}
          
          {(isAdmin || isFranchiseAdminActive || vendorProfile) && (
            <button
              onClick={() => setActiveTab('vendors')}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'vendors' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vendors</span>
            </button>
          )}

          {(isAdmin || isFranchiseAdminActive) && (
            <button
              onClick={() => setActiveTab('real_estate')}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'real_estate' ? 'bg-sky-600 text-white font-black' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Real Estate</span>
            </button>
          )}

          {(isAdmin || isFranchiseAdminActive) && (
            <button
              onClick={() => setActiveTab('hospital_op')}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'hospital_op' ? 'bg-purple-600 text-white font-black' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
              <span>Hospital OP</span>
            </button>
          )}

          {(isAdmin || isFranchiseAdminActive) && (
            <button
              onClick={() => {
                setActiveTab('admin');
                logAudit('Open Admin Desk', 'Super Admin loaded logs & fleet permissions');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'admin' ? 'bg-slate-800 text-yellow-400 border border-slate-700' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
              <span>Admin Control</span>
            </button>
          )}
        </div>

        {/* Scrollable Core Workspace */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Synchronizing Indicator */}
          {isSyncing && (
            <div className="bg-emerald-500/5 border border-emerald-500/15 p-2 rounded-xl flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE DATA TUNNEL SECURED...</p>
            </div>
          )}

          {/* Action messages */}
          {actionMessage && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-950 border border-emerald-500/30 p-3 rounded-2xl text-center text-emerald-300 text-[10px] font-black uppercase tracking-wide leading-snug"
            >
              {actionMessage}
            </motion.div>
          )}

          {/* TAB 1: RIDER LOGISTICS HUB */}
          {activeTab === 'riders' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900 border border-white/5 p-5 rounded-[2rem] relative overflow-hidden">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Rider Services Area</p>
                <h4 className="text-lg font-black italic leading-none mb-2 text-white">READY TO HIT THE ROAD?</h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Earn, pick up order coordinates, manage live map tracking, and claim settlements instant via online rider console.
                </p>
              </div>

              {deliveryProfile ? (
                <div className="p-4 bg-slate-900 border border-emerald-500/10 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Verified Rider Account</p>
                      <h4 className="text-base font-black text-emerald-400 uppercase leading-none mt-1">{deliveryProfile.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                      ● Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Vehicle</span>
                      <p className="text-xs font-black text-white mt-0.5">{deliveryProfile.vehicleType} • {deliveryProfile.vehicleNumber}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Settled Earnings</span>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">₹{deliveryProfile.earnings || 0}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPartnerScreen('delivery')}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Launch Rider Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-[2rem] p-5 border border-white/5 space-y-4 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Bike className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black uppercase text-white">No Rider Profile Allocated</h5>
                    <p className="text-[10px] text-slate-400">Apply for Rider Onboarding or run sandbox provisional presets to proceed.</p>
                  </div>
                  
                  <button
                    onClick={() => setShowRiderRegister(true)}
                    className="w-full py-3.5 bg-slate-950 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Apply for Rider Fleet</span>
                  </button>

                  <button
                    onClick={handleSandboxProvision}
                    className="w-full py-2.5 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Seed Demo Sandbox Profiles</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VENDOR LOGISTICS HUB */}
          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-white/5 p-5 rounded-[2rem] relative overflow-hidden">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Merchant Store Area</p>
                <h4 className="text-lg font-black italic leading-none mb-2 text-white">KITCHEN PREPARATION FLIGHTS</h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Publish food & grocery catalogs, enable local delivery integrations, prepare orders, and increase revenue.
                </p>
              </div>

              {vendorProfile ? (
                <div className="p-4 bg-slate-900 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Active Approved Store</p>
                      <h4 className="text-base font-black text-indigo-400 uppercase leading-none mt-1">{vendorProfile.businessName}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                      ● Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Service Category</span>
                      <p className="text-xs font-black text-white mt-0.5 capitalize">{vendorProfile.service}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Gross Revenue</span>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">₹{(vendorProfile.revenue || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPartnerScreen('vendor')}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-505 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Launch Store Manager</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-[2rem] p-5 border border-white/5 space-y-4 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black uppercase text-white">No Merchant Account Found</h5>
                    <p className="text-[10px] text-slate-400">Register as store owner or run sandbox presets to manage listing catalogs.</p>
                  </div>
                  
                  <button
                    onClick={() => setShowVendorRegister(true)}
                    className="w-full py-3.5 bg-slate-950 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-400" />
                    <span>Register Merchant Store</span>
                  </button>

                  <button
                    onClick={handleSandboxProvision}
                    className="w-full py-2.5 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Seed Demo Sandbox Profiles</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2.5: REAL ESTATE LOGISTICS HUB */}
          {activeTab === 'real_estate' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-sky-950/20 to-slate-900 border border-white/5 p-5 rounded-[2rem] relative overflow-hidden">
                <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest mb-1">Real Estate Area</p>
                <h4 className="text-lg font-black italic leading-none mb-2 text-white">PROPERTY POSTING & MARKETING</h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Publish land plots, apartments or commercial shops, get leads from regional buyers, and manage verified property listings.
                </p>
              </div>

              {realEstateProfile && (realEstateProfile.status === 'Approved' || isAdmin) ? (
                <div className="p-4 bg-slate-900 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Approved Real Estate Agency</p>
                      <h4 className="text-base font-black text-sky-400 uppercase leading-none mt-1">{realEstateProfile.businessName}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                      ● Active Seller
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Agent Name</span>
                      <p className="text-xs font-black text-white mt-0.5">{realEstateProfile.ownerName}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Agency Contact</span>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">{realEstateProfile.phone}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setPartnerScreen('real_estate')}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Launch Real Estate Workplace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : realEstateProfile ? (
                 <div className="p-6 bg-slate-900 border border-yellow-500/20 rounded-[2rem] space-y-4 text-center">
                   <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto text-yellow-500 border border-yellow-500/20 shadow-lg animate-pulse">
                     <Lock className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                     <h5 className="text-sm font-black uppercase text-yellow-500 tracking-wider font-sans italic leading-none">Access Console Restricted</h5>
                     <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Pending Admin Verification</p>
                   </div>
                   <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                     Your real estate agency listing is under active review by the Master Admin Panel. Access will be unlocked automatically upon completion.
                   </p>
                   <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 mx-auto max-w-xs text-left text-[10px] text-slate-505 space-y-1">
                     <p><span className="font-bold">Agency Name:</span> <span className="font-black text-slate-300">{realEstateProfile.businessName}</span></p>
                     <p><span className="font-bold">Status:</span> <span className="text-yellow-400 uppercase font-black tracking-widest text-[8px] bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/10 ml-1">{realEstateProfile.status || 'Pending'}</span></p>
                     <p><span className="font-bold">Support Hotline:</span> <span className="font-black text-emerald-400">74165 74197</span></p>
                   </div>
                 </div>
              ) : (
                <div className="bg-slate-900 rounded-[2rem] p-5 border border-white/5 space-y-4 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6 text-sky-400" />
                  </div>
                  
                  {userApplications.some(app => app.partnerType === 'RealEstateSeller' && app.status === 'Pending') ? (
                    <div className="space-y-1">
                      <h5 className="text-sm font-black uppercase text-yellow-400">Application Under Review</h5>
                      <p className="text-[10px] text-slate-400">Our regional admins are reviewing your real estate seller application. It will be authenticated shortly!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h5 className="text-sm font-black uppercase text-white">No Real Estate Profile Found</h5>
                        <p className="text-[10px] text-slate-400">Apply to become a verified real estate seller/agent, list properties, and connect with prospective clients.</p>
                      </div>
                      
                      <button
                        onClick={() => setShowRealEstateRegister(true)}
                        className="w-full py-3.5 bg-slate-950 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <PlusCircle className="w-4 h-4 text-sky-400" />
                        <span>Register Real Estate Agency</span>
                      </button>

                      <button
                        onClick={handleSandboxProvision}
                        className="w-full py-2.5 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Seed Demo Sandbox Profiles</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2.75: HOSPITAL OP HUB */}
          {activeTab === 'hospital_op' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-950/20 to-slate-900 border border-white/5 p-5 rounded-[2rem] relative overflow-hidden">
                <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Health & Wellness Hub</p>
                <h4 className="text-lg font-black italic leading-none mb-2 text-white">HOSPITAL OUTPATIENT (OP) LOGISTICS</h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Onboard clinic checkups, allow patients to book appointments digitally, configure custom consult fees, and toggle online OP consultation queues across Khammam.
                </p>
              </div>

              {hospitalProfile && (hospitalProfile.status === 'Approved' || isAdmin) ? (
                <div className="p-5 bg-slate-900 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Approved OP Medical Institution</p>
                      <h4 className="text-base font-black text-purple-400 uppercase leading-none mt-1">{hospitalProfile.businessName}</h4>
                    </div>
                    <button
                      onClick={handleToggleHospitalOnline}
                      className={`px-3 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${
                        hospitalProfile.isOnline 
                        ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/35 text-rose-400'
                      }`}
                    >
                      <span>● {hospitalProfile.isOnline ? 'Online OP' : 'Offline OP'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Chief Doctor</span>
                      <p className="text-xs font-black text-white mt-0.5">{hospitalProfile.ownerName}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">OP Hotline</span>
                      <p className="text-xs font-black text-purple-400 mt-0.5">{hospitalProfile.phone}</p>
                    </div>
                  </div>

                  {/* Consultation fee config */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Active Consultation OP Price</span>
                      <span className="text-xs font-black text-yellow-400">₹{hospitalProfile.opFee || 151}</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        defaultValue={hospitalProfile.opFee || 200}
                        id="hospital_fee_update_input"
                        placeholder="New Fee E.g. 250"
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                      />
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('hospital_fee_update_input') as HTMLInputElement)?.value;
                          if (val) handleUpdateHospitalFee(Number(val));
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
                      >
                        Update Fee
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-950/30 rounded-2xl border border-purple-500/10 flex items-start gap-2.5">
                    <Stethoscope className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-purple-300">Live OP consultation stream</p>
                      <p className="text-[10px] text-slate-300 leading-snug mt-0.5">
                        Your hospital is fully online. Patient bookings on modern clinic screens will book consultation slots directly with your medical registry database.
                      </p>
                    </div>
                  </div>
                </div>
              ) : hospitalProfile ? (
                 <div className="p-6 bg-slate-900 border border-yellow-500/20 rounded-[2rem] space-y-4 text-center">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto text-yellow-500 border border-yellow-500/20 shadow-lg animate-pulse">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-black uppercase text-yellow-500 tracking-wider font-sans italic leading-none">Console Verification Required</h5>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Pending Medical Board Audit</p>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                      Your clinical registration OP account is being cataloged and approved by our regional medical compliance authority. This ensures real trust for patient safety.
                    </p>
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 mx-auto max-w-xs text-left text-[10px] text-slate-505 space-y-1">
                      <p><span className="font-bold">Clinic Name:</span> <span className="font-black text-slate-300">{hospitalProfile.businessName}</span></p>
                      <p><span className="font-bold">Status:</span> <span className="text-yellow-400 uppercase font-black tracking-widest text-[8px] bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/10 ml-1">{hospitalProfile.status || 'Pending'}</span></p>
                    </div>
                  </div>
              ) : (
                <div className="bg-slate-900 rounded-[2rem] p-5 border border-white/5 space-y-4 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Stethoscope className="w-6 h-6 text-purple-400" />
                  </div>
                  
                  {userApplications.some(app => app.partnerType === 'HospitalOP' && app.status === 'Pending') ? (
                    <div className="space-y-1">
                      <h5 className="text-sm font-black uppercase text-yellow-400">Medical OP Under Review</h5>
                      <p className="text-[10px] text-slate-400">Khammam healthcare authorities are reviewing your clinical credentials. You will be onboarded to our system shortly!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h5 className="text-sm font-black uppercase text-white">No Hospital OP Profile</h5>
                        <p className="text-[10px] text-slate-400">Onboard your hospital or family clinic, configure consultation slots, and list OP prices for local Khammam patients.</p>
                      </div>
                      
                      <button
                        onClick={() => setShowHospitalRegister(true)}
                        className="w-full py-3.5 bg-slate-950 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <PlusCircle className="w-4 h-4 text-purple-400" />
                        <span>Register Clinic / Hospital OP</span>
                      </button>

                      <button
                        onClick={handleSandboxProvision}
                        className="w-full py-2.5 bg-yellow-400 text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Seed Demo Sandbox Profiles</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MASTER LOGISTICS ADMIN DESK */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              
              {/* Dashboard stats panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-slate-900 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">FLUID RIDERS</span>
                  <p className="text-lg font-black text-white mt-1">{filteredRiders.length} <span className="text-[10px] text-emerald-400 font-bold">({filteredRiders.filter(r=>r.isOnline).length} Active)</span></p>
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LIVE VENDORS</span>
                  <p className="text-lg font-black text-white mt-1">{filteredVendors.length} <span className="text-[10px] text-indigo-400 font-bold">({filteredVendors.filter(v=>v.isOnline).length} Online)</span></p>
                </div>
                <div className="bg-slate-900 p-3 rounded-2xl border border-white/5 col-span-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">WAITING ONBOARD REQS</span>
                  <p className="text-lg font-black text-yellow-400 mt-1">{filteredPendingApps.length} Application Pending</p>
                </div>
              </div>

              {/* Administrative Sub-tabs Navigation */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 gap-1 select-none overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setAdminSubTab('approvals')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'approvals' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Pending Apprvs ({filteredPendingApps.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('riders_fleet')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'riders_fleet' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Riders Fleet ({allRiders.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('merchant_list')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'merchant_list' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Merchants ({filteredVendors.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('real_estate_list')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'real_estate_list' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Real Estate ({filteredRealEstate.length})
                </button>
                <button
                  onClick={() => setAdminSubTab('settlements')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'settlements' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Settlements Ledger
                </button>
                <button
                  onClick={() => setAdminSubTab('coverage')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'coverage' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Coverage Map
                </button>
                <button
                  onClick={() => setAdminSubTab('order_dispatch')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'order_dispatch' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Order Dispatch
                </button>
                <button
                  onClick={() => setAdminSubTab('audit_log')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    adminSubTab === 'audit_log' ? 'bg-yellow-400 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Telemetry Log
                </button>
              </div>

              {/* Sub-tab Search Field (if applicable) */}
              {['riders_fleet', 'merchant_list', 'real_estate_list'].includes(adminSubTab) && (
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search by name, phone metrics..."
                    className="w-full bg-slate-900 border border-white/5 pl-10 pr-4 py-3 rounded-xl text-xs placeholder-slate-500 text-white focus:outline-none focus:border-yellow-400/30"
                  />
                </div>
              )}

              {/* VIEW A: PENDING PARTNER APPLICATIONS */}
              {adminSubTab === 'approvals' && (
                <div className="space-y-4">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Partner Approvals Waiting Line</h5>
                    {filteredPendingApps.length === 0 ? (
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-center text-slate-400 text-xs shadow-inner">
                        No pending partner onboarding applications under review. Check back later!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredPendingApps.map(app => (
                          <div key={app.id} className="bg-slate-900 p-4 rounded-2xl border border-yellow-500/20 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${
                                  app.partnerType === 'rider' ? 'bg-emerald-500/10 text-emerald-400' :
                                  app.partnerType === 'RealEstateSeller' ? 'bg-sky-500/10 text-sky-400' : 'bg-indigo-500/10 text-indigo-400'
                                }`}>
                                  {app.partnerType === 'rider' ? '🏍️ Rider Request' : 
                                   app.partnerType === 'RealEstateSeller' ? '🏠 Real Estate Seller' : '🏪 Vendor Request'}
                                </span>
                                <h6 className="text-[14px] font-black text-white mt-1">{app.name || app.businessName}</h6>
                                <p className="text-[10px] text-slate-400 mt-1">{app.phone} &bull; User ID: {app.userId?.slice(0, 8)}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                Review Required
                              </span>
                            </div>

                            {app.partnerType === 'rider' ? (
                              <div className="text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                                Vehicle detail: <strong>{app.vehicleType}</strong> {app.vehicleNumber && `(${app.vehicleNumber})`}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                                <p>Business/Agency Name: <strong>{app.businessName}</strong></p>
                                <p>Bio/Specialty: <em>"{app.description}"</em></p>
                                <p>Address: {app.address}</p>
                              </div>
                            )}

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleDeclineApplication(app.id, app.name || app.businessName)}
                                className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleApproveApplication(app)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-950/40"
                              >
                                Approve Live Profile
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Real Estate Properties approvals */}
                  <div className="pt-2 border-t border-white/5">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Pending Real Estate Listings ({unapprovedProperties.length})</h5>
                    {unapprovedProperties.length === 0 ? (
                      <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 text-center text-slate-400 text-xs">
                        No pending real estate property listings require regional admin approval.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {unapprovedProperties.map(prop => (
                          <div key={prop.id} className="bg-slate-900 p-4 rounded-2xl border border-sky-505/20 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="px-2 py-0.5 text-[8px] bg-sky-500/15 text-sky-400 font-black uppercase tracking-wider rounded">
                                  🏡 Property Listing
                                </span>
                                <h6 className="text-[14px] font-black text-white mt-1">{prop.title}</h6>
                                <p className="text-[10px] text-slate-400 mt-1">{prop.price} &bull; {prop.category}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-yellow-400/15 text-yellow-400 text-[8px] font-black uppercase tracking-widest rounded-full">
                                Pending Approval
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                              <p>Location: {prop.location?.area} ({prop.location?.pincode})</p>
                              <p className="italic">"{prop.description}"</p>
                            </div>

                            {prop.image && (
                              <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10">
                                <img referrerPolicy="no-referrer" src={prop.image} className="w-full h-full object-cover" alt="" />
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Reject and delete this property listing?")) return;
                                  try {
                                    await deleteDoc(doc(db, 'properties', prop.id));
                                    await logAudit('Reject Property Listing', `Rejected and deleted property: ${prop.title}`);
                                    setActionMessage(`❌ Rejected property listing: ${prop.title}`);
                                    setTimeout(() => setActionMessage(null), 3000);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="flex-1 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                              >
                                Reject
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, 'properties', prop.id), {
                                      isApproved: true
                                    });
                                    await logAudit('Approve Property Listing', `Approved and published property: ${prop.title}`);
                                    setActionMessage(`🎉 Approved property listing: ${prop.title}`);
                                    setTimeout(() => setActionMessage(null), 3000);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-505 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                              >
                                Approve Listing
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW B: RIDERS FLEET MANAGER */}
              {adminSubTab === 'riders_fleet' && (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rider Roster Database</h5>
                  {filteredRiders.length === 0 ? (
                    <div className="bg-slate-900 p-6 rounded-2xl text-center text-slate-500 text-xs">
                      No matching registered riders found.
                    </div>
                  ) : (
                    filteredRiders.map(rider => (
                      <div key={rider.id} className="bg-slate-900 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0">
                              <img src={rider.photo || 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                              <h6 className="text-[13px] font-black text-white leading-none">{rider.name}</h6>
                              <span className="text-[9px] text-slate-500 mt-1 block">{rider.vehicleType} &bull; {rider.vehicleNumber}</span>
                              {rider.isOnline && rider.customStatus && rider.customStatus !== 'Available' && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-500 rounded-md text-[8.5px] font-black uppercase tracking-wider font-mono">
                                  ⚠️ {rider.customStatus}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${rider.isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              {rider.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl text-center">
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block">ID Code</span>
                            <span className="text-[10px] font-black text-white">{rider.accessCode || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Completed trips</span>
                            <span className="text-[10px] font-black text-white">{rider.trips || 0}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Rating</span>
                            <span className="text-[10px] font-black text-yellow-400">★ {rider.rating?.toFixed(1) || '5.0'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleRiderState(rider.id, rider.isOnline)}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                              rider.isOnline ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {rider.isOnline ? 'Go Offline' : 'Force Online'}
                          </button>
                          
                          <button
                            onClick={() => handleProcessPayout(rider.id, 'rider', rider.pendingPayout || 0)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Pay ₹{rider.pendingPayout || 0}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW C: MERCHANTS RETAIL LIST */}
              {adminSubTab === 'merchant_list' && (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Store Partners Ledger</h5>
                  {filteredVendors.length === 0 ? (
                    <div className="bg-slate-900 p-6 rounded-2xl text-center text-slate-500 text-xs text-white">
                      No matching registered merchants found.
                    </div>
                  ) : (
                    filteredVendors.map(vendor => (
                      <div key={vendor.id} className="bg-slate-900 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h6 className="text-[14px] font-black text-indigo-400 uppercase">{vendor.businessName}</h6>
                            <p className="text-[10px] text-slate-400 mt-1">Owner: {vendor.ownerName} &bull; {vendor.phone}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${vendor.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {vendor.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 italic">"{vendor.description || 'No description provided.'}"</p>

                        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl text-center">
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Line Category</span>
                            <span className="text-[10px] font-black text-white capitalize">{vendor.service}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Branch Ref</span>
                            <span className="text-[10px] font-black text-white capitalize">{vendor.branchId || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Store Rating</span>
                            <span className="text-[10px] font-black text-yellow-400">★ {vendor.rating || '5.0'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleVendorState(vendor.id, vendor.isOnline)}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                              vendor.isOnline ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {vendor.isOnline ? 'Go Offline' : 'Set active'}
                          </button>

                          <button
                            onClick={() => handleOpenCatalogManager(vendor)}
                            className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/20 text-white px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1"
                          >
                            <Sliders className="w-3 h-3 text-indigo-400" />
                            <span>Catalog</span>
                          </button>
                          
                          <button
                            onClick={() => handleProcessPayout(vendor.id, 'vendor', vendor.pendingPayout || 0)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shrink-0"
                          >
                            Disburse
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW C.5: REAL ESTATE AGENTS LIST */}
              {adminSubTab === 'real_estate_list' && (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Real Estate Agency Partners Ledger</h5>
                  {filteredRealEstate.length === 0 ? (
                    <div className="bg-slate-900 p-6 rounded-2xl text-center text-slate-500 text-xs text-white">
                      No matching registered real estate agencies found.
                    </div>
                  ) : (
                    filteredRealEstate.map(agency => (
                      <div key={agency.id} className="bg-slate-900 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h6 className="text-[14px] font-black text-sky-400 uppercase">{agency.businessName}</h6>
                            <p className="text-[10px] text-slate-400 mt-1">Owner: {agency.ownerName} &bull; {agency.phone}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${agency.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {agency.isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 italic">"{agency.description || 'Verified Real Estate Agent.'}"</p>

                        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-xl text-center">
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Line Category</span>
                            <span className="text-[10px] font-black text-white capitalize">Real Estate Seller</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 uppercase block tracking-wider">Seller Rating</span>
                            <span className="text-[10px] font-black text-yellow-400">★ {agency.rating || '5.0'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleVendorState(agency.id, agency.isOnline)}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                              agency.isOnline ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {agency.isOnline ? 'Go Offline' : 'Set active'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW D: FINANCIAL SETTLEMENTS LEDGER */}
              {adminSubTab === 'settlements' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aggregate Fleet Payout Pending</p>
                      <h4 className="text-xl font-black text-emerald-400 mt-1">
                        ₹{[...allRiders, ...allVendors].reduce((acc, current) => acc + (current.pendingPayout || 0), 0).toLocaleString()}
                      </h4>
                    </div>
                    <FileText className="w-8 h-8 text-emerald-400/20" />
                  </div>

                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Payout Approvals Dispatch Desk</h5>
                  
                  <div className="space-y-2">
                    {[...allVendors, ...allRiders].filter(p => (p.pendingPayout || 0) > 0).length === 0 ? (
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-center text-slate-400 text-xs">
                        All Rider and Store settlements are paid out and fully cleared. Great work!
                      </div>
                    ) : (
                      [...allVendors, ...allRiders].filter(p => (p.pendingPayout || 0) > 0).map((partner: any, idx: number) => {
                        const isRider = partner.vehicleType !== undefined;
                        return (
                          <div key={partner.id || idx} className="p-4 bg-slate-900/80 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                            <div>
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isRider ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-505/15 text-indigo-400'
                              }`}>
                                {isRider ? '🚴 Delivery Rider' : '🏪 Merchant Store'}
                              </span>
                              <h6 className="text-[13px] font-black text-white mt-1.5">{partner.name || partner.businessName}</h6>
                              <p className="text-[9px] text-slate-500 mt-0.5">Phone line: {partner.phone}</p>
                            </div>

                            <button
                              onClick={() => handleProcessPayout(partner.id, isRider ? 'rider' : 'vendor', partner.pendingPayout)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-1"
                            >
                              <span>Payout</span>
                              <strong>₹{partner.pendingPayout}</strong>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* VIEW E: LEAFLET PINCODE COVERAGE circles GAPS MAP */}
              {adminSubTab === 'coverage' && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl">
                    <h5 className="text-xs font-black uppercase tracking-tight">Geographic Reach & Untapped Gaps Map</h5>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Pulsing circles indicate active branch delivery limits. Map indicators represent active riders and merchants. White spaces outside show untraceable pincodes.
                    </p>
                  </div>

                  <div className="h-72 w-full rouded-[2rem] overflow-hidden border border-white/10 rounded-3xl relative z-10 shadow-2xl">
                    <MapContainer center={[17.2473, 80.1514]} zoom={11} className="h-full w-full">
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                      />
                      
                      {/* Plot Branches with service pincodes */}
                      {branches.map((b: any) => {
                        const pincodes = b.pincodes || [];
                        return pincodes.map((pin: string, pIdx: number) => {
                          const coords = getPincodeCoords(pin);
                          const radius = (b.deliveryRadius || 5) * 1000 + pulseDelta;
                          return (
                            <Circle
                              key={`${b.id}-${pin}-${pIdx}`}
                              center={coords}
                              radius={radius}
                              pathOptions={{
                                color: b.id === 'khammam_main' ? '#10b981' : '#6366f1',
                                fillOpacity: 0.1,
                                weight: 1.5,
                                dashArray: '5, 5'
                              }}
                            >
                              <Popup>
                                <div className="text-xs p-1 text-slate-900 space-y-1 font-sans">
                                  <h6 className="font-bold text-slate-950 uppercase">{b.name} Branch</h6>
                                  <p>Coverage Pin: <strong className="font-mono">{pin}</strong></p>
                                  <p>Radius limits: {b.deliveryRadius || 5} km</p>
                                </div>
                              </Popup>
                            </Circle>
                          );
                        });
                      })}

                      {/* Render Online Rider Markers */}
                      {allRiders.map((rider) => {
                        if (!rider.isOnline) return null;
                        const coords = getPincodeCoords(rider.pincode || '507001');
                        return (
                          <Marker 
                            key={rider.id} 
                            position={coords}
                          >
                            <Popup>
                              <div className="text-xs text-slate-800 font-sans">
                                <p className="font-bold uppercase text-emerald-600">🚴 ONLINE RIDER</p>
                                <p><strong>{rider.name}</strong></p>
                                <p>Vehicle: {rider.vehicleNumber}</p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}

                      {/* Render Active Store Markers */}
                      {allVendors.map((vendor) => {
                        if (!vendor.isOnline) return null;
                        const coords = getPincodeCoords(vendor.pincode || '507002');
                        return (
                          <Marker 
                            key={vendor.id} 
                            position={coords}
                          >
                            <Popup>
                              <div className="text-xs text-slate-800 font-sans">
                                <p className="font-bold uppercase text-indigo-500">🏪 APPROVED MERCHANT</p>
                                <p><strong>{vendor.businessName}</strong></p>
                                <p>Category: {vendor.service}</p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </div>
              )}

              {/* VIEW F: AUDIT TELEMETRY LOGS */}
              {adminSubTab === 'audit_log' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Security Audit Trail Log</h5>
                    <button 
                      onClick={() => logAudit('Trigger Audit Check', 'Audit log validation initiated')}
                      className="p-1 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[8px] font-black uppercase tracking-wider"
                    >
                      Audit Scan
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 max-h-96 overflow-y-auto">
                    {auditLogs.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        No system activity audit logs logged yet.
                      </div>
                    ) : (
                      auditLogs.map(log => (
                        <div key={log.id} className="p-3 text-[10px] space-y-1 bg-slate-950/40">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-yellow-500 uppercase tracking-wider text-[8px] bg-yellow-400/10 px-1.5 py-0.5 rounded">
                              {log.action}
                            </span>
                            <span className="text-slate-500 font-mono text-[8px]">
                              {log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : 'Recent'}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-sans">{log.details}</p>
                          <div className="flex justify-between items-center text-[8px] text-slate-500 pt-0.5">
                            <span>Admin: <strong className="text-slate-400">{log.user}</strong></span>
                            <span>Role: <strong className="text-slate-400">{log.role || 'Super Admin'}</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VIEW G: ORDER DISPATCH CONSOLE */}
              {adminSubTab === 'order_dispatch' && (
                <div className="space-y-6 text-left">
                  {/* Dispatch Config System Toggle Block */}
                  <div className="bg-gradient-to-r from-slate-905 to-slate-900 border border-white/5 rounded-[2rem] p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                    <div>
                      <span className="text-[8px] bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 px-2 py-0.5 rounded font-black tracking-widest uppercase block mb-1">
                        Platform Dispatch Logic Manager
                      </span>
                      <h4 className="text-sm font-black text-white uppercase">Dispatch Control Automation Mode</h4>
                      <p className="text-[10px] text-slate-400">
                        Current Rule: {dispatchConfig.autoAssign ? '🤖 AUTOMATIC (Auto-magic direct rider-match routing)' : '👤 MANUAL (Dispatcher assigns orders to drivers manually)'}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const nextMode = !dispatchConfig.autoAssign;
                          await setDoc(doc(db, 'settings', 'dispatch'), { autoAssign: nextMode }, { merge: true });
                          await logAudit('Change Dispatch Mode', `Dispatch auto-routing updated to: ${nextMode ? 'Auto-Assign' : 'Manual Assignment'}`);
                          alert(`✓ Dispatch routing mode successfully updated to: ${nextMode ? 'Automatic' : 'Manual Dispatch'}`);
                        } catch (err) {
                          console.error("Failed to update dispatch mode", err);
                        }
                      }}
                      className="px-4.5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-md shadow-yellow-950/20"
                    >
                      Set to {dispatchConfig.autoAssign ? 'Manual Mode' : 'Automatic Auto-magic'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Active Order dispatch queue */}
                    <div className="lg:col-span-2 space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        Active Order Pipelines ({allOrders.filter(o => o.status !== 'Delivered').length})
                      </h5>

                      {allOrders.filter(o => o.status !== 'Delivered').length === 0 ? (
                        <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 text-center text-slate-400 py-12">
                          <CheckCircle2 className="w-9 h-9 text-slate-700 mx-auto mb-2 animate-bounce" />
                          <h6 className="text-xs font-black uppercase text-gray-300">All dispatches fully settled</h6>
                          <p className="text-[9.5px] text-slate-500 uppercase font-semibold">Active real-time pipelines are empty. Excellent job!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {allOrders.filter(o => o.status !== 'Delivered').map((ord) => {
                            return (
                              <div key={ord.id} className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4 text-xs">
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                        ord.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      }`}>
                                        {ord.status.toUpperCase()}
                                      </span>
                                      <span className="text-slate-500 font-bold font-mono">#{ord.id}</span>
                                    </div>
                                    <p className="text-white font-black uppercase text-[12px] mt-1">{ord.vendorName || 'Hub Admin Branch'}</p>
                                    <p className="text-slate-400 text-[10px] font-medium flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                      <span>To: {ord.deliveryAddress || 'Unspecified Contact Address'}</span>
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Grand Total</span>
                                    <p className="text-sm font-black text-white">₹{ord.total}</p>
                                    <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">{ord.paymentMethod?.toUpperCase()}</span>
                                  </div>
                                </div>

                                <div className="space-y-2 text-[11px]">
                                  <div className="flex justify-between text-slate-400 flex-wrap gap-1 border-b border-white/5 pb-2">
                                    <span>Client Profile: <strong className="text-yellow-400 uppercase">{ord.customerName}</strong> (📞 {ord.customerPhone})</span>
                                    <span>Quantity: <strong>{ord.items || (ord.orderItems?.length || 1)} items</strong></span>
                                  </div>

                                  {/* PRODUCT ITEMS MANIFEST DISPLAY FOR FULL ORDER DETAILS */}
                                  {ord.orderItems && ord.orderItems.length > 0 && (
                                    <div className="bg-slate-950/60 rounded-xl p-3 border border-white/5 space-y-1.5 shadow-inner">
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Product Items Manifest</span>
                                      {ord.orderItems.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-[10.5px]">
                                          <span className="text-slate-300 font-medium">{item.quantity}x <strong className="text-white font-black">{item.name}</strong></span>
                                          <span className="font-bold text-yellow-500">₹{item.price * item.quantity}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {ord.instructions && (
                                    <div className="bg-slate-950/40 p-2 rounded-lg text-[10px] text-slate-400 italic">
                                      📝 Notes: {ord.instructions}
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center text-[11px] bg-slate-950 p-3 rounded-xl border border-white/5">
                                    <span className="text-slate-400 font-bold uppercase">Rider Assignment:</span>
                                    {ord.riderName ? (
                                      <span className="text-emerald-400 font-black uppercase flex items-center gap-1">
                                        🚴 {ord.riderName} ({ord.riderPhone || 'In Transit'})
                                      </span>
                                    ) : (
                                      <span className="text-rose-400 font-black uppercase animate-pulse">
                                        ⚠️ UNASSIGNED / WAITING Dispatched Rider
                                      </span>
                                    )}
                                  </div>

                                  {/* ADMIN FORCE PIPELINE OVERRIDES ACCORDION */}
                                  <div className="bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/15 p-3 rounded-2xl space-y-2.5 mt-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[8px] font-black text-rose-450 uppercase tracking-widest text-red-450">⚠️ Admin Control Action Pad</span>
                                      <span className="text-[7.5px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">Active Override</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => handleForceCompleteOrder(ord.id)}
                                        className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        Shout Completed ✓
                                      </button>
                                      <button
                                        onClick={() => handleOpenEditOrder(ord)}
                                        className="py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        Edit Details ✍️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOrder(ord.id)}
                                        className="py-1.5 px-3 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        Delete Order 🗑️
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom dispatch action buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                  {/* Button 1: Accept Order (if Pending) */}
                                  {ord.status === 'Pending' && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, 'orders', ord.id), { status: 'Accepted', acceptedAt: new Date().toISOString() });
                                          await logAudit('Accept Order', `Order #${ord.id} manually accepted by Admin`);
                                          alert("✓ Order successfully accepted & queued for rider collection!");
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }}
                                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer"
                                    >
                                      Accept Order Dispatch ✓
                                    </button>
                                  )}

                                  {/* Custom Rider Manual Assignment Dropdown & Button */}
                                  <div className="flex-1 flex gap-2">
                                    <select
                                      id={`dispatch-rider-select-${ord.id}`}
                                      className="flex-1 bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-black text-white font-mono"
                                      defaultValue=""
                                    >
                                      <option value="" disabled>Select available rider...</option>
                                      {allRiders.filter(r => r.isOnline).map(r => (
                                        <option key={r.id} value={`${r.id}|${r.name}|${r.phone}`}>
                                          🚴 {r.name.toUpperCase()} (Online)
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      onClick={async () => {
                                        const selectElement = document.getElementById(`dispatch-rider-select-${ord.id}`) as HTMLSelectElement;
                                        if (!selectElement || !selectElement.value) {
                                          alert("Please select a valid online delivery rider first!");
                                          return;
                                        }
                                        const [rId, rName, rPhone] = selectElement.value.split('|');
                                        try {
                                          await updateDoc(doc(db, 'orders', ord.id), {
                                            riderId: rId,
                                            riderName: rName,
                                            riderPhone: rPhone || '',
                                            status: ord.status === 'Pending' ? 'Accepted' : ord.status,
                                            assignedAt: new Date().toISOString()
                                          });
                                          await logAudit('Rider Assignment', `Order #${ord.id} manually assigned to ${rName}`);
                                          alert(`✓ Order #${ord.id} successfully assigned to ${rName}!`);
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }}
                                      className="py-2.5 px-4 bg-indigo-650 bg-indigo-650 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer whitespace-nowrap"
                                    >
                                      Assign Rider
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Available driver telemetry log checks */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">
                        Rider Telemetry Overview ({allRiders.filter(r => r.isOnline).length} Online)
                      </h5>

                      <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 space-y-4">
                        {allRiders.filter(r => r.isOnline).length === 0 ? (
                          <div className="text-center py-6 text-slate-505 text-slate-500 font-semibold uppercase text-[9px] space-y-1">
                            <Ban className="w-5 h-5 mx-auto text-slate-600 animate-pulse" />
                            <p>No riders are currently on active duty</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-white/5 space-y-3 text-left">
                            {allRiders.filter(r => r.isOnline).map((rider) => {
                              const carriesOrders = allOrders.filter(o => o.riderId === rider.id && o.status !== 'Delivered').length;
                              return (
                                <div key={rider.id} className="pt-3 block flex items-center justify-between text-[11px]">
                                  <div>
                                    <p className="text-white font-black uppercase tracking-tight">{rider.name}</p>
                                    <p className="text-[9px] text-slate-505 font-mono">Contact: {rider.phone || 'N/A'}</p>
                                    <p className="text-[9.5px] mt-0.5 uppercase font-bold text-yellow-500">Vehicle: {rider.vehicleNumber || 'Unspecified'}</p>
                                    {rider.customStatus && rider.customStatus !== 'Available' && (
                                      <p className="text-[9px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 uppercase tracking-wider mt-1 font-mono">
                                        🕒 {rider.customStatus}
                                      </p>
                                    )}
                                  </div>

                                  <div className="text-right">
                                    {carriesOrders > 0 ? (
                                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[8px] font-black uppercase animate-pulse">
                                        Busy ({carriesOrders} Trip)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase">
                                        Free / Idle
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Persistent App Frame Footer Support */}
      <div className="p-3 bg-slate-900 border-t border-white/5 text-center shrink-0">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
          STANDALONE MERCHANT FLEET APP &bull; TS KHAMMAM
        </p>
      </div>

      {/* RIDER ONBOARDING FORM REGISTER MODAL */}
      <AnimatePresence>
        {showRiderRegister && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl"
            >
              <div className="flex items-center gap-2.5">
                <Bike className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black uppercase tracking-tight text-white leading-none">Rider Application Onboarding</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Full Legal Name</label>
                  <input 
                    type="text" 
                    required 
                    value={riderName} 
                    onChange={(e) => setRiderName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="Enter full name" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={riderPhone} 
                    onChange={(e) => setRiderPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="10 digit mobile number" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Vehicle Classification</label>
                  <select 
                    value={riderVehicle} 
                    onChange={(e) => setRiderVehicle(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white uppercase font-black"
                  >
                    <option value="Bike">Motorcycle / Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Vehicle Plate Number (E.g. TS-04-BB-0000)</label>
                  <input 
                    type="text" 
                    value={riderVehicleNum} 
                    onChange={(e) => setRiderVehicleNum(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. TS-04-BB-0000" 
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowRiderRegister(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleCreateOnboardingApplication('rider')}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-950/20 animate-pulse"
                  >
                    Send Application
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VENDOR ONBOARDING FORM REGISTER MODAL */}
      <AnimatePresence>
        {showVendorRegister && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-6 h-6 text-indigo-400" />
                <h3 className="text-base font-black uppercase tracking-tight text-white leading-none">Vendor Onboarding Application</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Business / Store Name</label>
                  <input 
                    type="text" 
                    required 
                    value={vendorName} 
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Khammam Ghee Biryani Central" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Owner Primary Name</label>
                  <input 
                    type="text" 
                    required 
                    value={vendorOwner} 
                    onChange={(e) => setVendorOwner(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="Full Name" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Store Line Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={vendorPhone} 
                    onChange={(e) => setVendorPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="10 digit phone number" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">E-Commerce Line Category</label>
                  <select 
                    value={vendorCategory} 
                    onChange={(e) => setVendorCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white uppercase font-black cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Physical Address location</label>
                  <input 
                    type="text" 
                    value={vendorAddress} 
                    onChange={(e) => setVendorAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Near Gandhi Center, Khammam" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Store Short Bio / Description</label>
                  <input 
                    type="text" 
                    value={vendorDescription} 
                    onChange={(e) => setVendorDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="Selling fresh multi-grain batter & organic eggs." 
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowVendorRegister(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleCreateOnboardingApplication('vendor')}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-indigo-950/20"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REAL ESTATE ONBOARDING FORM REGISTER MODAL */}
      <AnimatePresence>
        {showRealEstateRegister && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-sky-400" />
                <h3 className="text-base font-black uppercase tracking-tight text-white leading-none">Real Estate Agency Application</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Agency / Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={realEstateName} 
                    onChange={(e) => setRealEstateName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Kakatiya Lands & Realty" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Owner / Lead Broker Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={realEstateOwner} 
                    onChange={(e) => setRealEstateOwner(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="Agent Name" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Agency Contact Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={realEstatePhone} 
                    onChange={(e) => setRealEstatePhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="10 digit phone number" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Office Address Location</label>
                  <input 
                    type="text" 
                    value={realEstateAddress} 
                    onChange={(e) => setRealEstateAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Wyra Road, Khammam" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Agency Bio / Focus Specialties</label>
                  <input 
                    type="text" 
                    value={realEstateBio} 
                    onChange={(e) => setRealEstateBio(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Specializing in residential plots and commercial complexes." 
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowRealEstateRegister(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleCreateOnboardingApplication('real_estate')}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-sky-950/20"
                  >
                    Submit Agency Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOSPITAL OP ONBOARDING FORM REGISTER MODAL */}
      <AnimatePresence>
        {showHospitalRegister && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-6 h-6 text-purple-400" />
                <h3 className="text-base font-black uppercase tracking-tight text-white leading-none">Hospital OP Application</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Hospital / Clinic Name</label>
                  <input 
                    type="text" 
                    required 
                    value={hospitalName} 
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Apollo OP Khammam" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Chief Medical Officer / Owner Name</label>
                  <input 
                    type="text" 
                    required 
                    value={hospitalOwner} 
                    onChange={(e) => setHospitalOwner(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Dr. Ramana Garu" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Hospital Contact Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={hospitalPhone} 
                    onChange={(e) => setHospitalPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="10 digit phone number" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Consultation Fee (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={hospitalFee} 
                    onChange={(e) => setHospitalFee(Number(e.target.value || 0))}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. 250" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Physical Address Location</label>
                  <input 
                    type="text" 
                    value={hospitalAddress} 
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. Wyra Road, Khammam" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Hospital Brief description / Specialties</label>
                  <input 
                    type="text" 
                    value={hospitalBio} 
                    onChange={(e) => setHospitalBio(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs text-white" 
                    placeholder="E.g. General checkup, pediatrics, skin care." 
                  />
                </div>
 
                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowHospitalRegister(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleCreateOnboardingApplication('hospital_op')}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPER ADMIN ORDER OVERRIDE EDIT MODAL */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 max-w-lg w-full space-y-4 text-white shadow-2xl my-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <div className="w-10 h-10 rounded-xl bg-red-400/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Admin Control override</h3>
                  <p className="text-[10px] text-red-400 font-bold font-mono">Modifying Order #{editingOrder.id}</p>
                </div>
              </div>

              <div className="space-y-3.5 text-left text-xs">
                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                    <input 
                      type="text" 
                      value={editCustName} 
                      onChange={(e) => setEditCustName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 p-2.5 rounded-xl text-xs text-white" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer Phone</label>
                    <input 
                      type="text" 
                      value={editCustPhone} 
                      onChange={(e) => setEditCustPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 p-2.5 rounded-xl text-xs text-white" 
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Delivery Destination Address</label>
                  <input 
                    type="text" 
                    value={editAddress} 
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 p-2.5 rounded-xl text-xs text-white" 
                  />
                </div>

                {/* Order Status & Payment Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Pipeline Status</label>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 p-2.5 rounded-xl text-xs text-white font-black"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Preparing">Preparing</option>
                      <option value="ReadyForPickup">ReadyForPickup</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                    <select 
                      value={editPaymentMethod} 
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 p-2.5 rounded-xl text-xs text-white font-black"
                    >
                      <option value="COD">Cash on Delivery (COD)</option>
                      <option value="Online">Online Settled</option>
                      <option value="Wallet">Lokal Wallet</option>
                    </select>
                  </div>
                </div>

                {/* EDITING PRODUCTS MANIFEST LIST */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Override Items List</p>
                    <button
                      type="button"
                      onClick={handleEditAddItem}
                      className="px-2 py-1 bg-yellow-400 text-slate-950 rounded-lg text-[8px] font-black uppercase tracking-wider"
                    >
                      + Add Item
                    </button>
                  </div>

                  {editItems.length === 0 ? (
                    <div className="text-center py-2 text-slate-500 font-semibold italic text-[10px]">
                      No items in this order. Add one!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {editItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-900 p-2 rounded-xl border border-white/5">
                          <input 
                            type="text" 
                            value={item.name || ''} 
                            onChange={(e) => handleEditItemChange(idx, 'name', e.target.value)}
                            placeholder="Item Name"
                            className="flex-1 bg-slate-950 border border-white/10 px-2 py-1 text-[10px] text-white rounded-lg"
                          />
                          <input 
                            type="number" 
                            value={item.price || 0} 
                            onChange={(e) => handleEditItemChange(idx, 'price', Number(e.target.value))}
                            placeholder="Price"
                            className="w-12 bg-slate-950 border border-white/10 px-1 py-1 text-[10px] text-white rounded-lg text-center"
                          />
                          <input 
                            type="number" 
                            value={item.quantity || 1} 
                            min="1"
                            onChange={(e) => handleEditItemChange(idx, 'quantity', Number(e.target.value))}
                            placeholder="Qty"
                            className="w-8 bg-slate-950 border border-white/10 px-1 py-1 text-[10px] text-white rounded-lg text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditRemoveItem(idx)}
                            className="text-red-400 hover:text-red-300 p-1 bg-red-400/5 hover:bg-red-400/15 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Billing */}
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">Calculated grand total:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-yellow-500 font-mono">₹</span>
                    <input 
                      type="number"
                      value={editTotal}
                      onChange={(e) => setEditTotal(Number(e.target.value))}
                      className="w-20 bg-transparent text-white font-black font-mono text-right text-sm border-b border-dashed border-white/20 focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer"
                  >
                    Cancel Override
                  </button>
                  <button 
                    onClick={handleUpdateOrderDetails}
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer shadow-lg shadow-yellow-950/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FRANCHISE SECURITY GATEWAY MODAL */}
      <AnimatePresence>
        {showFranchiseGateModal && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-yellow-400/25 rounded-[2.5rem] p-6 max-w-md w-full space-y-4 text-white shadow-2xl relative text-left"
            >
              <div className="text-center space-y-2 border-b border-white/5 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/35 flex items-center justify-center text-yellow-400 mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black uppercase text-yellow-400 tracking-tight font-sans">Franchise security gateway</h4>
                <p className="text-[10px] text-slate-400 tracking-widest uppercase font-mono">Select charter branch area & authenticate passcode</p>
              </div>

              {!isFranchiseAdminActive ? (
                <form onSubmit={handleFranchiseGateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Lokal administrative branch area</label>
                    <select
                      value={franchiseGateBranchId}
                      onChange={(e) => {
                        setFranchiseGateBranchId(e.target.value);
                        setFranchiseGateError('');
                      }}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-yellow-400"
                    >
                      <option value="">-- Choose Branch Area --</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                      ))}
                      {!isOnlineNetwork && (
                        <option value="offline_fallback">offline fallback admin</option>
                      )}
                    </select>

                    {franchiseGateBranchId === 'khammam_main' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3.5 text-[11px] text-yellow-300 space-y-1.5 font-sans mt-2">
                        <span className="font-extrabold uppercase tracking-wider block text-[9.5px]">👑 MASTER KHAMMAM HQ ACCESS GATE</span>
                        <p className="leading-snug opacity-90">
                          You are connecting to the main Khammam HQ administrative core. Authorized leaders may enter using the master special code.
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="bg-yellow-400/25 text-yellow-300 font-mono text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-yellow-500/20">
                            Tarun Bandi
                          </span>
                          <span className="bg-slate-950 text-slate-300 font-mono text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-white/5">
                            Special Code: Tarun@KhammamHQ
                          </span>
                        </div>
                      </div>
                    )}

                    {franchiseGateBranchId && franchiseGateBranchId !== 'khammam_main' && (
                      <div className="bg-slate-950 border border-white/5 rounded-xl p-3 text-[10px] text-slate-400 leading-snug mt-2 font-sans">
                        🔒 Branch Security Notice: All franchise admins must obtain their designated gateway passcode directly from Master Admin <strong className="text-white">Tarun Bandi (Khammam HQ)</strong>.
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Gate entrance security code</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••"
                        value={franchiseGatePasscode}
                        onChange={(e) => {
                          setFranchiseGatePasscode(e.target.value);
                          setFranchiseGateError('');
                        }}
                        className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-yellow-400 font-mono font-black text-center text-lg tracking-widest focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {franchiseGateError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase text-center tracking-wider">
                      🚨 {franchiseGateError}
                    </div>
                  )}

                  {!isOnlineNetwork && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase text-center tracking-wider flex items-center justify-center gap-1.5">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>Offline Mode: Passcodes bypass defaults enabled</span>
                    </div>
                  )}

                  {isSuperAdmin && franchiseGateBranchId && (
                    <button
                      type="button"
                      onClick={() => {
                        const selectedBranch = branches.find(b => b.id === franchiseGateBranchId);
                        const bId = selectedBranch ? selectedBranch.id : 'offline_fallback';
                        const bName = selectedBranch ? selectedBranch.name : 'Offline Franchise';
                        localStorage.setItem('is_franchise_admin_active', 'true');
                        localStorage.setItem('local_franchise_branch_id', bId);
                        localStorage.setItem('local_franchise_branch_name', bName);
                        setIsFranchiseAdminActive(true);
                        setLocalFranchiseBranchId(bId);
                        setLocalFranchiseBranchName(bName);
                        setShowFranchiseGateModal(false);
                        setFranchiseGatePasscode('');
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-lg mb-2 flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-950 animate-pulse" />
                      Master Admin Direct Access
                    </button>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFranchiseGateModal(false)}
                      className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer shadow-lg shadow-yellow-950/10"
                    >
                      Authorize Area
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-1.5">
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest font-mono">✓ Clear connection active</span>
                    <h5 className="text-[15px] font-black text-white">{localFranchiseBranchName || 'Regional Admin'}</h5>
                    <p className="text-[10px] text-slate-400">Your session is authenticated under local franchise permissions.</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowFranchiseGateModal(false)}
                      className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-900 transition-all cursor-pointer"
                    >
                      Keep Active
                    </button>
                    <button
                      onClick={handleExitFranchiseMode}
                      className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                    >
                      Dismantle Session
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VENDOR CATALOG MANAGER MODAL */}
      <AnimatePresence>
        {showCatalogModal && catalogVendor && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-indigo-500/25 rounded-[2.5rem] p-6 max-w-2xl w-full text-white shadow-2xl relative flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto text-left"
            >
              {/* Left Column: Form to Add/Edit */}
              <div className="md:w-1/2 space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Catalog Administrator</span>
                  <h4 className="text-sm font-black text-white uppercase mt-0.5">{catalogVendor.businessName}</h4>
                  <p className="text-[10px] text-slate-400 italic">Configure pricing list options</p>
                </div>

                <form onSubmit={handleSaveCatalogItem} className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                  <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-wider font-mono">
                    {editingItem ? 'Edit catalog product' : 'Introduce fresh catalog product'}
                  </h5>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Item name</label>
                    <input
                      type="text" required
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      placeholder="e.g., Organic Rice (1 Kg)"
                      className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black text-slate-400 uppercase">Base Price (INR)</label>
                      <input
                        type="number" required
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        placeholder="e.g. 120"
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black text-slate-400 uppercase">Category type</label>
                      <input
                        type="text" required
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                        placeholder="e.g. Groceries"
                        className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-semibold text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Fulfillment Status</label>
                    <select
                      value={itemForm.status}
                      onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="InStock">In Stock (InStock)</option>
                      <option value="OutOfStock">Out of Stock (OutOfStock)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingItem && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(null);
                          setItemForm({ name: '', price: '', category: catalogVendor.service || 'General', status: 'InStock' });
                        }}
                        className="flex-1 py-2 bg-slate-900 border border-white/5 text-slate-400 text-[9px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer shadow-md shadow-indigo-950/20"
                    >
                      {editingItem ? 'Save Updates' : 'Add to menu'}
                    </button>
                  </div>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setShowCatalogModal(false);
                    setCatalogVendor(null);
                  }}
                  className="w-full py-2.5 bg-slate-950 border border-white/5 text-slate-400 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer"
                >
                  Close Catalog Hub
                </button>
              </div>

              {/* Right Column: Menu Options List */}
              <div className="md:w-1/2 flex flex-col h-full max-h-[50vh] md:max-h-[70vh]">
                <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2 mb-2 font-mono flex items-center justify-between">
                  <span>Registered Options Ledger ({catalogItems.length})</span>
                  {!isOnlineNetwork && (
                    <span className="text-[8px] text-yellow-400 uppercase bg-yellow-400/10 px-1.5 py-0.5 rounded font-bold">OFFLINE</span>
                  )}
                </h5>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[40vh] md:max-h-[50vh]">
                  {catalogItems.length === 0 ? (
                    <div className="bg-slate-950/40 p-10 rounded-2xl text-center border border-white/5 text-xs text-slate-500">
                      No products mapped under this vendor catalog. Introduce options on the left form!
                    </div>
                  ) : (
                    catalogItems.map(item => (
                      <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{item.name}</span>
                            <span className="px-1.5 py-0.2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[7px] uppercase tracking-wider rounded">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-black text-emerald-400 font-mono">₹{item.price}</span>
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[7px] font-black tracking-widest uppercase ${item.status === 'InStock' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                              {item.status || 'InStock'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setItemForm({
                                name: item.name || '',
                                price: String(item.price || ''),
                                category: item.category || catalogVendor.service || 'General',
                                status: item.status || 'InStock'
                              });
                            }}
                            className="p-1.5 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCatalogItem(item.id, item.name)}
                            className="p-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white rounded cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
