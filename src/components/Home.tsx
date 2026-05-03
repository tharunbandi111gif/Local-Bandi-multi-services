import React, { useState, useEffect } from 'react';
import { compressImage } from '../lib/imageUtils';
import { 
  MapPin, 
  ChevronDown, 
  Bell, 
  Search, 
  Home as HomeIcon, 
  Heart, 
  ShoppingCart, 
  ClipboardList, 
  User,
  Star,
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Milk, 
  Droplet, 
  Apple, 
  Beef, 
  Utensils, 
  ShoppingBag, 
  PhoneCall, 
  Briefcase, 
  Wrench, 
  Car, 
  Scissors,
  Sparkles,
  Wallet,
  Mic,
  MicOff,
  X,
  Flower,
  Check,
  LogOut,
  Edit2,
  Edit3,
  Trash2,
  Plus,
  Shirt,
  UserCheck,
  HardHat,
  MessageSquare,
  Bike,
  Users,
  Camera,
  AlertCircle,
  Power,
  Smartphone,
  Cake,
  IceCream,
  Church,
  UtensilsCrossed,
  HeartHandshake,
  Settings,
  RefreshCcw,
  Clock,
  Package,
  Lock,
  Navigation,
  Compass,
  Landmark,
  Truck,
  LayoutDashboard,
  BarChart3,
  PackageSearch,
  ArrowUpRight,
  Download,
  Calendar,
  Megaphone,
  Send,
  BellOff,
  HelpCircle,
  Target
} from 'lucide-react';
import LiveMap from './LiveMap';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, Screen, Service, LanguageCode, VendorProfile, DeliveryPartnerProfile, SupportChat, SupportMessage, MarriageProfile } from '../types';
import { CATEGORIES, PRODUCTS, SERVICES } from '../constants';
import { translations } from '../translations';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User as AuthUser } from 'firebase/auth';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

interface HomeProps {
  location: string;
  language: LanguageCode;
  onCategoryClick: (cat: Category) => void;
  onProductClick: (prod: Product | Service) => void;
  cartCount: number;
  wishlistCount: number;
  onNavigate: (screen: Screen) => void;
  user: AuthUser | null;
  isAdmin?: boolean;
  onAdminAuth?: (isAdmin: boolean) => void;
  localInventory: (Product | Service)[];
  setLocalInventory: React.Dispatch<React.SetStateAction<(Product | Service)[]>>;
}

const IconMap: Record<string, any> = {
  Milk,
  Droplet,
  Apple,
  Beef,
  Utensils,
  ShoppingBag,
  PhoneCall,
  Sparkles,
  Wrench,
  Car,
  Heart,
  Scissors,
  Flower,
  Shirt,
  UserCheck,
  HardHat,
  Briefcase,
  Cake,
  IceCream,
  Church,
  UtensilsCrossed,
  HeartHandshake,
  Landmark
};

const DocUploadButton = ({ label, isUploaded, onClick }: { label: string, isUploaded: boolean, onClick: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onClick();
    }, 1500);
  };

  return (
    <button 
      type="button"
      onClick={handleUpload}
      disabled={isUploaded || isUploading}
      className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all w-full text-left ${
        isUploaded ? 'bg-emerald-50 border-emerald-500' : isUploading ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200 hover:border-orange-400'
      }`}
    >
      <span className={`text-xs font-black flex-1 ${isUploaded ? 'text-emerald-700' : isUploading ? 'text-yellow-700' : 'text-gray-600'}`}>
        {isUploaded ? `${label} Uploaded ✅` : isUploading ? `Uploading ${label}...` : `Upload ${label}`}
      </span>
      {isUploading ? (
        <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Camera className={`w-5 h-5 ${isUploaded ? 'text-emerald-500' : 'text-gray-400'}`} />
      )}
    </button>
  );
};

export default function Home({ 
  location, 
  language, 
  onCategoryClick, 
  onProductClick, 
  cartCount, 
  wishlistCount, 
  onNavigate, 
  user,
  isAdmin = false, 
  onAdminAuth,
  localInventory,
  setLocalInventory 
}: HomeProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading for a more app-like feel
    const loadTimer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const loadFromStorage = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      return JSON.parse(saved);
    } catch (e) {
      console.warn(`Failed to parse ${key} from storage`, e);
      return defaultValue;
    }
  };

  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadFromStorage('recentSearches', []));
  const [showRateCard, setShowRateCard] = useState(true);

  useEffect(() => {
    const openForm = localStorage.getItem('openPartnerForm');
    if (openForm) {
      setPartnerType(openForm as 'vendor' | 'delivery');
      setAgreedToTerms(false);
      setShowPartnerForm(true);
      localStorage.removeItem('openPartnerForm');
    }

    const openAdmin = localStorage.getItem('openAdminOnHome');
    if (openAdmin) {
      onAdminAuth?.(true);
      localStorage.removeItem('openAdminOnHome');
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== term);
      const updated = [term, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveRecentSearch(searchQuery);
    setIsFocused(false);
  };
  
  // Search Filters
  const [filterPrice, setFilterPrice] = useState<'low' | 'high' | 'all'>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterAvailability, setFilterAvailability] = useState<boolean>(false);

  const trendingSearches = ['Fresh Milk', 'Bread', 'AC Service', 'Medicine', 'Pet Food'];

  const handleVoiceSearch = () => {
    setShowVoiceModal(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTimeout(() => setShowVoiceModal(false), 2000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setShowVoiceModal(false), 1000);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setShowVoiceModal(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      saveRecentSearch(transcript);
    };

    recognition.start();
  };

  const topBanners = [
    { 
      id: 101, 
      title: 'Pure Buffalo Milk', 
      sub: 'Direct Farm-to-Home Delivery', 
      color: 'bg-blue-600', 
      img: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?w=800&q=80',
      productId: 'd1'
    },
    { 
      id: 102, 
      title: 'Mineral Water 20L', 
      sub: 'Pure & Certified Quality', 
      color: 'bg-cyan-600', 
      img: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
      productId: 'w1'
    },
    { 
      id: 103, 
      title: 'Handicrafts & Fancy', 
      sub: 'Unique local treasures', 
      color: 'bg-indigo-600', 
      img: 'https://images.unsplash.com/photo-1515871204537-49a5fe66a31f?w=800&q=80',
      categoryId: 'handicrafts'
    },
    { 
      id: 104, 
      title: 'Bharat Marriage Bureau', 
      sub: 'Get Partner | Join Free Limited Time', 
      cta: 'Get Partner',
      color: 'bg-rose-600', 
      img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
      action: () => onNavigate('marriageBureau')
    },
  ];

  const bottomBanners = [
    { 
      id: 201, 
      title: 'Expert Maid Services', 
      sub: 'Experienced Cooks & Sweepers', 
      color: 'bg-emerald-600', 
      img: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=800&q=80',
      categoryId: 'maids'
    },
    { 
      id: 202, 
      title: 'Maintenance Pro', 
      sub: 'Electricians, Plumbers, Painters', 
      color: 'bg-orange-600', 
      img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
      categoryId: 'construction'
    },
    { 
      id: 203, 
      title: 'Heavy Services', 
      sub: 'AC Repairs & Bore Mechanics', 
      color: 'bg-gray-800',
      categoryId: 'mechanics'
    },
  ];

  useEffect(() => {
    const shouldOpenAdmin = localStorage.getItem('openAdminOnHome');
    if (shouldOpenAdmin === 'true' && isAdmin) {
      setIsAdminOpen(true);
      localStorage.removeItem('openAdminOnHome');
    }
  }, [isAdmin]);

  const [activeTopBanner, setActiveTopBanner] = useState(0);
  const [activeBottomBanner, setActiveBottomBanner] = useState(0);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showPanelSelection, setShowPanelSelection] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminAuthStep, setAdminAuthStep] = useState<'password' | 'otp' | 'recovery'>('password');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('admin_session_active') === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerType, setPartnerType] = useState<'vendor' | 'delivery'>('vendor');
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  const handlePartnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setPartnerError("Image size must be less than 10MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setPartnerPhoto(compressed);
        } catch (err) {
          console.error("Compression error:", err);
          setPartnerPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Form State
  const [partnerData, setPartnerData] = useState({
    name: '',
    ownerName: '',
    service: '',
    phone: '',
    gstNumber: '',
    businessAddress: '',
    aadhaar: '',
    rc: '',
    dl: '',
    otp: '',
    vehicleNumber: '',
    chassisNumber: '',
    location: {
      area: '',
      city: '',
      pincode: ''
    },
    docs: {
      aadhaar: false,
      rc: false,
      dl: false,
      businessProof: false
    }
  });
  const [showOtpField, setShowOtpField] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [logisticsView, setLogisticsView] = useState<'orders' | 'stats' | 'communications'>('orders');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('lokal_maintenance_mode') === 'true');
  const [supportInfo, setSupportInfo] = useState(() => {
    const saved = localStorage.getItem('supportInfo');
    return saved ? JSON.parse(saved) : { phone: '9876543210', email: 'localbharathkhammam@gmail.com' };
  });

  useEffect(() => {
    localStorage.setItem('lokal_maintenance_mode', isMaintenanceMode.toString());
    window.dispatchEvent(new CustomEvent('maintenance_mode_changed', { detail: isMaintenanceMode }));

    if (isMaintenanceMode) {
      const maintenanceNotif = {
        id: `maint-${Date.now()}`,
        title: '⚠️ Scheduled Maintenance',
        message: 'Lokal Bharath will be undergoing maintenance shortly. Some features may be temporarily unavailable.',
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => [maintenanceNotif, ...prev]);
    } else {
      const maintenanceNotif = {
        id: `maint-end-${Date.now()}`,
        title: '✅ Platform Online',
        message: 'Maintenance complete. All services are back online. Thank you for your patience!',
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => [maintenanceNotif, ...prev]);
    }
  }, [isMaintenanceMode]);

  const [notifications, setNotifications] = useState<{id: string, title: string, message: string, timestamp: number, read: boolean}[]>(() => {
    const saved = localStorage.getItem('lokal_notifications');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Welcome to Lokal Bharath!', message: 'Explore pure, healthy products from your neighborhood.', timestamp: Date.now() - 86400000, read: true }
    ];
  });
  const [broadcastMessage, setBroadcastMessage] = useState({ title: '', message: '' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    localStorage.setItem('lokal_support_info', JSON.stringify(supportInfo));
  }, [supportInfo]);

  useEffect(() => {
    localStorage.setItem('lokal_notifications', JSON.stringify(notifications));
    window.dispatchEvent(new Event('notifications_updated'));
  }, [notifications]);

  const sendBroadcast = () => {
    if (!broadcastMessage.title || !broadcastMessage.message) return;
    setIsBroadcasting(true);
    setTimeout(() => {
      const newNotif = {
        id: Date.now().toString(),
        title: broadcastMessage.title,
        message: broadcastMessage.message,
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      setBroadcastMessage({ title: '', message: '' });
      setIsBroadcasting(false);
      alert('Broadcast sent successfully!');
    }, 1000);
  };
  const [logisticsReportRange, setLogisticsReportRange] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [logisticsCustomDate, setLogisticsCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [logisticsFilterStatus, setLogisticsFilterStatus] = useState<'All' | 'Pending' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned'>('All');
  const [dispatcherDate, setDispatcherDate] = useState<string>('All');
  const [customDispatcherDate, setCustomDispatcherDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Stateful Admin Data
  const [allMarriageProfiles, setAllMarriageProfiles] = useState<MarriageProfile[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerProfile[]>([]);

  useEffect(() => {
    if (!user) {
      setAllMarriageProfiles([]);
      setActiveOrders([]);
      setPendingApprovals([]);
      setVendors([]);
      setDeliveryPartners([]);
      return;
    }

    // Real-time listeners
    
    // Marriage profiles - public list (approved only for non-admin)
    const marriageQuery = isAdmin 
      ? collection(db, 'marriageProfiles')
      : query(collection(db, 'marriageProfiles'), where('isApproved', '==', true));

    const unsubMarriage = onSnapshot(marriageQuery, (snapshot) => {
      setAllMarriageProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarriageProfile)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'marriageProfiles'));

    // Admin-only listeners
    let unsubOrders: () => void = () => {};
    let unsubApprovals: () => void = () => {};
    let unsubVendors: () => void = () => {};
    let unsubDelivery: () => void = () => {};

    if (isAdmin) {
      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        setActiveOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, err => handleFirestoreError(err, OperationType.LIST, 'orders'));

      unsubApprovals = onSnapshot(collection(db, 'pendingApprovals'), (snapshot) => {
        setPendingApprovals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, err => handleFirestoreError(err, OperationType.LIST, 'pendingApprovals'));

      unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
        setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorProfile)));
      }, err => handleFirestoreError(err, OperationType.LIST, 'vendors'));

      unsubDelivery = onSnapshot(collection(db, 'deliveryPartners'), (snapshot) => {
        setDeliveryPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryPartnerProfile)));
      }, err => handleFirestoreError(err, OperationType.LIST, 'deliveryPartners'));
    }

    return () => {
      unsubMarriage();
      unsubOrders();
      unsubApprovals();
      unsubVendors();
      unsubDelivery();
    };
  }, [user, isAdmin]);

  const getOrdersInTimeRange = (range: 'day' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    const startOfRange = new Date();
    const endOfRange = new Date();
    
    if (range === 'day') {
      startOfRange.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startOfRange.setDate(now.getDate() - 7);
      startOfRange.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      startOfRange.setMonth(now.getMonth() - 1);
      startOfRange.setHours(0, 0, 0, 0);
    } else if (range === 'custom') {
      const selected = new Date(logisticsCustomDate);
      startOfRange.setTime(selected.getTime());
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setTime(selected.getTime());
      endOfRange.setHours(23, 59, 59, 999);
      
      return activeOrders.filter(order => {
        const orderTime = new Date(order.timestamp).getTime();
        return orderTime >= startOfRange.getTime() && orderTime <= endOfRange.getTime();
      });
    }
    
    return activeOrders.filter(order => new Date(order.timestamp) >= startOfRange);
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryPartnerId: riderId,
        status: riderId ? 'Assigned' : 'Pending',
        updatedAt: serverTimestamp()
      });
      setAdminSaveStatus("Rider assigned successfully.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const simulateOrder = async () => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000).toString()}`;
    const newOrder: any = {
      id: orderId,
      customerName: ['Rahul Sharma', 'Priya Patel', 'Arjun Reddy', 'Anjali Gupta', 'Vikram Singh', 'Neha Das'][Math.floor(Math.random() * 6)],
      items: Math.floor(1 + Math.random() * 4),
      total: Math.floor(150 + Math.random() * 1200),
      status: 'Pending',
      vendorId: vendors[0]?.id || 'v1',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
      deliveryPartnerId: null
    };

    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
      setAdminSaveStatus(`Test order ${orderId} generated!`);
      
      if (deliveryAssignmentMode === 'automatic') {
        setTimeout(() => {
          autoAssignRider(orderId);
        }, 1500);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    }
  };

  const autoAssignRider = (orderId: string) => {
    const onlineRiders = deliveryPartners.filter(dp => dp.isOnline && dp.status !== 'Banned');
    if (onlineRiders.length > 0) {
      // Pick the one with fewest current orders (simulated)
      const rider = onlineRiders[0];
      handleAssignRider(orderId, rider.id);
      return true;
    }
    return false;
  };

  const [users, setUsers] = useState<any[]>(() => {
    const saved = loadFromStorage('lokal_users', null);
    if (saved) return saved;
    return [
      { id: 'u1', name: 'Tharun Bandi', phone: '9876543210', email: 'tharunbandi@example.com', joinDate: '2024-01-15', totalOrders: 12, status: 'Active' },
      { id: 'u2', name: 'Sai Kiran', phone: '9000000001', email: 'sai@example.com', joinDate: '2024-02-10', totalOrders: 5, status: 'Active' }
    ];
  });


  const pendingMarriageProfilesCount = allMarriageProfiles.filter(p => !p.isApproved).length;

  const handleApproveProfile = async (id: string) => {
    try {
      await updateDoc(doc(db, 'marriageProfiles', id), {
        isApproved: true,
        updatedAt: serverTimestamp()
      });
      setAdminSaveStatus("Profile Approved Successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `marriageProfiles/${id}`);
    }
  };

  const handleRejectProfile = async (id: string, reason?: string) => {
    if (confirm(reason ? `Reject profile for ${reason}?` : "Reject and Delete this profile permanently?")) {
      try {
        await deleteDoc(doc(db, 'marriageProfiles', id));
        setAdminSaveStatus("Profile Rejected & Removed.");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `marriageProfiles/${id}`);
      }
    }
  };

  const handleSuspendProfile = async (id: string, name: string) => {
    if (confirm(`Suspend profile for ${name}?`)) {
      try {
        await updateDoc(doc(db, 'marriageProfiles', id), {
          isApproved: false,
          updatedAt: serverTimestamp()
        });
        setAdminSaveStatus(`${name} suspended.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `marriageProfiles/${id}`);
      }
    }
  };



  useEffect(() => {
    localStorage.setItem('lokal_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('local_marriage_profiles', JSON.stringify(allMarriageProfiles));
    window.dispatchEvent(new CustomEvent('local_marriage_profiles_updated', { detail: allMarriageProfiles }));
  }, [allMarriageProfiles]);

  useEffect(() => {
    const handleMarriageSync = (e: any) => {
      if (e.type === 'local_marriage_profiles_updated') {
        setAllMarriageProfiles(e.detail);
      }
    };
    window.addEventListener('local_marriage_profiles_updated' as any, handleMarriageSync);
    return () => window.removeEventListener('local_marriage_profiles_updated' as any, handleMarriageSync);
  }, []);

  useEffect(() => {
    localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
    window.dispatchEvent(new CustomEvent('pending_approvals_updated', { detail: pendingApprovals }));
  }, [pendingApprovals]);

  const [deliveryAssignmentMode, setDeliveryAssignmentMode] = useState<'automatic' | 'manual'>('automatic');
  const handleTerminateVendor = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to TERMINATE ${name}? They will be banned from the platform instantly and their store will be closed.`)) {
      try {
        await updateDoc(doc(db, 'vendors', id), {
          status: 'Terminated',
          isOnline: false,
          updatedAt: serverTimestamp()
        });
        setAdminSaveStatus(`${name} has been terminated.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `vendors/${id}`);
      }
    }
  };

  const handleTerminateDeliveryPartner = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to BAN ${name}? Account will be locked immediately and they will be logged out of delivery mode.`)) {
      try {
        await updateDoc(doc(db, 'deliveryPartners', id), {
          status: 'Banned',
          isOnline: false,
          updatedAt: serverTimestamp()
        });
        setAdminSaveStatus(`${name} has been banned.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${id}`);
      }
    }
  };

  const handleRestorePartner = async (id: string, type: 'vendor' | 'delivery') => {
    try {
      if (type === 'vendor') {
        await updateDoc(doc(db, 'vendors', id), {
          status: 'Approved',
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'deliveryPartners', id), {
          status: 'Approved',
          updatedAt: serverTimestamp()
        });
      }
      setAdminSaveStatus(`Partner account restored.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${type === 'vendor' ? 'vendors' : 'deliveryPartners'}/${id}`);
    }
  };

  const handleAdminEditPartner = (partner: any, type: 'vendor' | 'delivery') => {
    setIsPartnerEditMode(true);
    setEditingPartnerId(partner.id);
    setPartnerType(type);
    setPartnerPhoto(partner.photo || partner.img || null);
    setFormStep(1); // Skip role selection
    if (type === 'vendor') {
      const details = partner.details || {};
      setPartnerData({
        name: partner.businessName || partner.name || '',
        ownerName: partner.ownerName || details.ownerName || '',
        service: partner.service || details.service || 'groceries',
        phone: partner.phone || '',
        gstNumber: partner.gst || details.gst || '',
        businessAddress: partner.address || details.address || '',
        aadhaar: '',
        rc: '',
        dl: '',
        otp: 'XXXX',
        vehicleNumber: '',
        chassisNumber: '',
        location: {
          area: partner.area || details.area || 'Hyderabad',
          city: partner.city || details.city || 'Hyderabad',
          pincode: partner.pincode || details.pincode || '500001'
        },
        docs: {
          aadhaar: true,
          rc: true,
          dl: true,
          businessProof: true
        }
      });
    } else {
      const details = partner.details || {};
      setPartnerData({
        name: partner.name || '',
        ownerName: '',
        service: partner.vehicleType || details.vehicleType || 'Bike',
        phone: partner.phone || '',
        gstNumber: '',
        businessAddress: '',
        aadhaar: partner.aadhaar || details.aadhaar || '876543210987',
        rc: '',
        dl: partner.dl || details.dl || 'TS092023000456',
        otp: 'XXXX',
        vehicleNumber: partner.vehicleNumber || details.vehicle || '',
        chassisNumber: partner.chassisNumber || details.chassisNumber || '12345',
        location: {
          area: partner.location?.area || details.area || 'Hyderabad',
          city: partner.location?.city || details.city || 'Hyderabad',
          pincode: partner.location?.pincode || details.pincode || '500001'
        },
        docs: {
          aadhaar: true,
          rc: true,
          dl: true,
          businessProof: false
        }
      });
    }
    setShowPartnerForm(true);
  };

  const handleAdminEditUser = (user: any) => {
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        ...editingUser,
        updatedAt: serverTimestamp()
      });
      setShowUserModal(false);
      setEditingUser(null);
      setAdminSaveStatus("User updated successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${editingUser.id}`);
    }
  };

  const handleSettlePayout = async (partnerId: string, type: 'vendor' | 'delivery') => {
    const date = new Date().toLocaleString();
    const collectionName = type === 'vendor' ? 'vendors' : 'deliveryPartners';
    const partner = type === 'vendor' 
      ? vendors.find(v => v.id === partnerId)
      : deliveryPartners.find(dp => dp.id === partnerId);
    
    if (!partner) return;
    const amount = partner.pendingPayout || 0;
    if (amount <= 0) return;

    try {
      // 1. Record payout in a persistent collection
      const payoutId = `pay-${Date.now()}-${partner.id}`;
      await setDoc(doc(db, 'payouts', payoutId), {
        id: payoutId,
        partnerId: partner.id,
        partnerName: type === 'vendor' ? (partner as any).businessName : (partner as any).name,
        amount: amount,
        date,
        type: type,
        createdAt: serverTimestamp()
      });

      // 2. Update partner's payout fields
      await updateDoc(doc(db, collectionName, partner.id), {
        totalPaid: (partner.totalPaid || 0) + amount,
        lastPayoutDate: date,
        pendingPayout: 0,
        updatedAt: serverTimestamp()
      });

      setAdminSaveStatus(`Settlement of ₹${amount} processed successfully.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${partner.id}`);
    }
  };

  const handleRequestRemittance = async (partnerId: string, amount: number) => {
    const date = new Date().toLocaleString();
    const dp = deliveryPartners.find(p => p.id === partnerId);
    if (!dp) return;

    const newRequest = {
      id: `remit-${Date.now()}`,
      amount,
      date,
      status: 'Pending' as const
    };

    try {
      await updateDoc(doc(db, 'deliveryPartners', partnerId), {
        remittanceRequests: [newRequest, ...(dp.remittanceRequests || [])],
        updatedAt: serverTimestamp()
      });
      
      if (activeDeliveryProfile?.id === partnerId) {
        setActiveDeliveryProfile(prev => prev ? {
          ...prev,
          remittanceRequests: [newRequest, ...(prev.remittanceRequests || [])]
        } : null);
      }
      setAdminSaveStatus("Remittance request submitted.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${partnerId}`);
    }
  };

  const handleApproveRemittance = async (partnerId: string, requestId: string) => {
    const dp = deliveryPartners.find(p => p.id === partnerId);
    if (!dp) return;

    const request = dp.remittanceRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      await updateDoc(doc(db, 'deliveryPartners', partnerId), {
        cashInHand: Math.max(0, (dp.cashInHand || 0) - request.amount),
        remittanceRequests: dp.remittanceRequests?.map(r => r.id === requestId ? { ...r, status: 'Approved' as const } : r),
        updatedAt: serverTimestamp()
      });
      setAdminSaveStatus("Remittance approved and cash adjusted.");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${partnerId}`);
    }
  };

  const [adminView, setAdminView] = useState<'dashboard' | 'inventory' | 'partners' | 'marriage' | 'vendors' | 'deliveryPartners' | 'security' | 'settlements' | 'settings' | 'customers' | 'support'>('dashboard');
  const [selectedApproval, setSelectedApproval] = useState<any | null>(null);
  const [supportChats, setSupportChats] = useState<Record<string, SupportChat>>(() => {
    return JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  useEffect(() => {
    const handleSupportUpdate = () => {
      setSupportChats(JSON.parse(localStorage.getItem('lokal_support_chats') || '{}'));
    };
    window.addEventListener('support_message_sent', handleSupportUpdate);
    window.addEventListener('storage', handleSupportUpdate);
    return () => {
      window.removeEventListener('support_message_sent', handleSupportUpdate);
      window.removeEventListener('storage', handleSupportUpdate);
    };
  }, []);

  const handleAdminReply = (partnerId: string) => {
    if (!adminReply.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: SupportMessage = {
      id: `admin-msg-${Date.now()}`,
      senderId: 'admin',
      senderName: 'Support',
      senderType: 'admin',
      text: adminReply,
      timestamp: now
    };

    const allChats = { ...supportChats };
    const chat = allChats[partnerId];
    if (chat) {
      chat.messages.push(newMsg);
      chat.lastMessageTimestamp = now;
      chat.unreadCount = 0; // Reset as admin has read/replied
      allChats[partnerId] = chat;
      localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
      setSupportChats(allChats);
      setAdminReply('');
      window.dispatchEvent(new CustomEvent('support_message_received'));
    }
  };

  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [isPartnerEditMode, setIsPartnerEditMode] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [adminSaveStatus, setAdminSaveStatus] = useState('');
  const [isVendorMode, setIsVendorMode] = useState(false);
  const [activeVendorProfile, setActiveVendorProfile] = useState<VendorProfile | null>(null);
  const [isDeliveryMode, setIsDeliveryMode] = useState(false);
  const [activeDeliveryProfile, setActiveDeliveryProfile] = useState<DeliveryPartnerProfile | null>(null);
  const [showPartnerSupportChat, setShowPartnerSupportChat] = useState(false);
  const [partnerChatMessage, setPartnerChatMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<{
    id: string;
    partnerName: string;
    amount: number;
    date: string;
    type: 'vendor' | 'delivery';
  }[]>(() => {
    const saved = loadFromStorage('payoutHistory', []);
    return saved;
  });

  useEffect(() => {
    localStorage.setItem('payoutHistory', JSON.stringify(payoutHistory));
  }, [payoutHistory]);

  const VENDOR_TERMS = [
    "Strict 10% commission on every order for platform maintenance.",
    "Zero tolerance for cheating. Any hidden charges result in immediate permanent ban.",
    "Inventory must be updated daily. False availability leads to 24-hour suspension.",
    "Mandatory acknowledgment of orders within 5 minutes.",
    "Weekly Payouts every Monday; minimum settlement threshold is ₹500.",
    "High-quality packaging is mandatory to prevent spills or damages."
  ];

  const DELIVERY_TERMS = [
    "Fixed Earnings: ₹20 base pay + ₹5 per km distance covered.",
    "Strict delivery timelines: reach vendor in 10m, customer in 15m from pickup.",
    "Clean uniform, helmet, and ID card mandatory during all working hours.",
    "Respectful behavior with users and vendors is non-negotiable.",
    "Demanding extra tips or cash from customers results in instant termination.",
    "Valid RC, Driving License, and Insurance must be carried at all times."
  ];

  useEffect(() => {
    // Check if user is an approved vendor or delivery partner on load
    if (userProfile?.phone) {
      const p = userProfile.phone.replace(/\D/g, '').slice(-10);
      const approvedVendor = vendors.find(v => v.phone?.replace(/\D/g, '').slice(-10) === p && v.status === 'Approved');
      if (approvedVendor) {
        setActiveVendorProfile(approvedVendor);
      }
      const approvedDelivery = deliveryPartners.find(dp => dp.phone?.replace(/\D/g, '').slice(-10) === p);
      if (approvedDelivery) {
        setActiveDeliveryProfile(approvedDelivery);
      }
    }
  }, [vendors, deliveryPartners, userProfile]);

  useEffect(() => {
    const openVendor = localStorage.getItem('openVendorDashboard');
    if (openVendor === 'true') {
      setIsVendorMode(true);
      localStorage.removeItem('openVendorDashboard');
    }
  }, []);
  useEffect(() => {
    if (adminSaveStatus) {
      const t = setTimeout(() => setAdminSaveStatus(''), 3000);
      return () => clearTimeout(t);
    }
  }, [adminSaveStatus]);

  useEffect(() => {
    localStorage.setItem('vendors', JSON.stringify(vendors));
    window.dispatchEvent(new Event('storage'));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('deliveryPartners', JSON.stringify(deliveryPartners));
    window.dispatchEvent(new Event('storage'));
  }, [deliveryPartners]);

  useEffect(() => {
    localStorage.setItem('pendingApprovals', JSON.stringify(pendingApprovals));
  }, [pendingApprovals]);

  const handleDeleteItem = (id: string) => {
    if (confirm("Delete this item permanently?")) {
      setLocalInventory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem({ ...item });
    setShowItemModal(true);
  };

  const handleAddNewItem = () => {
    setEditingItem({
      id: `new-${Date.now()}`,
      name: '',
      price: 0,
      stock: 0,
      category: 'groceries',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      description: ''
    });
    setShowItemModal(true);
  };

  const handleCancelOrder = async (id: string) => {
    if (confirm(`Cancel Order ${id}? This action cannot be undone.`)) {
      try {
        await updateDoc(doc(db, 'orders', id), {
          status: 'Cancelled',
          updatedAt: serverTimestamp()
        });
        setAdminSaveStatus(`Order ${id} cancelled.`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
      }
    }
  };

  const handleLogoClick = () => {
    if (isAdminLoggedIn) {
      setShowPanelSelection(true);
      return;
    }
    // Check if device is authorized
    const currentDevice = deviceRegistry.find(d => d.id === deviceId);
    if (!currentDevice?.isAuthorized) {
      setAdminView('dashboard'); // Default
      setAdminPass('');
      setShowAdminLogin(true);
    } else {
      setShowPanelSelection(true);
    }
  };
  const handleSaveItem = () => {
    if (!editingItem || !editingItem.name || editingItem.price <= 0) {
      alert("Please fill all mandatory fields correctly.");
      return;
    }
    
    setLocalInventory(prev => {
      const exists = prev.find(i => i.id === editingItem.id);
      if (exists) {
        return prev.map(i => i.id === editingItem.id ? editingItem : i);
      }
      return [editingItem, ...prev];
    });
    setSearchQuery('');
    setAdminSaveStatus('Item Saved Successfully!');
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleBannerClick = (banner: any) => {
    if (banner.action) {
      banner.action();
    } else if (banner.productId) {
      const product = localInventory.find(p => p.id === banner.productId);
      if (product) onProductClick(product);
    } else if (banner.categoryId) {
      const category = CATEGORIES.find(c => c.id === banner.categoryId);
      if (category) onCategoryClick(category);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTopBanner(prev => (prev === topBanners.length - 1 ? 0 : prev + 1));
      setActiveBottomBanner(prev => (prev === bottomBanners.length - 1 ? 0 : prev + 1));
    }, 4000); // 4 seconds as requested
    return () => clearInterval(timer);
  }, [topBanners.length, bottomBanners.length]);

  const [adminPassword, setAdminPassword] = useState(localStorage.getItem('adminPassword') || 'Founder@2026');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeStatus, setPasswordChangeStatus] = useState('');

  // Device Security Logic
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('admin_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('admin_device_id', id);
    }
    return id;
  });

  const [deviceRegistry, setDeviceRegistry] = useState<{
    id: string;
    lastLogin: number;
    failedAttempts: number;
    isBanned: boolean;
    name: string;
    isAuthorized: boolean;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('admin_device_registry');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { 
      console.warn("Device registry parse failed", e);
      return []; 
    }
  });

  const [activeAdminSessions, setActiveAdminSessions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('admin_active_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { 
      console.warn("Active sessions parse failed", e);
      return []; 
    }
  });

  useEffect(() => {
    localStorage.setItem('admin_device_registry', JSON.stringify(deviceRegistry));
  }, [deviceRegistry]);

  useEffect(() => {
    localStorage.setItem('admin_active_sessions', JSON.stringify(activeAdminSessions));
  }, [activeAdminSessions]);

  useEffect(() => {
    if (isAdmin && !isAdminLoggedIn) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('admin_session_active', 'true');
    }

    if (isAdminLoggedIn) {
      onAdminAuth?.(true);
    }
    
    // Check for deep links from profile
    if (localStorage.getItem('openAdminOnHome') === 'true') {
      localStorage.removeItem('openAdminOnHome');
      if (isAdmin || isAdminLoggedIn) setIsAdminOpen(true);
      else setShowAdminLogin(true);
    }
    if (localStorage.getItem('openPartnerForm')) {
      const type = localStorage.getItem('openPartnerForm');
      localStorage.removeItem('openPartnerForm');
      setPartnerType(type as any);
      setShowPartnerForm(true);
    }
  }, [isAdmin, isAdminLoggedIn, vendors]);

  const handleSendOtp = () => {
    if (!adminPhone || adminPhone.length < 10) {
      setLoginError('Enter a valid phone number');
      return;
    }
    // Simulate OTP sending
    setAdminAuthStep('otp');
    setLoginError('');
    console.log('OTP Sent to', adminPhone);
  };

  const handleVerifyOtp = () => {
    if (adminOtp === '1234' || adminOtp === '4321') { // Demo OTPs
      setAdminAuthStep('password');
      setLoginError('');
      // In a real app, this would verify the OTP and log them in
      finalizeAdminLogin();
    } else {
      setLoginError('Invalid OTP');
    }
  };

  const finalizeAdminLogin = () => {
    // Success Login
    setDeviceRegistry(prev => prev.map(d => 
      d.id === deviceId ? { ...d, failedAttempts: 0, lastLogin: Date.now(), isAuthorized: true } : d
    ));

    setShowAdminLogin(false);
    setShowPanelSelection(true);
    setIsAdminLoggedIn(true);
    localStorage.setItem('admin_session_active', 'true');
    window.dispatchEvent(new Event('maintenance_mode_changed'));
    onAdminAuth?.(true);
    setAdminPass('');
    setLoginError('');
  };

  const handleAdminAuth = () => {
    const currentDevice = deviceRegistry.find(d => d.id === deviceId);
    
    // 1. Check if device is banned (brute force protection)
    if (currentDevice && currentDevice.isBanned) {
      setLoginError('This device is blocked. Contact Master Admin.');
      return;
    }

    if (adminPass === adminPassword) {
      // Correct password logic
      
      // 2. Check if already part of active sessions
      const isAlreadySession = activeAdminSessions.includes(deviceId);
      
      if (!isAlreadySession) {
        // Only 6 devices can open admin panel at a time
        if (activeAdminSessions.length >= 6) {
          setLoginError('Max 6 devices limit reached. Contact Master Admin.');
          return;
        }
        
        // 3. If new device, check if admin has given permit/authorized it
        const deviceRecord = deviceRegistry.find(d => d.id === deviceId);
        if (deviceRegistry.length > 0 && (!deviceRecord || !deviceRecord.isAuthorized)) {
          if (!deviceRecord) {
            setDeviceRegistry(prev => [...prev, {
              id: deviceId,
              lastLogin: Date.now(),
              failedAttempts: 0,
              isBanned: false,
              name: 'New Device ' + deviceId.slice(-4),
              isAuthorized: false
            }]);
          }
          setLoginError('New device detected. Required OTP verification.');
          setAdminAuthStep('otp'); // Redirect to OTP for new devices
          return;
        }

        // Add to active sessions
        setActiveAdminSessions(prev => [...prev.slice(-5), deviceId]);
      }

      finalizeAdminLogin();
    } else {
      // Incorrect password logic
      setDeviceRegistry(prev => {
        const index = prev.findIndex(d => d.id === deviceId);
        if (index === -1) {
          return [...prev, {
            id: deviceId,
            lastLogin: Date.now(),
            failedAttempts: 1,
            isBanned: false,
            name: 'Device ' + deviceId.slice(-4),
            isAuthorized: false
          }];
        }
        
        const newAttempts = prev[index].failedAttempts + 1;
        const shouldBan = newAttempts >= 5;
        
        const newRegistry = [...prev];
        newRegistry[index] = {
          ...newRegistry[index],
          failedAttempts: newAttempts,
          isBanned: shouldBan
        };
        return newRegistry;
      });

      if (currentDevice && currentDevice.failedAttempts >= 4) {
        setLoginError('Device BLOCKED due to too many failed attempts.');
      } else {
        setLoginError(`Incorrect Passcode (${(currentDevice?.failedAttempts || 0) + 1}/5)`);
      }
    }
  };

  const handlePasswordChange = () => {
    if (newPassword.length < 4) {
      setPasswordChangeStatus('Password too short');
      return;
    }
    localStorage.setItem('adminPassword', newPassword);
    setAdminPassword(newPassword);
    setNewPassword('');
    setPasswordChangeStatus('Password updated successfully!');
    setTimeout(() => setPasswordChangeStatus(''), 3000);
  };

  const Skeleton = ({ className, ...props }: { className: string; [key: string]: any }) => (
    <div className={`animate-pulse bg-gray-100 rounded-2xl ${className}`} {...props}></div>
  );

  const t = translations[language].home;

  const filteredCategories = React.useMemo(() => 
    CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  const filteredProducts = React.useMemo(() => 
    localInventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Apply Filters
      const itemRating = (item as any).rating || 0;
      if (filterRating > 0 && itemRating < filterRating) return false;
      if (filterPrice === 'low' && item.price > 500) return false;
      if (filterPrice === 'high' && item.price <= 500) return false;

      return true;
    }), [searchQuery, localInventory, filterRating, filterPrice]);

  if (loading) {
    return (
      <div className="h-full w-full bg-white flex flex-col pt-12">
        <header className="px-6 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10" />
            <div className="space-y-2">
              <Skeleton className="w-20 h-2" />
              <Skeleton className="w-32 h-4" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-10 h-10" />
            <Skeleton className="w-10 h-10" />
          </div>
        </header>
        <div className="px-6 space-y-8 flex-1 overflow-hidden">
          <Skeleton className="w-full h-12 rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-14 h-14" />
                <Skeleton className="w-12 h-2" />
              </div>
            ))}
          </div>
          <Skeleton className="w-full h-44 rounded-[2.5rem]" />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="w-32 h-6" />
              <Skeleton className="w-16 h-4" />
            </div>
            <div className="flex gap-4 overflow-hidden">
              {[1,2,3].map(i => (
                <Skeleton key={i} className="w-48 h-64 shrink-0 rounded-[2rem]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const SearchFilters = () => (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setFilterPrice(filterPrice === 'low' ? 'all' : 'low')}
        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border-2 ${
          filterPrice === 'low' 
            ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200' 
            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 active:bg-gray-50'
        }`}
      >
        <span className="flex items-center gap-2">
          {filterPrice === 'low' && <Check className="w-3 h-3" />}
          Budget Friendly
        </span>
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setFilterRating(filterRating === 4 ? 0 : 4)}
        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border-2 flex items-center gap-2 ${
          filterRating === 4 
            ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200' 
            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 active:bg-gray-50'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${filterRating === 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 group-hover:text-yellow-400'}`} />
        Top Rated
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setFilterAvailability(!filterAvailability)}
        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all border-2 ${
          filterAvailability 
            ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200' 
            : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 active:bg-gray-50'
        }`}
      >
        <span className="flex items-center gap-2">
          {filterAvailability && <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
          Lokal Instant
        </span>
      </motion.button>
      {(filterPrice !== 'all' || filterRating !== 0 || filterAvailability) && (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            setFilterPrice('all');
            setFilterRating(0);
            setFilterAvailability(false);
          }}
          className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap bg-rose-50 text-rose-500 border-2 border-rose-100 flex items-center gap-2"
        >
          <X className="w-3 h-3" />
          Clear
        </motion.button>
      )}
    </div>
  );

  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Partner Support Chat Modal */}
      <AnimatePresence>
        {showPartnerSupportChat && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPartnerSupportChat(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl flex flex-col h-[600px] max-h-full overflow-hidden"
            >
              <header className="p-6 bg-gray-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-gray-900 font-black text-xs">PS</div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Partner Support</h3>
                    <p className="text-[10px] text-emerald-400 font-bold tracking-widest animate-pulse uppercase">● Admin Online</p>
                  </div>
                </div>
                <button onClick={() => setShowPartnerSupportChat(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {(Object.values(supportChats) as SupportChat[]).find(c => c.partnerId === (activeVendorProfile?.id || activeDeliveryProfile?.id))?.messages.map((msg: any) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm ${
                      msg.senderType === 'partner' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                    }`}>
                      {msg.text}
                      <p className={`text-[8px] mt-2 font-black uppercase tracking-widest opacity-60 ${msg.senderType === 'partner' ? 'text-right' : ''}`}>{msg.timestamp}</p>
                    </div>
                  </motion.div>
                )) || (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                     <HelpCircle className="w-12 h-12 mb-4" />
                     <p className="text-xs font-black uppercase tracking-[0.2em]">Start a conversation with admin</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const partnerId = activeVendorProfile?.id || activeDeliveryProfile?.id || 'unknown';
                    const partnerName = activeVendorProfile?.businessName || activeDeliveryProfile?.name || 'Partner';
                    if (!partnerChatMessage.trim()) return;

                    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const newMsg: SupportMessage = {
                      id: `partner-msg-${Date.now()}`,
                      senderId: partnerId,
                      senderName: partnerName,
                      senderType: 'partner',
                      text: partnerChatMessage,
                      timestamp: now
                    };

                    const allChats = { ...supportChats };
                    const chat = allChats[partnerId] || { partnerId, partnerName, messages: [], lastMessageTimestamp: now, unreadCount: 0 };
                    chat.messages.push(newMsg);
                    chat.lastMessageTimestamp = now;
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                    allChats[partnerId] = chat;
                    
                    localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
                    setSupportChats(allChats);
                    setPartnerChatMessage('');
                    window.dispatchEvent(new CustomEvent('support_message_sent'));
                  }}
                  className="flex gap-2"
                >
                  <input 
                    value={partnerChatMessage}
                    onChange={(e) => setPartnerChatMessage(e.target.value)}
                    placeholder="Describe your issue..."
                    className="flex-1 bg-gray-50 px-5 py-3 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-yellow-400 transition-all"
                  />
                  <button className="p-4 bg-gray-900 text-white rounded-2xl active:scale-95 transition-all shadow-xl shadow-gray-200">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {isMaintenanceMode && !isAdmin && (
        <div className="fixed inset-0 z-[1000] bg-indigo-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 bg-white/5 rounded-full blur-3xl absolute top-1/2 left-1/2 -ml-16 -mt-16"
          />
          <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-white/20 backdrop-blur-xl shadow-2xl">
            <Settings className="w-12 h-12 text-yellow-400 animate-spin-slow" />
          </div>
          <h2 className="text-4xl font-black text-white italic mb-4 font-display">Major Update in Progress</h2>
          <p className="text-indigo-200 font-bold uppercase text-[10px] tracking-[0.3em] max-w-xs leading-relaxed mb-12">
            Lokal Bharath is getting upgraded with new features. All your data and orders are safe. Check back soon!
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-12 py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-yellow-400/20 active:scale-95 transition-all"
          >
            Check Status
          </button>
          
          <div className="mt-20 flex items-center gap-3 text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Founder Controlled Session</span>
          </div>
        </div>
      )}
      {showVoiceModal && (
        <>
          <div className="absolute inset-0 bg-yellow-400/95 backdrop-blur-md"></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-25"></div>
              <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <Mic className={`w-12 h-12 text-yellow-500 ${isListening ? 'animate-bounce' : ''}`} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              {isListening ? translations[language].common?.listening || 'Listening...' : translations[language].common?.searching || 'Searching...'}
            </h2>
            <p className="text-gray-900/60 font-bold uppercase tracking-widest text-[10px]">
              Try "Fresh Milk" or "AC Service"
            </p>
            <button 
              onClick={() => setShowVoiceModal(false)}
              className="mt-12 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              {translations[language].common?.cancel || 'Cancel'}
            </button>
          </motion.div>
        </>
      )}

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative border-4 border-white"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400"></div>
              
              <div className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center mb-4 shadow-xl">
                  <ShieldCheck className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 text-center italic tracking-tighter">
                  {adminAuthStep === 'password' ? 'Founder Login' : 
                   adminAuthStep === 'otp' ? 'Safety Verify' : 'Founder Recovery'}
                </h3>
              </div>

              {adminAuthStep === 'password' && (
                <div className="space-y-4">
                  <input 
                    type="password"
                    placeholder="Enter Passcode"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-yellow-400 text-center text-lg"
                  />
                  <button 
                    onClick={() => {
                      setAdminAuthStep('recovery');
                      setLoginError('');
                    }}
                    className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                  >
                    Forgot passcode? Use Recovery
                  </button>
                </div>
              )}

              {adminAuthStep === 'otp' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-500 text-center uppercase tracking-widest leading-relaxed">
                    A security code has been sent to your registered mobile ending in **001
                  </p>
                  <input 
                    type="text"
                    maxLength={4}
                    placeholder="0 0 0 0"
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-50 p-4 rounded-2xl font-black outline-none border-2 border-transparent focus:border-yellow-400 text-center text-2xl tracking-[0.5em]"
                  />
                  <div className="flex justify-between items-center px-1">
                    <button className="text-[9px] font-black text-indigo-500 uppercase">Resend Code</button>
                    <button 
                      onClick={() => setAdminAuthStep('password')}
                      className="text-[9px] font-black text-gray-400 uppercase"
                    >
                      Use Password
                    </button>
                  </div>
                </div>
              )}

              {adminAuthStep === 'recovery' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-500 text-center uppercase tracking-widest leading-relaxed">
                    Verify identity via SMS code to reset access
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="tel"
                      placeholder="Registered Mobile"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-gray-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-yellow-400 text-sm"
                    />
                    <button 
                      onClick={() => {
                        if(adminPhone.length >= 10) {
                          setAdminAuthStep('otp');
                          setLoginError('Recovery code sent to +91 ' + adminPhone.slice(-4));
                        }
                      }}
                      className="px-4 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                    >
                      Send
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setAdminAuthStep('password');
                      setLoginError('');
                    }}
                    className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest"
                  >
                    Back to Login
                  </button>
                </div>
              )}

              {loginError && (
                <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-rose-600 text-[10px] font-black uppercase text-center leading-tight">
                    {loginError}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminAuthStep('password');
                    setLoginError('');
                  }}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Close
                </button>
                <button 
                  onClick={
                    adminAuthStep === 'password' ? handleAdminAuth : 
                    adminAuthStep === 'otp' ? handleVerifyOtp : 
                    handleSendOtp
                  }
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {adminAuthStep === 'recovery' ? 'Verify Identity' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {showPanelSelection && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[3.5rem] w-full max-w-sm shadow-2xl relative border-2 border-white/50"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowPanelSelection(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-[1.5rem] mx-auto flex items-center justify-center mb-6 shadow-2xl">
                  <ShieldCheck className="w-8 h-8 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none mb-2">Access Portal</h2>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Choose Administrative Domain</p>
              </div>

              <div className="grid gap-4">
                <button 
                  onClick={() => {
                    setShowPanelSelection(false);
                    setAdminView('dashboard');
                    setIsAdminOpen(true);
                  }}
                  className="w-full p-6 bg-gray-900 text-white rounded-[2.5rem] flex items-center gap-5 group active:scale-95 transition-all shadow-xl shadow-gray-200"
                >
                  <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-yellow-400 group-hover:text-gray-900 transition-all">
                    <LayoutDashboard className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black italic text-white">Founder Panel</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Master Control & Catalog</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setShowPanelSelection(false);
                    setIsLogisticsOpen(true);
                  }}
                  className="w-full p-6 bg-indigo-50 border-2 border-indigo-100 text-indigo-900 rounded-[2.5rem] flex items-center gap-5 group active:scale-95 transition-all"
                >
                  <div className="p-4 bg-indigo-600 text-white rounded-2xl group-hover:scale-110 transition-all">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black italic text-indigo-900">Logistics Hub</p>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Orders & Delivery Ops</p>
                  </div>
                </button>
              </div>
              
              <p className="text-center mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-50 italic">Highly Secure Environment</p>
            </motion.div>
          </div>
        )}

      {/* Founder Admin Dashboard */}

      <AnimatePresence>
        {isLogisticsOpen && (
          <div className="fixed inset-0 z-[120] bg-white flex flex-col">
            <header className="p-6 bg-gray-900 text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black italic tracking-tighter leading-none mb-1">Logistics Hub</h2>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest leading-none">Order Management Panel</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsLogisticsOpen(false)}
                  className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <nav className="bg-gray-800 px-6 py-3 flex gap-4 overflow-x-auto scrollbar-hide border-b border-gray-700">
               <button 
                onClick={() => setLogisticsView('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logisticsView === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <ClipboardList className="w-3.5 h-3.5" />
                 Active Orders
               </button>
               <button 
                onClick={() => setLogisticsView('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logisticsView === 'stats' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <BarChart3 className="w-3.5 h-3.5" />
                 Reporting
               </button>
               <button 
                onClick={() => setLogisticsView('communications')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logisticsView === 'communications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-white'}`}
               >
                 <Bell className="w-3.5 h-3.5" />
                 Broadcasts
               </button>
            </nav>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-8 pb-32">
              {logisticsView === 'orders' ? (
                <>
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <div>
                         <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Dispatcher Queue</h3>
                         <p className="text-[10px] font-bold text-gray-400 mt-1 italic uppercase tracking-wider">Pending Assignment & Quality Checks</p>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <div className="flex gap-1.5 p-1 bg-gray-200 rounded-2xl">
                           {['All', 'Today', 'Custom'].map((d) => (
                             <button
                               key={d}
                               onClick={() => setDispatcherDate(d)}
                               className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${dispatcherDate === d ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                             >
                               {d}
                             </button>
                           ))}
                         </div>
                         {dispatcherDate === 'Custom' && (
                           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                             <Calendar className="w-3 h-3 text-indigo-500" />
                             <input 
                               type="date"
                               value={customDispatcherDate}
                               onChange={(e) => setCustomDispatcherDate(e.target.value)}
                               className="text-[9px] font-black uppercase outline-none text-indigo-600"
                             />
                           </div>
                         )}
                       </div>
                       <div className="flex gap-1.5 p-1 bg-gray-200 rounded-2xl">
                         {['All', 'Pending', 'Cancelled', 'Returned'].map((s) => (
                           <button 
                            key={s}
                            onClick={() => setLogisticsFilterStatus(s as any)}
                            className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${logisticsFilterStatus === s ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
                           >
                             {s}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="grid gap-4">
                      {activeOrders
                        .filter(o => {
                          const matchesStatus = logisticsFilterStatus === 'All' ? true : o.status === logisticsFilterStatus;
                          const orderDate = new Date(o.timestamp);
                          const now = new Date();
                          
                          let matchesDate = true;
                          if (dispatcherDate === 'Today') {
                            matchesDate = orderDate.toDateString() === now.toDateString();
                          } else if (dispatcherDate === 'Custom') {
                            const selDate = new Date(customDispatcherDate);
                            matchesDate = orderDate.toDateString() === selDate.toDateString();
                          }
                          
                          return matchesStatus && matchesDate;
                        })
                        .map((order) => (
                        <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between lg:justify-start lg:gap-10 group hover:border-indigo-200 transition-all">
                          <div className="flex items-center gap-5">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black italic transition-all ${
                               order.status === 'Pending' ? 'bg-orange-50 text-orange-500 shadow-sm shadow-orange-50' :
                               order.status === 'Cancelled' ? 'bg-rose-50 text-rose-500' :
                               order.status === 'Returned' ? 'bg-purple-50 text-purple-500' :
                               'bg-emerald-50 text-emerald-500'
                             }`}>
                               {order.status === 'Pending' ? '!' : order.id.slice(-2)}
                             </div>
                             <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <h4 className="text-sm font-black text-gray-900 italic tracking-tight">{order.customerName}</h4>
                                 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                   order.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                                   order.status === 'Cancelled' ? 'bg-rose-100 text-rose-600' :
                                   order.status === 'Returned' ? 'bg-purple-100 text-purple-600' :
                                   'bg-emerald-100 text-emerald-600'
                                 }`}>
                                   {order.status}
                                 </span>
                               </div>
                               <div className="flex items-center gap-3">
                                 <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                                   <Package className="w-3 h-3" /> {order.items} Items
                                 </p>
                                 <p className="text-[10px] font-black text-indigo-600 flex items-center gap-1">
                                   ₹{order.total}
                                 </p>
                                 <p className="text-[8px] font-bold text-gray-300 uppercase italic">
                                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                               </div>
                             </div>
                          </div>
                          
                          <div className="flex gap-2">
                             {order.status === 'Pending' && (
                               <>
                                 <button 
                                   onClick={() => {
                                     setActiveOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Accepted'} : o));
                                   }}
                                   className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-emerald-100 active:scale-95 transition-all"
                                 >
                                   Accept
                                 </button>
                                 <button 
                                   onClick={() => {
                                     if(confirm('Cancel this order?')) {
                                       setActiveOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Cancelled'} : o));
                                     }
                                   }}
                                   className="h-10 px-4 bg-gray-100 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                 >
                                   Cancel
                                 </button>
                               </>
                             )}
                             {(order.status === 'Accepted' || order.status === 'Preparing') && (
                               <div className="flex gap-2">
                                  <select 
                                    className="h-10 bg-gray-50 border border-gray-100 rounded-xl text-[9px] font-black uppercase px-3 outline-none focus:border-indigo-500 transition-all"
                                    onChange={(e) => handleAssignRider(order.id, e.target.value)}
                                    value={order.deliveryPartnerId || ""}
                                  >
                                    <option value="">Manual Assign Rider</option>
                                    {deliveryPartners.filter(dp => dp.isOnline).map(dp => (
                                      <option key={dp.id} value={dp.id}>{dp.name} ({dp.vehicleType})</option>
                                    ))}
                                  </select>
                               </div>
                             )}
                             {order.status === 'Delivered' && (
                               <button 
                                 onClick={() => {
                                   if(confirm('Mark as Returned?')) {
                                     setActiveOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Returned'} : o));
                                   }
                                 }}
                                 className="h-10 px-4 bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                               >
                                 Mark Return
                               </button>
                             )}
                          </div>
                        </div>
                      ))}
                      {activeOrders.filter(o => logisticsFilterStatus === 'All' ? true : o.status === logisticsFilterStatus).length === 0 && (
                        <div className="py-20 text-center bg-white rounded-[3rem] border border-gray-100 italic">
                          <PackageSearch className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No matching orders in queue</p>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              ) : logisticsView === 'stats' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <header className="flex items-center justify-between">
                     <div>
                       <h3 className="text-xl font-black text-gray-900 italic tracking-tighter leading-none mb-1">Operational Metrics</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Platform performance reporting</p>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                       <div className="flex gap-1.5 p-1.5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                         {[
                           { id: 'day', label: 'Daily' },
                           { id: 'week', label: 'Weekly' },
                           { id: 'month', label: 'Monthly' },
                           { id: 'custom', label: 'Custom' }
                         ].map((r) => (
                           <button 
                            key={r.id}
                            onClick={() => setLogisticsReportRange(r.id as any)}
                            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${logisticsReportRange === r.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400'}`}
                           >
                             {r.label}
                           </button>
                         ))}
                       </div>
                       {logisticsReportRange === 'custom' && (
                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                            <Calendar className="w-3 h-3 text-indigo-500" />
                            <input 
                              type="date"
                              value={logisticsCustomDate}
                              onChange={(e) => setLogisticsCustomDate(e.target.value)}
                              className="text-[9px] font-black uppercase outline-none text-indigo-600"
                            />
                          </div>
                        )}
                     </div>
                  </header>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute -right-2 -top-2 opacity-5 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-700">
                        <ShoppingBag className="w-20 h-20 text-indigo-900" />
                      </div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Volume</p>
                      <p className="text-3xl font-black text-gray-900 italic mb-2 tracking-tighter">
                        {getOrdersInTimeRange(logisticsReportRange).length}
                      </p>
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase">
                        <TrendingUp className="w-3 h-3" /> +12% Growth
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform GMV</p>
                      <p className="text-3xl font-black text-gray-900 italic mb-2 tracking-tighter">
                        ₹{getOrdersInTimeRange(logisticsReportRange).reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase">
                        <ArrowUpRight className="w-3 h-3" /> Healthy Growth
                      </div>
                    </div>

                    <div className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 relative overflow-hidden">
                       <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">Cancellations</p>
                       <p className="text-3xl font-black text-rose-600 italic mb-2 tracking-tighter">
                         {getOrdersInTimeRange(logisticsReportRange).filter(o => o.status === 'Cancelled').length}
                       </p>
                       <p className="text-[8px] font-bold text-rose-400 uppercase italic leading-none">High Attention Required</p>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-[2.5rem] border border-purple-100 relative overflow-hidden">
                       <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-2">Returns</p>
                       <p className="text-3xl font-black text-purple-600 italic mb-2 tracking-tighter">
                         {getOrdersInTimeRange(logisticsReportRange).filter(o => o.status === 'Returned').length}
                       </p>
                       <p className="text-[8px] font-bold text-purple-400 uppercase italic leading-none">Inventory Re-allocation</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                         <Calendar className="w-4 h-4 text-indigo-500" />
                         Status Performance Breakdown
                       </h4>
                       <button className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-2 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all">
                         <Download className="w-3 h-3" /> Data Export
                       </button>
                    </div>
                    
                    <div className="space-y-4">
                      {['Pending', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].map((status) => {
                        const count = getOrdersInTimeRange(logisticsReportRange).filter(o => o.status === status).length;
                        const total = getOrdersInTimeRange(logisticsReportRange).length || 1;
                        const percentage = (count / total) * 100;
                        
                        return (count > 0 || logisticsReportRange === 'day') && (
                          <div key={status} className="space-y-2">
                             <div className="flex items-center justify-between">
                               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{status}</p>
                               <p className="text-[10px] font-black text-gray-900 italic">{count} Orders</p>
                             </div>
                             <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${percentage}%` }}
                                 className={`h-full rounded-full ${
                                   status === 'Delivered' ? 'bg-emerald-500' :
                                   status === 'Cancelled' ? 'bg-rose-500' :
                                   status === 'Returned' ? 'bg-purple-500' :
                                   'bg-indigo-500'
                                 }`}
                               />
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <header>
                    <h3 className="text-xl font-black text-gray-900 italic tracking-tighter leading-none mb-1">Communications & Settings</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage support and broadcast notifications</p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Customer Support Settings */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                          </div>
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Customer Support</h4>
                        </div>
                        
                        {/* Maintenance Mode Toggle */}
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => {
                              const nextMode = !isMaintenanceMode;
                              setIsMaintenanceMode(nextMode);
                              alert(`Maintenance Mode ${nextMode ? 'ACTIVATED' : 'DEACTIVATED'}.\n\n${nextMode ? 'Users will be blocked immediately.' : 'App is now live for all users.'}`);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isMaintenanceMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-emerald-50 text-emerald-600'}`}
                          >
                            <Settings className={`w-3 h-3 ${isMaintenanceMode ? 'animate-spin-slow' : ''}`} />
                            {isMaintenanceMode ? 'Maintenance: ACTIVE' : 'Go Live Mode'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Phone Number</label>
                          <input 
                            type="text"
                            value={supportInfo.phone}
                            onChange={(e) => setSupportInfo({...supportInfo, phone: e.target.value})}
                            placeholder="+91 00000 00000"
                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black italic outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Support Email Address</label>
                          <input 
                            type="email"
                            value={supportInfo.email}
                            onChange={(e) => setSupportInfo({...supportInfo, email: e.target.value})}
                            placeholder="support@example.com"
                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black italic outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase italic px-1">
                          * Maintenance mode blocks all users immediately except active admins. Ensure you keep your session active to turn it off.
                        </p>
                      </div>
                    </section>

                    {/* Notification Broadcast */}
                    <section className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-50 rounded-xl">
                          <Megaphone className="w-5 h-5 text-yellow-600" />
                        </div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Global Broadcast</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notification Title</label>
                          <input 
                            type="text"
                            value={broadcastMessage.title}
                            onChange={(e) => setBroadcastMessage({...broadcastMessage, title: e.target.value})}
                            placeholder="e.g., Weekend Bonanza!"
                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black italic outline-none focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Flash Message</label>
                          <textarea 
                            value={broadcastMessage.message}
                            onChange={(e) => setBroadcastMessage({...broadcastMessage, message: e.target.value})}
                            placeholder="Describe the offer or update..."
                            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black italic outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                          />
                        </div>
                        <button 
                          onClick={sendBroadcast}
                          disabled={isBroadcasting || !broadcastMessage.title || !broadcastMessage.message}
                          className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                        >
                          {isBroadcasting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send to All Users
                            </>
                          )}
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminOpen && (
          <div className="fixed inset-0 z-[120] bg-white">
            <header className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-900 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-none">Founder Panel</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Control Center</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setIsAdminOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-2 bg-gray-100 rounded-xl"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('admin_session_active');
                    window.dispatchEvent(new Event('maintenance_mode_changed'));
                    setIsAdminLoggedIn(false);
                    onAdminAuth?.(false);
                    setIsAdminOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-2 bg-rose-50 rounded-xl text-rose-500"
                  title="Logout Admin"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </header>
            
            <div className="bg-gray-900 px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setAdminView('dashboard')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'dashboard' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => setAdminView('inventory')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'inventory' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Catalog
              </button>
              <button 
                onClick={() => setAdminView('vendors')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'vendors' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Vendors
              </button>
              <button 
                onClick={() => setAdminView('deliveryPartners')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'deliveryPartners' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Delivery ({deliveryPartners.length})
              </button>
              <button 
                onClick={() => setAdminView('partners')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'partners' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Approvals ({pendingApprovals.length})
              </button>
              <button 
                onClick={() => setAdminView('marriage')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'marriage' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Marriage ({allMarriageProfiles.length})
              </button>
              <button 
                onClick={() => setAdminView('customers')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'customers' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Customers ({users.length})
              </button>
              <button 
                onClick={() => setAdminView('support')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'support' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Support {(Object.values(supportChats) as SupportChat[]).reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && <span className="bg-rose-500 text-white px-1.5 py-0.5 rounded-full ml-1 text-[8px] leading-none flex items-center justify-center min-w-[14px] h-[14px] inline-flex align-middle relative -top-0.5">{(Object.values(supportChats) as SupportChat[]).reduce((acc, c) => acc + (c.unreadCount || 0), 0)}</span>}
              </button>
              <button 
                onClick={() => setAdminView('settlements')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'settlements' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Settlements
              </button>
              <button 
                onClick={() => setAdminView('security')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminView === 'security' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400'}`}
              >
                Security
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-130px)]">
              {adminSaveStatus && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] w-full max-w-sm px-6">
                  <motion.div 
                    initial={{ y: -20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    className="bg-gray-900 text-white p-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl"
                  >
                    <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/20">
                      <Check className="w-5 h-5 text-gray-900" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Operation Success</p>
                      <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-tight">{adminSaveStatus}</p>
                    </div>
                    <button 
                      onClick={() => setAdminSaveStatus('')}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              )}

              {adminView === 'dashboard' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setIsAdminOpen(false);
                        onNavigate('delivery');
                      }}
                      className="bg-white p-6 rounded-[2.5rem] border border-orange-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-lg transition-all active:scale-95 group"
                    >
                      <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Bike className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none">Logistics Hub</p>
                    </button>
                    <button 
                      onClick={() => {
                        setIsAdminOpen(false);
                        setIsVendorMode(true);
                        setActiveVendorProfile(vendors[0]);
                      }}
                      className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-lg transition-all active:scale-95 group"
                    >
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none">Merchant Hub</p>
                    </button>
                  </div>

                  <header className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 italic leading-none">Admin Control</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Live platform activity</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
                          const vendor = vendors[0];
                          const newOrder: any = {
                            id: orderId,
                            customerName: ['Bharat Kumar', 'Ramesh Rao', 'Anjali Singh', 'Vikram Dev'][Math.floor(Math.random() * 4)],
                            items: Math.floor(Math.random() * 4) + 1,
                            total: Math.floor(400 + Math.random() * 600),
                            status: 'Pending' as const,
                            vendorId: vendor?.id || 'v1',
                            deliveryPartnerId: null,
                            timestamp: new Date().toISOString()
                          };
                          setActiveOrders(prev => [newOrder, ...prev]);
                          setAdminSaveStatus(`New Order ${orderId} Simulated!`);
                          
                          if (deliveryAssignmentMode === 'automatic') {
                            setTimeout(() => {
                              autoAssignRider(orderId);
                            }, 1500);
                          }
                        }}
                        className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" />
                        Simulate Order
                      </button>
                    </div>
                  </header>

                  <section className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-5 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Briefcase className="w-12 h-12 text-emerald-900" />
                      </div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 leading-none">Vendors</p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black text-gray-900 italic">{vendors.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          {vendors.filter(v => v.isOnline).length} Online
                        </p>
                        <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                          {vendors.filter(v => !v.isOnline).length} Offline
                        </p>
                        {pendingApprovals.filter(p => p.type === 'vendor').length > 0 && (
                          <p className="text-[9px] font-black text-orange-500 uppercase flex items-center gap-1 mt-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {pendingApprovals.filter(p => p.type === 'vendor').length} Pending
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-5 rounded-[2.5rem] border border-blue-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Bike className="w-12 h-12 text-blue-900" />
                      </div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 leading-none">Delivery</p>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-black text-gray-900 italic">{deliveryPartners.length}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          {deliveryPartners.filter(dp => dp.isOnline).length} Online
                        </p>
                        <p className="text-[9px] font-black text-gray-400 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                          {deliveryPartners.filter(dp => !dp.isOnline).length} Offline
                        </p>
                        {pendingApprovals.filter(p => p.type === 'delivery').length > 0 && (
                          <p className="text-[9px] font-black text-orange-500 uppercase flex items-center gap-1 mt-1">
                            <AlertCircle className="w-2.5 h-2.5" />
                            {pendingApprovals.filter(p => p.type === 'delivery').length} Pending
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Active Dispatch Queue ({activeOrders.length})</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">Real-time logistics monitoring</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                        <button 
                          onClick={() => setDeliveryAssignmentMode('automatic')}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${deliveryAssignmentMode === 'automatic' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Auto
                        </button>
                        <button 
                          onClick={() => setDeliveryAssignmentMode('manual')}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${deliveryAssignmentMode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Manual
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-6">
                      <button 
                        onClick={simulateOrder}
                        className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        Simulate New Order
                      </button>
                      <button 
                        onClick={() => setActiveOrders([])}
                        className="px-4 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-rose-100 transition-all"
                        title="Clear all orders"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {activeOrders.map(order => (
                        <div key={order.id} className="p-5 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-3 hover:border-indigo-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{order.id}</p>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <p className="text-[10px] font-bold text-gray-400">{order.customerName}</p>
                              </div>
                              <p className="text-xs font-black text-gray-900 leading-tight">{order.items} Items • <span className="text-emerald-600">₹{order.total}</span></p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                order.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 
                                order.status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {order.status}
                              </span>
                              {order.timestamp && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="text-[8px] font-black text-rose-500 uppercase hover:underline"
                                  >
                                    Cancel
                                  </button>
                                  <p className="text-[8px] font-bold text-gray-400">
                                    {Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000)}m ago
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-3 border-t border-gray-200/50">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${order.deliveryPartnerId ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-300'}`}>
                              <Bike className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1.5">Assignment State</p>
                              <div className="flex items-center gap-2">
                                {order.deliveryPartnerId ? (
                                  <>
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    <p className="text-xs font-black text-gray-900">
                                      {deliveryPartners.find(dp => dp.id === order.deliveryPartnerId)?.name || 'Unknown Rider'}
                                    </p>
                                    <button 
                                      onClick={() => handleAssignRider(order.id, '')}
                                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                                      title="Unassign Rider"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <p className="text-xs font-bold text-gray-400 italic">Waiting for Dispatch...</p>
                                )}
                              </div>
                            </div>
                            
                            {!order.deliveryPartnerId && (
                              <div className="flex gap-1 flex-[1.5]">
                                {deliveryAssignmentMode === 'manual' ? (
                                  <div className="w-full relative">
                                    <select 
                                      className="w-full bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase pl-3 pr-8 py-2.5 outline-none appearance-none cursor-pointer focus:border-indigo-500 transition-all font-mono"
                                      onChange={(e) => handleAssignRider(order.id, e.target.value)}
                                      defaultValue=""
                                    >
                                      <option value="" disabled>Select Driver</option>
                                      {deliveryPartners.map(dp => {
                                        if (!dp) return null;
                                        const isBusy = activeOrders.some(ao => ao?.deliveryPartnerId === dp.id);
                                        const canBeAssigned = dp.isOnline && dp.status === 'Approved';
                                        
                                        return (
                                          <option key={dp.id} value={dp.id} disabled={!canBeAssigned}>
                                            {dp.isOnline ? (isBusy ? '🟡 BUSY' : '🟢 READY') : '🔴 AWAY'} | {dp.name}
                                          </option>
                                        );
                                      })}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      if (!autoAssignRider(order.id)) {
                                        setAdminSaveStatus("No online riders available for auto-assignment.");
                                      }
                                    }}
                                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                                  >
                                    <RefreshCcw className="w-3 h-3" />
                                    Dispatch Now
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {activeOrders.length === 0 && (
                        <p className="text-center py-6 text-gray-400 italic text-xs">No active orders at the moment.</p>
                      )}
                    </div>
                  </section>

                  <section className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4">Payout Overview</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Vendors Owed</p>
                        <p className="text-lg font-black text-gray-900">₹{vendors.reduce((acc, v) => acc + v.pendingPayout, 0)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Delivery Owed</p>
                        <p className="text-lg font-black text-gray-900">₹{deliveryPartners.reduce((acc, dp) => acc + dp.pendingPayout, 0)}</p>
                      </div>
                    </div>
                  </section>

                  <section className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">New Requests ({pendingApprovals.length})</h3>
                      <button onClick={() => setAdminView('partners')} className="text-[10px] font-black text-yellow-600 uppercase">View All</button>
                    </div>
                    <div className="space-y-3">
                      {pendingApprovals.slice(0, 5).map((req) => (
                        <div key={req.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-yellow-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                               {req.photo ? (
                                <img src={req.photo} className="w-full h-full object-cover" alt="Req" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-300">
                                   <Camera className="w-4 h-4" />
                                 </div>
                               )}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{req.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {req.type} | {req.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                try {
                                  await deleteDoc(doc(db, 'pendingApprovals', req.id));
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.DELETE, `pendingApprovals/${req.id}`);
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  if (req.type === 'vendor') {
                                    const vendorId = `v-${Date.now()}`;
                                    await setDoc(doc(db, 'vendors', vendorId), {
                                      id: vendorId,
                                      businessName: req.name,
                                      ownerName: req.name,
                                      phone: req.phone,
                                      service: req.details?.service || 'General',
                                      status: 'Approved',
                                      isOnline: false,
                                      revenue: 0,
                                      pendingPayout: 0,
                                      itemsCount: 0,
                                      rating: 5.0,
                                      photo: req.photo || null,
                                      createdAt: serverTimestamp()
                                    });
                                  } else if (req.type === 'delivery') {
                                    const partnerId = `dp-${Date.now()}`;
                                    await setDoc(doc(db, 'deliveryPartners', partnerId), {
                                      id: partnerId,
                                      name: req.name,
                                      phone: req.phone,
                                      vehicleType: req.details?.vehicle || 'Bike',
                                      vehicleNumber: req.details?.vehicleNumber || '',
                                      status: 'Approved',
                                      isOnline: false,
                                      earnings: 0,
                                      pendingPayout: 0,
                                      rating: 5.0,
                                      trips: 0,
                                      photo: req.photo || null,
                                      createdAt: serverTimestamp()
                                    });
                                  }
                                  await deleteDoc(doc(db, 'pendingApprovals', req.id));
                                  setAdminSaveStatus("Partner setup complete!");
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.WRITE, 'vendors');
                                }
                              }}
                              className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {pendingApprovals.length === 0 && <p className="text-[10px] font-bold text-yellow-500 text-center italic">All caught up!</p>}
                    </div>
                  </section>

                  <section className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Marriage Approvals ({pendingMarriageProfilesCount})</h3>
                    <div className="space-y-3">
                      {allMarriageProfiles.filter(p => !p.isApproved).map((p) => (
                        <div key={p.id} className="bg-white p-4 rounded-2xl border border-indigo-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl overflow-hidden">
                               {(p.image || p.img) && <img src={p.image || p.img} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{p.name}</p>
                              <p className="text-[10px] font-bold text-gray-400">{p.profession}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRejectProfile(p.id)}
                              className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black uppercase"
                            >
                              Deny
                            </button>
                            <button 
                              onClick={() => handleApproveProfile(p.id)}
                              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                      {pendingMarriageProfilesCount === 0 && <p className="text-[10px] font-bold text-indigo-400 text-center italic">No pending requests</p>}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Inventory & Store Management</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Edit Categories', icon: ShoppingBag, view: 'inventory' },
                        { label: 'Manage Items', icon: ClipboardList, view: 'inventory' },
                        { label: 'Price Control', icon: TrendingUp, view: 'inventory' },
                        { label: 'Marriage Bureau', icon: HeartHandshake, view: 'marriage' },
                        { label: 'All Vendors', icon: Utensils, view: 'vendors' },
                        { label: 'Delivery Staff', icon: Bike, view: 'deliveryPartners' },
                        { label: 'Waitlist Partners', icon: Briefcase, view: 'partners' },
                        { label: 'System Settings', icon: Settings, view: 'settings' }
                      ].map((item, i) => (
                        <button 
                          key={i} 
                          onClick={() => setAdminView(item.view as any)}
                          className="flex flex-col items-center gap-3 bg-gray-50 p-6 rounded-3xl border border-transparent hover:border-gray-200 active:scale-95 transition-all"
                        >
                          <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-700">
                            <item.icon className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
                    <h3 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-4">Admin Security</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Update Passcode</label>
                        <div className="flex gap-2">
                          <input 
                            type="password"
                            placeholder="New Passcode"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 bg-white p-3 rounded-xl font-bold border-2 border-transparent focus:border-rose-400 outline-none text-sm"
                          />
                          <button 
                            onClick={handlePasswordChange}
                            className="bg-gray-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                      {passwordChangeStatus && (
                        <p className={`text-[10px] font-black uppercase text-center ${passwordChangeStatus.includes('success') ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {passwordChangeStatus}
                        </p>
                      )}
                    </div>
                  </section>
                </>
              )}

              {adminView === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Global Product Catalog</h3>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Active Inventory: {localInventory.length}</p>
                      </div>
                      <button 
                        onClick={handleAddNewItem}
                        className="p-3 bg-yellow-400 rounded-2xl shadow-xl shadow-yellow-100 active:scale-95 transition-all text-gray-900 flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Add Item</span>
                      </button>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search by name or category..."
                        className="w-full bg-gray-50 p-4 pl-12 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pb-12 h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                    {localInventory
                      .filter(i => 
                        i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        i.category.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((prod) => (
                      <div key={prod.id} className="group bg-white p-4 rounded-[2rem] border border-gray-100 flex items-center gap-4 hover:shadow-xl hover:shadow-gray-100 transition-all">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-gray-50 relative">
                          {prod.image && <img src={prod.image} className="w-full h-full object-cover" />}
                          {(prod as any).stock === 0 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="text-[8px] font-black text-white uppercase tracking-tighter">Out</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 text-[7px] font-black uppercase rounded">{prod.category}</span>
                             {(prod as any).stock !== undefined && (
                               <span className={`text-[7px] font-black uppercase ${(prod as any).stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {(prod as any).stock > 0 ? `Stock: ${(prod as any).stock}` : 'No Stock'}
                               </span>
                             )}
                           </div>
                          <p className="text-sm font-black text-gray-900 truncate leading-none mb-2">{prod.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-yellow-600">₹{prod.price}</p>
                            {prod.originalPrice && <p className="text-[9px] font-bold text-gray-300 line-through">₹{prod.originalPrice}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditItem(prod)}
                            className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 active:text-gray-900 transition-colors shadow-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              const isService = (prod as any).bookings !== undefined;
                              const isOutOfStock = (prod as any).stock === 0;
                              
                              if (confirm(isOutOfStock ? "Bring this item back in stock?" : "Mark this item as OUT OF STOCK?")) {
                                setLocalInventory(prev => prev.map(item => {
                                  if (item.id === prod.id) {
                                    return { ...item, stock: isOutOfStock ? 50 : 0 };
                                  }
                                  return item;
                                }));
                              }
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm ${(prod as any).stock === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}
                            title={(prod as any).stock === 0 ? 'Back in Stock' : 'Mark Out of Stock'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(prod.id)}
                            className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 active:bg-rose-500 active:text-white transition-colors shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adminView === 'partners' && (
                <div className="space-y-6">
                  <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input 
                      placeholder="Search Partners by Name, Service or Phone..." 
                      className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2"
                      value={partnerSearchQuery || ''}
                      onChange={(e) => setPartnerSearchQuery(e.target.value)}
                    />
                    {partnerSearchQuery && (
                      <button 
                        onClick={() => setPartnerSearchQuery('')}
                        className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Pending Approvals</h3>
                  <div className="space-y-3">
                    {pendingApprovals.filter(p => !partnerSearchQuery || p.name.toLowerCase().includes(partnerSearchQuery.toLowerCase()) || p.phone.includes(partnerSearchQuery)).length > 0 ? 
                     pendingApprovals
                      .filter(p => !partnerSearchQuery || p.name.toLowerCase().includes(partnerSearchQuery.toLowerCase()) || p.phone.includes(partnerSearchQuery))
                      .map((req) => (
                      <div key={req.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${req.type === 'vendor' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {req.type === 'vendor' ? <Briefcase className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900">{req.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {req.type} | {req.phone}
                              {req.details?.vehicleNumber && ` | ${req.details.vehicleNumber}`}
                            </p>
                            {req.type === 'vendor' && req.details?.service && (
                                <p className="text-[9px] font-black text-blue-500 uppercase mt-0.5">{req.details.service}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedApproval(req)}
                            className="bg-indigo-50 text-indigo-600 p-2 rounded-xl"
                            title="View Details"
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'pendingApprovals', req.id));
                              } catch (e) {
                                handleFirestoreError(e, OperationType.DELETE, 'pendingApprovals');
                              }
                            }}
                            className="bg-rose-50 text-rose-500 p-2 rounded-xl"
                            title="Reject"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                if (req.type === 'vendor') {
                                  const vendorId = `v-${Date.now()}`;
                                  const newVendor: VendorProfile = {
                                    id: vendorId,
                                    userId: req.userId || '',
                                    businessName: req.name || '',
                                    ownerName: req.ownerName || req.details?.ownerName || req.name || '',
                                    phone: req.phone || '',
                                    service: req.details?.service || 'General',
                                    status: 'Approved',
                                    rating: 5.0,
                                    isOnline: false,
                                    revenue: 0,
                                    itemsCount: 0,
                                    pendingPayout: 0,
                                    address: req.details?.businessAddress || '',
                                    location: req.details?.location || null
                                  };
                                  await setDoc(doc(db, 'vendors', vendorId), {
                                    ...newVendor,
                                    createdAt: serverTimestamp()
                                  });
                                  setAdminSaveStatus("Vendor Approved & Account Created!");
                                } else if (req.type === 'delivery') {
                                  const riderId = `dp-${Date.now()}`;
                                  const newRider: DeliveryPartnerProfile = {
                                    id: riderId,
                                    userId: req.userId || '',
                                    name: req.name || '',
                                    phone: req.phone || '',
                                    vehicleType: req.details?.service || req.details?.vehicleType || 'Bike',
                                    vehicleNumber: req.details?.vehicleNumber || '',
                                    status: 'Online',
                                    isOnline: true,
                                    rating: 5.0,
                                    trips: 0,
                                    earnings: 0,
                                    pendingPayout: 0
                                  };
                                  await setDoc(doc(db, 'deliveryPartners', riderId), {
                                    ...newRider,
                                    createdAt: serverTimestamp()
                                  });
                                  setAdminSaveStatus("Rider Approved & Account Created!");
                                }
                                await deleteDoc(doc(db, 'pendingApprovals', req.id));
                              } catch (e) {
                                handleFirestoreError(e, OperationType.WRITE, req.type === 'vendor' ? 'vendors' : 'deliveryPartners');
                              }
                            }}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                        <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">No pending approvals</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 pt-6 border-t border-gray-100">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Briefcase className="w-3 h-3" />
                        Active Vendors ({vendors.length})
                      </h3>
                      <div className="space-y-3">
                        {vendors
                          .filter(v => !partnerSearchQuery || v.businessName.toLowerCase().includes(partnerSearchQuery.toLowerCase()) || v.phone.includes(partnerSearchQuery) || v.service.toLowerCase().includes(partnerSearchQuery.toLowerCase()))
                          .map(v => (
                          <div key={v.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm group hover:border-indigo-100 transition-all">
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-900 leading-none mb-1">{v.businessName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{v.service} | {v.phone}</p>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => handleAdminEditPartner(v, 'vendor')}
                                 className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                 title="Edit Vendor"
                               >
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if(v.status === 'Terminated') {
                                     handleRestorePartner(v.id, 'vendor');
                                   } else {
                                     handleTerminateVendor(v.id, v.businessName);
                                   }
                                 }}
                                 className={`p-2.5 rounded-xl transition-all ${v.status === 'Terminated' ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                                 title={v.status === 'Terminated' ? 'Restore' : 'Terminate'}
                               >
                                 <Power className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if(confirm(`Delete vendor ${v.businessName} permanently?`)) {
                                     setVendors(prev => prev.filter(item => item.id !== v.id));
                                     setAdminSaveStatus(`${v.businessName} deleted.`);
                                   }
                                 }}
                                 className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                 title="Delete Permanently"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Bike className="w-3 h-3" />
                        Active Riders ({deliveryPartners.length})
                      </h3>
                      <div className="space-y-3">
                        {deliveryPartners
                          .filter(dp => !partnerSearchQuery || dp.name.toLowerCase().includes(partnerSearchQuery.toLowerCase()) || dp.phone.includes(partnerSearchQuery) || dp.vehicleType.toLowerCase().includes(partnerSearchQuery.toLowerCase()))
                          .map(dp => (
                          <div key={dp.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm group hover:border-emerald-100 transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-black text-gray-900 leading-none">{dp.name}</p>
                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-lg ${dp.status === 'Banned' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                  {dp.status}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{dp.vehicleType} | {dp.phone}</p>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => handleAdminEditPartner(dp, 'delivery')}
                                 className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                 title="Edit Rider"
                               >
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if(dp.status === 'Banned') {
                                     handleRestorePartner(dp.id, 'delivery');
                                   } else {
                                     handleTerminateDeliveryPartner(dp.id, dp.name);
                                   }
                                 }}
                                 className={`p-2.5 rounded-xl transition-all ${dp.status === 'Banned' ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                                 title={dp.status === 'Banned' ? 'Restore' : 'Ban/Terminate'}
                               >
                                 <Power className="w-3.5 h-3.5" />
                               </button>
                               <button 
                                 onClick={() => {
                                   if(confirm(`Remove rider ${dp.name} permanently?`)) {
                                     setDeliveryPartners(prev => prev.filter(item => item.id !== dp.id));
                                     setAdminSaveStatus(`${dp.name} removed from fleet.`);
                                   }
                                 }}
                                 className="p-2.5 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                 title="Delete Permanently"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminView === 'marriage' && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-xl font-black text-gray-900 italic">Marriage Bureau Profiles</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Profiles: {allMarriageProfiles.length} | Pending: {pendingMarriageProfilesCount}</p>
                  </header>

                  <div className="space-y-3">
                    {allMarriageProfiles.map((p) => (
                      <div key={p.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                             {(p.image || p.img) && <img src={p.image || p.img} className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900">{p.name} {p.surname}</p>
                              {!p.isApproved && <span className="text-[7px] font-black uppercase bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded">Pending Approval</span>}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{p.profession} | {p.religion} | {p.maritalStatus || 'Unmarried'}</p>
                            <div className="mt-1 space-y-0.5">
                              <p className="text-[8px] font-black text-indigo-500 uppercase">Native: {p.nativePlace || 'N/A'}</p>
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Father: {p.fatherName} ({p.fatherProfession})</p>
                              <p className="text-[9px] font-black text-emerald-600 mt-1">{p.phone}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!p.isApproved ? (
                            <>
                              <button 
                                onClick={() => handleRejectProfile(p.id)}
                                className="p-3 bg-rose-50 text-rose-500 rounded-2xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleApproveProfile(p.id)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                              >
                                Approve
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  // Transfer control back to MarriageBureau with edit mode
                                  localStorage.setItem('edit_marriage_profile_id', p.id);
                                  onNavigate('marriageBureau');
                                  setIsAdminOpen(false);
                                }}
                                className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors shadow-sm"
                                title="Edit Profile"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleSuspendProfile(p.id, p.name)}
                                className="p-3 bg-amber-50 text-amber-500 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                                title="Suspend"
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRejectProfile(p.id)}
                                className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm"
                                title="Delete Profile"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {allMarriageProfiles.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                        <HeartHandshake className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">No profiles registered</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminView === 'settings' && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-xl font-black text-gray-900 italic">System Settings</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configure platform behavior</p>
                  </header>

                  <div className="space-y-4">
                    <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-black text-gray-900">Order Dispatch Mode</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">How orders are assigned to riders</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                          <button 
                            onClick={() => setDeliveryAssignmentMode('automatic')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deliveryAssignmentMode === 'automatic' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'}`}
                          >
                            Auto
                          </button>
                          <button 
                            onClick={() => setDeliveryAssignmentMode('manual')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${deliveryAssignmentMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}
                          >
                            Manual
                          </button>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 leading-relaxed italic">
                        * Automatic: Dispatch to nearest online rider instantly.<br/>
                        * Manual: Admin assigns rider from the dashboard after vendor acceptance.
                      </p>
                    </section>

                    <section className="bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100">
                      <p className="text-sm font-black text-rose-900 mb-1">Maintenance Mode</p>
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-4">Temporarily pause new orders</p>
                      <button 
                        onClick={() => {
                          const newMode = !isMaintenanceMode;
                          setIsMaintenanceMode(newMode);
                          setAdminSaveStatus(`Maintenance Mode ${newMode ? 'Enabled' : 'Disabled'}`);
                        }}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 active:scale-95 transition-all ${
                          isMaintenanceMode ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-600 border-rose-100'
                        }`}
                      >
                        {isMaintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                      </button>
                    </section>
                  </div>
                </div>
              )}

              {adminView === 'customers' && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-xl font-black text-gray-900 italic">User Management</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage registered customer accounts</p>
                  </header>

                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex items-center justify-between ${user.status === 'Banned' ? 'opacity-60 bg-rose-50 border-rose-100' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-black text-gray-900">{user.name}</p>
                              {user.status === 'Banned' && <span className="text-[7px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded">Banned</span>}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400">{user.phone} | {user.email}</p>
                            <p className="text-[8px] font-black text-gray-300 uppercase mt-1">Joined: {user.joinDate} | Orders: {user.totalOrders}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAdminEditUser(user)}
                            className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (user.status === 'Banned') {
                                setUsers(prev => prev.map(u => u.id === user.id ? {...u, status: 'Active'} : u));
                                return;
                              }
                              if (confirm(`Ban user ${user.name}? They will lose access to their profile immediately.`)) {
                                setUsers(prev => prev.map(u => u.id === user.id ? {...u, status: 'Banned'} : u));
                              }
                            }}
                            className={`p-3 rounded-2xl transition-all ${user.status === 'Banned' ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500'}`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Delete user ${user.name} permanently? All history will be wiped.`)) {
                                setUsers(prev => prev.filter(u => u.id !== user.id));
                                setAdminSaveStatus("User deleted successfully!");
                              }
                            }}
                            className="p-3 bg-gray-100 text-gray-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                        <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-xs font-black text-gray-400 uppercase">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminView === 'support' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Chat List */}
                  <div className="bg-white border border-gray-100 rounded-[2.5rem] flex flex-col h-[600px] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                       <h3 className="text-xl font-black italic">Rider Chats</h3>
                       <div className="bg-rose-100 text-rose-600 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                         Tickets: {Object.keys(supportChats).length}
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                       {(Object.values(supportChats) as SupportChat[]).sort((a, b) => {
                         const timeA = a.messages.length > 0 ? new Date(`2024-01-01 ${a.lastMessageTimestamp}`).getTime() : 0;
                         const timeB = b.messages.length > 0 ? new Date(`2024-01-01 ${b.lastMessageTimestamp}`).getTime() : 0;
                         return timeB - timeA;
                       }).map(chat => (
                         <button 
                           key={chat.partnerId}
                           onClick={() => {
                             setActiveChatId(chat.partnerId);
                             // Clear unread count when clicking
                             const all = {...supportChats};
                             all[chat.partnerId].unreadCount = 0;
                             setSupportChats(all);
                             localStorage.setItem('lokal_support_chats', JSON.stringify(all));
                           }}
                           className={`w-full p-4 rounded-3xl border flex items-center gap-4 transition-all ${activeChatId === chat.partnerId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-gray-50'}`}
                         >
                           <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black shrink-0">
                             {chat.partnerName.charAt(0)}
                           </div>
                           <div className="flex-1 text-left overflow-hidden">
                             <div className="flex justify-between items-center mb-1">
                               <p className="font-black text-[11px] text-gray-900 truncate">{chat.partnerName}</p>
                               <p className="text-[8px] font-bold text-gray-400 shrink-0">{chat.lastMessageTimestamp}</p>
                             </div>
                             <p className="text-[10px] text-gray-500 font-medium truncate">
                               {chat.messages[chat.messages.length - 1]?.text}
                             </p>
                           </div>
                           {(chat.unreadCount || 0) > 0 && (
                             <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[8px] font-black shrink-0">
                               {chat.unreadCount}
                             </div>
                           )}
                         </button>
                       ))}
                       {Object.keys(supportChats).length === 0 && (
                         <div className="py-20 text-center text-gray-300">
                           <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No active chats</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Chat Window */}
                  <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col h-[600px] overflow-hidden shadow-sm relative">
                    {activeChatId ? (
                      <>
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                            {supportChats[activeChatId].partnerName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900">{supportChats[activeChatId].partnerName}</h4>
                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">Rider Console Connected</p>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                          {supportChats[activeChatId].messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-4 rounded-[2rem] text-[13px] font-bold shadow-sm ${
                                msg.senderType === 'admin' ? 'bg-gray-900 text-white rounded-br-lg shadow-gray-200' : 'bg-gray-100 text-gray-800 rounded-bl-lg'
                              }`}>
                                {msg.text}
                                <p className={`text-[8px] mt-2 opacity-50 uppercase font-black tracking-widest ${msg.senderType === 'admin' ? 'text-right' : ''}`}>
                                  {msg.timestamp}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-6 border-t border-gray-50">
                          <div className="flex gap-4">
                            <input 
                              type="text" 
                              value={adminReply}
                              onChange={(e) => setAdminReply(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAdminReply(activeChatId)}
                              placeholder="Type a reply to rider..."
                              className="flex-1 bg-gray-50 p-4 rounded-3xl outline-none focus:ring-2 ring-indigo-400 transition-all font-black text-sm"
                            />
                            <button 
                              onClick={() => handleAdminReply(activeChatId)}
                              disabled={!adminReply.trim()}
                              className="bg-indigo-600 text-white px-8 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                           <MessageSquare className="w-10 h-10 text-gray-200" />
                        </div>
                        <h4 className="text-xl font-black italic text-gray-300">Select a rider chat to begin</h4>
                        <p className="text-xs font-bold text-gray-400 mt-2">Support requests will appear here live</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminView === 'settlements' && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-xl font-black text-gray-900 italic">Financial Settlements</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Process pending payouts for all partners</p>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white">
                      <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-2">Total Outstanding</p>
                      <p className="text-3xl font-black italic">
                        ₹{vendors.reduce((acc, v) => acc + (v.pendingPayout || 0), 0) + deliveryPartners.reduce((acc, dp) => acc + (dp.pendingPayout || 0), 0)}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        if (confirm("Settle ALL outstanding payouts? This will reset all pending payouts to zero.")) {
                          const total = vendors.reduce((acc, v) => acc + (v.pendingPayout || 0), 0) + deliveryPartners.reduce((acc, dp) => acc + (dp.pendingPayout || 0), 0);
                          const date = new Date().toLocaleString();
                          const newHistoryEntries: any[] = [];
                          
                          vendors.forEach(v => {
                            if ((v.pendingPayout || 0) > 0) {
                              newHistoryEntries.push({
                                id: `pay-${Date.now()}-${v.id}`,
                                partnerName: v.businessName,
                                amount: v.pendingPayout,
                                date,
                                type: 'vendor'
                              });
                            }
                          });
                          
                          deliveryPartners.forEach(dp => {
                            if ((dp.pendingPayout || 0) > 0) {
                              newHistoryEntries.push({
                                id: `pay-${Date.now()}-${dp.id}`,
                                partnerName: dp.name,
                                amount: dp.pendingPayout,
                                date,
                                type: 'delivery'
                              });
                            }
                          });

                          if (newHistoryEntries.length > 0) {
                            setPayoutHistory(prev => [...newHistoryEntries, ...prev]);
                            setVendors(prev => prev.map(v => ({
                              ...v, 
                              totalPaid: (v.totalPaid || 0) + (v.pendingPayout || 0),
                              lastPayoutDate: date,
                              pendingPayout: 0
                            })));
                            setDeliveryPartners(prev => prev.map(dp => ({
                              ...dp, 
                              totalPaid: (dp.totalPaid || 0) + (dp.pendingPayout || 0),
                              lastPayoutDate: date,
                              pendingPayout: 0
                            })));
                            setAdminSaveStatus(`Bulk Settlement Complete: ₹${total} processed.`);
                          }
                        }
                      }}
                      className="bg-emerald-500 p-6 rounded-[2.5rem] text-white text-left active:scale-95 transition-all shadow-lg shadow-emerald-100"
                    >
                      <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] mb-2">Bulk Action</p>
                      <p className="text-lg font-black leading-tight">Settle All Pending ➔</p>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Breakdown</h4>
                    <div className="space-y-2">
                      {[...vendors, ...deliveryPartners].filter(p => (p.pendingPayout || 0) > 0).map((partner: any) => (
                        <div key={partner.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${partner.businessName ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                              {partner.businessName ? <Briefcase className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{partner.businessName || partner.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase">{partner.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm font-black text-emerald-600">₹{partner.pendingPayout}</p>
                            <button 
                              onClick={() => {
                                const date = new Date().toLocaleString();
                                if (partner.businessName) {
                                  setVendors(prev => prev.map(v => v.id === partner.id ? {
                                    ...v, 
                                    totalPaid: (v.totalPaid || 0) + (v.pendingPayout || 0),
                                    lastPayoutDate: date,
                                    pendingPayout: 0
                                  } : v));
                                  setPayoutHistory(prev => [{
                                    id: `pay-${Date.now()}`,
                                    partnerName: partner.businessName,
                                    amount: partner.pendingPayout,
                                    date,
                                    type: 'vendor'
                                  }, ...prev]);
                                } else {
                                  setDeliveryPartners(prev => prev.map(dp => dp.id === partner.id ? {
                                    ...dp, 
                                    totalPaid: (dp.totalPaid || 0) + (dp.pendingPayout || 0),
                                    lastPayoutDate: date,
                                    pendingPayout: 0
                                  } : dp));
                                  setPayoutHistory(prev => [{
                                    id: `pay-${Date.now()}`,
                                    partnerName: partner.name,
                                    amount: partner.pendingPayout,
                                    date,
                                    type: 'delivery'
                                  }, ...prev]);
                                }
                                setAdminSaveStatus(`Settled ₹${partner.pendingPayout} for ${partner.businessName || partner.name}`);
                              }}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {[...vendors, ...deliveryPartners].filter(p => (p.pendingPayout || 0) > 0).length === 0 && (
                        <div className="py-12 text-center text-gray-400 italic text-sm">
                          All payments are currently settled.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rider Remittances */}
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between ml-2">
                       <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Rider Remittance Requests</h4>
                       <div className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-1 rounded-full uppercase">
                         Pending: {deliveryPartners.reduce((acc, dp) => acc + (dp.remittanceRequests?.filter(r => r.status === 'Pending').length || 0), 0)}
                       </div>
                    </div>
                    <div className="space-y-3">
                      {deliveryPartners.filter(dp => (dp.remittanceRequests?.filter(r => r.status === 'Pending').length || 0) > 0).map(dp => (
                        dp.remittanceRequests?.filter(r => r.status === 'Pending').map(req => (
                          <div key={req.id} className="bg-amber-50/50 p-4 rounded-[2rem] border border-amber-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-amber-900 shadow-sm">
                                <Bike className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900 leading-none">{dp.name}</p>
                                <p className="text-[9px] font-bold text-amber-600 uppercase mt-0.5">REQUESTED: ₹{req.amount}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => {
                                   if(confirm(`Reject remittance request from ${dp.name}?`)) {
                                     setDeliveryPartners(prev => prev.map(p => p.id === dp.id ? {
                                       ...p,
                                       remittanceRequests: p.remittanceRequests?.map(r => r.id === req.id ? {...r, status: 'Rejected' as const} : r)
                                     } : p));
                                   }
                                 }}
                                 className="p-3 bg-white text-rose-500 rounded-2xl hover:bg-rose-50 transition-colors shadow-sm"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleApproveRemittance(dp.id, req.id)}
                                 className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100"
                               >
                                 Approve Collection
                               </button>
                            </div>
                          </div>
                        ))
                      ))}
                      {deliveryPartners.reduce((acc, dp) => acc + (dp.remittanceRequests?.filter(r => r.status === 'Pending').length || 0), 0) === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-amber-100 rounded-[2.5rem]">
                          <p className="text-[10px] font-black text-amber-400 uppercase">No pending collections</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {payoutHistory.length > 0 && (
                    <div className="space-y-4 pt-6">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Recent Payout History</h4>
                      <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                        {payoutHistory.slice(0, 10).map(log => (
                          <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.type === 'vendor' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                {log.type === 'vendor' ? <Briefcase className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{log.partnerName}</p>
                                <p className="text-[8px] font-black text-gray-400 uppercase">{log.date}</p>
                              </div>
                            </div>
                            <p className="text-xs font-black text-emerald-600">Settled ₹{log.amount}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {adminView === 'security' && (
                <div className="space-y-6">
                  <header>
                    <h3 className="text-xl font-black text-gray-900 italic">Device Security Management</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Only authorized devices can access the Founder Panel (Max 6)</p>
                  </header>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white">
                      <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-2">Active Sessions</p>
                      <p className="text-3xl font-black italic">{activeAdminSessions.length} / 6</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-2">Maximum 6 unique devices permitted for editing system.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">My Device ID</p>
                      <p className="font-mono text-xs font-bold text-gray-900 truncate">{deviceId}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Current Device</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                      <h4 className="text-xs font-black text-gray-900 uppercase">Registered Devices</h4>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {deviceRegistry.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic text-sm">No devices registered yet.</div>
                      ) : (
                        deviceRegistry.map(device => (
                          <div key={device.id} className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.isBanned ? 'bg-rose-100 text-rose-50' : 'bg-gray-100 text-gray-400'}`}>
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-black text-gray-900 text-sm tracking-tight">{device.name}</p>
                                  {device.id === deviceId && <span className="text-[7px] font-black uppercase bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md">You</span>}
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 font-mono">{device.id}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setDeviceRegistry(prev => prev.map(d => d.id === device.id ? { ...d, isBanned: !d.isBanned } : d));
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${device.isBanned ? 'bg-emerald-500 text-white shadow-lg' : 'bg-rose-50 text-rose-600'}`}
                            >
                              {device.isBanned ? 'Authorize' : 'Ban'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <section className="bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-black text-indigo-900">Platform Security Settings</p>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Enhanced Admin Protection</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl">
                          <span className="text-xs font-bold text-gray-700">Two-Factor Authentication (Simulation)</span>
                          <div className="w-12 h-6 bg-emerald-500 rounded-full relative p-1 cursor-pointer">
                            <div className="absolute right-1 w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl">
                          <span className="text-xs font-bold text-gray-700">Auto Session Timeout</span>
                          <select className="bg-gray-100 border-none rounded-lg text-[10px] font-black p-2 outline-none">
                            <option>15 MIN</option>
                            <option selected>30 MIN</option>
                            <option>1 HOUR</option>
                          </select>
                        </div>
                        <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg shadow-indigo-100">
                          Reset Admin Master Password
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
              {adminView === 'deliveryPartners' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Partners ({deliveryPartners.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {deliveryPartners.map((partner) => {
                      if (!partner) return null;
                      return (
                      <div key={partner.id} className={`p-5 rounded-[2.5rem] border shadow-sm ${partner.status === 'Banned' ? 'bg-rose-50 border-rose-100 opacity-80' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black overflow-hidden ${partner.status === 'Banned' ? 'bg-rose-200 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                              {partner.photo ? (
                                <img src={partner.photo} className="w-full h-full object-cover" alt={partner.name} />
                              ) : (
                                <Bike className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <p className="font-black text-gray-900 leading-tight">{partner.name}</p>
                                  {partner.status === 'Banned' && <span className="text-[7px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded">Terminated</span>}
                               </div>
                              <p className="text-[10px] font-bold text-gray-400">{partner.phone} | {partner.vehicleType}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                            partner.isOnline 
                              ? (activeOrders.some(ao => ao.deliveryPartnerId === partner.id) ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600') 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {partner.isOnline ? (activeOrders.some(ao => ao.deliveryPartnerId === partner.id) ? 'On Trip' : 'Online') : 'Offline'}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-gray-50 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Trips</p>
                            <p className="text-xs font-black text-gray-900">{partner.trips}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Total</p>
                            <p className="text-xs font-black text-gray-900">₹{partner.earnings}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl text-center relative group">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Payout</p>
                            <div className="flex items-center justify-center gap-1">
                              <p className="text-xs font-black text-emerald-600">₹{partner.pendingPayout}</p>
                              <button 
                                onClick={() => {
                                  const val = prompt(`Edit pending payout for ${partner.name}:`, partner.pendingPayout?.toString());
                                  if (val !== null && !isNaN(Number(val))) {
                                    setDeliveryPartners(prev => prev.map(p => p.id === partner.id ? { ...p, pendingPayout: Number(val) } : p));
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-600 transition-opacity"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Rating</p>
                            <p className="text-xs font-black text-gray-900">{partner.rating}⭐</p>
                          </div>
                        </div>
                        {(partner.totalPaid || partner.lastPayoutDate) && (
                          <div className="mb-4 px-4 py-2 bg-emerald-50/50 rounded-2xl flex items-center justify-between border border-emerald-100/50">
                            <p className="text-[9px] font-black text-emerald-700">Total Paid: ₹{partner.totalPaid || 0}</p>
                            <p className="text-[9px] font-bold text-emerald-600">Last: {partner.lastPayoutDate || 'Never'}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                           <button 
                            onClick={() => handleAdminEditPartner(partner, 'delivery')}
                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                            title="Edit Rider"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => {
                              if((partner.pendingPayout || 0) === 0) {
                                alert("No pending payout to settle.");
                                return;
                              }
                              if(confirm(`Settle payout of ₹${partner.pendingPayout} for ${partner.name}?`)) {
                                handleSettlePayout(partner.id, 'delivery');
                              }
                            }}
                            className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase active:bg-emerald-100 transition-colors"
                           >
                            Settle Payout
                           </button>
                           <button 
                            onClick={() => {
                              if(partner.status === 'Banned') {
                                handleRestorePartner(partner.id, 'delivery');
                                return;
                              }
                              handleTerminateDeliveryPartner(partner.id, partner.name);
                            }}
                            className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-colors ${partner.status === 'Banned' ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500'}`}
                           >
                            {partner.status === 'Banned' ? 'Restore' : 'Terminate'}
                           </button>
                           <button 
                            onClick={() => {
                              if(confirm(`Delete rider ${partner.name} permanently?`)) {
                                setDeliveryPartners(prev => prev.filter(dp => dp.id !== partner.id));
                                setAdminSaveStatus(`Rider ${partner.name} deleted.`);
                              }
                            }}
                            className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center active:bg-gray-200 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    );
                    })}
                    {deliveryPartners.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
                        <Bike className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase">No active partners</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {adminView === 'vendors' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Partners & Vendors ({vendors.length})</h3>
                  </div>
                  <div className="space-y-3">
                  {vendors.map((vendor) => {
                      if (!vendor) return null;
                      return (
                      <div key={vendor.id} className={`p-5 rounded-[2.5rem] border shadow-sm ${vendor.status === 'Terminated' ? 'bg-rose-50 border-rose-100 opacity-80' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black overflow-hidden ${vendor.status === 'Terminated' ? 'bg-rose-200 text-rose-600' : 'bg-yellow-400 text-gray-900'}`}>
                              {vendor.photo ? (
                                <img src={vendor.photo} className="w-full h-full object-cover" alt={vendor.businessName} />
                              ) : (
                                <Briefcase className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-gray-900 leading-tight">{vendor.businessName}</p>
                                {vendor.status === 'Terminated' && <span className="text-[7px] font-black uppercase bg-rose-500 text-white px-1.5 py-0.5 rounded">Terminated</span>}
                              </div>
                              <p className="text-[10px] font-bold text-gray-400">{vendor.ownerName} | {vendor.phone}</p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${vendor.isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            {vendor.isOnline ? 'Online' : 'Offline'}
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-gray-50 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Items</p>
                            <p className="text-xs font-black text-gray-900">{vendor.itemsCount}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Revenue</p>
                            <p className="text-xs font-black text-gray-900">₹{vendor.revenue}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl text-center border-emerald-100 border relative group">
                            <p className="text-[7px] font-black text-emerald-600 uppercase mb-0.5">Payout</p>
                            <div className="flex items-center justify-center gap-1">
                              <p className="text-xs font-black text-emerald-600">₹{vendor.pendingPayout}</p>
                              <button 
                                onClick={() => {
                                  const val = prompt(`Edit pending payout for ${vendor.businessName}:`, vendor.pendingPayout?.toString());
                                  if (val !== null && !isNaN(Number(val))) {
                                    setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, pendingPayout: Number(val) } : v));
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-600 transition-opacity"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded-xl text-center">
                            <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5">Rating</p>
                            <p className="text-xs font-black text-gray-900">{vendor.rating}⭐</p>
                          </div>
                        </div>
                        {(vendor.totalPaid || vendor.lastPayoutDate) && (
                          <div className="mb-4 px-4 py-2 bg-emerald-50/50 rounded-2xl flex items-center justify-between border border-emerald-100/50">
                            <p className="text-[9px] font-black text-emerald-700">Total Settled: ₹{vendor.totalPaid || 0}</p>
                            <p className="text-[9px] font-bold text-emerald-600">Last: {vendor.lastPayoutDate || 'Never'}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                           <button 
                            onClick={() => handleAdminEditPartner(vendor, 'vendor')}
                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                            title="Edit Vendor"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => {
                              if((vendor.pendingPayout || 0) === 0) {
                                alert("No pending payout to settle.");
                                return;
                              }
                              if(confirm(`Settle payout of ₹${vendor.pendingPayout} for ${vendor.businessName}?`)) {
                                handleSettlePayout(vendor.id, 'vendor');
                              }
                            }}
                            className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase active:bg-emerald-100 transition-colors"
                           >
                            Settle Payout
                           </button>
                           <button 
                            onClick={() => {
                              if(vendor.status === 'Terminated') {
                                handleRestorePartner(vendor.id, 'vendor');
                                return;
                              }
                              handleTerminateVendor(vendor.id, vendor.businessName);
                            }}
                            className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-colors ${vendor.status === 'Terminated' ? 'bg-emerald-500 text-white' : 'bg-rose-50 text-rose-500'}`}
                           >
                            {vendor.status === 'Terminated' ? 'Restore' : 'Terminate'}
                           </button>
                           <button 
                            onClick={() => {
                              if(confirm(`Delete vendor ${vendor.businessName} and all records permanently?`)) {
                                setVendors(prev => prev.filter(v => v.id !== vendor.id));
                                setAdminSaveStatus(`Vendor ${vendor.businessName} deleted.`);
                              }
                            }}
                            className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center active:bg-gray-200 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] mt-8">
                <p className="text-xs font-black italic mb-2 text-yellow-400">Security Notice</p>
                <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                  Only the Founder has approval rights. All partner actions are logged. 
                  Remember to update prices daily to reflect market trends.
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowItemModal(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-xl"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <h3 className="text-2xl font-black text-gray-900 mb-6">
                {editingItem?.id?.startsWith('new-') ? 'Add New Item' : 'Edit Item'}
              </h3>

              <div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Item Image URL</p>
                  <input 
                    value={editingItem?.image}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Product Name</p>
                  <input 
                    value={editingItem?.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Item Name"
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">M.R.P (₹)</p>
                    <input 
                      type="number"
                      value={editingItem?.originalPrice || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Optional"
                      className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Offer Price (₹)</p>
                    <input 
                      type="number"
                      value={editingItem?.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Stock Qty</p>
                    <input 
                      type="number"
                      value={editingItem?.stock || 0}
                      onChange={(e) => setEditingItem({ ...editingItem, stock: Number(e.target.value) })}
                      className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Unit (kg, g, L..)</p>
                    <select 
                      value={editingItem?.unit || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm appearance-none"
                    >
                      <option value="">No Unit</option>
                      <option value="kg">kilogram (kg)</option>
                      <option value="1/2 kg">1/2 kg</option>
                      <option value="5 kg">5 kg</option>
                      <option value="g">gram (g)</option>
                      <option value="L">Liter (L)</option>
                      <option value="ml">milliliter (ml)</option>
                      <option value="pc">Piece (pc)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Category</p>
                    <select 
                      value={editingItem?.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm appearance-none"
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Description</p>
                  <textarea 
                    value={editingItem?.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Enter item details..."
                    rows={3}
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveItem}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-gray-200"
                >
                  Save Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Edit Modal */}
      <AnimatePresence>
        {showUserModal && editingUser && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowUserModal(false)}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-xl"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <h3 className="text-xl font-black text-gray-900 mb-6 italic">Edit Customer</h3>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Full Name</p>
                  <input 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Phone Number</p>
                  <input 
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Email Address</p>
                  <input 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Status</p>
                  <select 
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full bg-gray-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveUser}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Approval Modal */}
      <AnimatePresence>
        {selectedApproval && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedApproval.type === 'vendor' ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'}`}>
                      {selectedApproval.type === 'vendor' ? <Briefcase className="w-7 h-7" /> : <Bike className="w-7 h-7" />}
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-none">{selectedApproval.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedApproval.type} Registration</p>
                   </div>
                </div>
                <button onClick={() => setSelectedApproval(null)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">Applicant Name</p>
                    <p className="font-bold text-slate-900">{selectedApproval.details?.ownerName || selectedApproval.name}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">Phone Number</p>
                    <p className="font-bold text-slate-900">{selectedApproval.phone}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">Primary Job/Service</p>
                    <p className="font-bold text-slate-900">{selectedApproval.service || selectedApproval.details?.service}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">Email ID</p>
                    <p className="font-bold text-slate-900">{selectedApproval.userEmail || 'N/A'}</p>
                 </div>
              </div>

              {selectedApproval.details?.location && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Business / Hub Location</p>
                  <p className="font-bold text-slate-900">{selectedApproval.details.location.area}, {selectedApproval.details.location.city}</p>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documents & Photos</p>
                <div className="grid grid-cols-2 gap-4">
                  {selectedApproval.details?.photo && (
                    <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                      <img src={selectedApproval.details.photo} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                  {/* Simplified document view - in real app, these are links or full images */}
                  <div className="aspect-square bg-indigo-50 rounded-3xl border-2 border-indigo-100 flex flex-col items-center justify-center text-center p-4">
                     <ShieldCheck className="w-10 h-10 text-indigo-500 mb-2" />
                     <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">KYC Docs Uploaded</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={() => setSelectedApproval(null)}
                   className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase text-[10px] tracking-widest"
                 >
                   Close View
                 </button>
                 <button 
                   onClick={async () => {
                     // Approval logic wrapped
                     try {
                       if (selectedApproval.type === 'vendor') {
                         const vendorId = `v-${Date.now()}`;
                         const newVendor: VendorProfile = {
                           id: vendorId,
                           userId: selectedApproval.userId || '',
                           businessName: selectedApproval.name || '',
                           ownerName: selectedApproval.ownerName || selectedApproval.details?.ownerName || selectedApproval.name || '',
                           phone: selectedApproval.phone || '',
                           service: selectedApproval.details?.service || 'General',
                           status: 'Approved',
                           rating: 5.0,
                           isOnline: false,
                           revenue: 0,
                           itemsCount: 0,
                           pendingPayout: 0,
                           address: selectedApproval.details?.businessAddress || '',
                           location: selectedApproval.details?.location || null
                         };
                         await setDoc(doc(db, 'vendors', vendorId), {
                           ...newVendor,
                           createdAt: serverTimestamp()
                         });
                       } else {
                         const riderId = `dp-${Date.now()}`;
                         const newRider: DeliveryPartnerProfile = {
                           id: riderId,
                           userId: selectedApproval.userId || '',
                           name: selectedApproval.name || '',
                           phone: selectedApproval.phone || '',
                           vehicleType: selectedApproval.details?.service || selectedApproval.details?.vehicleType || 'Bike',
                           vehicleNumber: selectedApproval.details?.vehicleNumber || '',
                           status: 'Online',
                           isOnline: true,
                           rating: 5.0,
                           trips: 0,
                           earnings: 0,
                           pendingPayout: 0
                         };
                         await setDoc(doc(db, 'deliveryPartners', riderId), {
                           ...newRider,
                           createdAt: serverTimestamp()
                         });
                       }
                       await deleteDoc(doc(db, 'pendingApprovals', selectedApproval.id));
                       setAdminSaveStatus("Partner Approved!");
                       setSelectedApproval(null);
                     } catch (e) {
                       handleFirestoreError(e, OperationType.WRITE, 'partners');
                     }
                   }}
                   className="flex-[2] py-5 bg-emerald-500 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-emerald-100"
                 >
                   Confirm Approval
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Partner Application Modal */}
      <AnimatePresence>
        {showPartnerForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ y: 200, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 200, opacity: 0, scale: 0.9 }}
              className="bg-white w-full rounded-[2.5rem] p-8 shadow-2xl relative max-w-lg"
            >
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">Partner Program</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s === formStep ? 'w-4 bg-yellow-400' : 'w-1 bg-gray-100'}`} />
                      ))}
                    </div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Step {formStep + 1} of 6</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowPartnerForm(false);
                    setFormStep(0);
                    setAgreedToTerms(false);
                    setPartnerStatus(null);
                  }} 
                  className="p-3 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {partnerStatus ? (
                <div className="text-center py-12">
                  {/* Status UI remains similar to keep logic consistent */}
                  {partnerStatus === 'pending' ? (
                    <>
                      <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <ShieldCheck className="w-12 h-12 text-emerald-500" />
                      </div>
                      <h4 className="text-3xl font-black text-gray-900 mb-3 italic">Application Pending</h4>
                      <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-[0.2em] px-10">
                        Our team will verify your Details & documents shortly. You will be notified via SMS/App.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Check className="w-12 h-12 text-emerald-500" />
                      </div>
                      <h4 className="text-3xl font-black text-gray-900 mb-3 italic">Welcome Onboard!</h4>
                      <p className="text-gray-400 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-[0.2em] px-10">
                        Your application was approved. You can now access your partner console.
                      </p>
                    </>
                  )}
                  
                  <div className="flex flex-col gap-3">
                    {partnerStatus === 'approved' && (
                      <button 
                        onClick={() => {
                          if (partnerType === 'delivery') localStorage.setItem('isDeliveryPartner', 'true');
                          if (partnerType === 'vendor') localStorage.setItem('isVendor', 'true');
                          setShowPartnerForm(false);
                          onNavigate(partnerType === 'delivery' ? 'delivery' : 'profile');
                        }}
                        className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-yellow-100 text-[10px]"
                      >
                        Enter {partnerType === 'delivery' ? 'Delivery' : 'Vendor'} Console
                      </button>
                    )}
                    <button 
                      onClick={() => setShowPartnerForm(false)}
                      className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px]"
                    >
                      {partnerStatus === 'pending' ? 'Close & Wait' : 'Got it'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {partnerError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider font-mono">{partnerError}</span>
                    </motion.div>
                  )}

                  {/* Step 0: Type Selection */}
                  {formStep === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">Choose your journey on Lokal Bharath</p>
                      <div className="grid grid-cols-1 gap-4">
                        <button 
                          onClick={() => setPartnerType('vendor')}
                          className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all text-left ${partnerType === 'vendor' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${partnerType === 'vendor' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
                            <Briefcase className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg leading-none">Local Vendor</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Maids, Painters, Plumbers, Shops</p>
                          </div>
                          {partnerType === 'vendor' && <div className="ml-auto w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white stroke-[4px]" /></div>}
                        </button>
                        <button 
                          onClick={() => setPartnerType('delivery')}
                          className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all text-left ${partnerType === 'delivery' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${partnerType === 'delivery' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-500'}`}>
                            <Bike className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg leading-none">Delivery Hero</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">Earning Freedom & Daily Payouts</p>
                          </div>
                          {partnerType === 'delivery' && <div className="ml-auto w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white stroke-[4px]" /></div>}
                        </button>
                      </div>
                      <button 
                        onClick={() => setFormStep(1)}
                        className="w-full mt-6 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all shadow-xl shadow-gray-200"
                      >
                        Let's Get Started
                      </button>
                    </motion.div>
                  )}

                  {/* Step 1: Basic Info */}
                  {formStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center text-[10px] font-black">1</div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connect & Identity</p>
                        </div>
                        <input 
                          placeholder={partnerType === 'vendor' ? "Business Name" : "Your Full Name"} 
                          value={partnerData.name}
                          onChange={(e) => setPartnerData({...partnerData, name: e.target.value})}
                          className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                        />
                        <div className="flex gap-2">
                          <input 
                            placeholder="10-Digit Mobile" 
                            type="tel"
                            maxLength={10}
                            value={partnerData.phone}
                            onChange={(e) => setPartnerData({...partnerData, phone: e.target.value.replace(/\D/g, '')})}
                            className="flex-1 bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                          />
                          {!isOtpSent ? (
                            <button 
                              onClick={() => {
                                if(partnerData.phone.length === 10) {
                                  setIsOtpSent(true);
                                  setShowOtpField(true);
                                  setAdminSaveStatus("OTP Sent to " + partnerData.phone);
                                } else {
                                  setPartnerError("Invalid Mobile Number");
                                }
                              }}
                              className="px-6 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                              disabled={partnerData.phone.length < 10}
                            >
                              Verify
                            </button>
                          ) : (
                            <div className="px-6 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center border border-emerald-100">
                               Sent
                            </div>
                          )}
                        </div>
                        {showOtpField && (
                          <input 
                            placeholder="Enter 4-Digit OTP" 
                            maxLength={4}
                            value={partnerData.otp}
                            onChange={(e) => setPartnerData({...partnerData, otp: e.target.value})}
                            className="w-full bg-emerald-50 p-5 rounded-2xl font-black border-2 border-emerald-200 outline-none text-center tracking-[1em] text-lg" 
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={() => setFormStep(0)} className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[9px]">Back</button>
                        <button 
                          onClick={() => {
                            if(!partnerData.name || partnerData.phone.length < 10 || (!isPartnerEditMode && !partnerData.otp)) {
                              setPartnerError("All fields are mandatory");
                              return;
                            }
                            setPartnerError(null);
                            setFormStep(2);
                          }} 
                          className="py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-gray-100"
                        >
                          Next Step
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Specs */}
                  {formStep === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center text-[10px] font-black">2</div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{partnerType === 'vendor' ? 'Professional Details' : 'Vehicle Details'}</p>
                        </div>
                        <input 
                          placeholder={partnerType === 'vendor' ? "Primary Service (e.g. Painting/Grocery)" : "Vehicle Type (e.g. Bike/Scooter)"} 
                          value={partnerData.service}
                          onChange={(e) => setPartnerData({...partnerData, service: e.target.value})}
                          className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                        />
                        {partnerType === 'vendor' ? (
                          <>
                            <input 
                              placeholder="Owner Name" 
                              value={partnerData.ownerName}
                              onChange={(e) => setPartnerData({...partnerData, ownerName: e.target.value})}
                              className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                            />
                            <input 
                              placeholder="GST (Optional)" 
                              value={partnerData.gstNumber}
                              onChange={(e) => setPartnerData({...partnerData, gstNumber: e.target.value.toUpperCase()})}
                              className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                            />
                          </>
                        ) : (
                          <>
                            <input 
                              placeholder="Vehicle Number (e.g. TS 08 EA 1234)" 
                              value={partnerData.vehicleNumber}
                              onChange={(e) => setPartnerData({...partnerData, vehicleNumber: e.target.value.toUpperCase()})}
                              className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                            />
                            <input 
                              placeholder="RC / Chassis Number (Last 5)" 
                              maxLength={5}
                              value={partnerData.chassisNumber}
                              onChange={(e) => setPartnerData({...partnerData, chassisNumber: e.target.value.toUpperCase()})}
                              className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                            />
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={() => setFormStep(1)} className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[9px]">Back</button>
                        <button 
                          onClick={() => {
                            if(!partnerData.service) {
                              setPartnerError("Specifications are required");
                              return;
                            }
                            setPartnerError(null);
                            setFormStep(3);
                          }} 
                          className="py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-gray-100"
                        >
                          Next Step
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Location */}
                  {formStep === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center text-[10px] font-black">3</div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base of Operations</p>
                        </div>
                        
                        <div className="h-44 w-full rounded-[2rem] overflow-hidden border-2 border-gray-100 relative group bg-gray-100">
                          <LiveMap interactive={true} zoom={15} />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <MapPin className="w-8 h-8 text-rose-500 fill-rose-500/20 drop-shadow-xl animate-bounce" />
                          </div>
                          <button 
                            onClick={() => {
                              setAdminSaveStatus("Updating GPS coordinates...");
                              setPartnerData(prev => ({
                                ...prev,
                                location: { ...prev.location, area: 'Detected Location, Khammam', city: 'Khammam' }
                              }));
                            }}
                            className="absolute bottom-4 left-4 right-4 py-3 bg-gray-900/90 backdrop-blur-md text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/20 flex items-center justify-center gap-2 shadow-2xl"
                          >
                            <Target className="w-3.5 h-3.5 text-yellow-400" />
                            Sync Precise Location
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <input 
                            placeholder="Full Address / Landmark" 
                            value={partnerType === 'vendor' ? partnerData.businessAddress : partnerData.location.area}
                            onChange={(e) => {
                              if(partnerType === 'vendor') setPartnerData({...partnerData, businessAddress: e.target.value});
                              else setPartnerData({...partnerData, location: {...partnerData.location, area: e.target.value}});
                            }}
                            className="w-full bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              placeholder="City" 
                              value={partnerData.location.city}
                              onChange={(e) => setPartnerData({...partnerData, location: {...partnerData.location, city: e.target.value}})}
                              className="bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                            />
                            <input 
                              placeholder="Pincode" 
                              maxLength={6}
                              value={partnerData.location.pincode}
                              onChange={(e) => setPartnerData({...partnerData, location: {...partnerData.location, pincode: e.target.value.replace(/\D/g, '')}})}
                              className="bg-gray-50 p-5 rounded-2xl font-bold border-2 border-transparent focus:border-yellow-400 outline-none text-sm transition-all" 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={() => setFormStep(2)} className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[9px]">Back</button>
                        <button 
                          onClick={() => {
                            const addr = partnerType === 'vendor' ? partnerData.businessAddress : partnerData.location.area;
                            if(!addr || !partnerData.location.pincode) {
                              setPartnerError("Valid address & pincode required");
                              return;
                            }
                            setPartnerError(null);
                            setFormStep(4);
                          }} 
                          className="py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-gray-100"
                        >
                          Next Step
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Documents */}
                  {formStep === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-6 h-6 bg-yellow-400 rounded-lg flex items-center justify-center text-[10px] font-black">4</div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Verification</p>
                        </div>

                        <div className="flex items-center gap-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                          <div className="w-16 h-16 bg-white rounded-2xl border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                            {partnerPhoto ? (
                              <img src={partnerPhoto} className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-6 h-6 text-indigo-300" />
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handlePartnerPhotoUpload} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1">Passport Photo</p>
                            <p className="text-[9px] font-bold text-indigo-400 leading-none">Used for ID Card generation</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                           <DocUploadButton 
                             label={partnerType === 'vendor' ? "Trade License / GST Copy" : "Aadhaar Card Copy"} 
                             isUploaded={partnerType === 'vendor' ? partnerData.docs.businessProof : partnerData.docs.aadhaar} 
                             onClick={() => {
                               if(partnerType === 'vendor') setPartnerData({...partnerData, docs: {...partnerData.docs, businessProof: !partnerData.docs.businessProof}});
                               else setPartnerData({...partnerData, docs: {...partnerData.docs, aadhaar: !partnerData.docs.aadhaar}});
                             }} 
                           />
                           {partnerType === 'delivery' && (
                             <>
                               <DocUploadButton 
                                 label="Vehicle RC" 
                                 isUploaded={partnerData.docs.rc} 
                                 onClick={() => setPartnerData({...partnerData, docs: {...partnerData.docs, rc: !partnerData.docs.rc}})} 
                               />
                               <DocUploadButton 
                                 label="Driving License" 
                                 isUploaded={partnerData.docs.dl} 
                                 onClick={() => setPartnerData({...partnerData, docs: {...partnerData.docs, dl: !partnerData.docs.dl}})} 
                               />
                             </>
                           )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={() => setFormStep(3)} className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[9px]">Back</button>
                        <button 
                          onClick={() => {
                            const mainDoc = partnerType === 'vendor' ? partnerData.docs.businessProof : partnerData.docs.aadhaar;
                            if(!partnerPhoto || !mainDoc) {
                              setPartnerError("Please upload all required documents");
                              return;
                            }
                            setPartnerError(null);
                            setFormStep(5);
                          }} 
                          className="py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-gray-100"
                        >
                          Next Step
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Final & Terms */}
                  {formStep === 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800">
                        <h4 className="text-[12px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-6">Master Service Agreement</h4>
                        <div className="space-y-4 max-h-48 overflow-y-auto pr-4 scrollbar-hide text-left">
                          <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0 mt-1.5 shadow-lg shadow-yellow-400/50"></div>
                            <p className="text-[11px] font-bold text-slate-300 leading-normal">Lokal Bharath operates on 100% honesty policy. False identity = Permanent Ban.</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0 mt-1.5 shadow-lg shadow-yellow-400/50"></div>
                            <p className="text-[11px] font-bold text-slate-300 leading-normal">Commission structure is fixed at 15% for all hyperlocal deliveries.</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full shrink-0 mt-1.5 shadow-lg shadow-yellow-400/50"></div>
                            <p className="text-[11px] font-bold text-slate-300 leading-normal">Daily payouts triggered at 11:00 PM for all completed tasks.</p>
                          </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/10">
                          <button 
                            onClick={() => setAgreedToTerms(prev => !prev)}
                            className={`w-full flex items-center gap-4 transition-all ${agreedToTerms ? 'text-yellow-400' : 'text-slate-500'}`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${agreedToTerms ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'border-white/10'}`}>
                              {agreedToTerms && <Check className="w-4 h-4 stroke-[4px]" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">I strictly accept all terms</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setFormStep(4)} className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[9px]">Review</button>
                        <button 
                          onClick={() => {
                            if(!agreedToTerms) {
                              setPartnerError("Agreement acceptance required");
                              return;
                            }
                            setPartnerStatus('submitting');
                            setTimeout(() => {
                              if (isPartnerEditMode && editingPartnerId) {
                                // Update Logic in Firestore
                                const updateData: any = {
                                  updatedAt: serverTimestamp()
                                };
                                
                                if (partnerType === 'vendor') {
                                  updateData.businessName = partnerData.name;
                                  updateData.ownerName = partnerData.ownerName;
                                  updateData.service = partnerData.service;
                                  updateData.phone = partnerData.phone;
                                  updateData.gst = partnerData.gstNumber;
                                  updateData.address = partnerData.businessAddress;
                                  updateData.location = partnerData.location;
                                  
                                  updateDoc(doc(db, 'vendors', editingPartnerId), updateData)
                                    .then(() => {
                                      setAdminSaveStatus("Profile Updated Successfully!");
                                      setPartnerStatus('approved');
                                      setShowPartnerForm(false);
                                    })
                                    .catch(err => handleFirestoreError(err, OperationType.UPDATE, `vendors/${editingPartnerId}`));
                                } else {
                                  updateData.name = partnerData.name;
                                  updateData.phone = partnerData.phone;
                                  updateData.vehicleType = partnerData.service;
                                  updateData.location = partnerData.location;

                                  updateDoc(doc(db, 'deliveryPartners', editingPartnerId), updateData)
                                    .then(() => {
                                      setAdminSaveStatus("Profile Updated Successfully!");
                                      setPartnerStatus('approved');
                                      setShowPartnerForm(false);
                                    })
                                    .catch(err => handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${editingPartnerId}`));
                                }
                              } else {
                                // New Registration Logic
                                const approvalId = `app-${Date.now()}`;
                                const newApproval = {
                                  id: approvalId,
                                  userId: user?.uid,
                                  userEmail: user?.email,
                                  type: partnerType,
                                  name: partnerData.name,
                                  ownerName: partnerData.ownerName,
                                  phone: partnerData.phone,
                                  service: partnerData.service,
                                  details: {
                                    ...partnerData,
                                    photo: partnerPhoto
                                  },
                                  status: 'Pending',
                                  timestamp: new Date().toISOString(),
                                  createdAt: serverTimestamp()
                                };
                                
                                setDoc(doc(db, 'pendingApprovals', approvalId), newApproval)
                                  .then(() => {
                                    setPartnerStatus('pending');
                                  })
                                  .catch(err => {
                                    handleFirestoreError(err, OperationType.CREATE, 'pendingApprovals');
                                  });
                              }
                            }, 2000);
                          }} 
                          className="py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          {isPartnerEditMode ? 'Save Changes' : 'Submit For Approval'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delivery Dashboard Overlay */}
      <AnimatePresence>
        {isDeliveryMode && activeDeliveryProfile && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 bg-white z-[100] flex flex-col"
          >
            <header className="px-6 pt-12 pb-6 bg-blue-600 text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-lg">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-black italic tracking-tighter">Delivery Console</h2>
                   <p className="text-[10px] font-black uppercase text-blue-100 tracking-widest">{activeDeliveryProfile.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPartnerSupportChat(true)}
                className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors mr-2"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsDeliveryMode(false)}
                className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
              {/* Online/Offline Toggle */}
              <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 ${
                activeDeliveryProfile.isOnline 
                  ? 'bg-blue-500 border-blue-400 text-white shadow-xl shadow-blue-200' 
                  : 'bg-white border-gray-100 text-gray-900 border-2'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      activeDeliveryProfile.isOnline ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Power className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg tracking-tight">Availability</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        activeDeliveryProfile.isOnline ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {activeDeliveryProfile.isOnline ? 'Active & Ready for Trips' : 'Offline / On Break'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newOnline = !activeDeliveryProfile.isOnline;
                      setActiveDeliveryProfile({...activeDeliveryProfile, isOnline: newOnline, status: newOnline ? 'Online' : 'Offline'});
                      setDeliveryPartners(prev => prev.map(dp => dp.id === activeDeliveryProfile.id ? {...dp, isOnline: newOnline, status: newOnline ? 'Online' : 'Offline'} : dp));
                    }}
                    className={`w-16 h-8 rounded-full relative transition-colors duration-300 ${
                      activeDeliveryProfile.isOnline ? 'bg-white/40' : 'bg-gray-200'
                    }`}
                  >
                    <motion.div 
                      animate={{ x: activeDeliveryProfile.isOnline ? 32 : 4 }}
                      className="w-6 h-6 rounded-full bg-white absolute top-1 shadow-sm"
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Trips</p>
                  <p className="text-xl font-black text-gray-900 italic">{activeDeliveryProfile.trips}</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Ratings</p>
                  <p className="text-xl font-black text-gray-900 italic">{activeDeliveryProfile.rating}⭐</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm text-center border-t-emerald-400 border-t-4">
                  <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Earnings</p>
                  <p className="text-xl font-black text-emerald-600 italic">₹{activeDeliveryProfile.earnings}</p>
                </div>
              </div>

              {/* Cash Management (Remit) */}
              <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-900 shadow-lg">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-900 uppercase">Cash with You</h4>
                      <p className="text-[10px] font-bold text-amber-700 tracking-tighter">COD Collections</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-amber-900 italic">₹{activeDeliveryProfile.cashInHand || 0}</p>
                </div>
                
                <button 
                  onClick={() => {
                    const amount = activeDeliveryProfile.cashInHand || 0;
                    if (amount <= 0) {
                      alert("You have no cash to remit.");
                      return;
                    }
                    if (confirm(`Request to remit ₹${amount} to admin?`)) {
                      handleRequestRemittance(activeDeliveryProfile.id, amount);
                      alert("Remittance request sent. Please hand over the cash at the nearest hub.");
                    }
                  }}
                  disabled={!activeDeliveryProfile.cashInHand}
                  className="w-full py-4 bg-amber-400 text-amber-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-200 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Remit Cash to Hub
                </button>
                
                {activeDeliveryProfile.remittanceRequests && activeDeliveryProfile.remittanceRequests.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-amber-200 space-y-2">
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest text-center">Recent Remittances</p>
                    {activeDeliveryProfile.remittanceRequests.slice(0, 2).map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-white/50 p-3 rounded-xl border border-amber-100">
                        <div>
                          <p className="text-[10px] font-black text-amber-900">₹{req.amount}</p>
                          <p className="text-[8px] font-bold text-amber-500">{req.date}</p>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${
                          req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 
                          req.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Navigation Terminal */}
              {activeDeliveryProfile.isOnline && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest tracking-tighter italic">Live Navigation Terminal</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-100 rounded-full border border-rose-200">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Active Tripline</span>
                    </div>
                  </div>
                  
                  <div className="h-96 w-full rounded-[3rem] overflow-hidden shadow-xl border-4 border-white relative">
                    <LiveMap 
                      riderLoc={[17.2505, 80.1450]} 
                      vendorLoc={[17.2473, 80.1514]} 
                      customerLoc={[17.2550, 80.1600]} 
                      interactive={true}
                      zoom={16}
                    />
                    
                    <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl border border-white/50 shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                            <Navigation className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Next Stop</p>
                            <p className="text-xs font-black text-gray-900 truncate">H.No 4-12, Green City</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-[1000]">
                      <button className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all ring-4 ring-white/10 hover:bg-black pointer-events-auto">
                        Mark Delivered (OTP)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Trips</h3>
                  <span className="text-[10px] font-black text-blue-600 uppercase">View All</span>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'T1', date: 'Today, 2:30 PM', from: 'Sri Sai Groceries', to: 'H.No 4-55, Main Road', fare: 45 },
                    { id: 'T2', date: 'Today, 11:15 AM', from: 'Rajesh Grocery', to: 'Plot 102, Hitech Lane', fare: 60 }
                  ].map(trip => (
                    <div key={trip.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-900 leading-tight mb-1">{trip.from} ➔ {trip.to}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">{trip.date}</p>
                      </div>
                      <p className="text-xs font-black text-emerald-600">+₹{trip.fare}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                     <TrendingUp className="w-6 h-6" />
                   </div>
                   <h3 className="font-black text-lg">Weekly Goal</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                      <span>42 / 50 Trips Completed</span>
                      <span>84%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 w-[84%]"></div>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-indigo-100 leading-relaxed italic">
                    Complete 8 more trips this week to unlock a bonus of ₹500!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100">
               <div className="bg-blue-50 p-4 rounded-3xl flex gap-3 border border-blue-100">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <p className="text-[10px] font-bold text-blue-800 leading-relaxed italic">
                    Safety First: Always wear your helmet and follow traffic rules. 
                    Contact Founder for any support.
                  </p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[160] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm bg-gray-50 h-full shadow-2xl flex flex-col"
            >
              <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-black text-gray-900 italic tracking-tighter leading-none">Notifications</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Updates & Announcements</p>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-3 bg-gray-100 rounded-2xl text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, read: true} : n));
                      }}
                      className={`p-5 rounded-[2rem] border bg-white shadow-sm transition-all relative overflow-hidden group ${notif.read ? 'border-transparent opacity-80' : 'border-indigo-100'}`}
                    >
                      {!notif.read && (
                        <div className="absolute top-0 right-0 p-2">
                           <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm shadow-indigo-100" />
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-colors ${notif.read ? 'bg-gray-50 text-gray-400' : 'bg-indigo-50 text-indigo-600'}`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm font-black italic mb-1 ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h4>
                          <p className="text-[11px] font-medium text-gray-500 leading-relaxed">{notif.message}</p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase italic mt-3">
                            {new Date(notif.timestamp).toLocaleDateString()} at {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                      <BellOff className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No new notifications</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                  <button 
                    onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-[100] border-b border-gray-50/50">
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => (isAdmin || isAdminLoggedIn) ? setIsAdminOpen(true) : setShowAdminLogin(true)}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all ${isAdmin ? 'bg-yellow-400' : 'bg-gray-900 shadow-gray-200'}`}
          >
            <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-gray-900' : 'text-yellow-400'}`} />
          </motion.button>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 cursor-pointer p-1" 
            onClick={handleLogoClick}
          >
            <img src="/src/assets/images/lokal_bharath_logo_1777014931353.png" className="w-full h-full object-contain" alt="Logo" />
          </motion.div>
          <div 
            className="flex flex-col cursor-pointer"
            onClick={() => onNavigate('location')}
          >
            <motion.div 
              whileTap={{ x: 2 }}
              className="flex items-center gap-1 text-yellow-600"
            >
              <MapPin className="w-3.5 h-3.5 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t.deliverTo}</span>
              <ChevronDown className="w-3 h-3" />
            </motion.div>
            <span className="font-extrabold text-gray-900 truncate max-w-[140px] text-xs font-display tracking-tight leading-none mt-0.5">{location}</span>
            {isMaintenanceMode && (
              <div className="flex items-center gap-1 mt-1 bg-rose-50 px-2 py-0.5 rounded-full w-fit">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">Maintenance ON</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
            onClick={() => setShowNotifications(true)}
          >
            <div className="bg-gray-50 p-3 rounded-2xl relative border border-gray-100 cursor-pointer">
              <Bell className="w-5 h-5 text-gray-700" />
              {notifications.some(n => !n.read) && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full shadow-sm"
                ></motion.div>
              )}
            </div>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('profile')} 
            className="bg-gray-50 p-3 rounded-2xl active:scale-95 transition-all border border-gray-100"
          >
            <User className="w-5 h-5 text-gray-700" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-32 font-sans">
        {/* 1. Top Banners - VISUAL ENTRY POINT */}
        {!searchQuery && (
          <div className="relative h-44 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100 mt-6 group">
            <AnimatePresence mode="wait">
              {topBanners.map((banner, i) => i === activeTopBanner && (
                <motion.div
                  key={banner.id}
                  onClick={() => handleBannerClick(banner)}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    const swipeThreshold = 50;
                    if (info.offset.x > swipeThreshold) {
                      setActiveTopBanner(prev => (prev - 1 + topBanners.length) % topBanners.length);
                    } else if (info.offset.x < -swipeThreshold) {
                      setActiveTopBanner(prev => (prev + 1) % topBanners.length);
                    }
                  }}
                  className={`absolute inset-0 ${banner.color} p-6 flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-all touch-pan-y`}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {banner.img && (
                    <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${banner.img})` }}></div>
                  )}
                  <div className="relative z-10 flex-1">
                    <h3 className="text-xl font-black text-white mb-0.5 leading-tight">{banner.title}</h3>
                    <p className="text-white/90 font-bold text-xs uppercase tracking-wider">{banner.sub}</p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerClick(banner);
                      }}
                      className="mt-3 bg-white text-gray-900 px-5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest w-max active:scale-95 transition-all shadow-lg"
                    >
                      {(banner as any).cta || 'Shop Now'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Manual navigation arrows */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveTopBanner(prev => (prev - 1 + topBanners.length) % topBanners.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveTopBanner(prev => (prev + 1) % topBanners.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {topBanners.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${activeTopBanner === i ? 'w-5 bg-white' : 'w-1 bg-white/40'}`}></div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Search Bar - INTEGRATED DISCOVERY */}
        <div className="relative z-[90]">
          <form onSubmit={handleSearchSubmit}>
            <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${isFocused ? 'text-yellow-600 scale-110' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={t.searchPlaceholder}
              className={`w-full bg-gray-50/50 py-5 pl-14 pr-24 rounded-[2rem] font-bold outline-none border-2 transition-all shadow-sm ${
                isFocused 
                  ? 'border-yellow-400 bg-white shadow-2xl shadow-yellow-100 -translate-y-0.5' 
                  : 'border-transparent'
              } placeholder:text-gray-300 placeholder:font-black placeholder:uppercase placeholder:text-[10px] placeholder:tracking-[0.2em]`}
            />
          </form>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                id="clear-search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleVoiceSearch}
              className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-100 text-rose-500 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              id="voice-search-trigger"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
              >
                {searchQuery ? (
                  <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto scrollbar-hide">
                    {filteredCategories.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Recommended Categories</p>
                        <div className="flex flex-wrap gap-2">
                          {filteredCategories.slice(0, 4).map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                onCategoryClick(cat);
                                saveRecentSearch(searchQuery);
                                setIsFocused(false);
                              }}
                              className="px-4 py-2 bg-gray-50 hover:bg-yellow-50 rounded-xl text-xs font-bold text-gray-700 hover:text-yellow-700 transition-colors flex items-center gap-2"
                            >
                              <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredProducts.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Top Results</p>
                        <div className="space-y-1">
                          {filteredProducts.slice(0, 5).map(prod => (
                            <button
                              key={prod.id}
                              onClick={() => {
                                onProductClick(prod);
                                saveRecentSearch(searchQuery);
                                setIsFocused(false);
                              }}
                              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-2xl transition-colors text-left group"
                            >
                              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                {prod.image && <img src={prod.image} className="w-full h-full object-cover" alt={prod.name} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-gray-900 group-hover:text-yellow-600 transition-colors truncate">{prod.name}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">In {prod.category}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-gray-900">₹{prod.price}</p>
                                {prod.unit && <p className="text-[8px] font-bold text-gray-400 uppercase">Per {prod.unit}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredCategories.length === 0 && filteredProducts.length === 0 && (
                      <div className="py-8 text-center bg-gray-50 rounded-2xl">
                        <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching results</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Recent Searches</h3>
                          <button 
                            onClick={() => {
                              setRecentSearches([]);
                              localStorage.removeItem('recentSearches');
                            }}
                            className="text-[10px] font-bold text-gray-400 hover:text-rose-500 uppercase transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-2">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => setSearchQuery(term)}
                              className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                            >
                              <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                                <Search className="w-3 h-3 text-gray-400" />
                              </div>
                              <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900">{term}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">{t.trendingSearches}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => setSearchQuery(term)}
                            className="px-4 py-2 bg-gray-50 hover:bg-yellow-100 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors border border-transparent hover:border-yellow-200"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 italic">Lokal Intelligent Search</p>
                  <button 
                    onClick={() => setIsFocused(false)}
                    className="text-[10px] font-black text-gray-900 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isFocused && (
            <div 
              className="fixed inset-0 bg-black/5 z-[-1] backdrop-blur-[2px]" 
              onClick={() => setIsFocused(false)}
            />
          )}
        </div>

        {/* 3. Categories Grid - PRIMARY NAVIGATION */}
        {!searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Explore Categories</h3>
              <button className="text-yellow-600 font-bold text-xs">View All</button>
            </div>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-4 gap-y-8 gap-x-4"
            >
              {CATEGORIES.map((cat) => {
                const Icon = IconMap[cat.icon] || ShoppingBag;
                const depthColors: Record<string, string> = {
                  'bg-pink-100': 'bg-pink-400',
                  'bg-blue-100': 'bg-blue-400',
                  'bg-blue-50': 'bg-blue-300',
                  'bg-emerald-100': 'bg-emerald-400',
                  'bg-emerald-50': 'bg-emerald-300',
                  'bg-rose-100': 'bg-rose-400',
                  'bg-yellow-100': 'bg-yellow-400',
                  'bg-purple-100': 'bg-purple-400',
                  'bg-orange-100': 'bg-orange-400',
                  'bg-cyan-100': 'bg-cyan-400',
                  'bg-indigo-100': 'bg-indigo-400',
                  'bg-green-100': 'bg-green-400',
                  'bg-amber-100': 'bg-amber-400',
                  'bg-gray-100': 'bg-gray-400',
                };
                const depthColor = depthColors[cat.color] || 'bg-gray-400';

                return (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    key={cat.id}
                    onClick={() => onCategoryClick(cat)}
                    className="flex flex-col items-center gap-3 group relative perspective-500 cursor-pointer"
                  >
                    <div className="relative transform-gpu transition-all duration-300 group-hover:rotate-x-12 group-hover:rotate-y-[-12deg]">
                      <div className={`absolute inset-0 translate-y-2 translate-x-1 rounded-[2rem] transition-transform group-active:translate-y-1 group-active:translate-x-0.5 ${depthColor} opacity-30 blur-[2px]`} />
                      <div className={`absolute inset-0 translate-y-1 rounded-[2rem] ${depthColor} shadow-inner opacity-60`} />
                      <div className={`relative w-16 h-16 ${cat.color} rounded-[2rem] flex items-center justify-center 
                        shadow-md transition-all duration-200 
                        group-active:translate-y-1 
                        group-hover:-translate-y-1
                        border-t-2 border-l border-white/80
                        bg-gradient-to-br from-white/40 via-transparent to-black/5`}
                      >
                        <div className="relative group-hover:scale-110 transition-transform duration-300">
                           <Icon className="w-8 h-8 text-gray-800 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-center leading-tight uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors px-1 h-6 flex items-center">
                      {cat.name.split(' & ')[0]}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        )}

        {searchQuery ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {filteredCategories.length > 0 && (
              <section>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Categories Found</h3>
                <div className="grid grid-cols-4 gap-y-6 gap-x-4">
                  {filteredCategories.map((cat) => {
                    const Icon = IconMap[cat.icon] || ShoppingBag;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => onCategoryClick(cat)}
                        className="flex flex-col items-center gap-2 group active:scale-90 transition-transform cursor-pointer"
                      >
                        <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center`}>
                          <Icon className="w-7 h-7 text-gray-800" />
                        </div>
                        <span className="text-[10px] font-black text-center leading-tight uppercase tracking-wide text-gray-500 line-clamp-1">
                          {cat.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {filteredProducts.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Products & Services</h3>
                  <SearchFilters />
                </div>
                <div className="space-y-4">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => onProductClick(prod)}
                      className="w-full bg-white p-4 rounded-3xl border border-gray-100 flex gap-4 text-left active:scale-[0.98] transition-all"
                    >
                      {prod.image && <img src={prod.image} className="w-20 h-20 rounded-2xl object-cover" alt={prod.name} />}
                      <div className="flex-1">
                        <p className="font-extrabold text-gray-900 mb-1">{prod.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{prod.description}</p>
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-black text-yellow-600">₹{prod.price}</p>
                           {prod.unit && <span className="text-[10px] font-bold text-gray-400 uppercase truncate">/ {prod.unit}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : filteredCategories.length === 0 && (
              <div className="py-20 text-center">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="font-bold text-gray-400">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* 1. Deals of the Day - URGENCY & VALUE */}
            <section className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-gray-900 fill-gray-900" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">Deals of the Day</h3>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-10">Ending in <span className="text-gray-900 tabular-nums">{formatTime(timeLeft)}</span></p>
                </div>
                <button className="text-[10px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-4 py-2 rounded-xl active:scale-95 transition-all">View All</button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-48 space-y-3 p-2 bg-gray-50 rounded-[2rem] border border-transparent hover:border-yellow-200 transition-all">
                    <div className="relative aspect-square rounded-[1.5rem] bg-white overflow-hidden shadow-sm">
                      <img 
                        src={`https://images.unsplash.com/photo-${i === 1 ? '1542838132-92c53300491e' : i === 2 ? '1533900298318-6b8da08a523e' : '1550989460-0adf9ea622e2'}?w=300&h=300&fit=crop`}
                        className="w-full h-full object-cover"
                        alt="Product"
                      />
                      <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">
                        50% OFF
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      <h4 className="text-xs font-black text-gray-900 truncate mb-1">Premium {i === 1 ? 'Grocery' : i === 2 ? 'Vegetables' : 'Fruits'} Bag</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-gray-900">₹{i * 199}</span>
                          <span className="text-[10px] font-bold text-gray-400 line-through">₹{i * 399}</span>
                        </div>
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Lokal Originals - BRAND PRIDE & QUALITY */}
            <section className="px-2">
              <div className="bg-emerald-900 rounded-[3rem] p-8 relative overflow-hidden group shadow-xl mb-6">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80')] opacity-20 bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-900/40 to-transparent"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl">
                      <Flower className="w-5 h-5 text-emerald-300" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">Lokal Signature Collection</span>
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2 leading-none">Direct from the Farm</h3>
                  <p className="text-[10px] font-bold text-emerald-100/60 uppercase tracking-widest leading-relaxed mb-6">
                    Hand-churned oils, wild forest honey,<br />and traditional crafts.
                  </p>
                  <button 
                    onClick={() => onCategoryClick(CATEGORIES.find(c => c.id === 'handicrafts')!)}
                    className="px-6 py-3.5 bg-emerald-400 text-emerald-950 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-400/20"
                  >
                    {t.seeAll}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Recommended Originals</h3>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                {localInventory.filter(p => p.category === 'handicrafts').map(prod => (
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    key={prod.id}
                    onClick={() => onProductClick(prod)}
                    className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden text-left flex flex-col group min-w-[200px] cursor-pointer"
                  >
                    <div className="h-44 relative">
                      {prod.image && <img src={prod.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={prod.name} />}
                      <div className="absolute top-4 right-4 h-8 w-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-emerald-600">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg">
                        <p className="text-[8px] font-black uppercase tracking-widest italic">100% Pure</p>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-[8px] font-black text-white/70 uppercase tracking-widest mb-1">Local Product</p>
                        <h4 className="text-sm font-black italic tracking-tight">{prod.name}</h4>
                      </div>
                    </div>
                    <div className="p-5 bg-white flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-lg font-black text-gray-900 italic">₹{prod.price}</span>
                           {(prod as any).unit && <span className="text-[8px] font-black text-gray-300 uppercase leading-none">per {(prod as any).unit}</span>}
                        </div>
                        <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700 active:bg-emerald-200 transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 3. Bottom Promo Banners - CROSS-PROMOTION */}
            <div className="relative h-44 rounded-[2.5rem] overflow-hidden shadow-xl shadow-gray-100 mt-4 group">
              <AnimatePresence mode="wait">
                {bottomBanners.map((banner, i) => i === activeBottomBanner && (
                  <motion.div
                    key={banner.id}
                    onClick={() => handleBannerClick(banner)}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      const swipeThreshold = 50;
                      if (info.offset.x > swipeThreshold) {
                        setActiveBottomBanner(prev => (prev - 1 + bottomBanners.length) % bottomBanners.length);
                      } else if (info.offset.x < -swipeThreshold) {
                        setActiveBottomBanner(prev => (prev + 1) % bottomBanners.length);
                      }
                    }}
                    className={`absolute inset-0 ${banner.color} p-6 flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-all touch-pan-y`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    {banner.img && (
                      <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${banner.img})` }}></div>
                    )}
                    <div className="relative z-10 flex-1">
                      <h3 className="text-xl font-black text-white mb-0.5 leading-tight">{banner.title}</h3>
                      <p className="text-white/90 font-bold text-xs uppercase tracking-wider">{banner.sub}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBannerClick(banner);
                        }}
                        className="mt-3 bg-white text-gray-900 px-5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest w-max active:scale-95 transition-all shadow-lg"
                      >
                        {(banner as any).cta || 'Shop Now'}
                      </button>
                    </div>
                    <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white fill-white" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBottomBanner(prev => (prev - 1 + bottomBanners.length) % bottomBanners.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBottomBanner(prev => (prev + 1) % bottomBanners.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
              >
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {bottomBanners.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${activeBottomBanner === i ? 'w-5 bg-white' : 'w-1 bg-white/40'}`}></div>
                ))}
              </div>
            </div>

            {/* 4. Popular Around You - SOCIAL PROOF */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h3 className="text-lg font-black text-gray-900">Popular Around You</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {localInventory.filter(p => p.category !== 'meat' && p.category !== 'food' && p.category !== 'handicrafts').slice(0, 6).map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => onProductClick(prod)}
                    className="flex-shrink-0 w-40 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-95 text-left"
                  >
                    {prod.image && <img src={prod.image} className="w-full h-32 object-cover" alt={prod.name} />}
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-gray-400">4.8</span>
                      </div>
                      <p className="font-extrabold text-sm text-gray-900 truncate mb-1">{prod.name}</p>
                      <div className="flex items-center gap-2">
                         <p className="text-yellow-600 font-black">₹{prod.price}</p>
                         {(prod as any).unit && <span className="text-[8px] font-bold text-gray-400 uppercase">/ {(prod as any).unit}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 5. Trending Services - UTILITY & NEEDS */}
            <section>
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-xl font-black text-gray-900">Trending Services</h3>
                <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-1">See All</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {localInventory.filter(i => ['maids', 'mechanics', 'construction', 'care', 'jobs'].includes(i.category)).slice(0, 2).map((service) => (
                  <div
                    key={service.id}
                    onClick={() => onProductClick(service)}
                    className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100 shadow-sm p-4 flex gap-4 text-left active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0">
                      {service.image && <img src={service.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={service.name} />}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex items-center gap-0.5 bg-yellow-400 px-1.5 py-0.5 rounded-md">
                          <Star className="w-2 h-2 text-gray-900 fill-gray-900" />
                          <span className="text-[8px] font-black text-gray-900">{(service as any).rating || '4.5'}</span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{(service as any).bookings || '1.2k'}+ Bookings</span>
                      </div>
                      <h4 className="text-sm font-black text-gray-900 mb-1">{service.name}</h4>
                      <p className="text-[10px] font-medium text-gray-500 mb-2 line-clamp-1">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-gray-900">Starting at ₹{service.price}</p>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. Lokal Select Promo - RETENTION & MEMBERSHIP */}
            <section className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl shadow-gray-200"></div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400 rotate-45 translate-x-24 -translate-y-24 group-hover:scale-110 transition-transform duration-700 opacity-20"></div>
              
              <div className="relative p-8 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white mb-1">Lokal Select</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                    Get Free Delivery & Extra<br />15% OFF on every order!
                  </p>
                </div>
                <button className="px-6 py-4 bg-yellow-400 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-yellow-400/20">
                  Join Now
                </button>
              </div>
            </section>

            {/* 7. Rate Last Order Card - ENGAGEMENT */}
            {showRateCard && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-400 p-6 rounded-[2.5rem] shadow-xl shadow-yellow-101 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="text-[10px] font-black text-gray-900/60 uppercase tracking-widest mb-1">Delivered Yesterday</p>
                  <h3 className="text-sm font-black text-gray-900 mb-2">How was your order from Fresh Mart?</h3>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setShowRateCard(false)}>
                        <Star className="w-6 h-6 text-white fill-white hover:text-gray-900 hover:fill-gray-900 transition-colors" />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowRateCard(false)} className="text-[8px] font-black text-gray-900 uppercase tracking-widest bg-white/30 px-3 py-1 rounded-lg">Skip</button>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                  <ShoppingBag className="w-10 h-10 text-gray-900" />
                </div>
              </motion.div>
            )}

            {/* 8. Join Our Mission - ECOSYSTEM GROWTH */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-gray-900">Join Our Mission</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setPartnerType('vendor');
                    setAgreedToTerms(false);
                    setShowPartnerForm(true);
                  }}
                  className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 text-left relative overflow-hidden group active:scale-95 transition-all"
                >
                  <div className="relative z-10">
                    <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-4">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-black text-indigo-900 mb-1">Local Vendor</h4>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Register Store</p>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 blur-3xl rounded-full -mr-12 -mt-12"></div>
                </button>

                <button 
                  onClick={() => {
                    setPartnerType('delivery');
                    setAgreedToTerms(false);
                    setShowPartnerForm(true);
                  }}
                  className="bg-orange-50 border border-orange-100 rounded-[2rem] p-6 text-left relative overflow-hidden group active:scale-95 transition-all"
                >
                  <div className="relative z-10">
                    <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm mb-4">
                      <Bike className="w-5 h-5 text-orange-600" />
                    </div>
                    <h4 className="text-sm font-black text-orange-900 mb-1">Delivery Partner</h4>
                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">Join Fleet</p>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 blur-3xl rounded-full -mr-12 -mt-12"></div>
                </button>
              </div>
            </section>

            {/* 9. Be Your Own Boss Banner - GROWTH DETAIL */}
            <section className="px-2">
              <div className="bg-indigo-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full -mr-16 -mt-16 blur-3xl opacity-30"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                    <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">Partner Opportunity</span>
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter mb-2 leading-none">Be your own boss.</h3>
                  <p className="text-[10px] font-medium text-indigo-100/70 uppercase tracking-widest leading-relaxed mb-8">
                    Flexible hours. Great earnings.<br />Deliver happiness in Khammam.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => {
                        const partners = JSON.parse(localStorage.getItem('deliveryPartners') || '[]');
                        if (isAdmin || partners.length > 0) {
                          onNavigate('delivery');
                        } else {
                          setPartnerType('delivery');
                          setAgreedToTerms(false);
                          setShowPartnerForm(true);
                        }
                      }}
                      className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl hover:bg-yellow-400 hover:text-gray-900"
                    >
                      {(isAdmin || deliveryPartners.length > 0) ? 'Delivery Console' : 'Start Your Journey'}
                    </button>
                    {(isAdmin || vendors.length > 0) && (
                      <button 
                        onClick={() => {
                          if (isAdmin || vendors.length > 0) {
                             onNavigate('profile');
                             localStorage.setItem('openVendorDashboard', 'true');
                          }
                        }}
                        className="px-8 py-4 bg-indigo-500/40 backdrop-blur-md text-white border border-white/30 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Vendor Dashboard
                      </button>
                    )}
                  </div>
                </div>
                <Bike className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
              </div>
            </section>

            {/* 10. Local Bharath Mission Statement - TRUST & VALUES */}
            <section className="mt-6 mb-12">
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-400 rounded-xl">
                      <ShieldCheck className="w-5 h-5 text-gray-900" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-500">About Local Bharath</h3>
                  </div>
                  <h2 className="text-xl font-black mb-4 leading-tight italic tracking-tight">Pure, Healthy & 100% Honest Services</h2>
                  <p className="text-gray-300 text-xs font-bold leading-relaxed mb-6">
                    Serving you like family. From <span className="text-white">Construction & Paints</span> to <span className="text-white">AC repairs & Bore Motor mechanics</span>, we deliver professional work without cheating. Our mission is your health through pure food, on-time delivery, and trustworthy maid services.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                       <div className="p-1 bg-emerald-500/20 rounded-lg">
                        <Check className="w-3 h-3 text-emerald-400" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-400">Zero Cheating</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-1 bg-emerald-500/20 rounded-lg">
                        <Check className="w-3 h-3 text-emerald-400" />
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-400">Family-Like Care</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between z-20">
        <button onClick={() => onNavigate('home')} className="flex flex-col items-center gap-1 text-yellow-600">
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Home</span>
        </button>
        <button onClick={() => onNavigate('wishlist')} className="flex flex-col items-center gap-1 text-gray-300 relative">
          <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'text-pink-500 fill-pink-500' : ''}`} />
          <span className="text-[10px] font-black uppercase">Wishlist</span>
          {wishlistCount > 0 && (
            <div className="absolute top-0 right-1 bg-pink-500 w-2 h-2 rounded-full border-2 border-white"></div>
          )}
        </button>
        <button onClick={() => onNavigate('cart')} className="relative -top-8 flex items-center justify-center">
          <div className="bg-yellow-400 w-16 h-16 rounded-3xl shadow-xl shadow-yellow-200 flex items-center justify-center active:scale-90 transition-transform">
            <ShoppingCart className="w-7 h-7 text-gray-900" />
            {cartCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">
                {cartCount}
              </div>
            )}
          </div>
        </button>
        <button onClick={() => onNavigate('orders')} className="flex flex-col items-center gap-1 text-gray-300 active:scale-95 transition-transform">
          <ClipboardList className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Orders</span>
        </button>
        <button onClick={() => onNavigate('profile')} className="flex flex-col items-center gap-1 text-gray-300 active:scale-95 transition-transform">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Me</span>
        </button>
      </nav>
    </div>
  );
}
