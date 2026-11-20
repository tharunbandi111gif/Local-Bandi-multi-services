import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  User,
  Phone,
  Camera,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Package,
  FileText,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Power,
  ChevronRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  Copy
} from 'lucide-react';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useFirebase } from '../../contexts/FirebaseContext';
import { useTranslation } from '../../i18n';
import { LANGUAGES } from '../../constants';
import { Address } from '../../types';
import { compressImage } from '../../lib/imageUtils';
import { DEFAULT_AVATAR } from '../../utils/imagePlaceholders';
import LanguageSelectorModal from './LanguageSelectorModal';

export type UniversalProfileAppKey = 'customer' | 'delivery' | 'vendor' | 'branch' | 'admin';

export interface UniversalProfileSectionProps {
  appKey: UniversalProfileAppKey;
  themeMode?: 'light' | 'dark';
  roleLabel?: string;
  entityOverride?: {
    name?: string;
    phone?: string;
    photo?: string;
    branchId?: string;
    branchName?: string;
    subtitle?: string;
  };
  onSaveEntityProfile?: (updated: { name: string; phone: string; photo: string }) => Promise<void> | void;
  onNavigateOrders?: () => void;
  onLogoutSession?: () => Promise<void> | void;
  onSignOutComplete?: () => Promise<void> | void;
  extraSectionsTop?: React.ReactNode;
  extraSectionsBottom?: React.ReactNode;
  hideHeroHeader?: boolean;
}

const APP_LEGAL_LABELS: Record<UniversalProfileAppKey, { title: string; termsUrl: string; privacyUrl: string }> = {
  customer: {
    title: 'Customer App',
    termsUrl: '/terms-customer.html',
    privacyUrl: '/privacy-customer.html',
  },
  delivery: {
    title: 'Delivery Partner App',
    termsUrl: '/terms-delivery.html',
    privacyUrl: '/privacy-delivery.html',
  },
  vendor: {
    title: 'Vendor Merchant App',
    termsUrl: '/terms-vendor.html',
    privacyUrl: '/privacy-vendor.html',
  },
  branch: {
    title: 'Franchise Branch Admin App',
    termsUrl: '/terms-branch.html',
    privacyUrl: '/privacy-branch.html',
  },
  admin: {
    title: 'Master Admin App',
    termsUrl: '/terms-admin.html',
    privacyUrl: '/privacy-admin.html',
  },
};

export default function UniversalProfileSection({
  appKey,
  themeMode = 'dark',
  roleLabel,
  entityOverride,
  onSaveEntityProfile,
  onNavigateOrders,
  onLogoutSession,
  onSignOutComplete,
  extraSectionsTop,
  extraSectionsBottom,
  hideHeroHeader = false,
}: UniversalProfileSectionProps) {
  const { user, userProfile, logout } = useFirebase();
  const { language, setLanguage } = useTranslation();

  const [showLangModal, setShowLangModal] = useState(false);

  // Profile fields
  const resolvedInitialName =
    entityOverride?.name || userProfile?.name || user?.displayName || 'Local Bandi User';
  const resolvedInitialPhone =
    entityOverride?.phone ||
    userProfile?.phone ||
    (user?.phoneNumber ? user.phoneNumber.replace(/^\+91/, '') : '') ||
    localStorage.getItem('user_phone') ||
    '';
  const resolvedInitialPhoto =
    entityOverride?.photo || userProfile?.photo || user?.photoURL || DEFAULT_AVATAR;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formName, setFormName] = useState(resolvedInitialName);
  const [formPhone, setFormPhone] = useState(resolvedInitialPhone);
  const [formPhoto, setFormPhoto] = useState(resolvedInitialPhoto);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingProfile) {
      setFormName(resolvedInitialName);
      setFormPhone(resolvedInitialPhone);
      setFormPhoto(resolvedInitialPhoto);
    }
  }, [resolvedInitialName, resolvedInitialPhone, resolvedInitialPhoto, isEditingProfile]);

  // Delivery Addresses State
  const [addresses, setAddresses] = useState<Address[]>(() => {
    try {
      const saved = localStorage.getItem('user_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    if (Array.isArray(userProfile?.addresses)) {
      setAddresses(userProfile.addresses);
      try {
        localStorage.setItem('user_addresses', JSON.stringify(userProfile.addresses));
      } catch {}
    }
  }, [userProfile?.addresses]);

  const [showAddressSection, setShowAddressSection] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrPincode, setAddrPincode] = useState('507001');
  const [addrLine, setAddrLine] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // View History ('My Orders')
  const [showOrdersHistory, setShowOrdersHistory] = useState(false);
  const [ordersScope, setOrdersScope] = useState<'my' | 'context'>(appKey === 'customer' ? 'my' : 'context');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [contextOrders, setContextOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState<'logout' | 'signout' | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Live Orders Subscription
  useEffect(() => {
    if (!showOrdersHistory || !db) return;
    setLoadingOrders(true);

    const unsubs: Array<() => void> = [];

    if (user?.uid) {
      const qMy = query(collection(db, 'orders'), where('userId', '==', user.uid), limit(25));
      unsubs.push(
        onSnapshot(
          qMy,
          (snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => {
                const ta = new Date(a.timestamp || a.createdAt?.toDate?.() || 0).getTime();
                const tb = new Date(b.timestamp || b.createdAt?.toDate?.() || 0).getTime();
                return tb - ta;
              });
            setMyOrders(list);
            setLoadingOrders(false);
          },
          () => setLoadingOrders(false)
        )
      );
    } else {
      setLoadingOrders(false);
    }

    if (appKey !== 'customer') {
      const branchFilter = entityOverride?.branchId;
      const qContext =
        appKey === 'branch' && branchFilter && branchFilter !== 'global'
          ? query(collection(db, 'orders'), where('branchId', '==', branchFilter), limit(30))
          : query(collection(db, 'orders'), limit(30));

      unsubs.push(
        onSnapshot(
          qContext,
          (snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a: any, b: any) => {
                const ta = new Date(a.timestamp || a.createdAt?.toDate?.() || 0).getTime();
                const tb = new Date(b.timestamp || b.createdAt?.toDate?.() || 0).getTime();
                return tb - ta;
              });
            setContextOrders(list);
            setLoadingOrders(false);
          },
          () => setLoadingOrders(false)
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [showOrdersHistory, user?.uid, appKey, entityOverride?.branchId]);

  const activeLanguageObj = useMemo(
    () => LANGUAGES.find((l) => l.code === language) || LANGUAGES[0],
    [language]
  );

  const legalMeta = APP_LEGAL_LABELS[appKey];
  const isDark = themeMode === 'dark';

  const cardCls = isDark
    ? 'bg-slate-900 border border-white/10 text-white'
    : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white';
  const subCardCls = isDark
    ? 'bg-slate-950/70 border border-white/5 text-slate-200'
    : 'bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200';
  const mutedTextCls = isDark ? 'text-slate-400' : 'text-gray-500 dark:text-slate-400';
  const inputCls = isDark
    ? 'w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:border-amber-400 outline-none'
    : 'w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:border-indigo-500 outline-none';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string, 360, 360, 0.75);
          setFormPhoto(compressed);
        } catch {
          setFormPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setProfileError('Could not process image. Please try another photo.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    const trimmedName = formName.trim();
    const digits = formPhone.replace(/\D/g, '').slice(-10);

    if (trimmedName.length < 2) {
      setProfileError('Please enter a valid full name.');
      return;
    }
    if (digits && digits.length !== 10) {
      setProfileError('Mobile number must be 10 digits.');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (user?.uid) {
        const formattedPhone = digits ? `+91${digits}` : '';
        await setDoc(
          doc(db, 'users', user.uid),
          {
            id: user.uid,
            name: trimmedName,
            phone: formattedPhone || formPhone.trim(),
            photo: formPhoto,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (digits) {
        localStorage.setItem('user_phone', digits);
        localStorage.setItem('lokal_user_phone', `+91${digits}`);
      }

      if (onSaveEntityProfile) {
        await onSaveEntityProfile({
          name: trimmedName,
          phone: digits || formPhone.trim(),
          photo: formPhoto,
        });
      }

      setProfileNotice('Profile saved & synchronized in real time.');
      setTimeout(() => setProfileNotice(null), 3000);
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const persistAddresses = async (nextAddresses: Address[]) => {
    setAddresses(nextAddresses);
    try {
      localStorage.setItem('user_addresses', JSON.stringify(nextAddresses));
    } catch {}
    if (user?.uid) {
      const defaultAddr = nextAddresses.find((a) => a.isDefault) || nextAddresses[0];
      await setDoc(
        doc(db, 'users', user.uid),
        {
          id: user.uid,
          addresses: nextAddresses,
          ...(defaultAddr ? { fullAddress: defaultAddr.address } : {}),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel('Home');
    setAddrRecipient(formName || '');
    setAddrPhone(formPhone.replace(/\D/g, '').slice(-10));
    setAddrPincode('507001');
    setAddrLine('');
    setShowAddAddressForm(true);
    setShowAddressSection(true);
  };

  const openEditAddressForm = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || 'Home');
    setAddrRecipient(addr.recipientName || '');
    setAddrPhone(addr.phone || '');
    setAddrPincode(addr.pincode || '');
    setAddrLine(addr.address || '');
    setShowAddAddressForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine.trim() || addrLine.trim().length < 5) {
      setProfileError('Please enter a valid delivery address.');
      return;
    }
    setIsSavingAddress(true);
    setProfileError(null);
    try {
      let nextList: Address[];
      if (editingAddressId) {
        nextList = addresses.map((a) =>
          a.id === editingAddressId
            ? {
                ...a,
                label: addrLabel.trim() || 'Home',
                recipientName: addrRecipient.trim() || formName,
                phone: addrPhone.trim() || formPhone,
                pincode: addrPincode.trim() || '507001',
                address: addrLine.trim(),
              }
            : a
        );
      } else {
        const newAddr: Address = {
          id: `addr_${Date.now()}`,
          label: addrLabel.trim() || 'Home',
          recipientName: addrRecipient.trim() || formName,
          phone: addrPhone.trim() || formPhone,
          pincode: addrPincode.trim() || '507001',
          address: addrLine.trim(),
          isDefault: addresses.length === 0,
        };
        nextList = [...addresses, newAddr];
      }
      await persistAddresses(nextList);
      setShowAddAddressForm(false);
      setEditingAddressId(null);
      setProfileNotice('Delivery address updated.');
      setTimeout(() => setProfileNotice(null), 2500);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    const nextList = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    await persistAddresses(nextList);
  };

  const handleDeleteAddress = async (id: string) => {
    const filtered = addresses.filter((a) => a.id !== id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0] = { ...filtered[0], isDefault: true };
    }
    await persistAddresses(filtered);
  };

  const handleCopyUrl = (relativePath: string) => {
    const full = `${window.location.origin}${relativePath}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(() => {
        setCopiedUrl(relativePath);
        setTimeout(() => setCopiedUrl(null), 2000);
      });
    }
  };

  const executeLogoutOrSignOut = async (mode: 'logout' | 'signout') => {
    setIsSigningOut(true);
    try {
      if (mode === 'logout' && onLogoutSession) {
        await onLogoutSession();
      } else if (onSignOutComplete) {
        await onSignOutComplete();
      } else {
        localStorage.removeItem('admin_session_active');
        localStorage.removeItem('local_admin_sessions_authorized');
        localStorage.removeItem('user_phone');
        localStorage.removeItem('lokal_user_phone');
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('local_admin_pin_verified');
        await logout();
        window.location.href = '/';
      }
    } finally {
      setIsSigningOut(false);
      setShowSignOutConfirm(null);
    }
  };

  const displayedOrders = ordersScope === 'my' ? myOrders : contextOrders;

  return (
    <div className="space-y-4 w-full">
      {/* Feedback banner */}
      {profileNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{profileNotice}</span>
        </div>
      )}
      {profileError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-between gap-2">
          <span>{profileError}</span>
          <button type="button" onClick={() => setProfileError(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Optional Hero Header */}
      {!hideHeroHeader && (
        <div className={`${cardCls} rounded-[2rem] p-5 flex items-center gap-4 shadow-sm`}>
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/40 bg-slate-800">
              <img src={formPhoto || DEFAULT_AVATAR} alt={formName} className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md cursor-pointer"
              title="Edit Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black tracking-tight truncate">{formName}</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase tracking-wider">
                {roleLabel || legalMeta.title}
              </span>
            </div>
            <p className={`text-xs font-bold mt-0.5 ${mutedTextCls}`}>
              {formPhone ? `+91 ${formPhone.replace(/\D/g, '').slice(-10)}` : user?.email || 'Authenticated Session'}
            </p>
            {(entityOverride?.branchName || entityOverride?.subtitle) && (
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-1">
                {entityOverride.branchName || entityOverride.subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsEditingProfile((v) => !v)}
            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-wider cursor-pointer shrink-0"
          >
            {isEditingProfile ? 'Close' : 'Edit'}
          </button>
        </div>
      )}

      {/* 1. PRIMARY OPTION: LANGUAGE SELECTOR */}
      <div className={`${cardCls} rounded-[2rem] p-5 shadow-sm border-2 ${isDark ? 'border-yellow-400/30 bg-gradient-to-br from-slate-900 to-slate-900/90' : 'border-yellow-300/70 bg-gradient-to-br from-yellow-50/70 to-white dark:from-slate-900 dark:to-slate-900'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <Globe className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600 dark:text-yellow-300 border border-yellow-400/30">
                  Primary Setting
                </span>
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mt-1">
                Language Selector
              </h4>
              <p className={`text-xs font-bold truncate ${mutedTextCls}`}>
                Active: {activeLanguageObj.native} ({activeLanguageObj.label}) &bull; 24 Languages
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLangModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span>Change</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {extraSectionsTop}

      {/* 2. EDITABLE PROFILE FIELDS (Picture, Name, Mobile Number) */}
      <div className={`${cardCls} rounded-[2rem] p-5 shadow-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Personal Profile Details</h4>
              <p className={`text-[10px] font-bold ${mutedTextCls}`}>
                Edit picture, full name &amp; mobile number
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingProfile((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
          >
            <Edit2 className="w-3 h-3" />
            <span>{isEditingProfile ? 'Cancel' : 'Edit Fields'}</span>
          </button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-2 border-t border-white/10 dark:border-white/10 border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 bg-slate-800 shrink-0">
                <img src={formPhoto || DEFAULT_AVATAR} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-wider cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Profile Picture</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <p className={`text-[9px] font-bold ${mutedTextCls}`}>Auto-compressed &amp; synced across all 5 apps</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={`text-[9px] font-black uppercase tracking-widest ${mutedTextCls}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter full name"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[9px] font-black uppercase tracking-widest ${mutedTextCls}`}>Mobile Number</label>
                <input
                  type="tel"
                  maxLength={14}
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className={`${subCardCls} rounded-2xl p-3`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${mutedTextCls}`}>Full Name</p>
              <p className="text-xs font-black mt-0.5 truncate">{formName}</p>
            </div>
            <div className={`${subCardCls} rounded-2xl p-3`}>
              <p className={`text-[9px] font-black uppercase tracking-widest ${mutedTextCls}`}>Mobile Number</p>
              <p className="text-xs font-black font-mono mt-0.5">
                {formPhone ? `+91 ${formPhone.replace(/\D/g, '').slice(-10)}` : 'Not Set'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. DELIVERY ADDRESSES */}
      <div className={`${cardCls} rounded-[2rem] p-5 shadow-sm space-y-3.5`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowAddressSection((v) => !v)}
            className="flex items-center gap-3 text-left flex-1 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Delivery Addresses</h4>
              <p className={`text-[10px] font-bold ${mutedTextCls}`}>
                {addresses.length} saved address{addresses.length === 1 ? '' : 'es'} &bull; Tap to manage
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={openNewAddressForm}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {(showAddressSection || showAddAddressForm) && (
          <div className="space-y-2.5 pt-2 border-t border-white/10 border-gray-100">
            {showAddAddressForm && (
              <form onSubmit={handleSaveAddress} className={`${subCardCls} rounded-2xl p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    {editingAddressId ? 'Edit Delivery Address' : 'New Delivery Address'}
                  </span>
                  <button type="button" onClick={() => setShowAddAddressForm(false)} className="p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Label (Home / Office)"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    placeholder="Pincode (e.g. 507001)"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    placeholder="Recipient Name"
                    className={inputCls}
                  />
                  <input
                    type="tel"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="Contact Phone"
                    className={inputCls}
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  placeholder="House No, Street, Landmark, Mandal / Town"
                  className={inputCls}
                />
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                >
                  {isSavingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </form>
            )}

            {addresses.length === 0 ? (
              <p className={`text-xs font-bold text-center py-4 ${mutedTextCls}`}>
                No saved delivery addresses yet. Click &ldquo;Add&rdquo; to save one.
              </p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className={`${subCardCls} rounded-2xl p-3.5 flex items-start justify-between gap-3`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] font-medium mt-1 ${mutedTextCls}`}>{addr.address}</p>
                    <p className={`text-[10px] font-mono mt-1 ${mutedTextCls}`}>
                      PIN: {addr.pincode || '507001'} &bull; PH: {addr.phone || formPhone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                        title="Set Default"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditAddressForm(addr)}
                      className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 cursor-pointer"
                      title="Edit Address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. VIEW HISTORY: 'MY ORDERS' */}
      <div className={`${cardCls} rounded-[2rem] p-5 shadow-sm space-y-3.5`}>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (appKey === 'customer' && onNavigateOrders) {
                onNavigateOrders();
              } else {
                setShowOrdersHistory((v) => !v);
              }
            }}
            className="flex items-center gap-3 text-left flex-1 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">My Orders &amp; View History</h4>
              <p className={`text-[10px] font-bold ${mutedTextCls}`}>
                Real-time order history, fulfillment status &amp; receipts
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setShowOrdersHistory((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1"
          >
            <span>{showOrdersHistory ? 'Hide' : 'View History'}</span>
            {showOrdersHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showOrdersHistory && (
          <div className="space-y-3 pt-2 border-t border-white/10 border-gray-100">
            {appKey !== 'customer' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrdersScope('context')}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${
                    ordersScope === 'context' ? 'bg-amber-400 text-slate-950' : `${subCardCls}`
                  }`}
                >
                  Active Console Orders ({contextOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersScope('my')}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer ${
                    ordersScope === 'my' ? 'bg-amber-400 text-slate-950' : `${subCardCls}`
                  }`}
                >
                  My Personal Orders ({myOrders.length})
                </button>
              </div>
            )}

            {loadingOrders ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading order history...</span>
              </div>
            ) : displayedOrders.length === 0 ? (
              <p className={`text-xs font-bold text-center py-4 ${mutedTextCls}`}>
                No orders found for this view yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {displayedOrders.map((ord) => (
                  <div key={ord.id} className={`${subCardCls} rounded-2xl p-3.5 flex items-center justify-between gap-3`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black font-mono">
                          #{String(ord.id).slice(-6).toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase">
                          {ord.status || 'Pending'}
                        </span>
                        {ord.branchId && (
                          <span className="text-[9px] font-bold uppercase text-amber-400">
                            {ord.branchId}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] font-bold mt-1 truncate ${mutedTextCls}`}>
                        {ord.customerName || 'Customer'} &bull; {ord.deliveryAddress || 'Branch Delivery'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-emerald-400">
                        ₹{Number(ord.total || ord.totalAmount || 0).toLocaleString()}
                      </p>
                      <p className={`text-[9px] font-bold ${mutedTextCls}`}>
                        {ord.timestamp
                          ? new Date(ord.timestamp).toLocaleDateString()
                          : ord.createdAt?.toDate
                          ? ord.createdAt.toDate().toLocaleDateString()
                          : 'Recent'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {extraSectionsBottom}

      {/* 5. SEPARATE, DISTINCT GOOGLE PLAY COMPLIANCE LEGAL SECTIONS */}
      <div className="space-y-3">
        {/* Distinct Section A: Terms and Conditions */}
        <div className={`${cardCls} rounded-[2rem] p-5 shadow-sm`} id={`legal_terms_section_${appKey}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-purple-400">
                  Independent Legal Page
                </p>
                <h4 className="text-sm font-black uppercase tracking-tight">Terms and Conditions</h4>
                <p className={`text-[10px] font-mono truncate ${mutedTextCls}`}>
                  https://localbandimultiservices.in{legalMeta.termsUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyUrl(legalMeta.termsUrl)}
                className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 cursor-pointer"
                title="Copy Terms URL"
              >
                {copiedUrl === legalMeta.termsUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={legalMeta.termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>Open Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Distinct Section B: Privacy Policy */}
        <div className={`${cardCls} rounded-[2rem] p-5 shadow-sm`} id={`legal_privacy_section_${appKey}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-sky-400">
                  Google Play Data Safety Disclosure
                </p>
                <h4 className="text-sm font-black uppercase tracking-tight">Privacy Policy</h4>
                <p className={`text-[10px] font-mono truncate ${mutedTextCls}`}>
                  https://localbandimultiservices.in{legalMeta.privacyUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyUrl(legalMeta.privacyUrl)}
                className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 cursor-pointer"
                title="Copy Privacy URL"
              >
                {copiedUrl === legalMeta.privacyUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={legalMeta.privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>Open Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECURE LOGOUT & SIGN OUT OPTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowSignOutConfirm('logout')}
          className="py-4 px-5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Power className="w-4 h-4" />
          <span>Logout Session</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSignOutConfirm('signout')}
          className="py-4 px-5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Completely</span>
        </button>
      </div>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
        selectedLanguage={language}
        onSelectLanguage={(lang) => {
          setLanguage(lang);
          setProfileNotice('Language updated across app in real time.');
          setTimeout(() => setProfileNotice(null), 2500);
        }}
      />

      {/* Secure Logout / Sign Out Confirmation */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className={`${cardCls} rounded-[2rem] p-6 max-w-sm w-full space-y-4 shadow-2xl text-center`}>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-black uppercase tracking-tight">
                {showSignOutConfirm === 'logout' ? 'Logout Portal Session?' : 'Sign Out Completely?'}
              </h4>
              <p className={`text-xs font-medium mt-1 ${mutedTextCls}`}>
                {showSignOutConfirm === 'logout'
                  ? 'Locks your active portal session cleanly while keeping your account ready to re-authenticate.'
                  : 'Clears your Firebase auth session and stored credentials on this device.'}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => setShowSignOutConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800/40 text-slate-300 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => executeLogoutOrSignOut(showSignOutConfirm)}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSigningOut && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{showSignOutConfirm === 'logout' ? 'Confirm Logout' : 'Confirm Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
