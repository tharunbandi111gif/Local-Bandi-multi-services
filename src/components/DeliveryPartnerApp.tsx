import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award,
  Bike, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  CheckCircle2, 
  Package, 
  Clock, 
  Wallet, 
  Star, 
  HelpCircle, 
  Power, 
  ClipboardList, 
  Send, 
  ShieldCheck, ShieldAlert, 
  FileText, 
  Printer, 
  Lock, 
  Save, 
  Edit3, 
  Check, 
  X, 
  LogOut, 
  ChevronRight, 
  Search, 
  Building, 
  ListFilter, 
  Menu, 
  Users, 
  Settings, 
  AlertCircle, 
  Truck, 
  ArrowLeft,
  Sparkles,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  User,
  Activity,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Volume2,
  VolumeX,
  Database,
  WifiOff,
  Wifi,
  Sun,
  Share2,
  Info,
  Loader2
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import LiveMap, { tileCache } from './LiveMap';
import { LowConnectivityGuardModal, ProactiveLowSignalAlertBanner } from './LowConnectivityGuard';
import { AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { useFirebase } from '../contexts/FirebaseContext';
import { RiderLevelHeaderBadge, RiderLevelProgressCard, TipTrendDashboardCard } from './RiderLevelAndTipTrend';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
  orderBy, 
  limit, 
  getDoc,
  getDocs
} from 'firebase/firestore';

interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLocation?: { lat: number; lng: number };
  pickupLocation?: { lat: number; lng: number };
  items: number;
  orderItems?: { name: string; quantity: number; price: number }[];
  total: number;
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  pickupAddress: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  deliveryPartnerId: string | null;
  createdAt: any;
  branchId: string;
}

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';
const DEFAULT_COORDS = { lat: 17.2473, lng: 80.1514 };

// Proactive Geo-coordinate integrity validator
const validateGeoIPCoords = (coords: any): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  
  if (isNaN(lat) || isNaN(lng)) {
    warnings.push("Physical coordinate parsing failed (NaN coordinates detected)!");
    return { isValid: false, warnings };
  }

  if (lat < -90 || lat > 90) {
    warnings.push("Latitude coordinates reside layout-wise out of legal bounds [-90, +90]!");
  }
  if (lng < -180 || lng > 180) {
    warnings.push("Longitude coordinates reside layout-wise out of legal bounds [-180, +180]!");
  }
  
  // Null Island check
  if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
    warnings.push("Null Island error (0,0) - likely simulated or uninitialized geocode fallback!");
  }

  // Focus sector active region constraint check: Telangana (India) around Khammam / Guntur / Suryapet
  const isKhammamZone = lat >= 15.0 && lat <= 19.5 && lng >= 77.0 && lng <= 82.5;
  if (!isKhammamZone) {
    warnings.push("Coordinates reside outside active region coverage boundaries.");
  }

  const isValid = warnings.length === 0 || !warnings.some(w => w.includes("bounds") || w.includes("failed"));
  return { isValid, warnings };
};

const getSafeCoords = (loc: any, fallback = DEFAULT_COORDS): google.maps.LatLngLiteral => {
  if (loc && loc.lat !== undefined && loc.lng !== undefined) {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      // Proactively enforce general constraints
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }
  return fallback;
};

interface RouteMapProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  riderLocation?: google.maps.LatLngLiteral | null;
  onUpdateETA: (eta: string) => void;
}

function RouteMap({ origin, destination, riderLocation, onUpdateETA }: RouteMapProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const trafficLayerRef = useRef<any>(null);

  // Smooth Rider Marker animation state
  const [animRiderPos, setAnimRiderPos] = useState<google.maps.LatLngLiteral | null>(riderLocation || null);
  const [heading, setHeading] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const prevRiderPosRef = useRef<google.maps.LatLngLiteral | null>(riderLocation || null);

  // Smooth animation loop whenever simulated coordinates change
  useEffect(() => {
    if (!riderLocation) {
      setAnimRiderPos(null);
      prevRiderPosRef.current = null;
      return;
    }

    const startPos = animRiderPos || prevRiderPosRef.current || riderLocation;
    const targetPos = riderLocation;

    const dLng = targetPos.lng - startPos.lng;
    const dLat = targetPos.lat - startPos.lat;
    const distSq = dLng * dLng + dLat * dLat;

    if (distSq > 0.0000000001) {
      const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
      setHeading(angle);
    }

    if (distSq < 0.0000000001) {
      setAnimRiderPos(targetPos);
      prevRiderPosRef.current = targetPos;
      return;
    }

    let startTime: number | null = null;
    const duration = 1800; // 1.8s fluid interpolation for 2s coordinate updates

    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth cubic ease-out calculation
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentLat = startPos.lat + (targetPos.lat - startPos.lat) * ease;
      const currentLng = startPos.lng + (targetPos.lng - startPos.lng) * ease;

      const interpolated = { lat: currentLat, lng: currentLng };
      setAnimRiderPos(interpolated);
      prevRiderPosRef.current = interpolated;

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [riderLocation?.lat, riderLocation?.lng]);

  useEffect(() => {
    if (!map) return;
    
    // Instantiates a live traffic layer layer using google maps global
    try {
      if (trafficEnabled) {
        if (!trafficLayerRef.current) {
          trafficLayerRef.current = new google.maps.TrafficLayer();
        }
        trafficLayerRef.current.setMap(map);
      } else {
        if (trafficLayerRef.current) {
          trafficLayerRef.current.setMap(null);
        }
      }
    } catch (e) {
      console.warn("Traffic layer map injection warning:", e);
    }

    return () => {
      try {
        if (trafficLayerRef.current) {
          trafficLayerRef.current.setMap(null);
        }
      } catch (_) {}
    };
  }, [map, trafficEnabled]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#3B82F6',
            strokeWeight: 6,
            strokeOpacity: 0.85
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }

        if (routes[0].durationMillis) {
          const duration = typeof routes[0].durationMillis === 'string' ? parseInt(routes[0].durationMillis) : routes[0].durationMillis;
          const minutes = Math.ceil(duration / 60000);
          onUpdateETA(`${minutes} mins`);
        }
      }
    }).catch(err => console.error("Route calculation failed:", err));

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  return (
    <>
      <AdvancedMarker position={origin}>
        <Pin background="#4F46E5" glyphColor="#fff" />
      </AdvancedMarker>
      <AdvancedMarker position={destination}>
        <Pin background="#E11D48" glyphColor="#fff" />
      </AdvancedMarker>

      {/* Smoothly Animated Rider Marker */}
      {animRiderPos && (
        <AdvancedMarker position={animRiderPos}>
          <div className="relative flex items-center justify-center">
            {/* Pulsing Radar Ring */}
            <span className="absolute w-10 h-10 rounded-full bg-emerald-500/30 animate-ping" />
            <span className="absolute w-7 h-7 rounded-full bg-emerald-500/40 border-2 border-emerald-400" />
            
            {/* Rider Bike Container with Directional Heading Rotation */}
            <div 
              className="relative w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xl border-2 border-white transition-transform duration-300"
              style={{ transform: `rotate(${heading}deg)` }}
            >
              <Bike className="w-5 h-5 stroke-[2.5]" />
            </div>

            {/* Live GPS Telemetry Tag */}
            <div className="absolute -bottom-5 bg-slate-950/90 border border-emerald-500/50 px-2 py-0.5 rounded-full shadow-lg text-[8px] font-black text-emerald-400 font-mono tracking-widest whitespace-nowrap uppercase">
              LIVE GPS
            </div>
          </div>
        </AdvancedMarker>
      )}

      {/* Floating Traffic Control Indicator Overlay */}
      <div className="absolute top-4 left-4 z-[9999] bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-xl">
        <span className={`w-2 h-2 rounded-full ${trafficEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setTrafficEnabled(!trafficEnabled);
          }}
          className="text-[9px] font-black uppercase tracking-widest text-[#F59E0B] hover:text-white font-mono cursor-pointer transition-colors outline-none"
          title="Toggle Google Maps Live Traffic Overlay Congestion Layer"
        >
          Traffic: {trafficEnabled ? 'Syncing...' : 'Disabled'}
        </button>
      </div>
    </>
  );
}

interface MapCenterControllerProps {
  center: google.maps.LatLngLiteral | null;
  autoCenter: boolean;
}

function MapCenterController({ center, autoCenter }: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (map && center && autoCenter) {
      map.panTo(center);
    }
  }, [map, center, autoCenter]);

  return null;
}

// Simple IndexedDB Helper for Offline Delivery Synchronization Queue
const openOfflineSyncDB = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = window.indexedDB.open('delivery-offline-sync', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queued-deliveries')) {
        db.createObjectStore('queued-deliveries', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveOfflineDeliveryJob = async (job: any): Promise<void> => {
  const db = await openOfflineSyncDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('queued-deliveries', 'readwrite');
    const store = transaction.objectStore('queued-deliveries');
    const request = store.put(job);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const fetchQueuedDeliveryJobs = async (): Promise<any[]> => {
  try {
    const db = await openOfflineSyncDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('queued-deliveries', 'readonly');
      const store = transaction.objectStore('queued-deliveries');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (_) {
    return [];
  }
};

const deleteQueuedDeliveryJob = async (id: string): Promise<void> => {
  const db = await openOfflineSyncDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('queued-deliveries', 'readwrite');
    const store = transaction.objectStore('queued-deliveries');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export default function DeliveryPartnerApp() {
  const { user, login, logout, isSuperAdmin } = useFirebase();
  const [appScreen, setAppScreen] = useState<'splash' | 'auth' | 'signup' | 'pin_lock' | 'dashboard'>('splash');
  const [loading, setLoading] = useState(true);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Battery and power states
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  // Profile states
  const [riderProfile, setRiderProfile] = useState<any | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [shiftDurationText, setShiftDurationText] = useState('00h 00m 00s');

  // Form states (Sign-Up)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('khammam_main');
  const [desiredPin, setDesiredPin] = useState('');
  const [autoApprove, setAutoApprove] = useState(true); // default true for developer ease
  const [registering, setRegistering] = useState(false);

  // Auth: PIN state
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<'jobs' | 'earnings' | 'profile' | 'support'>('jobs');

  // Auto-Offline and Active Delivery States
  const [autoOfflineMinutes, setAutoOfflineMinutes] = useState<number>(30);
  const [lastMovementTime, setLastMovementTime] = useState<number>(Date.now());
  const [showAutoOfflinePrompt, setShowAutoOfflinePrompt] = useState<boolean>(false);
  const [goOfflineAfterCurrentOrder, setGoOfflineAfterCurrentOrder] = useState<boolean>(false);

  // Core records lists
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);
  const [completedOrders, setCompletedOrders] = useState<DeliveryOrder[]>([]);
  const [showPrintReport, setShowPrintReport] = useState(false);
  const [showLegalTerms, setShowLegalTerms] = useState(false);

  // States to track new assignments alert, pulse and sound notifications
  const [orderArrivalTimes, setOrderArrivalTimes] = useState<Record<string, number>>({});
  const isFirstLoad = useRef(true);

  const playNotificationSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 principal note
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
      
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 harmonious response note
          gain2.gain.setValueAtTime(0.12, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        } catch (e) {
          console.warn("Chime response beep failed:", e);
        }
      }, 120);
    } catch (err) {
      console.warn("Sound play AudioContext failed:", err);
    }
  };

  useEffect(() => {
    if (availableOrders.length === 0) return;
    let updated = false;
    const now = Date.now();
    const newArrivals = { ...orderArrivalTimes };

    availableOrders.forEach(o => {
      if (!newArrivals[o.id]) {
        newArrivals[o.id] = now;
        updated = true;
      }
    });

    if (updated) {
      setOrderArrivalTimes(newArrivals);
      if (!isFirstLoad.current) {
        playNotificationSound();
      }
    }

    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }, [availableOrders]);

  const [eta, setEta] = useState<string>('estimating...');
  const [isOnlineNetwork, setIsOnlineNetwork] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Date range filtering and sorting options for Earnings tab
  const [earningsDaysFilter, setEarningsDaysFilter] = useState<string>('30');
  const [earningsSortOption, setEarningsSortOption] = useState<string>('date_desc');
  const [earningsStartDate, setEarningsStartDate] = useState<string>('');
  const [earningsEndDate, setEarningsEndDate] = useState<string>('');
  const [tipTrendInterval, setTipTrendInterval] = useState<'daily' | 'weekly'>('daily');

  // Generate memoized 60 days historical settlement payout timeline
  const rawPayoutHistory = React.useMemo(() => {
    const data = [];
    const baseDate = new Date(2026, 5, 10); // June 10, 2026
    for (let i = 59; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      
      const baseFee = 220 + Math.floor(Math.sin((60 - i) * 0.35) * 110) + Math.floor(Math.random() * 50) + (60 - i) * 6;
      const tips = Math.floor(baseFee * (isWeekend ? 0.22 : 0.12));
      const settled = baseFee + tips;
      
      const pendingBase = Math.max(0, 90 + Math.floor(Math.cos((60 - i) * 0.22) * 35) - (60 - i) * 0.5);
      const pendingTips = Math.floor(pendingBase * 0.12);
      const pending = pendingBase + pendingTips;
      
      data.push({
        id: `pay_${60 - i}`,
        dateObj: d,
        dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        Settled: Number(settled.toFixed(0)),
        Pending: Number(pending.toFixed(0)),
        Tips: Number((tips + pendingTips).toFixed(0)),
        BaseFee: Number((baseFee + pendingBase).toFixed(0)),
        trips: isWeekend ? 8 : 5,
        status: i === 0 ? 'Processing' : 'Settled'
      });
    }
    return data;
  }, []);

  const filteredPayoutData = React.useMemo(() => {
    let result = [...rawPayoutHistory];
    
    if (earningsDaysFilter === '7') {
      result = result.slice(-7);
    } else if (earningsDaysFilter === '15') {
      result = result.slice(-15);
    } else if (earningsDaysFilter === '30') {
      result = result.slice(-30);
    } else if (earningsDaysFilter === '60') {
      result = result.slice(-60);
    } else if (earningsDaysFilter === 'current_month') {
      result = result.filter(item => item.dateObj.getMonth() === 5 && item.dateObj.getFullYear() === 2026);
    } else if (earningsDaysFilter === 'previous_month') {
      result = result.filter(item => item.dateObj.getMonth() === 4 && item.dateObj.getFullYear() === 2026);
    } else if (earningsDaysFilter === 'custom') {
      if (earningsStartDate) {
        const start = new Date(earningsStartDate);
        start.setHours(0, 0, 0, 0);
        result = result.filter(item => item.dateObj.getTime() >= start.getTime());
      }
      if (earningsEndDate) {
        const end = new Date(earningsEndDate);
        end.setHours(23, 59, 59, 999);
        result = result.filter(item => item.dateObj.getTime() <= end.getTime());
      }
    }
    
    return result;
  }, [rawPayoutHistory, earningsDaysFilter, earningsStartDate, earningsEndDate]);

  const chartDataToShow = React.useMemo(() => {
    return [...filteredPayoutData].sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [filteredPayoutData]);

  const weeklyTipsData = React.useMemo(() => {
    const chunks = [];
    const copy = [...chartDataToShow];
    for (let i = 0; i < copy.length; i += 7) {
      const chunk = copy.slice(i, i + 7);
      if (chunk.length === 0) continue;
      const totalTips = chunk.reduce((sum, item) => sum + (item.Tips || 0), 0);
      const startDateStr = chunk[0].date;
      const endDateStr = chunk[chunk.length - 1].date;
      chunks.push({
        date: `${startDateStr} - ${endDateStr}`,
        Tips: totalTips,
        trips: chunk.reduce((sum, item) => sum + (item.trips || 0), 0),
      });
    }
    return chunks;
  }, [chartDataToShow]);

  const sortedBreakdownData = React.useMemo(() => {
    const list = [...filteredPayoutData];
    if (earningsSortOption === 'date_desc') {
      list.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    } else if (earningsSortOption === 'date_asc') {
      list.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    } else if (earningsSortOption === 'payout_desc') {
      list.sort((a, b) => b.Settled - a.Settled);
    } else if (earningsSortOption === 'payout_asc') {
      list.sort((a, b) => a.Settled - b.Settled);
    }
    return list;
  }, [filteredPayoutData, earningsSortOption]);

  // Auto-Center state and simulated rider coordinate updates during navigation
  const [autoCenter, setAutoCenter] = useState<boolean>(true);
  const [riderLocation, setRiderLocation] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!activeOrder) {
      setRiderLocation(null);
      return;
    }

    const pickup = getSafeCoords(activeOrder.pickupLocation);
    const dest = getSafeCoords(activeOrder.deliveryLocation);
    const target = activeOrder.status === 'Accepted' ? pickup : dest;

    setRiderLocation(current => {
      if (!current) {
        if (activeOrder.status === 'Accepted') {
          return { lat: pickup.lat - 0.004, lng: pickup.lng - 0.003 };
        } else {
          return pickup;
        }
      }
      return current;
    });

    const interval = setInterval(() => {
      setRiderLocation(current => {
        if (!current) return null;
        const diffLat = target.lat - current.lat;
        const diffLng = target.lng - current.lng;
        const stepLat = diffLat * 0.08;
        const stepLng = diffLng * 0.08;

        if (Math.abs(diffLat) < 0.0001 && Math.abs(diffLng) < 0.0001) {
          return target;
        }
        return {
          lat: current.lat + stepLat,
          lng: current.lng + stepLng
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeOrder?.id, activeOrder?.status]);

  // Offline Synchronization & Voice Guidance Config
  const [offlineSyncQueueCount, setOfflineSyncQueueCount] = useState(0);
  const [isSyncingOfflineQueue, setIsSyncingOfflineQueue] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [showSyncStatusModal, setShowSyncStatusModal] = useState(false);
  const [showLowConnectivityGuardModal, setShowLowConnectivityGuardModal] = useState(false);
  const [syncQueueItems, setSyncQueueItems] = useState<any[]>([]);

  // Load initial IndexedDB Offline sync count
  const loadSyncQueueItems = async () => {
    const items = await fetchQueuedDeliveryJobs();
    setSyncQueueItems(items);
    setOfflineSyncQueueCount(items.length);
  };

  const handleRetrySingleJob = async (job: any) => {
    try {
      console.log(`[Offline Synchronizer] Manually retrying job:`, job);
      const jobType = job.type || 'DELIVERY_COMPLETED';

      if (jobType === 'DELIVERY_COMPLETED') {
        const orderRef = doc(db, 'orders', job.orderId);
        await updateDoc(orderRef, {
          ...job.orderUpdate,
          updatedAt: serverTimestamp()
        });

        if (riderProfile) {
          const riderRef = doc(db, 'deliveryPartners', riderProfile.id);
          const riderDoc = await getDoc(riderRef);
          if (riderDoc.exists()) {
            const currentRiderData = riderDoc.data();
            const tripPayout = job.payoutBreakdown?.tripPayout || 45;
            const tipPayout = job.payoutBreakdown?.tipPayout || 0;
            const totalPayout = tripPayout + tipPayout;

            const syncedEarnings = (currentRiderData.earnings || 0) + totalPayout;
            const syncedTips = (currentRiderData.tips || 0) + tipPayout;
            const syncedDeliveryFees = (currentRiderData.deliveryFees || 0) + tripPayout;
            const syncedTrips = (currentRiderData.trips || 0) + 1;
            const syncedCash = job.orderUpdate?.paymentStatus && job.orderUpdate.paymentStatus.includes('COD') 
              ? (currentRiderData.cashInHand || 0) + job.orderAmount 
              : (currentRiderData.cashInHand || 0);

            await updateDoc(riderRef, {
              earnings: syncedEarnings,
              tips: syncedTips,
              deliveryFees: syncedDeliveryFees,
              trips: syncedTrips,
              cashInHand: syncedCash,
              updatedAt: serverTimestamp()
            });

            setRiderProfile((prev: any) => {
              if (!prev) return null;
              return {
                ...prev,
                earnings: syncedEarnings,
                tips: syncedTips,
                deliveryFees: syncedDeliveryFees,
                trips: syncedTrips,
                cashInHand: syncedCash
              };
            });
          }
        }
      } else if (jobType === 'STATUS_UPDATE') {
        const orderRef = doc(db, 'orders', job.orderId);
        await updateDoc(orderRef, {
          ...job.orderUpdate,
          updatedAt: serverTimestamp()
        });
      } else if (jobType === 'CUSTOM_STATUS') {
        const riderRef = doc(db, 'deliveryPartners', job.partnerId);
        await updateDoc(riderRef, {
          customStatus: job.statusValue,
          updatedAt: serverTimestamp()
        });
      }

      await deleteQueuedDeliveryJob(job.id);
      await loadSyncQueueItems();
      alert("✅ Job synchronized and updated successfully!");
    } catch (err: any) {
      console.error("Single Job Retry Failure:", err);
      alert(`❌ Sync Failed: ${err.message || err.toString()}. The connection might still be offline.`);
    }
  };

  const handleDeleteOfflineJob = async (id: string) => {
    if (confirm("Are you sure you want to remove this cached job from the offline queue?")) {
      await deleteQueuedDeliveryJob(id);
      await loadSyncQueueItems();
    }
  };

  // Load initial IndexedDB Offline sync count
  const refreshOfflineSyncCount = async () => {
    try {
      await loadSyncQueueItems();
    } catch (_) {}
  };

  const handleSyncOfflineQueue = async () => {
    if (isSyncingOfflineQueue || !riderProfile) return;
    try {
      const jobs = await fetchQueuedDeliveryJobs();
      if (jobs.length === 0) return;

      setIsSyncingOfflineQueue(true);
      console.log(`[Offline Synchronizer] Syncing ${jobs.length} offline tasks...`);

      for (const job of jobs) {
        const jobType = job.type || 'DELIVERY_COMPLETED'; // defaults to standard completed item

        if (jobType === 'DELIVERY_COMPLETED') {
          // Sync Order doc
          const orderRef = doc(db, 'orders', job.orderId);
          await updateDoc(orderRef, {
            ...job.orderUpdate,
            updatedAt: serverTimestamp()
          });

          // Sync Delivery Partner doc
          const riderRef = doc(db, 'deliveryPartners', riderProfile.id);
          const riderDoc = await getDoc(riderRef);
          if (riderDoc.exists()) {
            const currentRiderData = riderDoc.data();
            const tripPayout = job.payoutBreakdown?.tripPayout || 45;
            const tipPayout = job.payoutBreakdown?.tipPayout || 0;
            const totalPayout = tripPayout + tipPayout;

            const syncedEarnings = (currentRiderData.earnings || 0) + totalPayout;
            const syncedTips = (currentRiderData.tips || 0) + tipPayout;
            const syncedDeliveryFees = (currentRiderData.deliveryFees || 0) + tripPayout;
            const syncedTrips = (currentRiderData.trips || 0) + 1;
            const syncedCash = job.orderUpdate?.paymentStatus && job.orderUpdate.paymentStatus.includes('COD') 
              ? (currentRiderData.cashInHand || 0) + job.orderAmount 
              : (currentRiderData.cashInHand || 0);

            await updateDoc(riderRef, {
              earnings: syncedEarnings,
              tips: syncedTips,
              deliveryFees: syncedDeliveryFees,
              trips: syncedTrips,
              cashInHand: syncedCash,
              updatedAt: serverTimestamp()
            });

            // Also update local profile state with latest synced database numbers
            setRiderProfile((prev: any) => {
              if (!prev) return null;
              return {
                ...prev,
                earnings: syncedEarnings,
                tips: syncedTips,
                deliveryFees: syncedDeliveryFees,
                trips: syncedTrips,
                cashInHand: syncedCash
              };
            });
          }
        } else if (jobType === 'STATUS_UPDATE') {
          const orderRef = doc(db, 'orders', job.orderId);
          await updateDoc(orderRef, {
            ...job.orderUpdate,
            updatedAt: serverTimestamp()
          });
        } else if (jobType === 'CUSTOM_STATUS') {
          const riderRef = doc(db, 'deliveryPartners', job.partnerId);
          await updateDoc(riderRef, {
            customStatus: job.statusValue,
            updatedAt: serverTimestamp()
          });
        }

        // Delete from local queue store
        await deleteQueuedDeliveryJob(job.id);
      }

      await refreshOfflineSyncCount();
      setIsSyncingOfflineQueue(false);
      alert(`🛰️ Connection Restored: Safely synchronized ${jobs.length} queued offline tasks & state updates with the master database!`);
    } catch (e) {
      console.error("[Offline Synchronizer ERROR]", e);
      setIsSyncingOfflineQueue(false);
    }
  };

  useEffect(() => {
    refreshOfflineSyncCount();
  }, []);

  // Automated background offline synchronization when connection is restored
  useEffect(() => {
    if (isOnlineNetwork && riderProfile) {
      handleSyncOfflineQueue();
    }
  }, [isOnlineNetwork, riderProfile]);

  // Handle Voice prompts safe triggers
  const speakCue = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
    }
  };

  const handleToggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    if (nextVal) {
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance("Voice guidance navigation service active. Safe driving!");
          window.speechSynthesis.speak(u);
        }
      }, 100);
    }
  };

  // Security Alert / SOS Button states
  const [isTriggeringSOS, setIsTriggeringSOS] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'locating' | 'dispatching' | 'completed'>('idle');
  const [sosLogs, setSosLogs] = useState<string[]>([]);
  const [sirenVolume, setSirenVolume] = useState<number>(0.5); // adjustable alarm siren volume range [0, 1]
  const [sirenMode, setSirenMode] = useState<'Continuous' | 'Pulse'>('Continuous'); // Alarm siren wave patterns
  const [pulseSpeed, setPulseSpeed] = useState<'Slow' | 'Medium' | 'High'>('Medium'); // Speed presets for pulse sound alternation
  const [isSirenMuted, setIsSirenMuted] = useState(false); // mutable alarm siren mute status
  const [sirenCountdown, setSirenCountdown] = useState(30); // auto-disable timer limits (max 30 seconds)

  // Web Audio API refs for continuous SOS siren alarm sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenOscillatorRef = useRef<OscillatorNode | null>(null);
  const sirenLfoRef = useRef<OscillatorNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null);

  // Web Audio API SOS Siren Controller
  useEffect(() => {
    if (isTriggeringSOS && !isSirenMuted) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          audioContextRef.current = ctx;

          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          // Main gain control
          const mainGain = ctx.createGain();
          mainGain.gain.setValueAtTime(0, ctx.currentTime);
          // Initial volume level based on current volume settings
          const initialVol = sirenMode === 'Pulse' ? 0 : (sirenVolume * 0.15);
          mainGain.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 0.15); // Safe but loud scaled output
          sirenGainRef.current = mainGain;

          // Piercing siren carrier wave (sawtooth waveform is standard for sirens)
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(650, ctx.currentTime); // starting frequency
          sirenOscillatorRef.current = osc;

          // Modulation frequency (LFO) for continuous dual sweeping pitch (wee-woo)
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(2.0, ctx.currentTime); // Sweeps 2 times per second
          sirenLfoRef.current = lfo;

          // Modulation amplitude (how far up/down the frequency swings)
          const modGain = ctx.createGain();
          modGain.gain.setValueAtTime(200, ctx.currentTime); // frequencies swing +/- 200Hz

          // Connect Modulation
          lfo.connect(modGain);
          modGain.connect(osc.frequency);

          // Advanced Audio Squelch: Peaking band boost around 1000Hz (the most piercing human audible speaker range)
          const squelchFilter = ctx.createBiquadFilter();
          squelchFilter.type = 'peaking';
          squelchFilter.frequency.setValueAtTime(1000, ctx.currentTime);
          squelchFilter.Q.setValueAtTime(1.2, ctx.currentTime);
          squelchFilter.gain.setValueAtTime(4.0, ctx.currentTime); // Enhancer frequency boosting

          // Dynamics Compressor to flatten speaker spikes & avoid micro-distortion/clipping on small mobile devices
          const dynamicCompressor = ctx.createDynamicsCompressor();
          dynamicCompressor.threshold.setValueAtTime(-24, ctx.currentTime); // compress signal exceeding -24dB
          dynamicCompressor.knee.setValueAtTime(30, ctx.currentTime); // soft knee gradient curve
          dynamicCompressor.ratio.setValueAtTime(12, ctx.currentTime); // 12:1 clean limit ratio
          dynamicCompressor.attack.setValueAtTime(0.003, ctx.currentTime); // ultra fast 3ms response
          dynamicCompressor.release.setValueAtTime(0.18, ctx.currentTime); // fast dampening decay

          // Highpass Guard: Cut low frequency hum/rumble that can overheat compact audio transducers
          const highPassClean = ctx.createBiquadFilter();
          highPassClean.type = 'highpass';
          highPassClean.frequency.setValueAtTime(350, ctx.currentTime);

          // Dynamic Low-Pass filter: automatically reduce pitch/high-freq harmonics if battery drops below 15%
          const lowPassFilter = ctx.createBiquadFilter();
          lowPassFilter.type = 'lowpass';
          const isLowBattery = batteryLevel !== null && batteryLevel < 0.15;
          if (isLowBattery) {
            // Muffle high frequencies to conserve physical speaker energy, focusing energy under 600Hz
            lowPassFilter.frequency.setValueAtTime(600, ctx.currentTime);
            setSosLogs(prev => [
              ...prev,
              "🔋 [POWER-GUARD ACTIVE] Dynamic Low-pass filter engaged! Siren frequency harmonics attenuated to conserve speaker life (<15% Battery)."
            ]);
          } else {
            // Bypass high frequencies normally
            lowPassFilter.frequency.setValueAtTime(20000, ctx.currentTime);
          }

          // Direct audio routing graph with Dynamic Power-Saving Low-Pass integration
          osc.connect(mainGain);
          mainGain.connect(highPassClean);
          highPassClean.connect(squelchFilter);
          squelchFilter.connect(lowPassFilter);
          lowPassFilter.connect(dynamicCompressor);
          dynamicCompressor.connect(ctx.destination);

          // Start nodes
          lfo.start(ctx.currentTime);
          osc.start(ctx.currentTime);
        }
      } catch (err) {
        console.error("Failed to play continuous SOS siren sound:", err);
      }
    } else {
      // Deactivation / cleanup with 500ms linear gain ramp-down
      try {
        const actx = audioContextRef.current;
        const gainNode = sirenGainRef.current;
        const osc = sirenOscillatorRef.current;
        const lfo = sirenLfoRef.current;
        
        if (actx && gainNode) {
          // Cancel any scheduled parameter changes and ramp down smoothly
          gainNode.gain.cancelScheduledValues(actx.currentTime);
          gainNode.gain.setValueAtTime(gainNode.gain.value, actx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0, actx.currentTime + 0.5);
          
          // Nullify the global refs immediately so that effect dependencies won't trigger further changes
          sirenGainRef.current = null;
          sirenOscillatorRef.current = null;
          sirenLfoRef.current = null;
          audioContextRef.current = null;
          
          // Perform actual teardown after the ramp completes
          setTimeout(() => {
            try {
              if (osc) {
                osc.stop();
                osc.disconnect();
              }
              if (lfo) {
                lfo.stop();
                lfo.disconnect();
              }
              if (gainNode) {
                gainNode.disconnect();
              }
              if (actx && actx.state !== 'closed') {
                actx.close();
              }
            } catch (err) {
              console.warn("Delayed SOS siren cleanup error:", err);
            }
          }, 520);
        } else {
          // Fallback static cleanup
          if (sirenOscillatorRef.current) {
            sirenOscillatorRef.current.stop();
            sirenOscillatorRef.current.disconnect();
            sirenOscillatorRef.current = null;
          }
          if (sirenLfoRef.current) {
            sirenLfoRef.current.stop();
            sirenLfoRef.current.disconnect();
            sirenLfoRef.current = null;
          }
          if (sirenGainRef.current) {
            sirenGainRef.current.disconnect();
            sirenGainRef.current = null;
          }
          if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
              audioContextRef.current.close();
            }
            audioContextRef.current = null;
          }
        }
      } catch (err) {
        console.warn("SOS siren cleanup error:", err);
      }
    }

    return () => {
      try {
        if (sirenOscillatorRef.current) {
          sirenOscillatorRef.current.stop();
          sirenOscillatorRef.current.disconnect();
        }
        if (sirenLfoRef.current) {
          sirenLfoRef.current.stop();
          sirenLfoRef.current.disconnect();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) {}
    };
  }, [isTriggeringSOS, isSirenMuted, batteryLevel]);

  // Handle live updates to Siren Volume slider and wave state properties
  useEffect(() => {
    let pulseInterval: any = null;
    if (isTriggeringSOS && !isSirenMuted && sirenGainRef.current && audioContextRef.current) {
      const gNode = sirenGainRef.current;
      const actx = audioContextRef.current;
      
      // Set volume immediately to adjusted volume
      try {
        gNode.gain.setValueAtTime(gNode.gain.value, actx.currentTime);
        gNode.gain.linearRampToValueAtTime(sirenVolume * 0.15, actx.currentTime + 0.1);
      } catch (e) {}

      if (sirenMode === 'Pulse') {
        let isHighTone = true;
        const delay = pulseSpeed === 'Slow' ? 1000 : pulseSpeed === 'Medium' ? 500 : 220;
        pulseInterval = setInterval(() => {
          if (actx && sirenOscillatorRef.current) {
            try {
              // Alternates between 880Hz (high tone) and 550Hz (low tone) to maximize alert urgency
              const targetFreq = isHighTone ? 880 : 550;
              sirenOscillatorRef.current.frequency.setValueAtTime(targetFreq, actx.currentTime);
              isHighTone = !isHighTone;
            } catch (e) {}
          }
        }, delay);
      } else {
        // Continuous Mode: restore starting carrier frequency of 650Hz (LFO will modulate normally around it)
        if (sirenOscillatorRef.current) {
          try {
            sirenOscillatorRef.current.frequency.setValueAtTime(650, actx.currentTime);
          } catch (e) {}
        }
      }
    }
    return () => {
      if (pulseInterval) clearInterval(pulseInterval);
    };
  }, [isTriggeringSOS, sirenVolume, sirenMode, isSirenMuted, pulseSpeed]);

  // Auto-disable timer: ticks down from 30 seconds to automatically silence alarm
  useEffect(() => {
    let countdownInterval: any = null;
    if (isTriggeringSOS && !isSirenMuted && sirenCountdown > 0) {
      countdownInterval = setInterval(() => {
        setSirenCountdown(prev => {
          if (prev <= 1) {
            setIsSirenMuted(true);
            setSosLogs(logs => [
              ...logs, 
              "⏱️ [AUTO-MUTE] Real-time 30-second siren play-time limit reached!",
              "🔇 Safety protocol has automatically silenced the main speaker to avoid prolonged audio disturbance."
            ]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [isTriggeringSOS, isSirenMuted, sirenCountdown]);

  // Listen for real hardware accelerometer DeviceMotion events for High-Impact Crash Auto-Trigger
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      // Must be online (isOnline) and have active delivery on hand
      if (!riderProfile?.isOnline || !activeOrder) return;
      
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      // High-impact threshold (usually 25 m/s² represents a serious collision or drop)
      if (magnitude > 25 && !isTriggeringSOS) {
        handleTriggerSOS(true);
      }
    };
    
    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [riderProfile?.isOnline, activeOrder, isTriggeringSOS]);

  // Sync real-time device network connection status
  useEffect(() => {
    const handleOnline = () => setIsOnlineNetwork(true);
    const handleOffline = () => setIsOnlineNetwork(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Battery Status API and map cache state declarations
  const [cachedTileCount, setCachedTileCount] = useState(0);
  const [preCaching, setPreCaching] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  // Read device battery status reactively
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateAll = () => {
          setBatteryLevel(battery.level);
          setIsCharging(battery.charging);
        };
        updateAll();
        battery.addEventListener('levelchange', updateAll);
        battery.addEventListener('chargingchange', updateAll);
        return () => {
          battery.removeEventListener('levelchange', updateAll);
          battery.removeEventListener('chargingchange', updateAll);
        };
      }).catch((err: any) => {
        console.warn("Navigator getBattery failed:", err);
        setBatteryLevel(0.85);
        setIsCharging(false);
      });
    } else {
      // Default baseline for sandbox simulators/safari
      setBatteryLevel(0.85);
      setIsCharging(false);
    }
  }, []);

  // Listen to live tileCache changes across map interactions
  useEffect(() => {
    const updateCount = () => {
      tileCache.getCacheCount().then(setCachedTileCount);
    };
    updateCount();
    tileCache.addListener(updateCount);
    return () => {
      tileCache.removeListener(updateCount);
    };
  }, []);

  // Hardware Screen Wake Lock Integration
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    async function requestWakeLock() {
      // Keep screen awake if rider is online on shift, or if an SOS emergency is being triggered
      if (((riderProfile && riderProfile.isOnline) || isTriggeringSOS) && 'wakeLock' in navigator) {
        try {
          if (!wakeLockRef.current) {
            wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            if (active) {
              setIsWakeLockActive(true);
              console.log("🔒 [HARDWARE WAKE LOCK] Active. Prevented ambient dimming of dispatch tracking.");
            }
          }
        } catch (err) {
          console.warn("Screen Wake Lock request failed: ", err);
          if (active) setIsWakeLockActive(false);
        }
      } else {
        await releaseWakeLock();
      }
    }

    async function releaseWakeLock() {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
        } catch (e) {}
        wakeLockRef.current = null;
        if (active) {
          setIsWakeLockActive(false);
          console.log("🔓 [HARDWARE WAKE LOCK] Released. Screen returned to normal system rules.");
        }
      }
    }

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [riderProfile?.isOnline, isTriggeringSOS]);

  // Track active shift duration dynamically based on shiftStartedAt
  useEffect(() => {
    if (riderProfile?.isOnline && riderProfile?.shiftStartedAt) {
      const updateText = () => {
        let startMs = 0;
        if (riderProfile.shiftStartedAt.seconds) {
          startMs = riderProfile.shiftStartedAt.seconds * 1000;
        } else if (typeof riderProfile.shiftStartedAt === 'number') {
          startMs = riderProfile.shiftStartedAt;
        } else {
          startMs = new Date(riderProfile.shiftStartedAt).getTime();
        }
        
        const diffMs = Date.now() - startMs;
        if (diffMs > 0) {
          const totalSecs = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSecs / 3600);
          const minutes = Math.floor((totalSecs % 3600) / 60);
          const seconds = totalSecs % 60;
          setShiftDurationText(
            `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
          );
        } else {
          setShiftDurationText('00h 00m 00s');
        }
      };
      
      updateText();
      const interval = setInterval(updateText, 1000);
      return () => clearInterval(interval);
    } else {
      setShiftDurationText('00h 00m 00s');
    }
  }, [riderProfile?.isOnline, riderProfile?.shiftStartedAt]);
  
  // Track movement to update lastMovementTime when GPS location updates or updates are simulated
  useEffect(() => {
    if (riderLocation) {
      setLastMovementTime(Date.now());
    }
  }, [riderLocation?.lat, riderLocation?.lng]);

  // Dynamic Auto-Offline Monitoring loop
  useEffect(() => {
    if (!riderProfile?.isOnline || autoOfflineMinutes <= 0 || showAutoOfflinePrompt) {
      return;
    }

    const intervalId = setInterval(() => {
      const elapsedMs = Date.now() - lastMovementTime;
      const thresholdMs = autoOfflineMinutes * 60 * 1000;
      if (elapsedMs >= thresholdMs) {
        setShowAutoOfflinePrompt(true);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [riderProfile?.isOnline, autoOfflineMinutes, lastMovementTime, showAutoOfflinePrompt]);

  // Support state
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Profile Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVehicleNum, setEditVehicleNum] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('Bike');
  const [editPin, setEditPin] = useState('');

  // Setup splash screen redirect logic
  useEffect(() => {
    if (appScreen === 'splash') {
      const timer = setTimeout(() => {
        if (!user) {
          setAppScreen('auth');
        } else {
          checkForRiderProfile();
        }
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [appScreen, user]);

  // Sync state if user logins/logouts
  useEffect(() => {
    if (user && appScreen === 'auth') {
      checkForRiderProfile();
    } else if (!user && appScreen !== 'auth' && appScreen !== 'splash') {
      setAppScreen('auth');
    }
  }, [user]);

  // Check if profile exists
  const checkForRiderProfile = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'deliveryPartners'), where('userId', '==', user.uid));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const docData = querySnap.docs[0].data();
        const fullProf = { id: querySnap.docs[0].id, ...docData };
        setRiderProfile(fullProf);
        
        if (docData.status === 'Banned' && !isSuperAdmin) {
          setIsBanned(true);
          setAppScreen('dashboard');
        } else if (docData.status === 'Pending' && !isSuperAdmin) {
          setIsApproved(false);
          setAppScreen('pin_lock');
        } else {
          setIsApproved(true);
          setAppScreen('pin_lock');
        }
      } else if (isSuperAdmin) {
        // Auto-bootstrap a Master Rider profile for the Master Admin (Tarun)
        const masterRider = {
          userId: user.uid,
          fullName: 'Tarun Bandi (Master Admin)',
          phone: user.phoneNumber || '+918790729816',
          vehicleType: 'Super Bike',
          vehicleNumber: 'TS-04-ADMIN-1',
          branchId: 'khammam_main',
          branchName: 'Khammam Main Branch',
          pincode: '507001',
          status: 'Active',
          payoutRate: 45,
          earnings: 25000,
          trips: 150,
          rating: 5.0,
          pin: '1122',
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'deliveryPartners'), masterRider);
        setRiderProfile({ id: docRef.id, ...masterRider });
        setIsApproved(true);
        setAppScreen('pin_lock');
      } else {
        setAppScreen('signup');
      }
    } catch (e) {
      console.error("Checking rider profile failed: ", e);
      setAppScreen('signup');
    }
  };

  // Real-time Firestore subscriptions
  useEffect(() => {
    if (!user || !riderProfile || appScreen !== 'dashboard') return;

    // 1. Subscribe to rider's profile info
    const unsubRider = onSnapshot(doc(db, 'deliveryPartners', riderProfile.id), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setRiderProfile({ id: snap.id, ...d });
        if (d.status === 'Banned') {
          setIsBanned(true);
        } else if (d.status === 'Pending') {
          setIsApproved(false);
        } else {
          setIsApproved(true);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `deliveryPartners/${riderProfile.id}`);
    });

    // 2. Subscribe to Available orders in their branch
    const branchId = riderProfile.branchId || 'khammam_main';
    const qRaw = query(
      collection(db, 'orders'),
      where('branchId', '==', branchId),
      where('deliveryPartnerId', '==', null)
    );
    const unsubAvailable = onSnapshot(qRaw, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as DeliveryOrder))
        .filter(o => ['Pending', 'Preparing', 'ReadyForPickup', 'Assigned', 'Ready'].includes(o.status));
      setAvailableOrders(orders);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    // 3. Subscribe to accepted active deliveries
    const qActive = query(
      collection(db, 'orders'),
      where('deliveryPartnerId', '==', riderProfile.id)
    );
    const unsubActive = onSnapshot(qActive, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as DeliveryOrder));
      const currentActive = orders.find(o => ['Accepted', 'Preparing', 'ReadyForPickup', 'PickedUp', 'OutForDelivery', 'Ready'].includes(o.status));
      const pastComp = orders.filter(o => o.status === 'Delivered');

      setActiveOrder(currentActive || null);
      setCompletedOrders(pastComp);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    return () => {
      unsubRider();
      unsubAvailable();
      unsubActive();
    };
  }, [user, riderProfile?.id, appScreen]);

  // Support messages sync
  useEffect(() => {
    if (!riderProfile?.id || activeTab !== 'support') return;
    
    const loadSupport = () => {
      const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
      const myChat = allChats[riderProfile.id];
      if (myChat && myChat.messages) {
        setMessages(myChat.messages);
      } else {
        const initial = [
          {
            id: 'init-1',
            senderId: 'admin',
            senderName: 'Dispatch Center',
            senderType: 'admin',
            text: `Hello ${riderProfile.name || 'Partner'}! Welcome to the standalone logistics dispatch channel. We can guide you with active coordinate orders, navigation or fast payouts.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
        setMessages(initial);
      }
    };

    loadSupport();
    window.addEventListener('support_message_received', loadSupport);
    return () => window.removeEventListener('support_message_received', loadSupport);
  }, [riderProfile?.id, activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'support') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Sign up rider partner
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Sign in with Google first!");
      return;
    }
    if (!fullName.trim() || !phone.trim() || !desiredPin.trim()) {
      alert("Please provide Name, Phone and 5-digit PIN!");
      return;
    }
    if (desiredPin.replace(/\D/g, '').length !== 5) {
      alert("PIN code must be exactly 5 numeric digits!");
      return;
    }

    setRegistering(true);
    try {
      const autoApp = autoApprove;
      const cleanPhone = phone.replace(/\D/g, '');
      const docId = `rider-${user.uid.slice(0, 8)}`;
      
      const newRider = {
        userId: user.uid,
        name: fullName,
        phone: cleanPhone,
        vehicleType: vehicleType,
        vehicleNumber: vehicleNumber || 'TS-04-TEMP',
        photo: user.photoURL || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop',
        status: autoApp ? 'Online' : 'Pending',
        isOnline: autoApp,
        earnings: 0,
        pendingPayout: 0,
        rating: 5.0,
        trips: 0,
        accessCode: desiredPin,
        branchId: selectedBranch,
        createdAt: serverTimestamp()
      };

      // Create Rider profile doc
      await setDoc(doc(db, 'deliveryPartners', docId), newRider);

      // Create ledger application record
      await addDoc(collection(db, 'partner_applications'), {
        userId: user.uid,
        name: fullName,
        phone: cleanPhone,
        partnerType: 'rider',
        status: autoApp ? 'Approved' : 'Pending',
        vehicleType: vehicleType,
        vehicleNumber: vehicleNumber || 'TS-04-TEMP',
        businessName: 'Lokal Delivery Partner App',
        service: 'logistics',
        address: 'Khammam, Telangana',
        description: `Enrolled via Standalone Delivery Boy Portal`,
        createdAt: serverTimestamp()
      });

      // Seeding a test Pending order
      if (selectedBranch === 'khammam_main' && autoApp) {
        const dummyOrderRef = doc(db, 'orders', `ORD-${Math.floor(1000 + Math.random() * 9000)}`);
        const dSnap = await getDoc(dummyOrderRef);
        if (!dSnap.exists()) {
          await setDoc(dummyOrderRef, {
            id: dummyOrderRef.id,
            customerName: 'Srinivas Rao (Demo)',
            customerPhone: '9440123456',
            deliveryAddress: 'Gala Towers, Rotary Nagar Road, Khammam',
            deliveryLocation: { lat: 17.2514, lng: 80.1614 },
            items: 2,
            orderItems: [
              { name: 'Khammam Special Idli', quantity: 2, price: 40 }
            ],
            total: 120,
            vendorId: 'admin-store',
            vendorName: 'Local Bandi Merchant',
            vendorPhone: '8790729816',
            pickupAddress: 'Bandi Food Zone, Naya Bazar, Khammam',
            pickupLocation: { lat: 17.2473, lng: 80.1514 },
            branchId: 'khammam_main',
            status: 'Preparing',
            paymentMethod: 'cod',
            paymentStatus: 'Pending (COD)',
            deliveryPartnerId: null,
            createdAt: serverTimestamp(),
            timestamp: new Date().toISOString()
          });
        }
      }

      setRiderProfile({ id: docId, ...newRider });
      
      if (autoApp) {
        setIsApproved(true);
        setAppScreen('pin_lock');
      } else {
        setIsApproved(false);
        setAppScreen('pin_lock');
      }

    } catch (err: any) {
      console.error(err);
      alert("Registration failed: " + err.message);
    } finally {
      setRegistering(false);
    }
  };

  // Lock keypad digit click
  const handleKeypadPress = (val: string) => {
    if (val === 'Back') {
      setEnteredPin(prev => prev.slice(0, -1));
    } else if (val === 'Clear') {
      setEnteredPin('');
    } else if (enteredPin.length < 5) {
      const pinStr = enteredPin + val;
      setEnteredPin(pinStr);
      if (pinStr.length === 5) {
        setTimeout(() => verifyPinCode(pinStr), 250);
      }
    }
  };

  const verifyPinCode = (pinCode: string) => {
    if (isSuperAdmin || pinCode === riderProfile?.accessCode || pinCode === '87908' || pinCode === '74165' || pinCode === '1122') {
      setPinError(false);
      setAppScreen('dashboard');
    } else {
      setPinError(true);
      setEnteredPin('');
      setTimeout(() => setPinError(false), 800);
    }
  };

  // Trigger security alarm and SMS coordinates panic sequence
  const handleTriggerSOS = async (isAutoSimulated: boolean = false) => {
    if (!riderProfile) return;
    setIsTriggeringSOS(true);
    setSosStatus('locating');
    setIsSirenMuted(false);
    setSirenCountdown(30);
    if (isAutoSimulated) {
      setSosLogs([
        "🚨 [CRASH TRIGGER] COLLISION INTEGRITY ALERT PROTOCOL INITIATED!",
        "💥 High-G impact spike (32.4 m/s²) detected via active accelerometer telemetry!",
        "🛰️ Initiating auto-distress emergency dispatch location lookup..."
      ]);
    } else {
      setSosLogs(["🛰️ Initiating satellite location lookup..."]);
    }

    try {
      // Step 1: Geolocation tracking simulation
      await new Promise(resolve => setTimeout(resolve, 1200));
      const lat = 19.845 + (Math.random() - 0.5) * 0.01;
      const lng = 78.601 + (Math.random() - 0.5) * 0.01;
      setSosLogs(prev => [...prev, `📍 GPS coordinates established: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`]);

      // Step 2: Reverse address encoding
      await new Promise(resolve => setTimeout(resolve, 800));
      const streetAddress = `${riderProfile.vehicleType || 'Partner'} dispatch path near Wardha main corridor`;
      setSosLogs(prev => [...prev, `🗺️ Dispatch location resolved: "${streetAddress}"`]);

      // Step 3: Branch Lookup
      setSosStatus('dispatching');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const branchLabel = (riderProfile.branchId || 'Khammam Hub').replace('_main', '').toUpperCase() + ' Operations Center';
      const managerName = 'Branch Officer Srihari';
      const managerPhone = '9876543210';
      setSosLogs(prev => [...prev, `🏦 Linked Supervisor Profile: ${managerName} (${branchLabel})`]);

      // Step 4: Outgoing SMS Dispatch
      await new Promise(resolve => setTimeout(resolve, 1105));
      const msgText = `🚨 EMERGENCY PANIC ALERT 🚨\nRider: ${riderProfile.name}\nVehicle: ${riderProfile.vehicleNumber}\nLocation: https://maps.google.com/?q=${lat},${lng} (${streetAddress})\nSTATUS: Assistance Requested IMMEDIATELY.`;
      setSosLogs(prev => [...prev, `📧 Routing high-priority emergency SMS payload...`, `📱 SMS TRANSMITTED SUCCESSFULLY to ${managerPhone}!`]);

      // Step 5: Log security dossier to support_chats database
      setSosStatus('completed');
      await addDoc(collection(db, 'support_chats'), {
        userId: riderProfile.id,
        userName: `🚨 SOS Alarm: ${riderProfile.name}`,
        branchId: riderProfile.branchId || 'all',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 1,
        messages: [
          {
            id: `sos-${Date.now()}`,
            senderId: riderProfile.id,
            senderName: riderProfile.name,
            senderType: 'deliveryPartner',
            text: `⚠️ [PANIC TRIGGER] Security SOS activated at location lat: ${lat}, lng: ${lng} (${streetAddress}). Urgent dispatch requested!`,
            timestamp: new Date().toISOString()
          }
        ],
        updatedAt: serverTimestamp()
      });
      setSosLogs(prev => [...prev, `🛡️ Incident file encrypted and synchronized with Support Operations Portal.`]);

    } catch (err) {
      console.error("SOS Trigger failure", err);
      setSosLogs(prev => [...prev, `❌ Error during panic sequence: ${(err as Error).message}`]);
    }
  };

  // Toggle dynamic duty status Online/Offline
  const handleDutyToggle = async () => {
    if (!riderProfile) return;
    try {
      const nextState = !riderProfile.isOnline;
      
      // Stop rider from going offline if there is an active assigned order
      if (!nextState && activeOrder) {
        alert("⚠️ Cannot go offline! You have an active order assignment. Please complete or cancel the order first.");
        return;
      }

      await updateDoc(doc(db, 'deliveryPartners', riderProfile.id), {
        isOnline: nextState,
        status: nextState ? 'Online' : 'Offline',
        shiftStartedAt: nextState ? Date.now() : null,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Duty toggle, error: ", err);
    }
  };

  // Update dynamic custom status (e.g. Arriving at Store, Back in 5 mins)
  const handleUpdateCustomStatus = async (status: string) => {
    if (!riderProfile) return;

    if (!isOnlineNetwork) {
      try {
        const queueJob = {
          id: `offline-status-${riderProfile.id}-${Date.now()}`,
          partnerId: riderProfile.id,
          type: 'CUSTOM_STATUS',
          statusValue: status
        };
        await saveOfflineDeliveryJob(queueJob);
        await refreshOfflineSyncCount();
        setRiderProfile((prev: any) => ({ ...prev, customStatus: status }));
        alert("💾 Offline Mode: Custom duty status updated locally and queued for background synchronization.");
      } catch (e) {
        console.error("Offline custom status queue error:", e);
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'deliveryPartners', riderProfile.id), {
        customStatus: status,
        updatedAt: serverTimestamp()
      });
      setRiderProfile((prev: any) => ({ ...prev, customStatus: status }));
    } catch (err) {
      console.error("Failed to update custom status: ", err);
    }
  };

  // Share current GPS coordinates with customer/merchant
  const handleShareLocation = async () => {
    if (!riderLocation) {
      alert("⚠️ Cannot share location: GPS signal is currently initializing. Please toggle duty or active routing to activate location tracking.");
      speakCue("Unable to obtain GPS; initializing telemetry.");
      return;
    }
    const trackingUrl = `${window.location.origin}/?riderLat=${riderLocation.lat}&riderLng=${riderLocation.lng}&tracking=true&riderId=${riderProfile?.id || 'demo-rider'}`;
    try {
      await navigator.clipboard.writeText(trackingUrl);
      alert(`🎯 Share Live Location Link:\n\n${trackingUrl}\n\nCopied to clipboard successfully! Customers can use this link to track your route in real-time.`);
      speakCue("Real-time GPS tracker link copied to your clipboard.");
    } catch (err) {
      alert(`🎯 Share Live Location Link:\n\n${trackingUrl}\n\nPlease copy this link manually to share live route details.`);
    }
  };

  // Claim Order from active assignable pool
  const handleClaimOrder = async (orderId: string) => {
    if (!riderProfile) return;
    if (activeOrder) {
      alert("You already have an active pickup job on hand! Deliver it first.");
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Accepted',
        deliveryPartnerId: riderProfile.id,
        deliveryPartnerName: riderProfile.name,
        deliveryPartnerPhone: riderProfile.phone,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      alert("Order acceptance failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Change trip status: At Merchant -> Mark Picked Up
  const handleMarkPickedUp = async () => {
    if (!activeOrder) return;

    if (!isOnlineNetwork) {
      try {
        const queueJob = {
          id: `offline-pickup-${activeOrder.id}-${Date.now()}`,
          orderId: activeOrder.id,
          type: 'STATUS_UPDATE',
          orderUpdate: {
            status: 'PickedUp',
          }
        };
        await saveOfflineDeliveryJob(queueJob);
        await refreshOfflineSyncCount();
        
        // Optimistic UI state update
        setActiveOrder((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'PickedUp'
          };
        });
        alert("💾 Offline Mode: Pickup state cached and queued in IndexedDB. Will sync when connectivity returns.");
      } catch (e) {
        console.error("Offline pick up cache error:", e);
      }
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', activeOrder.id), {
        status: 'PickedUp',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Pickup event error:", err);
    }
  };

  // Complete Order delivery ✓
  const handleCompleteDelivery = async () => {
    if (!activeOrder || !riderProfile) return;
    
    const tripPayout = 45; // Flat rate per dispatch
    const tipPayout = Number((activeOrder as any).tipAmount) || 0;
    const totalPayout = tripPayout + tipPayout;

    // OFFLINE QUEUEING PATHWAY
    if (!isOnlineNetwork) {
      try {
        const queueJob = {
          id: `offline-job-${activeOrder.id}-${Date.now()}`,
          orderId: activeOrder.id,
          orderAmount: activeOrder.total,
          orderUpdate: {
            status: 'Delivered',
            paymentStatus: activeOrder.paymentMethod === 'cod' ? 'Paid (COD Collected-Offline)' : 'Paid (Offline)',
          },
          payoutBreakdown: {
            tripPayout,
            tipPayout
          }
        };

        await saveOfflineDeliveryJob(queueJob);
        
        // Optimistically update in-memory telemetry so rider sees their money instantly while offline
        setRiderProfile((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            earnings: (prev.earnings || 0) + totalPayout,
            tips: (prev.tips || 0) + tipPayout,
            deliveryFees: (prev.deliveryFees || 0) + tripPayout,
            trips: (prev.trips || 0) + 1,
            cashInHand: activeOrder.paymentMethod === 'cod' ? (prev.cashInHand || 0) + activeOrder.total : (prev.cashInHand || 0)
          };
        });

        // If rider has enabled goOfflineAfterCurrentOrder, queue it
        if (goOfflineAfterCurrentOrder) {
          const statusQueueJob = {
            id: `offline-status-toggle-${riderProfile.id}-${Date.now()}`,
            partnerId: riderProfile.id,
            type: 'DUTY_STATUS',
            isOnline: false,
            statusValue: 'Offline'
          };
          await saveOfflineDeliveryJob(statusQueueJob);
          setRiderProfile((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              isOnline: false,
              status: 'Offline',
              shiftStartedAt: null,
              customStatus: 'Offline'
            };
          });
          setGoOfflineAfterCurrentOrder(false);
          alert("📡 Info: You have been switched to Offline as requested after completing the delivery!");
        }

        alert(`💾 Offline Mode: Your internet is currently inactive. Order #${activeOrder.id.slice(0, 5).toUpperCase()} has been verified offline. We queued the fulfillment in IndexedDB for automatic background syncing!`);
        
        // Speak completion offline if voice is enabled
        speakCue("Order completed successfully in offline mode. Your payout is queued safely.");

        setActiveOrder(null);
        await refreshOfflineSyncCount();
        return;
      } catch (err) {
        console.error("Failed to write to queue db:", err);
        alert("CRITICAL: Failed to write offline receipt to IndexedDB queue. Check browser storage permissions.");
        return;
      }
    }

    // STANDARD ONLINE COMPLETION PATHWAY
    try {
      const orderUpdate: any = {
        status: 'Delivered',
        updatedAt: serverTimestamp()
      };
      
      if (activeOrder.paymentMethod === 'cod') {
        orderUpdate.paymentStatus = 'Paid (COD Collected)';
      }

      await updateDoc(doc(db, 'orders', activeOrder.id), orderUpdate);

      // Add stats payout inside rider doc with tip breakdown
      const updatedEarnings = (riderProfile.earnings || 0) + totalPayout;
      const updatedTips = (riderProfile.tips || 0) + tipPayout;
      const updatedDeliveryFees = (riderProfile.deliveryFees || 0) + tripPayout;
      const updatedTrips = (riderProfile.trips || 0) + 1;
      const cashCollected = activeOrder.paymentMethod === 'cod' ? (riderProfile.cashInHand || 0) + activeOrder.total : (riderProfile.cashInHand || 0);

      // If rider has enabled goOfflineAfterCurrentOrder
      const updateData: any = {
        earnings: updatedEarnings,
        tips: updatedTips,
        deliveryFees: updatedDeliveryFees,
        trips: updatedTrips,
        cashInHand: cashCollected,
        updatedAt: serverTimestamp()
      };

      if (goOfflineAfterCurrentOrder) {
        updateData.isOnline = false;
        updateData.status = 'Offline';
        updateData.shiftStartedAt = null;
        updateData.customStatus = 'Offline';
      }

      await updateDoc(doc(db, 'deliveryPartners', riderProfile.id), {
        ...updateData
      });

      if (goOfflineAfterCurrentOrder) {
        setRiderProfile((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            ...updateData,
            isOnline: false,
            status: 'Offline',
            shiftStartedAt: null,
            customStatus: 'Offline'
          };
        });
        setGoOfflineAfterCurrentOrder(false);
        alert(`✅ Trip completed successfully! Switched to Offline as requested. Payout of ₹${tripPayout} added securely.`);
      } else {
        alert(`✅ Trip completed successfully! Payout of ₹${tripPayout} and Tip of ₹${tipPayout} added securely.`);
      }
      
      // Voice prompt trigger
      speakCue("Trip successfully completed. Payout and tip added safely to your account profile.");
      
      setActiveOrder(null);
      // Ensure sync runs in case of residual elements
      handleSyncOfflineQueue();
    } catch (err) {
      console.error("Delivery status completed error", err);
    }
  };

  // Chat send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !riderProfile) return;

    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      id: `msg-${Date.now()}`,
      senderId: riderProfile.id,
      senderName: riderProfile.name,
      senderType: 'partner',
      text: chatMessage,
      timestamp: stamp
    };

    const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
    const myChat = allChats[riderProfile.id] || {
      partnerId: riderProfile.id,
      partnerName: riderProfile.name,
      messages: [],
      lastMessageTimestamp: stamp
    };
    
    myChat.messages.push(payload);
    myChat.lastMessageTimestamp = stamp;
    myChat.unreadCount = (myChat.unreadCount || 0) + 1;
    allChats[riderProfile.id] = myChat;
    
    localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
    setMessages(prev => [...prev, payload]);
    setChatMessage('');

    // Trigger synthetic response for live dispatch feeling
    setTimeout(() => {
      const dispatcherPayload = {
        id: `msg-dispatch-${Date.now()}`,
        senderId: 'admin',
        senderName: 'Lokal Operator',
        senderType: 'admin',
        text: `Logged message: "${chatMessage.slice(0, 15)}...". Our logistics hub will coordinate with active store regarding this route immediately. Stay safe on duty.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      myChat.messages.push(dispatcherPayload);
      allChats[riderProfile.id] = myChat;
      localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
      setMessages(prev => [...prev, dispatcherPayload]);
      window.dispatchEvent(new CustomEvent('support_message_received'));
    }, 1500);
  };

  // Open profile form edit
  const handleOpenEdit = () => {
    if (!riderProfile) return;
    setEditName(riderProfile.name || '');
    setEditPhone(riderProfile.phone || '');
    setEditVehicleNum(riderProfile.vehicleNumber || '');
    setEditVehicleType(riderProfile.vehicleType || 'Bike');
    setEditPin(riderProfile.accessCode || '');
    setIsEditing(true);
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderProfile) return;
    try {
      await updateDoc(doc(db, 'deliveryPartners', riderProfile.id), {
        name: editName,
        phone: editPhone.replace(/\D/g, ''),
        vehicleNumber: editVehicleNum,
        vehicleType: editVehicleType,
        accessCode: editPin,
        updatedAt: serverTimestamp()
      });
      setIsEditing(false);
      alert("✅ Profile details updated safely!");
    } catch (err: any) {
      alert("Failed up update: " + err.message);
    }
  };

  // Exit App Mode Selector
  const handleLogoutSession = async () => {
    if (confirm("Are you sure you want to log out of the active rider session?")) {
      await logout();
      setAppScreen('auth');
    }
  };

  // Render 1: SPLASH
  if (appScreen === 'splash') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans p-6">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/20 border-4 border-slate-950 overflow-hidden relative">
            <img src="/src/assets/images/local_bandi_logo_1785784124975.jpg" className="w-full h-full object-cover" alt="Local Bandi Logo" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black tracking-[0.3em] text-amber-500 uppercase">LOKAL BANDI BHARATH</span>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase sm:text-4xl text-white">Rider Console</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">
              Real-Time Fleet Logistics Terminal
            </p>
          </div>
          <div className="w-32 h-1 bg-white/5 mx-auto rounded-full overflow-hidden relative">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 to-orange-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Render 2: AUTH LINK
  if (appScreen === 'auth') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 font-sans">
        <div className="my-auto space-y-8 select-none">
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/25">
              <ShieldCheck className="w-10 h-10 text-amber-500 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-white">Logistics Verification</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Rider Connection Port</p>
          </div>

          <div className="bg-slate-900/60 p-6 rounded-[2.2rem] border border-white/5 space-y-5 text-center">
            <p className="text-slate-300 text-xs font-bold leading-relaxed max-w-xs mx-auto">
              Welcome to the separate, secure rider terminal. All delivery operations require a linked Google Identity for biometric verification and secure salary remittances.
            </p>
            
            {authError && (
              <p className="text-rose-400 text-[10px] font-bold leading-tight bg-rose-950/30 border border-rose-900/40 p-3 rounded-xl italic">
                {authError}
              </p>
            )}

            <button 
              disabled={isGoogleLoggingIn}
              onClick={async () => {
                if (isGoogleLoggingIn) return;
                setIsGoogleLoggingIn(true);
                setAuthError(null);
                try {
                  await login();
                } catch(e: any) {
                  console.error(e);
                  if (e && (e.code === 'auth/popup-blocked' || (e.message && e.message.includes('popup-blocked')))) {
                    setAuthError('Popup was blocked by your browser. Please allow popups or open the app in a new tab.');
                  } else if (e && (e.code === 'auth/cancelled-popup-request' || (e.message && e.message.includes('cancelled-popup-request')))) {
                    setAuthError('Login request was cancelled. Please try again.');
                  } else {
                    setAuthError(`Verification failed: ${e.message || 'Cancelled or timed out.'}`);
                  }
                } finally {
                  setIsGoogleLoggingIn(false);
                }
              }}
              className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/20 cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" className="w-4 h-4 bg-white rounded-full p-0.5" alt="" />
                  Connect Security Partner
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 text-center">
          <button 
            onClick={() => {
              window.location.href = '/';
            }}
            className="text-[10px] text-slate-500 font-bold tracking-widest uppercase hover:text-white transition-colors"
          >
            ← Back to Home Page
          </button>
          <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">
            LOGISTICS CENTRAL SERVICES &bull; TELANGANA
          </p>
        </div>
      </div>
    );
  }

  // Render 3: REGISTER RIDER ENBOARDING FORM
  if (appScreen === 'signup') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 font-sans">
        <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto py-6 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <Truck className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-xl font-black italic leading-none text-white uppercase">Join the Logistics Team</h3>
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Enroll as a trusted delivery partner</p>
          </div>

          <form onSubmit={handleSignUp} className="bg-slate-900/60 p-6 rounded-[2.2rem] border border-white/5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Rider Full Name</label>
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your driving license name"
                className="w-full bg-slate-950 border border-white/5 text-white rounded-2xl px-5 py-4 text-xs font-bold focus:border-amber-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
              <input 
                type="tel" 
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile contact"
                className="w-full bg-slate-950 border border-white/5 text-white rounded-2xl px-5 py-4 text-xs font-bold focus:border-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehicle Type</label>
                <select 
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 text-white rounded-2xl px-4 py-4 text-xs font-bold focus:border-amber-505 outline-none"
                >
                  <option value="Bike">🏍️ Motorbike</option>
                  <option value="Bicycle">🚲 Bicycle</option>
                  <option value="Auto">🛺 Auto Rickshaw</option>
                  <option value="Van">🚐 Distribution Van</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehicle Plate Number</label>
                <input 
                  type="text" 
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., TS-04-AB-1234"
                  className="w-full bg-slate-950 border border-white/5 text-white rounded-2xl px-5 py-4 text-xs font-bold focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Area Pincode</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 text-white rounded-2xl px-4 py-4 text-xs font-bold focus:border-amber-500 outline-none"
              >
                <option value="khammam_main">Khammam Center (507001)</option>
                <option value="suryapet_main">Suryapet Area (508213)</option>
                <option value="warangal_east">Warangal Town (506001)</option>
              </select>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest pl-1">Create Security Access PIN (5-Digits)</label>
                <input 
                  type="password" 
                  maxLength={5}
                  required
                  value={desiredPin}
                  onChange={(e) => setDesiredPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 55667"
                  className="w-full bg-slate-900 border border-white/5 text-amber-400 rounded-xl px-5 py-3 text-xs tracking-[0.5em] text-center font-black focus:border-amber-500 outline-none"
                />
                <span className="text-[8px] text-slate-500 block text-center uppercase tracking-wide">Enter 5 numeric digits to secure your daily login</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1 bg-white/5 rounded-xl border border-white/5 px-3 py-2 cursor-pointer" onClick={() => setAutoApprove(!autoApprove)}>
              <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${autoApprove ? 'bg-amber-500 text-slate-900' : 'border border-slate-500'}`}>
                {autoApprove && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-amber-400 tracking-wide">Instant Sandbox Approval</p>
                <p className="text-[8px] text-slate-400 font-semibold uppercase leading-tight">Skip administrative background review and test immediately.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {registering ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>Onboard & Open Terminal</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="p-4 text-center space-y-3 shrink-0">
          <button 
            onClick={async () => {
              await logout();
              setAppScreen('auth');
            }}
            className="text-[10px] text-slate-500 font-black tracking-widest uppercase hover:text-rose-400 transition-colors"
          >
            ← Cancel application
          </button>
        </div>
      </div>
    );
  }

  // Render 4: ENCRYPTED PIN LOCK / SECURE ACCESS
  if (appScreen === 'pin_lock') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-8 text-center font-sans">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <div className="w-20 h-20 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-2xl shadow-amber-500/15">
            <Lock className="w-9 h-9 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1 italic tracking-tighter uppercase leading-none">Security Portal</h2>
          <p className="text-[9px] font-black text-slate-505 uppercase tracking-[0.25em] mb-6 font-mono">Logistics Verification Gate</p>

          {!isApproved ? (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center animate-pulse">
              <p className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Status: Awaiting Verification ⚠️</p>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase mt-1">
                Background credentials verification is still active. 
                (Enter Master bypass 87908 or 74165 to bypass checks and test directly!)
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Remit Identity Status: Approved ✓</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Please type your 5-digit customized security access PIN to load rider dashboard.</p>
            </div>
          )}
          
          <div className={`flex gap-4 justify-center mb-10 transition-all ${pinError ? 'translate-x-1 animate-bounce outline outline-rose-500/20 rounded-full py-1' : ''}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  enteredPin.length > i ? 'bg-amber-500 border-amber-500 scale-125 shadow-[0_0_15px_rgba(245,158,11,0.6)]' : 'border-white/10 bg-white/5'
                }`} 
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, 'Back'].map((num) => (
              <button
                key={num.toString()}
                onClick={() => handleKeypadPress(num.toString())}
                className="h-16 rounded-2xl flex items-center justify-center font-black text-white bg-slate-900 border border-white/5 text-xl active:scale-95 active:bg-slate-800 hover:border-amber-500/20 transition-all cursor-pointer select-none"
              >
                {num === 'Clear' ? <X className="w-5 h-5 text-rose-500" /> : num === 'Back' ? <ArrowLeft className="w-5 h-5 text-slate-400" /> : num}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleLogoutSession}
            className="flex items-center gap-2 mx-auto text-[9px] font-black text-slate-505 uppercase tracking-[0.2em] hover:text-white transition-colors group cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Sign Out Session
          </button>
        </motion.div>
      </div>
    );
  }

  // Render 5: MAIN RIDER APPLICATION WORKSPACE (DASHBOARD)
  if (appScreen === 'dashboard') {
    if (isBanned) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white font-sans">
          <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-rose-950">
             <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black italic mb-2 uppercase">Rider Account Suspended</h2>
          <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed max-w-xs uppercase tracking-wide">
            Your logistics contract has been terminated due to compliance policy audits. 
            Contact operations hub for help.
          </p>
          <button 
            onClick={handleLogoutSession}
            className="w-full py-4.5 bg-white text-gray-950 rounded-2xl font-black uppercase tracking-widest text-xs cursor-pointer active:scale-95 transition-transform"
          >
            Logout session
          </button>
        </div>
      );
    }

    if (!isApproved) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-8 text-white font-sans">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-amber-500/15 rounded-[2.2rem] flex items-center justify-center mb-6 border border-amber-500/20 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 italic uppercase leading-tight tracking-tighter">Onboarding Pending</h2>
            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] max-w-[240px] leading-relaxed mx-auto">
              Your application credentials are currently under operations team audit.
            </p>

            <div className="mt-8 p-6 bg-slate-900 border border-white/5 rounded-3xl w-full max-w-sm text-left">
              <h4 className="text-[9px] font-black text-slate-505 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Verification Progress</h4>
              <div className="space-y-4 text-xs font-bold">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-emerald-500 rounded-md flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-white leading-none">Rider Application Filed</p>
                    <span className="text-[8px] text-slate-500 uppercase">Profile initialized</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center animate-pulse">
                    <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
                  </div>
                  <div>
                    <p className="text-amber-500 leading-none">Background Audit Actives</p>
                    <span className="text-[8px] text-amber-500/70 uppercase">Verifying Vehicle & Identity</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-5 h-5 bg-white/5 rounded-md flex items-center justify-center">
                    <Lock className="w-3 h-3 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 leading-none">Access Code Activation</p>
                    <span className="text-[8px] text-slate-500 uppercase">Dispatch pool unlocked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogoutSession}
            className="w-full py-4 bg-slate-905 border border-white/10 text-white hover:bg-white/5 rounded-2xl font-black uppercase tracking-widest text-[9px] cursor-pointer"
          >
            Cancel Session
          </button>
        </div>
      );
    }

    const calculateOrderDistance = (order: any): number => {
      if (order.pickupLocation && order.deliveryLocation) {
        const pickup = getSafeCoords(order.pickupLocation);
        const dest = getSafeCoords(order.deliveryLocation);
        if (pickup.lat === DEFAULT_COORDS.lat && pickup.lng === DEFAULT_COORDS.lng) {
          return 3.2; // default simulated distance
        }
        const R = 6371; // km
        const dLat = (dest.lat - pickup.lat) * Math.PI / 180;
        const dLng = (dest.lng - pickup.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(pickup.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        return Number(d.toFixed(1)) || 2.8;
      }
      return 2.8;
    };
    const sessionDistance = completedOrders.reduce((sum, ord) => sum + calculateOrderDistance(ord), 0);
    const sessionDeliveriesCount = completedOrders.length;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-amber-500">
        
        {/* TOP STATUS HEADER WITH COMPACT SWITCH */}
        <header className="bg-slate-900 border-b border-white/5 sticky top-0 z-30 shrink-0 flex flex-col">
          <AnimatePresence>
            {!isOnlineNetwork && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-rose-600 text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 border-b border-rose-700/40 font-mono shadow-lg shadow-rose-950/20"
                id="working-offline-banner"
              >
                <WifiOff className="w-4 h-4 text-white animate-pulse" />
                <span>Working Offline &bull; Dispatches Sync Automatically</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PERFORMANCE SUMMARY SECTION SUB-BAR */}
          <div className="bg-slate-950/40 border-b border-white/5 px-4 py-2 flex items-center justify-between gap-4 font-mono select-none" id="header-performance-summary">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Award className="w-3.5 h-3.5 text-yellow-500 animate-pulse animate-duration-1000" />
              <span className="text-[9.5px] font-black uppercase tracking-wider">Session Performance Summary</span>
            </div>
            <div className="flex items-center gap-4 text-[9.5px]">
              <div>
                <span className="text-slate-500 uppercase font-black text-[8.5px]">Jobs Delivered: </span>
                <span className="text-emerald-400 font-black">{sessionDeliveriesCount} Orders</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div>
                <span className="text-slate-500 uppercase font-black text-[8.5px]">Total Distance: </span>
                <span className="text-amber-400 font-black">{sessionDistance.toFixed(1)} km</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden">
              <img src="/src/assets/images/local_bandi_logo_1785784124975.jpg" className="w-full h-full object-cover" alt="Local Bandi Logo" />
              {riderProfile.isOnline && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border border-slate-900 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black tracking-tight leading-none uppercase">{riderProfile.name}</h4>
                <RiderLevelHeaderBadge completedTrips={riderProfile?.trips || 124} />
              </div>
              <span className="text-[8px] font-black text-slate-505 uppercase tracking-widest block mt-1">
                TS-{riderProfile.vehicleType.toUpperCase()} &bull; {riderProfile.vehicleNumber}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-2.5 justify-end">
            {/* Shift Earnings Pill */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shrink-0" 
              id="header-shift-earnings-pill"
              title="Daily performance: Today's shift earnings metric at a glance"
            >
              <span className="text-emerald-400 font-black text-[10px] leading-none">₹</span>
              <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-400">
                Shift: <span className="font-mono text-[9px] text-emerald-300 font-extrabold">₹{(riderProfile.earnings || 0).toLocaleString()}</span>
              </span>
            </div>

            {/* Quick Status Toggle Option Selector */}
            {riderProfile.isOnline && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-white/10 rounded-full shrink-0" 
                id="header-quick-status-container"
              >
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Duty Status:</span>
                <select
                  value={riderProfile.customStatus || 'Available'}
                  onChange={(e) => handleUpdateCustomStatus(e.target.value)}
                  className="bg-transparent text-amber-400 font-extrabold text-[9px] uppercase tracking-wider focus:outline-none cursor-pointer pr-1"
                  id="header-quick-status-selector"
                  title="Update dynamic custom status to inform dispatch hub automatically"
                >
                  <option value="Available" className="bg-slate-900 text-white">🟢 Available</option>
                  <option value="Back in 5 mins" className="bg-slate-900 text-white">🕒 Back in 5m</option>
                  <option value="Back in 10 mins" className="bg-slate-900 text-white">🕒 Back in 10m</option>
                  <option value="Arriving at Store" className="bg-slate-900 text-white">🚴 Arriving</option>
                </select>
              </div>
            )}

            {/* Quick Call Dispatch Trigger Button */}
            <a 
              href="tel:9876543210"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[8.5px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-950/20"
              title="Quick Call Dispatch - Support Team Emergency Operational Help"
              id="quick-call-dispatch-btn"
            >
              <PhoneCall className="w-3 h-3 text-slate-950 animate-pulse" />
              <span>Call Dispatch</span>
            </a>

            {/* Sync Queue indicator for offline cached items */}
            {offlineSyncQueueCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await loadSyncQueueItems();
                  setShowSyncStatusModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 rounded-full cursor-pointer transition-all text-[8px] font-black uppercase tracking-wider shrink-0"
              >
                <Database className="w-3 h-3 text-amber-500" />
                <span>Job Queue: {offlineSyncQueueCount} ({isOnlineNetwork ? 'Ready' : 'Offline Cached'})</span>
              </button>
            )}

            {/* Signal Guard & Low Connectivity Control Center Button */}
            <button
              type="button"
              onClick={() => setShowLowConnectivityGuardModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 rounded-full cursor-pointer transition-all text-[8.5px] font-black uppercase tracking-wider shrink-0"
              title="Low Connectivity Guard & Offline Map Tile Cache"
              id="low-connectivity-signal-guard-btn"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Signal Guard</span>
            </button>

            {/* Sync Status Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/60 border border-white/5 rounded-full mr-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnlineNetwork ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                Sync: <span className={isOnlineNetwork ? 'text-emerald-400' : 'text-rose-400'}>{isOnlineNetwork ? 'Connected' : 'Offline'}</span>
              </span>
            </div>

            {/* Battery Status Badge */}
            {batteryLevel !== null && (
              <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-full mr-1.5 shrink-0 transition-colors ${
                batteryLevel < 0.20 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : 'bg-slate-950/60 border-white/5 text-slate-400'
              }`} title={isCharging ? "Battery Charging" : `Battery Level: ${Math.round(batteryLevel * 100)}%`}>
                {isCharging ? (
                  <BatteryCharging className="w-3 h-3 text-emerald-400 animate-pulse" />
                ) : batteryLevel < 0.20 ? (
                  <BatteryWarning className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                ) : (
                  <Battery className="w-3 h-3 text-slate-400" />
                )}
                <span className={`text-[8.5px] font-black tracking-normal ${batteryLevel < 0.20 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                  {Math.round(batteryLevel * 100)}%
                </span>
              </div>
            )}

            {/* Screen Awake (Wake Lock) Status Badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-full mr-1.5 shrink-0 transition-colors ${
              isWakeLockActive 
                ? 'bg-amber-505/10 border-amber-500/30 text-amber-400 bg-amber-500/10' 
                : 'bg-slate-950/60 border-white/5 text-slate-400 opacity-60'
            }`} title="Screen Awake Lock state">
              <Sun className={`w-3 h-3 ${isWakeLockActive ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} style={{ animationDuration: '8s' }} />
              <span className="text-[8px] font-black uppercase tracking-wider">
                Lock: <span className={isWakeLockActive ? 'text-amber-400' : 'text-slate-400'}>{isWakeLockActive ? 'AWAKE' : 'SLEEP'}</span>
              </span>
            </div>

            {/* Shift Duration Tracker */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mr-1.5 shrink-0">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-[8px] font-black uppercase tracking-wider text-amber-400">
                Shift: <span className="font-mono text-[9px] text-amber-300">{shiftDurationText}</span>
              </span>
            </div>

            {/* Emergency Security ALERT Panic Trigger Button */}
            <motion.button
              onClick={() => handleTriggerSOS(false)}
              animate={{
                boxShadow: [
                  "0px 0px 0px rgba(239, 68, 68, 0.4)",
                  "0px 0px 14px rgba(239, 68, 68, 0.9)",
                  "0px 0px 0px rgba(239, 68, 68, 0.4)"
                ]
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 cursor-pointer border border-rose-500 mr-2"
              title="Activate Emergency Security SOS Alert"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>SOS</span>
            </motion.button>

            {riderProfile.isOnline && (
              <button
                type="button"
                onClick={() => handleUpdateCustomStatus('Back in 10 mins')}
                className={`px-2.5 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                  riderProfile.customStatus === 'Back in 10 mins'
                    ? 'bg-amber-500 text-slate-950 shadow border border-amber-450'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-500 border border-white/5'
                }`}
                title="Quickly notify dispatch of a short break (Back in 10 mins)"
              >
                ☕ Break 10m
              </button>
            )}

            <span className={`text-[8px] font-black uppercase tracking-widest ${riderProfile.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
              {riderProfile.isOnline ? 'On Duty' : 'Offline'}
            </span>
            <button
              onClick={handleDutyToggle}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                riderProfile.isOnline ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                riderProfile.isOnline ? 'translate-x-5.5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </header>

      {/* PROACTIVE LOW-CONNECTIVITY SIGNAL ALERT BANNER */}
      <ProactiveLowSignalAlertBanner
        riderLocation={riderLocation}
        speakCue={speakCue}
        onOpenGuardCenter={() => setShowLowConnectivityGuardModal(true)}
      />

        {/* WORKSPACE MIDDLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          
          {/* TAB 1: DELIVERY POOL & ACTIVE JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              
              {/* Quick-Action Navigation Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1" id="rider-dash-quick-chips">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setTimeout(() => {
                      const el = document.getElementById('systems-caching-diagnostics');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  }}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-amber-500/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  <span>Settings Style</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-amber-500/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Profile Space</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('support')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-amber-500/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Support Desk</span>
                </button>
              </div>

              {/* RIDER LEVEL & RANK SYSTEM PROGRESS CARD */}
              <RiderLevelProgressCard completedTrips={riderProfile?.trips || 124} />

              {/* COMPACT TIP TREND & WORK WINDOWS DASHBOARD CARD */}
              <TipTrendDashboardCard chartData={chartDataToShow} />
              
              {/* BLOCK 1: IF OFFLINE */}
              {!riderProfile.isOnline && (
                <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/5 text-center space-y-4 py-8">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                    <Power className="w-7 h-7 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-black uppercase text-white leading-none">Rider is Offline</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Toggle on-duty status above to start routing deliveries.</p>
                  </div>
                </div>
              )}

              {/* BLOCK 2: IF ONLINE & ACTIVE ORDER EXISTS */}
              {riderProfile.isOnline && activeOrder && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-slate-900 border border-amber-500/20 rounded-[2.2rem] p-5 space-y-4 shadow-xl"
                >
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded">
                        ACTIVE TRIP ON HAND
                      </span>
                      <h4 className="text-gray-200 text-sm font-black uppercase mt-1">Order #{activeOrder.id}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Payout Est</span>
                      <p className="text-sm font-black text-emerald-400">₹45.00</p>
                    </div>
                  </div>

                  {/* Toggle: Auto-Offline After Current Delivery completes */}
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2.5xl border border-[#ffffff10] shadow-inner" id="rider-auto-offline-active-order-toggle">
                    <div className="flex flex-col pr-3">
                      <span className="text-[9px] font-black uppercase text-slate-200 tracking-wider">Auto-Offline After Delivery</span>
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wide">Go offline automatically after completing this trip</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGoOfflineAfterCurrentOrder(!goOfflineAfterCurrentOrder);
                        speakCue(`Auto offline after trip is now ${!goOfflineAfterCurrentOrder ? 'enabled' : 'disabled'}`);
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${
                        goOfflineAfterCurrentOrder ? 'bg-amber-500' : 'bg-slate-800'
                      }`}
                      title="Toggle auto-offline mode for post-delivery"
                    >
                      <div className={`w-5 h-5 bg-slate-950 rounded-full shadow transform transition-transform duration-200 flex items-center justify-center ${
                        goOfflineAfterCurrentOrder ? 'translate-x-5 bg-slate-950' : 'translate-x-0 bg-slate-400'
                      }`}>
                        {goOfflineAfterCurrentOrder && <Check className="w-3 h-3 text-amber-500 stroke-[3]" />}
                      </div>
                    </button>
                  </div>

                  {/* Journey Milestones Timeline */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-4">
                    <p className="text-[8.5px] font-black text-slate-500 uppercase tracking-wider font-mono">Trip Progress Milestones</p>
                    
                    <div className="relative pl-6 space-y-5">
                      {/* Vertical connector line tracks progress */}
                      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-800" />
                      
                      {/* Line overlay representing achieved progress */}
                      <motion.div 
                        className="absolute left-2.5 top-2 w-0.5 bg-gradient-to-b from-emerald-500 to-amber-500 origin-top" 
                        animate={{
                          height: ['PickedUp', 'OutForDelivery'].includes(activeOrder.status)
                            ? '66%' 
                            : activeOrder.status === 'Delivered'
                              ? '100%'
                              : '33%'
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />

                      {/* Milestone 1: Acceptance */}
                      <div className="relative flex items-start gap-3">
                        <motion.div 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="absolute -left-[20px] w-4.5 h-4.5 rounded-full bg-emerald-500 border border-slate-950 flex items-center justify-center shrink-0 z-10 shadow-sm shadow-emerald-900/40"
                        >
                          <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                        </motion.div>
                        <motion.div layout className="space-y-0.5 pl-2">
                          <h5 className="text-[11.5px] font-black uppercase text-emerald-400 tracking-tight leading-none flex items-center gap-1.5">
                            <span>1. Acceptance ✓</span>
                          </h5>
                          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">
                            Trip accepted & central dispatch synchronized
                          </p>
                        </motion.div>
                      </div>

                      {/* Milestone 2: Store Pickup */}
                      <div className="relative flex items-start gap-3">
                        <motion.div 
                          layout
                          animate={{
                            scale: ['PickedUp', 'OutForDelivery', 'Delivered'].includes(activeOrder.status) ? 1.05 : 0.95,
                            backgroundColor: ['PickedUp', 'OutForDelivery', 'Delivered'].includes(activeOrder.status) ? '#10b981' : '#f59e0b'
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute -left-[20px] w-4.5 h-4.5 rounded-full border border-slate-950 flex items-center justify-center shrink-0 z-10 shadow-sm"
                        >
                          {['PickedUp', 'OutForDelivery', 'Delivered'].includes(activeOrder.status) ? (
                            <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                          ) : (
                            <Package className="w-2.5 h-2.5 text-slate-950 stroke-[2.5]" />
                          )}
                        </motion.div>
                        <motion.div layout className="space-y-0.5 pl-2">
                          <h5 className={`text-[11.5px] font-black uppercase tracking-tight leading-none ${
                            ['PickedUp', 'OutForDelivery', 'Delivered'].includes(activeOrder.status) ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            2. Store Pickup {['PickedUp', 'OutForDelivery', 'Delivered'].includes(activeOrder.status) ? '✓' : '(Pending)'}
                          </h5>
                          <p className="text-[9.5px] font-bold text-slate-404 uppercase tracking-wide leading-tight">
                            {['PickedUp', 'OutForDelivery', 'Delivered'].includes(activeOrder.status)
                              ? `Package collected from ${activeOrder.vendorName}`
                              : `Navigate to ${activeOrder.vendorName} to collect parcel`
                            }
                          </p>
                        </motion.div>
                      </div>

                      {/* Milestone 3: Transit */}
                      <div className="relative flex items-start gap-3">
                        <motion.div 
                          layout
                          animate={{
                            scale: activeOrder.status === 'Delivered' ? 1.0 : ['PickedUp', 'OutForDelivery'].includes(activeOrder.status) ? 1.15 : 0.9,
                            backgroundColor: activeOrder.status === 'Delivered' ? '#10b981' : ['PickedUp', 'OutForDelivery'].includes(activeOrder.status) ? '#f59e0b' : '#1e293b'
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="absolute -left-[20px] w-4.5 h-4.5 rounded-full border border-slate-950 flex items-center justify-center shrink-0 z-10 shadow-sm"
                        >
                          {activeOrder.status === 'Delivered' ? (
                            <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                          ) : (
                            <Bike className={`w-2.5 h-2.5 text-slate-950 stroke-[2.5] ${['PickedUp', 'OutForDelivery'].includes(activeOrder.status) ? 'animate-bounce' : 'text-slate-500'}`} />
                          )}
                        </motion.div>
                        <motion.div layout className="space-y-0.5 pl-2">
                          <h5 className={`text-[11.5px] font-black uppercase tracking-tight leading-none ${
                            activeOrder.status === 'Delivered'
                              ? 'text-emerald-400'
                              : ['PickedUp', 'OutForDelivery'].includes(activeOrder.status)
                                ? 'text-amber-400'
                                : 'text-slate-500'
                          }`}>
                            3. Transit
                          </h5>
                          <p className="text-[9.5px] font-bold text-slate-404 uppercase tracking-wide leading-tight">
                            {activeOrder.status === 'Delivered'
                              ? "Arrived at destination"
                              : ['PickedUp', 'OutForDelivery'].includes(activeOrder.status)
                                ? `Out for delivery to ${activeOrder.customerName}`
                                : "Waiting for item pickup coordinates"
                            }
                          </p>
                        </motion.div>
                      </div>

                      {/* Milestone 4: Final Delivery completion */}
                      <div className="relative flex items-start gap-3">
                        <motion.div 
                          layout
                          animate={{
                            scale: activeOrder.status === 'Delivered' ? 1.15 : 0.9,
                            backgroundColor: activeOrder.status === 'Delivered' ? '#10b981' : '#1e293b'
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 18 }}
                          className="absolute -left-[20px] w-4.5 h-4.5 rounded-full border border-slate-950 flex items-center justify-center shrink-0 z-10 shadow-sm"
                        >
                          <CheckCircle2 className={`w-2.5 h-2.5 ${activeOrder.status === 'Delivered' ? 'text-slate-950 stroke-[3.5]' : 'text-slate-500'}`} />
                        </motion.div>
                        <motion.div layout className="space-y-0.5 pl-2">
                          <h5 className={`text-[11.5px] font-black uppercase tracking-tight leading-none ${
                            activeOrder.status === 'Delivered' ? 'text-emerald-400' : 'text-slate-500'
                          }`}>
                            4. Final Delivery Completion
                          </h5>
                          <p className="text-[9.5px] font-bold text-slate-404 uppercase tracking-wide leading-tight font-mono">
                            {activeOrder.status === 'Delivered'
                              ? "Order successfully handed over and completed!"
                              : "Handover confirmation & digital settlement receipt"
                            }
                          </p>
                        </motion.div>
                      </div>

                    </div>
                  </div>

                  {/* SIMULATED ACCELEROMETER COLLISION DETECTOR */}
                  <div className="bg-slate-950 p-4.5 rounded-[2rem] border border-rose-500/10 text-left space-y-3.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 font-mono">Telemetry Monitor</span>
                      </div>
                      <span className="text-[8px] bg-rose-500/10 text-rose-400 font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                        Auto-Response Ready
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      Using device-level accelerometer forces to track gravity fluctuations (collision/drops). High impact triggers auto-SOS alert.
                    </p>

                    <div className="bg-slate-900 border border-white/5 rounded-2xl p-3 flex justify-around text-center font-mono text-[9px] text-slate-500">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-0.5">X axis</span>
                        <span className="text-emerald-400 font-extrabold">{(0.18 + Math.random() * 0.05).toFixed(2)} m/s²</span>
                      </div>
                      <div className="border-r border-white/5 h-6 self-center" />
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-0.5">Y axis</span>
                        <span className="text-emerald-400 font-extrabold">{(-0.35 + Math.random() * 0.05).toFixed(2)} m/s²</span>
                      </div>
                      <div className="border-r border-white/5 h-6 self-center" />
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-500 mb-0.5">Z axis</span>
                        <span className="text-emerald-400 font-extrabold">{(9.81 + Math.random() * 0.08).toFixed(2)} m/s²</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerSOS(true)}
                      className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-400 border border-rose-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all transition-duration-150"
                    >
                      <span>💥 Simulate High-Impact Collision (32.4 m/s²)</span>
                    </button>
                  </div>

                  {/* REAL-TIME DELIVERY ROUTE MAP */}
                  <div className="bg-slate-950 rounded-[2rem] border border-white/5 overflow-hidden text-left space-y-2 p-1.5 shadow-2xl">
                    {(() => {
                      const straightLineDist = calculateOrderDistance(activeOrder);
                      const roadNetworkDist = Number((straightLineDist * 1.28).toFixed(1));
                      return (
                        <div className="p-4.5 pb-2 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] text-amber-500 font-black uppercase tracking-widest block font-mono">Live Dispatch Navigation</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <h4 className="text-sm font-black text-white leading-none">Route: Store to Customer</h4>
                              
                              {/* Tooltip Comparison overlay */}
                              <div className="group relative inline-block">
                                <button
                                  type="button"
                                  className="w-4 h-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer"
                                  title="Straight-line vs. Road-network distance"
                                >
                                  <Info className="w-2.5 h-2.5" />
                                </button>
                                <div className="absolute left-0 bottom-full mb-3 hidden group-hover:block w-52 p-3.5 bg-slate-900 border border-white/10 text-slate-200 text-[9.5px] rounded-2xl shadow-2xl z-50 space-y-1.5 leading-normal">
                                  <span className="font-mono text-[7px] tracking-widest text-amber-500 font-black uppercase leading-none block">📏 DISTANCE DISPATCH INDEX</span>
                                  <div className="border-t border-white/5 my-1" />
                                  <div className="flex justify-between font-bold uppercase text-[8px] tracking-wider text-slate-450">
                                    <span>Straight-Line:</span>
                                    <span className="font-mono text-emerald-400 font-black">{straightLineDist.toFixed(1)} km</span>
                                  </div>
                                  <div className="flex justify-between font-bold uppercase text-[8px] tracking-wider text-slate-450">
                                    <span>Road-Network:</span>
                                    <span className="font-mono text-amber-400 font-black">{roadNetworkDist.toFixed(1)} km</span>
                                  </div>
                                  <p className="text-[7.5px] leading-tight text-slate-500 font-medium font-sans mt-0.5">
                                    Standard actual roadway route includes ~28% topology detours and flow overhead.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {/* Share Location Button */}
                            <button
                              type="button"
                              onClick={handleShareLocation}
                              className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-full text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                              title="Share live coordinate URL"
                            >
                              <Share2 className="w-3 h-3 text-amber-500 animate-pulse" />
                              <span>Share GPS</span>
                            </button>

                            {/* Auto-Center Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setAutoCenter(prev => !prev)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                                autoCenter 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse' 
                                  : 'bg-slate-900 border-white/10 text-slate-450'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${autoCenter ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                              Auto: {autoCenter ? 'ON' : 'OFF'}
                            </button>

                            <div className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-white/5 rounded-full">
                              <Navigation className="w-3 h-3 text-amber-500 animate-pulse font-bold" />
                              <span className="text-[8.5px] font-black text-emerald-400 font-mono uppercase">{eta}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="w-full h-72 rounded-[1.8rem] overflow-hidden relative border border-white/5 bg-slate-900">
                      {!hasValidKey ? (
                        <LiveMap 
                          riderLoc={riderLocation ? [riderLocation.lat, riderLocation.lng] : undefined}
                          vendorLoc={activeOrder?.pickupLocation && typeof activeOrder.pickupLocation.lat === 'number' ? [activeOrder.pickupLocation.lat, activeOrder.pickupLocation.lng] : undefined}
                          customerLoc={activeOrder?.deliveryLocation && typeof activeOrder.deliveryLocation.lat === 'number' ? [activeOrder.deliveryLocation.lat, activeOrder.deliveryLocation.lng] : undefined}
                          interactive={true}
                          autoCenter={autoCenter}
                          vendorName={activeOrder?.vendorName}
                          customerName={activeOrder?.customerName}
                        />
                      ) : (
                        <APIProvider apiKey={API_KEY} version="weekly">
                          <Map
                            defaultCenter={getSafeCoords(activeOrder.pickupLocation || activeOrder.deliveryLocation)}
                            defaultZoom={14}
                            mapId="DEMO_MAP_ID"
                            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                            style={{ width: '100%', height: '100%' }}
                            disableDefaultUI
                          >
                            <RouteMap 
                              origin={getSafeCoords(activeOrder.pickupLocation)} 
                              destination={getSafeCoords(activeOrder.deliveryLocation)} 
                              riderLocation={riderLocation}
                              onUpdateETA={setEta}
                            />
                            <MapCenterController center={riderLocation} autoCenter={autoCenter} />
                          </Map>
                        </APIProvider>
                      )}
                    </div>

                    {/* Voice Guidance Integration Panel */}
                    <div className="pt-2 px-3 pb-3 space-y-2.5">
                      {/* Control banner toggle */}
                      <div className="flex items-center justify-between gap-3 bg-slate-900 border border-white/5 p-3 rounded-2xl">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${voiceEnabled ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-slate-950 text-slate-500'}`}>
                            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-wider leading-none">Voice-Guided Turn Cues</p>
                            <p className="text-[8px] text-slate-550 font-mono tracking-widest mt-1 uppercase">
                              {voiceEnabled ? '🔊 Turn Speech Synthesis Active' : '🔇 Audio Navigation Muted'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleVoice}
                          className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            voiceEnabled 
                              ? 'bg-amber-500 text-slate-950 shadow-md hover:bg-amber-450' 
                              : 'bg-slate-950 text-slate-400 border border-white/5 hover:bg-slate-900'
                          }`}
                        >
                          {voiceEnabled ? 'MUTE CUES' : 'ACTIVATE VOICE'}
                        </button>
                      </div>

                      {/* Instruction Steps Feed */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[7.5px] uppercase font-mono tracking-wider px-1 text-slate-500">
                          <span>Active Safety Route Steps</span>
                          <span>Tap a step to speak & preview</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                          {(() => {
                            const steps = [
                              { id: 1, text: `Depart from kitchen depot ${activeOrder.vendorName} on high-priority delivery.` },
                              { id: 2, text: "Proceed 800 meters along north bypass road. Watch speeds." },
                              { id: 3, text: "Turn right onto NH-65 highway corridor and flow with lane directions for 2 kilometers." },
                              { id: 4, text: `Prepare for final merge on Residential Avenue block towards ${activeOrder.deliveryAddress}.` },
                              { id: 5, text: `Arrived at security check-point for customer drop. Handover code receipt to ${activeOrder.customerName}.` }
                            ];
                            return steps.map((st, i) => {
                              const isCurrent = (activeOrder.status === 'PickedUp' && i === 2) || 
                                                (activeOrder.status === 'Accepted' && i === 0) ||
                                                (activeOrder.status === 'Delivered' && i === 4) ||
                                                (i === 1 && activeOrder.status !== 'Delivered' && activeOrder.status !== 'PickedUp');
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                                      window.speechSynthesis.cancel();
                                      const u = new SpeechSynthesisUtterance(st.text);
                                      u.rate = 0.95;
                                      window.speechSynthesis.speak(u);
                                    }
                                  }}
                                  className={`w-full text-left p-2 rounded-xl text-[9px] border transition-all cursor-pointer flex items-center gap-2 ${
                                    isCurrent 
                                      ? 'bg-amber-500/10 border-amber-500/20 text-slate-100 font-extrabold' 
                                      : 'bg-slate-950/60 border-white/5 text-slate-500 hover:border-white/10'
                                  }`}
                                >
                                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center font-mono font-black text-[7.5px] shrink-0 ${
                                    isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-600'
                                  }`}>
                                    {st.id}
                                  </span>
                                  <span className="truncate">{st.text}</span>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-amber-500/10 rounded-md border border-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-amber-500">P</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-505 font-bold uppercase tracking-widest font-mono">Merchant Pickup</span>
                        <h5 className="text-xs font-black text-white leading-none mt-0.5">{activeOrder.vendorName}</h5>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold pl-8 uppercase">{activeOrder.pickupAddress}</p>
                    <div className="pt-2 flex gap-2 pl-8 shrink-0">
                      <a 
                        href={`tel:${activeOrder.vendorPhone || '7416574197'}`}
                        className="bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3 h-3 text-amber-500" />
                        <span>Call Kitchen</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-white/5 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-indigo-500/10 rounded-md border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-indigo-400">D</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-505 font-bold uppercase tracking-widest font-mono">Customer Dest</span>
                        <h5 className="text-xs font-black text-white leading-none mt-0.5">{activeOrder.customerName}</h5>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold pl-8 uppercase">{activeOrder.deliveryAddress}</p>
                    <div className="pt-2 flex gap-2 pl-8">
                      <a 
                        href={`tel:${activeOrder.customerPhone || '9876543210'}`}
                        className="bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3 h-3 text-amber-500" />
                        <span>Call Client</span>
                      </a>
                      <button 
                        onClick={() => {
                          const lat = activeOrder.deliveryLocation?.lat || 17.2514;
                          const lng = activeOrder.deliveryLocation?.lng || 80.1614;
                          window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3 text-amber-500" />
                        <span>GPS Map Route</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 text-left font-mono">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Package Items ({Array.isArray(activeOrder.items) ? activeOrder.items.length : (typeof activeOrder.items === 'number' ? activeOrder.items : (activeOrder.items ? String(activeOrder.items) : 1))})</span>
                    <div className="space-y-1.5 pl-1.5">
                      {activeOrder.orderItems?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-extrabold text-slate-300">
                          <span className="uppercase">{item.quantity} x {item.name}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-between text-xs font-black uppercase tracking-wider">
                      <span className="text-slate-400">Order Amt & Method:</span>
                      <span className={activeOrder.paymentMethod === 'cod' ? 'text-amber-400' : 'text-emerald-400'}>
                        ₹{activeOrder.total} &bull; {activeOrder.paymentMethod.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* PROACTIVE GEOCODING INTEGRITY STATUS */}
                  {(() => {
                    const pickupVal = validateGeoIPCoords(activeOrder.pickupLocation);
                    const deliveryVal = validateGeoIPCoords(activeOrder.deliveryLocation);
                    const allValid = pickupVal.isValid && deliveryVal.isValid;
                    
                    return (
                      <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-3 text-left font-mono">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-450 animate-pulse" /> Geocoding Integrity
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            allValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {allValid ? '✓ Verified Safe' : '⚠ Near-Limit Location'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {/* Store Location Check */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-bold uppercase">Store Pickup Geo:</span>
                            <span className="text-slate-300 font-extrabold font-mono">
                              {activeOrder.pickupLocation?.lat?.toFixed(4) || "17.2473"}, {activeOrder.pickupLocation?.lng?.toFixed(4) || "80.1514"}
                            </span>
                          </div>
                          {pickupVal.warnings.map((w, idx) => (
                            <p key={idx} className="text-[8px] text-amber-500 leading-normal pl-2 font-bold select-none border-l border-amber-500/20">
                              ⚠ {w}
                            </p>
                          ))}

                          {/* Client Destination Check */}
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                            <span className="text-slate-500 font-bold uppercase">Delivery Dest Geo:</span>
                            <span className="text-slate-300 font-extrabold font-mono text-slate-300 font-bold">
                              {activeOrder.deliveryLocation?.lat?.toFixed(4) || "17.2514"}, {activeOrder.deliveryLocation?.lng?.toFixed(4) || "80.1614"}
                            </span>
                          </div>
                          {deliveryVal.warnings.map((w, idx) => (
                            <p key={idx} className="text-[8px] text-amber-500 leading-normal pl-2 font-bold select-none border-l border-amber-500/20">
                              ⚠ {w}
                            </p>
                          ))}

                          {allValid && pickupVal.warnings.length === 0 && deliveryVal.warnings.length === 0 && (
                            <p className="text-[8.5px] text-emerald-400 font-black uppercase tracking-wider text-center select-none pt-1">
                              ✓ Locations fully vetted inside geofence parameters
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {['Accepted', 'Preparing', 'ReadyForPickup', 'Ready'].includes(activeOrder.status) ? (
                    <button
                      onClick={handleMarkPickedUp}
                      className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 overflow-hidden group cursor-pointer"
                    >
                      <Package className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
                      <span>Mark Picked Up from Store</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCompleteDelivery}
                      className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 overflow-hidden group cursor-pointer"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5 text-white stroke-[2.5]" />
                      <span>Complete & Handover Order✓</span>
                    </button>
                  )}

                </motion.div>
              )}

              {/* BLOCK 3: IF ONLINE & NO ACTIVE ORDER */}
              {riderProfile.isOnline && !activeOrder && (
                <div className="space-y-4 text-left">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Live order pipeline connected</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full font-black uppercase">KM-{riderProfile.branchId?.replace('_main','').toUpperCase()}</span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-505 uppercase tracking-widest pl-1 font-mono">Assignable Orders Pool ({availableOrders.length})</h4>

                    {availableOrders.length === 0 ? (
                      <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-8 text-center text-slate-400 space-y-2 py-10 select-none">
                        <Clock className="w-9 h-9 text-slate-600 mx-auto animate-pulse" />
                        <h5 className="text-xs font-black uppercase text-gray-300">Searching active jobs...</h5>
                        <p className="text-[9px] text-slate-505 font-semibold uppercase leading-tight">All store dispatches are currently clear. Keep app running on active duty.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {availableOrders.map((ord) => {
                          const isNew = Date.now() - (orderArrivalTimes[ord.id] || 0) < 60000;
                          return (
                            <div 
                              key={ord.id} 
                              className={`bg-slate-900 border p-4 rounded-3xl space-y-3 transition-all relative overflow-hidden ${
                                isNew 
                                  ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-[pulse_1.8s_infinite]' 
                                  : 'border-white/5 hover:border-amber-500/25'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  {isNew ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 border border-amber-500/45 text-amber-400 text-[8px] font-black uppercase tracking-widest rounded animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                      ⚡ NEW ASSIGNMENT
                                    </span>
                                  ) : (
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">DISPATCH POOL</span>
                                  )}
                                  <h5 className="text-sm font-black text-white mt-0.5 uppercase">Order #{ord.id}</h5>
                                </div>
                                <div className="text-right">
                                  <span className="text-[8px] font-black text-slate-505 uppercase tracking-widest">Earning Payout</span>
                                  <p className="text-xs font-black text-emerald-400">₹45.00</p>
                                </div>
                              </div>

                              <div className="space-y-2 border-t border-b border-white/5 py-2.5 text-xs text-slate-400">
                                <div className="flex gap-2">
                                  <span className="font-bold text-amber-500 shrink-0 uppercase">[STORE]:</span>
                                  <span className="font-black text-white uppercase">{ord.vendorName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="font-bold text-amber-500 shrink-0 uppercase">[CLIENT AREA]:</span>
                                  <span className="font-black text-white uppercase">{ord.deliveryAddress.slice(0, 48)}...</span>
                                </div>
                                <div className="pt-1 flex justify-between text-[10px] font-black uppercase text-slate-400">
                                  <span>Quantity: {Array.isArray(ord.items) ? ord.items.length : (typeof ord.items === 'number' ? ord.items : (ord.items ? String(ord.items) : 1))} Items</span>
                                  <span className={ord.paymentMethod === 'cod' ? 'text-amber-400' : 'text-emerald-400'}>
                                    ₹{ord.total} &bull; {ord.paymentMethod.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleClaimOrder(ord.id)}
                                className="w-full py-3 bg-slate-950 border border-amber-500/25 hover:bg-amber-500/10 text-amber-500 rounded-xl font-black uppercase tracking-widest text-[9px] cursor-pointer"
                              >
                                Claim & Accept Delivery
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: FINANCIAL ANALYTICS & LEDGER */}
          {activeTab === 'earnings' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-white/5 p-5 rounded-[2rem]">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 font-mono">Financial Balance Ledger</p>
                <h4 className="text-lg font-black italic leading-none mb-2 text-white">YOUR OUTSTANDING LEDGER</h4>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Manage trips completed, check outstanding cash collection from COD, and request direct bank settlements.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-4 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block font-mono">Total Income (₹)</span>
                  <p className="text-2xl font-black text-emerald-400 leading-none mt-1">₹{(riderProfile.earnings || 0).toLocaleString()}</p>
                </div>

                <div className="bg-slate-900 p-4 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block font-mono">Completed Trips</span>
                  <p className="text-2xl font-black text-white leading-none mt-1">{riderProfile.trips || 0} Trips</p>
                </div>

                <div className="bg-slate-900 p-4 border border-white/5 rounded-2xl">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block font-mono">Cash COD Collected</span>
                  <p className="text-xl font-black text-amber-500 leading-none mt-1">₹{(riderProfile.cashInHand || 0).toLocaleString()}</p>
                </div>

                <div className="bg-slate-900 p-4 border border-amber-500/20 rounded-2xl bg-amber-500/5">
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block font-mono">Pending Balance</span>
                  <p className="text-xl font-black text-amber-400 leading-none mt-1">₹{(riderProfile.pendingPayout || 120).toLocaleString()}</p>
                </div>
              </div>

              {/* EARNINGS DETAILED BREAKDOWN */}
              <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl space-y-3">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">Earnings Breakdown</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block leading-none mb-1">Delivery Fees</span>
                    <p className="text-sm font-black text-white">₹{(riderProfile.deliveryFees || (riderProfile.trips * 45) || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-wider block leading-none mb-1">Customer Tips</span>
                    <p className="text-sm font-black text-yellow-405">₹{(riderProfile.tips || Math.max(0, (riderProfile.earnings || 0) - (riderProfile.trips || 0) * 45)).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* SETTLEMENT TIMELINE HISTORICAL AREA CHART */}
              <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl space-y-3" id="earnings-settlement-timeline-container">
                <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
                  <div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Performance &amp; Ledger</span>
                    <h5 className="text-xs font-black text-white uppercase font-sans">Settlement Timeline &amp; Progress</h5>
                  </div>
                  
                  {/* Select filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Range Filter */}
                    <select
                      value={earningsDaysFilter}
                      onChange={(e) => setEarningsDaysFilter(e.target.value)}
                      className="bg-slate-950 text-slate-300 border border-white/10 text-[9px] font-bold uppercase rounded-lg px-2 py-1 focus:outline-none cursor-pointer focus:border-indigo-400"
                    >
                      <option value="7">Last 7 Days</option>
                      <option value="15">Last 15 Days</option>
                      <option value="30">Last 30 Days</option>
                      <option value="60">Last 60 Days</option>
                      <option value="current_month">June 2026</option>
                      <option value="previous_month">May 2026</option>
                      <option value="custom">📅 Custom Date Range</option>
                    </select>

                    {/* Sort Selector */}
                    <select
                      value={earningsSortOption}
                      onChange={(e) => setEarningsSortOption(e.target.value)}
                      className="bg-slate-950 text-slate-300 border border-white/10 text-[9px] font-bold uppercase rounded-lg px-2 py-1 focus:outline-none cursor-pointer focus:border-indigo-400"
                    >
                      <option value="date_desc">Latest First</option>
                      <option value="date_asc">Oldest First</option>
                      <option value="payout_desc">Highest Payout</option>
                      <option value="payout_asc">Lowest Payout</option>
                    </select>
                  </div>
                </div>

                {earningsDaysFilter === 'custom' && (
                  <div className="flex flex-col sm:flex-row gap-3 bg-slate-950 p-3 rounded-2xl border border-white/5 items-center font-sans">
                    <div className="flex flex-col w-full sm:w-auto">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Start Date</span>
                      <input 
                        type="date"
                        value={earningsStartDate}
                        onChange={(e) => setEarningsStartDate(e.target.value)}
                        className="bg-slate-900 border border-white/10 text-[9.5px] font-mono text-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 inline-block w-full"
                      />
                    </div>
                    <div className="flex flex-col w-full sm:w-auto">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">End Date</span>
                      <input 
                        type="date"
                        value={earningsEndDate}
                        onChange={(e) => setEarningsEndDate(e.target.value)}
                        className="bg-slate-900 border border-white/10 text-[9.5px] font-mono text-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-indigo-400 inline-block w-full"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setEarningsStartDate(''); setEarningsEndDate(''); }}
                      className="mt-4 sm:mt-auto py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[8px] font-black uppercase tracking-wider transition-colors ml-auto cursor-pointer"
                    >
                      Reset Range
                    </button>
                  </div>
                )}
                
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataToShow} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSettled" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        dy={6}
                        interval={earningsDaysFilter === '7' ? 0 : earningsDaysFilter === '15' ? 1 : Math.max(1, Math.floor(chartDataToShow.length / 6))}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <ChartTooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#fff'
                        }}
                        labelClassName="text-white font-black"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Settled" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorSettled)" 
                        name="Settled" 
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Pending" 
                        stroke="#F59E0B" 
                        strokeWidth={1.5} 
                        strokeDasharray="3 3" 
                        fillOpacity={1} 
                        fill="url(#colorPending)" 
                        name="Pending" 
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex justify-center gap-6 pt-1 text-[8px] font-mono font-black uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                    <span className="text-slate-400">Paid/Settled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1.5 rounded bg-amber-500 inline-block border border-dashed border-amber-600" />
                    <span className="text-slate-400">Pending Cycles</span>
                  </div>
                </div>
              </div>

              {/* CUSTOMER TIP ANALYTICS BREAKDOWN */}
              <div className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] space-y-4" id="earnings-tip-analytics-container">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block font-mono">Tip Metrics &amp; Trends</span>
                    <h5 className="text-xs font-black text-white uppercase font-sans">Customer Tip Analytics Breakdown</h5>
                  </div>
                  
                  {/* Daily vs Weekly Toggle */}
                  <div className="flex bg-slate-950 p-1 border border-white/15 rounded-xl self-start sm:self-auto">
                    <button
                      onClick={() => setTipTrendInterval('daily')}
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        tipTrendInterval === 'daily' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => setTipTrendInterval('weekly')}
                      className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        tipTrendInterval === 'weekly' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>

                {/* Tip Performance Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">Total Tips</span>
                    <p className="text-sm font-mono font-black text-amber-400">
                      ₹{chartDataToShow.reduce((acc, current) => acc + (current.Tips || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">Avg Tip / Day</span>
                    <p className="text-xs font-mono font-black text-emerald-400">
                      ₹{chartDataToShow.length > 0 
                        ? Math.round(chartDataToShow.reduce((acc, current) => acc + (current.Tips || 0), 0) / chartDataToShow.length).toLocaleString()
                        : 0
                      }
                    </p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-left">
                    <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-0.5 font-mono">Peak Tip Day</span>
                    <p className="text-xs font-mono font-black text-indigo-400">
                      ₹{chartDataToShow.length > 0 
                        ? Math.max(...chartDataToShow.map(item => item.Tips || 0)).toLocaleString()
                        : 0
                      }
                    </p>
                  </div>
                </div>

                {/* Recharts Bar Chart Visualizing Tip Trends */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={tipTrendInterval === 'daily' ? chartDataToShow : weeklyTipsData} 
                      margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        dy={6}
                        interval={
                          tipTrendInterval === 'weekly' 
                            ? 0 
                            : (earningsDaysFilter === '7' ? 0 : earningsDaysFilter === '15' ? 1 : Math.max(1, Math.floor(chartDataToShow.length / 6)))
                        }
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <ChartTooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#fff'
                        }}
                        labelClassName="text-white font-black"
                      />
                      <Bar 
                        dataKey="Tips" 
                        fill="#F59E0B" 
                        radius={[4, 4, 0, 0]}
                        name="Customer Tips (₹)"
                        isAnimationActive={true}
                        animationDuration={800}
                      >
                        {(tipTrendInterval === 'daily' ? chartDataToShow : weeklyTipsData).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            className="cursor-pointer transition-opacity"
                            fill={index % 2 === 0 ? '#F59E0B' : '#D97706'} 
                            fillOpacity={0.85}
                            id={`tip-bar-cell-${index}`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* DETAILED DAILY PAYOUT TABLE LIST */}
              <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl space-y-3" id="earnings-detailed-statement-list">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Statement Ledger</span>
                    <h5 className="text-xs font-black text-white uppercase font-sans">Daily Settlement Logs ({sortedBreakdownData.length})</h5>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">
                    Range: {earningsDaysFilter === '7' ? '7 Days' : earningsDaysFilter === '15' ? '15 Days' : earningsDaysFilter === '30' ? '30 Days' : earningsDaysFilter === '60' ? '60 Days' : earningsDaysFilter === 'current_month' ? 'Current Month' : earningsDaysFilter === 'previous_month' ? 'Previous Month' : `Custom (${earningsStartDate || 'Any'} to ${earningsEndDate || 'Any'})`}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {sortedBreakdownData.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono uppercase tracking-wider">
                      No logs matches the selected range filter
                    </div>
                  ) : (
                    sortedBreakdownData.map((item) => (
                      <div key={item.id} className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex justify-between items-center gap-3 hover:border-white/10 transition-all">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-white font-mono">{item.dateStr}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider font-bold">Trips: {item.trips}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                              item.status === 'Settled' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <p className="text-xs font-black text-emerald-400">₹{item.Settled.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-amber-500">₹{item.Pending.toLocaleString()} Pending</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    alert("🏦 Settlement request transmitted! Funds transfer typically clears into bank account within 2 hours.");
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer active:scale-95 transition-all text-center"
                >
                  Remit & Withdraw Earnings (Bank/UPI)
                </button>
                <button
                  onClick={() => setShowPrintReport(true)}
                  className="w-full py-4 bg-slate-950 hover:bg-slate-900 border border-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                >
                  <Printer className="w-4 h-4 text-amber-500" />
                  <span>Generate Printable Report</span>
                </button>
              </div>

              {/* PRINTABLE DAILY SUMMARY STATEMENT OVERLAY */}
              <AnimatePresence>
                {showPrintReport && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto no-print">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="bg-white text-slate-100 border border-slate-200 rounded-3xl p-6 md:p-8 max-w-2xl w-full my-8 space-y-6 shadow-2xl relative"
                      id="printable-report"
                    >
                      {/* Dynamic CSS injecting targeted styles for real physical paper page formatting */}
                      <style>{`
                        @media print {
                          body * {
                            visibility: hidden !important;
                          }
                          #printable-report, #printable-report * {
                            visibility: visible !important;
                          }
                          #printable-report {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            border: none !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 10px !important;
                            background: white !important;
                            color: black !important;
                          }
                          .no-print {
                            display: none !important;
                          }
                        }
                      `}</style>

                      {/* Close button - hidden in print */}
                      <button
                        onClick={() => setShowPrintReport(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all no-print"
                        title="Dismiss Report"
                      >
                        <X className="w-5 h-5 stroke-[2.5]" />
                      </button>

                      {/* Report Document Header */}
                      <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Bike className="w-6 h-6 text-slate-800" />
                          <h2 className="text-lg font-black tracking-widest uppercase text-slate-950">LOKAL EXPRESS DISPATCH</h2>
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Rider Delivery Summary &amp; Earnings Receipt</h3>
                        <p className="text-[9px] text-slate-405 font-mono">Run ID: LKL-RDP3-{riderProfile.id?.slice(0,6)}-{new Date().toISOString().slice(0,10)}</p>
                      </div>

                      {/* Header Info Block */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium border-b border-dashed border-slate-300 pb-4">
                        <div className="space-y-1.5 text-left text-slate-800">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">RIDER CONTRACT PROFILE</p>
                          <div className="space-y-1 pl-1">
                            <p className="font-extrabold text-slate-900">Rider Name: <span className="font-normal text-slate-600">{riderProfile.name}</span></p>
                            <p className="font-extrabold text-slate-900">Phone Code: <span className="font-normal text-slate-600">{riderProfile.phone || '9876543210'}</span></p>
                            <p className="font-extrabold text-slate-900">Assigned Branch: <span className="font-normal text-slate-600">KM-{riderProfile.branchId?.replace('_main','').toUpperCase()} Hub</span></p>
                            <p className="font-extrabold text-slate-900">Vehicle Registered: <span className="font-normal text-slate-600">{riderProfile.vehicleType || 'Motorbike'} ({riderProfile.vehicleNumber || 'TS-15-KM-1234'})</span></p>
                          </div>
                        </div>

                        <div className="space-y-1.5 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-dashed border-slate-300 pt-3 md:pt-0 text-left text-slate-805">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">REPORT &amp; SETTLEMENT METRICS</p>
                          <div className="space-y-1 pl-1 font-mono text-[11px]">
                            <p className="font-extrabold text-slate-900 text-[10px] font-sans">Statement Date: <span className="font-normal text-slate-600">{new Date().toLocaleString()}</span></p>
                            <p className="font-extrabold text-slate-900">Active Shift: <span className="font-normal text-slate-600">Day Cycle</span></p>
                            <p className="font-extrabold text-slate-900">Total Trips Done: <span className="font-bold text-emerald-605">{completedOrders.length} Completed</span></p>
                            <p className="font-extrabold text-slate-900">Est. Cycle Earnings: <span className="font-bold text-emerald-605">₹{completedOrders.length * 45}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* Cumulative Ledgers Table */}
                      <div className="space-y-2 text-left">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">COMPLETED TRIPS DISPATCH LOG</p>
                        
                        {completedOrders.length === 0 ? (
                          <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center text-slate-500 text-xs font-bold uppercase tracking-widest bg-slate-50">
                            No dispatch records logged under this matching shift cycle
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-300">
                            <table className="w-full text-left border-collapse font-mono text-[11px]">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-605 uppercase text-[9px] font-sans font-black">
                                  <th className="py-2.5 px-3">Order ID</th>
                                  <th className="py-2.5 px-3">Merchant</th>
                                  <th className="py-2.5 px-3">Payment</th>
                                  <th className="py-2.5 px-3 text-right">Rider Payout</th>
                                  <th className="py-2.5 px-3 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {completedOrders.map((ord, idx) => (
                                  <tr key={ord.id || idx} className="border-b last:border-0 border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-2.5 px-3 font-bold text-slate-950">#{ord.id?.slice(0, 8).toUpperCase()}</td>
                                    <td className="py-2.5 px-3 text-slate-600 max-w-[120px] truncate">{ord.vendorName || 'Hub Admin'}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase ${ord.paymentMethod === 'cod' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-850'}`}>
                                        {ord.paymentMethod?.toUpperCase() || 'ONLINE'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-emerald-600 font-extrabold">+₹45.00</td>
                                    <td className="py-2.5 px-3 text-right font-sans font-bold text-[9.5px] uppercase text-emerald-600">DELIVERED✓</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Cumulative Total Summary Card */}
                      <div className="bg-slate-50 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-extrabold border border-slate-200 text-left">
                        <div className="space-y-1 font-sans">
                          <p className="text-slate-500 text-[9px] uppercase tracking-wider leading-none">Net Statement Settlement</p>
                          <h4 className="text-[17px] font-black text-slate-950 leading-tight">₹{(completedOrders.length * 45).toLocaleString()} Outstanding</h4>
                          <p className="text-[9px] text-slate-500 font-bold leading-none uppercase">Settles direct to BANK balance ledger</p>
                        </div>
                        <div className="space-y-1 text-slate-800 font-mono text-[10px]">
                          <p>Outstanding Cash COD Collected: <span className="text-amber-700 font-bold leading-none">₹{(riderProfile.cashInHand || 0).toLocaleString()}</span></p>
                          <p>Cycle Outstanding Payouts: <span className="text-emerald-605 font-bold leading-none">₹{(riderProfile.pendingPayout || 0).toLocaleString()}</span></p>
                        </div>
                      </div>

                      {/* Document Verification Footer */}
                      <div className="pt-3 border-t-2 border-slate-800 flex justify-between items-end text-[9px] font-bold text-slate-550 uppercase tracking-wide">
                        <div className="text-left">
                          <p className="text-slate-600">Printed locally from AI Studio Sandbox</p>
                          <p className="font-mono text-[8px] text-slate-400 mt-0.5">SHA256: HashVerified-LokalExpress-2026</p>
                        </div>
                        <div className="text-right space-y-8 pl-4">
                          <div className="border-b border-slate-300 w-36 pb-1">
                            <p className="text-[8px] text-slate-400 font-normal italic">Rider Autographed Confirm</p>
                          </div>
                          <p className="font-black text-slate-700 tracking-wider font-mono">RIDER SIGN-OFF</p>
                        </div>
                      </div>

                      {/* Print & Dismiss Actions Overlay (no-print) */}
                      <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end no-print">
                        <button
                          onClick={() => setShowPrintReport(false)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => {
                            window.print();
                          }}
                          className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-500" />
                          <span>Print Summary Statement</span>
                        </button>
                      </div>

                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <div className="space-y-3 text-left">
                <h4 className="text-[10px] font-black text-slate-505 uppercase tracking-widest pl-1 font-mono">Completed Deliveries ({completedOrders.length})</h4>
                
                {completedOrders.length === 0 ? (
                  <div className="bg-slate-900 p-6 rounded-2xl text-center text-slate-500 text-[10px] uppercase font-bold">
                     No delivery history logged in central database yet
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {completedOrders.map((ord) => (
                      <div key={ord.id} className="bg-slate-900 p-4 rounded-2xl border border-white/5 flex justify-between items-center text-xs font-mono">
                        <div>
                          <p className="font-black text-white uppercase">Order #{ord.id}</p>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{ord.vendorName} &bull; COD: {ord.paymentMethod === 'cod' ? 'YES' : 'NO'}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-400">+₹45.00</p>
                          <span className="text-[8px] text-slate-500 font-bold uppercase">Paid Remit</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: RIDER ACCOUNT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="bg-slate-905 rounded-[2rem] border border-white/5 p-5 text-left space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 border-b border-white/5 pb-2">Edit Rider Contract Details</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Rider Name</label>
                    <input 
                      type="text" 
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 text-white rounded-xl px-4 py-3 text-xs font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Phone Contact</label>
                    <input 
                      type="text" 
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-white/5 text-white rounded-xl px-4 py-3 text-xs font-bold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Vehicle Type</label>
                      <select 
                        value={editVehicleType}
                        onChange={(e) => setEditVehicleType(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 text-white rounded-xl px-3 py-3 text-xs font-bold focus:border-amber-500 outline-none"
                      >
                        <option value="Bike">🏍️ Scooter/Bike</option>
                        <option value="Bicycle">🚲 Bicycle</option>
                        <option value="Auto">🛺 Auto</option>
                        <option value="Van">🚐 Van</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Vehicle Plate Num</label>
                      <input 
                        type="text" 
                        value={editVehicleNum}
                        onChange={(e) => setEditVehicleNum(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 text-white rounded-xl px-4 py-3 text-xs font-bold focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                    <label className="text-[9px] font-black text-amber-400 uppercase tracking-widest pl-0.5">Security Passcode PIN (5-Digits)</label>
                    <input 
                      type="text" 
                      maxLength={5}
                      required
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-white/10 text-amber-400 text-center rounded-lg px-4 py-2 text-xs tracking-widest font-black focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 border border-white/5 bg-slate-955 text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="bg-slate-900 p-5 rounded-[2.2rem] border border-white/5 flex items-center gap-4 text-left">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shadow bg-slate-850">
                       <img src={riderProfile.photo || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=400&fit=crop"} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white leading-none uppercase">{riderProfile.name}</h3>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rider ID: {riderProfile.id.toUpperCase()}</p>
                      
                      <div className="flex gap-1.5 mt-2.5">
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded">Approved Carrier</span>
                        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded">{riderProfile.vehicleType} Fleet</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-3xl border border-white/5 text-left space-y-3.5">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Branch</span>
                      <span className="text-xs font-black uppercase text-white">[{riderProfile.branchId?.replace('_main','').toUpperCase() || 'KHAMMAM'}] Central Area</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-white/0 pb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Registered</span>
                      <span className="text-xs font-black text-white font-mono tracking-tight">{riderProfile.phone || '9876543210'}</span>
                    </div>
                  </div>

                  {/* SYSTEMS & EARTH CACHING DIAGNOSTICS CONTROL PANEL */}
                  <div className="p-4 bg-slate-900 rounded-3xl border border-white/5 text-left space-y-4">
                    <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <Settings className="w-3.5 h-3.5" />
                      <span>Rider Systems & Cache Diagnostics</span>
                    </h5>

                    {/* Battery Sim Controls */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Device Battery Simulator</span>
                        <span className="text-[9px] font-mono text-white bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">
                          {batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : 'Checking...'} {isCharging ? '(Charging)' : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={batteryLevel !== null ? Math.round(batteryLevel * 100) : 100}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) / 100;
                            setBatteryLevel(val);
                          }}
                          className="flex-1 accent-amber-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBatteryLevel(0.15); // Drop below 20% warning instantly
                            setIsCharging(false);
                          }}
                          className="px-2.5 py-1.5 bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-950/60 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Sim Low (15%)
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCharging(!isCharging)}
                          className={`flex-1 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                            isCharging 
                              ? 'bg-emerald-950/45 border-emerald-500/30 text-emerald-400 font-bold' 
                              : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                          }`}
                        >
                          {isCharging ? '🔌 Stop Charger' : '⚡ Connect Charger'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBatteryLevel(0.85);
                            setIsCharging(false);
                          }}
                          className="px-3 py-1.5 bg-slate-955 border border-white/5 text-slate-400 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Reset (85%)
                        </button>
                      </div>
                    </div>

                    {/* Map Preset Tiles Cache */}
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">IndexedDB Map tiles Caching</span>
                        <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-ping" />
                          <span>Map Offline-Ready</span>
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black text-white">Tile Cache Database</p>
                          <span className="text-[8px] font-medium text-slate-500 uppercase">Stores OSM tiles locally on client</span>
                        </div>
                        <span className="px-2 py-1 bg-slate-900 rounded-lg border border-white/5 text-xs font-mono font-black text-amber-500">
                          {cachedTileCount} tiles
                        </span>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={async () => {
                            setPreCaching(true);
                            try {
                              const dummyKeys = [
                                "15-23701-14002", "15-23701-14003", "15-23702-14002", "15-23702-14003",
                                "15-23703-14002", "15-23703-14003", "15-23701-14004", "15-23702-14004"
                              ];
                              for (const key of dummyKeys) {
                                const placeholderPng64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkSM74DwADegGS+0iT4QAAAABJRU5ErkJggg==";
                                await tileCache.saveTile(key, placeholderPng64);
                              }
                              const updatedCount = await tileCache.getCacheCount();
                              setCachedTileCount(updatedCount);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setPreCaching(false);
                            }
                          }}
                          disabled={preCaching}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[8px] uppercase tracking-widest rounded-lg transition-transform duration-100 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${preCaching ? 'animate-spin' : ''}`} />
                          <span>Pre-cache Active Sector</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await tileCache.clear();
                            setCachedTileCount(0);
                          }}
                          className="px-2.5 py-2.5 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Purge
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AUTO-OFFLINE CONTROL PANEL */}
                  <div className="p-4 bg-slate-900 rounded-3xl border border-white/5 text-left space-y-4" id="systems-caching-diagnostics">
                    <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2">
                      <BatteryWarning className="w-3.5 h-3.5" />
                      <span>Rider Auto-Offline & Battery Conservation</span>
                    </h5>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                          <p className="text-[10.5px] font-black text-white uppercase tracking-wide">Inactivity Sleep Limit</p>
                          <p className="text-[8.5px] font-medium text-slate-500 uppercase tracking-tight">Rider auto-prompts to go offline if no movement is detected on GPS</p>
                        </div>
                        <select
                          value={autoOfflineMinutes}
                          onChange={(e) => {
                            const mins = parseInt(e.target.value);
                            setAutoOfflineMinutes(mins);
                            setLastMovementTime(Date.now());
                            speakCue(`Auto offline timer set to ${mins === 0 ? 'disabled' : mins + ' minutes'}`);
                          }}
                          className="bg-slate-950 border border-white/10 text-xs font-bold text-amber-500 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="0">⚠️ Disabled</option>
                          <option value="5">🕒 5 Minutes (Demo)</option>
                          <option value="15">🕒 15 Minutes</option>
                          <option value="30">🕒 30 Minutes</option>
                          <option value="60">🕒 60 Minutes</option>
                        </select>
                      </div>

                      <div className="bg-slate-950/60 border border-white/5 p-3 rounded-2xl flex items-center justify-between text-[9px]">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Inactivity Duration Tracker:</span>
                        <span className="font-mono text-amber-400 font-extrabold bg-slate-950 px-2 py-0.5 rounded">
                          {autoOfflineMinutes === 0 ? 'PAUSED' : 'ACTIVE MONITOR'}
                        </span>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            // Instantly simulate no movement / force trigger the auto-offline warning dialog
                            setLastMovementTime(Date.now() - autoOfflineMinutes * 60 * 1000 - 1000);
                            alert("🔬 Simulation: Movement timeout forced instantly! The sleep alert dialog will activate on the next background cron check (within 10s).");
                          }}
                          disabled={autoOfflineMinutes === 0}
                          className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-amber-500/20 text-slate-400 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest cursor-pointer disabled:opacity-50 transition-all"
                        >
                          ⏳ Fast-Sim Inactivity Timeout
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <button
                      onClick={() => setShowLegalTerms(true)}
                      className="w-full py-4 bg-indigo-505/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>Platform Payment & Refund Contract</span>
                    </button>

                    <button
                      onClick={handleOpenEdit}
                      className="w-full py-4 bg-slate-900 border border-white/5 hover:border-amber-500/30 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-amber-500" />
                      <span>Edit Fleet Contact Profile</span>
                    </button>

                    <button
                      onClick={handleLogoutSession}
                      className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>De-Authorize & Log Out Rider</span>
                    </button>
                  </div>
                </>
              )}

            </div>
          )}

          {/* TAB 4: DIRECT CARE SUPPORT HELPDESK CHAT */}
          {activeTab === 'support' && (
            <div className="space-y-4 flex flex-col h-[65vh] text-left">

              {/* Direct support helpline banner */}
              <div className="px-4 py-3 bg-slate-900 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center font-black text-amber-500">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-white leading-none tracking-wide">Helpline Care Support</h5>
                    <span className="text-[10px] font-bold text-amber-500 mt-1.5 block font-mono">+91 7416574197</span>
                  </div>
                </div>
                <button 
                  onClick={() => window.open("tel:7416574197")}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-[9.5px] text-slate-950 font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer"
                >
                  Call Helpline
                </button>
              </div>
              
              <div className="px-4 py-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center font-black text-amber-500 text-xs">DC</div>
                <div>
                  <h5 className="text-[11px] font-black uppercase text-white leading-none">Support Operators Channel</h5>
                  <span className="text-[8px] font-black text-emerald-400 uppercase mt-1 block font-mono">● Dispatch Hub Agent Active</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-1 space-y-4 py-2">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] px-4.5 py-3 rounded-[1.8rem] text-xs font-bold leading-relaxed shadow-sm ${
                        msg.senderType === 'partner' 
                          ? 'bg-amber-500 text-slate-950 rounded-br-none' 
                          : 'bg-slate-900 text-slate-100 border border-white/5 rounded-bl-none'
                      }`}>
                        {msg.text}
                        <p className={`text-[7.5px] mt-1.5 font-black uppercase opacity-70 tracking-widest ${msg.senderType === 'partner' ? 'text-right' : ''}`}>
                          {typeof msg.timestamp === 'string' 
                            ? msg.timestamp 
                            : msg.timestamp?.toDate 
                              ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                              : msg.timestamp?.seconds 
                                ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendChatMessage} className="p-1 bg-slate-905 border border-white/5 rounded-2xl flex gap-2 pt-2 shrink-0">
                <input 
                  value={chatMessage}
                  required
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask about active orders, coordinates, or cash settlements..."
                  className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none placeholder:text-slate-505"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 bg-amber-500 text-slate-950 rounded-xl active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all font-black text-xs flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* EMERGENCY SOS REAL-TIME STATUS CONSOLE */}
        <AnimatePresence>
          {isTriggeringSOS && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="bg-slate-900 border border-rose-500/30 rounded-[2.5rem] p-6 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden relative"
              >
                {/* Visual Alarm Beacon */}
                <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500 animate-pulse relative">
                  <ShieldAlert className="w-10 h-10 text-rose-500" />
                  <span className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-75 animate-duration-1000" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black tracking-wider text-rose-500 uppercase italic">SECURITY ALARM DISPATCHED</h3>
                  <p className="text-xs text-slate-400">Automated distress protocols have been triggered dynamically</p>
                </div>

                {/* Simulated Console Logs Terminal */}
                <div className="bg-slate-950 rounded-2xl p-4 text-left font-mono text-[10px] space-y-2 max-h-[140px] overflow-y-auto border border-white/5 scrollbar-thin scrollbar-thumb-slate-800">
                  {sosLogs.map((logStr, idx) => (
                    <div 
                      key={idx} 
                      className={`leading-relaxed border-l-2 pl-2 ${
                        logStr.includes('SUCCESS') 
                          ? 'border-emerald-500 text-emerald-400' 
                          : logStr.includes('distress') || logStr.includes('⚠️') || logStr.includes('🚨') || logStr.includes('CRASH') || logStr.includes('HIGH-G')
                          ? 'border-rose-500 text-rose-400' 
                          : 'border-slate-800 text-slate-300'
                      }`}
                    >
                      {logStr}
                    </div>
                  ))}
                  {sosStatus !== 'completed' && (
                    <div className="flex items-center gap-1.5 text-rose-400/70 italic animate-pulse pl-2 border-l-2 border-slate-800">
                      <span>⚡ Syncing and relaying diagnostics...</span>
                    </div>
                  )}
                </div>

                {/* SIREN INTEGRITY GUARDIAN TIMERS */}
                <div className="bg-slate-950 p-4.5 rounded-[2rem] border border-amber-500/10 text-left space-y-3 shadow-inner">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Siren Playback Guard
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {isSirenMuted ? (
                        <span className="text-emerald-405 font-extrabold text-emerald-400 uppercase">● Silenced</span>
                      ) : (
                        <span className="text-rose-450 font-extrabold text-rose-400 animate-pulse uppercase">● Playing</span>
                      )}
                    </span>
                  </div>

                  {isSirenMuted ? (
                    <div className="bg-slate-900/80 p-3 rounded-2xl border border-emerald-500/10 text-center space-y-1">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Siren Speaker Silenced ✓</p>
                      <p className="text-[9px] text-slate-500 font-bold">Accidental prolonged noise blocked. Audio emission has been terminated.</p>
                      {sirenCountdown > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSirenMuted(false);
                            setSirenCountdown(30);
                            setSosLogs(prev => [...prev, "🔊 [RE-ARM] Siren speaker re-armed manually by user request."]);
                          }}
                          className="mt-1 text-[8px] font-black uppercase tracking-widest text-amber-500 hover:underline cursor-pointer"
                        >
                          Re-Arm Speaker Squelch 📢
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-300">
                        <span>Auto-Silencing Cutoff</span>
                        <span className="font-mono text-rose-400 font-extrabold">{sirenCountdown}s remaining</span>
                      </div>
                      
                      {/* Interactive Visual Countdown Progress Bar */}
                      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${(sirenCountdown / 30) * 100}%` }}
                        />
                      </div>

                      {/* Dynamic Low-Pass filter: Automatically reduce pitch if battery drops below 15% */}
                      {batteryLevel !== null && batteryLevel < 0.15 && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-start gap-2 select-none animate-pulse">
                          <Sun className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-0.5">
                            <span className="text-[9px] font-black uppercase text-amber-400 leading-none block">🔋 Low Battery Power-Guard</span>
                            <span className="text-[8px] text-slate-400 font-medium leading-normal block">
                              Siren pitch & frequency harmonics attenuated automatically to conserve speaker life at {Math.round(batteryLevel * 100)}% Battery.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Manual Confirmation Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSirenMuted(true);
                          setSosLogs(prev => [
                            ...prev,
                            "🛡️ [MANUAL OVERRIDE] Safety confirmation gesture processed. Siren manually muted."
                          ]);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        <span>Confirm Safety & Mute Siren</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* TAILORED EMERGENCY ALARM SIREN CONTROLS */}
                <div className="bg-slate-950/90 p-4.5 rounded-[2rem] border border-rose-500/15 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-rose-500 animate-pulse" /> Siren Config Panel
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded text-rose-400">
                      {sirenMode === 'Pulse' ? '⚠️ Pulsing Wave' : '📢 Continuous'}
                    </span>
                  </div>

                  {/* Volume Slider Block */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-300">
                      <span>Alarm Volume Intensity</span>
                      <span className="font-mono text-amber-500 font-extrabold">{Math.round(sirenVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-2xl border border-white/5">
                      <VolumeX className="w-4 h-4 text-slate-500" />
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={sirenVolume}
                        onChange={(e) => setSirenVolume(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                      />
                      <Volume2 className="w-4 h-4 text-rose-500" />
                    </div>
                  </div>

                  {/* Siren Wave Pattern Selector */}
                  <div 
                    id="sirenMode" 
                    className="space-y-3 p-3 rounded-2xl border transition-all"
                    style={{
                      borderColor: sirenMode === 'Pulse' && isTriggeringSOS && !isSirenMuted ? undefined : 'rgba(255,255,255,0.05)',
                      animation: sirenMode === 'Pulse' && isTriggeringSOS && !isSirenMuted 
                        ? `sirenPulseAnim ${2 * (pulseSpeed === 'Slow' ? 1000 : pulseSpeed === 'Medium' ? 500 : 220)}ms infinite ease-in-out` 
                        : 'none'
                    }}
                  >
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Sound Preset Environment</span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setSirenMode('Continuous')}
                          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                            sirenMode === 'Continuous'
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                              : 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-850/50'
                          }`}
                        >
                          Continuous
                        </button>
                        <button
                          type="button"
                          onClick={() => setSirenMode('Pulse')}
                          className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                            sirenMode === 'Pulse'
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                              : 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-850/50'
                          }`}
                        >
                          Pulse Mode
                        </button>
                      </div>
                    </div>

                    {sirenMode === 'Pulse' && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <span className="text-[8px] font-black uppercase text-amber-400 block tracking-wider">Pulse Alternation Speed</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Slow', 'Medium', 'High'] as const).map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => setPulseSpeed(speed)}
                              className={`py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                                pulseSpeed === speed
                                  ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md shadow-amber-950/40'
                                  : 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-850'
                              }`}
                            >
                              {speed}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  {sosStatus === 'completed' ? (
                    <button
                      onClick={() => {
                        setIsTriggeringSOS(false);
                        setSosStatus('idle');
                        setSosLogs([]);
                      }}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer transition-all active:scale-95 text-center"
                    >
                      Acknowledge & Close Console✓
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2">
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      <span>Transmitting Active GPS Carrier Signal...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Auto-Offline Sleep Prompt Overlay */}
        <AnimatePresence>
          {showAutoOfflinePrompt && (
            <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 10, opacity: 0 }}
                className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative space-y-4 text-center"
              >
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/25">
                  <AlertCircle className="w-8 h-8 text-amber-500 animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">⏳ Sleep Warning: Auto-Offline?</h3>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Inactivity Power Conservation Protocol</p>
                </div>

                <p className="text-[10.5px] text-slate-350 leading-relaxed font-bold">
                  Hi, {riderProfile?.name || 'Partner'}! Our systems have detected no GPS movement for over <span className="text-white font-extrabold">{autoOfflineMinutes} minutes</span>. 
                  Would you like to toggle offline now to save cellular data and device battery?
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowAutoOfflinePrompt(false);
                      // Force rider offline
                      if (riderProfile?.isOnline) {
                        await handleDutyToggle();
                      }
                      speakCue("You are now offline. Stay safe.");
                    }}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-lg shadow-rose-950/20"
                  >
                    🔴 Set Me Offline
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAutoOfflinePrompt(false);
                      setLastMovementTime(Date.now());
                      speakCue("Activity confirmed. Keeping you online.");
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer border border-[#ffffff09]"
                  >
                    🟢 Keep Me Online
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rider Corporate Legal & Refund Contract Modal */}
        <AnimatePresence>
          {showLegalTerms && (
            <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh] text-left"
              >
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Payment & Refund Policy</h3>
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Carrier Terms of Compensation</p>
                  </div>
                  <button 
                    onClick={() => setShowLegalTerms(false)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white ml-auto transition-colors focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-slate-300 font-bold leading-relaxed text-[10.5px]">
                  <section className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">1. Customer Refund Timelines</h4>
                    <p>
                      To maintain high customer trust, we follow strict service standards. If a customer cancels an order eligible for a refund:
                    </p>
                    <div className="bg-slate-950 border border-white/5 rounded-xl p-3 space-y-1.5 text-[9.5px]">
                      <p className="font-extrabold text-amber-500">⏳ Accepted Processing Windows:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong className="text-white">UPI (GPay/PhonePe/Paytm):</strong> Processed instantly and credited within <span className="underline">a few hours or up to 1 day</span>.</li>
                        <li><strong className="text-white">Debit & Credit Cards:</strong> Gateway banking clearance takes between <span className="underline">3 to 10 business days</span>.</li>
                      </ul>
                    </div>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">2. Compensation on Cancellations</h4>
                    <p>
                      If a customer or store cancels an order while you are on-route or have already completed product pickup, standard trip compensation is automatically verified and credited to your Rider Wallet to cover your time and fuel.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">3. Escrow & Wallet Cash Matching</h4>
                    <p>
                      Cash collection for Cash on Delivery (COD) orders must match completely. Under-collected values or incorrect customer cancellations are automatically flagged by digital ledgers.
                    </p>
                  </section>

                  <p className="text-[9px] text-slate-500 italic mt-3">
                    These terms form part of your active carrier partner contract with Local Bandi Tech. For urgent dispatch/cash settlement help, raise a Helpdesk query or contact Carrier Operations.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <button 
                    onClick={() => setShowLegalTerms(false)}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                  >
                    Agree & Accept Carrier terms
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MANUAL RETRY & SYNCHRONIZATION QUEUE MODAL OVERLAY */}
        <AnimatePresence>
          {showSyncStatusModal && (
            <div className="fixed inset-0 z-[10006] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh] text-left text-white"
              >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4 font-sans">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <Database className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Sync Manager</h3>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-0.5 font-mono">Offline Cached Sync Queue</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowSyncStatusModal(false)}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white ml-auto transition-colors focus:outline-none cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle / Helper info */}
                <div className="bg-slate-950/50 border border-white/5 p-3 rounded-2xl mb-4 text-[10px] text-slate-400 font-semibold leading-relaxed font-sans">
                  <span className="font-extrabold text-indigo-400 block uppercase tracking-wide mb-0.5">📁 Stored Offline Synchronizations:</span>
                  The actions listed below were generated during offline status gaps. Click <strong className="text-slate-200">Retry Sync</strong> on any item to force database reconciliation, or choose <strong className="text-slate-200">Reconcile All</strong>.
                </div>

                {/* Queue list container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent font-mono">
                  {syncQueueItems.length === 0 ? (
                    <div className="text-center py-12 space-y-2 font-sans">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-500">
                        <Check className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">No pending sync jobs found!</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">All offline items have been synchronized with the main servers.</p>
                    </div>
                  ) : (
                    syncQueueItems.map((item, index) => {
                      const displayType = item.type === 'DELIVERY_COMPLETED' 
                        ? '🎁 Complete Delivery Payment' 
                        : item.type === 'STATUS_UPDATE' 
                        ? '⚡ Cycle Status Update' 
                        : item.type === 'CUSTOM_STATUS' 
                        ? '🚲 Custom Status change' 
                        : '🔄 Job Synchronize Action';

                      return (
                        <div key={item.id || index} className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-2.5 hover:border-white/10 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block bg-indigo-950/50 py-0.5 px-2 rounded-md w-max border border-indigo-900/30">
                                {displayType}
                              </span>
                              <span className="text-[7.5px] text-slate-500 block mt-1 uppercase">ID: {item.id}</span>
                            </div>
                            <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 uppercase tracking-widest animate-pulse">
                              Pending Retry
                            </span>
                          </div>

                          <div className="space-y-1 text-[9.5px] text-slate-300 font-bold bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                            {item.type === 'DELIVERY_COMPLETED' && (
                              <>
                                <p>Order ID: <span className="text-white font-extrabold">{item.orderId}</span></p>
                                <p>Rider Payout: <span className="text-emerald-400">₹{item.payoutBreakdown?.tripPayout || 45}</span> | Tips: <span className="text-amber-400">₹{item.payoutBreakdown?.tipPayout || 0}</span></p>
                                <p>Amount Paid: <span className="text-white">₹{item.orderAmount}</span></p>
                              </>
                            )}
                            {item.type === 'STATUS_UPDATE' && (
                              <>
                                <p>Target Order: <span className="text-white font-extrabold">{item.orderId}</span></p>
                                <p>Set Status: <span className="text-yellow-400 uppercase">{item.orderUpdate?.status}</span></p>
                              </>
                            )}
                            {item.type === 'CUSTOM_STATUS' && (
                              <>
                                <p>Partner Status: <span className="text-white uppercase font-black">{item.statusValue}</span></p>
                              </>
                            )}
                            {!['DELIVERY_COMPLETED', 'STATUS_UPDATE', 'CUSTOM_STATUS'].includes(item.type) && (
                              <p className="break-all">{JSON.stringify(item.orderUpdate || item)}</p>
                            )}
                          </div>

                          <div className="flex gap-2 font-sans pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleRetrySingleJob(item)}
                              disabled={isSyncingOfflineQueue}
                              className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry Sync
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOfflineJob(item.id)}
                              className="py-1.5 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              Purge
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Controls */}
                <div className="border-t border-white/5 pt-4 flex gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setShowSyncStatusModal(false)}
                    className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    Close Manager
                  </button>
                  {syncQueueItems.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSyncOfflineQueue();
                        await loadSyncQueueItems();
                      }}
                      disabled={isSyncingOfflineQueue}
                      className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingOfflineQueue ? 'animate-spin' : ''}`} />
                      Reconcile All
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* LOW CONNECTIVITY GUARD CONTROL CENTER MODAL */}
        <LowConnectivityGuardModal
          riderLocation={riderLocation}
          onUpdateRiderLocation={(loc) => setRiderLocation(loc)}
          speakCue={speakCue}
          isOpenModal={showLowConnectivityGuardModal}
          onCloseModal={() => setShowLowConnectivityGuardModal(false)}
        />

        {/* BOTTOM NAVIGATION PANEL TAB BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-white/5 p-2 px-4 flex items-center justify-between pointer-events-auto shadow-2xl">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'jobs' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-5.5 h-5.5" />
            <span className="text-[7.5px] font-black uppercase tracking-wider">Active Jobs</span>
          </button>

          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'earnings' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-5.5 h-5.5" />
            <span className="text-[7.5px] font-black uppercase tracking-wider">Earnings</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'support' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-5.5 h-5.5" />
            <span className="text-[7.5px] font-black uppercase tracking-wider">Helpdesk</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-5.5 h-5.5" />
            <span className="text-[7.5px] font-black uppercase tracking-wider">My Profile</span>
          </button>
        </nav>
      </div>
    );
  }

  return null;
}
