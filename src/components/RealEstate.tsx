import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check,
  Search, 
  MapPin, 
  Building2, 
  Home as HomeIcon, 
  Bed, 
  Bath, 
  Maximize2, 
  MessageCircle, 
  Plus, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Smartphone,
  Info,
  ShieldCheck,
  Send,
  User,
  Camera,
  Lock,
  PhoneCall,
  Trash2,
  Edit
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  setDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { Property, PartnerApplication } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import PartnerOnboarding from './PartnerOnboarding';
// msg91Service removed

interface RealEstateProps {
  onClose: () => void;
}

export default function RealEstate({ onClose }: RealEstateProps) {
  const { user, userProfile, isAdmin } = useFirebase();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const isWithinSupportHours = () => {
    const now = new Date();
    // Convert to IST offset loosely (+5:30) or just use local time for now 
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours + minutes / 60;
    return time >= 9.5 && time <= 16.5; // 9:30 AM to 4:30 PM
  };

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRegForm, setShowRegForm] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  
  const handleEditProperty = (prop: Property) => {
    const editCount = prop.editCount || 0;
    if (!isAdmin && editCount >= 2) {
      alert("Policy Limit Reached: Vendors can only edit each property listing up to 2 times. Please contact support (7416574197) for further modifications.");
      return;
    }
    setEditProperty(prop);
    setPreviewImage(prop.image);
    setShowRegForm(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!isAdmin) return;
    setDeleteConfirm({
      isOpen: true,
      title: "Delete listing?",
      message: "Are you sure you want to permanently delete this property listing? This action cannot be undone.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'properties', id));
          if (selectedProperty?.id === id) setSelectedProperty(null);
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `properties/${id}`);
        }
      }
    });
  };
  const [activeTab, setActiveTab] = useState<'All' | 'Residential' | 'Commercial' | 'Land'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [photoSafetyChecked, setPhotoSafetyChecked] = useState(false);
  
  // For Seller
  const [sellerProfile, setSellerProfile] = useState<PartnerApplication | null>(null);
  const [showChat, setShowChat] = useState<{ isOpen: boolean, propertyId: string | null }>({ isOpen: false, propertyId: null });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'properties'),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc'),
      limit(45)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
      setProperties(pList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'properties');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSellerProfile(null);
      return;
    }

    const qVendors = query(
      collection(db, 'vendors'),
      where('userId', '==', user.uid),
      where('type', '==', 'RealEstateSeller'),
      where('status', '==', 'Approved')
    );
    
    const unsubscribe = onSnapshot(qVendors, (snap) => {
      if (!snap.empty) {
        setSellerProfile({ id: snap.docs[0].id, ...snap.docs[0].data() } as any);
      }
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const qApps = query(
      collection(db, 'partner_applications'),
      where('userId', '==', user.uid),
      where('type', '==', 'RealEstateSeller')
    );

    const unsubscribe = onSnapshot(qApps, (appSnap) => {
      if (!appSnap.empty) {
        setSellerProfile(prev => {
          if (prev?.status === 'Approved') return prev;
          return { id: appSnap.docs[0].id, ...appSnap.docs[0].data() } as any;
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const filteredProperties = React.useMemo(() => 
    properties.filter(p => {
      const matchesTab = activeTab === 'All' || p.category === activeTab;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.location.area.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    }),
  [properties, activeTab, searchTerm]);

  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phone, setPhone] = useState('');
  const [privateData, setPrivateData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (selectedProperty && (isAdmin || selectedProperty.sellerId === user?.uid)) {
      const unsub = onSnapshot(doc(db, 'properties', selectedProperty.id, 'private', 'data'), (snap) => {
        if (snap.exists()) {
          setPrivateData(snap.data());
        }
      });
      return () => unsub();
    } else {
      setPrivateData(null);
    }
  }, [selectedProperty, isAdmin, user]);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    setVerifying(true);
    try {
      // MSG91 removed. Simulating OTP send.
      await new Promise(resolve => setTimeout(resolve, 800));
      setOtpSent(true);
      alert("Verification code sent successfully to " + phone);
    } catch (err) {
      alert("Failed to process request. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) return;
    setVerifying(true);
    try {
      // MSG91 removed. Bypassing verification.
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsVerified(true);
      alert("Phone Verified successfully!");
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handlePostProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // If seller is already approved, we don't strictly need OTP again but we check if they are logged in
    const isApprovedSeller = sellerProfile?.status === 'Approved' || isAdmin;

    if (!isApprovedSeller && !isVerified) {
      alert("Please verify your phone number with OTP first.");
      return;
    }

    if (!photoSafetyChecked && previewImage) {
      alert("Please confirm that the uploaded photo does not contain any phone numbers or contact info.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Extra validation for phone numbers in description
    const description = formData.get('description') as string;
    const phoneRegex = /(\+91|91)?[6789]\d{9}/g;
    if (phoneRegex.test(description)) {
      alert("Policy Violation: You cannot include phone numbers in the property description. Please remove them and use our secure system.");
      return;
    }

    try {
      const propertyData = {
        title: formData.get('title'),
        price: Number(formData.get('price')),
        type: formData.get('type'),
        category: formData.get('category'),
        description: description,
        image: previewImage || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
        location: {
          area: formData.get('area'),
          city: formData.get('city'),
          pincode: formData.get('pincode')
        },
        details: {
          sqft: formData.get('sqft'),
          bedrooms: formData.get('bedrooms'),
          bathrooms: formData.get('bathrooms'),
          furnished: formData.get('furnished'),
          facing: formData.get('facing')
        },
        updatedAt: serverTimestamp()
      };

      if (editProperty) {
        // Update existing property
        const { updateDoc, doc: fireDoc } = await import('firebase/firestore');
        await updateDoc(fireDoc(db, 'properties', editProperty.id), {
          ...propertyData,
          editCount: isAdmin ? (editProperty.editCount || 0) : (editProperty.editCount || 0) + 1
        });
        
        await setDoc(doc(db, 'properties', editProperty.id, 'private', 'data'), {
          sellerPhone: phone || privateData?.sellerPhone || 'N/A',
          fullAddress: formData.get('full_address'),
          lastUpdated: serverTimestamp()
        }, { merge: true });

        alert("Property updated successfully!");
      } else {
        // Add new property
        const docRef = await addDoc(collection(db, 'properties'), {
          ...propertyData,
          sellerId: user?.uid,
          sellerName: userProfile?.name || (sellerProfile as any)?.name || sellerProfile?.fullName || 'User',
          id: `prop-${Date.now()}`,
          isApproved: isApprovedSeller,
          editCount: 0,
          createdAt: serverTimestamp()
        });

        // Secure part - Only Admin can see this
        await setDoc(doc(db, 'properties', docRef.id, 'private', 'data'), {
          sellerPhone: isApprovedSeller ? (sellerProfile?.phone || phone) : phone,
          fullAddress: formData.get('full_address'),
          lastUpdated: serverTimestamp()
        });

        // If not yet a seller, create a pending application
        if (!isApprovedSeller) {
          const appRef = collection(db, 'partner_applications');
          await addDoc(appRef, {
            userId: user?.uid,
            name: userProfile?.name || formData.get('title')?.toString().split(' ')[0] || 'Seller',
            phone: phone,
            type: 'RealEstateSeller',
            status: 'Pending',
            businessAddress: formData.get('full_address'),
            createdAt: serverTimestamp()
          });
        }
        alert("Property posted successfully! It will be live after admin review.");
      }

      setShowRegForm(false);
      setEditProperty(null);
      setPreviewImage(null);
      setIsVerified(false);
      setOtpSent(false);
      setOtpCode('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'properties');
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Photo Policy Check
    alert("Photo Content Policy: Please ensure the photo DOES NOT contain any phone numbers, email addresses, or personal contact details. Photos with written contact info will be REJECTED by admins.");

    setUploadingImage(true);
    // In a real app, upload to Firebase Storage
    // Simulation:
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-95">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 italic tracking-tight flex items-center gap-2">
              Lokal Real Estate <Building2 className="w-5 h-5 text-indigo-500" />
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Buy, Sell & Rent Properties</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (isAdmin || sellerProfile?.status === 'Approved') {
                  setShowRegForm(true);
                } else {
                  setShowOnboarding(true);
                }
              }}
              className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Post Property</span>
            </button>
           <button onClick={onClose} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-95">
             <X className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 scrollbar-hide pb-20">
        {/* Hero & Search */}
        <div className="bg-white px-6 py-8 border-b border-slate-100">
           <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text"
                placeholder="Search by area, property type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-[2rem] py-5 pl-14 pr-6 text-sm font-bold transition-all outline-none"
              />
           </div>

           <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
             {(['All', 'Residential', 'Commercial', 'Land'] as const).map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                   activeTab === tab 
                   ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                   : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                 }`}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>

        {/* Property List */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.length > 0 ? (
            filteredProperties.map(property => {
              const isSelected = selectedProperty?.id === property.id;
              return (
                <motion.div
                  key={property.id}
                  layout
                  onClick={() => setSelectedProperty(isSelected ? null : property)}
                  className={`bg-white rounded-[2.5rem] overflow-hidden border transition-all duration-300 ${
                    isSelected 
                      ? 'col-span-1 sm:col-span-2 lg:col-span-3 ring-4 ring-indigo-500/20 shadow-xl border-indigo-200' 
                      : 'shadow-sm border-slate-100 cursor-pointer hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <div className="aspect-[16/10] sm:aspect-[4/3] relative overflow-hidden">
                    <img src={property.image} className="w-full h-full object-cover" alt={property.title} />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                         {property.category}
                      </span>
                      <span className={`px-4 py-1.5 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full ${property.type === 'Sell' ? 'bg-rose-500/80' : 'bg-emerald-500/80'}`}>
                         For {property.type}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="absolute top-4 right-4 flex gap-2">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleEditProperty(property); }}
                           className="p-2 bg-white rounded-xl shadow-lg text-indigo-600 hover:text-indigo-700 transition-all active:scale-95"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDeleteProperty(property.id); }}
                           className="p-2 bg-white rounded-xl shadow-lg text-rose-600 hover:text-rose-700 transition-all active:scale-95"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg">
                      <p className="text-sm font-black text-slate-900 tracking-tight italic">₹{property.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">{property.title}</h3>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                          <MapPin className="w-3 h-3 text-rose-400" />
                           {property.location?.area || ''} {property.location?.area && property.location?.city ? ',' : ''} {property.location?.city || ''}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="shrink-0 px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 animate-pulse">
                          Viewing Details
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 py-4 border-t border-slate-50">
                      {property.details?.bedrooms && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Bed className="w-4 h-4 text-indigo-500/80" />
                          <span className="text-[10px] font-black">{property.details.bedrooms} BHK</span>
                        </div>
                      )}
                      {property.details?.sqft && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Maximize2 className="w-4 h-4 text-indigo-500/80" />
                          <span className="text-[10px] font-black">{property.details.sqft} sq.ft</span>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="overflow-hidden border-t border-slate-100 mt-4 pt-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-6">
                            {/* Description & Features */}
                            <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-indigo-500" /> Description & Features
                              </h4>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                                  {property.description}
                                </p>
                                <div className="mt-4 pt-4 border-t border-slate-200/60">
                                  <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest">
                                      {property.details?.furnished || 'Semi-furnished'}
                                    </span>
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest">
                                      Electricity 24/7
                                    </span>
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-500 border border-slate-200 uppercase tracking-widest">
                                      Water Supply
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bento Grid Features */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {property.details?.sqft && (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-0.5">
                                  <Maximize2 className="w-4 h-4 text-indigo-500" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Area</span>
                                  <span className="text-[11px] font-black text-slate-900 mt-0.5">{property.details.sqft} sq.ft</span>
                                </div>
                              )}
                              {property.details?.bedrooms && (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-0.5">
                                  <Bed className="w-4 h-4 text-indigo-500" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Bedrooms</span>
                                  <span className="text-[11px] font-black text-slate-900 mt-0.5">{property.details.bedrooms} BHK</span>
                                </div>
                              )}
                              {property.details?.bathrooms && (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-0.5">
                                  <Bath className="w-4 h-4 text-indigo-500" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Bathrooms</span>
                                  <span className="text-[11px] font-black text-slate-900 mt-0.5">{property.details.bathrooms} Baths</span>
                                </div>
                              )}
                              {property.details?.facing && (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center gap-0.5">
                                  <Smartphone className="w-4 h-4 text-indigo-500 rotate-45" />
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Facing</span>
                                  <span className="text-[11px] font-black text-slate-900 mt-0.5">{property.details.facing}</span>
                                </div>
                              )}
                            </div>

                            {/* Sensitive Info Admin Access Controls */}
                            {isAdmin && (
                              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest leading-none">Admin Sensitive Portal</p>
                                  <p className="text-[11px] font-bold text-slate-700">Full Address: <span className="font-black text-slate-900">{privateData?.fullAddress || 'Loading Address...'}</span></p>
                                  <p className="text-[11px] font-bold text-slate-700">Owner Contact: <span className="font-black text-slate-900">{property.sellerName} ({privateData?.sellerPhone || 'Loading Phone...'})</span></p>
                                </div>
                              </div>
                            )}

                            {/* Bureau Assurance Alert Card */}
                            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/30">
                              <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">
                                Seller contacts and listings are fully verified. Tap Call Bureau or Chat (24/7) below to coordinate directly.
                              </p>
                            </div>

                            {/* Core Actions Panel */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  if (isWithinSupportHours()) {
                                    window.location.href = "tel:7416574197";
                                  } else {
                                    alert("Our phone support (7416574197) is only available between 9:30 AM and 4:30 PM. Please use our 24/7 Chat!");
                                  }
                                }}
                                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-colors"
                              >
                                <PhoneCall className="w-4 h-4" />
                                Call Bureau
                              </button>
                              <button 
                                onClick={() => setShowChat({ isOpen: true, propertyId: property.id })}
                                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-150 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                24/7 Chat
                              </button>
                            </div>

                            {/* Modify Listing Tool */}
                            {(isAdmin || property.sellerId === user?.uid) && (
                              <button 
                                onClick={() => handleEditProperty(property)}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all mt-2"
                              >
                                <Building2 className="w-4 h-4" />
                                Modify Listing {!isAdmin && `(${property.editCount || 0}/2)`}
                              </button>
                            )}

                            {/* Close inline card option */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProperty(null);
                              }}
                              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-2xl font-black uppercase tracking-widest text-[9px] text-center transition-colors"
                            >
                              Close Details Panel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 italic mb-2 tracking-tight">No properties found</h3>
              <p className="text-slate-400 font-bold italic text-sm">Be the first to post a property in this category!</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Details Modal is now rendered beautifully inline within the selected card to avoid navigating away */}

      {/* Post Property Form */}
      <AnimatePresence>
        {showRegForm && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-[200] bg-white flex flex-col"
          >
             <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 italic tracking-tight">Post New Property</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Registration Form</p>
                  </div>
                </div>
                <button onClick={() => setShowRegForm(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <form onSubmit={handlePostProperty} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                {editProperty && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                    <Info className="w-5 h-5 text-indigo-500" />
                    <p className="text-[10px] font-bold text-indigo-700 italic uppercase">
                      Editing Property: {editProperty.title} {isAdmin ? '(Admin Control)' : `(Edit ${editProperty.editCount || 0}/2)`}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Property Title</label>
                      <input required name="title" defaultValue={editProperty?.title} placeholder="e.g. 3BHK Luxury Flat in City Center" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Asking Price (₹)</label>
                      <input required type="number" name="price" defaultValue={editProperty?.price} placeholder="Total Price" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Listing Type</label>
                      <select required name="type" defaultValue={editProperty?.type} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 appearance-none">
                        <option value="Sell">For Sell</option>
                        <option value="Rent">For Rent</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                      <select required name="category" defaultValue={editProperty?.category} className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 appearance-none">
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Land">Land / Plot</option>
                        <option value="Agricultural">Agricultural</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location Details</label>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input required name="area" defaultValue={editProperty?.location.area} placeholder="Area Name" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                      <input required name="city" defaultValue={editProperty?.location.city} placeholder="City" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                      <input required name="pincode" defaultValue={editProperty?.location.pincode} placeholder="Pincode" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                   </div>
                   <input required name="full_address" defaultValue={privateData?.fullAddress} placeholder="Exact Location (Room/Flat No., Bldg, Landmark) - Visible only to Admin" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 mt-2" />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Verification</label>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <input 
                           required 
                           type="tel" 
                           name="phone" 
                           value={phone}
                           onChange={(e) => setPhone(e.target.value)}
                           placeholder="Seller Mobile Number" 
                           className="flex-1 bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-regular" 
                           disabled={isVerified || verifying} 
                         />
                         {!isVerified ? (
                           <button 
                             type="button" 
                             onClick={handleSendOTP} 
                             disabled={verifying}
                             className={`px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest ${verifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             {verifying ? 'Wait...' : (otpSent ? 'Resend' : 'Send OTP')}
                           </button>
                         ) : (
                           <div className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <Check className="w-3 h-3" /> Verified
                           </div>
                         )}
                      </div>
                      {otpSent && !isVerified && (
                        <div className="flex items-center gap-3">
                           <input 
                             type="text" 
                             placeholder="Enter OTP" 
                             value={otpCode} 
                             onChange={(e) => setOtpCode(e.target.value)} 
                             className="flex-1 bg-indigo-50 border-indigo-100 border rounded-2xl py-4 px-6 text-sm font-black outline-none" 
                           />
                           <button 
                             type="button" 
                             onClick={handleVerifyOTP} 
                             disabled={verifying}
                             className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                           >
                             {verifying ? '...' : 'Verify'}
                           </button>
                        </div>
                      )}
                   </div>
                   <p className="px-1 text-[8px] font-bold text-slate-400 italic">Seller number and full address are strictly hidden from customers.</p>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Technical Specs</label>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <input name="sqft" defaultValue={editProperty?.details.sqft} placeholder="Sq.Ft" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                      <input name="bedrooms" defaultValue={editProperty?.details.bedrooms} placeholder="BHK" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                      <input name="bathrooms" defaultValue={editProperty?.details.bathrooms} placeholder="Baths" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                      <input name="facing" defaultValue={editProperty?.details.facing} placeholder="Facing" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                   <textarea name="description" defaultValue={editProperty?.description} rows={4} placeholder="Describe the property, amenities, nearby locations..." className="w-full bg-slate-50 border-none rounded-[2rem] py-5 px-8 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500 resize-none"></textarea>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Images</label>
                   
                   <div className="bg-indigo-50 p-4 rounded-[2rem] mb-4 border border-indigo-100 flex flex-col gap-3">
                     <div className="flex gap-3">
                       <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                       <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase italic">
                         Safety Policy: Photos MUST NOT contain phone numbers, URLs, or personal contact info. If found, your listing will be REJECTED.
                       </p>
                     </div>
                     <div 
                       onClick={() => setPhotoSafetyChecked(!photoSafetyChecked)}
                       className="flex items-center gap-3 bg-white/50 p-3 rounded-xl cursor-pointer hover:bg-white transition-all"
                     >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${photoSafetyChecked ? 'bg-indigo-600 border-indigo-600' : 'border-indigo-300'}`}>
                           {photoSafetyChecked && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-[9px] font-black text-indigo-900 uppercase">I confirm this photo has no contact info</span>
                     </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 overflow-hidden">
                         {previewImage ? (
                           <img src={previewImage} className="w-full h-full object-cover" alt="Capture Preview" />
                         ) : (
                           <>
                              <Camera className="w-8 h-8 text-slate-300" />
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Click to Capture</p>
                           </>
                         )}
                         <input 
                           type="file" 
                           accept="image/*" 
                           capture="environment" 
                           onChange={handleImageCapture}
                           className="absolute inset-0 opacity-0 cursor-pointer"
                         />
                      </div>
                      <div className="flex flex-col gap-3">
                         <div className="relative">
                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input name="image_url" placeholder="Paste external image URL (Optional)" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500" />
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 italic leading-tight">Supported: Camera Capture or Direct URL. For best results, use horizontal (Landscape) photos.</p>
                      </div>
                   </div>
                </div>

                <div className="pt-6">
                   <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 active:scale-95 transition-all">
                      Confirm & Submit for Review
                   </button>
                   <p className="text-center text-[10px] font-bold text-slate-400 mt-4 italic uppercase tracking-wider">
                      Note: All property listings are verified by Lokal Bureau admins.
                   </p>
                </div>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Chat Component */}
      <PropertyChat 
        isOpen={showChat.isOpen} 
        onClose={() => setShowChat({ isOpen: false, propertyId: null })}
        property={selectedProperty}
      />

      <AnimatePresence>
        {showOnboarding && user && (
          <PartnerOnboarding 
            userId={user.uid}
            onClose={() => setShowOnboarding(false)}
            onSuccess={() => {
              setShowOnboarding(false);
              // After success, it might still take a bit for approval, but we can refresh local state
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

{/* Property Chat Sub-component */}
const PropertyChat = ({ isOpen, onClose, property }: { isOpen: boolean, onClose: () => void, property: Property | null }) => {
  const { user, userProfile } = useFirebase();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (isOpen && property && user) {
      // Chat is with Local Bharath Support regarding this property
      const q = query(
        collection(db, 'support_chats'),
        where('propertyId', '==', property.id),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'support_chats');
      });
      return () => unsubscribe();
    }
  }, [isOpen, property, user]);

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const finalMsg = customMsg || newMessage;
    if (!finalMsg.trim() || !user || !property) return;

    try {
      await addDoc(collection(db, 'support_chats'), {
        propertyId: property.id,
        propertyTitle: property.title,
        userId: user.uid,
        userName: user.displayName || userProfile?.name || 'Customer',
        text: finalMsg,
        senderId: user.uid,
        senderName: user.displayName || userProfile?.name || 'Customer',
        isAdminResponse: false,
        timestamp: serverTimestamp()
      });
      setNewMessage('');

      // Auto-Bot Response
      const botResponse = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('available')) return `Our support team is checking the availability of ${property.title}. We will call you at your registered number soon!`;
        if (lower.includes('visit') || lower.includes('see')) return "Sure! Please provide your preferred date and time for the visit. Our executive will coordinate with the owner and confirm.";
        if (lower.includes('negotiable') || lower.includes('price')) return "The listed price is ₹" + property.price.toLocaleString() + ". Final negotiations can happen during the site visit.";
        return "Thank you for showing interest in this property. A dedicated support executive will contact you shortly to provide more details.";
      };

      setTimeout(async () => {
        await addDoc(collection(db, 'support_chats'), {
          propertyId: property.id,
          propertyTitle: property.title,
          userId: user.uid,
          userName: 'Support Bot',
          text: botResponse(finalMsg),
          senderId: 'admin-bot',
          senderName: 'Lokal Support Bot',
          isAdminResponse: true,
          timestamp: serverTimestamp()
        });
      }, 1000);

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'support_chats');
    }
  };

  const autoQuestions = [
    "Is this property still available?",
    "Can I schedule a visit to the site?",
    "What is the exact location?",
    "Is the price negotiable?"
  ];

  if (!isOpen || !property) return null;

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="fixed inset-0 z-[300] bg-white flex flex-col md:inset-auto md:right-0 md:top-0 md:h-full md:w-[440px] md:shadow-3xl"
    >
      <div className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
               <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
               <h3 className="text-sm font-black text-slate-900 truncate max-w-[200px]">{property.title}</h3>
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic leading-none">Local Bharath Support</p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-emerald-50 rounded-lg flex items-center gap-1.5 shadow-sm border border-emerald-100">
               <ShieldCheck className="w-3 h-3 text-emerald-500" />
               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Verified Hub</span>
            </div>
            <X onClick={onClose} className="w-5 h-5 text-slate-300 cursor-pointer" />
         </div>
      </div>

      <div className="bg-amber-50 px-6 py-3 border-b border-amber-100/50">
        <p className="text-[9px] font-bold text-amber-700 leading-tight text-center italic">
          Direct contact with sellers is restricted. Our support executive will assist you with this property.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scrollbar-hide">
         {messages.length === 0 && (
            <div className="text-center py-20">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-slate-300">
                  <span className="text-2xl">🤝</span>
               </div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic px-8 leading-relaxed">
                 Express your interest in this property. Our executive will call you after verification.
               </p>
               
               <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  {autoQuestions.map((q, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendMessage(undefined, q)}
                      className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-indigo-600 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
               </div>
            </div>
         )}
         {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
               <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-bold shadow-sm ${msg.senderId === user?.uid ? 'bg-indigo-600 text-white rounded-tr-none' : msg.isAdminResponse ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-tl-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                  {msg.text}
               </div>
               <div className="flex items-center gap-1.5 mt-1 px-1">
                  {msg.isAdminResponse && <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />}
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    {msg.senderName} • {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                  </span>
               </div>
            </div>
         ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 flex items-center gap-3">
         <input 
           value={newMessage}
           onChange={(e) => setNewMessage(e.target.value)}
           placeholder="Write your message..."
           className="flex-1 bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500"
         />
         <button className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 active:scale-90 transition-all">
            <Send className="w-5 h-5" />
         </button>
      </form>
    </motion.div>
  );
};
