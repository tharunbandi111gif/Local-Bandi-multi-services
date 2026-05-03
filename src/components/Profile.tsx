import React, { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Bell, Shield, ShieldCheck, LogOut, ChevronRight, Settings as SettingsIcon, Plus, Trash2, Edit2, X, Check, Gift, Share2, Copy, Wallet, Receipt, TrendingUp, TrendingDown, Package, Camera, Bike, Briefcase, Navigation, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Address, Transaction, LanguageCode, Screen } from '../types';
import { translations } from '../translations';
import { referralService } from '../lib/referral';
import { useFirebase } from '../contexts/FirebaseContext';
import { compressImage } from '../lib/imageUtils';

interface ProfileProps {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  language: LanguageCode;
}

export default function Profile({ onBack, onNavigate, language }: ProfileProps) {
  const t = translations[language].profile;
  const { user, userProfile: contextProfile, isAdmin } = useFirebase();
  const [view, setView] = useState<'main' | 'addresses' | 'refer' | 'wallet' | 'editProfile'>('main');
  const [isDeliveryPartner] = useState(() => localStorage.getItem('isDeliveryPartner') === 'true');
  const [isVendor] = useState(() => localStorage.getItem('isVendor') === 'true');

  const [walletBalance, setWalletBalance] = useState(() => referralService.getWalletBalance());
  const [transactions, setTransactions] = useState<Transaction[]>(() => referralService.getTransactions());
  const [supportInfo] = useState(() => {
    const saved = localStorage.getItem('supportInfo');
    return saved ? JSON.parse(saved) : { phone: '9876543210', email: 'localbharathkhammam@gmail.com' };
  });

  const [userProfile, setUserProfile] = useState({
    name: contextProfile?.name || user?.displayName || 'Lokal User',
    email: contextProfile?.email || user?.email || '',
    phone: contextProfile?.phone || '',
    photo: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop'
  });

  const [editForm, setEditForm] = useState(userProfile);

  React.useEffect(() => {
    if (contextProfile) {
      setUserProfile({
        name: contextProfile.name || user?.displayName || 'Lokal User',
        email: contextProfile.email || user?.email || '',
        phone: contextProfile.phone || '',
        photo: user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop'
      });
    }
  }, [contextProfile, user]);
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const saved = localStorage.getItem('user_addresses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse addresses", e);
      }
    }
    return [
      { id: '1', label: 'Home', recipientName: 'Tharun Bandi', phone: '9876543210', pincode: '500081', address: 'Plot No. 42, Hitech City, Hyderabad', isDefault: true },
      { id: '2', label: 'Work', recipientName: 'Tharun Bandi', phone: '9876543210', pincode: '500081', address: 'Mindspace IT Park, Bldg 12, Hyderabad', isDefault: false },
      { id: '3', label: 'Parents', recipientName: 'Bandi Family', phone: '9123456789', pincode: '500090', address: 'H.No 4-12/A, Krishna Nagar, Nizampet', isDefault: false },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('user_addresses', JSON.stringify(addresses));
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

  const referralCode = 'LOKAL500';

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

  const menuItems = [
    ...(isAdmin ? [{ 
      icon: ShieldCheck, 
      label: 'Founder Dashboard', 
      sub: 'Manage App & Approvals', 
      onClick: () => {
        onNavigate('home');
        localStorage.setItem('openAdminOnHome', 'true');
      }
    }] : []),
    { 
      icon: User, 
      label: t.editProfile, 
      sub: 'Name, Email, Phone', 
      onClick: () => {
        setEditForm(userProfile);
        setView('editProfile');
      }
    },
    { icon: Package, label: t.myOrders, sub: 'View order history', onClick: () => onNavigate('orders') },
    ...((isAdmin || isVendor) ? [{ 
      icon: Briefcase, 
      label: 'Vendor Dashboard', 
      sub: 'Manage items & prices', 
      onClick: () => {
        onNavigate('vendor');
      } 
    }] : []),
    ...((isAdmin || isDeliveryPartner) ? [{ icon: Bike, label: 'Delivery Console', sub: 'For Partners Only', onClick: () => onNavigate('delivery') }] : []),
    { icon: MapPin, label: t.savedAddresses, sub: `${addresses.length} Addresses saved`, onClick: () => setView('addresses') },
    { icon: Wallet, label: t.lokalWallet, sub: `Balance: ₹${walletBalance}`, onClick: () => setView('wallet') },
    { icon: Gift, label: t.referAndEarn, sub: 'Get ₹15 for every friend', onClick: () => setView('refer') },
    { icon: Bell, label: t.notifications, sub: 'Order updates and offers', onClick: () => onNavigate('notifications') },
    { icon: Shield, label: t.accountSecurity, sub: t.dataSecuritySub || '256-bit Data Encryption' },
    { icon: SettingsIcon, label: t.appSettings, sub: 'Dark mode, language etc', onClick: () => onNavigate('settings') },
    ...(!isVendor && !isAdmin ? [{ 
      icon: Briefcase, 
      label: 'Local Vendor Program', 
      sub: 'Sell your products online', 
      onClick: () => {
        onNavigate('home');
        localStorage.setItem('openPartnerForm', 'vendor');
      } 
    }] : []),
    ...(!isDeliveryPartner && !isAdmin ? [{ 
      icon: Bike, 
      label: 'Delivery Fleet', 
      sub: 'Join our logistics team', 
      onClick: () => {
        onNavigate('home');
        localStorage.setItem('openPartnerForm', 'delivery');
      } 
    }] : []),
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
                      placeholder="9876543210"
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

                  <div>
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
                      }}
                      onBlur={() => validateField('address', currentAddress.address || '')}
                      className={`w-full h-24 bg-gray-50 rounded-[2rem] p-5 text-xs text-gray-900 font-bold placeholder:text-gray-300 outline-none border-2 transition-all resize-none ${errors.address ? 'border-rose-300 bg-rose-50/30' : 'border-transparent focus:border-yellow-400'}`}
                    />
                    {errors.address && <p className="text-[9px] font-black text-rose-500 mt-1 pl-2 uppercase tracking-widest">{errors.address}</p>}
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
          <h2 className="text-xl font-black text-gray-900">Lokal Wallet</h2>
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
            Invite friends to Lokal Bharath. New users get <span className="text-gray-900 font-black">₹10</span> instantly after first order. You get <span className="text-gray-900 font-black">₹15</span> after their first successful order!
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
                if (navigator.share) {
                  navigator.share({
                    title: 'Lokal Bharath',
                    text: `Use my code ${referralCode} to get ₹10 in your Lokal Wallet!`,
                    url: window.location.origin,
                  });
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
                { step: 2, text: 'Friend downloads & gets ₹10 bonus' },
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
    <div className="h-full w-full bg-white flex flex-col font-sans">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white/90 backdrop-blur-xl border-b border-gray-50 sticky top-0 z-50">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack} 
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </motion.button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-gray-900 font-display italic tracking-tight">{t.title}</h2>
        </div>
      </header>

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
          <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter font-display">{userProfile.name}</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            Platinum Member
          </p>
          
          <div className="flex gap-4 w-full mt-8">
            <div className="flex-1 bg-white p-5 rounded-[2.5rem] border border-gray-100 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Orders</p>
              <p className="text-2xl font-black text-gray-900 italic font-display">42</p>
            </div>
            <div className="flex-1 bg-white p-5 rounded-[2.5rem] border border-gray-100 text-center shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Savings</p>
              <p className="text-2xl font-black text-gray-900 italic font-display">₹1,240</p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12 blur-xl group-hover:scale-110 transition-transform" />
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none mb-1.5">Safe & Secure Transactions</p>
              <p className="text-[9px] font-bold text-emerald-700/70 leading-relaxed">Encrypted processing for your personal and payment data.</p>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-3 pb-12">
          {menuItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={item.onClick}
              className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 rounded-[2.5rem] transition-all text-left border border-transparent shadow-sm hover:shadow-md hover:border-gray-50 group"
            >
              <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-white transition-colors group-hover:shadow-sm">
                <item.icon className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-gray-900 group-hover:translate-x-0.5 transition-transform">{item.label}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={() => onNavigate('login')}
            className="w-full flex items-center gap-4 p-5 hover:bg-rose-50 rounded-[2.5rem] transition-all text-left text-rose-500 mt-10 border border-transparent hover:border-rose-100 group"
          >
            <div className="bg-rose-50 p-4 rounded-2xl group-hover:bg-white transition-colors shadow-sm">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-black uppercase tracking-widest text-xs">{t.signOut}</span>
          </motion.button>
        </div>
      </div>
      {/* Referral Modal */}
      <AnimatePresence>
        {view === 'refer' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Refer & Earn</h3>
                </div>
                <button onClick={() => setView('main')} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-10">
                <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-100">
                  <Gift className="w-16 h-16 text-gray-900" />
                </div>
                <h4 className="text-3xl font-black text-gray-900 mb-2 italic">Earn ₹15</h4>
                <p className="text-gray-500 font-bold px-6 leading-relaxed">
                  Refer your friends and get ₹15 in your Lokal Wallet when they complete their first order.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">Your Referral Code</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-black text-gray-900 tracking-tighter">{referralCode}</span>
                  <button 
                    onClick={handleCopy}
                    className={`text-[10px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-100 px-4 py-2 rounded-xl active:scale-95 transition-all ${copied ? 'bg-green-500 text-white' : ''}`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setView('main')}
                  className="flex-1 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-gray-100 flex items-center justify-center gap-2 active:scale-95 transition-all text-sm"
                >
                  Invite Friends
                </button>
              </div>
            </motion.div>
          </motion.div>
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
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 border-transparent focus:border-yellow-400 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">Email Address</label>
                  <input 
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 border-transparent focus:border-yellow-400 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">Phone Number</label>
                  <input 
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-black text-gray-900 outline-none border-2 border-transparent focus:border-yellow-400 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-50">
              <button 
                onClick={() => setShowProfileConfirm(true)}
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
                  onClick={async () => {
                    if (user) {
                      try {
                        await updateDoc(doc(db, 'users', user.uid), {
                          name: editForm.name,
                          email: editForm.email,
                          phone: editForm.phone,
                          updatedAt: serverTimestamp()
                        });
                        setUserProfile(editForm);
                        setView('main');
                        setShowProfileConfirm(false);
                      } catch (e) {
                        console.error("Failed to update profile", e);
                        alert("Failed to update profile. Please try again.");
                      }
                    }
                  }}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
