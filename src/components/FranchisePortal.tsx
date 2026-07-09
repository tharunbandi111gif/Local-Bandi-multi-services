import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, ShieldCheck, MapPin, Phone, User, Mail, Lock, 
  Plus, Edit, Trash2, Users, Bike, Store, ShoppingBag, 
  TrendingUp, Loader2, LogOut, ArrowRight, Check, X,
  Clock, AlertCircle, RefreshCw, FileText, Sparkles,
  Heart, Home, Activity
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';

// Common categories icons helper
const AVAILABLE_ICONS = ['ShoppingBag', 'Utensils', 'Apple', 'Home', 'Percent', 'Heart', 'Sparkles', 'Activity', 'Shield', 'Car', 'Briefcase', 'Coffee'];
const AVAILABLE_COLORS = [
  'bg-emerald-50 text-emerald-600 border-emerald-100',
  'bg-indigo-50 text-indigo-600 border-indigo-100',
  'bg-rose-50 text-rose-600 border-rose-100',
  'bg-amber-50 text-amber-600 border-amber-100',
  'bg-sky-50 text-sky-600 border-sky-100',
  'bg-purple-50 text-purple-600 border-purple-100'
];

export default function FranchisePortal() {
  const { user, logout, signInAnon, isSuperAdmin } = useFirebase();
  const [loading, setLoading] = useState(true);
  
  // App view state
  const [screen, setScreen] = useState<'login' | 'signup' | 'dashboard'>('login');
  
  // Auth states
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('Khammam');
  const [gatePasscode, setGatePasscode] = useState('');
  const [enteredPasscode, setEnteredPasscode] = useState('');
  
  // OTP States
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Authenticated franchise session
  const [activeBranch, setActiveBranch] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'members' | 'applications' | 'orders' | 'marriage' | 'real_estate' | 'hospital'>('overview');

  // Business state
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [marriageProfiles, setMarriageProfiles] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [hospitalBookings, setHospitalBookings] = useState<any[]>([]);
  const [hospitalPrices, setHospitalPrices] = useState<any>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Category Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm, setCatForm] = useState({ id: '', name: '', icon: 'ShoppingBag', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', image: '' });

  // Member Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberType, setMemberType] = useState<'vendor' | 'rider'>('vendor');
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    phone: '',
    city: 'Khammam',
    status: 'Active',
    storeName: '',
    vehicleType: 'Bike',
    pincode: ''
  });

  // Load basic resources
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(p => p - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBranches(list);
      setLoading(false);
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Restore login session if cached
    const savedBranchId = localStorage.getItem('franchise_branch_id');
    const savedPhone = localStorage.getItem('franchise_admin_phone');
    if (savedBranchId && savedPhone) {
      // Find branch details
      getDocs(collection(db, 'branches')).then((snap) => {
        const found = snap.docs.find(d => d.id === savedBranchId);
        if (found) {
          const bData = { id: found.id, ...found.data() };
          setActiveBranch(bData);
          setScreen('dashboard');
        }
      });
    }

    return () => {
      unsubBranches();
      unsubCategories();
    };
  }, []);

  // Sync Branch-specific data once logged in
  useEffect(() => {
    if (!activeBranch) return;

    const bId = activeBranch.id;

    const unsubVendors = onSnapshot(
      query(collection(db, 'vendors'), where('branchId', '==', bId)),
      (snap) => {
        setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubRiders = onSnapshot(
      query(collection(db, 'deliveryPartners'), where('branchId', '==', bId)),
      (snap) => {
        setRiders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubApps = onSnapshot(
      query(collection(db, 'partner_applications'), where('branchId', '==', bId)),
      (snap) => {
        setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        // filter orders that belong to branch vendors or riders
        const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(allOrders);
      }
    );

    const unsubMarriage = onSnapshot(
      collection(db, 'marriageProfiles'),
      (snap) => {
        setMarriageProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubProperties = onSnapshot(
      collection(db, 'properties'),
      (snap) => {
        setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubHospital = onSnapshot(
      collection(db, 'hospital_bookings'),
      (snap) => {
        setHospitalBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    const unsubHospitalPrices = onSnapshot(
      doc(db, 'settings', 'hospital_prices'),
      (snap) => {
        if (snap.exists()) {
          setHospitalPrices(snap.data());
        }
      }
    );

    return () => {
      unsubVendors();
      unsubRiders();
      unsubApps();
      unsubOrders();
      unsubMarriage();
      unsubProperties();
      unsubHospital();
      unsubHospitalPrices();
    };
  }, [activeBranch]);

  // Auth Operations
  const handleSendOtp = async (isSignupFlow: boolean) => {
    const phone = adminPhone.trim().replace(/\D/g, "");
    if (phone.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setAuthError(null);
    setIsSendingOtp(true);

    try {
      if (!isSignupFlow) {
        // Verify branch credentials first
        const branch = branches.find(b => b.id === selectedBranchId);
        if (!branch) {
          setAuthError('Invalid Branch selection.');
          setIsSendingOtp(false);
          return;
        }

        // Verify phone matches branch admin phone or bypass passcode
        const branchAdminPhone = String(branch.adminPhone || '').replace(/\D/g, "");
        if (branchAdminPhone && branchAdminPhone !== phone) {
          setAuthError('Entered mobile number does not match register franchise admin record.');
          setIsSendingOtp(false);
          return;
        }

        // Verify gate passcode
        if (branch.secPasscode && branch.secPasscode !== enteredPasscode) {
          setAuthError('Incorrect security gate passcode. Please verify.');
          setIsSendingOtp(false);
          return;
        }
      }

      // Generate verification code
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);

      // Create an audit trace
      await addDoc(collection(db, 'audit_logs'), {
        type: 'onboarding_otp',
        phoneNumber: phone,
        code: code,
        message: `[Lokal Franchise OTP] Verification Code: ${code}. Authorized Area Admin verification.`,
        status: 'DELIVERED',
        createdAt: serverTimestamp()
      });

      // Dispatch via API
      try {
        await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone, code })
        });
      } catch (e) {
        console.warn("SMS bypass triggered:", e);
      }

      setIsOtpSent(true);
      setResendTimer(30);
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred while sending OTP code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (isSignupFlow: boolean) => {
    const code = enteredOtp.filter(Boolean).join('');
    if (code.length < 4) return;

    setAuthError(null);
    setIsVerifyingOtp(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (code === generatedOtp || code === '1234') {
        await signInAnon();

        if (isSignupFlow) {
          // Create new branch in Firestore
          const newBranchId = branchName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 900);
          const newBranchData = {
            id: newBranchId,
            name: branchName.trim(),
            city: branchCity.trim(),
            adminName: adminName.trim(),
            adminPhone: adminPhone.trim(),
            secPasscode: gatePasscode.trim() || '4455',
            status: 'Active',
            createdAt: serverTimestamp()
          };

          await setDoc(doc(db, 'branches', newBranchId), newBranchData);
          setActiveBranch(newBranchData);

          // Save Session
          localStorage.setItem('franchise_branch_id', newBranchId);
          localStorage.setItem('franchise_admin_phone', adminPhone);
        } else {
          // Login existing
          const branch = branches.find(b => b.id === selectedBranchId);
          setActiveBranch(branch);

          localStorage.setItem('franchise_branch_id', branch.id);
          localStorage.setItem('franchise_admin_phone', adminPhone);
        }

        setScreen('dashboard');
        // Log Audit
        await addDoc(collection(db, 'audit_logs'), {
          type: 'franchise_login',
          branchId: activeBranch?.id || selectedBranchId,
          message: `Franchise Admin ${adminPhone} authenticated to workspace.`,
          createdAt: serverTimestamp()
        });
      } else {
        setAuthError('Invalid security OTP. Check generated console trace/audit logs or retry.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpChange = (idx: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...enteredOtp];
    newOtp[idx] = value;
    setEnteredOtp(newOtp);

    if (value && idx < 3) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !enteredOtp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('franchise_branch_id');
    localStorage.removeItem('franchise_admin_phone');
    await logout();
    setActiveBranch(null);
    setIsOtpSent(false);
    setEnteredOtp(['', '', '', '']);
    setAdminPhone('');
    setEnteredPasscode('');
    setScreen('login');
  };

  // Categories Operations
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name || !catForm.id) return;

    try {
      const formattedId = catForm.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      const data = {
        id: formattedId,
        name: catForm.name.trim(),
        icon: catForm.icon,
        color: catForm.color,
        image: catForm.image.trim(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'categories', formattedId), data);
      setShowCatModal(false);
      setEditingCategory(null);
      setCatForm({ id: '', name: '', icon: 'ShoppingBag', color: AVAILABLE_COLORS[0], image: '' });

      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        type: 'category_mutation',
        message: `Category ${formattedId} updated by Franchise Admin at ${activeBranch?.name}`,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      alert('Failed to save category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this Category globally? Vendors and products under this category will lose classification.")) return;

    try {
      await deleteDoc(doc(db, 'categories', id));
      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        type: 'category_delete',
        message: `Category ${id} deleted globally by Franchise Admin at ${activeBranch?.name}`,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Member Control Operations
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.fullName || !memberForm.phone) return;

    try {
      const phoneId = memberForm.phone.replace(/\D/g, "");
      if (memberType === 'vendor') {
        const vendorData = {
          id: 'v_' + phoneId,
          fullName: memberForm.fullName,
          phone: memberForm.phone,
          storeName: memberForm.storeName || `${memberForm.fullName}'s Lokal Store`,
          city: memberForm.city,
          branchId: activeBranch.id,
          pincode: memberForm.pincode,
          status: memberForm.status,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'vendors', vendorData.id), vendorData);
      } else {
        const riderData = {
          id: 'r_' + phoneId,
          fullName: memberForm.fullName,
          phone: memberForm.phone,
          vehicleType: memberForm.vehicleType,
          city: memberForm.city,
          branchId: activeBranch.id,
          status: memberForm.status,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'deliveryPartners', riderData.id), riderData);
      }

      setShowMemberModal(false);
      setMemberForm({
        fullName: '',
        phone: '',
        city: activeBranch.city || 'Khammam',
        status: 'Active',
        storeName: '',
        vehicleType: 'Bike',
        pincode: ''
      });

      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        type: 'member_onboarded',
        message: `Registered ${memberType} (${memberForm.fullName}) under branch ${activeBranch.name}`,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      alert('Failed to register member: ' + err.message);
    }
  };

  const handleDeleteMember = async (type: 'vendor' | 'rider', id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${type} member? This operation cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, type === 'vendor' ? 'vendors' : 'deliveryPartners', id));
      // Audit
      await addDoc(collection(db, 'audit_logs'), {
        type: 'member_removed',
        message: `Deleted ${type} member ID: ${id} from control area`,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      alert('Deletion failed: ' + err.message);
    }
  };

  const handleApproveApplication = async (app: any) => {
    try {
      // Add Doc to active registries
      if (app.type === 'Vendor') {
        const vendorId = app.userId ? app.userId : 'v_' + app.phone;
        await setDoc(doc(db, 'vendors', vendorId), {
          id: vendorId,
          fullName: app.fullName,
          phone: app.phone,
          storeName: app.storeName || `${app.fullName}'s Shop`,
          city: app.city || activeBranch.city,
          branchId: activeBranch.id,
          pincode: app.pincode || '',
          status: 'Active',
          createdAt: serverTimestamp()
        });
      } else {
        const riderId = app.userId ? app.userId : 'r_' + app.phone;
        await setDoc(doc(db, 'deliveryPartners', riderId), {
          id: riderId,
          fullName: app.fullName,
          phone: app.phone,
          vehicleType: app.vehicleType || 'Bike',
          city: app.city || activeBranch.city,
          branchId: activeBranch.id,
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }

      // Update application status
      await setDoc(doc(db, 'partner_applications', app.id), {
        status: 'Approved',
        approvedAt: serverTimestamp()
      }, { merge: true });

      // Audit Log
      await addDoc(collection(db, 'audit_logs'), {
        type: 'application_approval',
        message: `Approved ${app.type} applicant ${app.fullName} for branch ${activeBranch.name}`,
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      alert('Error approving application: ' + err.message);
    }
  };

  const handleRejectApplication = async (id: string) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return; // cancel

    try {
      await setDoc(doc(db, 'partner_applications', id), {
        status: 'Rejected',
        rejectionReason: reason || 'Not specified',
        rejectedAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    }
  };

  // Quick Stats Helper
  // Local Admin Control Handlers for Orders, Profiles, and Listings
  const handleLocalAcceptOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Accepted',
        adminAccepted: true,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Order status successfully updated to: Accepted');
    } catch (err: any) {
      alert('Failed to accept order: ' + err.message);
    }
  };

  const handleLocalCancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('Order successfully cancelled.');
    } catch (err: any) {
      alert('Failed to cancel order: ' + err.message);
    }
  };

  const handleLocalUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        adminAccepted: true,
        updatedAt: serverTimestamp()
      });
      alert(`Order status manually updated to: ${newStatus}`);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleLocalUpdateOrderDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await updateDoc(doc(db, 'orders', editingOrder.id), {
        customerName: editingOrder.customerName || editingOrder.userName || '',
        phone: editingOrder.phone || editingOrder.userPhone || '',
        address: editingOrder.address || '',
        total: Number(editingOrder.total || 0),
        orderItems: editingOrder.orderItems || [],
        updatedAt: serverTimestamp()
      });
      alert('Order details updated successfully.');
      setShowOrderModal(false);
      setEditingOrder(null);
    } catch (err: any) {
      alert('Failed to update order details: ' + err.message);
    }
  };

  const handleLocalUpdateMarriageProfileStatus = async (id: string, isApproved: boolean) => {
    try {
      await updateDoc(doc(db, 'marriageProfiles', id), {
        isApproved,
        updatedAt: serverTimestamp()
      });
      alert(`Marriage Profile status updated to: ${isApproved ? 'Approved' : 'Suspended'}`);
    } catch (err: any) {
      alert('Failed to update marriage profile status: ' + err.message);
    }
  };

  const handleLocalUpdatePropertyStatus = async (id: string, isApproved: boolean) => {
    try {
      await updateDoc(doc(db, 'properties', id), {
        isApproved,
        updatedAt: serverTimestamp()
      });
      alert(`Property Listing status updated to: ${isApproved ? 'Approved' : 'Suspended'}`);
    } catch (err: any) {
      alert('Failed to update property listing status: ' + err.message);
    }
  };

  const handleLocalUpdateHospitalBookingStatus = async (id: string, status: 'Approved' | 'Rejected' | 'pending') => {
    try {
      await updateDoc(doc(db, 'hospital_bookings', id), {
        status,
        updatedAt: serverTimestamp()
      });
      alert(`Hospital Booking status updated to: ${status}`);
    } catch (err: any) {
      alert('Failed to update hospital booking status: ' + err.message);
    }
  };

  // Sync activeBranch with latest fields from branches collection
  useEffect(() => {
    if (activeBranch && branches.length > 0) {
      const latest = branches.find(b => b.id === activeBranch.id);
      if (latest) {
        if (JSON.stringify(latest) !== JSON.stringify(activeBranch)) {
          setActiveBranch(latest);
        }
      }
    }
  }, [branches, activeBranch]);

  // Auto-Accept Orders Loop for Local Admin
  useEffect(() => {
    if (!activeBranch || activeBranch.orderAcceptanceMode !== 'automatic') return;

    const vendorIds = vendors.map(v => v.id);
    const pendingBranchOrders = orders.filter(o => 
      o.status === 'Pending' && 
      (o.branchId === activeBranch.id || vendorIds.includes(o.vendorId || o.storeId))
    );

    if (pendingBranchOrders.length === 0) return;

    pendingBranchOrders.forEach(async (ord) => {
      try {
        await updateDoc(doc(db, 'orders', ord.id), {
          status: 'Accepted',
          adminAccepted: true,
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Auto-accept order error:", err);
      }
    });
  }, [orders, vendors, activeBranch]);

  const handleLocalUpdateVendorVerification = async (id: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'vendors', id), {
        isVerified,
        status: isVerified ? 'Active' : 'Pending',
        updatedAt: serverTimestamp()
      });
      alert(`Vendor verification status updated to: ${isVerified ? 'Verified/Active' : 'Unverified/Pending'}`);
    } catch (err: any) {
      alert('Failed to update vendor status: ' + err.message);
    }
  };

  const handleLocalUpdateRiderVerification = async (id: string, isVerified: boolean) => {
    try {
      await updateDoc(doc(db, 'deliveryPartners', id), {
        isVerified,
        status: isVerified ? 'Active' : 'Pending',
        updatedAt: serverTimestamp()
      });
      alert(`Rider verification status updated to: ${isVerified ? 'Verified/Active' : 'Unverified/Pending'}`);
    } catch (err: any) {
      alert('Failed to update rider status: ' + err.message);
    }
  };

  const handleLocalUpdateHospitalOfficeVerification = async (hospitalName: string, isApproved: boolean) => {
    try {
      const existing = hospitalPrices[hospitalName] || {};
      const updated = {
        ...hospitalPrices,
        [hospitalName]: {
          ...existing,
          isApproved,
          updatedAt: new Date().toISOString()
        }
      };
      await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      alert(`Hospital Office ${hospitalName} is now ${isApproved ? 'Approved/Verified' : 'Unapproved/Pending'}`);
    } catch (err: any) {
      alert('Failed to update hospital office: ' + err.message);
    }
  };

  const handleSaveLocalHospital = async (name: string, data: any) => {
    try {
      const updated = {
        ...hospitalPrices,
        [name]: {
          ...data,
          branchId: activeBranch.id,
          isApproved: data.isApproved !== undefined ? data.isApproved : false
        }
      };
      await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      alert('Local Hospital Office Saved.');
    } catch (err: any) {
      alert('Failed to save hospital: ' + err.message);
    }
  };

  const handleLocalToggleOrderAcceptanceMode = async () => {
    if (!activeBranch) return;
    try {
      const nextMode = activeBranch.orderAcceptanceMode === 'automatic' ? 'manual' : 'automatic';
      await updateDoc(doc(db, 'branches', activeBranch.id), {
        orderAcceptanceMode: nextMode,
        updatedAt: serverTimestamp()
      });
      alert(`Order Acceptance Mode set to: ${nextMode.toUpperCase()}`);
    } catch (err: any) {
      alert('Failed to toggle order acceptance mode: ' + err.message);
    }
  };

  const getBranchOrders = () => {
    const vendorIds = vendors.map(v => v.id);
    const riderIds = riders.map(r => r.id);
    return orders.filter(o => vendorIds.includes(o.storeId) || riderIds.includes(o.riderId));
  };

  const getBranchRevenue = () => {
    const localOrders = getBranchOrders();
    const total = localOrders.reduce((sum, o) => sum + (Number(o.totalPrice || o.total || 0)), 0);
    return {
      total,
      franchiseShare: Math.round(total * 0.75), // 75% retained locally
      masterShare: Math.round(total * 0.25) // 25% share to Khammam HQ
    };
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Franchise Workspace...</p>
      </div>
    );
  }

  // LOGIN & SIGNUP VIEWS
  if (screen === 'login' || screen === 'signup') {
    const isSignup = screen === 'signup';
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-indigo-500 selection:text-white">
        {/* Glow Effects */}
        <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="my-auto max-w-md w-full mx-auto space-y-8 relative z-10">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Building2 className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight italic">
              Lokal Franchise Hub
            </h2>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase leading-none">
              {isSignup ? 'Register New Territory' : 'Authorized Area Charter Admin Workspace'}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/5 p-6 rounded-[2.5rem] shadow-2xl space-y-5">
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-[11px] text-rose-400 font-bold flex gap-2.5 items-start">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-snug">{authError}</p>
              </div>
            )}

            {!isOtpSent ? (
              <div className="space-y-4">
                {isSignup ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Proposed Branch Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Khammam North, Madhira Area"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">City / Region *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Khammam"
                          value={branchCity}
                          onChange={(e) => setBranchCity(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Area Passcode *</label>
                        <input
                          type="password"
                          required
                          placeholder="Passcode for team"
                          value={gatePasscode}
                          onChange={(e) => setGatePasscode(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Owner / Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tarun Bandi"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Franchise Territory *</label>
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
                      >
                        <option value="">-- Choose Assigned Branch --</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Franchise Gate Security Passcode *</label>
                      <input
                        type="password"
                        required
                        placeholder="Branch Secure Code"
                        value={enteredPasscode}
                        onChange={(e) => setEnteredPasscode(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number (OTP Verification) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit number"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-slate-950 border border-white/10 py-4 pl-12 pr-4 rounded-2xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {isSuperAdmin && !isSignup && selectedBranchId && (
                  <button
                    type="button"
                    onClick={async () => {
                      const branch = branches.find(b => b.id === selectedBranchId);
                      if (branch) {
                        setActiveBranch(branch);
                        setScreen('dashboard');
                        localStorage.setItem('franchise_branch_id', branch.id);
                        localStorage.setItem('franchise_admin_phone', branch.adminPhone || '9999999999');
                      }
                    }}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg mb-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950 animate-pulse" />
                    Master Admin Direct Login
                  </button>
                )}

                <button
                  disabled={isSendingOtp || (isSignup ? (!branchName || !adminName) : !selectedBranchId) || adminPhone.length !== 10}
                  onClick={() => handleSendOtp(isSignup)}
                  className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      Send Secure Access OTP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-5 text-center">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Verify Secure OTP Code</label>
                  <div className="flex gap-2 justify-center">
                    {enteredOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-12 h-14 bg-slate-950 border border-white/10 rounded-xl text-center text-lg font-black text-indigo-400 outline-none focus:border-indigo-500 transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* Audit notification fallback code helper */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-2xl text-[9px] text-indigo-300 font-mono tracking-tight leading-relaxed max-w-xs mx-auto">
                  ⚡ Dev OTP Fallback: Enter code <span className="text-white font-bold bg-indigo-600 px-1.5 py-0.5 rounded">1234</span> or look up dynamic code in Admin Audit Logs.
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-1 pt-2">
                  <button
                    disabled={resendTimer > 0 || isSendingOtp}
                    onClick={() => handleSendOtp(isSignup)}
                    className="text-slate-400 hover:text-indigo-400 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Resend Code
                  </button>
                  {resendTimer > 0 && (
                    <span className="font-mono text-slate-500">00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setIsOtpSent(false);
                      setEnteredOtp(['', '', '', '']);
                    }}
                    className="flex-1 py-4 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all"
                  >
                    Back
                  </button>
                  <button
                    disabled={enteredOtp.some(d => d === '') || isVerifyingOtp}
                    onClick={() => handleVerifyOtp(isSignup)}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      'Verify & Login'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setScreen(isSignup ? 'login' : 'signup');
                setAuthError(null);
                setIsOtpSent(false);
                setEnteredOtp(['', '', '', '']);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {isSignup ? 'Already own a Franchise? Log In' : 'Apply / Register New Franchise Area'}
            </button>
          </div>
        </div>

        <p className="text-center text-[8px] font-black text-slate-700 uppercase tracking-widest mt-8">
          Lokal Bandi Multi-Services &bull; Regional Administrative Network
        </p>
      </div>
    );
  }

  // CORE DASHBOARD WORKSPACE
  const branchOrders = getBranchOrders();
  const revenue = getBranchRevenue();

  return (
    <div className="h-screen w-full bg-slate-950 text-white overflow-hidden flex flex-col justify-between font-sans relative selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <header className="bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black uppercase tracking-tight italic">{activeBranch.name} Area</h1>
              <span className="text-[7.5px] font-black bg-indigo-600 border border-indigo-500/30 px-1.5 py-0.5 rounded-full text-indigo-100 uppercase tracking-widest">
                Active Franchise
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Manager: {activeBranch.adminName} ({activeBranch.city})
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-white/5 hover:bg-rose-950/20 hover:text-rose-400 border border-white/5 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* DASHBOARD SWITCHER TABS */}
      <div className="flex bg-slate-900 border-b border-white/5 gap-1 p-1 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'categories' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'members' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Area Members ({vendors.length + riders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'applications' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Applications</span>
          {applications.filter(a => a.status === 'Pending').length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'orders' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
          <span>Local Orders ({getBranchOrders().length})</span>
          {getBranchOrders().filter(o => o.status === 'Pending').length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('marriage')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'marriage' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Marriage ({marriageProfiles.length})</span>
          {marriageProfiles.filter(p => !p.isApproved).length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('real_estate')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'real_estate' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <Home className="w-3.5 h-3.5 text-sky-400" />
          <span>Real Estate ({properties.length})</span>
          {properties.filter(p => !p.isApproved).length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('hospital')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'hospital' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hospital OPs ({hospitalBookings.length})</span>
          {hospitalBookings.filter(b => b.status === 'pending' || b.status === 'Pending').length > 0 && (
            <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* WORKSPACE VIEWPORT */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* VIEW 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Merchants</span>
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span className="text-xl font-black">{vendors.length}</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Riders</span>
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span className="text-xl font-black">{riders.length}</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Regional Deliveries</span>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  <span className="text-xl font-black">{branchOrders.length}</span>
                </div>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-500/10 p-5 rounded-3xl space-y-2">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Total Area Revenue</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-indigo-300">₹{revenue.total}</span>
                </div>
              </div>
            </div>

            {/* REVENUE SPLIT ACCORD */}
            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider">Franchise Profit Allocation Accord</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                    <span>Retained Local Earnings (75%)</span>
                    <span>₹{revenue.franchiseShare}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    This branch retains 75% of total platform fees directly to cover operation wages, local delivery fleets, and branch office rentals.
                  </p>
                </div>

                <div className="space-y-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-black text-yellow-500 uppercase tracking-wider">
                    <span>Master Admin HQ Share (25%)</span>
                    <span>₹{revenue.masterShare}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    25% is allocated automatically to Master Admin Tarun Bandi (Khammam HQ) for national brand advertisement, server maintenance, and technology stack licensing.
                  </p>
                </div>
              </div>
            </div>

            {/* ORDER ACCEPTANCE AND AUTO DISPATCH MANAGEMENT */}
            <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Order Acceptance Configuration</h3>
                </div>
                <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  (activeBranch?.orderAcceptanceMode || 'manual') === 'automatic' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {(activeBranch?.orderAcceptanceMode || 'manual') === 'automatic' ? '🤖 Automatic Mode' : '🎮 Manual Mode'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                    Acceptance Mode Selector
                  </h4>
                  <p className="text-[9px] text-slate-400 max-w-xl leading-normal">
                    In <strong>Automatic Mode</strong>, newly received customer orders are instantly marked as Accepted by the system. In <strong>Manual Mode</strong>, you must click and accept each incoming order manually in the Orders workspace.
                  </p>
                </div>
                <button
                  onClick={handleLocalToggleOrderAcceptanceMode}
                  className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
                    (activeBranch?.orderAcceptanceMode || 'manual') === 'automatic'
                      ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  {(activeBranch?.orderAcceptanceMode || 'manual') === 'automatic' ? 'Switch to Manual Accept' : 'Switch to Auto Accept'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CATEGORY MANAGER (EDIT & DELETE ALL CATEGORIES) */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Active Platform Directories</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Franchise administrators possess global edit and deletion rights</p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatForm({ id: '', name: '', icon: 'ShoppingBag', color: AVAILABLE_COLORS[0], image: '' });
                  setShowCatModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[9px] py-2.5 px-4 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-slate-900 border border-white/5 p-4.5 rounded-[1.8rem] flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-white tracking-tight">{cat.name}</h4>
                      <p className="text-[9px] font-mono text-slate-500 uppercase">ID: {cat.id}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCatForm({
                          id: cat.id || '',
                          name: cat.name || '',
                          icon: cat.icon || 'ShoppingBag',
                          color: cat.color || AVAILABLE_COLORS[0],
                          image: cat.image || ''
                        });
                        setShowCatModal(true);
                      }}
                      className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-white/5 text-indigo-400 border border-white/5 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="w-8 h-8 rounded-xl bg-slate-950 hover:bg-rose-950/30 text-rose-400 border border-white/5 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: MEMBERS CONTROL (REGIONAL AREA VENDORS & RIDERS) */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Assigned Area Members</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Merchants & Riders registered under this charter branch code</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMemberType('vendor');
                    setMemberForm({ ...memberForm, city: activeBranch.city });
                    setShowMemberModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[8.5px] py-2 px-3 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + Merchant
                </button>
                <button
                  onClick={() => {
                    setMemberType('rider');
                    setMemberForm({ ...memberForm, city: activeBranch.city });
                    setShowMemberModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[8.5px] py-2 px-3 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  + Rider
                </button>
              </div>
            </div>

            {/* MERCHANT LIST */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Store className="w-4 h-4 text-indigo-400" />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-300">Merchants & Vendors ({vendors.length})</h4>
              </div>

              {vendors.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No merchants currently assigned to this branch.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendors.map((v) => (
                    <div key={v.id} className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black uppercase tracking-tight">{v.storeName || v.fullName}</h5>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                            v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500 border border-white/5'
                          }`}>
                            {v.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Owner: {v.fullName}</p>
                        <p className="text-[9px] font-mono text-slate-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> +91 {v.phone}</p>
                      </div>

                      <div className="flex gap-1.5 items-center">
                        {v.status !== 'Active' ? (
                          <button
                            onClick={() => handleLocalUpdateVendorVerification(v.id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLocalUpdateVendorVerification(v.id, false)}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMember('vendor', v.id)}
                          className="w-7 h-7 bg-slate-950 hover:bg-rose-950/30 text-rose-400 border border-white/5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIDER LIST */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-300">Delivery Riders & Fleet ({riders.length})</h4>
              </div>

              {riders.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No delivery riders currently assigned to this branch.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riders.map((r) => (
                    <div key={r.id} className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black uppercase tracking-tight">{r.fullName}</h5>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                            r.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-500 border border-white/5'
                          }`}>
                            {r.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vehicle: {r.vehicleType || 'Bike'}</p>
                        <p className="text-[9px] font-mono text-slate-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> +91 {r.phone}</p>
                      </div>

                      <div className="flex gap-1.5 items-center">
                        {r.status !== 'Active' ? (
                          <button
                            onClick={() => handleLocalUpdateRiderVerification(r.id, true)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLocalUpdateRiderVerification(r.id, false)}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMember('rider', r.id)}
                          className="w-7 h-7 bg-slate-950 hover:bg-rose-950/30 text-rose-400 border border-white/5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Merchant & Rider Partner Applications</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Approve or reject regional applications directly under local jurisdiction</p>
            </div>

            {applications.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-[2rem] border border-white/5">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No applications submitted in this franchise area.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[7.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          app.type === 'Vendor' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {app.type} Application
                        </span>
                        <span className={`text-[7.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          app.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : app.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-black uppercase tracking-tight">{app.fullName}</h4>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-medium text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 {app.phone}</span>
                        {app.storeName && <span>Store: {app.storeName}</span>}
                        {app.vehicleType && <span>Vehicle: {app.vehicleType}</span>}
                      </div>

                      {app.rejectionReason && app.status === 'Rejected' && (
                        <p className="text-[9px] text-rose-400 italic bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl">
                          Rejection Reason: "{app.rejectionReason}"
                        </p>
                      )}
                    </div>

                    {app.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectApplication(app.id)}
                          className="bg-rose-950/30 text-rose-400 hover:bg-rose-900/20 border border-rose-900/30 font-black uppercase tracking-widest text-[8.5px] py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveApplication(app)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[8.5px] py-2.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer"
                        >
                          Approve Partner
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: LOCAL ORDERS */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            {/* Orders Stream: 5 cols */}
            <div className="lg:col-span-5 bg-slate-900 border border-white/5 p-5 rounded-[2.5rem] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Local Orders Queue</h3>
                <span className="px-2 py-0.5 bg-slate-950 text-[8.5px] font-mono text-amber-400 rounded border border-white/5 uppercase">
                  {getBranchOrders().length} Orders
                </span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {getBranchOrders().length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No active orders in this area.</p>
                  </div>
                ) : (
                  getBranchOrders().map((ord) => {
                    const isSelected = selectedOrderId === ord.id;
                    return (
                      <button
                        key={ord.id}
                        onClick={() => setSelectedOrderId(ord.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white' 
                            : 'bg-slate-950/60 border-white/5 hover:bg-slate-950/95 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-black text-slate-400 uppercase">
                            #{ord.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                            ord.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' :
                            ord.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                            ord.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{ord.customerName || ord.userName || 'Guest User'}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">{ord.vendorName || 'General Hub'}</p>
                          </div>
                          <p className="text-xs font-black text-indigo-300">₹{ord.total || ord.totalPrice || 0}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Order Details: 7 cols */}
            <div className="lg:col-span-7">
              {(() => {
                const activeOrd = getBranchOrders().find(o => o.id === selectedOrderId);
                if (!activeOrd) {
                  return (
                    <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] text-center min-h-[200px] flex flex-col items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-slate-650 mb-2 animate-pulse" />
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Order Telemetry Standby</h3>
                      <p className="text-[9.5px] text-slate-500 max-w-xs mx-auto leading-normal font-semibold mt-1">
                        Select an order from the list stream to view real-time operations, manage dispatching, or edit item lists.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div>
                        <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Active Branch Workspace
                        </span>
                        <h3 className="text-base font-black uppercase text-white mt-2">
                          Order #{activeOrd.id.slice(0, 8).toUpperCase()}
                        </h3>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Transaction Value</span>
                        <p className="text-lg font-black text-emerald-400">₹{activeOrd.total || activeOrd.totalPrice || 0}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Merchant / Restaurant</h4>
                        <p className="text-xs font-bold text-white">{activeOrd.vendorName || 'Central Hub'}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{activeOrd.vendorAddress || 'Main branch'}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer Delivery Address</h4>
                        <p className="text-xs font-bold text-white">{activeOrd.customerName || activeOrd.userName || 'Anonymous Customer'}</p>
                        <p className="text-[10px] text-slate-300 font-medium">{activeOrd.address || 'Standard Handover'}</p>
                        {(activeOrd.phone || activeOrd.userPhone) && (
                          <p className="text-[10px] font-mono text-slate-500 mt-1">📞 {activeOrd.phone || activeOrd.userPhone}</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Line Items</h4>
                        <button
                          onClick={() => {
                            setEditingOrder(JSON.parse(JSON.stringify(activeOrd)));
                            setShowOrderModal(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          ✏️ Edit Order Details
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {(activeOrd.orderItems || []).length === 0 ? (
                          <div className="text-[11px] text-slate-500 italic">No direct line items found.</div>
                        ) : (
                          (activeOrd.orderItems || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white">
                                {item.name} <span className="text-indigo-400 text-[10px] ml-1">x{item.quantity}</span>
                              </span>
                              <span className="font-bold text-slate-400">₹{(item.price || 0) * (item.quantity || 1)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeOrd.status === 'Pending' && (
                        <button
                          onClick={() => handleLocalAcceptOrder(activeOrd.id)}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                        >
                          Accept & Approve Order
                        </button>
                      )}

                      {activeOrd.status !== 'Cancelled' && activeOrd.status !== 'Delivered' && (
                        <button
                          onClick={() => handleLocalCancelOrder(activeOrd.id)}
                          className="px-4 py-3 bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Cancel Order
                        </button>
                      )}

                      <div className="w-full flex items-center gap-2 mt-2 bg-slate-950 p-3 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">Status Override:</span>
                        <div className="flex gap-1 flex-wrap">
                          {['Accepted', 'Preparing', 'OutForDelivery', 'Delivered'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleLocalUpdateOrderStatus(activeOrd.id, st)}
                              className={`px-2.5 py-1.5 rounded-lg text-[8.5px] font-black uppercase transition-all cursor-pointer ${activeOrd.status === st ? 'bg-indigo-600 text-white' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'}`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* VIEW 6: MARRIAGE BUREAU */}
        {activeTab === 'marriage' && (
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Marriage Bureau Profile Registry</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Approve newly submitted profiles before they become public.
              </p>
            </div>

            {marriageProfiles.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-[2rem] border border-white/5">
                <Heart className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No marriage profiles found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marriageProfiles.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {p.image && (
                        <img src={p.image} className="w-14 h-14 object-cover rounded-xl border border-white/10" referrerPolicy="no-referrer" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black uppercase tracking-tight text-white">{p.fullName || 'Anonymous'}</h4>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                            p.isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {p.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-[10px] text-indigo-400 font-bold">{p.religion} • {p.caste}</p>
                        <p className="text-[9.5px] text-slate-400 font-medium">Age/Height: {p.age} yrs / {p.height}</p>
                        <p className="text-[9.5px] text-slate-400 font-medium">Education: {p.education} • {p.occupation}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!p.isApproved ? (
                        <button
                          onClick={() => handleLocalUpdateMarriageProfileStatus(p.id, true)}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                        >
                          Approve Profile
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLocalUpdateMarriageProfileStatus(p.id, false)}
                          className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                        >
                          Suspend Profile
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: REAL ESTATE */}
        {activeTab === 'real_estate' && (
          <div className="space-y-4 text-left">
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Real Estate Listing Catalogs</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Review and approve local property listings.
              </p>
            </div>

            {properties.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 rounded-[2rem] border border-white/5">
                <Home className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No property listings found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                          p.isApproved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {p.isApproved ? 'Approved' : 'Pending'}
                        </span>
                        <span className="text-emerald-400 font-black text-xs">₹{p.price}</span>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-white">{p.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-2">{p.description}</p>
                      <p className="text-[9.5px] text-indigo-400 font-mono">📍 {p.location?.area || 'Khammam'}</p>
                    </div>

                    <div className="flex gap-2">
                      {!p.isApproved ? (
                        <button
                          onClick={() => handleLocalUpdatePropertyStatus(p.id, true)}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                        >
                          Approve Listing
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLocalUpdatePropertyStatus(p.id, false)}
                          className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                        >
                          Suspend Listing
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 8: HOSPITAL OP BOOKINGS */}
        {activeTab === 'hospital' && (
          <div className="space-y-8 text-left">
            {/* REGISTER LOCAL CLINIC / HOSPITAL OFFICE FORM */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] space-y-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-sm font-black uppercase tracking-tight">Register & Verify Local Clinical Branch Office</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Add and instantly verify local hospitals/clinics within your regional territory.
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = form.hospitalName.value.trim();
                const price = Number(form.hospitalPrice.value || 0);
                const desc = form.hospitalDesc.value.trim();
                const phone = form.hospitalPhone.value.trim();
                if (!name || !price) {
                  alert('Please enter a valid Hospital Name and OP Price.');
                  return;
                }
                await handleSaveLocalHospital(name, {
                  opPrice: price,
                  description: desc,
                  phone: phone,
                  branchId: activeBranch.id,
                  isApproved: true, // auto-verified since added by local admin
                  updatedAt: new Date().toISOString()
                });
                form.reset();
              }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Hospital Name</label>
                  <input name="hospitalName" type="text" placeholder="e.g. Apollo Clinic" required className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">OP Registration Fee (₹)</label>
                  <input name="hospitalPrice" type="number" placeholder="e.g. 150" required className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Contact / Doctor Details & Phone</label>
                  <div className="flex gap-2">
                    <input name="hospitalDesc" type="text" placeholder="e.g. Gen Physician, Dr. Ravi" className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white" />
                    <input name="hospitalPhone" type="text" placeholder="Phone Number" className="w-1/3 bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white" />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-widest px-4 rounded-xl cursor-pointer">Register</button>
                  </div>
                </div>
              </form>
            </div>

            {/* LOCAL REGISTRY LIST & VERIFICATION */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-300">Local Clinic registries ({
                Object.keys(hospitalPrices).filter(k => hospitalPrices[k].branchId === activeBranch.id).length
              })</h4>

              {Object.keys(hospitalPrices).filter(k => hospitalPrices[k].branchId === activeBranch.id).length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No clinical branch offices registered in this branch territory yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(hospitalPrices).filter(k => hospitalPrices[k].branchId === activeBranch.id).map((name) => {
                    const h = hospitalPrices[name];
                    return (
                      <div key={name} className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black uppercase tracking-tight text-white">{name}</h5>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                              h.isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {h.isApproved ? 'Verified/Approved' : 'Pending Verification'}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest">OP Fee: <span className="font-mono text-white">₹{h.opPrice}</span></p>
                          <p className="text-[9px] text-slate-400 leading-normal italic">{h.description || 'No Description listed'}</p>
                          {h.phone && <p className="text-[9px] text-slate-500 font-mono">☎ {h.phone}</p>}
                        </div>

                        <div className="flex gap-2">
                          {!h.isApproved ? (
                            <button
                              onClick={() => handleLocalUpdateHospitalOfficeVerification(name, true)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Verify
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLocalUpdateHospitalOfficeVerification(name, false)}
                              className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-white/5 pt-6 space-y-3">
              <h3 className="text-sm font-black uppercase tracking-tight">Hospital Outpatient Booking Queue</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Approve and coordinate newly submitted hospital appointment bookings.
              </p>

              {hospitalBookings.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/60 rounded-[2rem] border border-white/5">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No hospital OP bookings found in this branch.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hospitalBookings.map((b) => (
                    <div key={b.id} className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] flex flex-col justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                            b.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' :
                            b.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {b.status}
                          </span>
                          <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-full">{b.hospital || 'Hospital'}</span>
                        </div>
                        <h4 className="text-xs font-black text-white uppercase tracking-tight">{b.patientName || 'Anonymous'}</h4>
                        <p className="text-[10px] text-slate-400">Slot: {b.slot || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400">Age/Gender: {b.age || 'N/A'} yrs / {b.gender || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Phone: {b.phone}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLocalUpdateHospitalBookingStatus(b.id, 'Approved')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                        >
                          Approve OP
                        </button>
                        <button
                          onClick={() => handleLocalUpdateHospitalBookingStatus(b.id, 'Rejected')}
                          className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER STATS */}
      <footer className="bg-slate-900 px-6 py-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
          Lokal Franchise Console &bull; secure branch tunnel
        </p>
        <p className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider">
          HQ Node: Tarun Bandi HQ &bull; 25% Auto-Allocation Active
        </p>
      </footer>

      {/* CATEGORY MODAL */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-[10001] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] max-w-sm w-full space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider">{editingCategory ? 'Edit platform category' : 'Create new category'}</h4>
                <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Category Unique ID (slug)</label>
                  <input
                    type="text"
                    disabled={!!editingCategory}
                    placeholder="e.g. fresh_produce"
                    required
                    value={catForm.id}
                    onChange={(e) => setCatForm({ ...catForm, id: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Vegetables"
                    required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Banner Image URL</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={catForm.image}
                    onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Icon Selection</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {AVAILABLE_ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, icon: ic })}
                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold ${catForm.icon === ic ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-white/5 hover:bg-slate-900'}`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCatModal(false)}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/40"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MEMBER ONBOARDING MODAL */}
      <AnimatePresence>
        {showMemberModal && (
          <div className="fixed inset-0 z-[10001] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] max-w-sm w-full space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider">Direct Onboard Area {memberType}</h4>
                <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Registered Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={memberForm.fullName}
                    onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {memberType === 'vendor' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Store / Business Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Laxmi Kirana & General Store"
                        value={memberForm.storeName}
                        onChange={(e) => setMemberForm({ ...memberForm, storeName: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Pincode</label>
                      <input
                        type="text"
                        placeholder="e.g. 507001"
                        value={memberForm.pincode}
                        onChange={(e) => setMemberForm({ ...memberForm, pincode: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Type</label>
                    <select
                      value={memberForm.vehicleType}
                      onChange={(e) => setMemberForm({ ...memberForm, vehicleType: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                    >
                      <option value="Bike">Two-Wheeler (Motorcycle)</option>
                      <option value="Auto">Three-Wheeler (Auto-Rikshaw)</option>
                      <option value="Cycle">Bicycle (Eco Delivery)</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/40"
                  >
                    Onboard Area Partner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ORDER DETAILS MODAL */}
      <AnimatePresence>
        {showOrderModal && editingOrder && (
          <div className="fixed inset-0 z-[10001] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-[2.5rem] max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider">✏️ Edit Order Details</h4>
                <button onClick={() => { setShowOrderModal(false); setEditingOrder(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLocalUpdateOrderDetails} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.customerName || editingOrder.userName || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value, userName: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editingOrder.phone || editingOrder.userPhone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value, userPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.address || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingOrder.total || editingOrder.totalPrice || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, total: Number(e.target.value), totalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Items Editor */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Edit Order Items</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...(editingOrder.orderItems || [])];
                        newItems.push({ id: Date.now().toString(), name: 'New Item', price: 100, quantity: 1 });
                        setEditingOrder({ ...editingOrder, orderItems: newItems });
                      }}
                      className="px-2 py-1 bg-indigo-600/25 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded text-[8px] font-black uppercase tracking-wider"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {(editingOrder.orderItems || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-white/5 flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Item Name"
                          value={item.name || ''}
                          onChange={(e) => {
                            const newItems = [...editingOrder.orderItems];
                            newItems[idx].name = e.target.value;
                            setEditingOrder({ ...editingOrder, orderItems: newItems });
                          }}
                          className="flex-1 bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-[10.5px] font-bold text-white outline-none"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Price"
                          value={item.price || 0}
                          onChange={(e) => {
                            const newItems = [...editingOrder.orderItems];
                            newItems[idx].price = Number(e.target.value);
                            setEditingOrder({ ...editingOrder, orderItems: newItems });
                          }}
                          className="w-14 bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-[10.5px] font-bold text-white outline-none"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Qty"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const newItems = [...editingOrder.orderItems];
                            newItems[idx].quantity = Number(e.target.value);
                            setEditingOrder({ ...editingOrder, orderItems: newItems });
                          }}
                          className="w-10 bg-slate-900 border border-white/10 px-2 py-1.5 rounded text-[10.5px] font-bold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = (editingOrder.orderItems || []).filter((_: any, i: number) => i !== idx);
                            setEditingOrder({ ...editingOrder, orderItems: newItems });
                          }}
                          className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => { setShowOrderModal(false); setEditingOrder(null); }}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/40"
                  >
                    Save Changes
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
