import React, { useState, useEffect } from 'react';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Ruler, 
  Users, 
  Heart, 
  ShieldCheck,
  Check,
  Camera,
  Star,
  Lock,
  Moon,
  HeartHandshake,
  ChevronDown,
  Trash2,
  Power,
  Search,
  Filter,
  SlidersHorizontal,
  Share2,
  Edit2,
  AlertCircle,
  Zap,
  ArrowRight,
  Plus,
  FileText,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import { MarriageProfile } from '../types';
import { db, auth, handleFirestoreError, OperationType, setupRecaptcha } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, limit } from 'firebase/firestore';
import type { ConfirmationResult } from '../lib/firebase';
import { useFirebase } from '../contexts/FirebaseContext';
// msg91Service removed

interface MarriageBureauProps {
  onBack: () => void;
  isAdmin?: boolean;
  language?: string;
}

const RELIGIONS = [
  { id: 'all', name: 'All', icon: 'Heart' },
  { id: 'unmarried', name: 'Unmarried Only', icon: 'User' },
  { id: 'married', name: '2nd Marriage / Divorced', icon: 'Users' },
  { id: '3rd-marriage', name: '3rd Marriage', icon: 'Star' },
  { id: 'hindu', name: 'Hindu', icon: 'Sun' },
  { id: 'muslim', name: 'Muslim', icon: 'Moon' },
  { id: 'sikh', name: 'Sikh', icon: 'Shield' },
  { id: 'christian', name: 'Christian', icon: 'Star' },
];

const BANNERS = [
  {
    id: 100,
    img: 'https://images.unsplash.com/photo-1595981267035-21a4ca8158f0?w=1000&q=80',
    title: 'Local Bharat Matrimony',
    desc: 'Connecting our local community for a lifetime of happiness.'
  },
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1511216335778-7cb8f49fa7a3?w=800&q=80',
    title: 'Match for All Religions',
    desc: 'Verified Hindu, Muslim, Sikh & Christian Brides & Grooms'
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1595981267035-21a4ca8158f0?w=800&q=80',
    title: 'Every Caste Welcome',
    desc: 'Inclusive profiles for every community and caste in India'
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1560021665-627346062f68?w=800&q=80',
    title: 'Find Your Life Partner',
    desc: 'Realistic photos of genuine Indian grooms & brides'
  }
];

const MB_PLANS = [
    { id: 'standard', name: 'Standard Connection', price: 59, limit: 20, validity: '2 Months', desc: 'View 20 profiles with 2 months validity' },
    { id: 'unlimited', name: 'Golden Link', price: 99, limit: 9999, validity: '6 Months', desc: 'Unlimited profile views with 6 months validity' }
  ];

  const MB_POLICY = [
    "Marriages are made in heaven let us push for link that connectivity.",
    "Only local bharath can introducing contacts, you can find good or not bride or groom, don't blame to us, remember that we are mediators only thanks🌹 to everyone.",
    "We provide the introduction, you make the evaluation"
  ];

export default function MarriageBureau({ onBack, isAdmin: propIsAdmin, language = 'en-IN' }: MarriageBureauProps) {
  const { user, isAdmin: firebaseIsAdmin, phoneLogin, userProfile } = useFirebase();
  const isAdmin = propIsAdmin || firebaseIsAdmin;
  const [profiles, setProfiles] = useState<MarriageProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    // Show subscription if male, approved, and hasn't paid
    if (userProfile?.gender?.toLowerCase() === 'male' && userProfile?.isApproved && !(userProfile as any).hasPaidMB) {
        setShowSubscription(true);
    }
  }, [userProfile]);

  const handleSubscribe = (plan: any) => {
    if (!user) return;
    
    // Set pending payment globally so App.tsx can switch to Payment screen
    (window as any).pendingLocalPayment = {
      amount: plan.price,
      type: 'marriage_sub',
      metadata: { planId: plan.id, planName: plan.name, userId: user.uid },
      onComplete: async (method: string) => {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            hasPaidMB: true,
            mbPlanId: plan.id,
            mbPlanExpires: new Date(Date.now() + (plan.id === 'standard' ? 60 : 180) * 24 * 60 * 60 * 1000),
            mbViewsLeft: plan.limit,
            mbPaymentMethod: method,
            mbPaymentStatus: method === 'cod' ? 'Hand Cash' : 'Paid (UPI)',
            updatedAt: serverTimestamp()
          });
          alert(`Successfully subscribed to ${plan.name}! You can now view all matching profiles.`);
          setShowSubscription(false);
          setRegistrationStatus('idle');
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    };

    // Trigger App navigation to payment
    // We assume App.tsx is listening to this or we use navigateTo if passed down
    // Since we don't have onNavigate prop here, we'll try to find it or use a global event.
    // Actually, App.tsx handles 'payment' screen by checking this global.
    // I'll dispatch a custom event that App.tsx can listen to if needed, or just tell the user to go to payment.
    setRegistrationStatus('submitting');
    // Dispatch event to App.tsx to jump to payment
    window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'payment' } }));
  };
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener for profiles using the correct filtered query
    const profilesQuery = isAdmin 
      ? query(collection(db, 'marriageProfiles'), limit(45))
      : query(collection(db, 'marriageProfiles'), where('isApproved', '==', true), limit(45));
    
    const unsubscribe = onSnapshot(profilesQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarriageProfile));
      setProfiles(docs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'marriageProfiles');
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const [currentBanner, setCurrentBanner] = useState(0);
  const [selectedReligion, setSelectedReligion] = useState('all');
  
  const handleShareProfile = React.useCallback((profile: MarriageProfile) => {
    if (navigator.share) {
      navigator.share({
        title: `Lokal Marriage Bureau - ${profile.name} ${profile.surname}`,
        text: `Check out this profile on Lokal Marriage Bureau: ${profile.name}, Age: ${profile.age}, ${profile.profession}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`Lokal Marriage Bureau Profile: ${profile.name} ${profile.surname}, Age: ${profile.age}, ${profile.profession}`).then(() => {
        alert('Profile details copied to clipboard!');
      });
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    location: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  const scrollBanner = React.useCallback((index: number) => {
    if (bannerRef.current) {
      bannerRef.current.scrollTo({
        left: bannerRef.current.offsetWidth * index,
        behavior: 'smooth'
      });
      setCurrentBanner(index);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (currentBanner + 1) % BANNERS.length;
      scrollBanner(next);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentBanner, scrollBanner]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== currentBanner) {
      setCurrentBanner(index);
    }
  };

  const displayProfiles = React.useMemo(() => 
    profiles.filter(p => {
      // Visibility Logic: Admin sees all, User sees approved or their own
      if (!isAdmin && !p.isApproved && p.userId !== user?.uid) return false;

      // Basic Search
      const searchStr = `${p.name} ${p.surname} ${p.nativePlace} ${p.profession} ${p.education} ${p.partnerPreferences?.profession || ''} ${p.about || ''}`.toLowerCase();
      if (searchQuery && !searchStr.includes(searchQuery.toLowerCase())) return false;

      // Religion/Special Category Filter
      if (selectedReligion !== 'all') {
        if (['unmarried', 'married', '3rd-marriage'].includes(selectedReligion)) {
          const mapping: Record<string, string> = {
            'unmarried': 'Unmarried',
            'married': 'Married',
            '3rd-marriage': '3rd Marriage'
          };
          if ((p.maritalStatus || 'Unmarried') !== mapping[selectedReligion]) return false;
        } else {
          if (p.religion?.toLowerCase() !== selectedReligion) return false;
        }
      }

      // Advanced Filters
      if (filters.minAge && parseInt(p.age) < parseInt(filters.minAge)) return false;
      if (filters.maxAge && parseInt(p.age) > parseInt(filters.maxAge)) return false;
      if (filters.location && !p.nativePlace?.toLowerCase().includes(filters.location.toLowerCase())) return false;

      return true;
    }),
  [profiles, isAdmin, user?.uid, searchQuery, selectedReligion, filters]);
  const [showRegForm, setShowRegForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MarriageProfile | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<MarriageProfile | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'submitting' | 'success' | 'form' | 'otp'>('idle');
  const [showReasonModal, setShowReasonModal] = useState<{ id: string, type: 'suspend' | 'approve' | 'delete' } | null>(null);
  const [showCancellationReason, setShowCancellationReason] = useState<{ id: string } | null>(null);
  const [selectedCancellationReason, setSelectedCancellationReason] = useState('');
  
  const [otpFlow, setOtpFlow] = useState<{
    isOpen: boolean;
    phoneNumber: string;
    userInput: string;
    tempProfileData: any | null;
    generatedOtp?: string;
  } | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showRegForm && !otpFlow?.isOpen) {
      // Delay slightly to ensure DOM element is rendered
      timeout = setTimeout(() => {
        try {
          const verifier = setupRecaptcha('marriage-recaptcha');
          if (!verifier) {
            console.error("Failed to initialize reCAPTCHA");
          }
        } catch (err) {
          console.error("Recaptcha useEffect error:", err);
        }
      }, 300);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showRegForm, otpFlow]);

  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const myProfile = profiles.find(p => p.userId === user?.uid);
  const isMaleUser = myProfile?.gender === 'Male';
  const hasActiveSubscription = isAdmin || (userProfile as any)?.hasPaidMB || (myProfile?.subscription && new Date(myProfile.subscription.expiryDate) > new Date());

  const PROFILE_REJECTION_REASONS = [
    'Inappropriate Photos',
    'Fake/Misleading Information',
    'Duplicate Profile',
    'Contact Details in Bio',
    'Underage Applicant',
    'Other'
  ];
  
  const CLOSURE_REASONS = [
    'Found partner on this app',
    'Found partner elsewhere',
    'Taking a break',
    'Prefer not to say',
    'Technical difficulties',
    'Privacy concerns'
  ];

  useEffect(() => {
    // Handle admin edit signal
    const editId = localStorage.getItem('edit_marriage_profile_id');
    if (editId) {
      const profileToEdit = profiles.find(p => p.id === editId);
      if (profileToEdit) {
        handleEditClick(profileToEdit);
      }
      localStorage.removeItem('edit_marriage_profile_id');
    }

    // Handle direct registration signal
    const openReg = localStorage.getItem('open_marriage_reg');
    if (openReg) {
      setShowRegForm(true);
      setRegistrationStatus('form');
      localStorage.removeItem('open_marriage_reg');
    }
  }, [profiles]);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const handleDeleteProfile = async (id: string, reason?: string) => {
    const confirmationMsg = reason 
      ? `Are you sure you want to close your profile? Reason: ${reason}`
      : 'Are you sure you want to delete this profile? This action cannot be undone.';
      
    setDeleteConfirm({
      isOpen: true,
      title: "Delete Profile?",
      message: confirmationMsg,
      onConfirm: async () => {
        try {
          if (reason) {
            console.log(`Profile ${id} closed. Reason: ${reason}`);
          }
          await deleteDoc(doc(db, 'marriageProfiles', id));
          if (selectedProfile?.id === id) {
            setSelectedProfile(null);
          }
          if (localStorage.getItem('my_marriage_profile_id') === id) {
            localStorage.removeItem('my_marriage_profile_id');
          }
          setShowCancellationReason(null);
          setSelectedCancellationReason('');
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `marriageProfiles/${id}`);
        }
      }
    });
  };

  const canSeeFullProfile = (targetProfile: MarriageProfile) => {
    if (isAdmin) return true;
    if (user?.uid === targetProfile.userId) return true;
    if (targetProfile.gender === 'Female' && isMaleUser && !hasActiveSubscription) return false;
    return true;
  };

  const handleProfileClick = (profile: MarriageProfile) => {
    if (!canSeeFullProfile(profile)) {
      setShowSubscriptionModal(true);
      return;
    }
    setSelectedProfile(profile);
  };

  const handleEditClick = (profile: MarriageProfile) => {
    setEditingProfile(profile);
    setImagePreview(profile.image);
    setShowRegForm(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setImagePreview(compressed);
        } catch (err) {
          console.error("Compression error:", err);
          setImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyAndSave = async (userInputOtp: string) => {
    if (!otpFlow || !user) return;
    
    setError(null);
    setRegistrationStatus('submitting');
    try {
      // MSG91 integration removed. Bypassing real verification.
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const profileData = otpFlow.tempProfileData;
      if (editingProfile) {
        await updateDoc(doc(db, 'marriageProfiles', editingProfile.id), {
          ...profileData,
          updatedAt: serverTimestamp()
        });
      } else {
        const profileId = `m-${Date.now()}`;
        await setDoc(doc(db, 'marriageProfiles', profileId), {
          ...profileData,
          id: profileId,
          userId: user.uid,
          isApproved: false,
          createdAt: serverTimestamp()
        });
        localStorage.setItem('my_marriage_profile_id', profileId);
      }
      
      setRegistrationStatus('success');
      setOtpFlow(null);
      setImagePreview(null);
      setEditingProfile(null);
      setShowRegForm(false);
    } catch (err: any) {
      setError(err.message || "Invalid OTP! Please try again.");
      setRegistrationStatus('idle');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please login first to register your profile.");
      return;
    }
    
    setError(null);
    setRegistrationStatus('submitting');
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const phone = formData.get('phone') as string || '';

      if (!phone || phone.length < 10) {
        alert("Please enter a valid 10-digit phone number for verification.");
        setRegistrationStatus('idle');
        return;
      }

      const profileData: Partial<MarriageProfile> = {
        name: formData.get('firstName') as string || 'Guest',
        surname: formData.get('surname') as string || '',
        age: calculateAge(formData.get('dob') as string),
        profession: formData.get('profession') as string || 'Unspecified',
        education: formData.get('education') as string || 'Unspecified',
        height: formData.get('height') as string || '5ft 5in',
        image: imagePreview || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        religion: (formData.get('religion') as string)?.toLowerCase() || 'unspecified',
        maritalStatus: (formData.get('maritalStatus') as any) || 'Unmarried',
        skinTone: (formData.get('skinTone') as any) || 'Fair',
        siblings: formData.get('siblings') as string || '0',
        siblingsStatus: formData.get('siblingsStatus') as string || 'Unspecified',
        fatherProfession: formData.get('fatherProfession') as string || 'Unspecified',
        motherProfession: formData.get('motherProfession') as string || 'Unspecified',
        address: formData.get('address') as string || '',
        phone: phone,
        gender: (formData.get('gender') as any) || 'Male',
        dob: formData.get('dob') as string,
        gothram: formData.get('gothram') as string || '',
        star: formData.get('star') as string || '',
        raasi: formData.get('raasi') as string || '',
        fatherName: formData.get('fatherName') as string || '',
        motherName: formData.get('motherName') as string || '',
        nativePlace: formData.get('nativePlace') as string || '',
        about: formData.get('about') as string || '',
        partnerPreferences: {
          ageMin: formData.get('pref_ageMin') as string || '',
          ageMax: formData.get('pref_ageMax') as string || '',
          heightMin: formData.get('pref_heightMin') as string || '',
          religion: formData.get('pref_religion') as string || '',
          profession: formData.get('pref_profession') as string || '',
        }
      };

      if (isAdmin) {
        // Admins skip OTP
        if (editingProfile) {
          await updateDoc(doc(db, 'marriageProfiles', editingProfile.id), {
            ...profileData,
            updatedAt: serverTimestamp()
          });
          alert("Profile updated successfully (Admin)");
        } else {
          const profileId = `m-${Date.now()}`;
          await setDoc(doc(db, 'marriageProfiles', profileId), {
            ...profileData,
            id: profileId,
            userId: user.uid,
            isApproved: true,
            createdAt: serverTimestamp()
          });
          alert("Profile created successfully (Admin)");
        }
        setShowRegForm(false);
        setRegistrationStatus('idle');
        return;
      }

      // MSG91 integration removed. Simulating OTP send for now.
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setOtpFlow({
        isOpen: true,
        phoneNumber: phone,
        userInput: '',
        tempProfileData: profileData
      });
      
      setRegistrationStatus('otp');
    } catch (err: any) {
      console.error("Error in handleRegister:", err);
      setError("Failed to process request. Please try again.");
      setRegistrationStatus('idle');
    }
  };

  const handleStatusChange = async (id: string, approve: boolean) => {
    const reason = selectedRejectionReason === 'Other' ? customRejectionReason : selectedRejectionReason;
    try {
      await updateDoc(doc(db, 'marriageProfiles', id), {
        isApproved: approve,
        rejectionReason: approve ? null : reason,
        updatedAt: serverTimestamp()
      });
      setShowReasonModal(null);
      setSelectedRejectionReason('');
      setCustomRejectionReason('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `marriageProfiles/${id}`);
    }
  };

  const handleMatchInterest = async (targetProfile: MarriageProfile) => {
    if (!myProfile || !user) {
      alert("Please join the Marriage Bureau first to express interest!");
      return;
    }

    if (isMaleUser) {
      if (!hasActiveSubscription) {
        setShowSubscriptionModal(true);
        return;
      }

      // Check weekly likes limit (max 2 for paid grooms)
      const now = new Date();
      const lastReset = new Date(myProfile.subscription?.lastLikeResetDate || 0);
      const diffInDays = (now.getTime() - lastReset.getTime()) / (1000 * 3600 * 24);
      
      let currentLikes = myProfile.subscription?.weeklyLikesCount || 0;
      let updateData: any = {};

      if (diffInDays >= 7) {
        // Reset weekly count
        currentLikes = 0;
        updateData['subscription.lastLikeResetDate'] = now.toISOString();
      }

      if (currentLikes >= 2) {
        alert("Weekly Limit Reached: You can express interest in up to 2 bride profiles per week. Please try again next week! More information, contact our support team.");
        return;
      }

      // Increment like count
      try {
        updateData['subscription.weeklyLikesCount'] = currentLikes + 1;
        await updateDoc(doc(db, 'marriageProfiles', myProfile.id), updateData);
        
        // Persist the interest
        const interestId = `${user.uid}_${targetProfile.id}_${Date.now()}`;
        await setDoc(doc(db, 'marriageInterests', interestId), {
          id: interestId,
          fromUserId: user.uid,
          fromProfileId: myProfile.id,
          toUserId: targetProfile.userId,
          toProfileId: targetProfile.id,
          status: 'Pending',
          createdAt: serverTimestamp()
        });

        // Notify via SMS
        if (targetProfile.phone) {
          const { integrationService } = await import('../services/integrationService');
          integrationService.sendSMS(
            targetProfile.phone, 
            `Local Bandi Multi Services Marriage: Someone is interested in your profile! Log in to view details.`
          ).catch(err => console.error("Interest SMS failed:", err));
        }

        alert(`Interest Expressed! The family will be notified. (Weekly uses: ${currentLikes + 1}/2)`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `marriageProfiles/${myProfile.id}`);
      }
    } else {
      // Females or others
      try {
        const interestId = `${user.uid}_${targetProfile.id}_${Date.now()}`;
        await setDoc(doc(db, 'marriageInterests', interestId), {
          id: interestId,
          fromUserId: user.uid,
          fromProfileId: myProfile?.id || 'guest',
          toUserId: targetProfile.userId,
          toProfileId: targetProfile.id,
          status: 'Pending',
          createdAt: serverTimestamp()
        });

        if (targetProfile.phone) {
          const { integrationService } = await import('../services/integrationService');
          integrationService.sendSMS(
            targetProfile.phone, 
            `Local Bandi Multi Services Marriage: You have a new interest request! Check your dashboard.`
          ).catch(err => console.error("Interest SMS failed:", err));
        }

        alert(`Interest Expressed! The family will be notified and facilitate the connection.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'marriageInterests');
      }
    }
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '25';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };


  return (
    <div className="h-full bg-slate-50 flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
          <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex-1 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm shrink-0 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest leading-none mb-1.5">Lokal Marriage Bureau</p>
              <p className="text-[11px] font-bold text-rose-700/70 leading-relaxed italic">Find your perfect life partner from genuine verified profiles.</p>
            </div>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open_customer_care', { detail: { type: 'marriage' } }))}
           className="w-14 h-14 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-rose-600 shadow-sm hover:bg-rose-50 transition-colors shrink-0"
            title="Customer Support"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modern Verification Layer */}
        <AnimatePresence>
          {otpFlow && otpFlow.isOpen && (
            <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 text-center shadow-3xl border border-white/20 relative"
              >
                <div className="mb-8">
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl rotate-3 shadow-indigo-200">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">Verification Required</h3>
                  <p className="text-[12px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">
                    OTP sent to <span className="text-indigo-600">+91 {otpFlow.phoneNumber}</span>
                  </p>
                </div>

                <div className="space-y-8">
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-[10px] font-bold italic">
                      {error}
                    </div>
                  )}
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-12 h-16 rounded-2xl flex items-center justify-center transition-all border-2 ${otpFlow.userInput[i] ? 'bg-white border-indigo-500 shadow-lg shadow-indigo-50' : 'bg-slate-50 border-slate-100'}`}
                      >
                        <span className="text-2xl font-black text-slate-900">
                          {otpFlow.userInput[i] || ""}
                        </span>
                      </div>
                    ))}
                    <input 
                      autoFocus
                      type="tel"
                      maxLength={4}
                      value={otpFlow.userInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 4) {
                          setOtpFlow({...otpFlow, userInput: val});
                          if(val.length === 4) {
                            setTimeout(() => handleVerifyAndSave(val), 800);
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>

                  <div className="bg-indigo-50 p-5 rounded-[2rem] border border-indigo-100/50">
                    <p className="text-[10px] font-bold text-indigo-700 italic">
                      Local Bandi Bot: Please enter the 4-digit code sent to your mobile via MSG91.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => handleVerifyAndSave(otpFlow.userInput)}
                      disabled={otpFlow.userInput.length !== 4 || registrationStatus === 'submitting'}
                      className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-slate-200 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {registrationStatus === 'submitting' ? (
                        <>
                          <div className="w-4 h-4 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Complete</span>
                        </>
                      )}
                    </button>
                    
                    <div className="flex justify-between items-center px-4">
                      <button 
                        onClick={() => {
                          const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
                          setOtpFlow({ ...otpFlow, generatedOtp: newOtp, userInput: '' });
                        }}
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest"
                      >
                        Resend Code
                      </button>
                      <button 
                        onClick={() => setOtpFlow(null)}
                        className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reason Modal */}
        <AnimatePresence>
          {showReasonModal && (
            <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <button onClick={() => setShowReasonModal(null)} className="p-2 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">Rejection Reason</h3>
                <p className="text-slate-500 font-bold mb-6 text-sm">Please select a reason for rejecting/suspending this profile.</p>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {PROFILE_REJECTION_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setSelectedRejectionReason(reason)}
                      className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 ${
                        selectedRejectionReason === reason ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-slate-50 border-transparent text-slate-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                {selectedRejectionReason === 'Other' && (
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-400 min-h-[100px] resize-none mb-6"
                  />
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowReasonModal(null)}
                      className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={!selectedRejectionReason || (selectedRejectionReason === 'Other' && !customRejectionReason)}
                      onClick={() => handleStatusChange(showReasonModal.id, false)}
                      className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 disabled:opacity-50"
                    >
                      Suspend Profile
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      handleDeleteProfile(showReasonModal.id);
                      setShowReasonModal(null);
                    }}
                    className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    Delete Permanently
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* User Profile Status Banner */}
        {(() => {
          const myId = localStorage.getItem('my_marriage_profile_id');
          const myProfile = profiles.find(p => p.id === myId);
          if (!myProfile) return null;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-6 rounded-[2.5rem] border flex items-center justify-between gap-4 ${
                myProfile.isApproved 
                  ? 'bg-emerald-50 border-emerald-100' 
                  : 'bg-yellow-50 border-yellow-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  myProfile.isApproved ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-gray-900'
                }`}>
                  {myProfile.isApproved ? <ShieldCheck className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Your Profile Status</p>
                  <p className="text-sm font-black text-slate-800">
                    {myProfile.isApproved ? 'Profile is LIVE & Verified' : 'Under Admin Review'}
                  </p>
                  {!myProfile.isApproved && myProfile.rejectionReason && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1 italic">
                      Reason: {myProfile.rejectionReason}
                    </p>
                  )}
                  {myProfile.gender === 'Male' && (
                    <div className="flex items-center gap-2 mt-2">
                       <div className={`w-2 h-2 rounded-full ${hasActiveSubscription ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                       <span className={`text-[10px] font-black uppercase tracking-tighter ${hasActiveSubscription ? 'text-emerald-700' : 'text-rose-700 underline underline-offset-2 cursor-pointer'}`}
                             onClick={() => !hasActiveSubscription && setShowSubscriptionModal(true)}>
                          {hasActiveSubscription ? 'Maintenance Active' : 'Maintenance Required to View Brides'}
                       </span>
                    </div>
                  )}
                </div>
              </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(myProfile)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => setShowCancellationReason({ id: myProfile.id })}
                    className="bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedProfile(myProfile)}
                    className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm"
                  >
                    View
                  </button>
                </div>
            </motion.div>
          );
        })()}

        {/* Scrolling Banner */}
        <div id="marriage-hero-banner" className="relative h-72 rounded-[3.5rem] overflow-hidden mb-8 shadow-2xl shadow-indigo-100 group border-4 border-white">
          <div 
            ref={bannerRef}
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {BANNERS.map((banner, index) => (
              <div
                key={banner.id}
                className="w-full h-full shrink-0 snap-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-950/40 to-transparent z-10" />
                
                {/* Floating Hearts Decor */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        opacity: [0, 0.4, 0], 
                        y: [-20, -120],
                        x: (i * 80) + (Math.sin(i) * 30)
                      }}
                      transition={{ 
                        duration: 4 + Math.random() * 3, 
                        repeat: Infinity, 
                        delay: i * 0.8 
                      }}
                      className="absolute bottom-10 left-10"
                    >
                      <Heart className="w-4 h-4 text-white/40 fill-white/20" />
                    </motion.div>
                  ))}
                </div>

                {banner.img && <img src={banner.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={banner.title} />}
                
                <div className="absolute bottom-10 left-10 right-10 z-20">
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={currentBanner === index ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h3 className="text-3xl font-black text-white mb-2 italic drop-shadow-lg">
                      {banner.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest max-w-sm leading-relaxed">
                        {banner.desc}
                      </p>
                      <div className="flex gap-3 shrink-0">
                        <button 
                          onClick={() => setShowRegForm(true)}
                          className="bg-white text-indigo-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:shadow-2xl active:scale-95 transition-all"
                        >
                          Join Now
                        </button>
                        <button 
                          onClick={() => document.getElementById('profiles-list')?.scrollIntoView({ behavior: 'smooth' })}
                          className="bg-indigo-500/40 backdrop-blur-md text-white border border-white/30 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all"
                        >
                          View Profiles
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const prev = (currentBanner - 1 + BANNERS.length) % BANNERS.length;
              scrollBanner(prev);
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 active:scale-90 transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
          >
            <ChevronDown className="w-8 h-8 rotate-90" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const next = (currentBanner + 1) % BANNERS.length;
              scrollBanner(next);
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 active:scale-90 transition-all opacity-0 group-hover:opacity-100 shadow-2xl"
          >
            <ChevronDown className="w-8 h-8 -rotate-90" />
          </button>

          {/* Pagination Dots */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {BANNERS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => scrollBanner(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentBanner ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/30 hover:bg-white/50'}`} 
              />
            ))}
          </div>
          
          {/* Floating Badge */}
          <div className="absolute top-6 right-6 z-30 pointer-events-none">
            <div className="bg-rose-500 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/20 animate-pulse">
              Verified local community board
            </div>
          </div>
        </div>

        {/* Cancellation Reason Modal */}
        <AnimatePresence>
          {showCancellationReason && (
            <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-sm bg-white rounded-[3rem] p-10 text-center shadow-2xl relative"
              >
                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <Trash2 className="w-10 h-10 text-rose-500" />
                </div>
                
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Close Profile?</h3>
                <p className="text-slate-500 font-bold mb-8 text-sm">We are sad to see you go. Please tell us why you are deleting your profile.</p>

                <div className="space-y-2 mb-8 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {CLOSURE_REASONS.map(reason => (
                    <button
                      key={reason}
                      onClick={() => setSelectedCancellationReason(reason)}
                      className={`w-full p-4 rounded-2xl text-left font-bold text-sm transition-all border-2 ${
                        selectedCancellationReason === reason ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-slate-50 border-transparent text-slate-400'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancellationReason(null)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Keep Profile
                  </button>
                  <button
                    disabled={!selectedCancellationReason}
                    onClick={() => handleDeleteProfile(showCancellationReason.id, selectedCancellationReason)}
                    className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 disabled:opacity-50"
                  >
                    Delete Forever
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <div className="relative w-full rounded-[3.5rem] overflow-hidden mb-12 shadow-2xl shadow-indigo-200 group border-4 border-white min-h-[450px] lg:h-[500px] flex">
           {/* Background with dynamic colors */}
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 via-purple-700 to-rose-600 transition-all duration-1000 group-hover:hue-rotate-15" />
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
           
           {/* Animated Background Orbs */}
           <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -ml-48 -mt-48 animate-pulse" />
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-400/20 rounded-full blur-[100px] -mr-48 -mb-48 animate-pulse" />

           {/* Content Grid */}
           <div className="relative w-full h-full flex flex-col lg:flex-row items-center justify-between p-8 lg:p-16 gap-12 z-20">
              
              {/* Left Side: Compelling Caption */}
              <div className="flex-1 space-y-8 text-center lg:text-left">
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-2xl"
                 >
                    <div className="flex -space-x-2">
                       <div className="w-6 h-6 rounded-full bg-rose-400 border border-white flex items-center justify-center"><Heart className="w-3 h-3 text-white fill-white" /></div>
                       <div className="w-6 h-6 rounded-full bg-indigo-400 border border-white flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                    </div>
                    <span className="text-[12px] font-black text-white uppercase tracking-[0.25em]">Verified Soulmates</span>
                 </motion.div>
                 
                 <div className="space-y-4">
                   <motion.h2 
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                     className="text-5xl lg:text-7xl font-black text-white italic leading-[0.95] tracking-tighter"
                   >
                      Find Your <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-yellow-200 drop-shadow-xl p-1">Perfect Match.</span>
                   </motion.h2>
                   
                   <motion.p 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                     className="text-lg text-indigo-50/80 font-bold max-w-lg leading-relaxed italic"
                   >
                      Join India's most trusted local community board. Real people, verified identities, and successful marriages.
                   </motion.p>
                 </div>

                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.3 }}
                   className="flex flex-wrap gap-5 pt-4 justify-center lg:justify-start"
                 >
                    <button 
                      onClick={() => setShowRegForm(true)}
                      className="group relative bg-white text-indigo-900 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.15em] shadow-2xl hover:shadow-white/20 hover:-translate-y-1.5 active:scale-95 transition-all flex items-center gap-3"
                    >
                       Register Now
                       <Heart className="w-4 h-4 text-rose-500 fill-rose-500 group-hover:scale-125 transition-transform" />
                    </button>
                    <button 
                      onClick={() => document.getElementById('profiles-list')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-indigo-950/40 backdrop-blur-md text-white border-2 border-white/20 px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.15em] hover:bg-white/10 transition-all shadow-xl"
                    >
                       Browse All
                    </button>
                 </motion.div>
              </div>

              {/* Right Side: Double Profile Feature Section (Bride & Groom) */}
              <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8 rotate-1 lg:rotate-3 shrink-0">
                 {/* Groom Card */}
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                   animate={{ opacity: 1, scale: 1, rotate: -2 }}
                   whileHover={{ rotate: -5, scale: 1.05, zIndex: 30 }}
                   className="relative group cursor-pointer"
                 >
                    <div className="bg-white p-4 pb-6 rounded-[3rem] shadow-2xl w-60 border border-slate-100 relative overflow-hidden">
                       <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-4 border-2 border-slate-50 relative">
                          <img 
                            src={profiles.find(p => p.gender === 'Male')?.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            alt="Groom" 
                          />
                          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">Featured Groom</div>
                       </div>
                       <div className="text-center">
                          <h4 className="text-xl font-black text-slate-900 mb-0.5">
                             {profiles.find(p => p.gender === 'Male')?.name || "Priyaanshu"}, {profiles.find(p => p.gender === 'Male')?.age || "28"}
                          </h4>
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{profiles.find(p => p.gender === 'Male')?.profession || "Software Engineer"}</p>
                       </div>
                    </div>
                    {/* Floating Heart Decor */}
                    <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white">
                       <Users className="w-5 h-5" />
                    </div>
                 </motion.div>

                 {/* Bride Card */}
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                   animate={{ opacity: 1, scale: 1, rotate: 3 }}
                   whileHover={{ rotate: 6, scale: 1.05, zIndex: 30 }}
                   className="relative group cursor-pointer -mt-8 sm:mt-8"
                 >
                    <div className="bg-white p-4 pb-6 rounded-[3rem] shadow-2xl w-60 border border-slate-100 relative overflow-hidden">
                       <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-4 border-2 border-slate-50 relative">
                          <img 
                            src={profiles.find(p => p.gender === 'Female')?.image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800"} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            alt="Bride" 
                          />
                          <div className="absolute top-4 right-4 bg-rose-500 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg">Featured Bride</div>
                       </div>
                       <div className="text-center">
                          <h4 className="text-xl font-black text-slate-900 mb-0.5">
                             {profiles.find(p => p.gender === 'Female')?.name || "Priyanka"}, {profiles.find(p => p.gender === 'Female')?.age || "27"}
                          </h4>
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{profiles.find(p => p.gender === 'Female')?.profession || "HR Manager"}</p>
                       </div>
                    </div>
                    {/* Floating Heart Decor */}
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white">
                       <Heart className="w-5 h-5 fill-white" />
                    </div>
                 </motion.div>
              </div>
           </div>
           
           {/* Static Decorative Divider */}
           <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Search & Advanced Filters */}
        <div className="bg-white rounded-[2.5rem] p-6 mb-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-50 rounded-2xl flex items-center px-4 border-2 border-transparent focus-within:border-indigo-400 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search name, location, job..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 bg-transparent outline-none font-bold text-sm text-slate-900"
              />
            </div>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-4 rounded-2xl flex items-center justify-center transition-all ${showAdvancedFilters ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-2"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Age</p>
                    <input 
                      type="number" 
                      placeholder="eg. 18"
                      value={filters.minAge}
                      onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                      className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Age</p>
                    <input 
                      type="number" 
                      placeholder="eg. 45"
                      value={filters.maxAge}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                      className="w-full bg-slate-50 p-3 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location / Native Place</p>
                  <input 
                    type="text" 
                    placeholder="Enter city or district..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setFilters({ minAge: '', maxAge: '', location: '' });
                      setSearchQuery('');
                      setSelectedReligion('all');
                    }}
                    className="text-[10px] font-black uppercase text-indigo-600 hover:underline px-2"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 mb-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 relative z-10">Select Special Category</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar relative z-10">
            {RELIGIONS.map(rel => {
              const Icon = rel.icon === 'Heart' ? Heart : 
                          rel.icon === 'Sun' ? Star : 
                          rel.icon === 'Moon' ? Moon : 
                          rel.icon === 'Shield' ? ShieldCheck : 
                          rel.icon === 'User' ? User :
                          rel.icon === 'Users' ? Users : Star;
              return (
                <button
                  key={rel.id}
                  onClick={() => setSelectedReligion(rel.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all min-w-[90px] border-2 group active:scale-95 ${
                    selectedReligion === rel.id 
                      ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100' 
                      : 'bg-slate-50 border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedReligion === rel.id ? 'bg-white/20' : 'bg-white shadow-sm'
                  }`}>
                    <Icon className={`w-6 h-6 ${selectedReligion === rel.id ? 'text-white' : 'text-indigo-500'}`} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    selectedReligion === rel.id ? 'text-white' : 'text-slate-500'
                  }`}>
                    {rel.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 rounded-[3rem] p-10 text-white mb-10 shadow-2xl shadow-rose-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32 blur-[80px] group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-[60px]"></div>
          
          <div className="relative z-10 max-w-lg">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-6"
            >
              <Heart className="w-4 h-4 text-rose-100 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-50">Local Exclusive</span>
            </motion.div>
            
            <h2 className="text-4xl sm:text-5xl font-black mb-4 italic tracking-tighter leading-[0.95]">
              Marriages are made in heaven <br/>
              <span className="text-rose-200">let us push for link that connectivity.</span>
            </h2>
            <p className="text-rose-100 font-bold text-base leading-relaxed mb-10 opacity-90">
              We have more profiles waiting for you. Start your journey towards a lifetime of happiness today.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                onClick={() => document.getElementById('profiles-list')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-rose-600 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Find Your Half
              </button>
              <button 
                onClick={() => setShowRegForm(true)}
                className="bg-rose-900/40 backdrop-blur-xl text-white border border-rose-300/30 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Get Partner
              </button>
              <button 
                onClick={() => setShowRegForm(true)}
                className="bg-rose-900/40 backdrop-blur-xl text-white border border-rose-300/30 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Join Now
              </button>
              <button 
                onClick={() => setShowRegForm(true)}
                className="bg-rose-900/40 backdrop-blur-xl text-white border border-rose-300/30 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex flex-col items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Generate Profile
              </button>
            </div>
          </div>
        </div>

        <div id="profiles-list" className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Profiles ({profiles.length})</h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded-lg">Verified Only</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {myProfile && !myProfile.isApproved && !isAdmin ? (
               <div className="py-20 text-center bg-amber-500/5 rounded-[3rem] border border-amber-500/15 p-10 max-w-xl mx-auto space-y-6">
                 <div className="w-20 h-20 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20 shadow-lg animate-pulse">
                   <Lock className="w-10 h-10" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Console Access Locked</h3>
                 <p className="text-xs font-black text-amber-600 uppercase tracking-widest leading-none">Pending Admin Security Approval</p>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Your marriage bureau profile <strong className="text-slate-800 italic">{myProfile.name} {myProfile.surname}</strong> is under active verification by our regional administration. To ensure community safety, all matches and profiles are hidden until your profile is approved.
                 </p>
                 <div className="p-4 bg-white rounded-2xl border border-slate-100 text-left text-xs text-slate-400">
                    <p className="font-semibold text-slate-600">Timeline Profile Verification:</p>
                    <p className="mt-1">Verification is completed within 2 to 3 hours of profile generation. You will receive a direct WhatsApp notification when your profile is live!</p>
                 </div>
               </div>
            ) : (
              displayProfiles.map(profile => (
              <motion.div
                key={profile.id}
                onClick={() => handleProfileClick(profile)}
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 flex p-4 gap-4 active:scale-[0.98] transition-all cursor-pointer relative"
              >
                {!profile.isApproved && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-[8px] font-black uppercase px-2 py-1 rounded-lg">Pending</div>
                )}
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-50 relative">
                  {profile.image && (
                    <img 
                      src={profile.image} 
                      className={`w-full h-full object-cover ${!canSeeFullProfile(profile) ? 'blur-md grayscale' : ''}`} 
                      alt={profile.name} 
                    />
                  )}
                  {!canSeeFullProfile(profile) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                      <Lock className="w-5 h-5 text-white/80" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col py-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-lg leading-none">{profile.name} {profile.surname}</h4>
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                        className="p-2 bg-rose-50 text-rose-500 rounded-xl active:scale-95 transition-all"
                        title="Quick Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    {profile.age || '28'}y • {profile.profession}
                  </p>
                  <p className="text-[8px] font-bold text-indigo-400 uppercase italic mb-2">
                    Siblings: {profile.siblings} ({profile.siblingsStatus || 'Not Specified'})
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <GraduationCap className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600">{profile.education?.split(' ').pop()}</span>
                    </div>
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Ruler className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-600">{profile.height}</span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex flex-col gap-2 border-l border-slate-50 pl-4 py-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(profile);
                      }}
                      className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(profile.id, !profile.isApproved);
                      }}
                      className={`p-2.5 rounded-xl transition-all shadow-sm ${profile.isApproved ? 'bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                      title={profile.isApproved ? "Suspend" : "Restore"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProfile(profile.id);
                      }}
                      className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )))}

            {displayProfiles.length === 0 && !loading && (
              <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-10">
                <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-rose-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tight mb-2">No Profiles Found</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto mb-8 leading-relaxed">
                  Be the first one to join our marriage bureau community!
                </p>
                <button 
                  onClick={() => setShowRegForm(true)}
                  className="px-10 py-5 bg-rose-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-rose-100 active:scale-95 transition-all"
                >
                  Register Your Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <AnimatePresence>
        {showRegForm && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    {editingProfile ? 'Edit Marriage Profile' : 'Create Marriage Profile'}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Found Your life partner</p>
                </div>
                <button 
                  onClick={() => {
                    setShowRegForm(false);
                    setRegistrationStatus('idle');
                    setImagePreview(null);
                    setEditingProfile(null);
                  }} 
                  className="p-3 bg-slate-100 rounded-2xl text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {registrationStatus === 'success' ? (
                <div className="text-center py-16 animate-in zoom-in duration-500">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"
                  >
                    <ShieldCheck className="w-12 h-12 text-emerald-500" />
                  </motion.div>
                  <h4 className="text-3xl font-black text-slate-900 mb-3 italic font-display">Registration Received</h4>
                  <p className="text-slate-400 font-bold mb-10 leading-relaxed uppercase text-[10px] tracking-[0.2em] px-10">Your life partner journey starts here. Our founder will review your profile shortly.</p>
                  
                  {/* Local Policies */}
                  <div className="mb-10 text-left bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100">
                    <p className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4">Bureau Policies</p>
                    <div className="space-y-3">
                      {MB_POLICY.map((p, i) => (
                        <div key={i} className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1 shrink-0" />
                          <p className="text-[10px] font-bold text-slate-600 italic">"{p}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {userProfile?.gender?.toLowerCase() === 'male' && !hasActiveSubscription && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4">Speed Up Verification (Grooms)</p>
                      <button 
                         onClick={() => setShowSubscription(true)}
                         className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-rose-100 text-xs mb-4"
                      >
                        Select Connectivity Plan
                      </button>
                    </div>
                  )}

                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowRegForm(false);
                      setRegistrationStatus('idle');
                      setImagePreview(null);
                    }}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 text-xs"
                  >
                    Return to Bureau
                  </motion.button>
                </div>
              ) : showSubscription ? (
                <div className="py-6">
                  <div className="bg-rose-50/50 p-6 rounded-[2.5rem] mb-8 border border-rose-100">
                    <h4 className="text-xl font-black text-slate-900 italic tracking-tighter mb-2">Premium Connectivity</h4>
                    <p className="text-[11px] font-bold text-slate-500 leading-tight">To protect the community and sustain our mediators, we request a nominal fee from grooms.</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {MB_PLANS.map(plan => (
                      <button 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`w-full p-6 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden ${selectedPlan?.id === plan.id ? 'bg-white border-rose-500 shadow-xl shadow-rose-100' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <div>
                            <h4 className="text-lg font-black text-slate-900 italic">{plan.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{plan.validity} • {plan.limit === 9999 ? 'UNLIMITED' : `${plan.limit} PROFILES`}</p>
                          </div>
                          <div className="bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-lg shadow-rose-100">
                            <span className="text-lg font-black">₹{plan.price}</span>
                          </div>
                        </div>
                        {selectedPlan?.id === plan.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pt-4 border-t border-rose-100 relative z-10">
                            <p className="text-[10px] font-bold text-rose-600 italic">Included: {plan.desc}</p>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => selectedPlan && handleSubscribe(selectedPlan)}
                    disabled={!selectedPlan || registrationStatus === 'submitting'}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 text-xs disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {registrationStatus === 'submitting' ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Pay & Activate Profile <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="text-[9px] font-bold text-slate-400 mt-6 text-center uppercase tracking-[0.2em] opacity-60">Verified Security • No Hidden Changes</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-8 pb-10">
                  <div id="marriage-recaptcha"></div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Identity Photo</label>
                    <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 group hover:border-indigo-300 transition-all">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100"
                      >
                        {imagePreview ? (
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <Camera className="w-8 h-8 text-slate-300" />
                        )}
                      </motion.div>
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="photo-upload" 
                          onChange={handleImageChange}
                        />
                        <label htmlFor="photo-upload" className="px-6 py-3 bg-white rounded-2xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-900 hover:text-white transition-all inline-block shadow-sm">
                          {imagePreview ? 'Change Image' : 'Upload Photo'}
                        </label>
                        <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-tight opacity-60">High quality portraits preferred</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">First Name</label>
                      <input name="firstName" defaultValue={editingProfile?.name} required placeholder="eg. Rajesh" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Surname</label>
                      <input name="surname" defaultValue={editingProfile?.surname} required placeholder="eg. Kumar" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Date of Birth</label>
                      <input name="dob" defaultValue={editingProfile?.dob} required type="date" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Gender</label>
                      <select name="gender" defaultValue={editingProfile?.gender} required className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none appearance-none transition-all">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Marital Status</label>
                    <select name="maritalStatus" defaultValue={editingProfile?.maritalStatus} required className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none appearance-none transition-all">
                      <option value="Unmarried">Unmarried</option>
                      <option value="Married">Married</option>
                      <option value="3rd Marriage">3rd Marriage</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widow/Widower">Widow / Widower</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height</label>
                      <input name="height" defaultValue={editingProfile?.height} required placeholder="eg. 5ft 8in" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Skin Tone</label>
                      <select name="skinTone" defaultValue={editingProfile?.skinTone} required className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none appearance-none">
                        <option value="Fair">Fair</option>
                        <option value="Complexion">Complexion</option>
                        <option value="Wheatish">Wheatish</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Gothram</label>
                      <input name="gothram" defaultValue={editingProfile?.gothram} placeholder="eg. Shiva" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Native Place</label>
                      <input name="nativePlace" defaultValue={editingProfile?.nativePlace} required placeholder="eg. Warangal" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Your Profession</label>
                       <input name="profession" defaultValue={editingProfile?.profession} required placeholder="eg. Software Job" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Education / Study</label>
                      <input name="education" defaultValue={editingProfile?.education} required placeholder="eg. B.Tech, MBA..." className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Star / Raasi</label>
                      <input name="star" defaultValue={editingProfile?.star} placeholder="eg. Rohini" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Father's Name</label>
                      <input name="fatherName" defaultValue={editingProfile?.fatherName} required placeholder="Name" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Father's Profession</label>
                      <input name="fatherProfession" defaultValue={editingProfile?.fatherProfession} required placeholder="Profession" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Mother's Name</label>
                      <input name="motherName" defaultValue={editingProfile?.motherName} required placeholder="Name" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Mother's Profession</label>
                      <input name="motherProfession" defaultValue={editingProfile?.motherProfession} required placeholder="Profession" className="w-full bg-slate-50/50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Siblings Count</label>
                      <input name="siblings" defaultValue={editingProfile?.siblings} required placeholder="eg. 1 Brother" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Siblings (Married?)</label>
                      <input name="siblingsStatus" defaultValue={editingProfile?.siblingsStatus} placeholder="eg. All Unmarried" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Religion</label>
                      <select name="religion" defaultValue={editingProfile?.religion?.charAt(0).toUpperCase() + (editingProfile?.religion?.slice(1) || '')} required className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none appearance-none">
                        <option value="Hindu">Hindu</option>
                        <option value="Muslim">Muslim</option>
                        <option value="Sikh">Sikh</option>
                        <option value="Christian">Christian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About Me / Qualities</label>
                    <textarea name="about" defaultValue={editingProfile?.about} rows={3} placeholder="Describe yourself, your habits, and what you are looking for..." className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none resize-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                    <textarea name="address" defaultValue={editingProfile?.address} required rows={2} placeholder="H.No, Area, City..." className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none resize-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input name="phone" defaultValue={editingProfile?.phone} required type="tel" placeholder="10-digit number" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <HeartHandshake className="w-4 h-4 text-rose-500" /> Partner Preferences
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age Range (Min)</label>
                        <input name="pref_ageMin" defaultValue={editingProfile?.partnerPreferences?.ageMin} placeholder="eg. 21" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age Range (Max)</label>
                        <input name="pref_ageMax" defaultValue={editingProfile?.partnerPreferences?.ageMax} placeholder="eg. 30" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desired Height</label>
                        <input name="pref_heightMin" defaultValue={editingProfile?.partnerPreferences?.heightMin} placeholder="eg. 5ft 2in" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Religion Preference</label>
                        <select name="pref_religion" defaultValue={editingProfile?.partnerPreferences?.religion} className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none appearance-none">
                          <option value="">Any</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Muslim">Muslim</option>
                          <option value="Sikh">Sikh</option>
                          <option value="Christian">Christian</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desired Profession / Quality</label>
                      <input name="pref_profession" defaultValue={editingProfile?.partnerPreferences?.profession} placeholder="eg. Doctor, Govt Job, Good character" className="w-full bg-slate-50 p-4 rounded-xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none" />
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-2xl flex gap-3">
                    <Lock className="w-5 h-5 text-indigo-500 shrink-0" />
                    <p className="text-[10px] font-bold text-indigo-700 leading-relaxed">
                      Privacy: Your address and phone number will only be visible to others after FOUNDER APPROVAL. Common users only see your profile bio.
                    </p>
                  </div>

                  <button 
                    disabled={registrationStatus === 'submitting'}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 text-xs"
                  >
                    {registrationStatus === 'submitting' ? 'Verifying Details...' : 'Submit Profile for Approval'}
                    <Check className="w-5 h-5 text-indigo-400" />
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail View */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-[120] bg-white overflow-y-auto">
            <header className="p-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <button 
                onClick={() => setSelectedProfile(null)}
                className="p-3 bg-slate-50 rounded-2xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-900">Profile Details</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => {
                        const profileToEdit = selectedProfile;
                        setSelectedProfile(null);
                        handleEditClick(profileToEdit);
                      }}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl active:scale-95 transition-all"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedProfile.isApproved) {
                          setShowReasonModal({ id: selectedProfile.id, type: 'suspend' });
                        } else {
                          handleStatusChange(selectedProfile.id, true);
                        }
                      }}
                      className={`p-3 rounded-2xl active:scale-95 transition-all ${selectedProfile.isApproved ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}
                      title={selectedProfile.isApproved ? "Suspend" : "Approve"}
                    >
                      <Power className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProfile(selectedProfile.id)}
                      className="p-3 bg-rose-50 rounded-2xl text-rose-500 active:scale-95 transition-all"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => handleShareProfile(selectedProfile)}
                  className="p-3 bg-slate-50 rounded-2xl text-slate-500 active:scale-95 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="px-6 pb-12">
              <div className="relative mb-8 pt-4">
                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200 relative">
                  {selectedProfile.image && (
                    <img 
                      src={selectedProfile.image} 
                      className={`w-full h-full object-cover ${!canSeeFullProfile(selectedProfile) ? 'blur-2xl grayscale' : ''}`} 
                      alt={selectedProfile.name} 
                    />
                  )}
                  {!canSeeFullProfile(selectedProfile) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                      <Lock className="w-12 h-12 text-white/90 drop-shadow-xl" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-6 left-8 right-8 bg-white p-6 rounded-3xl shadow-xl border border-slate-50">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black text-slate-900">{selectedProfile.name} {selectedProfile.surname}</h2>
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedProfile.profession}</p>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Height</p>
                    <p className="text-sm font-black text-slate-700">{selectedProfile.height}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Complexion</p>
                    <p className="text-sm font-black text-slate-700">{selectedProfile.skinTone}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gothram / Native</p>
                  <p className="text-sm font-black text-slate-700">{selectedProfile.gothram} {(selectedProfile as any).nativePlace ? `• ${(selectedProfile as any).nativePlace}` : ''}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-2xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Marital Status</p>
                     <p className="text-sm font-black text-indigo-600">{selectedProfile.maritalStatus || 'Unmarried'}</p>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Education</p>
                     <p className="text-sm font-black text-slate-700">{selectedProfile.education}</p>
                   </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Family Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Father:</span>
                      <span className="font-black text-slate-900">{(selectedProfile as any).fatherName} ({(selectedProfile as any).fatherProfession})</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Mother:</span>
                      <span className="font-black text-slate-900">{(selectedProfile as any).motherName} ({(selectedProfile as any).motherProfession})</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                      <span className="text-slate-500 font-medium">Siblings:</span>
                      <span className="font-black text-slate-900">{selectedProfile.siblings}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Siblings Status:</span>
                      <span className="font-black text-slate-900">{selectedProfile.siblingsStatus || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {selectedProfile.partnerPreferences && (
                  <div className="bg-rose-50/50 border border-rose-100 p-6 rounded-[2.5rem] space-y-4 shadow-sm">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                       <Heart className="w-3 h-3 fill-rose-500" /> Desired Partner Choice
                    </h4>
                    <div className="space-y-3">
                      {(selectedProfile.partnerPreferences.ageMin || selectedProfile.partnerPreferences.ageMax) && (
                        <div className="flex justify-between items-center text-sm border-b border-rose-100/30 pb-2">
                          <span className="text-slate-500 font-medium">Age Range:</span>
                          <span className="font-black text-slate-900">
                            {selectedProfile.partnerPreferences.ageMin || 'Any'} - {selectedProfile.partnerPreferences.ageMax || 'Any'} Years
                          </span>
                        </div>
                      )}
                      {selectedProfile.partnerPreferences.religion && (
                        <div className="flex justify-between items-center text-sm border-b border-rose-100/30 pb-2">
                          <span className="text-slate-500 font-medium">Religion:</span>
                          <span className="font-black text-slate-900">{selectedProfile.partnerPreferences.religion}</span>
                        </div>
                      )}
                      {selectedProfile.partnerPreferences.heightMin && (
                        <div className="flex justify-between items-center text-sm border-b border-rose-100/30 pb-2">
                          <span className="text-slate-500 font-medium">Min Height:</span>
                          <span className="font-black text-slate-900">{selectedProfile.partnerPreferences.heightMin}</span>
                        </div>
                      )}
                      {selectedProfile.partnerPreferences.profession && (
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="text-slate-500 font-medium">Desired Qualities:</span>
                          <span className="font-black text-slate-900 italic">"{selectedProfile.partnerPreferences.profession}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedProfile.about && (
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">About & Qualities</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{selectedProfile.about}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-6">
                <button 
                  onClick={() => handleMatchInterest(selectedProfile)}
                  className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Heart className="w-5 h-5 fill-white" />
                  Express Match Interest
                </button>
                <section className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                    <ShieldCheck className="w-4 h-4" /> Secure Information
                  </h4>
                  
                  {selectedProfile.canViewSensisitve || isAdmin ? (
                    <div className="space-y-6 relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Private Phone</p>
                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                          <Phone className="w-4 h-4 text-indigo-300" />
                          <p className="text-lg font-black tracking-widest">+91 {selectedProfile.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Home Address</p>
                        <div className="flex items-start gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                          <MapPin className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                          <p className="text-sm font-bold leading-relaxed">{selectedProfile.address}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 relative z-10">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-black mb-6">Contact Admin for Access</p>
                      <div className="space-y-4">
                        <p className="text-[10px] font-bold text-indigo-200 leading-relaxed">
                          Phone and Address are hidden for privacy. 
                          Contact support to request permission to see details.
                        </p>
                        <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest">
                          Contact Support
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm?.isOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-center border border-gray-100"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2 italic tracking-tight">{deleteConfirm.title}</h3>
              <p className="text-xs font-bold text-gray-400 mb-8 leading-relaxed px-2">{deleteConfirm.message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    await deleteConfirm.onConfirm();
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        userProfile={myProfile}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}

// Subscription Modal Component
const SubscriptionModal = ({ isOpen, onClose, userProfile, onSubscribe }: any) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-[3rem] p-4 shadow-3xl border border-white/20 relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-2xl text-slate-400 z-10 transition-transform active:scale-90">
          <X className="w-6 h-6" />
        </button>

        {/* Header Section */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-center text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-black italic tracking-tighter">Unlock Bride Profiles</h3>
          <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em] mt-2 opacity-80">Groom Maintenance Subscription</p>
        </div>

        <div className="px-4 space-y-4">
          {/* Plan 1 */}
          <button 
            onClick={() => onSubscribe('maintenance_59')}
            className="w-full p-6 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-400 transition-all flex items-center justify-between group active:scale-95"
          >
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-slate-900 italic">₹59</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 2 Months</span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">20 Profile VISITS • Weekly 2 Verifications</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </button>

          {/* Plan 2 */}
          <button 
             onClick={() => onSubscribe('maintenance_99')}
             className="w-full p-6 bg-indigo-50 border-2 border-indigo-400 rounded-[2.5rem] flex items-center justify-between relative group active:scale-95"
          >
            <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">Most Popular</div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-indigo-900 italic">₹99</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">/ 6 Months</span>
              </div>
              <p className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">UNLIMITED VISITS • Weekly 2 Verifications</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5 fill-indigo-600" />
            </div>
          </button>

          {/* Conditions */}
          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-3">
             <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                <Check className="w-3 h-3" /> Conditions Apply
             </h4>
             <ul className="space-y-2">
                <li className="text-[9px] font-bold text-amber-700 leading-relaxed">• Profiles are blurred for grooms without maintenance payment.</li>
                <li className="text-[9px] font-bold text-amber-700 leading-relaxed">• Enquiries/Verification process limited to 2 brides per week. (Groom can see & like many, but we enquire only 2 per week).</li>
                <li className="text-[9px] font-bold text-amber-700 leading-relaxed">• Non-refundable. After validity, you can pay once again to continue.</li>
                <li className="text-[9px] font-bold text-amber-700 leading-relaxed">• Unused visits expire after validity period (2 or 6 months).</li>
                <li className="text-[9px] font-black text-rose-600 leading-relaxed italic uppercase">• NOTE: Both parties must pay a consultation fee to Local Bandi Multi Services Marriage Bureau if the marriage is fixed.</li>
             </ul>
          </div>

          <p className="text-[9px] text-slate-400 text-center font-bold pb-2">For more information, contact our support team.</p>
        </div>
      </motion.div>
    </div>
  );
};
