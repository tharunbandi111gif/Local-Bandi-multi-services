import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  CheckCircle2, 
  Package, 
  Bike, 
  Clock, 
  Wallet, 
  Star, 
  HelpCircle, 
  MoreVertical,
  LogOut,
  Power,
  ClipboardList,
  Send,
  ShieldCheck,
  FileText,
  Lock,
  Save,
  Edit3,
  Check,
  X
} from 'lucide-react';
import { DeliveryOrder, DeliveryPartnerProfile, SupportMessage } from '../types';
import JoiningLetter from './JoiningLetter';
import LiveMap from './LiveMap';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, serverTimestamp, limit, getDocs } from 'firebase/firestore';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const DEFAULT_COORDS = { lat: 17.2473, lng: 80.1514 };

const getSafeCoords = (loc: any, fallback = DEFAULT_COORDS): google.maps.LatLngLiteral => {
  if (loc && loc.lat !== undefined && loc.lng !== undefined) {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return fallback;
};

function RouteMap({ origin, destination, onUpdateETA }: { 
  origin: google.maps.LatLngLiteral; 
  destination: google.maps.LatLngLiteral;
  onUpdateETA: (eta: string) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || !destination) return;

    // Clear previous route
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
        newPolylines.forEach(p => p.setMap(map));
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
    </>
  );
}

interface DeliveryDashboardProps {
  onBack: () => void;
  profileId?: string;
  isAdmin?: boolean;
}

export default function DeliveryDashboard({ onBack, profileId, isAdmin: propIsAdmin }: DeliveryDashboardProps) {
  const { user, isAdmin: contextIsAdmin } = useFirebase();
  const isAdmin = propIsAdmin || contextIsAdmin || localStorage.getItem('admin_session_active') === 'true';
  const [isBanned, setIsBanned] = useState(false);
  const [showJoiningLetter, setShowJoiningLetter] = useState(false);
  const [profile, setProfile] = useState<DeliveryPartnerProfile | null>(null);
  const [mapTarget, setMapTarget] = useState<'vendor' | 'customer' | null>(null);
  const [eta, setEta] = useState<string>('--');
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [activeOrder, setActiveOrder] = useState<DeliveryOrder | null>(null);

  useEffect(() => {
    if (mapTarget || activeOrder) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCurrentLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          },
          (err) => {
            console.warn("Geolocation failed, using default fallback.", err);
            // Default to Wardha center if user denies geolocation for demo
            setCurrentLocation({ lat: 20.7453, lng: 78.6022 });
          }
        );
      }
    } else {
      setCurrentLocation(null);
      setEta('--');
    }
  }, [mapTarget, activeOrder]);

  useEffect(() => {
    if (hasValidKey) return;
    if (!activeOrder) {
      setEta('--');
      return;
    }

    const nextDestRaw = ['PickedUp', 'OutForDelivery'].includes(activeOrder.status)
      ? activeOrder.deliveryLocation
      : activeOrder.pickupLocation;

    const nextDest = getSafeCoords(nextDestRaw);
    const startLoc = getSafeCoords(currentLocation, { lat: 20.7453, lng: 78.6022 });
    
    const latDiff = startLoc.lat - nextDest.lat;
    const lngDiff = startLoc.lng - nextDest.lng;
    const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
    const speedKmH = 30;
    const timeHours = distanceKm / speedKmH;
    const timeMinutes = Math.max(2, Math.round(timeHours * 60));

    setEta(`${timeMinutes} mins`);
  }, [hasValidKey, currentLocation, activeOrder, mapTarget]);

  const [isLocked, setIsLocked] = useState(() => {
    if (isAdmin) return false;
    const pid = profileId || profile?.id || '';
    if (!pid) return true;
    const persistent = localStorage.getItem(`delivery_unlocked_${pid}`);
    return persistent === 'true' ? false : true;
  });

  useEffect(() => {
    const pid = profileId || profile?.id || '';
    if (pid) {
      const persistent = localStorage.getItem(`delivery_unlocked_${pid}`);
      if (persistent === 'true') {
        setIsLocked(false);
      } else if (!isLocked && !isAdmin) {
        localStorage.setItem(`delivery_unlocked_${pid}`, 'true');
      }
    }
  }, [isLocked, profileId, profile?.id, isAdmin]);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'earnings' | 'history' | 'performance' | 'support'>('home');
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    phone: '',
    photo: '',
    vehicleType: '',
    vehicleNumber: ''
  });
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [tripHistory, setTripHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const qHistory = query(
      collection(db, 'orders'),
      where('deliveryPartnerId', '==', profile.id),
      where('status', '==', 'Delivered'),
      limit(30)
    );
    return onSnapshot(qHistory, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: (doc.data() as any).updatedAt ? new Date((doc.data() as any).updatedAt.seconds * 1000).toLocaleString() : 'Recent'
      }));
      setTripHistory(docs);
    }, err => handleFirestoreError(err, OperationType.LIST, 'orders'));
  }, [profile?.id]);

  useEffect(() => {
    if (isAdmin) {
      setIsLocked(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const bootstrapRider = async () => {
      try {
        const { getDoc, setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        const riderDocRef = doc(db, 'deliveryPartners', 'admin-rider');
        const riderDoc = await getDoc(riderDocRef);
        if (!riderDoc.exists()) {
          await setDoc(riderDocRef, {
            userId: user.uid,
            name: 'Admin Logistics Hero',
            phone: user.phoneNumber?.replace('+91', '') || '9999999999',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            status: 'Online',
            rating: 5.0,
            trips: 18,
            earnings: 1250,
            pendingPayout: 0,
            vehicleType: 'Bike',
            vehicleNumber: 'TS-04-ADMIN',
            accessCode: '12345',
            isOnline: true,
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("Failed to bootstrap admin rider:", err);
      }
    };
    bootstrapRider();
  }, [user, isAdmin]);

  useEffect(() => {
    if (profile) {
      setEditProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        photo: profile.photo || 'https://i.pravatar.cc/150?u=' + profile.id,
        vehicleType: profile.vehicleType || 'Bike',
        vehicleNumber: profile.vehicleNumber || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    let unsub: () => void = () => {};
    if (profileId) {
      unsub = onSnapshot(doc(db, 'deliveryPartners', profileId), (snapshot) => {
        if (snapshot.exists()) {
          const me = snapshot.data() as DeliveryPartnerProfile;
          setProfile({ ...me, id: snapshot.id });
          if (me.status === 'Banned') {
            setIsBanned(true);
          }
        } else if (profileId === 'admin-rider') {
          // Initialize direct admin rider fallback state
          setProfile({
            id: 'admin-rider',
            userId: user.uid,
            name: 'Admin Logistics Hero',
            phone: user.phoneNumber?.replace('+91', '') || '9999999999',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            status: 'Online',
            rating: 5.0,
            trips: 18,
            earnings: 1250,
            pendingPayout: 0,
            vehicleType: 'Bike',
            vehicleNumber: 'TS-04-ADMIN',
            accessCode: '12345',
            isOnline: true,
            branchId: 'khammam_main'
          } as any);
        }
      }, err => {
        console.warn("Failed to listen to delivery partner, falling back to admin state:", err);
        if (profileId === 'admin-rider') {
          setProfile({
            id: 'admin-rider',
            userId: user.uid,
            name: 'Admin Logistics Hero',
            phone: user.phoneNumber?.replace('+91', '') || '9999999999',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            status: 'Online',
            rating: 5.0,
            trips: 18,
            earnings: 1250,
            pendingPayout: 0,
            vehicleType: 'Bike',
            vehicleNumber: 'TS-04-ADMIN',
            accessCode: '12345',
            isOnline: true,
            branchId: 'khammam_main'
          } as any);
        } else {
          handleFirestoreError(err, OperationType.GET, `deliveryPartners/${profileId}`);
        }
      });
    } else if (user) {
      const q = query(
        collection(db, 'deliveryPartners'), 
        where('userId', '==', user.uid)
      );
      unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const me = snapshot.docs[0].data() as DeliveryPartnerProfile;
          setProfile({ ...me, id: snapshot.docs[0].id });
          if (me.status === 'Banned') {
            setIsBanned(true);
          }
        } else if (user.phoneNumber) {
          const phoneNum = user.phoneNumber.replace('+91', '') || 'NONE';
          const qPhone = query(
            collection(db, 'deliveryPartners'),
            where('phone', '==', phoneNum)
          );
          getDocs(qPhone).then(snap => {
            if (!snap.empty) {
              const me = snap.docs[0].data() as DeliveryPartnerProfile;
              setProfile({ ...me, id: snap.docs[0].id });
              if (me.status === 'Banned') {
                setIsBanned(true);
              }
            }
          }).catch(err => console.warn("Failed phone fallback query:", err));
        }
      }, err => handleFirestoreError(err, OperationType.GET, 'deliveryPartners'));
    }
    return () => unsub();
  }, [user, profileId]);

  useEffect(() => {
    if (!profile?.id) return;
    const loadMessages = () => {
      try {
        const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
        const myChat = allChats[profile.id];
        if (myChat && myChat.messages) {
          setMessages(myChat.messages);
        } else {
          const welcomeMsg: SupportMessage = {
            id: 'welcome-1',
            senderId: 'admin',
            senderName: 'Lokal Support',
            senderType: 'admin',
            text: "Welcome to Lokal Support! How can we help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages([welcomeMsg]);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };
    loadMessages();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lokal_support_chats') {
        loadMessages();
      }
    };
    const handleCustomEvent = () => loadMessages();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('support_message_received', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('support_message_received', handleCustomEvent);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (activeTab === 'support') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeTab]);

  useEffect(() => {
    if (!profile?.id) return;
    const qRel = query(
      collection(db, 'orders'),
      where('deliveryPartnerId', '==', profile.id),
      limit(20)
    );
    const qAvail = query(
      collection(db, 'orders'),
      where('status', 'in', ['Pending', 'Preparing', 'ReadyForPickup', 'Assigned']),
      where('deliveryPartnerId', '==', null),
      limit(30)
    );
    const unsubAssigned = onSnapshot(qRel, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const active = docs.find((o: any) => ['Assigned', 'Accepted', 'Preparing', 'ReadyForPickup', 'PickedUp', 'OutForDelivery', 'Ready'].includes(o.status));
      if (active) {
        setActiveOrder(active as any);
      } else {
        setActiveOrder(null);
      }
    }, err => handleFirestoreError(err, OperationType.LIST, 'orders'));
    const unsubAvail = onSnapshot(qAvail, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveOrders(docs);
    }, err => handleFirestoreError(err, OperationType.LIST, 'orders'));
    return () => {
      unsubAssigned();
      unsubAvail();
    };
  }, [profile?.id]);

  const handleVerifyPin = () => {
    if (enteredPin === profile?.accessCode) {
      setIsLocked(false);
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
      setTimeout(() => setPinError(false), 500);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'deliveryPartners', profile.id), {
        ...editProfileData,
        updatedAt: serverTimestamp()
      });
      setIsEditingProfile(false);
      alert("Rider profile updated successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${profile.id}`);
    }
  };

  const handleSendMessage = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !profile) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: SupportMessage = { 
      id: `msg-${Date.now()}`, 
      senderId: profile.id, 
      senderName: profile.name,
      senderType: 'partner',
      text: chatMessage, 
      timestamp: now 
    };
    const allChats = JSON.parse(localStorage.getItem('lokal_support_chats') || '{}');
    const myChat = allChats[profile.id] || { partnerId: profile.id, partnerName: profile.name, messages: [], lastMessageTimestamp: now };
    myChat.messages.push(newMsg);
    myChat.lastMessageTimestamp = now;
    myChat.unreadCount = (myChat.unreadCount || 0) + 1;
    allChats[profile.id] = myChat;
    try {
      localStorage.setItem('lokal_support_chats', JSON.stringify(allChats));
    } catch (e) {
      console.warn('Storage quota exceeded for lokal_support_chats', e);
    }
    setMessages(prev => [...prev, newMsg]);
    setChatMessage('');
    window.dispatchEvent(new CustomEvent('support_message_sent'));
  }, [chatMessage, profile]);

  const handleStatusToggle = React.useCallback(async () => {
    if (!profile) return;
    try {
      const nextOnline = !profile.isOnline;
      await updateDoc(doc(db, 'deliveryPartners', profile.id), {
        isOnline: nextOnline,
        status: nextOnline ? 'Online' : 'Offline',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `deliveryPartners/${profile.id}`);
    }
  }, [profile]);

  const handleAcceptOrder = React.useCallback(async (orderId?: string) => {
    const id = orderId || activeOrder?.id;
    if (!id || !profile) return;
    
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: 'Accepted',
        deliveryPartnerId: profile.id,
        deliveryPartnerName: profile.name,
        deliveryPartnerPhone: profile.phone || '',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // If it wasn't the active order before (e.g. claimed from pool), 
      // the snapshot listener for qRel will pick it up and set it as activeOrder.
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  }, [activeOrder?.id, profile]);

  const handlePickup = React.useCallback(async () => {
    if (activeOrder && profile) {
      try {
        await updateDoc(doc(db, 'orders', activeOrder.id), {
          status: 'PickedUp',
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${activeOrder.id}`);
      }
    }
  }, [activeOrder, profile]);

  const handleDeliver = React.useCallback(async () => {
    if (activeOrder && profile) {
      try {
        await updateDoc(doc(db, 'orders', activeOrder.id), {
          status: 'Delivered',
          updatedAt: serverTimestamp()
        });
        const payout = 45;
        await updateDoc(doc(db, 'deliveryPartners', profile.id), {
          earnings: (profile.earnings || 0) + payout,
          trips: (profile.trips || 0) + 1,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${activeOrder.id}`);
      }
    }
  }, [activeOrder, profile]);

  if (!profile && !isBanned) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center font-sans text-center px-12">
        <div>
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-xl shadow-indigo-100" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic animate-pulse">Establishing Connection...</h3>
          <p className="mt-2 text-[10px] font-bold text-slate-400">Syncing with Logistics Engine</p>
        </div>
      </div>
    );
  }

  if (profile?.status !== 'Approved' && profile?.id !== 'admin-rider' && !isAdmin) {
    return (
      <div className="h-full w-full bg-white flex flex-col px-8 pt-20 pb-10 font-sans">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-blue-100">
            <ShieldCheck className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 italic tracking-tighter leading-tight">Verification in Progress</h2>
          <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em] max-w-[260px] leading-relaxed mx-auto">
            Your rider application is currently under administrative review. Access will be granted once background verification is complete.
          </p>
          <div className="mt-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 w-full max-w-sm shadow-sm relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full blur-3xl -mr-12 -mt-12" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Rider Onboarding Progress</p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Application Filed</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Documents Received</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Admin Authentication</p>
                  <p className="text-[8px] font-bold text-blue-500 uppercase">Security Clearance</p>
                </div>
              </div>
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-900">Start Earning</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Login Credentials Issuance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-center text-[9px] font-bold text-gray-400 uppercase italic">Support: 7416574197</p>
          <button 
            onClick={onBack}
            className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-2xl"
          >
            Logout session
          </button>
        </div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="h-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-rose-900">
           <Power className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-black italic mb-4">Account Suspended</h2>
        <p className="text-sm font-bold text-slate-400 mb-8 leading-relaxed">
          Your delivery partner account has been terminated by the Founder Panel. 
          Please contact our support team for any clarifications.
        </p>
        <button 
          onClick={onBack}
          className="w-full p-5 bg-white text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px]"
        >
          Logout Session
        </button>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center px-8 text-center font-sans">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <div className="w-24 h-24 bg-blue-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-2xl shadow-blue-500/10">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-1 italic tracking-tighter">Logistics Node</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Encrypted Partner Link</p>

          {!profile ? (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center animate-pulse">
              <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Application Status: Pending Approval</p>
              <p className="text-xs text-slate-400 mt-1">Once approved by Admin, you will get a 5-digit PIN from the founder panel to unlock your console.</p>
            </div>
          ) : (
            <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Approval Status: Approved ✅</p>
              <p className="text-xs text-slate-400 mt-1">Please enter your 5-digit security access PIN to open console workspace.</p>
            </div>
          )}
          
          <div className={`flex gap-4 justify-center mb-8 transition-all ${pinError ? 'translate-x-1 animate-bounce' : ''}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`w-5 h-5 rounded-xl border-2 transition-all duration-500 ${
                  enteredPin.length > i ? 'bg-blue-500 border-blue-500 scale-125 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'border-white/10'
                }`} 
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5 mb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Admin', 0, 'OK'].map((num) => (
              <button
                key={num.toString()}
                onClick={() => {
                  if (num === 'Admin') {
                    const code = prompt("Enter Master Admin Code:");
                    if (code === '8790' || code === '7416') { 
                      setIsLocked(false);
                      return;
                    }
                    alert("Invalid Master Code");
                    return;
                  }
                  if (num === 'OK') handleVerifyPin();
                  else if (enteredPin.length < 5) setEnteredPin(prev => prev + num);
                }}
                className={`h-20 rounded-[2rem] flex items-center justify-center font-black transition-all active:scale-90 ${
                  num === 'OK' ? 'bg-blue-500 text-white col-span-1 shadow-lg text-xs uppercase tracking-widest' : 
                  num === 'Admin' ? 'bg-white/5 text-blue-400 border border-blue-400/20 text-[10px] uppercase tracking-widest' : 'bg-white/10 text-white text-2xl'
                }`}
              >
                {num === 'OK' ? <CheckCircle2 className="w-8 h-8" /> : num}
              </button>
            ))}
          </div>
          
          <button 
            onClick={onBack}
            className="flex items-center gap-2 mx-auto text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Exit Workspace
          </button>
        </motion.div>
      </div>
    );
  }

  if (activeTab === 'support') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20 shadow-sm">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-xs">LS</div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Partner Support</h2>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">● Online Now</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div className="flex flex-col gap-5">
            {messages.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${msg.senderType === 'partner' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-6 py-4 rounded-[2.5rem] text-[14px] font-extrabold leading-relaxed shadow-sm ${
                  msg.senderType === 'partner' ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none shadow-slate-50'
                }`}>
                  {msg.text}
                  <p className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-80 ${msg.senderType === 'partner' ? 'text-right' : ''}`}>{msg.timestamp}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white p-4 rounded-[2rem] rounded-bl-none border border-slate-100 shadow-sm flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] pb-28">
          <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-50 p-2.5 rounded-[2.5rem] border border-slate-100 shadow-inner group focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
            <input 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="How can we help you today?"
              className="flex-1 bg-transparent px-5 py-3 font-extrabold text-[15px] outline-none placeholder:text-slate-300 text-slate-900"
            />
            <button 
              disabled={!chatMessage.trim()}
              className="w-12 h-12 bg-indigo-600 text-white rounded-full active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }


  const openInGoogleMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (showProfile) {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => { setShowProfile(false); setIsEditingProfile(false); }} className="p-2 bg-slate-100 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-black text-slate-900">{isEditingProfile ? 'Edit Profile' : 'Partner Details'}</h2>
          </div>
          {isAdmin && !isEditingProfile && (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
          {isEditingProfile ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editProfileData.name}
                    onChange={(e) => setEditProfileData({...editProfileData, name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Phone</label>
                  <input 
                    type="text" 
                    value={editProfileData.phone}
                    onChange={(e) => setEditProfileData({...editProfileData, phone: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehicle Type</label>
                  <select 
                    value={editProfileData.vehicleType}
                    onChange={(e) => setEditProfileData({...editProfileData, vehicleType: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="Bike">Bike</option>
                    <option value="Auto">Auto</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehicle Number</label>
                  <input 
                    type="text" 
                    value={editProfileData.vehicleNumber}
                    onChange={(e) => setEditProfileData({...editProfileData, vehicleNumber: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Photo URL</label>
                  <input 
                    type="text" 
                    value={editProfileData.photo}
                    onChange={(e) => setEditProfileData({...editProfileData, photo: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-3xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button 
                onClick={handleUpdateProfile}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" />
                Save Rider Details
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-sm">
                   <img src={profile.photo || "https://i.pravatar.cc/150?u=" + profile.id} className="w-full h-full object-cover" alt={profile.name} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-black text-slate-900 leading-none">{profile.name}</h3>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">ID: {profile.id.slice(-8).toUpperCase()}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Verified Partner</span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-lg border border-indigo-100">{profile.vehicleType || 'Bike Rider'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col items-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Account Status</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${profile.status === 'Banned' ? 'text-rose-500' : 'text-emerald-500'}`}>{profile.status}</p>
                 </div>
                 <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col items-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Phone</p>
                    <p className="text-sm font-black text-slate-900 tracking-tighter">{profile.phone}</p>
                 </div>
              </div>

              <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Documents & Verification</h4>
            <div className="space-y-3">
              {[
                { label: 'Aadhaar Card', status: 'Verified', date: '24 Apr', color: 'emerald' },
                { label: 'Driving License', status: 'Verified', date: '24 Apr', color: 'emerald' },
                { label: 'Vehicle RC', status: 'Verified', date: '25 Apr', color: 'emerald' },
                { label: 'Insurance Policy', status: 'Expiring Soon', date: '30 Jun', color: 'orange', warning: true }
              ].map((doc, i) => (
                <div key={i} className={`p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all ${doc.warning ? 'bg-orange-50/30 border-orange-100' : 'bg-white border-slate-50 shadow-sm'}`}>
                  <div>
                    <p className="text-xs font-black text-slate-900">{doc.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-tight">Last validated on {doc.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${doc.warning ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400 rounded-full -mr-12 -mt-12 blur-3xl opacity-20"></div>
             <div className="relative z-10">
               <h5 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-60">Professional Hub</h5>
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                     </div>
                     <div>
                        <p className="text-[13px] font-black leading-none mb-1">Rider of the Month</p>
                        <p className="text-[10px] font-bold text-indigo-300 capitalize">Awarded on Mar 12, 2024</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                     </div>
                     <div>
                        <p className="text-[13px] font-black leading-none mb-1">Safety First Badge</p>
                        <p className="text-[10px] font-bold text-indigo-300 capitalize">100% Secure Deliveries</p>
                     </div>
                  </div>
               </div>
             </div>
          </div>

          <button onClick={onBack} className="w-full p-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
             <LogOut className="w-4 h-4" />
             Logout Partner Session
          </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'performance') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Performance</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-400 rounded-full blur-[80px] opacity-20"></div>
            <div className="relative z-10">
              <div className="flex justify-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 text-yellow-400 fill-yellow-400" />)}
              </div>
              <h3 className="text-4xl font-black text-slate-900">4.9</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Excellent (254 Ratings)</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Customer Feedback</h4>
            <div className="space-y-3">
              {[
                { name: 'Rahul M.', text: 'Very polite and delivered on time!', stars: 5, time: '2h ago' },
                { name: 'Sneha G.', text: 'Excellent service, items were handled carefully.', stars: 5, time: '5h ago' }
              ].map((review, i) => (
                <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-black text-slate-900">{review.name}</p>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">{review.time}</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 mb-2 italic">"{review.text}"</p>
                  <div className="flex gap-0.5">
                    {[...Array(review.stars)].map((_, j) => <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'history') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Trip History</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-4">
          {tripHistory.map((trip) => (
            <div key={trip.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{trip.id}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{trip.date}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-emerald-100">
                  ₹45 Payout
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-orange-400" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 truncate">{trip.pickupAddress}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-600 truncate">{trip.deliveryAddress}</p>
                </div>
              </div>
            </div>
          ))}
          {tripHistory.length === 0 && (
            <div className="py-12 text-center grayscale opacity-50">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase">No trips found</p>
            </div>
          )}
        </div>
        
        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  if (activeTab === 'earnings') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4 bg-white sticky top-0 z-20">
          <button onClick={() => setActiveTab('home')} className="p-2 bg-slate-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-black text-slate-900">Earnings</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full -mr-16 -mt-16 blur-3xl opacity-20"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Balance</p>
            <h3 className="text-4xl font-black mb-6">₹{profile?.earnings || 0}</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  if (!profile || profile.pendingPayout === 0) {
                    alert("No pending payout to withdraw.");
                    return;
                  }
                  alert("Withdrawal request sent to Founder Panel for ₹" + profile.pendingPayout);
                }}
                className="flex-1 py-3 bg-yellow-400 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-400/20 active:scale-95 transition-all"
              >
                Withdrawal Request
              </button>
              <button onClick={() => setActiveTab('history')} className="flex-1 py-3 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-sm active:bg-white/20 transition-all">History</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recent Transactions</h4>
            {tripHistory.slice(0, 5).map((trip, i) => (
              <div key={trip.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-black text-slate-900 mb-0.5">Trip Payout #{trip.id.slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] font-bold text-slate-400">{trip.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">+₹45</p>
                  <p className="text-[9px] font-bold text-slate-400 font-mono">Credited</p>
                </div>
              </div>
            ))}
            {tripHistory.length === 0 && (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-[10px] font-black text-slate-300 uppercase">No recent payouts</p>
              </div>
            )}
          </div>
        </div>
        
        <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-slate-100 rounded-xl mr-2">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={() => setShowProfile(true)} className="relative group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group-hover:border-indigo-400 transition-all">
              <img src="https://i.pravatar.cc/150?u=suresh" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </button>
          <div className="flex flex-col ml-1">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">DP Console</h2>
            <p className="text-[10px] font-bold text-slate-400">v1.2.0-Alpha</p>
          </div>
        </div>
        <button 
          onClick={handleStatusToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
            profile?.status === 'Online' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Power className="w-3 h-3" />
          {profile?.status || 'Offline'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        {/* Availability Toggle - Large Card */}
        <div className={`mb-8 p-6 rounded-[2.5rem] border transition-all duration-500 ${
          profile.status === 'Online' 
            ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-200' 
            : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                profile.status === 'Online' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Availability</h3>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  profile.status === 'Online' ? 'text-emerald-100' : 'text-slate-400'
                }`}>
                  {profile.status === 'Online' ? 'Ready for Orders' : 'Currently Offline'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleStatusToggle}
              className={`w-16 h-8 rounded-full relative transition-colors duration-300 ${
                profile.status === 'Online' ? 'bg-white/40' : 'bg-slate-200'
              }`}
            >
              <motion.div 
                animate={{ x: profile.status === 'Online' ? 32 : 4 }}
                className={`w-6 h-6 rounded-full bg-white absolute top-1 shadow-sm`}
              />
            </button>
          </div>
          {profile.status === 'Offline' && (
            <p className="text-[10px] font-medium opacity-60 leading-relaxed italic">
              Go online to start receiving orders in Wardha region.
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button onClick={() => setActiveTab('earnings')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm active:scale-95 transition-all">
            <Wallet className="w-5 h-5 text-indigo-500 mb-2" />
            <span className="text-xs font-black text-slate-900">₹{profile?.earnings || 0}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Earnings</span>
          </button>
          <button onClick={() => setActiveTab('performance')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm active:scale-95 transition-all">
            <Star className="w-5 h-5 text-yellow-500 mb-2" />
            <span className="text-xs font-black text-slate-900">{profile?.rating || 0}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Rating</span>
          </button>
          <button onClick={() => setActiveTab('history')} className="bg-white p-4 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm active:scale-95 transition-all">
            <Bike className="w-5 h-5 text-orange-500 mb-2" />
            <span className="text-xs font-black text-slate-900">{profile?.trips || 0}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Trips</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {profile.status === 'Offline' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Bike className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 italic">Waiting for You</h3>
              <p className="text-sm font-bold text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                Flip the switch above to start your duty.
              </p>
            </motion.div>
          ) : !activeOrder ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 space-y-6"
            >
              <div className="text-center mb-8">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-500 rounded-full"
                  />
                  <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-xl border border-emerald-50">
                    <Navigation className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1 animate-pulse">Searching for Orders...</h3>
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live in Wardha</p>
              </div>

              {activeOrders.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center justify-between">
                    <span>Available Orders ({activeOrders.length})</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </h4>
                  {activeOrders.map((order) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{order.id}</p>
                           <p className="text-[10px] font-bold text-slate-400">{order.items} Items • ₹{order.total}</p>
                        </div>
                        <button 
                          onClick={() => handleAcceptOrder(order.id)}
                          className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 active:scale-95 transition-all"
                        >
                          Accept
                        </button>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-start gap-2">
                           <MapPin className="w-3 h-3 text-orange-400 mt-0.5" />
                           <p className="text-[11px] font-bold text-slate-600 truncate">{order.pickupAddress || 'Local Vendor'}</p>
                         </div>
                         <div className="flex items-start gap-2">
                           <MapPin className="w-3 h-3 text-emerald-500 mt-0.5" />
                           <p className="text-[11px] font-bold text-slate-600 truncate">{order.deliveryAddress || 'Customer Address'}</p>
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 p-8 shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900">New Order</h4>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{activeOrder?.id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      ₹45 Earnings
                    </div>
                    {eta && eta !== '--' && (
                      <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm border border-emerald-100/50">
                        <Clock className="w-3 h-3 text-emerald-500 animate-pulse" />
                        <span>ETA: {eta}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 relative ml-2">
                  <div className="absolute left-[7px] top-6 bottom-6 w-0.5 bg-slate-100 border-l border-dashed border-slate-300"></div>
                  
                  <div className="flex gap-4 relative group cursor-pointer" onClick={() => setMapTarget('vendor')}>
                    <div className="w-4 h-4 bg-orange-400 rounded-full ring-4 ring-orange-50 shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Pickup From Vendor</p>
                        <Navigation className="w-3 h-3 text-orange-400 group-hover:scale-125 transition-transform" />
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{activeOrder.vendorName || 'Vendor'}</p>
                      {activeOrder.status === 'Assigned' && (
                        <div className="mt-2 text-[9px] font-black text-orange-500 uppercase tracking-widest animate-pulse flex items-center justify-center bg-orange-50 py-1 rounded-lg">
                          New Order Assigned! Accept to Proceed
                        </div>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{activeOrder.pickupAddress}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative group cursor-pointer" onClick={() => setMapTarget('customer')}>
                    <div className="w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-emerald-50 shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Delivery To Customer</p>
                        <Navigation className="w-3 h-3 text-emerald-400 group-hover:scale-125 transition-transform" />
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-tight">{activeOrder.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  {['Assigned', 'Pending'].includes(activeOrder?.status || '') ? (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to reject this assigned order?")) {
                              updateDoc(doc(db, 'orders', activeOrder.id), {
                                deliveryPartnerId: null,
                                status: 'Pending',
                                updatedAt: serverTimestamp()
                              });
                            }
                          }}
                          className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleAcceptOrder()}
                          className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-4 h-4" />
                          Accept Order
                        </button>
                      </div>
                    </div>
                  ) : ['Accepted', 'Preparing', 'ReadyForPickup'].includes(activeOrder?.status || '') ? (
                    <div className="flex flex-col gap-3 w-full">
                      <button 
                        onClick={handlePickup}
                        disabled={activeOrder?.status !== 'ReadyForPickup'}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                          activeOrder?.status === 'ReadyForPickup' 
                            ? 'bg-orange-500 text-white shadow-orange-100' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        {activeOrder?.status === 'ReadyForPickup' ? 'Confirm Pickup' : 'Wait for Ready'}
                      </button>
                      {activeOrder?.status !== 'ReadyForPickup' && (
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center italic">Vendor is preparing the order...</p>
                      )}
                    </div>
                  ) : ['PickedUp', 'OutForDelivery'].includes(activeOrder?.status || '') ? (
                    <button 
                      onClick={handleDeliver}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Delivered
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-emerald-100 text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" />
                       Order Completed!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Sheet */}
              {activeOrder?.status !== 'Pending' && activeOrder?.status !== 'Delivered' && (
                <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (activeOrder?.status === 'Accepted' || activeOrder?.status === 'Assigned' || activeOrder?.status === 'ReadyForPickup') {
                        setMapTarget('vendor');
                      } else {
                        setMapTarget('customer');
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all"
                  >
                    <Navigation className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {['Accepted', 'Assigned', 'ReadyForPickup'].includes(activeOrder?.status || '') ? 'To Vendor' : 'To Customer'}
                    </span>
                  </button>
                  <button 
                    onClick={() => activeOrder && window.open(`tel:${activeOrder.customerPhone}`)}
                    className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all"
                  >
                    <PhoneCall className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Call Cust.</span>
                  </button>
                  <button onClick={() => setActiveTab('support')} className="flex items-center justify-center gap-2 p-4 bg-slate-50 rounded-2xl active:scale-95 transition-all col-span-2">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Support Helper</span>
                  </button>
                </div>
              )}
              
              {/* Interactive Map View */}
              <div className="h-64 bg-slate-200 rounded-[2.5rem] relative overflow-hidden shadow-xl border-4 border-white">
                {(() => {
                  const isHeadingToVendor = ['Assigned', 'Pending', 'Accepted', 'Preparing', 'ReadyForPickup'].includes(activeOrder?.status || '');
                  const routeOrigin = getSafeCoords(currentLocation || (isHeadingToVendor ? activeOrder?.deliveryLocation : activeOrder?.pickupLocation));
                  const routeDestination = getSafeCoords(isHeadingToVendor ? activeOrder?.pickupLocation : activeOrder?.deliveryLocation);

                  return !hasValidKey ? (
                    <LiveMap 
                      riderLoc={currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined}
                      vendorLoc={activeOrder?.pickupLocation && typeof activeOrder.pickupLocation.lat === 'number' ? [activeOrder.pickupLocation.lat, activeOrder.pickupLocation.lng] : undefined}
                      customerLoc={activeOrder?.deliveryLocation && typeof activeOrder.deliveryLocation.lat === 'number' ? [activeOrder.deliveryLocation.lat, activeOrder.deliveryLocation.lng] : undefined}
                      interactive={true}
                    />
                  ) : (
                    <APIProvider apiKey={API_KEY} version="weekly">
                      <Map
                        defaultCenter={currentLocation || routeDestination}
                        defaultZoom={14}
                        mapId="DEMO_MAP_ID"
                        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                        className="w-full h-full"
                        disableDefaultUI
                      >
                        <RouteMap 
                          origin={routeOrigin} 
                          destination={routeDestination} 
                          onUpdateETA={setEta}
                        />
                      </Map>
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                         <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">EST. ARRIVAL</p>
                            <p className="text-sm font-black text-indigo-600 leading-none">{eta}</p>
                         </div>
                         <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center">
                            <Navigation className="w-5 h-5 animate-pulse" />
                         </div>
                      </div>
                    </APIProvider>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuickNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Full-screen Map Modal */}
      <AnimatePresence>
        {mapTarget && activeOrder && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <div className="absolute top-8 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
               <button 
                onClick={() => setMapTarget(null)}
                className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center pointer-events-auto active:scale-95 transition-all text-slate-900"
               >
                 <ArrowLeft className="w-6 h-6" />
               </button>
               <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto">
                 <div className="text-left">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Time to {mapTarget}</p>
                   <p className="text-sm font-black italic">{eta}</p>
                 </div>
                 <div className="w-px h-6 bg-white/20"></div>
                 <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                   <Navigation className="w-4 h-4 animate-pulse" />
                 </div>
               </div>
            </div>

            <div className="flex-1 bg-slate-100 relative">
              {!hasValidKey ? (
                <LiveMap 
                  riderLoc={currentLocation ? [currentLocation.lat, currentLocation.lng] : undefined}
                  vendorLoc={activeOrder?.pickupLocation && typeof activeOrder.pickupLocation.lat === 'number' ? [activeOrder.pickupLocation.lat, activeOrder.pickupLocation.lng] : undefined}
                  customerLoc={activeOrder?.deliveryLocation && typeof activeOrder.deliveryLocation.lat === 'number' ? [activeOrder.deliveryLocation.lat, activeOrder.deliveryLocation.lng] : undefined}
                  interactive={true}
                />
              ) : (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={getSafeCoords(currentLocation || (mapTarget === 'vendor' ? activeOrder.pickupLocation : activeOrder.deliveryLocation))}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    disableDefaultUI
                  >
                    <RouteMap 
                      origin={getSafeCoords(currentLocation || (mapTarget === 'vendor' ? activeOrder.deliveryLocation : activeOrder.pickupLocation))} 
                      destination={getSafeCoords(mapTarget === 'vendor' ? activeOrder.pickupLocation : activeOrder.deliveryLocation)} 
                      onUpdateETA={setEta}
                    />
                  </Map>
                </APIProvider>
              )}
            </div>

            <div className="bg-white p-8 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative z-20">
               <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
               <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${mapTarget === 'vendor' ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
                     <MapPin className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Destination</p>
                     <h3 className="text-lg font-black text-slate-900 leading-tight">
                        {mapTarget === 'vendor' ? activeOrder.vendorName : 'Customer Address'}
                     </h3>
                  </div>
               </div>
               <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                  {mapTarget === 'vendor' ? activeOrder.pickupAddress : activeOrder.deliveryAddress}
               </p>
               <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const loc = getSafeCoords(mapTarget === 'vendor' ? activeOrder.pickupLocation : activeOrder.deliveryLocation);
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}&travelmode=driving`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-gray-200"
                  >
                    <Navigation className="w-4 h-4" />
                    Open Maps
                  </button>
                  <button 
                    onClick={() => {
                      const phone = mapTarget === 'vendor' ? activeOrder.vendorPhone : activeOrder.customerPhone;
                      window.open(`tel:${phone}`);
                    }}
                    className="w-16 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                  >
                    <PhoneCall className="w-6 h-6" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const QuickNav = React.memo(({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (s: any) => void }) => {
  return (
    <div className="fixed bottom-8 left-6 right-6 bg-gray-900 rounded-3xl p-3 flex justify-between shadow-2xl z-50">
      <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl ${activeTab === 'home' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Clock className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('history')} className={`p-3 rounded-2xl ${activeTab === 'history' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><ClipboardList className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('earnings')} className={`p-3 rounded-2xl ${activeTab === 'earnings' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Wallet className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('performance')} className={`p-3 rounded-2xl ${activeTab === 'performance' ? 'bg-white/10 text-white' : 'text-gray-400'}`}><Star className="w-6 h-6" /></button>
      <button onClick={() => setActiveTab('support')} className={`p-3 rounded-2xl ${activeTab === 'support' ? 'bg-white/10 text-white' : 'text-gray-400'} active:scale-95 transition-all outline-none`}><HelpCircle className="w-6 h-6" /></button>
    </div>
  );
});
