import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, MapPin, Bell, Shield, ShieldCheck, LogOut, ChevronRight, Settings as SettingsIcon, Plus, Trash2, Edit2, X, Check, Gift, Share2, Copy, Wallet, Receipt, TrendingUp, TrendingDown, Package, Camera, Bike, Briefcase, Navigation, Loader2, Search, ListTodo, Store, Moon, Sun, AlertTriangle, Smartphone, Globe, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp, collection, query, where, onSnapshot, limit, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Address, Transaction, LanguageCode, Screen } from '../types';
import { translations } from '../translations';
import { LANGUAGES } from '../constants';
import { useTranslation } from '../i18n';
import { referralService } from '../lib/referral';
import { useFirebase, isStrictMasterAdminIdentity } from '../contexts/FirebaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { compressImage } from '../lib/imageUtils';
import { DEFAULT_AVATAR } from '../utils/imagePlaceholders';
import PartnerOnboarding from './PartnerOnboarding';
import MyDashboardsSection from './MyDashboardsSection';
import AppDownloadModal from './AppDownloadModal';
import LanguageSelectorModal from './common/LanguageSelectorModal';

interface ProfileProps {
  onBack: () => void;
  onNavigate: (screen: Screen, id?: string) => void;
  language: LanguageCode;
  isAdmin?: boolean;
}

export default function Profile({ onBack, onNavigate, language, isAdmin: propIsAdmin }: ProfileProps) {
  const t = translations[language].profile;
  const { user, userProfile: contextProfile, isAdmin: contextIsAdmin, isBranchAdmin, logout, deactivateAccount } = useFirebase();
  const { language: activeLang, setLanguage: setAppLanguage } = useTranslation();
  const [showLangModal, setShowLangModal] = useState(false);

  const isMaster = isStrictMasterAdminIdentity(user?.email, user?.phoneNumber, user?.uid);
  
  const isAdmin = isMaster || contextIsAdmin || Boolean(propIsAdmin && isMaster);
  const { theme, toggleTheme } = useTheme();
  
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showAppDownloadModal, setShowAppDownloadModal] = useState(false);
  
  const isDeliveryPartnerOriginal = contextProfile?.role === 'delivery' || localStorage.getItem('isDeliveryPartner') === 'true';
  const isVendorOriginal = contextProfile?.role === 'vendor' || localStorage.getItem('isVendor') === 'true';

  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [deliveryProfile, setDeliveryProfile] = useState<any | null>(null);
  const [userManagedBranch, setUserManagedBranch] = useState<any | null>(null);
  const [vendorApplication, setVendorApplication] = useState<any | null>(null);
  const [deliveryApplication, setDeliveryApplication] = useState<any | null>(null);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoadingPartners(false);
      return;
    }

    const phone = user.phoneNumber?.replace('+91', '') || '';

    // Listen to vendor profile (by userId or phone fallback)
    const vQueryUser = query(collection(db, 'vendors'), where('userId', '==', user.uid));
    const unsubVendor = onSnapshot(vQueryUser, (snapshot) => {
      if (!snapshot.empty) {
        setVendorProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else if (phone) {
        const vQueryPhone = query(collection(db, 'vendors'), where('phone', '==', phone));
        getDocs(vQueryPhone).then((phoneSnapshot) => {
          if (!phoneSnapshot.empty) {
            setVendorProfile({ id: phoneSnapshot.docs[0].id, ...phoneSnapshot.docs[0].data() });
          } else {
            setVendorProfile(null);
          }
        }).catch(() => setVendorProfile(null));
      } else {
        setVendorProfile(null);
      }
    });

    // Listen to delivery profile (by userId or phone fallback)
    const dQueryUser = query(collection(db, 'deliveryPartners'), where('userId', '==', user.uid));
    const unsubDelivery = onSnapshot(dQueryUser, (snapshot) => {
      if (!snapshot.empty) {
        setDeliveryProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else if (phone) {
        const dQueryPhone = query(collection(db, 'deliveryPartners'), where('phone', '==', phone));
        getDocs(dQueryPhone).then((phoneSnapshot) => {
          if (!phoneSnapshot.empty) {
            setDeliveryProfile({ id: phoneSnapshot.docs[0].id, ...phoneSnapshot.docs[0].data() });
          } else {
            setDeliveryProfile(null);
          }
        }).catch(() => setDeliveryProfile(null));
      } else {
        setDeliveryProfile(null);
      }
    });

    // Listen to managed branch (by adminId)
    const bQueryUser = query(collection(db, 'branches'), where('adminId', '==', user.uid));
    const unsubBranch = onSnapshot(bQueryUser, (snapshot) => {
      if (!snapshot.empty) {
        setUserManagedBranch({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setUserManagedBranch(null);
      }
    }, () => setUserManagedBranch(null));

    // Listen to partner applications
    const appQuery = query(
      collection(db, 'partner_applications'),
      where('userId', '==', user.uid)
    );
    const unsubApps = onSnapshot(appQuery, (snapshot) => {
      let vApp = null;
      let dApp = null;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.type === 'Vendor') {
          vApp = { id: docSnap.id, ...data };
        } else if (data.type === 'DeliveryPartner') {
          dApp = { id: docSnap.id, ...data };
        }
      });
      setVendorApplication(vApp);
      setDeliveryApplication(dApp);
      setIsLoadingPartners(false);
    });

    return () => {
      unsubVendor();
      unsubDelivery();
      unsubBranch();
      unsubApps();
    };
  }, [user]);

  // Real-time approval evaluations for dynamic RBAC profile cards
  const isVendorApproved = Boolean(
    isMaster ||
    (vendorProfile && (vendorProfile.status === 'Approved' || vendorProfile.status === 'Active')) ||
    (vendorApplication && vendorApplication.status === 'Approved') ||
    contextProfile?.role === 'vendor' ||
    localStorage.getItem('isVendor') === 'true'
  );

  const isDeliveryApproved = Boolean(
    isMaster ||
    (deliveryProfile && ['Approved', 'Online', 'Offline', 'On Trip', 'Active'].includes(deliveryProfile.status)) ||
    (deliveryApplication && deliveryApplication.status === 'Approved') ||
    contextProfile?.role === 'delivery' ||
    localStorage.getItem('isDeliveryPartner') === 'true'
  );

  const isBranchAdminApproved = Boolean(
    isMaster ||
    isBranchAdmin ||
    contextProfile?.role === 'branchAdmin' ||
    Boolean(userManagedBranch)
  );

  const [view, setView] = useState<'main' | 'addresses' | 'refer' | 'wallet' | 'editProfile'>('main');

  const validateProfileForm = () => {
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) {
      errs.name = 'Full name is required';
    } else if (editForm.name.trim().length < 3) {
      errs.name = 'Name must be at least 3 characters';
    }

    if (editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email.trim())) {
        errs.email = 'Please enter a valid email address';
      }
    }

    if (!editForm.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else {
      const phoneDigits = editForm.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        errs.phone = 'Phone number must be exactly 10 digits';
      } else if (!/^[6-9]/.test(phoneDigits)) {
        errs.phone = 'Please enter a valid Indian mobile number';
      }
    }

    if (editForm.fullAddress && editForm.fullAddress.trim() && editForm.fullAddress.trim().length < 10) {
      errs.fullAddress = 'Address details must be at least 10 characters long';
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleConfirmDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateAccount();
      onNavigate('login');
    } catch (err) {
      console.error("Deactivation failed:", err);
    } finally {
      setIsDeactivating(false);
      setShowDeactivate(false);
    }
  };

  const [walletBalance, setWalletBalance] = useState(() => referralService.getWalletBalance());
  const [transactions, setTransactions] = useState<Transaction[]>(() => referralService.getTransactions());
  const [supportInfo] = useState(() => {
    const saved = localStorage.getItem('supportInfo');
    return saved ? JSON.parse(saved) : { 
      phone: '7416574197', 
      secondaryPhone: '8790729816',
      email: 'Localbandimultiservices@gmail.com' 
    };
  });

  const [userProfile, setUserProfile] = useState({
    name: contextProfile?.name || user?.displayName || 'Lokal User',
    email: contextProfile?.email || user?.email || '',
    phone: contextProfile?.phone || '',
    photo: (contextProfile as any)?.photo || user?.photoURL || DEFAULT_AVATAR,
    fullAddress: (contextProfile as any)?.fullAddress || ''
  });

  const [editForm, setEditForm] = useState(userProfile);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      where('status', 'in', ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'OutForDelivery']),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveOrder({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveOrder(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (contextProfile) {
      const updated = {
        name: contextProfile.name || user?.displayName || 'Lokal User',
        email: contextProfile.email || user?.email || '',
        phone: contextProfile.phone || '',
        photo: (contextProfile as any).photo || user?.photoURL || DEFAULT_AVATAR,
        fullAddress: (contextProfile as any).fullAddress || ''
      };
      setUserProfile(updated);
      // Sync editForm only if not in the middle of editing
      if (view !== 'editProfile') {
        setEditForm(updated);
      }
    }
  }, [contextProfile, user, view]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  React.useEffect(() => {
    if (contextProfile && contextProfile.addresses) {
      setAddresses(contextProfile.addresses);
    } else {
      const saved = localStorage.getItem('user_addresses');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAddresses(parsed);
        } catch (e) {
          console.error("Failed to parse addresses", e);
        }
      } else {
        setAddresses([
          { id: '1', label: 'Home', recipientName: '', phone: '', pincode: '', address: '', isDefault: true },
        ]);
      }
    }
  }, [contextProfile]);

  React.useEffect(() => {
    if (addresses.length > 0) {
      localStorage.setItem('user_addresses', JSON.stringify(addresses));
    }
  }, [addresses]);

  React.useEffect(() => {
    const handleUpdate = () => {
      setWalletBalance(referralService.getWalletBalance());
      setTransactions(referralService.getTransactions());
    };
    window.addEventListener('wallet_updated', handleUpdate);
    return () => window.removeEventListener('wallet_updated', handleUpdate);
  }, []);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({
    label: '',
    recipientName: '',
    phone: '',
    pincode: '',
    address: '',
    isDefault: false
  });
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error fetching address suggestions:', err);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setCurrentAddress({
      ...currentAddress,
      address: suggestion.display_name
    });
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  const lookupPincode = async (pincode: string) => {
    if (!/^[1-9][0-9]{5}$/.test(pincode)) return;
    
    setIsLoadingPincode(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        const cityState = `${postOffice.Block}, ${postOffice.District}, ${postOffice.State}`;
        setCurrentAddress(prev => ({
          ...prev,
          address: prev.address ? `${prev.address}, ${cityState}` : cityState
        }));
      }
    } catch (error) {
      console.error('Pincode lookup failed', error);
    } finally {
      setIsLoadingPincode(false);
    }
  };

  const handleLinkPartnerProfileWithCallback = async (pin: string, expectedType: 'vendor' | 'delivery') => {
    if (!pin || (pin.trim().length !== 5 && pin.trim().length !== 4)) {
      alert("Please enter a valid 5-digit Access Code.");
      return false;
    }
    
    setIsLoadingPartners(true);
    try {
      const phone = user?.phoneNumber?.replace('+91', '') || '';
      
      if (expectedType === 'vendor') {
        const vQuery = query(collection(db, 'vendors'), where('accessCode', '==', pin));
        const vSnap = await getDocs(vQuery);
        
        if (!vSnap.empty) {
          const vendorDoc = vSnap.docs[0];
          await updateDoc(vendorDoc.ref, {
            phone: phone,
            userId: user?.uid,
            status: 'Approved',
            updatedAt: serverTimestamp()
          });
          localStorage.setItem(`vendor_unlocked_${vendorDoc.id}`, 'true');
          alert(`Success! Linked to Vendors Dash: ${vendorDoc.data().businessName || 'Shop'}.`);
          setIsLoadingPartners(false);
          onNavigate('vendor');
          return true;
        }
        alert("Access Code not found in our matching vendor list. Please contact administration.");
      } else {
        const dQuery = query(collection(db, 'deliveryPartners'), where('accessCode', '==', pin));
        const dSnap = await getDocs(dQuery);
        
        if (!dSnap.empty) {
          const deliveryDoc = dSnap.docs[0];
          await updateDoc(deliveryDoc.ref, {
            phone: phone,
            userId: user?.uid,
            status: 'Approved',
            updatedAt: serverTimestamp()
          });
          localStorage.setItem(`delivery_unlocked_${deliveryDoc.id}`, 'true');
          alert(`Success! Linked to Delivery Console: ${deliveryDoc.data().name || 'Rider'}.`);
          setIsLoadingPartners(false);
          onNavigate('delivery');
          return true;
        }
        alert("Access Code not found in our matching delivery partners list. Please contact administration.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error linking console: ${err.message || err}`);
    } finally {
      setIsLoadingPartners(false);
    }
    return false;
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          const addr = data.address;
          const formattedAddress = data.display_name;
          const pincode = addr.postcode || '';

          setCurrentAddress(prev => ({
            ...prev,
            pincode: pincode || prev.pincode,
            address: formattedAddress
          }));
          
          if (pincode) {
            validateField('pincode', pincode);
          }
          validateField('address', formattedAddress);
        } catch (error) {
          console.error('Reverse geocoding failed', error);
          setCurrentAddress(prev => ({
            ...prev,
            address: `Lat: ${latitude}, Lon: ${longitude}`
          }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error', error);
        setIsLocating(false);
        alert('Could not get your location. Please check permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    const cleanValue = value.trim();

    switch (name) {
      case 'label':
        if (!cleanValue) error = 'Label is required (e.g. Home, Office)';
        else if (cleanValue.length < 3) error = 'Label should be at least 3 characters';
        break;
      case 'recipientName':
        if (!cleanValue) error = 'Recipient name is required';
        else if (cleanValue.length < 3) error = 'Please enter a valid name (min 3 chars)';
        break;
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '');
        if (!phoneDigits) error = 'Phone number is required';
        else if (phoneDigits.length !== 10) error = 'Phone number must be 10 digits';
        else if (!/^[6-9]/.test(phoneDigits)) error = 'Must be a valid Indian mobile number';
        break;
      case 'pincode':
        if (!cleanValue) error = 'Pincode is required';
        else if (!/^[1-9][0-9]{5}$/.test(cleanValue)) error = 'Enter a valid 6-digit pincode';
        break;
      case 'address':
        if (!cleanValue) error = 'Full address is required';
        else if (cleanValue.length < 10) error = 'Please provide a more detailed address';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const referralCode = 'BANDI777';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check before submission
    const isLabelValid = validateField('label', currentAddress.label || '');
    const isRecipientValid = validateField('recipientName', currentAddress.recipientName || '');
    const isPhoneValid = validateField('phone', currentAddress.phone || '');
    const isPincodeValid = validateField('pincode', currentAddress.pincode || '');
    const isAddressValid = validateField('address', currentAddress.address || '');

    if (!isLabelValid || !isRecipientValid || !isPhoneValid || !isPincodeValid || !isAddressValid) return;

    setShowSaveConfirm(true);
  };

  const confirmSaveAddress = () => {
    let updatedAddresses = [...addresses];

    if (currentAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }

    if (isEditing) {
      updatedAddresses = updatedAddresses.map(a => a.id === isEditing ? { 
        ...a,
        label: currentAddress.label || '',
        recipientName: currentAddress.recipientName || '',
        phone: currentAddress.phone || '',
        pincode: currentAddress.pincode || '',
        address: currentAddress.address || '',
        isDefault: !!currentAddress.isDefault
      } : a);
      setIsEditing(null);
    } else {
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        label: currentAddress.label || '',
        recipientName: currentAddress.recipientName || '',
        phone: currentAddress.phone || '',
        pincode: currentAddress.pincode || '',
        address: currentAddress.address || '',
        isDefault: !!currentAddress.isDefault
      };
      updatedAddresses.push(newAddr);
    }

    setAddresses(updatedAddresses);
    setCurrentAddress({
      label: '',
      recipientName: '',
      phone: '',
      pincode: '',
      address: '',
      isDefault: false
    });
    setErrors({});
    setShowAddForm(false);
    setShowSaveConfirm(false);
  };

  const handleSetDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddresses(prev => prev.map(a => ({
      ...a,
      isDefault: a.id === id
    })));
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddresses(prev => prev.filter(a => a.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleEditClick = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAddress({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      pincode: addr.pincode,
      address: addr.address,
      isDefault: addr.isDefault
    });
    setErrors({});
    setIsEditing(addr.id);
    setShowAddForm(true);
  };

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showPartnerOnboarding, setShowPartnerOnboarding] = useState(false);
  const [defaultPartnerType, setDefaultPartnerType] = useState<string | undefined>(undefined);

  const handlePerformSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem('admin_session_active');
      localStorage.removeItem('lokal_maintenance_mode');
      localStorage.removeItem('activeDeliveryProfile');
      localStorage.removeItem('approvedVendors');
      localStorage.removeItem('localInventory');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_addresses');
      localStorage.removeItem('lokal_branch_id');
      localStorage.removeItem('isDeliveryPartner');
      localStorage.removeItem('isVendor');
      window.dispatchEvent(new Event('storage'));
      setIsSigningOut(false);
      setShowSignOutConfirm(false);
      onNavigate('login');
    }
  };

  const menuItems = [
    ...(isMaster ? [
      { 
        icon: ShieldCheck, 
        label: 'Founder Dashboard', 
        sub: 'Manage App & Approvals (Master Admin Only)', 
        onClick: () => {
          window.location.href = '/admin';
        }
      },
      { 
        icon: Briefcase, 
        label: 'Vendors Dash', 
        sub: 'Admin Override Access (Master Admin Only)',
        onClick: async () => {
          onNavigate('vendor', 'admin-store');
        } 
      },
      { 
        icon: Bike, 
        label: 'Delivery Console', 
        sub: 'Admin Override Access (Master Admin Only)',
        onClick: async () => {
          onNavigate('delivery', 'admin-rider');
        } 
      },
      { 
        icon: Package, 
        label: 'Manual Order Testing', 
        sub: 'Simulate a real order flow (Master Admin Only)',
        onClick: () => {
          onNavigate('home');
          // We'll handle this in Home.tsx via a custom event or localStorage
          localStorage.setItem('runTestOrder', 'true');
        }
      }
    ] : []),
    {
      icon: Globe,
      label: 'Language Selector (Primary Setting)',
      sub: `${(LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0]).native} • 24 Regional Languages`,
      onClick: () => setShowLangModal(true),
    },
    { 
      icon: User, 
      label: t.editProfile, 
      sub: 'Name, Profile Photo, Mobile, Full Address', 
      onClick: () => {
        setEditForm(userProfile);
        setView('editProfile');
      }
    },
    { 
      icon: Smartphone, 
      label: 'Download Mobile Apps (APKs)', 
      sub: 'Customer, Delivery, Vendor & Branch APK links', 
      onClick: () => setShowAppDownloadModal(true) 
    },
    { icon: Package, label: t.myOrders, sub: 'View order history', onClick: () => onNavigate('orders') },
    { icon: ListTodo, label: 'Task List', sub: 'Create and manage local work tasks', onClick: () => onNavigate('tasks') },
    { icon: MapPin, label: t.savedAddresses, sub: `${addresses.length} Addresses saved`, onClick: () => setView('addresses') },
    { icon: Wallet, label: t.lokalWallet, sub: `Balance: ₹${walletBalance}`, onClick: () => setView('wallet') },
    { icon: Gift, label: t.referAndEarn, sub: 'Get ₹15 for every friend', onClick: () => setView('refer') },
    { icon: Bell, label: t.notifications, sub: 'Order updates and offers', onClick: () => onNavigate('notifications') },
    { 
      icon: Share2, 
      label: 'Invite Partners', 
      sub: 'Share Local Bandi Multi Services with friends',
      onClick: async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Local Bandi Multi Services',
              text: 'Join the local revolution! Join as a partner or customer on Local Bandi Multi Services.',
              url: window.location.origin,
            });
          } catch (err) {
            console.log('Share failed:', err);
          }
        } else {
          // Fallback to clipboard
          navigator.clipboard.writeText(window.location.origin);
          alert('Link copied to clipboard! Share it with your partners.');
        }
      }
    },
    { 
      icon: Navigation, 
      label: 'Get the App', 
      sub: 'Install on your home screen', 
      onClick: () => setShowInstallGuide(true)
    },
    { icon: Shield, label: t.accountSecurity, sub: t.dataSecuritySub || '256-bit Data Encryption' },
    { icon: SettingsIcon, label: t.appSettings, sub: 'Dark mode, language etc', onClick: () => onNavigate('settings') },
    { 
      icon: Phone, 
      label: t.customerCare, 
      sub: `Instant Q&A | Support Desk`,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('open_customer_care'));
      }
    },
  ];

  if (view === 'addresses') {
    return (
      <div className="h-full w-full bg-white flex flex-col relative">
        <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white border-b border-gray-50">
          <button onClick={() => setView('main')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900">Saved Addresses</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 pb-32">
          {addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`p-6 rounded-[2.5rem] border shadow-sm transition-all ${addr.isDefault ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-100'}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl shadow-sm ${addr.isDefault ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-white text-yellow-600'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-gray-900">{addr.label}</p>
                      {addr.isDefault && (
                        <span className="text-[8px] font-black bg-gray-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Default</span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{addr.recipientName}</p>
                  </div>
                </div>
                    <div className="flex gap-1.5">
                      {!addr.isDefault && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleSetDefault(addr.id, e)}
                          className="p-2.5 bg-white text-gray-400 rounded-xl hover:text-yellow-600 transition-colors shadow-sm border border-gray-50"
                          title="Set as Default"
                        >
                          <Check className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleEditClick(addr, e)}
                        className="p-2.5 bg-white text-gray-400 rounded-xl hover:text-gray-900 transition-colors shadow-sm border border-gray-50"
                        title="Edit Address"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(addr.id);
                        }}
                        className="p-2.5 bg-white text-gray-400 rounded-xl hover:text-rose-500 transition-colors shadow-sm border border-gray-50"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 leading-relaxed pr-10">{addr.address}</p>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black text-gray-400 italic">PIN: {addr.pincode}</p>
                  <p className="text-[10px] font-black text-gray-400 italic">PH: {addr.phone}</p>
                </div>
              </div>
            </div>
          ))}

          {addresses.length === 0 && !showAddForm && (
            <div className="py-20 text-center text-gray-400">
              <MapPin className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="font-black uppercase tracking-widest text-xs">No address saved yet</p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-md">
          <button 
            onClick={() => {
              setIsEditing(null);
              setCurrentAddress({
                label: '',
                recipientName: '',
                phone: '',
                pincode: '',
                address: '',
                isDefault: false
              });
              setErrors({});
              setShowAddForm(true);
            }}
            className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Address
          </button>
        </div>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Delete {addresses.find(a => a.id === showDeleteConfirm)?.label || 'Address'}?</h3>
                <p className="text-sm text-gray-500 font-bold mb-8 px-4">Are you sure you want to remove this address? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={(e) => handleDeleteAddress(showDeleteConfirm, e)}
                    className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showSaveConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Save {isEditing ? 'Changes' : 'New Address'}?</h3>
                <p className="text-sm text-gray-500 font-bold mb-8 px-4">Do you want to {isEditing ? 'update' : 'add'} this address to your profile?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowSaveConfirm(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmSaveAddress}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showAddForm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900">
                    {isEditing ? 'Edit Address' : 'New Address'}
                  </h3>
                  <button 
                    onClick={() => {
                      const isDirty = currentAddress.label || currentAddress.recipientName || currentAddress.phone || currentAddress.pincode || currentAddress.address;
                      if (isDirty && !window.confirm('Discard unsaved changes?')) return;
                      setShowAddForm(false);
                      setErrors({});
                    }}
                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddAddress} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="addr-label" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                        Label
                      </label>
                      <input 
                        id="addr-label"
                        type="text"
                        placeholder="Home, Work"
                        value={currentAddress.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentAddress({ ...currentAddress, label: val });
                          validateField('label', val);
                        }}
                        onBlur={() => validateField('label', currentAddress.label || '')}
                        className={`w-full bg-gray-50 rounded-2xl p-4 text-xs text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 transition-all ${errors.label ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-yellow-400'}`}
                      />
                      {errors.label && <p className="text-[9px] font-black text-rose-500 mt-1 pl-2 uppercase tracking-widest">{errors.label}</p>}
                    </div>
                    <div className="relative group">
                      <label htmlFor="addr-pincode" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                        Pincode
                      </label>
                      <div className="relative">
                        <input 
                          id="addr-pincode"
                          type="text"
                          placeholder="500081"
                          value={currentAddress.pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setCurrentAddress({ ...currentAddress, pincode: val });
                            validateField('pincode', val);
                            if (val.length === 6) {
                              lookupPincode(val);
                            }
                          }}
                          onBlur={() => validateField('pincode', currentAddress.pincode || '')}
                          className={`w-full bg-gray-50 rounded-2xl p-4 pr-12 text-xs text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 transition-all ${errors.pincode ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-yellow-400'}`}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isLoadingPincode ? (
                            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                          ) : (
                            <Search className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      </div>
                      {errors.pincode && <p className="text-[9px] font-black text-rose-500 mt-1 pl-2 uppercase tracking-widest">{errors.pincode}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="addr-name" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                      Recipient Name
                    </label>
                    <input 
                      id="addr-name"
                      type="text"
                      placeholder="Enter full name"
                      value={currentAddress.recipientName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentAddress({ ...currentAddress, recipientName: val });
                        validateField('recipientName', val);
                      }}
                      onBlur={() => validateField('recipientName', currentAddress.recipientName || '')}
                      className={`w-full bg-gray-50 rounded-2xl p-4 text-xs text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 transition-all ${errors.recipientName ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-yellow-400'}`}
                    />
                    {errors.recipientName && <p className="text-[9px] font-black text-rose-500 mt-1 pl-2 uppercase tracking-widest">{errors.recipientName}</p>}
                  </div>

                  <div>
                    <label htmlFor="addr-phone" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                      Phone Number
                    </label>
                    <input 
                      id="addr-phone"
                      type="tel"
                      placeholder="Phone Number"
                      value={currentAddress.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentAddress({ ...currentAddress, phone: val });
                        validateField('phone', val);
                      }}
                      onBlur={() => validateField('phone', currentAddress.phone || '')}
                      className={`w-full bg-gray-50 rounded-2xl p-4 text-xs text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 transition-all ${errors.phone ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-yellow-400'}`}
                    />
                    {errors.phone && <p className="text-[9px] font-black text-rose-500 mt-1 pl-2 uppercase tracking-widest">{errors.phone}</p>}
                  </div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <label htmlFor="addr-full" className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Full Address
                        </label>
                        <button 
                          type="button"
                          onClick={handleUseLocation}
                          disabled={isLocating}
                          className="text-[9px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-gray-900 transition-colors disabled:opacity-50"
                        >
                          {isLocating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Navigation className="w-3 h-3" />
                          )}
                          Use Current Location
                        </button>
                      </div>
                      <textarea 
                        id="addr-full"
                        placeholder="Enter flat/house no, street, locality..."
                        value={currentAddress.address}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCurrentAddress({ ...currentAddress, address: val });
                          validateField('address', val);
                          fetchAddressSuggestions(val);
                        }}
                        onBlur={() => {
                          validateField('address', currentAddress.address || '');
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        onFocus={() => {
                          if (addressSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        className={`w-full h-24 bg-gray-50 rounded-[2rem] p-5 text-xs text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 transition-all resize-none ${errors.address ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-yellow-400'}`}
                      />
                      {showSuggestions && addressSuggestions.length > 0 && (
                        <div className="absolute z-[100] left-0 right-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-48 overflow-y-auto">
                          {addressSuggestions.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSuggestionClick(s)}
                              className="w-full text-left px-4 py-3 text-[10px] font-bold text-gray-600 hover:bg-yellow-50 border-b border-gray-50 last:border-0 border-dashed"
                            >
                              {s.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <button 
                      type="button"
                      onClick={() => setCurrentAddress({ ...currentAddress, isDefault: !currentAddress.isDefault })}
                      className={`w-10 h-6 rounded-full transition-all relative ${currentAddress.isDefault ? 'bg-yellow-400' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentAddress.isDefault ? 'left-5' : 'left-1'}`}></div>
                    </button>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Set as default address</span>
                  </div>

                  <button 
                    type="submit"
                    disabled={!currentAddress.label || !currentAddress.recipientName || !currentAddress.phone || !currentAddress.pincode || !currentAddress.address || Object.values(errors).some(err => err !== '')}
                    className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs disabled:opacity-50 disabled:grayscale disabled:scale-100"
                  >
                    <Check className="w-5 h-5" />
                    {isEditing ? 'Save Changes' : 'Add Address'}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'wallet') {
    return (
      <div className="h-full w-full bg-white flex flex-col relative overflow-y-auto">
        <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900">Local Bandi Wallet</h2>
        </header>

        <div className="px-6 py-6">
          <div className="bg-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden mb-10 shadow-2xl shadow-gray-200">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Total Balance</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-black">₹{walletBalance}</span>
                <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +₹{transactions.filter(t => t.type === 'credit' && t.date === 'Today').reduce((acc, curr) => acc + curr.amount, 0)} Today
                </span>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                  Add Money
                </button>
                <button className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all backdrop-blur-md">
                  Send to Bank
                </button>
              </div>
            </div>
            <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900">Transactions</h3>
              <button className="text-[10px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-3 py-1.5 rounded-lg">View All</button>
            </div>

            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                    {tx.type === 'credit' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm truncate">{tx.description}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tx.date}</p>
                  </div>
                  <p className={`font-black text-sm whitespace-nowrap ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 bg-yellow-50 border-t border-yellow-100 mx-6 rounded-[2.5rem] mb-12 flex items-center gap-4">
          <div className="bg-yellow-400 p-3 rounded-2xl text-gray-900">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-sm">Need Help?</p>
            <p className="text-xs text-gray-500 font-medium">Questions about your transactions?</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'refer') {
    return (
      <div className="h-full w-full bg-white flex flex-col relative overflow-y-auto">
        <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10">
          <button onClick={() => setView('main')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900">Refer & Earn</h2>
        </header>

        <div className="px-6 py-8 flex flex-col items-center">
          <div className="w-48 h-48 bg-yellow-100 rounded-[4rem] flex items-center justify-center mb-8 relative">
            <Gift className="w-24 h-24 text-yellow-600" />
            <div className="absolute -top-2 -right-2 bg-gray-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              Earn ₹15
            </div>
          </div>

          <h3 className="text-3xl font-black text-gray-900 text-center mb-4 px-4 leading-tight">
            Refer & Earn<br />Free Cash
          </h3>
          <p className="text-gray-500 font-bold text-center mb-10 px-8 leading-relaxed">
            Invite friends to <span className="text-gray-900 font-black">Local Bandi Multi Services</span>. New users get <span className="text-emerald-600 font-black">₹15</span> bonus via your link, and you get <span className="text-indigo-600 font-black">₹15</span> after their first successful order !
          </p>

          <div className="w-full bg-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Referral Code</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-gray-900 tracking-widest">{referralCode}</span>
              <button 
                onClick={handleCopy}
                className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-gray-400 shadow-sm'}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-4 mt-10">
            <button 
              onClick={() => {
                const referralLink = `${window.location.origin}?ref=${referralCode}`;
                if (navigator.share) {
                  navigator.share({
                    title: 'Local Bandi Multi Services',
                    text: `Hey! Check out Local Bandi Multi Services - it's the easiest way to get things delivered and find local services. Use my referral link to get an instant ₹15 reward in your wallet! 🎁`,
                    url: referralLink,
                  });
                } else {
                  navigator.clipboard.writeText(referralLink);
                  alert('Referral link copied to clipboard!');
                }
              }}
              className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <Share2 className="w-5 h-5" />
              Share with Friends
            </button>
          </div>

          <div className="mt-12 space-y-6 w-full">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center">Referral Rules</h4>
            <div className="space-y-4">
              {[
                { step: 1, text: 'Share your code with friends' },
                { step: 2, text: 'Friend downloads & gets ₹15 bonus via link' },
                { step: 3, text: 'Friend completes their 1st successful order' },
                { step: 4, text: 'You receive ₹15 in your wallet instantly!' }
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4 px-4">
                  <div className="w-8 h-8 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                    {item.step}
                  </div>
                  <p className="text-sm font-bold text-gray-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 flex flex-col font-sans transition-colors">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-50 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </motion.button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-gray-900 dark:text-white font-display italic tracking-tight">{t.title}</h2>
        </div>
        <div className="flex-1" />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center transition-colors shadow-sm"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-600" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </motion.button>
      </header>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3 shadow-md"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wide">Profile Updated</p>
              <p className="text-[11px] font-bold text-emerald-600/90 dark:text-emerald-500/90">Your name, email, phone number, and address are saved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-6 group cursor-pointer" 
            onClick={() => {
              setEditForm(userProfile);
              setView('editProfile');
            }}
          >
            <div className="w-32 h-32 rounded-[3rem] border-4 border-white shadow-2xl shadow-gray-200 overflow-hidden relative transition-transform group-hover:scale-105">
              {userProfile.photo && <img src={userProfile.photo} className="w-full h-full object-cover" alt="Profile" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white p-2.5 rounded-2xl border-4 border-white shadow-lg shadow-gray-200 transition-transform group-hover:rotate-12">
              <Edit2 className="w-4 h-4 text-yellow-400" />
            </div>
          </motion.div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter font-display transition-colors">{userProfile.name}</h3>
          
          {userProfile.fullAddress && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold text-center mt-1 px-8 transition-colors">{userProfile.fullAddress}</p>
          )}

          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">{userProfile.phone || user?.email || 'Authenticated Account'}</p>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20 transition-colors">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live Cloud Connection</span>
            </div>
          </div>
          
          <div className="flex gap-4 w-full mt-8">
            <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 text-center shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 transition-colors">Orders</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white italic font-display transition-colors">42</p>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 text-center shadow-sm hover:shadow-md transition-all">
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 transition-colors">Savings</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white italic font-display transition-colors">₹1,240</p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[2.5rem] p-5 flex items-center gap-4 relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 dark:bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-xl group-hover:scale-110 transition-transform" />
            <div className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0 transition-colors">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest leading-none mb-1.5 transition-colors">Safe & Secure Transactions</p>
              <p className="text-[9px] font-bold text-emerald-700/70 dark:text-emerald-400/60 leading-relaxed transition-colors">Encrypted processing for your personal and payment data.</p>
            </div>
          </div>
        </div>

        {/* Dynamic Role-Based Dashboards (Rules 1-16) */}
        <MyDashboardsSection 
          isMaster={isMaster}
          isVendorApproved={isVendorApproved}
          isDeliveryApproved={isDeliveryApproved}
          isBranchAdminApproved={isBranchAdminApproved}
          vendorProfileId={vendorProfile?.id}
          deliveryProfileId={deliveryProfile?.id}
          vendorProfile={vendorProfile}
          deliveryProfile={deliveryProfile}
          onNavigate={onNavigate}
          userPhone={userProfile.phone || user?.phoneNumber || ''}
          userName={userProfile.name}
        />

        {/* Active Order Tracking - Real-time tracking shortcut */}
        {activeOrder && (
          <div className="px-6 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                localStorage.setItem('trackOrderId', activeOrder.id);
                onNavigate('orders');
              }}
              className="bg-gray-900 dark:bg-slate-800 rounded-[2.5rem] p-6 text-white shadow-xl shadow-gray-200 dark:shadow-none flex items-center justify-between cursor-pointer relative overflow-hidden group transition-colors"
            >
              <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform">
                <Bike className="w-24 h-24 -mr-4 -mt-4 text-white" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg relative shrink-0">
                  <Navigation className="w-6 h-6 text-gray-900 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-ping" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Live Tracking</p>
                  <h3 className="text-sm font-black italic tracking-tight">Order #{activeOrder.id.slice(-6).toUpperCase()}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">{activeOrder.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                <button className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors">
                  Track
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Share Section - Added per user request */}
        <div className="px-6 mb-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              const shareData = {
                title: 'Local Bandi Multi Services',
                text: 'Join the local revolution! Join as a partner or customer on Local Bandi Multi Services.',
                url: window.location.origin,
              };
              if (navigator.share) {
                try {
                  await navigator.share(shareData);
                } catch (err) {
                  console.log('Share failed:', err);
                }
              } else {
                navigator.clipboard.writeText(window.location.origin);
                alert('Link copied to clipboard! Share it with your friends.');
              }
            }}
            className="bg-indigo-600 dark:bg-indigo-700 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-between cursor-pointer relative overflow-hidden group transition-colors"
          >
            <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform">
              <Share2 className="w-24 h-24 -mr-4 -mt-4 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Spread the Word</p>
              <h3 className="text-xl font-black italic tracking-tight">Share Local Bandi</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10">
              <Share2 className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        <div className="px-6 space-y-3 pb-12">
          {/* Primary Option: Language Selector */}
          <button
            type="button"
            onClick={() => setShowLangModal(true)}
            className="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-indigo-50 to-amber-50 dark:from-indigo-950/40 dark:to-slate-900 rounded-[2.5rem] border border-indigo-200/80 dark:border-indigo-500/30 shadow-sm hover:shadow-md transition-all text-left cursor-pointer group"
          >
            <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md mb-1">
                Primary Preference
              </span>
              <p className="font-black text-sm text-gray-900 dark:text-white">
                App Language: {(LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0]).native}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                Tap to switch across 24 Indian & global languages
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </button>

          {menuItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-[2.5rem] transition-all text-left border border-transparent shadow-sm hover:shadow-md hover:border-gray-50 dark:hover:border-slate-800 group"
            >
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors group-hover:shadow-sm">
                <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:translate-x-0.5 transition-transform">{item.label}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}

          {/* Separate & Distinct Google Play Store Compliance Sections */}
          <div className="pt-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-3">
              Legal &amp; Play Store Compliance
            </p>

            {/* Section 1: Terms and Conditions */}
            <a
              href="/terms-customer.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 p-5 bg-gray-50/80 dark:bg-slate-800/70 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-[2.5rem] transition-all text-left border border-gray-100 dark:border-slate-700 group"
            >
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm text-amber-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-gray-900 dark:text-white">Terms and Conditions</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                  Independent Customer App Terms Page &bull; /terms-customer.html
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
            </a>

            {/* Section 2: Privacy Policy */}
            <a
              href="/privacy-customer.html"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 p-5 bg-gray-50/80 dark:bg-slate-800/70 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-[2.5rem] transition-all text-left border border-gray-100 dark:border-slate-700 group"
            >
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-gray-900 dark:text-white">Privacy Policy</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                  Independent Customer App Privacy Page &bull; /privacy-customer.html
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
            </a>
          </div>
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            onClick={() => setShowDeactivate(true)}
            className="w-full flex items-center gap-4 p-5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2.5rem] transition-all text-left text-rose-600 mt-6 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20 group"
          >
            <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shadow-sm text-rose-600">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-black uppercase tracking-widest text-xs block text-rose-600">Deactivate Account</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight mt-0.5 block">Instant & permanent deletion</span>
            </div>
          </motion.button>

          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full flex items-center gap-4 p-5 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-[2.5rem] transition-all text-left text-rose-500 mt-10 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20 group cursor-pointer"
          >
            <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors shadow-sm">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-black uppercase tracking-widest text-xs">{t.signOut}</span>
          </motion.button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 max-w-sm w-full border border-gray-100 dark:border-slate-800 shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                <LogOut className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white italic">Sign Out of Account?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You will need to sign in with your phone or email to access your orders and wallet.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-3.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-black rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={handlePerformSignOut}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSigningOut ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Sign Out'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile View */}
      <AnimatePresence>
        {view === 'editProfile' && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
          >
            <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white border-b border-gray-50">
              <button 
                onClick={() => {
                  const isDirty = editForm.name !== userProfile.name || editForm.email !== userProfile.email || editForm.phone !== userProfile.phone || editForm.photo !== userProfile.photo;
                  if (isDirty && !window.confirm('Discard unsaved profile changes?')) return;
                  setView('main');
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-900" />
              </button>
              <h2 className="text-xl font-black text-gray-900 italic tracking-tight">Edit Profile</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <label className="cursor-pointer block relative">
                    <div className="w-32 h-32 rounded-[3rem] border-4 border-yellow-400 shadow-2xl overflow-hidden group-hover:opacity-90 transition-opacity">
                      <img 
                        src={editForm.photo} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-8 h-8 text-white/70" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all border-4 border-white hover:bg-black">
                      <Camera className="w-5 h-5 text-yellow-400" />
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const compressed = await compressImage(reader.result as string);
                              setEditForm({ ...editForm, photo: compressed });
                            } catch (err) {
                              console.error("Compression error:", err);
                              setEditForm({ ...editForm, photo: reader.result as string });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tap photo to change</p>
              </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">Full Name</label>
                      <input 
                        type="text"
                        value={editForm.name}
                        onChange={(e) => {
                          setEditForm({ ...editForm, name: e.target.value });
                          if (profileErrors.name) setProfileErrors(prev => ({ ...prev, name: '' }));
                        }}
                        className={`w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 transition-all shadow-sm ${profileErrors.name ? 'border-rose-400 bg-rose-50/20' : 'border-transparent focus:border-yellow-400'}`}
                      />
                      {profileErrors.name && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1.5 pl-2 uppercase tracking-wide">{profileErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">Full Address</label>
                      <textarea 
                        value={editForm.fullAddress || ''}
                        onChange={(e) => {
                          setEditForm({ ...editForm, fullAddress: e.target.value });
                          if (profileErrors.fullAddress) setProfileErrors(prev => ({ ...prev, fullAddress: '' }));
                        }}
                        placeholder="House No, Street, Landmark, Area"
                        className={`w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 transition-all shadow-sm min-h-[100px] resize-none ${profileErrors.fullAddress ? 'border-rose-400 bg-rose-50/20' : 'border-transparent focus:border-yellow-400'}`}
                      />
                      {profileErrors.fullAddress && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1.5 pl-2 uppercase tracking-wide">{profileErrors.fullAddress}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">Email Address</label>
                      <input 
                        type="email"
                        value={editForm.email}
                        onChange={(e) => {
                          setEditForm({ ...editForm, email: e.target.value });
                          if (profileErrors.email) setProfileErrors(prev => ({ ...prev, email: '' }));
                        }}
                        className={`w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 transition-all shadow-sm ${profileErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-transparent focus:border-yellow-400'}`}
                      />
                      {profileErrors.email && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1.5 pl-2 uppercase tracking-wide">{profileErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">Phone Number</label>
                      <input 
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => {
                          setEditForm({ ...editForm, phone: e.target.value });
                          if (profileErrors.phone) setProfileErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        className={`w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 transition-all shadow-sm ${profileErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-transparent focus:border-yellow-400'}`}
                      />
                      {profileErrors.phone && (
                        <p className="text-[10px] font-bold text-rose-500 mt-1.5 pl-2 uppercase tracking-wide">{profileErrors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
 
              <div className="p-6 bg-white border-t border-gray-50">
                <button 
                  onClick={() => {
                    if (validateProfileForm()) {
                      setShowProfileConfirm(true);
                    }
                  }}
                  className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                >
                  <Check className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstallGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-end justify-center"
            onClick={() => setShowInstallGuide(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-yellow-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-100">
                  <Navigation className="w-10 h-10 text-gray-900" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Install Local Bandi Multi Services</h3>
                <p className="text-gray-400 font-bold text-sm tracking-tight px-8">Get the app-like experience with faster access and full screen view.</p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black shrink-0">1</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Open in Browser</p>
                    <p className="text-xs text-gray-400 font-bold">Ensure you are using Safari (iOS) or Chrome (Android).</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black shrink-0">2</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Tap Share or Menu</p>
                    <p className="text-xs text-gray-400 font-bold">Look for the share icon or the three-dot menu at the top/bottom.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black shrink-0">3</div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">Add to Home Screen</p>
                    <p className="text-xs text-gray-400 font-bold">Find and tap "Add to Home Screen" to install the app.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowInstallGuide(false)}
                className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-gray-200 active:scale-95 transition-all"
              >
                Got It, Thanks!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Save Profile?</h3>
              <p className="text-sm text-gray-500 font-bold mb-8 px-4">Are you sure you want to update your profile information?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowProfileConfirm(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSavingProfile}
                  onClick={async () => {
                    if (user) {
                      setIsSavingProfile(true);
                      const path = `users/${user.uid}`;
                      try {
                        const updates: any = {
                          name: editForm.name,
                          email: editForm.email,
                          phone: editForm.phone,
                          photo: editForm.photo,
                          fullAddress: editForm.fullAddress || '',
                          addresses: addresses,
                          updatedAt: serverTimestamp()
                        };
                        await updateDoc(doc(db, 'users', user.uid), updates);
                        setUserProfile(editForm);
                        setView('main');
                        setShowProfileConfirm(false);
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      } catch (e) {
                        console.error("Failed to update profile", e);
                        handleFirestoreError(e, OperationType.UPDATE, path);
                        alert("Failed to update profile. Please try again.");
                      } finally {
                        setIsSavingProfile(false);
                      }
                    }
                  }}
                  className={`flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 flex items-center justify-center gap-1.5 ${isSavingProfile ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPartnerOnboarding && user && (
          <PartnerOnboarding 
            userId={user.uid}
            defaultType={defaultPartnerType as any}
            onClose={() => {
              setShowPartnerOnboarding(false);
              setDefaultPartnerType(undefined);
            }}
            onSuccess={() => {
              setShowPartnerOnboarding(false);
              setDefaultPartnerType(undefined);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeactivate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col p-8 space-y-6 text-center border border-gray-100 dark:border-slate-800"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner animate-pulse">
                <AlertTriangle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Deactivate Account?</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Immediate Effect • Permanent Action</p>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Deactivating your account will instantly remove your personal profile from our databases, end your active sessions, cancel any pending partner registrations, and remove your wallet balance.
              </p>

              <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider text-center">
                This action cannot be undone.
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={handleConfirmDeactivate}
                  disabled={isDeactivating}
                  className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 dark:shadow-none hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isDeactivating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Deactivate Instantly"
                  )}
                </button>
                <button 
                  onClick={() => setShowDeactivate(false)}
                  disabled={isDeactivating}
                  className="w-full py-5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel & Keep Account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppDownloadModal
        isOpen={showAppDownloadModal}
        onClose={() => setShowAppDownloadModal(false)}
        defaultAppId="customer"
      />

      <LanguageSelectorModal
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
        selectedLanguage={activeLang}
        onSelectLanguage={(code) => {
          setAppLanguage(code);
          localStorage.setItem('lokal_language', code);
          setShowLangModal(false);
        }}
      />
    </div>
  );
}
