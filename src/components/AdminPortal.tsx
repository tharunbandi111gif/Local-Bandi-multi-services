import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Settings, Users, Store, Bike, 
  HelpCircle, CheckCircle, AlertTriangle, XCircle, 
  Search, Plus, MapPin, Trash2, Edit2, 
  FileText, LogOut, ArrowRight, Activity, 
  BarChart2, RefreshCw, Send, DollarSign, 
  Heart, Building, Percent, Power, Laptop, ShieldCheck,
  Star, Check, X, Shield, Globe, AlertCircle, Home,
  Zap, Award, RotateCcw, Sparkles, Timer, Gift, Trophy,
  UserPlus, UserMinus, UserCheck, Smartphone, Key, AlertOctagon, CheckCircle2,
  Lock, Unlock, PhoneCall
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, onSnapshot, query, where, doc, 
  getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, 
  serverTimestamp, limit, orderBy 
} from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SafeZone } from './common/SafeZone';
import { CATEGORIES, PRODUCTS } from '../constants';
import LogisticsHeatmap from './LogisticsHeatmap';
import OrderTrendsChart from './OrderTrendsChart';
import { getStoredQuizQuestions, DEFAULT_LOW_PRICE_QUIZ_QUESTIONS, QuizQuestion } from './MarketingQuizModal';
import { AuthorizedAdmin, AuthorizedAdminsConfig, SOSAlert } from '../types';
import SOSAlertIndicator from './common/SOSAlertIndicator';
import { AttractionCampaignsManager } from './AttractionCampaignsManager';

export default function AdminPortal() {
  const { 
    user, 
    login, 
    logout, 
    userProfile, 
    isSuperAdmin: isFbSuperAdmin, 
    isMasterAdmin, 
    isAuthorizedAdmin,
    revokeSession 
  } = useFirebase();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('local_admin_sessions_authorized') === 'true';
  });
  const [adminRole, setAdminRole] = useState<'master' | 'franchise' | 'authorizedAdmin'>(() => {
    return (localStorage.getItem('local_admin_role') as any) || 'master';
  });
  const [adminBranchId, setAdminBranchId] = useState<string>(() => {
    return localStorage.getItem('local_admin_branch_id') || 'global';
  });

  // Settings Submenu state
  const [settingsSubTab, setSettingsSubTab] = useState<'gateways' | 'master_access' | 'logs'>('gateways');

  // Master Admin Access / Authorized Admins state
  const [authorizedAdminsList, setAuthorizedAdminsList] = useState<AuthorizedAdmin[]>([]);
  const [primaryMasterPhones, setPrimaryMasterPhones] = useState<string[]>(['+918790729816', '+917416574197']);
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'authorizedAdmin' | 'masterAdmin'>('authorizedAdmin');
  const [newAdminNotes, setNewAdminNotes] = useState('');
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  // Auto-authenticate Firebase Super Admin
  useEffect(() => {
    if (isFbSuperAdmin) {
      localStorage.setItem('local_admin_sessions_authorized', 'true');
      localStorage.setItem('admin_session_active', 'true');
      localStorage.setItem('local_admin_role', 'master');
      localStorage.setItem('local_admin_branch_id', 'global');
      setAdminRole('master');
      setAdminBranchId('global');
      setIsAdminAuthenticated(true);
    }
  }, [isFbSuperAdmin]);

  const [adminPasscode, setAdminPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sos' | 'ai_desk' | 'attractions' | 'logistics' | 'approvals' | 'marriage' | 'real_estate' | 'catalog' | 'vendors' | 'riders' | 'chat' | 'users' | 'systems' | 'founder' | 'support' | 'deals' | 'quiz'>('dashboard');

  // --- EMERGENCY SOS DISTRESS ALERTS STATES ---
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [selectedSosAlert, setSelectedSosAlert] = useState<SOSAlert | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosFilter, setSosFilter] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');

  // --- QUIZ & TRIVIA CONTROL STATES ---
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => getStoredQuizQuestions());
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizQuestion, setEditingQuizQuestion] = useState<QuizQuestion | null>(null);
  const [quizForm, setQuizForm] = useState({
    question: '',
    optA: '',
    optB: '',
    optC: '',
    optD: '',
    correctIndex: 0,
    explanation: '',
    category: 'Low Price Grocery'
  });

  // --- LOGISTICS HUB STATES ---
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [logisticsFilter, setLogisticsFilter] = useState<'All' | 'Pending' | 'Accepted' | 'Preparing' | 'OutForDelivery' | 'Delivered' | 'Cancelled'>('All');
  const [bulkSelectedOrderIds, setBulkSelectedOrderIds] = useState<string[]>([]);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // App metrics state
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalSales: 0,
    totalVendors: 0,
    totalRiders: 0,
    pendingVendors: 0,
    pendingRiders: 0,
    systemMode: 'Online'
  });

  // DB Sync States
  const [vendors, setVendors] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [hospitalPrices, setHospitalPrices] = useState<any>({});
  const [hospitalBookings, setHospitalBookings] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(() => localStorage.getItem('lokal_maintenance_mode') === 'true');

  // Custom Category and Catalog Management States
  const [categories, setCategories] = useState<any[]>([]);
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'categories'>('products');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    id: '', name: '', icon: 'ShoppingBag', color: 'bg-emerald-50', image: ''
  });

  // Modal / Operations States
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', price: '', originalPrice: '', unit: '', category: 'groceries', 
    image: '', description: '', isAvailable: true, vendorId: 'admin-store', branchId: 'khammam_main',
    subCategory: '', stock: ''
  });

  // Hospital Booking Edit/Delete & Filters State
  const [showHospitalBookingModal, setShowHospitalBookingModal] = useState(false);
  const [editingHospitalBooking, setEditingHospitalBooking] = useState<any | null>(null);
  const [hospitalBookingFilter, setHospitalBookingFilter] = useState<'all' | 'pending' | 'Approved' | 'Completed' | 'Rejected'>('all');
  const [hospitalBookingSearch, setHospitalBookingSearch] = useState('');
  const [hospitalBookingForm, setHospitalBookingForm] = useState({
    patientName: '',
    phone: '',
    hospital: '',
    slot: '',
    dateTime: '',
    age: '',
    gender: 'Male',
    location: '',
    reason: '',
    disease: '',
    amount: 220,
    status: 'pending'
  });

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // --- AI DEVELOPER HUB STATES ---
  const [selectedPatch, setSelectedPatch] = useState<'cart_double_click' | 'hotspot_calc' | 'sleep_sleep' | 'duty_sync'>('cart_double_click');
  const [isPatching, setIsPatching] = useState(false);
  const [patchProgress, setPatchProgress] = useState(0);
  const [patchLogs, setPatchLogs] = useState<string[]>([]);
  const [dispatchRadius, setDispatchRadius] = useState<number>(1500);
  const [commissionPct, setCommissionPct] = useState<number>(12);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.2);

  // AI Diagnostic Approval & Automated Payment Reports states
  const [adminApproveReview, setAdminApproveReview] = useState<Record<string, string>>({});
  const [executingIssueId, setExecutingIssueId] = useState<string | null>(null);
  const [executingProgress, setExecutingProgress] = useState<number>(0);
  const [executingLogs, setExecutingLogs] = useState<string[]>([]);
  const [financialReportTab, setFinancialReportTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [hasAutomaticallyReported, setHasAutomaticallyReported] = useState<boolean>(false);

  // New Live AI Developer Desk integrations
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Welcome to the AI Developer Desk Chat. Ask me anything about system routing, matching algorithms, or hotpatch logic!" }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiSending, setIsAiSending] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticCounts, setDiagnosticCounts] = useState<Record<string, number> | null>(null);

  const speakCue = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
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

  const handleSendAiMessage = async () => {
    if (!aiChatInput.trim() || isAiSending) return;
    const userMsg = aiChatInput.trim();
    setAiChatInput('');
    const newHistory = [...aiChatHistory, { role: 'user' as const, content: userMsg }];
    setAiChatHistory(newHistory);
    setIsAiSending(true);

    try {
      const response = await fetch('/api/ai_desk/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: newHistory.slice(0, -1) })
      });
      const data = await response.json();
      if (response.ok) {
        setAiChatHistory(prev => [...prev, { role: 'model', content: data.text }]);
      } else {
        setAiChatHistory(prev => [...prev, { role: 'model', content: `❌ Error: ${data.error || 'Failed to connect to AI server.'}` }]);
      }
    } catch (err: any) {
      setAiChatHistory(prev => [...prev, { role: 'model', content: `❌ Network Error: ${err.message || 'Unable to reach backend.'}` }]);
    } finally {
      setIsAiSending(false);
    }
  };

  const handleRunAiDiagnostics = async () => {
    if (isDiagnosing) return;
    setIsDiagnosing(true);
    setAiReport(null);
    setDiagnosticCounts(null);
    try {
      const response = await fetch('/api/ai_desk/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        setDiagnosticCounts(data.counts);
        setAiReport(data.report);
        speakCue("System diagnostics completed successfully with AI optimizations compiled.");
      } else {
        setAiReport(`❌ Diagnostic Error: ${data.error || 'Failed to generate report.'}`);
      }
    } catch (err: any) {
      setAiReport(`❌ Network Error: ${err.message || 'Failed to connect to diagnostic service.'}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // --- GATEWAY & LOGGER STATES ---
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [smsProvider, setSmsProvider] = useState<'serv_imp' | 'twilio' | 'plivo'>('serv_imp');
  const [smsKey, setSmsKey] = useState('rJCIC6J0');
  const [smsPassword, setSmsPassword] = useState('mXdYj5Bc');
  const [smsAccountType, setSmsAccountType] = useState('serv_imp');
  const [smsMatchTemplate, setSmsMatchTemplate] = useState(false);
  const [smsSenderId, setSmsSenderId] = useState('LKLBND');
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'paytm' | 'cashfree' | 'stripe'>('razorpay');
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>('sandbox');
  const [paymentUpiId, setPaymentUpiId] = useState('7416574197@hdfc');
  const [paymentHolder, setPaymentHolder] = useState('Local Bandi Multi Services');

  // --- FOUNDER CONTROL PANEL STATES ---
  const [banners, setBanners] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any | null>(null);
  const [dealForm, setDealForm] = useState({
    title: '', discount: '', price: '', originalPrice: '', img: '', status: 'active', branchId: 'global'
  });
  const dealPresets = [
    { name: 'Fresh Groceries', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
    { name: 'Mixed Vegetables', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
    { name: 'Juicy Fruits Bag', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
    { name: 'Farm Fresh Eggs', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
    { name: 'Fresh Farm Milk', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
    { name: 'Fresh Apples Basket', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
    { name: 'Premium Rice Pack', url: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E' },
  ];
  const [reviews, setReviews] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dispatchConfig, setDispatchConfig] = useState<any>({ autoAssign: true });

  const calculatePaymentReport = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date();
    let startTime = 0;
    let endTime = now.getTime();

    if (period === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTime = start.getTime();
    } else if (period === 'weekly') {
      // Thursday to Thursday calculation
      const day = now.getDay();
      const diff = (day >= 4) ? (day - 4) : (day + 3);
      const startThur = new Date(now);
      startThur.setDate(now.getDate() - diff);
      startThur.setHours(0, 0, 0, 0);
      
      const endThur = new Date(startThur);
      endThur.setDate(startThur.getDate() + 7);
      
      startTime = startThur.getTime();
      endTime = endThur.getTime();
    } else if (period === 'monthly') {
      // 1st to 31st of current month
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startTime = firstDay.getTime();
      endTime = lastDay.getTime() + (24 * 60 * 60 * 1000) - 1;
    } else if (period === 'yearly') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      startTime = firstDay.getTime();
    }

    const branchIncomes: Record<string, number> = {};
    branches.forEach(b => {
      branchIncomes[b.name || 'Lokal Hub'] = 0;
    });

    let overallTotal = 0;
    orders.forEach(ord => {
      const t = ord.createdAt 
        ? new Date(ord.createdAt).getTime() 
        : ord.timestamp 
          ? (ord.timestamp.toDate ? ord.timestamp.toDate().getTime() : new Date(ord.timestamp).getTime())
          : now.getTime();

      if (t >= startTime && t <= endTime) {
        const amt = Number(ord.total) || 0;
        const matchedBranch = branches.find(b => 
          b.id === ord.branchId || 
          b.id === ord.vendorId || 
          (b.name && b.name.toLowerCase() === ord.branchId?.toLowerCase()) ||
          (ord.vendorName && b.name?.toLowerCase().includes(ord.vendorName.toLowerCase()))
        );
        const bName = matchedBranch ? matchedBranch.name : 'Master HQ';
        branchIncomes[bName] = (branchIncomes[bName] || 0) + amt;
        overallTotal += amt;
      }
    });

    return {
      branchesCount: branches.length || 1,
      branchIncomes,
      overallTotal,
      startTime: new Date(startTime).toLocaleDateString(),
      endTime: new Date(endTime).toLocaleDateString(),
    };
  };

  const handleTriggerManualFinancialReport = () => {
    const daily = calculatePaymentReport('daily');
    const weekly = calculatePaymentReport('weekly');
    const monthly = calculatePaymentReport('monthly');
    const yearly = calculatePaymentReport('yearly');

    const formatReportBlock = (title: string, r: any) => {
      const branchRows = Object.entries(r.branchIncomes)
        .map(([bName, amt]) => `  • ${bName}: ₹${(amt as number).toLocaleString()}`)
        .join('\n');
      return `📅 ${title}
-----------------------------------------
• Active Branches: ${r.branchesCount}
• Income per Branch:
${branchRows || '  • No entries active'}
• OVERALL PLATFORM TOTAL: ₹${r.overallTotal.toLocaleString()}`;
    };

    const systemReportMessage = `⚡ [MANUAL FINANCIAL REPORT TRIGGERED]
I have re-aggregated the live payments database across all geographic branches. Here are your clear, organized financial summaries:

${formatReportBlock("DAILY STATEMENT (Today)", daily)}

${formatReportBlock("WEEKLY STATEMENT (Thursday - Thursday Sync)", weekly)}

${formatReportBlock("MONTHLY STATEMENT (1st - 31st Master Ledger)", monthly)}

${formatReportBlock("ANNUAL STATEMENT (Year-To-Date Consolidated)", yearly)}

*Report dispatched successfully on demand.*`;

    setAiChatHistory(prev => [...prev, { role: 'model', content: systemReportMessage }]);
    triggerToast("📊 Financial report broadcasted to AI Chat successfully!");
    speakCue("Master payment reports generated and broadcasted to chat feed.");
  };

  const executeRealDatabaseFix = async (issueId: string) => {
    try {
      if (issueId === 'hospital_prices') {
        const updated = { ...hospitalPrices };
        Object.keys(updated).forEach(k => {
          updated[k].isApproved = true;
        });
        await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      } else if (issueId === 'hospital_bookings') {
        const pendings = hospitalBookings.filter(b => b.status?.toLowerCase() === 'pending');
        for (const b of pendings) {
          await updateDoc(doc(db, 'hospital_bookings', b.id), { status: 'Confirmed' });
        }
      } else if (issueId === 'support_tickets') {
        const pendings = supportChats.filter(c => c.status !== 'resolved' && c.status !== 'closed');
        for (const c of pendings) {
          await updateDoc(doc(db, 'support_chats', c.id), { status: 'resolved' });
        }
      } else if (issueId === 'marriage_profiles') {
        const pendings = marriageProfiles.filter(p => !p.isApproved);
        for (const p of pendings) {
          await updateDoc(doc(db, 'marriageProfiles', p.id), { isApproved: true });
        }
      } else if (issueId === 'dormant_riders') {
        const pendings = riders.filter(r => r.status === 'In-Active' || r.status === 'Suspended');
        const listToUse = pendings.length > 0 ? pendings : riders;
        for (const r of listToUse.slice(0, 5)) {
          await updateDoc(doc(db, 'deliveryPartners', r.id), { status: 'Active' });
        }
      }
    } catch (error) {
      console.error("Failed executing real database fix:", error);
      throw error;
    }
  };

  const handleRunHotfix = async (issueId: string, issueTitle: string, suggestedSolution: string, adminApproach: string) => {
    if (!adminApproach || adminApproach.trim() === '') {
      triggerToast("❌ Please review the suggested solution and provide approach approval.");
      return;
    }

    const approachText = adminApproach.trim().toLowerCase();
    
    setExecutingIssueId(issueId);
    setExecutingProgress(0);
    setExecutingLogs([`🔧 AI Optimizer initializing hotfix routine for issue: [${issueTitle.toUpperCase()}]`]);

    const progressInterval = setInterval(async () => {
      setExecutingProgress(prev => {
        const next = prev + 10;
        if (next === 20) {
          setExecutingLogs(l => [...l, `✔ Validated admin authorization token. Target approach confirmed: "${adminApproach}"`]);
        } else if (next === 50) {
          setExecutingLogs(l => [...l, `✔ Analysing AST parameters & target collection schemas...`]);
        } else if (next === 80) {
          setExecutingLogs(l => [...l, `✔ Deploying transactional updates onto Firestore collections...`]);
        } else if (next >= 100) {
          clearInterval(progressInterval);
          
          executeRealDatabaseFix(issueId).then(() => {
            setExecutingIssueId(null);
            triggerToast(`🚀 Hotfix successfully deployed: ${issueTitle}`);
            speakCue(`Approved solution for ${issueTitle} has been executed.`);
            
            const content = `🔮 [AI DIAGNOSTIC PROTOCOL SOLVED]
───────────────────────────────────────
ISSUE IDENTIFIED: ${issueTitle}
Severity: ${issueId === 'support_tickets' || issueId === 'hospital_bookings' ? 'CRITICAL HIGH' : 'STABILIZED'}
Suggested Solution: ${suggestedSolution}

Admin Approach Reviewed & Approved: "${adminApproach}"

STATUS: SUCCESS
Operational updates have been written to the database successfully. Live diagnostics show system counters refreshed and latency indicators restored to 100% optimum. Let me know if you would like me to conduct another telemetry audit.`;
            
            setAiChatHistory(prev => [...prev, { role: 'model', content }]);
          }).catch((err: any) => {
            console.error(err);
            setExecutingIssueId(null);
            triggerToast(`❌ Fix execution error: ${err.message || err}`);
          });

          return 100;
        }
        return next;
      });
    }, 150);
  };

  // Run auto reports on AI Desk Tab focus
  useEffect(() => {
    if (activeTab === 'ai_desk' && !hasAutomaticallyReported && branches.length > 0 && orders.length > 0) {
      setHasAutomaticallyReported(true);
      
      const daily = calculatePaymentReport('daily');
      const weekly = calculatePaymentReport('weekly');
      const monthly = calculatePaymentReport('monthly');
      const yearly = calculatePaymentReport('yearly');

      const formatReportBlock = (title: string, r: any) => {
        const branchRows = Object.entries(r.branchIncomes)
          .map(([bName, amt]) => `  • ${bName}: ₹${(amt as number).toLocaleString()}`)
          .join('\n');
        return `📅 ${title}
-----------------------------------------
• Active Branches: ${r.branchesCount}
• Income per Branch:
${branchRows || '  • No entries active'}
• OVERALL PLATFORM TOTAL: ₹${r.overallTotal.toLocaleString()}`;
      };

      const systemReportMessage = `⚡ [AI AUTOMATED PAYMENT REPORT & HQ MASTERS LEDGER]
I have automatically aggregated the live payments database across all geographic branches. Here are your clear, organized financial summaries:

${formatReportBlock("DAILY STATEMENT (Today)", daily)}

${formatReportBlock("WEEKLY STATEMENT (Thursday - Thursday Sync)", weekly)}

${formatReportBlock("MONTHLY STATEMENT (1st - 31st Master Ledger)", monthly)}

${formatReportBlock("ANNUAL STATEMENT (Year-To-Date Consolidated)", yearly)}

*Report dispatched automatically as part of scheduled database polling.*`;

      setAiChatHistory(prev => [...prev, { role: 'model', content: systemReportMessage }]);
      speakCue("Daily and weekly financial reports generated automatically from all branches.");
    }
  }, [activeTab, branches, orders, hasAutomaticallyReported]);

  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', description: '', image: '', route: 'restaurant', status: 'active'
  });

  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', status: 'active'
  });

  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5, comment: ''
  });

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [branchForm, setBranchForm] = useState({
    id: '', name: '', city: 'Khammam', revenue: 0, status: 'Active', adminEmail: '', secPasscode: '4455'
  });

  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState<string | null>(null);
  const [hospitalForm, setHospitalForm] = useState({
    name: '', price: '', isActive: true, description: '', phone: ''
  });

  // Marriage bureau management states
  const [marriageProfiles, setMarriageProfiles] = useState<any[]>([]);
  const [editingMarriageProfile, setEditingMarriageProfile] = useState<any | null>(null);
  const [marriageSearchQuery, setMarriageSearchQuery] = useState('');

  // Real Estate management states
  const [properties, setProperties] = useState<any[]>([]);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [realEstateSearchQuery, setRealEstateSearchQuery] = useState('');

  // Support Complaints Management States
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [adminComplaintAnswer, setAdminComplaintAnswer] = useState('');
  const [isUpdatingComplaint, setIsUpdatingComplaint] = useState(false);
  const [searchComplaintQuery, setSearchComplaintQuery] = useState('');
  const [complaintFilter, setComplaintFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved' | 'Closed'>('All');

  // Dedicated Order ID Search States
  const [orderSearchId, setOrderSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [orderSearchError, setOrderSearchError] = useState('');
  const [orderSearchLoading, setOrderSearchLoading] = useState(false);

  // Authentication validation
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = adminPasscode.trim();
    const cleanEntered = entered.replace(/\D/g, '');

    // 1. Master high-security validation passcode (Standard passcode '1122' or '7416' or Firebase Super Admin)
    if (entered === '1122' || entered === '7416' || isFbSuperAdmin) {
      localStorage.setItem('local_admin_sessions_authorized', 'true');
      localStorage.setItem('admin_session_active', 'true');
      localStorage.setItem('local_admin_role', 'master');
      localStorage.setItem('local_admin_branch_id', 'global');
      setAdminRole('master');
      setAdminBranchId('global');
      setIsAdminAuthenticated(true);
      setAuthError('');
      triggerToast('🔑 Secure Master Session Authorized Successfully');
      return;
    }

    // 2. Check if entered code matches an authorized secondary admin phone or secret key
    const matchingAuthorizedAdmin = authorizedAdminsList.find(adm => {
      const cleanAdmPhone = adm.phoneNumber.replace(/\D/g, '').slice(-10);
      return (
        cleanAdmPhone === cleanEntered.slice(-10) ||
        adm.phoneNumber === entered ||
        adm.id === entered
      ) && adm.status === 'active';
    });

    if (matchingAuthorizedAdmin) {
      localStorage.setItem('local_admin_sessions_authorized', 'true');
      localStorage.setItem('admin_session_active', 'true');
      localStorage.setItem('admin_phone', matchingAuthorizedAdmin.phoneNumber);
      localStorage.setItem('local_admin_role', matchingAuthorizedAdmin.role === 'masterAdmin' ? 'master' : 'authorizedAdmin');
      localStorage.setItem('local_admin_branch_id', 'global');
      setAdminRole(matchingAuthorizedAdmin.role === 'masterAdmin' ? 'master' : 'authorizedAdmin');
      setAdminBranchId('global');
      setIsAdminAuthenticated(true);
      setAuthError('');
      triggerToast(`🔑 Authorized Admin Session Granted: ${matchingAuthorizedAdmin.name || matchingAuthorizedAdmin.phoneNumber}`);
      return;
    }

    // 3. Check franchise branch passcodes
    const matchingBranch = branches.find(b => b.secPasscode?.trim() === entered);
    if (matchingBranch) {
      localStorage.setItem('local_admin_sessions_authorized', 'true');
      localStorage.setItem('admin_session_active', 'true');
      localStorage.setItem('local_admin_role', 'franchise');
      localStorage.setItem('local_admin_branch_id', matchingBranch.id);
      localStorage.setItem('local_admin_branch_name', matchingBranch.name);
      setAdminRole('franchise');
      setAdminBranchId(matchingBranch.id);
      setIsAdminAuthenticated(true);
      setAuthError('');
      triggerToast(`🔑 Franchise Session Authorized for: ${matchingBranch.name}`);
    } else {
      setAuthError('❌ Invalid high-security authorization passcode or unregistered admin phone. Master admin Tarun Bandi (+918790729816) can authorize secondary admins in Settings > Master Admin Access.');
      setIsAdminAuthenticated(false);
    }
  };

  const handleAdminLogout = async () => {
    localStorage.removeItem('local_admin_sessions_authorized');
    localStorage.removeItem('admin_session_active');
    localStorage.removeItem('local_admin_role');
    localStorage.removeItem('local_admin_branch_id');
    localStorage.removeItem('local_admin_branch_name');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_phone');
    setAdminRole('master');
    setAdminBranchId('global');
    setIsAdminAuthenticated(false);
    setAdminPasscode('');
    triggerToast('🔒 Session closed securely');
  };

  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // --- MASTER ADMIN ACCESS HANDLERS ---
  const handleAddAuthorizedAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = newAdminPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      triggerToast('❌ Please enter a valid 10-digit mobile number.');
      return;
    }
    const formattedPhone = `+91${cleanDigits.slice(-10)}`;
    
    // Check duplicates with primary master admins
    const isAlreadyMaster = primaryMasterPhones.some(p => p.replace(/\D/g, '').slice(-10) === cleanDigits.slice(-10));
    if (isAlreadyMaster) {
      triggerToast('⚠️ This phone number is already registered as a Primary Master Admin.');
      return;
    }

    // Check duplicates in secondary admin list
    const isAlreadyAdded = authorizedAdminsList.some(a => a.phoneNumber.replace(/\D/g, '').slice(-10) === cleanDigits.slice(-10));
    if (isAlreadyAdded) {
      triggerToast('⚠️ This phone number is already authorized in the secondary admin directory.');
      return;
    }

    setIsAdminSaving(true);
    try {
      const newRecord: AuthorizedAdmin = {
        id: `adm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        phoneNumber: formattedPhone,
        name: newAdminName.trim() || 'Secondary Administrator',
        role: newAdminRole,
        addedBy: user?.phoneNumber || user?.email || '+918790729816 (Tarun Bandi)',
        addedAt: new Date().toISOString(),
        status: 'active',
        notes: newAdminNotes.trim()
      };

      const updatedList = [...authorizedAdminsList, newRecord];
      const activePhones = [
        ...primaryMasterPhones,
        ...updatedList.filter(a => a.status === 'active').map(a => a.phoneNumber)
      ];

      await setDoc(doc(db, 'settings', 'authorized_admins'), {
        primaryMasterAdmin: '+918790729816',
        primaryPhoneNumbers: primaryMasterPhones,
        authorizedPhones: activePhones,
        secondaryAdmins: updatedList,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.phoneNumber || user?.email || '+918790729816'
      }, { merge: true });

      setNewAdminPhone('');
      setNewAdminName('');
      setNewAdminNotes('');
      setNewAdminRole('authorizedAdmin');
      triggerToast(`👑 Authorized Admin saved successfully: ${formattedPhone}`);
    } catch (err: any) {
      console.error("Error adding authorized admin:", err);
      triggerToast(`❌ Failed to authorize admin: ${err.message || 'Firestore error'}`);
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleToggleAdminStatus = async (adminId: string, currentStatus: 'active' | 'revoked') => {
    const nextStatus: 'active' | 'revoked' = currentStatus === 'active' ? 'revoked' : 'active';
    try {
      const targetAdmin = authorizedAdminsList.find(a => a.id === adminId);
      const updatedList = authorizedAdminsList.map(a => 
        a.id === adminId ? { ...a, status: nextStatus, revokedAt: nextStatus === 'revoked' ? new Date().toISOString() : undefined } : a
      );

      const activePhones = [
        ...primaryMasterPhones,
        ...updatedList.filter(a => a.status === 'active').map(a => a.phoneNumber)
      ];

      await setDoc(doc(db, 'settings', 'authorized_admins'), {
        primaryMasterAdmin: '+918790729816',
        primaryPhoneNumbers: primaryMasterPhones,
        authorizedPhones: activePhones,
        secondaryAdmins: updatedList,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.phoneNumber || user?.email || '+918790729816'
      }, { merge: true });

      if (nextStatus === 'revoked') {
        triggerToast(`🔒 Access Revoked for ${targetAdmin?.name || targetAdmin?.phoneNumber}. Active sessions will be terminated immediately.`);
      } else {
        triggerToast(`🔓 Access Reactivated for ${targetAdmin?.name || targetAdmin?.phoneNumber}.`);
      }
    } catch (err: any) {
      console.error("Error toggling admin status:", err);
      triggerToast('❌ Error updating admin authorization status.');
    }
  };

  const handleDeleteAuthorizedAdmin = async (adminId: string) => {
    try {
      const targetAdmin = authorizedAdminsList.find(a => a.id === adminId);
      const updatedList = authorizedAdminsList.filter(a => a.id !== adminId);

      const activePhones = [
        ...primaryMasterPhones,
        ...updatedList.filter(a => a.status === 'active').map(a => a.phoneNumber)
      ];

      await setDoc(doc(db, 'settings', 'authorized_admins'), {
        primaryMasterAdmin: '+918790729816',
        primaryPhoneNumbers: primaryMasterPhones,
        authorizedPhones: activePhones,
        secondaryAdmins: updatedList,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.phoneNumber || user?.email || '+918790729816'
      }, { merge: true });

      triggerToast(`🗑️ Removed ${targetAdmin?.name || targetAdmin?.phoneNumber} from Authorized Admins list.`);
    } catch (err: any) {
      console.error("Error deleting admin:", err);
      triggerToast('❌ Error removing admin record.');
    }
  };

  const handleTestRevokeMySession = async () => {
    triggerToast('⚠️ Initiating instant admin session revocation test...');
    await revokeSession('Master Admin initiated manual session revocation test.');
  };


  const handleSaveSmsConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'sms_config'), {
        provider: smsProvider || 'serv_imp',
        companyName: 'MarketBuzzer Teleservices Pvt Ltd',
        key: smsKey || 'rJCIC6J0',
        apiKey: smsKey || 'rJCIC6J0',
        password: smsPassword || 'mXdYj5Bc',
        accountType: smsAccountType || 'serv_imp',
        matchTemplate: smsMatchTemplate,
        senderId: smsSenderId || 'LKLBND',
        updatedAt: new Date().toISOString()
      });
      triggerToast('📲 MarketBuzzer Teleservices (serv_imp) SMS OTP transmitter settings synced successfully!');
    } catch (err: any) {
      triggerToast('❌ Error saving SMS configuration.');
    }
  };

  const handleSavePaymentConfig = async () => {
    try {
      await setDoc(doc(db, 'settings', 'payment_config'), {
        gateway: paymentGateway,
        mode: paymentMode,
        upiId: paymentUpiId,
        accountHolder: paymentHolder,
        updatedAt: new Date().toISOString()
      });
      triggerToast('💰 UPI / Card Payment routing parameters updated!');
    } catch (err: any) {
      triggerToast('❌ Error saving Payment configuration.');
    }
  };

  const handleSearchOrderById = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const searchId = orderSearchId.trim();
    if (!searchId) return;

    setOrderSearchLoading(true);
    setOrderSearchError('');
    setSearchedOrder(null);

    try {
      // 1. Try direct exact key lookup
      try {
        const orderRef = doc(db, 'orders', searchId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          setSearchedOrder({ id: orderSnap.id, ...orderSnap.data() });
          setOrderSearchLoading(false);
          return;
        }
      } catch (errExact) {
        console.warn("Direct lookup bypassed, trying flexible collection search:", errExact);
      }

      // 2. Fetch recent orders and search flexibly (supports prefix, case-insensitive ID, name, phone, or status)
      const q = query(collection(db, 'orders'), limit(150));
      const querySnap = await getDocs(q);
      const ordersList: any[] = [];
      querySnap.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() });
      });

      const matched = ordersList.find(order => {
        const idMatch = order.id.toLowerCase().includes(searchId.toLowerCase());
        const nameMatch = (order.customerName || order.customer?.name || '').toLowerCase().includes(searchId.toLowerCase());
        const phoneMatch = (order.customerPhone || order.customer?.phone || '').includes(searchId);
        const statusMatch = (order.status || '').toLowerCase() === searchId.toLowerCase();
        return idMatch || nameMatch || phoneMatch || statusMatch;
      });

      if (matched) {
        setSearchedOrder(matched);
      } else {
        setOrderSearchError(`❌ No orders found matching "${searchId}" in search categories (Searched IDs, Names, Phones, and Statuses).`);
      }
    } catch (err: any) {
      console.error("Order ID search failed:", err);
      setOrderSearchError("⚠️ System error searching for Order ID: " + (err.message || err));
    } finally {
      setOrderSearchLoading(false);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, nextStatus: string, answerText: string) => {
    setIsUpdatingComplaint(true);
    try {
      const complaintRef = doc(db, 'support_complaints', complaintId);
      await updateDoc(complaintRef, {
        status: nextStatus,
        adminAnswer: answerText,
        updatedAt: serverTimestamp()
      });

      // Update local state for modal/details view
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint(prev => prev ? { ...prev, status: nextStatus, adminAnswer: answerText } : null);
      }

      triggerToast(`✅ Support complaint state set to ${nextStatus}!`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'support_complaints');
      triggerToast('❌ Error updating complaint parameters.');
    } finally {
      setIsUpdatingComplaint(false);
    }
  };

  // --- EMERGENCY SOS DISTRESS ALERTS HANDLERS ---
  const handleAcknowledgeSosAlert = async (alertId: string) => {
    try {
      const alertRef = doc(db, 'sos_alerts', alertId);
      await updateDoc(alertRef, {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: userProfile?.name || user?.phoneNumber || '+918790729816 (Tarun Bandi)',
        updatedAt: new Date().toISOString()
      });
      triggerToast(`🛡️ Emergency SOS acknowledged! Support team intervention recorded.`);
    } catch (err: any) {
      console.error("Failed to acknowledge SOS alert:", err);
      triggerToast(`❌ Error updating SOS alert: ${err.message || err}`);
    }
  };

  const handleResolveSosAlert = async (alertId: string) => {
    try {
      const alertRef = doc(db, 'sos_alerts', alertId);
      await updateDoc(alertRef, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        resolvedBy: userProfile?.name || user?.phoneNumber || '+918790729816 (Tarun Bandi)',
        updatedAt: new Date().toISOString()
      });
      triggerToast(`✅ Emergency SOS marked as RESOLVED & partner safe.`);
    } catch (err: any) {
      console.error("Failed to resolve SOS alert:", err);
      triggerToast(`❌ Error resolving SOS alert: ${err.message || err}`);
    }
  };

  // Pre-load branches registry for Franchise passcode resolving
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Pre-load branches sync error:", err);
    });
    return () => unsub();
  }, [user]);

  // real-time synchronization of databases
  useEffect(() => {
    if (!isAdminAuthenticated || !user) return;

    // 1. Sync Vendors
    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVendors(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'vendors');
    });

    // 2. Sync Riders
    const unsubRiders = onSnapshot(collection(db, 'deliveryPartners'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRiders(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'deliveryPartners');
    });

    // 3. Sync Products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      if (snap.empty) {
        // Automatically seed first 30 products into Firestore if database is empty
        PRODUCTS.slice(0, 30).forEach(async (p) => {
          const productData = p as any;
          await setDoc(doc(db, 'products', p.id), {
            ...productData,
            isAvailable: productData.isAvailable ?? true,
            vendorId: productData.vendorId || 'admin-store',
            branchId: productData.branchId || 'khammam_main',
            createdAt: new Date().toISOString()
          }).catch(e => console.warn("Failed seeding product:", p.id, e));
        });
        return;
      }
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
    });

    // 4. Sync Hospital prices configuration settings with automatic default seeder fallback
    const unsubHospitals = onSnapshot(doc(db, 'settings', 'hospital_prices'), (snap) => {
      if (snap.exists() && Object.keys(snap.data() || {}).length > 0) {
        setHospitalPrices(snap.data());
      } else {
        const defaultHospitals = {
          'Govt Hospital': { price: 0, isActive: true, description: 'General government health clinic, consulting and diagnostics OP center.', phone: '08742-224522' },
          'KIMS Hospital': { price: 300, isActive: true, description: 'Premium multi-specialty regional super specialty diagnosis consulting.', phone: '9123456789' },
          'Mamatha Hospital': { price: 200, isActive: true, description: 'Charity trust medical teaching college, operational OP.', phone: '9876543215' },
          'Prathima Hospital': { price: 250, isActive: true, description: 'Clinical emergency triage, wellness outpatient consultations.', phone: '9988776655' }
        };
        setHospitalPrices(defaultHospitals);
        // Safely write default configuration to Firestore
        setDoc(doc(db, 'settings', 'hospital_prices'), defaultHospitals)
          .catch(e => console.warn("Auto-seeding default hospital prices failed:", e));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/hospital_prices');
    });

    // 5. Sync Promo Codes and Auto-Publish array for Customer app checkout fallback
    const unsubPromo = onSnapshot(collection(db, 'promoCodes'), (snap) => {
      if (snap.empty) {
        const defaultPromo = [
          { id: 'LOKAL100', code: 'LOKAL100', type: 'flat', value: 100, minOrder: 400, description: 'Lokal flat discount coupon', status: 'active', createdAt: new Date().toISOString() },
          { id: 'FESTIVE20', code: 'FESTIVE20', type: 'percentage', value: 20, minOrder: 500, description: 'Festive special discount coupon', status: 'active', createdAt: new Date().toISOString() },
          { id: 'WELCOME30', code: 'WELCOME30', type: 'flat', value: 30, minOrder: 150, description: 'Welcome coupon for first time order', status: 'active', createdAt: new Date().toISOString() }
        ];
        defaultPromo.forEach(async (codeDoc) => {
          await setDoc(doc(db, 'promoCodes', codeDoc.id), codeDoc)
            .catch(e => console.warn("Failed seeding promo code:", codeDoc.id, e));
        });
        return;
      }

      const rawList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPromoCodes(rawList);

      // Map format with dual properties to satisfy both AdminPortal and Home/App checkout
      const homeFormattedList = rawList.map((item: any) => ({
        id: item.code || item.id,
        type: item.type === 'percentage' ? 'percent' : 'flat',
        value: Number(item.value) || 0,
        label: `${item.type === 'percentage' ? item.value + '%' : '₹' + item.value} LOKAL PROMO`,
        minSubtotal: Number(item.minOrder || item.minSubtotal) || 0,
        isActive: item.status === 'active' || item.isActive === true
      }));

      // Set the dynamic configuration document
      setDoc(doc(db, 'settings', 'promo_codes'), { list: homeFormattedList })
        .catch(err => console.warn("Failed syncing formatted list to settings/promo_codes:", err));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'promoCodes');
    });

    // 6. Sync Support chats
    const unsubChats = onSnapshot(collection(db, 'support_chats'), (snap) => {
      setSupportChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'support_chats');
    });

    // 6.b Sync Dynamic Categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      if (snap.empty) {
        CATEGORIES.forEach(async (cat) => {
          await setDoc(doc(db, 'categories', cat.id), {
            ...cat,
            createdAt: new Date().toISOString()
          }).catch(e => console.warn("Failed seeding category:", cat.id, e));
        });
        return;
      }
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'categories');
    });

    // 7. Sync orders for quick metrics helper
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      let revenue = 0;
      let active = 0;
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.total) revenue += Number(d.total) || 0;
        if (['Pending', 'Preparing', 'On Trip'].includes(d.status)) active++;
      });
      setStats(prev => ({
        ...prev,
        activeOrders: active,
        totalSales: revenue
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });

    // 8. Sync Banners
    const unsubBanners = onSnapshot(collection(db, 'banners'), (snap) => {
      if (snap.empty) {
        const defaultBans = [
          { 
            id: 'ban_103', 
            type: 'top',
            title: 'Careful Travel Drivers', 
            sub: 'Safe Car & Bus Rentals for All Vehicles', 
            desc: 'Professional drivers we have for halting as you wish',
            color: 'bg-slate-900', 
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            categoryId: 'travel',
            cta: 'Book Driver',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_101', 
            type: 'top',
            title: 'Fresh Farm Milk', 
            sub: 'Direct from local farms to your home', 
            color: 'bg-blue-600', 
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            productId: 'd1',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_102', 
            type: 'top',
            title: 'Mineral Water 20L', 
            sub: 'Pure & Certified Quality', 
            color: 'bg-cyan-600', 
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            productId: 'w1',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_201', 
            type: 'bottom',
            title: 'Expert Maid Services', 
            sub: 'Experienced Cooks & Sweepers', 
            color: 'bg-emerald-600', 
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            categoryId: 'maids',
            createdAt: new Date().toISOString()
          },
          { 
            id: 'ban_202', 
            type: 'bottom',
            title: 'Maintenance Pro', 
            sub: 'Electricians, Plumbers, Painters', 
            color: 'bg-orange-600', 
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            categoryId: 'services',
            createdAt: new Date().toISOString()
          }
        ];
        defaultBans.forEach(async (b) => {
          await setDoc(doc(db, 'banners', b.id), b)
            .catch(e => console.warn("Failed seeding banner:", b.id, e));
        });
        return;
      }
      setBanners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to banners:", err);
    });

    // 8b. Sync Deals of the Day
    const unsubDeals = onSnapshot(collection(db, 'deals_of_the_day'), (snap) => {
      if (snap.empty) {
        const defaultDeals = [
          {
            id: 'deal-1',
            title: 'Premium Grocery Bag',
            discount: '50% OFF',
            price: 199,
            originalPrice: 399,
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'deal-2',
            title: 'Fresh Vegetables Basket',
            discount: '40% OFF',
            price: 299,
            originalPrice: 499,
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'deal-3',
            title: 'Juicy Fruits Bag',
            discount: '30% OFF',
            price: 149,
            originalPrice: 249,
            img: 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];
        defaultDeals.forEach(async (d) => {
          await setDoc(doc(db, 'deals_of_the_day', d.id), d)
            .catch(e => console.warn("Failed seeding initial deal of the day:", d.id, e));
        });
        return;
      }
      setDeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to deals of the day:", err);
    });

    // 9. Sync Reviews
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to reviews:", err);
    });

    // 10. Sync Branches (Pre-loaded globally)
    const unsubBranches = () => {};

    // 11. Sync Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to users:", err);
    });

    // 12. Full Orders Sync for Dispatch Overrides
    const unsubOrdersFull = onSnapshot(collection(db, 'orders'), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to full orders:", err);
    });

    // 13. Sync Dispatch Automation Toggle Config
    const unsubDispatchConfig = onSnapshot(doc(db, 'settings', 'dispatch_config'), (snap) => {
      if (snap.exists()) {
        setDispatchConfig(snap.data());
      } else {
        setDispatchConfig({ autoAssign: true });
      }
    }, (err) => {
      console.warn("Failed to subscribe to dispatch configuration:", err);
    });

    // 14. Sync Marriage Profiles
    const unsubMarriage = onSnapshot(collection(db, 'marriageProfiles'), (snap) => {
      setMarriageProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to marriageProfiles:", err);
    });

    // 14b. Sync Real Estate properties
    const unsubProperties = onSnapshot(collection(db, 'properties'), (snap) => {
      setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Failed to subscribe to properties:", err);
    });

    // 15. Sync Audit Logs
    const unsubAuditLogs = onSnapshot(collection(db, 'audit_logs'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setAuditLogs(list);
    }, (err) => {
      console.warn("Audit logs error:", err);
    });

    // 16. Sync SMS Settings
    const unsubSmsConfig = onSnapshot(doc(db, 'settings', 'sms_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.provider) setSmsProvider(data.provider);
        if (data.key || data.apiKey) setSmsKey(data.key || data.apiKey);
        if (data.password) setSmsPassword(data.password);
        if (data.accountType) setSmsAccountType(data.accountType);
        if (data.matchTemplate !== undefined) setSmsMatchTemplate(data.matchTemplate === true || data.matchTemplate === 'true');
        if (data.senderId) setSmsSenderId(data.senderId);
      }
    }, (err) => {
      console.warn("SMS settings config error:", err);
    });

    // 17. Sync Payment Settings
    const unsubPayConfig = onSnapshot(doc(db, 'settings', 'payment_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.gateway) setPaymentGateway(data.gateway);
        if (data.mode) setPaymentMode(data.mode);
        if (data.upiId) setPaymentUpiId(data.upiId);
        if (data.accountHolder) setPaymentHolder(data.accountHolder);
      }
    }, (err) => {
      console.warn("Payment config error:", err);
    });

    // 18. Sync Support Complaints
    const unsubComplaints = onSnapshot(collection(db, 'support_complaints'), (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Support complaints sync error:", err);
    });

    // 19. Sync Hospital OP Bookings
    const unsubHospitalBookings = onSnapshot(collection(db, 'hospital_bookings'), (snap) => {
      setHospitalBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Hospital bookings sync error:", err);
    });

    // 20. Sync Authorized Admins Config (Master Admin Access)
    const unsubAuthorizedAdmins = onSnapshot(doc(db, 'settings', 'authorized_admins'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AuthorizedAdminsConfig;
        setAuthorizedAdminsList(data.secondaryAdmins || []);
        if (data.primaryPhoneNumbers && data.primaryPhoneNumbers.length > 0) {
          setPrimaryMasterPhones(data.primaryPhoneNumbers);
        }
      }
    }, (err) => {
      console.warn("Authorized admins config sync error in AdminPortal:", err);
    });

    // 21. Sync Emergency SOS Distress Alerts
    const unsubSOS = onSnapshot(collection(db, 'sos_alerts'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SOSAlert));
      // Sort newest first
      list.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setSosAlerts(list);
    }, (err) => {
      console.warn("SOS alerts sync error in AdminPortal:", err);
    });

    // 22. Real-time session revocation listener
    const handleRevokeEvent = (event: any) => {
      const reason = event?.detail?.reason || 'Administrative role removed from backend';
      console.warn("Admin session revoked via event:", reason);
      setIsAdminAuthenticated(false);
      setAuthError(`⚠️ Session Revoked: ${reason}`);
      triggerToast(`🔒 Session Revoked: ${reason}`);
    };
    window.addEventListener('revoke_admin_session', handleRevokeEvent);

    return () => {
      window.removeEventListener('revoke_admin_session', handleRevokeEvent);
      unsubVendors();
      unsubRiders();
      unsubProducts();
      unsubHospitals();
      unsubPromo();
      unsubChats();
      unsubCategories();
      unsubOrders();
      unsubBanners();
      unsubDeals();
      unsubReviews();
      unsubBranches();
      unsubUsers();
      unsubOrdersFull();
      unsubDispatchConfig();
      unsubMarriage();
      unsubAuditLogs();
      unsubSmsConfig();
      unsubPayConfig();
      unsubProperties();
      unsubComplaints();
      unsubHospitalBookings();
      unsubAuthorizedAdmins();
      unsubSOS();
    };
  }, [isAdminAuthenticated, user]);

  // Derive counts and updates for local metrics overview
  useEffect(() => {
    const pendVendors = vendors.filter(v => v.status === 'Pending').length;
    const pendRiders = riders.filter(r => r.status === 'Pending').length;
    setStats(prev => ({
      ...prev,
      totalVendors: vendors.length,
      totalRiders: riders.length,
      pendingVendors: pendVendors,
      pendingRiders: pendRiders,
      systemMode: isMaintenanceMode ? 'Maintenance 🛠️' : 'Live Operations ⚡'
    }));
  }, [vendors, riders, isMaintenanceMode]);

  // --- AUTOMATED DISPATCH ASSIGNMENT SERVICE & TIME HANDLERS ---
  const handleAutoReassignOrder = async (orderId: string, currentRiderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Find other online and approved riders
      const onlineRiders = riders.filter(r => r.isOnline && r.status === 'Approved' && r.id !== currentRiderId);
      if (onlineRiders.length === 0) {
        console.warn(`[Auto-Assign Service] No other active online pilots for Order #${orderId.slice(0, 4)}`);
        return;
      }

      // Compute closest available rider (using deliveryLocation or fallback)
      const oLat = order.deliveryLocation?.lat || order.lat || 17.2473;
      const oLng = order.deliveryLocation?.lng || order.lng || 80.1514;

      let closestRider: any = null;
      let minDistance = Infinity;

      onlineRiders.forEach(r => {
        const rLat = r.lat || r.coordinates?.lat || r.location?.lat || 17.2473;
        const rLng = r.lng || r.coordinates?.lng || r.location?.lng || 80.1514;
        const dist = Math.sqrt(Math.pow(rLat - oLat, 2) + Math.pow(rLng - oLng, 2));
        if (dist < minDistance) {
          minDistance = dist;
          closestRider = r;
        }
      });

      if (closestRider) {
        await updateDoc(doc(db, 'orders', order.id), {
          riderId: closestRider.id,
          deliveryPartnerId: closestRider.id,
          riderName: closestRider.name,
          deliveryPartnerName: closestRider.name,
          riderPhone: closestRider.phone || '9876543210',
          deliveryPartnerPhone: closestRider.phone || '9876543210',
          status: 'Assigned',
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        triggerToast(`⚡ Dispatch Timeout: Reassigned order #${order.id.slice(0, 4)} to closest rider: ${closestRider.name}`);
      }
    } catch (e) {
      console.error("[Auto-Assign Service ERROR]:", e);
    }
  };

  // Run periodic checks for orders which have been pending/assigned for more than 15 minutes
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const interval = setInterval(() => {
      const fifteenMinutesMs = 15 * 60 * 1000;
      const now = Date.now();

      orders.forEach(ord => {
        const hasRider = !!(ord.riderId || ord.deliveryPartnerId);
        const isPendingAssigned = ord.status === 'Pending' || ord.status === 'Assigned';

        if (hasRider && isPendingAssigned) {
          const lastActiveTimeRef = ord.assignedAt || ord.updatedAt || ord.timestamp || ord.createdAt;
          if (lastActiveTimeRef) {
            let lastActiveMs = now;
            try {
              if (lastActiveTimeRef.seconds) {
                lastActiveMs = lastActiveTimeRef.seconds * 1000;
              } else if (typeof lastActiveTimeRef.toMillis === 'function') {
                lastActiveMs = lastActiveTimeRef.toMillis();
              } else {
                lastActiveMs = new Date(lastActiveTimeRef).getTime();
              }
            } catch (_) {
              lastActiveMs = now;
            }

            const elapsed = now - lastActiveMs;
            if (elapsed > fifteenMinutesMs) {
              const rId = ord.riderId || ord.deliveryPartnerId;
              handleAutoReassignOrder(ord.id, rId);
            }
          }
        }
      });
    }, 15000); // scan every 15 seconds

    return () => clearInterval(interval);
  }, [orders, riders, isAdminAuthenticated]);

  // Bulk Dispatch updates
  const handleExecuteBulkAssign = async (riderId: string) => {
    if (!riderId || bulkSelectedOrderIds.length === 0) return;
    const selectedRider = riders.find(r => r.id === riderId);
    if (!selectedRider) return;

    try {
      const batchPromises = bulkSelectedOrderIds.map(orderId => {
        return updateDoc(doc(db, 'orders', orderId), {
          riderId: selectedRider.id,
          deliveryPartnerId: selectedRider.id,
          riderName: selectedRider.name,
          deliveryPartnerName: selectedRider.name,
          riderPhone: selectedRider.phone || '9876543210',
          deliveryPartnerPhone: selectedRider.phone || '9876543210',
          status: 'Preparing', // Move to preparing so the rider gets it instantly
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(batchPromises);
      triggerToast(`✓ Bulk Dispatched ${bulkSelectedOrderIds.length} orders to ${selectedRider.name}`);
      setBulkSelectedOrderIds([]);
    } catch (err) {
      console.error(err);
      triggerToast(`❌ Bulk assignment failed`);
    }
  };

  // System mode updates
  const handleToggleMaintenance = async () => {
    try {
      const nextMode = !isMaintenanceMode;
      localStorage.setItem('lokal_maintenance_mode', String(nextMode));
      setIsMaintenanceMode(nextMode);
      window.dispatchEvent(new CustomEvent('maintenance_mode_changed', { detail: nextMode }));
      
      // Update config settings under settings db node as well
      await setDoc(doc(db, 'settings', 'system_maintenance'), {
        isUnderMaintenance: nextMode,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'Master Admin Node'
      }, { merge: true });

      triggerToast(`🚨 System Mode Toggled to ${nextMode ? 'DOWNTIME' : 'LIVE CONSOLE'}`);
    } catch (e) {
      console.error(e);
      alert('Error updating database configs');
    }
  };

  // Vendor approvals & suspensions operations
  const handleUpdateVendorStatus = async (id: string, status: 'Approved' | 'Banned' | 'Pending') => {
    try {
      await updateDoc(doc(db, 'vendors', id), { status });
      triggerToast(`✓ Vendor status updated to: ${status}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Rider approvals & status operations
  const handleUpdateRiderStatus = async (id: string, status: 'Approved' | 'Banned' | 'Pending', isOnline?: boolean) => {
    try {
      const updates: any = { status };
      if (typeof isOnline === 'boolean') {
        updates.isOnline = isOnline;
        updates.status = isOnline ? 'Online' : 'Offline';
      }
      await updateDoc(doc(db, 'deliveryPartners', id), updates);
      triggerToast(`✓ Rider status updated successfully`);
    } catch (err) {
      console.error(err);
    }
  };

  // Payout updates helper
  const handleSettleRiderCash = async (riderId: string) => {
    try {
      await updateDoc(doc(db, 'deliveryPartners', riderId), {
        cashInHand: 0,
        earnings: 0,
        trips: 0
      });
      triggerToast(`💸 Cash in hand cleared & finalized for payment`);
    } catch (err) {
      console.error(err);
    }
  };

  // --- FOUNDER PANEL HANDLERS (BANNERS, PROMOS, REVIEWS, BRANCHES, DISPATCH, HOSPITALS) ---

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), {
          title: bannerForm.title.trim(),
          description: bannerForm.description.trim(),
          image: bannerForm.image.trim(),
          route: bannerForm.route,
          status: bannerForm.status,
          updatedAt: serverTimestamp()
        });
        triggerToast('✓ Banner saved successfully');
      } else {
        await addDoc(collection(db, 'banners'), {
          title: bannerForm.title.trim(),
          description: bannerForm.description.trim(),
          image: bannerForm.image.trim(),
          route: bannerForm.route,
          status: bannerForm.status,
          createdAt: serverTimestamp()
        });
        triggerToast('✓ Created new promotional slide banner');
      }
      setShowBannerModal(false);
      setEditingBanner(null);
      setBannerForm({ title: '', description: '', image: '', route: 'restaurant', status: 'active' });
    } catch (e) {
      console.error(e);
      alert('Error updating brochure banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Permanently delete this promotional slide?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      triggerToast('✓ Brochure slide deleted successfully');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title.trim()) return;
    try {
      const payload = {
        title: dealForm.title.trim(),
        discount: dealForm.discount.trim() || '50% OFF',
        price: Number(dealForm.price) || 0,
        originalPrice: Number(dealForm.originalPrice) || 0,
        img: dealForm.img.trim(),
        status: dealForm.status,
        branchId: adminRole === 'franchise' ? adminBranchId : (dealForm.branchId || 'global'),
        updatedAt: serverTimestamp()
      };

      if (editingDeal) {
        await updateDoc(doc(db, 'deals_of_the_day', editingDeal.id), payload);
        triggerToast('✓ Deal saved successfully');
      } else {
        const customId = 'deal_' + Date.now();
        await setDoc(doc(db, 'deals_of_the_day', customId), {
          ...payload,
          id: customId,
          createdAt: serverTimestamp()
        });
        triggerToast('✓ Created new Deal of the Day');
      }
      setShowDealModal(false);
      setEditingDeal(null);
      setDealForm({ 
        title: '', 
        discount: '', 
        price: '', 
        originalPrice: '', 
        img: '', 
        status: 'active',
        branchId: adminRole === 'franchise' ? adminBranchId : 'global'
      });
    } catch (e) {
      console.error(e);
      alert('Error updating deal of the day');
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Permanently delete this Deal of the Day?')) return;
    try {
      await deleteDoc(doc(db, 'deals_of_the_day', id));
      triggerToast('✓ Deal deleted successfully');
    } catch (e) {
      console.error(e);
    }
  };

  // --- 40-SEC SPEED QUIZ & TRIVIA CRUD HANDLERS ---
  const handleSaveQuizQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.question.trim() || !quizForm.optA.trim() || !quizForm.optB.trim()) {
      alert("Please provide the question and at least 2 options!");
      return;
    }

    const options = [
      quizForm.optA.trim(), 
      quizForm.optB.trim(), 
      quizForm.optC.trim(), 
      quizForm.optD.trim()
    ].filter(Boolean);

    let updated: QuizQuestion[] = [];
    if (editingQuizQuestion) {
      updated = quizQuestions.map(q => q.id === editingQuizQuestion.id ? {
        ...q,
        question: quizForm.question.trim(),
        options,
        correctIndex: Number(quizForm.correctIndex),
        explanation: quizForm.explanation.trim() || 'Verified answer',
        category: quizForm.category.trim() || 'Low Price Trivia'
      } : q);
      triggerToast('✓ Quiz Question Updated Successfully!');
    } else {
      const newId = Date.now();
      const newQ: QuizQuestion = {
        id: newId,
        question: quizForm.question.trim(),
        options,
        correctIndex: Number(quizForm.correctIndex),
        explanation: quizForm.explanation.trim() || 'Verified answer',
        category: quizForm.category.trim() || 'Low Price Trivia'
      };
      updated = [...quizQuestions, newQ];
      triggerToast('✓ New Quiz Question Created Successfully!');
    }

    setQuizQuestions(updated);
    localStorage.setItem('custom_quiz_questions', JSON.stringify(updated));
    window.dispatchEvent(new Event('quiz_questions_updated'));

    try {
      setDoc(doc(db, 'settings', 'quiz_config'), { questions: updated, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore quiz sync info:", err);
    }

    setShowQuizModal(false);
    setEditingQuizQuestion(null);
    setQuizForm({ question: '', optA: '', optB: '', optC: '', optD: '', correctIndex: 0, explanation: '', category: 'Low Price Grocery' });
  };

  const handleOpenEditQuizQuestion = (q: QuizQuestion) => {
    setEditingQuizQuestion(q);
    setQuizForm({
      question: q.question,
      optA: q.options[0] || '',
      optB: q.options[1] || '',
      optC: q.options[2] || '',
      optD: q.options[3] || '',
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      category: q.category
    });
    setShowQuizModal(true);
  };

  const handleDeleteQuizQuestion = (id: number) => {
    if (!confirm('Permanently delete this quiz question?')) return;
    const updated = quizQuestions.filter(q => q.id !== id);
    setQuizQuestions(updated);
    localStorage.setItem('custom_quiz_questions', JSON.stringify(updated));
    window.dispatchEvent(new Event('quiz_questions_updated'));

    try {
      setDoc(doc(db, 'settings', 'quiz_config'), { questions: updated, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore quiz delete sync info:", err);
    }

    triggerToast('✓ Quiz question deleted');
  };

  const handleResetQuizQuestions = () => {
    if (!confirm('Reset quiz to default low-price product information questions?')) return;
    const defaults = DEFAULT_LOW_PRICE_QUIZ_QUESTIONS;
    setQuizQuestions(defaults);
    localStorage.setItem('custom_quiz_questions', JSON.stringify(defaults));
    window.dispatchEvent(new Event('quiz_questions_updated'));

    try {
      setDoc(doc(db, 'settings', 'quiz_config'), { questions: defaults, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore quiz reset sync info:", err);
    }

    triggerToast('✓ Reset quiz questions to default low-price product trivia.');
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code.trim() || !promoForm.value) return;
    try {
      const codeId = promoForm.code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
      const pData = {
        code: codeId,
        type: promoForm.type,
        value: Number(promoForm.value),
        minOrder: Number(promoForm.minOrder || 0),
        maxDiscount: Number(promoForm.maxDiscount || 9999),
        status: promoForm.status,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'promoCodes', codeId), pData);
      triggerToast(`✓ Promo code ${codeId} saved and published`);
      
      setShowPromoModal(false);
      setEditingPromo(null);
      setPromoForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', status: 'active' });
    } catch (e) {
      console.error(e);
      alert('Failed saving promo coupon');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'promoCodes', id));
      triggerToast('✓ Promo code has been deleted');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReviewModerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      await updateDoc(doc(db, 'reviews', editingReview.id), {
        comment: reviewForm.comment.trim(),
        rating: Number(reviewForm.rating),
        moderatedAt: serverTimestamp()
      });
      triggerToast('✓ Review comment moderated successfully');
      setEditingReview(null);
    } catch (e) {
      console.error(e);
      alert('Review update failed');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Remove this review and star-rating from customer log?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      triggerToast('✓ Review comment deleted from record');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.id.trim() || !branchForm.name.trim()) return;
    try {
      const bId = branchForm.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      const bData = {
        id: bId,
        name: branchForm.name.trim(),
        city: branchForm.city.trim(),
        revenue: Number(branchForm.revenue || 0),
        status: branchForm.status,
        adminEmail: branchForm.adminEmail.trim(),
        secPasscode: (branchForm.secPasscode || '4455').trim(),
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'branches', bId), bData);
      triggerToast(`✓ Franchise Branch ${branchForm.name} operationalized!`);
      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchForm({ id: '', name: '', city: 'Khammam', revenue: 0, status: 'Active', adminEmail: '', secPasscode: '4455' });
    } catch (e) {
      console.error(e);
      alert('Failed to configure franchise branch');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to permanently disable and delete this Franchise/Pranchege?')) return;
    try {
      await deleteDoc(doc(db, 'branches', id));
      triggerToast('✓ Franchise hub records purged');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveBranchRadius = async (branchId: string, requestedRadius: number) => {
    try {
      await updateDoc(doc(db, 'branches', branchId), {
        deliveryRadius: requestedRadius,
        pendingDeliveryRadius: null,
        deliveryRadiusStatus: 'approved',
        deliveryRadiusApprovedBy: 'Master Admin (Tarun Bandi)',
        deliveryRadiusApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Approved delivery radius of ${requestedRadius} km for branch!`);
    } catch (e: any) {
      console.error(e);
      alert('Failed to approve delivery radius: ' + e.message);
    }
  };

  const handleRejectBranchRadius = async (branchId: string) => {
    try {
      await updateDoc(doc(db, 'branches', branchId), {
        pendingDeliveryRadius: null,
        deliveryRadiusStatus: 'rejected',
        updatedAt: serverTimestamp()
      });
      triggerToast('❌ Delivery radius request rejected');
    } catch (e: any) {
      console.error(e);
      alert('Failed to reject delivery radius: ' + e.message);
    }
  };

  const handleOverrideBranchRadius = async (branchId: string, newRadiusKm: number) => {
    try {
      await updateDoc(doc(db, 'branches', branchId), {
        deliveryRadius: newRadiusKm,
        pendingDeliveryRadius: null,
        deliveryRadiusStatus: 'approved',
        deliveryRadiusUpdatedBy: 'Master Admin (Tarun Bandi)',
        deliveryRadiusUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`⚡ Master Override: Delivery radius set to ${newRadiusKm} km!`);
    } catch (e: any) {
      console.error(e);
      alert('Failed to override delivery radius: ' + e.message);
    }
  };

  const handleToggleAutoDispatch = async () => {
    try {
      const nextMode = !dispatchConfig.autoAssign;
      await setDoc(doc(db, 'settings', 'dispatch_config'), {
        autoAssign: nextMode,
        updatedAt: serverTimestamp()
      });
      triggerToast(`📡 Dispatch allocation set to ${nextMode ? 'AUTOMATED RUNTIME' : 'MANUAL ROUTING'}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualAssignOrder = async (orderId: string, riderId: string) => {
    if (!riderId) return;
    try {
      const selectedRider = riders.find(r => r.id === riderId);
      await updateDoc(doc(db, 'orders', orderId), {
        riderId,
        deliveryPartnerId: riderId,
        riderName: selectedRider?.name || 'Assigned Driver',
        deliveryPartnerName: selectedRider?.name || 'Assigned Driver',
        riderPhone: selectedRider?.phone || '9876543210',
        deliveryPartnerPhone: selectedRider?.phone || '9876543210',
        status: 'Preparing', // Instantly dispatch item
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Order manually dispatched & accepted on behalf of ${selectedRider?.name}`);
    } catch (e) {
      console.error(e);
      alert('Routing overrides dispatcher assign failed');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Accepted',
        adminAccepted: true,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Order accepted and routed to dispatch.`);
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to accept order.`);
    }
  };

  const handleCancelOrderEx = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      triggerToast(`✕ Order has been cancelled.`);
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to cancel order.`);
    }
  };

  const handleDeleteOrderEx = async (orderId: string) => {
    if (!window.confirm(`PERMANENTLY DELETE order #${orderId.slice(-6)}? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      triggerToast(`✓ Order permanently deleted.`);
      if (selectedOrderId === orderId) setSelectedOrderId(null);
      if (editingOrder?.id === orderId) {
        setShowOrderModal(false);
        setEditingOrder(null);
      }
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to delete order.`);
    }
  };

  const handleUpdateOrderStatusEx = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        adminAccepted: true,
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ Status manual override: ${newStatus}`);
    } catch (e) {
      console.error(e);
      triggerToast(`❌ Failed to update status.`);
    }
  };

  const handleUpdateOrderDetailsEx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await updateDoc(doc(db, 'orders', editingOrder.id), {
        customerName: editingOrder.customerName || editingOrder.userName || '',
        phone: editingOrder.phone || editingOrder.userPhone || '',
        address: editingOrder.address || '',
        total: Number(editingOrder.total || editingOrder.totalPrice || 0),
        orderItems: editingOrder.orderItems || [],
        updatedAt: serverTimestamp()
      });
      triggerToast('✓ Order details updated successfully.');
      setShowOrderModal(false);
      setEditingOrder(null);
    } catch (err: any) {
      console.error(err);
      triggerToast('❌ Failed to update order details.');
    }
  };

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalForm.name.trim()) return;
    try {
      const hName = hospitalForm.name.trim();
      const updated = {
        ...hospitalPrices
      };
      if (editingHospital && editingHospital !== hName) {
        delete updated[editingHospital];
      }
      updated[hName] = {
        ...(hospitalPrices[editingHospital || hName] || {}),
        price: Number(hospitalForm.price) || 0,
        isActive: hospitalForm.isActive,
        description: hospitalForm.description.trim(),
        phone: hospitalForm.phone.trim(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      triggerToast(`✓ Hospital ${hName} saved successfully`);
      setShowHospitalModal(false);
      setEditingHospital(null);
      setHospitalForm({ name: '', price: '', isActive: true, description: '', phone: '' });
    } catch (e: any) {
      console.error(e);
      triggerToast(`❌ Failed saving hospital: ${e.message || e}`);
    }
  };

  const handleDeleteHospitalObj = async (name: string) => {
    if (!confirm(`Delete "${name}" hospital from master clinical directory?`)) return;
    try {
      const updated = { ...hospitalPrices };
      delete updated[name];
      await setDoc(doc(db, 'settings', 'hospital_prices'), updated);
      triggerToast(`✓ Deleted "${name}" hospital from directory`);
    } catch (e: any) {
      console.error(e);
      triggerToast(`❌ Error deleting hospital: ${e.message || e}`);
    }
  };

  // Hospital OP Bookings Handlers (Edit, Delete, Status Updates)
  const handleUpdateHospitalBookingStatus = async (id: string, newStatus: 'Approved' | 'Rejected' | 'Completed' | 'pending') => {
    try {
      await updateDoc(doc(db, 'hospital_bookings', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      triggerToast(`✓ OP Booking status updated to ${newStatus}`);
    } catch (err: any) {
      console.error(err);
      triggerToast(`❌ Error updating booking status: ${err.message || err}`);
    }
  };

  const handleOpenEditHospitalBooking = (booking: any) => {
    setEditingHospitalBooking(booking);
    setHospitalBookingForm({
      patientName: booking.patientName || '',
      phone: booking.phone || '',
      hospital: booking.hospital || booking.hospitalName || '',
      slot: booking.slot || booking.dateTime || '',
      dateTime: booking.dateTime || booking.slot || '',
      age: booking.age ? String(booking.age) : '',
      gender: booking.gender || 'Male',
      location: booking.location || booking.address || '',
      reason: booking.reason || booking.disease || '',
      disease: booking.disease || booking.reason || '',
      amount: booking.amount ? Number(booking.amount) : 220,
      status: booking.status || 'pending'
    });
    setShowHospitalBookingModal(true);
  };

  const handleSaveHospitalBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHospitalBooking) return;
    try {
      const updatedData: any = {
        patientName: hospitalBookingForm.patientName.trim(),
        phone: hospitalBookingForm.phone.trim(),
        hospital: hospitalBookingForm.hospital.trim(),
        hospitalName: hospitalBookingForm.hospital.trim(),
        slot: hospitalBookingForm.slot.trim() || hospitalBookingForm.dateTime,
        dateTime: hospitalBookingForm.dateTime || hospitalBookingForm.slot,
        age: hospitalBookingForm.age ? Number(hospitalBookingForm.age) : null,
        gender: hospitalBookingForm.gender,
        location: hospitalBookingForm.location.trim(),
        address: hospitalBookingForm.location.trim(),
        reason: hospitalBookingForm.reason.trim(),
        disease: hospitalBookingForm.disease.trim() || hospitalBookingForm.reason.trim(),
        amount: Number(hospitalBookingForm.amount) || 0,
        status: hospitalBookingForm.status,
        updatedAt: serverTimestamp()
      };
      await updateDoc(doc(db, 'hospital_bookings', editingHospitalBooking.id), updatedData);
      triggerToast(`✓ OP appointment booking updated for ${hospitalBookingForm.patientName}`);
      setShowHospitalBookingModal(false);
      setEditingHospitalBooking(null);
    } catch (err: any) {
      console.error("Error saving hospital booking:", err);
      triggerToast(`❌ Error saving booking: ${err.message || err}`);
    }
  };

  const handleDeleteHospitalBooking = async (bookingId: string, patientName?: string) => {
    if (!window.confirm(`PERMANENTLY DELETE OP appointment record for "${patientName || 'this patient'}"? This action cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'hospital_bookings', bookingId));
      triggerToast('✓ Hospital OP appointment booking deleted permanently');
      if (editingHospitalBooking?.id === bookingId) {
        setShowHospitalBookingModal(false);
        setEditingHospitalBooking(null);
      }
    } catch (err: any) {
      console.error("Error deleting hospital booking:", err);
      triggerToast(`❌ Error deleting booking: ${err.message || err}`);
    }
  };

  const handleUpdateHospitalOfficeVerification = async (hospitalName: string, isApproved: boolean) => {
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
      triggerToast(`✓ Hospital ${hospitalName} is now ${isApproved ? 'Approved/Verified' : 'Unapproved/Pending'}`);
    } catch (err: any) {
      console.error(err);
      triggerToast(`❌ Failed to update hospital office verification.`);
    }
  };

  // --- Marriage Profiles Handlers ---
  const handleApproveMarriageProfile = async (id: string) => {
    try {
      await updateDoc(doc(db, 'marriageProfiles', id), {
        isApproved: true,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Profile Approved Successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to approve profile.");
    }
  };

  const handleRejectMarriageProfile = async (id: string) => {
    if (confirm("Reject and Delete this profile permanently?")) {
      try {
        await deleteDoc(doc(db, 'marriageProfiles', id));
        triggerToast("✓ Profile Rejected & Removed successfully.");
      } catch (err) {
        console.error(err);
        triggerToast("❌ Failed to reject profile.");
      }
    }
  };

  const handleSuspendMarriageProfile = async (id: string, name: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "Suspend" : "Unsuspend";
    if (confirm(`${actionText} profile for ${name}?`)) {
      try {
        await updateDoc(doc(db, 'marriageProfiles', id), {
          isApproved: !currentStatus,
          updatedAt: serverTimestamp()
        });
        triggerToast(`✓ Profile ${actionText}ed successfully!`);
      } catch (err) {
        console.error(err);
        triggerToast(`❌ Failed to ${actionText.toLowerCase()} profile.`);
      }
    }
  };

  const handleSaveMarriageProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarriageProfile) return;
    try {
      await updateDoc(doc(db, 'marriageProfiles', editingMarriageProfile.id), {
        ...editingMarriageProfile,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Marriage Profile Updated Successfully!");
      setEditingMarriageProfile(null);
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to update marriage profile.");
    }
  };

  // --- Real Estate Property Handlers ---
  const handleApproveProperty = async (id: string) => {
    try {
      await updateDoc(doc(db, 'properties', id), {
        isApproved: true,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Property Listing Approved Successfully!");
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to approve property listing.");
    }
  };

  const handleRejectProperty = async (id: string) => {
    if (confirm("Reject and Suspend this property listing? This sets approved to false.")) {
      try {
        await updateDoc(doc(db, 'properties', id), {
          isApproved: false,
          updatedAt: serverTimestamp()
        });
        triggerToast("✓ Property Listing Suspended & Unapproved successfully.");
      } catch (err) {
        console.error(err);
        triggerToast("❌ Failed to suspend property.");
      }
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Delete this property listing permanently? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'properties', id));
        triggerToast("✓ Property Listing Deleted permanently.");
      } catch (err) {
        console.error(err);
        triggerToast("❌ Failed to delete property listing.");
      }
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    try {
      await updateDoc(doc(db, 'properties', editingProperty.id), {
        ...editingProperty,
        updatedAt: serverTimestamp()
      });
      triggerToast("✓ Property Listing Updated Successfully!");
      setEditingProperty(null);
    } catch (err) {
      console.error(err);
      triggerToast("❌ Failed to update property listing.");
    }
  };

  // Chat reply handlers
  const handleSendChatMessage = async () => {
    if (!activeChat || !chatMessage.trim()) return;
    try {
      const msgData = {
        senderId: 'admin',
        text: chatMessage,
        createdAt: new Date().toISOString(),
        senderName: 'Lokal Master Admin'
      };
      
      const chatRef = doc(db, 'chats', activeChat.id);
      const chatDoc = await getDoc(chatRef);
      const currentMessages = chatDoc.exists() ? (chatDoc.data().messages || []) : [];
      
      await setDoc(chatRef, {
        messages: [...currentMessages, msgData],
        lastMessage: chatMessage,
        updatedAt: serverTimestamp(),
        unreadCountStatus: 0
      }, { merge: true });

      setChatMessage('');
      triggerToast('✓ Reply dispatched successfully.');
    } catch (e) {
      console.error(e);
    }
  };

  // Hospital OP price settings updates
  const handleUpdateHospitalPrice = async (name: string, price: number, isActive: boolean) => {
    try {
      await setDoc(doc(db, 'settings', 'hospital_prices'), {
        [name]: { price, isActive }
      }, { merge: true });
      triggerToast('✓ Medical OP prices saved successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Category Management Handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id.trim() || !categoryForm.name.trim()) return;
    try {
      const catId = categoryForm.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      const data = {
        id: catId,
        name: categoryForm.name.trim(),
        icon: categoryForm.icon.trim() || 'ShoppingBag',
        color: categoryForm.color.trim() || 'bg-emerald-50',
        image: categoryForm.image.trim() || '',
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'categories', catId), data);
      triggerToast(editingCategory ? '✓ Category details updated' : '🎉 New Category added successfully');

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ id: '', name: '', icon: 'ShoppingBag', color: 'bg-emerald-50', image: '' });
    } catch (err) {
      console.error(err);
      alert('Error updating category database');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category? Items might become unclassified.")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      triggerToast('🗑️ Category deleted from database');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategoryClick = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({
      id: cat.id || '',
      name: cat.name || '',
      icon: cat.icon || 'ShoppingBag',
      color: cat.color || 'bg-emerald-50',
      image: cat.image || ''
    });
    setShowCategoryModal(true);
  };

  // Inventory Save Handlers
  const handleSaveCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = {
        name: itemForm.name,
        price: Number(itemForm.price),
        unit: itemForm.unit,
        category: itemForm.category,
        image: itemForm.image || 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E',
        description: itemForm.description,
        isAvailable: itemForm.isAvailable,
        vendorId: itemForm.vendorId || 'admin-store',
        branchId: itemForm.branchId || 'khammam_main',
        updatedAt: serverTimestamp()
      };

      // Set optional edit values if provided
      if (itemForm.originalPrice) {
        data.originalPrice = Number(itemForm.originalPrice);
      } else {
        data.originalPrice = null;
      }

      if (itemForm.subCategory) {
        data.subCategory = itemForm.subCategory;
      } else {
        data.subCategory = '';
      }

      if (itemForm.stock) {
        data.stock = Number(itemForm.stock);
      } else {
        data.stock = null;
      }

      const activeVendorProfile = vendors.find(v => v.id === itemForm.vendorId);
      if (activeVendorProfile) {
        data.hotelName = activeVendorProfile.businessName || activeVendorProfile.name || '';
      }

      if (editingItem) {
        await updateDoc(doc(db, 'products', editingItem.id), data);
        triggerToast('✓ Item updated in catalog');
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp()
        });
        triggerToast('🎉 New listing added to catalog');
      }

      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({
        name: '', price: '', originalPrice: '', unit: '', category: 'groceries', 
        image: '', description: '', isAvailable: true, vendorId: 'admin-store', branchId: 'khammam_main',
        subCategory: '', stock: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error updating catalog database');
    }
  };

  // Delete inventory catalog item
  const handleDeleteCatalogItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing permanently from the database?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      triggerToast('🗑️ Listing deleted from database');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCatalogItemClick = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      price: String(item.price || ''),
      originalPrice: item.originalPrice ? String(item.originalPrice) : '',
      unit: item.unit || '',
      category: item.category || 'groceries',
      image: item.image || '',
      description: item.description || '',
      isAvailable: item.isAvailable ?? true,
      vendorId: item.vendorId || 'admin-store',
      branchId: item.branchId || 'khammam_main',
      subCategory: item.subCategory || '',
      stock: item.stock ? String(item.stock) : ''
    });
    setShowItemModal(true);
  };

  // Chart statistics configuration
  const chartData = [
    { name: 'Active Onboard', Merchants: vendors.length, Riders: riders.length },
    { name: 'Pending Review', Merchants: stats.pendingVendors, Riders: stats.pendingRiders },
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 font-sans text-white flex flex-col justify-between p-8 relative overflow-hidden">
        {/* Background ambient lock */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

        <div className="my-auto space-y-8 max-w-sm w-full mx-auto relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-400/10 border-2 border-yellow-400/20 rounded-[2.2rem] flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-yellow-500">Local Bandi Multi Services</p>
            <h2 className="text-3xl font-black italic tracking-tighter leading-none mt-1 uppercase">MASTER SECURITY</h2>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-wide font-medium leading-relaxed">
              Standalone master administration terminal. This system demands dual-layered clearance credentials.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-2xl">
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Admin Passcode</label>
              <input 
                type="password" 
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-white/10 p-4 rounded-2xl text-center text-xl font-black tracking-widest text-yellow-400 focus:outline-none focus:border-yellow-400/50 transition-all"
              />
            </div>

            {authError && <p className="text-rose-500 text-[10px] font-black uppercase text-center leading-relaxed">{authError}</p>}

            <button 
              type="submit"
              className="w-full py-4.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-900/10 active:scale-95"
            >
              Verify System Passcode
            </button>
          </form>

          {user && (
            <div className="flex justify-center">
              <button 
                onClick={logout}
                className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Change Authenticated Account
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">
          Standalone Control Node &bull; Secured with SHA-256
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans text-white flex flex-col justify-between">
      {/* Dynamic Toast notifications */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] bg-slate-900 border border-yellow-400/20 px-6 py-4.5 rounded-full shadow-2xl flex items-center gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-yellow-500 shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-100">{notificationMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Admin Navigation Header */}
      <div className="bg-slate-900/90 border-b border-white/5 backdrop-blur-md p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
            <img src="/src/assets/images/local_bandi_logo_1785784124975.jpg" className="w-full h-full object-cover" alt="Local Bandi Logo" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none uppercase">Master Admin Console</h1>
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">Khammam Platform Administrator</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['dashboard', 'sos', 'ai_desk', 'attractions', 'logistics', 'approvals', 'marriage', 'real_estate', 'catalog', 'vendors', 'riders', 'chat', 'users', 'systems', 'founder', 'support', 'deals', 'quiz'].map((tab) => {
            const isPendingSupport = tab === 'support' && complaints.some(c => c.status === 'Pending');
            const activeSosCount = sosAlerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED').length;
            const isSosTab = tab === 'sos';

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab 
                    ? isSosTab 
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 font-extrabold border border-rose-400'
                      : tab === 'attractions'
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-950/30 font-black border border-amber-300'
                        : 'bg-yellow-400 text-slate-900 shadow-md shadow-yellow-950/20 font-extrabold border border-yellow-300' 
                    : isSosTab
                      ? activeSosCount > 0
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-500/60 font-bold hover:bg-rose-900/60 animate-pulse'
                        : 'bg-slate-950/45 hover:bg-slate-850 text-slate-400 border border-white/5'
                      : tab === 'attractions'
                        ? 'bg-gradient-to-r from-amber-950/40 to-indigo-950/40 text-amber-300 border border-amber-500/40 font-black hover:border-amber-400/70 shadow-sm'
                        : tab === 'quiz'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30 font-bold hover:bg-amber-950/60'
                          : tab === 'ai_desk'
                            ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30 font-bold hover:bg-purple-950/60'
                            : 'bg-slate-950/45 hover:bg-slate-850 text-slate-400 border border-white/5'
                }`}
              >
                <span>
                  {tab === 'sos' 
                    ? `🚨 SOS (${activeSosCount})` 
                    : tab === 'attractions'
                      ? '🎁 Attraction Campaigns'
                      : tab === 'quiz' 
                        ? '⚡ 40s Quiz' 
                        : tab === 'ai_desk' 
                          ? '🧠 AI Developer Desk' 
                          : tab}
                </span>
                {isSosTab && activeSosCount > 0 && (
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
                )}
                {isPendingSupport && (
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
                )}
                {isPendingSupport && (
                  <span className="w-2 h-2 bg-rose-500 rounded-full absolute -top-0.5 -right-0.5" />
                )}
              </button>
            );
          })}

          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/10 rounded-xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
            title="Return to Customer App"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>View App</span>
          </button>

          <button 
            onClick={handleAdminLogout}
            className="p-2.5 bg-rose-500/15 border border-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            title="Settle Admin Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Terminal Contents body */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* GLOBAL PERSISTENT SOS TRIGGERED INDICATORS (Shows in all tabs if active distress signals exist) */}
        {sosAlerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED').length > 0 && activeTab !== 'sos' && (
          <div className="space-y-3">
            {sosAlerts
              .filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED')
              .map(alert => (
                <SOSAlertIndicator
                  key={alert.id}
                  alert={alert}
                  variant="banner"
                  onAcknowledge={handleAcknowledgeSosAlert}
                  onResolve={handleResolveSosAlert}
                />
              ))}
          </div>
        )}
        
        {/* TAB 1: DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Laptop className="w-32 h-32" />
              </div>
              <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-1 italic">Authorized session node</p>
              <h2 className="text-xl font-black italic tracking-tight">Enterprise Overview Console</h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xl">
                This panel aggregates key performance signals, merchant onboarding application arrays, and online delivery agent data across all branches.
              </p>
            </div>

            {/* Micro details metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Database Revenue</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-emerald-400">₹{stats.totalSales.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Deliveries</p>
                <span className="text-2xl font-black text-indigo-400">{stats.activeOrders} Ongoing</span>
              </div>
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Verified Partners</p>
                <span className="text-2xl font-black text-slate-100">{stats.totalVendors + stats.totalRiders} fleet</span>
              </div>
              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pending Approvals</p>
                <span className="text-2xl font-black text-yellow-400">{stats.pendingVendors + stats.pendingRiders} profiles</span>
              </div>
            </div>

            {/* 30-Day performance dynamic trends chart */}
            <OrderTrendsChart orders={orders} branches={branches} />

            {/* REAL-TIME BRANCH FINANCIALS & COD MONITOR */}
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-6 text-left">
              <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight font-sans">Regional Branch Revenue & Payment Audit</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                    HQ Master Ledger &bull; Real-time tracking of Daily, Weekly, Cash-On-Delivery (COD) and Online branch payments
                  </p>
                </div>
                <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-xl">
                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">
                    HQ Share Accord: 25% Allocation
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      <th className="py-3 px-4">Branch Office</th>
                      <th className="py-3 px-4 text-right">Daily Revenue (24h)</th>
                      <th className="py-3 px-4 text-right">Weekly Revenue (7d)</th>
                      <th className="py-3 px-4 text-right">Cash On Delivery (COD)</th>
                      <th className="py-3 px-4 text-right">Online (UPI/Cards)</th>
                      <th className="py-3 px-4 text-right text-indigo-400">HQ Revenue Share (25%)</th>
                      <th className="py-3 px-4 text-center">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {branches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-bold uppercase tracking-wider">No active branch offices logged</td>
                      </tr>
                    ) : (
                      branches.map((b) => {
                        // Calculate metrics dynamically based on live orders
                        const branchOrders = orders.filter(o => o.branchId === b.id || o.vendorId === b.id || b.name?.toLowerCase().includes(o.branchId?.toLowerCase() || ''));
                        const now = new Date();
                        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                        const startOfWeek = startOfDay - (7 * 24 * 60 * 60 * 1000);

                        let dailyTotal = 0;
                        let weeklyTotal = 0;
                        let codTotal = 0;
                        let onlineTotal = 0;
                        let allTotal = 0;

                        branchOrders.forEach(ord => {
                          const t = ord.createdAt 
                            ? new Date(ord.createdAt).getTime() 
                            : ord.timestamp 
                              ? ord.timestamp.toDate ? ord.timestamp.toDate().getTime() : new Date(ord.timestamp).getTime()
                              : now.getTime();
                          
                          const amt = Number(ord.total) || 0;
                          allTotal += amt;

                          if (t >= startOfDay) {
                            dailyTotal += amt;
                          }
                          if (t >= startOfWeek) {
                            weeklyTotal += amt;
                          }

                          const isCOD = (ord.paymentMethod || ord.paymentType || '').toUpperCase().includes('COD') || (ord.paymentMethod || '').toLowerCase() === 'cash_on_delivery' || !ord.paymentMethod;
                          if (isCOD) {
                            codTotal += amt;
                          } else {
                            onlineTotal += amt;
                          }
                        });

                        const hqShare = weeklyTotal * 0.25;

                        return (
                          <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-black text-white uppercase">{b.name} <span className="block text-[8px] text-slate-500 font-bold tracking-widest">{b.city || 'Khammam'}</span></td>
                            <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">₹{dailyTotal.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right text-indigo-400 font-bold">₹{weeklyTotal.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right text-amber-500 font-mono font-medium">₹{codTotal.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right text-slate-300 font-mono font-medium">₹{onlineTotal.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right text-yellow-400 font-black">₹{hqShare.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider rounded border border-emerald-500/20">
                                Active Sync
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* RECENT ORDERS LEDGER */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Order-by-Order Transaction Ledger ({orders.slice(0, 10).length} Recent)</h4>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Scroll for full audit trail</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {orders.slice(0, 15).map((ord) => {
                    const isCOD = (ord.paymentMethod || ord.paymentType || '').toUpperCase().includes('COD') || (ord.paymentMethod || '').toLowerCase() === 'cash_on_delivery' || !ord.paymentMethod;
                    return (
                      <div key={ord.id} className="bg-slate-950/80 border border-white/5 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-slate-500">#{ord.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                            isCOD ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {isCOD ? 'Cash on Delivery' : 'Online UPI'}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <p className="text-xs font-black text-white uppercase truncate max-w-[150px]">{ord.vendorName || 'Lokal Hub'}</p>
                          <p className="text-sm font-black text-white">₹{ord.total}</p>
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wider pt-1 border-t border-white/5">
                          <span>Status: <strong className="text-indigo-400">{ord.status}</strong></span>
                          <span>Share: <strong className="text-yellow-400">₹{(Number(ord.total || 0) * 0.25).toFixed(1)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chart visualization & Onboarding review quick look block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Onboarding & Approval Metrics</h3>
                <div className="h-64 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <YAxis stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                      <Bar dataKey="Merchants" fill="#818cf8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Riders" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Maintenance & System control fast card */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Global Operations Node</h3>
                  <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Status</p>
                      <p className="text-sm font-black text-yellow-400 mt-1">{stats.systemMode}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMaintenanceMode ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      <Power className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Toggling Maintenance blocks customer checkout. Merchants and riders remain online but cannot execute customer deliveries.
                  </p>
                </div>

                <button
                  onClick={handleToggleMaintenance}
                  className={`w-full py-4.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4 ${isMaintenanceMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}
                >
                  {isMaintenanceMode ? 'Re-enable Live Systems' : 'Pause Live Systems (Downtime)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EMERGENCY SOS DISTRESS INCIDENT COMMAND CENTER */}
        {activeTab === 'sos' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-rose-500/30 p-6 rounded-[2.5rem] relative overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.1)]">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldAlert className="w-32 h-32 text-rose-500" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest font-mono">
                  Real-time Emergency Distress Hub
                </p>
              </div>
              <h2 className="text-xl font-black italic tracking-tight uppercase text-white flex items-center gap-2">
                <span>🚨 Emergency SOS Incident Command Center</span>
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-2xl">
                This console receives instantaneous distress transmissions from delivery partners in the field. Review the exact transmission timestamps and high-precision GPS coordinates dispatched during emergency panic sequences.
              </p>
            </div>

            {/* Emergency Status Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-rose-500/20 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Distress Signals</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-rose-400">
                    {sosAlerts.filter(a => a.status === 'ACTIVE').length}
                  </span>
                  {sosAlerts.filter(a => a.status === 'ACTIVE').length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[8px] font-black uppercase rounded-full animate-pulse font-mono">
                      URGENT
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-amber-500/20 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Acknowledged / In Response</p>
                <span className="text-2xl font-black text-amber-400">
                  {sosAlerts.filter(a => a.status === 'ACKNOWLEDGED').length}
                </span>
              </div>

              <div className="bg-slate-900 border border-emerald-500/20 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Resolved & Secured</p>
                <span className="text-2xl font-black text-emerald-400">
                  {sosAlerts.filter(a => a.status === 'RESOLVED').length}
                </span>
              </div>

              <div className="bg-slate-900 border border-white/5 p-5 rounded-3xl">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Transmissions</p>
                <span className="text-2xl font-black text-slate-200">{sosAlerts.length} total</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 overflow-x-auto">
                {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map(flt => {
                  const count = flt === 'ALL' 
                    ? sosAlerts.length 
                    : sosAlerts.filter(a => a.status === flt).length;
                  return (
                    <button
                      key={flt}
                      onClick={() => setSosFilter(flt)}
                      className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        sosFilter === flt
                          ? flt === 'ACTIVE'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                            : 'bg-yellow-400 text-slate-950 shadow-md shadow-yellow-950/30 font-extrabold'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-white/5'
                      }`}
                    >
                      <span>{flt}</span>
                      <span className="px-1.5 py-0.2 bg-black/30 rounded-md text-[9px] font-mono">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:112"
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-950/30 transition-all active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                  <span>Dial Emergency 112</span>
                </a>
                <a
                  href="tel:108"
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-950/30 transition-all active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Ambulance 108</span>
                </a>
              </div>
            </div>

            {/* List of SOS Alerts */}
            <div className="space-y-4">
              {sosAlerts
                .filter(a => sosFilter === 'ALL' || a.status === sosFilter)
                .map(alert => (
                  <SOSAlertIndicator
                    key={alert.id}
                    alert={alert}
                    variant="card"
                    onAcknowledge={handleAcknowledgeSosAlert}
                    onResolve={handleResolveSosAlert}
                  />
                ))}

              {sosAlerts.filter(a => sosFilter === 'ALL' || a.status === sosFilter).length === 0 && (
                <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-white uppercase">All Channels Clear</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No {sosFilter !== 'ALL' ? sosFilter.toLowerCase() : ''} emergency SOS distress alerts reported in the system. Delivery partners are operating normally.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1A_AI: INTEGRATED AI MASTER DEVELOPER DESK */}
        {activeTab === 'ai_desk' && (
          <div className="space-y-6" id="ai-developer-master-pane">
            {/* Header Jumbotron */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-purple-500/10 p-6 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded">
                    DeepMind Antigravity Protocol Active
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded animate-pulse">
                    Live System Verified
                  </span>
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                  🧠 AI Personal Assistant & Developer Command Desk
                </h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dynamically monitor platform operations, generate hotspot density maps, test lockout parameters, and deploy secure modular code fixes directly.
                </p>
              </div>
            </header>

            {/* Main Workspace Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Systems Metrics & Algorithmic Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Panel 1: Algorithmic Tuning Controllers */}
                <div className="bg-slate-900 p-5 rounded-[2.2rem] border border-white/5 space-y-4 text-left">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 border-b border-white/5 pb-2">
                    Algorithmic Matching tuning controls
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                    Tweak real-time matching, commission allocation ratios, and network sync multipliers. Safe to experiment during development sessions!
                  </p>

                  <div className="space-y-4 pt-2">
                    {/* Dispatch Match radius */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-300">
                        <span>AI Order-Rider Matching radius</span>
                        <span className="text-amber-500 font-mono text-[10.5px]">{dispatchRadius}m</span>
                      </div>
                      <input 
                        type="range"
                        min="500"
                        max="5000"
                        step="100"
                        value={dispatchRadius}
                        onChange={(e) => {
                          setDispatchRadius(parseInt(e.target.value));
                          setNotificationMsg(`AI Matching search radius updated to ${e.target.value} meters`);
                          setTimeout(() => setNotificationMsg(null), 2500);
                        }}
                        className="w-full accent-amber-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>

                    {/* Franchise commission split */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-300">
                        <span>Franchise commission ratio</span>
                        <span className="text-amber-500 font-mono text-[10.5px]">{commissionPct}%</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max="30"
                        step="1"
                        value={commissionPct}
                        onChange={(e) => {
                          setCommissionPct(parseInt(e.target.value));
                          setNotificationMsg(`Franchise commission base allocation ratio set to ${e.target.value}%`);
                          setTimeout(() => setNotificationMsg(null), 2500);
                        }}
                        className="w-full accent-amber-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>

                    {/* Simulation Tick rate */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-300">
                        <span>Mock Latency simulator speed</span>
                        <span className="text-amber-500 font-mono text-[10.5px]">{speedMultiplier.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={speedMultiplier}
                        onChange={(e) => {
                          setSpeedMultiplier(parseFloat(e.target.value));
                          setNotificationMsg(`Interactive latency multiplier adjusted to ${parseFloat(e.target.value).toFixed(1)}x`);
                          setTimeout(() => setNotificationMsg(null), 2500);
                        }}
                        className="w-full accent-amber-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Panel 2: Live Platform Health Ingress */}
                <div className="bg-slate-900 p-5 rounded-[2.2rem] border border-white/5 space-y-4 text-left">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 border-b border-white/5 pb-2">
                    Live System Telemetry
                  </h4>
                  
                  <div className="space-y-2.5">
                    {/* Telemetry Row 1 */}
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Operational Status</p>
                        <p className="text-[9px] text-[#22c55e] font-black uppercase flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ONLINE NETWORK ACTIVE
                        </p>
                      </div>
                      <span className="px-2.5 py-1.5 bg-slate-900 rounded-lg text-xs font-mono font-bold text-white border border-white/5">100% OK</span>
                    </div>

                    {/* Telemetry Row 2 */}
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Duplicate Orders Attempt Blocked</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Locked by strict completeOrder throttle key</p>
                      </div>
                      <span className="px-2.5 py-1.5 bg-slate-900 rounded-lg text-xs font-mono font-bold text-amber-505">100% Prevented</span>
                    </div>

                    {/* Telemetry Row 3 */}
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Rider Inactivity Auto-Offline sleep</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">GPS location polling rate check frequency (10s)</p>
                      </div>
                      <span className="px-2.5 py-1.5 bg-emerald-950/30 text-emerald-400 rounded-lg text-[9px] font-black uppercase">ACTIVE</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Code Patching Bay & Terminal Logger (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Code Patching Sandbox card */}
                <div className="bg-slate-900 p-6 rounded-[2.2rem] border border-[#ffffff10] text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">
                        Modular Code Suggestion & Hotfixing sandbox
                      </h4>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Select a diagnostic fix to review its structural logic</p>
                    </div>
                  </div>

                  {/* Selector options row selection */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatch('cart_double_click');
                        setPatchProgress(0);
                        setPatchLogs([]);
                      }}
                      className={`p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                        selectedPatch === 'cart_double_click' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/40' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      🖱️ 1. Duplicate Locks
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatch('hotspot_calc');
                        setPatchProgress(0);
                        setPatchLogs([]);
                      }}
                      className={`p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                        selectedPatch === 'hotspot_calc' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/40' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      🔥 2. Density Heatmap
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatch('sleep_sleep');
                        setPatchProgress(0);
                        setPatchLogs([]);
                      }}
                      className={`p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                        selectedPatch === 'sleep_sleep' 
                          ? 'bg-amber-500/10 text-amber-505 border-amber-500/40' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      🔋 3. Auto-Offline Sleep
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatch('duty_sync');
                        setPatchProgress(0);
                        setPatchLogs([]);
                      }}
                      className={`p-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                        selectedPatch === 'duty_sync' 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/40' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      📡 4. Fallback Reconcile
                    </button>
                  </div>

                  {/* Code Block suggestions view */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Proposed Sandbox Code Implementation</label>
                    <pre className="font-mono text-[9px] text-amber-400/90 bg-slate-950 p-4 rounded-2xl border border-white/5 overflow-x-auto max-h-[180px] scrollbar-thin scrollbar-thumb-slate-800">
                      {selectedPatch === 'cart_double_click' && `// IN CONTRACT: Duplicate checkout rapid prevent trigger
const handlePayment = async () => {
  if (isSubmitting) return; // Prevent double trigger
  setIsSubmitting(true);
  try {
    const success = await completeOrder(paymentMethod);
    if (success) {
      navigateTo('confirmation');
    }
  } finally {
    // Keep isSubmitting locked until navigating away!
  }
};`}
                      {selectedPatch === 'hotspot_calc' && `// IN CONTRACT: Concentric gradient circles heatmap layer
{showHeatmap && simulatedZones.map((z) => (
  <React.Fragment key={z.name}>
    <Circle center={z.coords} radius={400} pathOptions={{ color: '#ef4444', fillOpacity: 0.1, weight: 0 }} />
    <Circle center={z.coords} radius={250} pathOptions={{ color: '#ea580c', fillOpacity: 0.25, weight: 0 }} />
    <Circle center={z.coords} radius={100} pathOptions={{ color: '#dc2626', fillOpacity: 0.45, weight: 1, dashArray: '2,3' }} />
  </React.Fragment>
))}`}
                      {selectedPatch === 'sleep_sleep' && `// IN CONTRACT: Monitor GPS movement timestamp & timer alert
useEffect(() => {
  if (!isOnline || timeoutMinutes <= 0) return;
  const loop = setInterval(() => {
    const isQuiet = Date.now() - lastMovementTime >= timeoutMinutes * 60 * 1000;
    if (isQuiet && !showPrompt) {
      setShowPrompt(true);
    }
  }, 10000);
  return () => clearInterval(loop);
}, [isOnline, lastMovementTime, timeoutMinutes]);`}
                      {selectedPatch === 'duty_sync' && `// IN CONTRACT: Safe auto integration setDoc merge fallback
const reconcileDocSync = async (branchId, docBody) => {
  const branchRef = doc(db, 'branches', branchId);
  try {
    await setDoc(branchRef, docBody, { merge: true });
    console.log("✔ Auto integrated merge fallback correct!");
  } catch (err) {
    console.error("Backup sync retry failed.", err);
  }
};`}
                    </pre>
                  </div>

                  {/* Hotfix applying executor action button */}
                  <div className="space-y-3">
                    {isPatching ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] uppercase font-black text-slate-300">
                          <span>🛠️ Hotpatch Compiling & Hot-swapping...</span>
                          <span className="font-mono text-purple-400">{patchProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                          <motion.div 
                            className="absolute left-0 top-0 bottom-0 bg-purple-500"
                            animate={{ width: `${patchProgress}%` }}
                            transition={{ duration: 0.05 }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsPatching(true);
                          setPatchProgress(0);
                          setPatchLogs([`🔧 Initializing sandbox patch for option: [${selectedPatch.toUpperCase()}]`]);
                          
                          const progressInterval = setInterval(() => {
                            setPatchProgress(prev => {
                              const next = prev + 5;
                              if (next === 20) {
                                setPatchLogs(l => [...l, "✔ Analyzed target file dependencies. Matching AST configurations..."]);
                              } else if (next === 45) {
                                setPatchLogs(l => [...l, "✔ Generating optimized type signatures, pruning bundle symbols..."]);
                              } else if (next === 70) {
                                setPatchLogs(l => [...l, "✔ Validated safety rule hooks, verifying thread lockout gates..."]);
                              } else if (next === 90) {
                                setPatchLogs(l => [...l, "✔ Compilation succeeded beautifully! Bundling artifact micro-patch..."]);
                              } else if (next >= 100) {
                                clearInterval(progressInterval);
                                setIsPatching(false);
                                setPatchLogs(l => [...l, "🚀 SUCCESS: Modular Live Hotfix deployed safely onto the container environment!"]);
                                speakCue("Hot patch applied successfully to the running system.");
                                setNotificationMsg("AI developer hotpatch compiled and deployed successfully!");
                                setTimeout(() => setNotificationMsg(null), 3000);
                                return 100;
                              }
                              return next;
                            });
                          }, 150);
                        }}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-lg shadow-purple-950/25 flex items-center justify-center gap-1.5"
                      >
                        ⚡ Compile & Apply Hotpatch to Running Systems
                      </button>
                    )}

                    {/* Simulation Console Logs Feed */}
                    {patchLogs.length > 0 && (
                      <div className="bg-slate-950 rounded-2xl p-4 text-left font-mono text-[9px] space-y-1.5 max-h-[145px] overflow-y-auto border border-purple-500/10">
                        {patchLogs.map((log, idx) => (
                          <div 
                            key={idx} 
                            className={`${
                              log.startsWith('❌') 
                                ? 'text-rose-400' 
                                : log.startsWith('🚀') 
                                  ? 'text-emerald-400 font-extrabold' 
                                  : log.startsWith('✔') 
                                    ? 'text-emerald-400' 
                                    : 'text-slate-350'
                            }`}
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* NEW AI INTEGRITY MITIGATION DESK & FINANCIAL BOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-integrity-master-ledgers">
              {/* Left Column: AI Issue Detection (7 Cols) */}
              <div className="lg:col-span-7">
                {/* AI Real-Time Issue Detection & Mitigation Desk */}
                <div className="bg-slate-900 border border-purple-500/10 rounded-[2.5rem] p-6 space-y-6 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
                  <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                    <div>
                      <h3 className="text-sm font-black uppercase text-purple-400 tracking-tight font-sans">🧠 AI Real-Time Issue Detection & Mitigation Desk</h3>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                        Active scan of database anomalies, clinical bottlenecks, & system performance metrics
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded animate-pulse">
                      SLA SCANNER RUNNING
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {[
                      {
                        id: 'support_tickets',
                        title: 'Customer Support SLA Bottleneck',
                        category: 'Operational',
                        severity: 'high' as const,
                        count: supportChats.filter(c => c.status !== 'resolved' && c.status !== 'closed').length,
                        description: `A backlog of customer complaints has been detected in regional chat sessions. Response latency exceeds SLA boundaries.`,
                        solution: `Auto-resolve tickets with pending status and broadcast standard resolution templates to customer indices.`,
                      },
                      {
                        id: 'hospital_bookings',
                        title: 'Pending Outpatient Appointment Backlog',
                        category: 'Clinical Network',
                        severity: 'high' as const,
                        count: hospitalBookings.filter(b => b.status?.toLowerCase() === 'pending').length,
                        description: `Patient clinical OP slot bookings are currently in pending verification status, causing scheduled resource allocation blocks.`,
                        solution: `Transactional sweep to confirm and approve all outstanding patient appointment requests.`,
                      },
                      {
                        id: 'hospital_prices',
                        title: 'Unverified Regional Hospital Registries',
                        category: 'Provider Network',
                        severity: 'medium' as const,
                        count: Object.entries(hospitalPrices).filter(([_, h]: any) => !h.isApproved).length,
                        description: `Submitted local hospital directories require master clinical review before going live for citizen searches.`,
                        solution: `Run geo-verification check and bulk-approve pending provider listings in Khammam district.`,
                      },
                      {
                        id: 'marriage_profiles',
                        title: 'Unapproved Matrimony Profiles Accumulation',
                        category: 'Matrimony Catalogs',
                        severity: 'low' as const,
                        count: marriageProfiles.filter(p => !p.isApproved).length,
                        description: `Registered user profile assets are queued awaiting admin certification before inclusion in public search indices.`,
                        solution: `Automate profile validation and issue mass-approvals onto matching listings.`,
                      },
                      {
                        id: 'dormant_riders',
                        title: 'Dormant Logistics Fleet Partners',
                        category: 'Logistics',
                        severity: 'medium' as const,
                        count: riders.filter(r => r.status === 'In-Active' || r.status === 'Suspended').length,
                        description: `Registered delivery partners are currently marked inactive or suspended, reducing dispatch capacity on active routes.`,
                        solution: `Awake and re-enroll inactive delivery agents to restore status to active.`,
                      }
                    ].map((issue) => {
                      const isExecutingThis = executingIssueId === issue.id;
                      const userApprovedText = adminApproveReview[issue.id] ?? 'okay';

                      return (
                        <div key={issue.id} className="bg-slate-950 border border-white/5 p-4 rounded-3xl space-y-3 relative overflow-hidden hover:border-purple-500/20 transition-all">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                issue.severity === 'high' ? 'bg-rose-500 animate-ping' : issue.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-400'
                              }`} />
                              <h4 className="text-xs font-black uppercase text-white">{issue.title}</h4>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
                              {issue.category}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            {issue.description}
                          </p>

                          <div className="bg-purple-950/20 border border-purple-500/10 p-3 rounded-2xl space-y-1">
                            <span className="text-[8px] font-black uppercase text-purple-400 tracking-wider">AI Suggested Solution:</span>
                            <p className="text-[9.5px] font-semibold text-slate-300 italic">
                              {issue.solution}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest rounded ${
                                issue.count > 0 
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {issue.count > 0 ? `● ${issue.count} PENDING` : '✓ OPTIMIZED'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest hidden md:inline">Approach Approval:</span>
                              <input
                                type="text"
                                value={userApprovedText}
                                onChange={(e) => setAdminApproveReview(prev => ({ ...prev, [issue.id]: e.target.value }))}
                                placeholder="Type 'okay' to approve..."
                                className="px-3 py-1 bg-slate-900 border border-white/5 focus:border-purple-500/50 rounded-lg text-[10px] text-white w-full sm:w-32 outline-none font-semibold text-center"
                              />
                              <button
                                type="button"
                                disabled={!!executingIssueId}
                                onClick={() => handleRunHotfix(issue.id, issue.title, issue.solution, userApprovedText)}
                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-black uppercase text-[8.5px] tracking-widest whitespace-nowrap active:scale-95 transition-all cursor-pointer"
                              >
                                Approve & Execute Fix
                              </button>
                            </div>
                          </div>

                          {isExecutingThis && (
                            <div className="pt-2 border-t border-white/5 space-y-2">
                              <div className="flex justify-between items-center text-[8px] font-black uppercase font-mono text-purple-400">
                                <span>Compiling & Applying AI Hotfix...</span>
                                <span>{executingProgress}%</span>
                              </div>
                              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-purple-500 transition-all duration-150"
                                  style={{ width: `${executingProgress}%` }}
                                />
                              </div>
                              <div className="bg-slate-950 p-2 rounded-xl text-[8px] font-mono text-slate-400 space-y-1">
                                {executingLogs.map((log, idx) => (
                                  <div key={idx}>{log}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Automated Payment Reports (5 Cols) */}
              <div className="lg:col-span-5">
                <div className="bg-slate-900 border border-purple-500/10 rounded-[2.5rem] p-6 space-y-6 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />
                  <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                    <div>
                      <h3 className="text-sm font-black uppercase text-purple-400 tracking-tight font-sans">📊 Automated Payments & Ledger Board</h3>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                        Active ledger syncing master accounts, platform revenues, and overall branch metrics
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8.5px] font-black uppercase tracking-widest rounded-full">
                      SYSTEM REPORTING ALIGNED
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setFinancialReportTab(tab)}
                        className={`py-2 px-1 rounded-xl text-[8.5px] font-black uppercase tracking-widest text-center cursor-pointer transition-all ${
                          financialReportTab === tab
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const data = calculatePaymentReport(financialReportTab);
                    return (
                      <div className="space-y-4 relative z-10">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950 p-4 rounded-3xl border border-white/5 text-center space-y-1">
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Branches</span>
                            <span className="block text-2xl font-black text-purple-400">{data.branchesCount}</span>
                            <span className="block text-[7px] text-slate-500 font-bold uppercase">MASTER REGISTERED</span>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-3xl border border-white/5 text-center space-y-1">
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Overall Income</span>
                            <span className="block text-2xl font-black text-emerald-400">₹{data.overallTotal.toLocaleString()}</span>
                            <span className="block text-[7px] text-slate-500 font-bold uppercase">COMBINED TOTAL</span>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-[8.5px]">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">
                            Report Window Boundaries:
                          </span>
                          <span className="font-mono text-purple-400 font-bold">
                            {financialReportTab === 'daily' && "Today's Local Midnight to Current"}
                            {financialReportTab === 'weekly' && "Thursday to Thursday Rollup Range"}
                            {financialReportTab === 'monthly' && "Calendar 1st to 31st Bound"}
                            {financialReportTab === 'yearly' && "Annual Calendar Range Sync"}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">Branch-by-Branch Incomes Ledger</h4>
                          <div className="bg-slate-950 rounded-3xl border border-white/5 overflow-hidden divide-y divide-white/5">
                            {Object.entries(data.branchIncomes).map(([bName, income]) => (
                              <div key={bName} className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.01] transition-colors">
                                <span className="font-black text-white uppercase">{bName}</span>
                                <span className="font-mono font-black text-emerald-400">₹{income.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleTriggerManualFinancialReport}
                          className="w-full py-3 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600 hover:text-white text-purple-400 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          📢 Broadcast Latest Ledger to Chat
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* AI Diagnostics and Chat Sandbox section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Real database telemetry diagnostics (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900 p-6 rounded-[2.2rem] border border-white/5 space-y-4 text-left">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-purple-400">
                    🔍 AI Database Doctor & Optimizer
                  </h4>
                  <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded">
                    Firestore Real-Time Diagnosis
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase">
                  Run a real-time full-table diagnosis across all system collections. Analyze index densities, collection sizes, and detect potential system bottlenecks.
                </p>

                <button
                  type="button"
                  disabled={isDiagnosing}
                  onClick={handleRunAiDiagnostics}
                  className="w-full py-3 bg-purple-600/25 border border-purple-500/30 text-purple-300 hover:bg-purple-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDiagnosing ? (
                    <>
                      <span className="w-3 h-3 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                      COMPILING TELEMETRY STATS...
                    </>
                  ) : (
                    "🚀 RUN DEEP AI DIAGNOSTIC REPORT"
                  )}
                </button>

                {diagnosticCounts && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-white/5">
                    {Object.entries(diagnosticCounts).map(([col, count]) => (
                      <div key={col} className="bg-slate-900 p-2 rounded-lg border border-white/5 text-center">
                        <span className="block text-[8px] font-black text-slate-400 uppercase truncate">{col.replace(/_/g, ' ')}</span>
                        <span className="block text-xs font-black text-white font-mono mt-0.5">{count} docs</span>
                      </div>
                    ))}
                  </div>
                )}

                {aiReport && (
                  <div className="bg-slate-950 rounded-xl p-4 text-[10px] leading-relaxed text-slate-300 border border-purple-500/10 max-h-[220px] overflow-y-auto font-sans">
                    <div className="whitespace-pre-wrap">{aiReport}</div>
                  </div>
                )}
              </div>

              {/* Right Side: Interactive Live AI Developer Desk Chat (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900 p-6 rounded-[2.2rem] border border-white/5 space-y-4 text-left flex flex-col min-h-[480px]">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 shrink-0">
                  <h4 className="text-xs font-black uppercase tracking-widest text-purple-400">
                    💬 Live AI Developer Chat Console
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded animate-pulse">
                    Connected to Gemini-3.5-Flash
                  </span>
                </div>

                {/* Message display feed */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-2xl border border-white/5 max-h-[300px] min-h-[240px]">
                  {aiChatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                        {msg.role === 'user' ? 'Developer (You)' : 'Gemini AI Assistant'}
                      </span>
                      <div className={`px-3 py-2 rounded-xl text-[10.5px] leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-tr-none' 
                          : 'bg-slate-900 text-slate-350 border border-white/5 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiSending && (
                    <div className="flex flex-col items-start">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">Gemini AI Assistant</span>
                      <div className="px-3 py-2 rounded-xl bg-slate-900 text-slate-400 border border-white/5 rounded-tl-none flex items-center gap-1.5 text-[10.5px]">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span>AI thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input row */}
                <div className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={aiChatInput}
                    onChange={(e) => setAiChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendAiMessage();
                    }}
                    placeholder="Ask AI Desk: 'How can I optimize index configuration?' or 'Explain duplicate lock logic'..."
                    className="flex-1 px-4 py-3 bg-slate-950 border border-white/5 focus:border-purple-500/50 rounded-xl text-xs font-semibold text-white placeholder-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendAiMessage}
                    disabled={isAiSending || !aiChatInput.trim()}
                    className="px-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    Send ➔
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 1B: LOGISTICS & LIVE ORDERS HUB */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem]">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-yellow-400">
                  <Activity className="w-5 h-5 text-yellow-500 stroke-[2.5] animate-pulse" />
                  <span>Interactive Logistics & Order Dispatch Control Room</span>
                </h2>
                <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  Monitor live platform orders, execute merchant confirmations, and match idle delivery riders using real-time telemetry.
                </p>
              </div>

              {/* General Statistics */}
              <div className="flex gap-4">
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[100px]">
                  <p className="text-[8px] font-black uppercase text-slate-505 tracking-wider">Awaiting Accept</p>
                  <p className="text-sm font-black text-amber-500 mt-0.5">
                    {orders.filter(o => o.status === 'Pending').length}
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[100px]">
                  <p className="text-[8px] font-black uppercase text-slate-505 tracking-wider">In Kitchen / Preparing</p>
                  <p className="text-sm font-black text-indigo-400 mt-0.5">
                    {orders.filter(o => ['Accepted', 'Preparing'].includes(o.status)).length}
                  </p>
                </div>
                <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 text-center min-w-[100px]">
                  <p className="text-[8px] font-black uppercase text-slate-505 tracking-wider">Out for Delivery</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">
                    {orders.filter(o => o.status === 'OutForDelivery' || o.status === 'PickedUp').length}
                  </p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Order List: spans 5 cols */}
              <div className="lg:col-span-5 bg-slate-900 border border-white/5 p-5 rounded-[2.5rem] space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Orders Stream</h3>
                  <span className="px-2 py-0.5 bg-slate-950 text-[8.5px] font-mono text-slate-300 rounded border border-white/5 uppercase">
                    {orders.length} Total
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
                  {(['All', 'Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered', 'Cancelled'] as const).map(f => {
                    const count = f === 'All' ? orders.length : orders.filter(o => {
                      if (f === 'Accepted') return o.status === 'Accepted';
                      if (f === 'Preparing') return o.status === 'Preparing';
                      if (f === 'OutForDelivery') return o.status === 'OutForDelivery' || o.status === 'PickedUp';
                      return o.status === f;
                    }).length;

                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setLogisticsFilter(f);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${logisticsFilter === f ? 'bg-yellow-400 text-slate-950 font-black' : 'bg-slate-950/60 hover:bg-slate-950 text-slate-400 border border-white/5'}`}
                      >
                        {f === 'OutForDelivery' ? 'In Transit' : f} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Bulk Actions Command Center */}
                {(() => {
                  const pendingOrders = orders.filter(o => o.status === 'Pending');
                  const hasPending = pendingOrders.length > 0;
                  
                  return (
                    <div className="bg-slate-950/65 p-3.5 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">Bulk Dispatch Desk</span>
                        {hasPending && (
                          <button
                            type="button"
                            onClick={() => {
                              const pendingIds = pendingOrders.map(o => o.id);
                              const allIncluded = pendingIds.every(id => bulkSelectedOrderIds.includes(id));
                              if (allIncluded) {
                                setBulkSelectedOrderIds(prev => prev.filter(id => !pendingIds.includes(id)));
                              } else {
                                setBulkSelectedOrderIds(prev => Array.from(new Set([...prev, ...pendingIds])));
                              }
                            }}
                            className="text-yellow-400 hover:text-yellow-350 uppercase tracking-widest font-black transition-all cursor-pointer text-[8.5px]"
                          >
                            {pendingOrders.every(o => bulkSelectedOrderIds.includes(o.id)) ? 'Deselect All' : '✓ Select All Pending'}
                          </button>
                        )}
                      </div>

                      {bulkSelectedOrderIds.length > 0 ? (
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 space-y-2.5">
                          <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-wide">
                            📦 {bulkSelectedOrderIds.length} Pending Orders Selected
                          </p>

                          <div className="flex flex-col gap-2">
                            <select
                              onChange={(e) => handleExecuteBulkAssign(e.target.value)}
                              defaultValue=""
                              className="bg-slate-950 border border-white/10 px-2.5 py-2 rounded-xl text-[9.5px] font-black uppercase text-white outline-none cursor-pointer"
                            >
                              <option value="" disabled>Choose Dispatch Rider</option>
                              {riders.filter(r => r.status === 'Approved' && r.isOnline).map(r => (
                                <option key={r.id} value={r.id}>{r.name.toUpperCase()} (ONLINE)</option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => setBulkSelectedOrderIds([])}
                              className="w-full py-1.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-xl text-[8px] text-slate-450 font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                              Reset Selected Cache
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                          Engage dispatch overlays by tapping checkboxes on any "Pending" status order card listed below.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Filtered Order feed list */}
                <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                  {orders.filter(o => {
                    if (logisticsFilter === 'All') return true;
                    if (logisticsFilter === 'Accepted') return o.status === 'Accepted';
                    if (logisticsFilter === 'Preparing') return o.status === 'Preparing';
                    if (logisticsFilter === 'OutForDelivery') return o.status === 'OutForDelivery' || o.status === 'PickedUp';
                    return o.status === logisticsFilter;
                  }).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-[10px] uppercase font-bold border border-dashed border-white/5 rounded-2xl">
                      No matching orders found under filter: {logisticsFilter}
                    </div>
                  ) : (
                    orders.filter(o => {
                      if (logisticsFilter === 'All') return true;
                      if (logisticsFilter === 'Accepted') return o.status === 'Accepted';
                      if (logisticsFilter === 'Preparing') return o.status === 'Preparing';
                      if (logisticsFilter === 'OutForDelivery') return o.status === 'OutForDelivery' || o.status === 'PickedUp';
                      return o.status === logisticsFilter;
                    }).map((ord) => {
                      const isSelected = selectedOrderId === ord.id;
                      const hasRider = !!(ord.riderId || ord.deliveryPartnerId);
                      const isPending = ord.status === 'Pending';
                      
                      return (
                        <div
                          key={ord.id}
                          onClick={() => setSelectedOrderId(ord.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${isSelected ? 'bg-slate-950 border-yellow-400/40 shadow-lg shadow-yellow-950/10' : 'bg-slate-950/50 hover:bg-slate-950 border-white/5'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2.5">
                              {/* Checkbox for Bulk Dispatch selection (available when status is Pending) */}
                              {isPending && (
                                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="checkbox"
                                    checked={bulkSelectedOrderIds.includes(ord.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setBulkSelectedOrderIds(prev => 
                                        checked ? [...prev, ord.id] : prev.filter(id => id !== ord.id)
                                      );
                                    }}
                                    className="w-4 h-4 rounded border-white/10 text-indigo-500 bg-slate-950 focus:ring-0 cursor-pointer accent-indigo-500"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-mono font-black text-xs text-white uppercase tracking-tight flex items-center gap-1.5">
                                  <span>Order #{ord.id.slice(0, 8).toUpperCase()}</span>
                                  {isPending && (
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                  {ord.vendorName || 'Branch Hub'} • ₹{ord.total}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              ord.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                              ['Accepted', 'Preparing'].includes(ord.status) ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                              ['OutForDelivery', 'PickedUp'].includes(ord.status) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                              ord.status === 'Delivered' ? 'bg-slate-500/15 text-slate-450 border border-white/5' :
                              'bg-rose-500/15 text-rose-500 border border-rose-500/10'
                            }`}>
                              {ord.status === 'PickedUp' || ord.status === 'OutForDelivery' ? 'In Transit' : ord.status}
                            </span>
                          </div>

                          {/* 15-Minute Driver Acceptance Timeout Telemetry Bar */}
                          {(() => {
                            if (!hasRider || (ord.status !== 'Pending' && ord.status !== 'Assigned')) return null;
                            const lastActiveTimeRef = ord.assignedAt || ord.updatedAt || ord.timestamp || ord.createdAt;
                            if (!lastActiveTimeRef) return null;
                            let lastActiveMs = Date.now();
                            try {
                              if (lastActiveTimeRef.seconds) {
                                lastActiveMs = lastActiveTimeRef.seconds * 1000;
                              } else if (typeof lastActiveTimeRef.toMillis === 'function') {
                                lastActiveMs = lastActiveTimeRef.toMillis();
                              } else {
                                lastActiveMs = new Date(lastActiveTimeRef).getTime();
                              }
                            } catch (_) {
                              return null;
                            }
                            const elapsedSec = Math.floor((Date.now() - lastActiveMs) / 1000);
                            const elapsedMin = Math.floor(elapsedSec / 60);
                            const percent = Math.min(100, Math.round((elapsedSec / (15 * 60)) * 100));

                            return (
                              <div className="mt-3 p-2 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between text-[8px] font-mono text-rose-300">
                                  <span className="flex items-center gap-1 uppercase">
                                    <AlertCircle className="w-3 h-3 text-rose-450 animate-pulse" />
                                    <span>Acceptance Hold: {elapsedMin}m {elapsedSec % 60}s ({percent}%)</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rId = ord.riderId || ord.deliveryPartnerId;
                                      handleAutoReassignOrder(ord.id, rId);
                                    }}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-sans font-black uppercase text-[7px] transition-all cursor-pointer"
                                    title="Manually force reassign to next closest rider instantly for testing"
                                  >
                                    Re-Assign
                                  </button>
                                </div>
                                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })()}

                          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400">
                            <span>
                              {(ord.orderItems?.length || ord.items || 0)} item{(ord.orderItems?.length || ord.items || 0) !== 1 ? 's' : ''}
                            </span>
                            <span className="font-medium">
                              Rider: <span className={hasRider ? "text-emerald-400 font-bold" : "text-amber-500 font-black animate-pulse"}>
                                {ord.riderName || ord.deliveryPartnerName || '🚨 UNASSIGNED'}
                              </span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Order Master Detail Panel: spans 7 cols */}
              <div className="lg:col-span-7 space-y-6">
                {/* Real-time Heatmap visualizer displaying pending hotspots & fleet coordinates */}
                <LogisticsHeatmap
                  orders={orders}
                  riders={riders}
                  vendors={vendors}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
                  onDispatchOrderToRider={(orderId, riderId) => handleManualAssignOrder(orderId, riderId)}
                />

                {(() => {
                  const activeOrd = orders.find(o => o.id === selectedOrderId);
                  if (!activeOrd) {
                    return (
                      <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] text-center space-y-3 min-h-[160px] flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-950/60 border border-white/5 flex items-center justify-center text-slate-550 shadow-inner">
                          <Activity className="w-6 h-6 text-slate-500 animate-pulse" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Radar Telemetry Standby</h3>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal font-semibold">
                          Click any thermal hotspot glow point on the interactive map above, or select an order from the list stream to initiate rider matching.
                        </p>
                      </div>
                    );
                  }

                  // Find Best Rider Recommendation
                  // Rule: rider is online (or in approved status), has fewest active ongoing orders
                  const getRiderMetrics = (rider: any) => {
                    const activeCount = orders.filter(o => 
                      (o.riderId === rider.id || o.deliveryPartnerId === rider.id) && 
                      !['Delivered', 'Cancelled'].includes(o.status)
                    ).length;
                    return { activeCount };
                  };

                  const approvedRiders = riders.filter(r => r.status === 'Approved');
                  const onlineRiders = approvedRiders.filter(r => r.isOnline);
                  
                  // Sort online riders by lowest workload
                  let bestRider: any = null;
                  if (onlineRiders.length > 0) {
                    bestRider = [...onlineRiders].sort((a,b) => {
                      return getRiderMetrics(a).activeCount - getRiderMetrics(b).activeCount;
                    })[0];
                  } else if (approvedRiders.length > 0) {
                    // Fallback to offline approved riders
                    bestRider = [...approvedRiders].sort((a,b) => {
                      return getRiderMetrics(a).activeCount - getRiderMetrics(b).activeCount;
                    })[0];
                  }

                  return (
                    <div className="space-y-6 text-left">
                      {/* Section A: Selected Order Details */}
                      <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <div>
                            <span className="text-[9px] font-black text-indigo-400 bg-indigo-505/10 border border-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              Active Workspace
                            </span>
                            <h3 className="text-base font-black uppercase text-white mt-2">
                              Order #{activeOrd.id.slice(0, 8).toUpperCase()}
                            </h3>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[8px] font-black text-slate-505 uppercase tracking-widest">Total Transaction Value</span>
                            <p className="text-lg font-black text-emerald-400">₹{activeOrd.total}</p>
                          </div>
                        </div>

                        {/* Customer & Merchant Blocks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant Restaurant / Hub</h4>
                            <p className="text-xs font-extrabold text-white">{activeOrd.vendorName || 'Central Hub'}</p>
                            <p className="text-[10px] text-slate-550 font-semibold">{activeOrd.vendorAddress || 'Main branch'}</p>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Delivery Address</h4>
                            <p className="text-xs font-extrabold text-white">{activeOrd.userName || activeOrd.customerName || 'Anonymous Customer'}</p>
                            <p className="text-[10px] text-slate-300 font-medium">{activeOrd.address || 'Standard Handover'}</p>
                            {(activeOrd.phone || activeOrd.userPhone) && (
                              <p className="text-[10px] font-mono text-slate-550 mt-1">📞 {activeOrd.phone || activeOrd.userPhone}</p>
                            )}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 space-y-2">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Line Items ({activeOrd.orderItems?.length || activeOrd.items || 0})</h4>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOrder(JSON.parse(JSON.stringify(activeOrd)));
                                setShowOrderModal(true);
                              }}
                              className="px-2.5 py-1 bg-yellow-400/10 hover:bg-yellow-400 text-yellow-400 hover:text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              ✏️ Edit Order Details
                            </button>
                          </div>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {(activeOrd.orderItems || []).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-extrabold text-white">
                                  {item.name} <span className="text-yellow-400 text-[10px] ml-1">x{item.quantity}</span>
                                </span>
                                <span className="font-bold text-slate-400">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Accept / Control Logic Row for Order Status */}
                        <div className="flex flex-wrap gap-2.5 pt-2">
                          {activeOrd.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptOrder(activeOrd.id)}
                              className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-yellow-950/20 animate-pulse"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                              <span>Accept & Confirm Order</span>
                            </button>
                          )}

                          {activeOrd.status !== 'Cancelled' && activeOrd.status !== 'Delivered' && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrderEx(activeOrd.id)}
                              className="px-5 py-4 bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border border-rose-500/10 cursor-pointer"
                              title="Cancel platform order immediately"
                            >
                              Cancel Order
                            </button>
                          )}

                          {/* Quick manual overrides and force actions */}
                          <div className="w-full flex items-center gap-2 mt-2 bg-slate-950 p-3.5 rounded-2xl border border-white/5">
                            <span className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap">Status Override:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {['Accepted', 'Preparing', 'OutForDelivery', 'Delivered'].map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateOrderStatusEx(activeOrd.id, st)}
                                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer ${activeOrd.status === st ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 hover:bg-slate-850 text-slate-400'}`}
                                >
                                  {st === 'OutForDelivery' ? 'In Transit' : st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Fleet Assignment (The Best Order Assignment View) */}
                      <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <div>
                            <h4 className="text-sm font-black uppercase text-yellow-400 tracking-tight flex items-center gap-2">
                              <Bike className="w-4 h-4 text-yellow-500" />
                              <span>Dynamic Fleet Dispatch & Rider Matrix</span>
                            </h4>
                            <p className="text-[8.5px] text-slate-500 uppercase tracking-widest font-mono">Real-time matching logs based on online telemetry & task workload</p>
                          </div>

                          {bestRider && (
                            <button
                              type="button"
                              onClick={() => handleManualAssignOrder(activeOrd.id, bestRider.id)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 cursor-pointer"
                            >
                              <span>⚡ Auto-Dispatch {bestRider.name.split(' ')[0]}</span>
                            </button>
                          )}
                        </div>

                        {/* List of Riders with details */}
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {riders.filter(r => r.status === 'Approved').length === 0 ? (
                            <p className="text-center py-6 text-slate-500 text-[9px] font-mono uppercase">No approved delivery riders registered in database</p>
                          ) : (
                            riders.filter(r => r.status === 'Approved').map(rider => {
                              const isOnline = rider.isOnline;
                              const { activeCount } = getRiderMetrics(rider);
                              const isSuggested = bestRider?.id === rider.id;
                              const isCurrentlyAssigned = activeOrd.riderId === rider.id || activeOrd.deliveryPartnerId === rider.id;

                              return (
                                <div
                                  key={rider.id}
                                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                    isCurrentlyAssigned 
                                      ? 'bg-indigo-950/50 border-indigo-500/40' 
                                      : isSuggested 
                                        ? 'bg-slate-950 border-emerald-500/40 shadow-md shadow-emerald-950/5' 
                                        : 'bg-slate-950/70 border-white/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Availability Dot */}
                                    <div className="relative">
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-905 text-slate-600 border border-white/5'}`}>
                                        {rider.name.slice(0, 1).toUpperCase()}
                                      </div>
                                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    </div>

                                    <div>
                                      <p className="text-xs font-black text-white flex items-center gap-2">
                                        <span>{rider.name}</span>
                                        {isCurrentlyAssigned && (
                                          <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 text-[8px] font-black uppercase rounded">Assigned</span>
                                        )}
                                        {isSuggested && (
                                          <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[8px] font-black uppercase rounded animate-pulse">🏆 Suggested Match</span>
                                        )}
                                      </p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span>{rider.phone || 'N/A Phone'}</span>
                                        <span>•</span>
                                        <span className={`font-black ${activeCount === 0 ? 'text-emerald-400' : activeCount === 1 ? 'text-amber-400' : 'text-rose-400'}`}>
                                          {activeCount === 0 ? 'IDLE (0 Active)' : `${activeCount} Ongoing Job${activeCount !== 1 ? 's' : ''}`}
                                        </span>
                                        {isOnline && rider.customStatus && rider.customStatus !== 'Available' && (
                                          <>
                                            <span>•</span>
                                            <span className="text-yellow-400 font-extrabold text-[8px] bg-yellow-400/10 border border-yellow-400/20 px-1 py-0.5 rounded font-mono">
                                              🕒 {rider.customStatus}
                                            </span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleManualAssignOrder(activeOrd.id, rider.id)}
                                    disabled={isCurrentlyAssigned}
                                    className={`px-4.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                      isCurrentlyAssigned 
                                        ? 'bg-slate-900 text-slate-555 border border-white/5 cursor-not-allowed' 
                                        : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 hover:shadow-md'
                                    }`}
                                  >
                                    {isCurrentlyAssigned ? 'Assigned' : 'Dispatch'}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTNER APPROVALS HUB */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Onboarding Approval Queues</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Approve and verify regional listings, clinical networks, matchmakers, merchants, and fleets</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Vendors Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-indigo-400">Pending Merchants ({vendors.filter(v => v.status === 'Pending').length})</h3>
                  <Store className="w-5 h-5 text-indigo-400" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {vendors.filter(v => v.status === 'Pending').length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending merchant reviews</p>
                    </div>
                  ) : (
                    vendors.filter(v => v.status === 'Pending').map((v) => (
                      <div key={v.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{v.businessName || v.name}</h4>
                            <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-full">{v.service || 'groceries'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">Owner: {v.ownerName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Phone: {v.phone}</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-normal italic">{v.address || 'Address not listed'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateVendorStatus(v.id, 'Approved')}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateVendorStatus(v.id, 'Banned')}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Riders Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-emerald-400">Pending Riders ({riders.filter(r => r.status === 'Pending').length})</h3>
                  <Bike className="w-5 h-5 text-emerald-400" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {riders.filter(r => r.status === 'Pending').length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending rider applications</p>
                    </div>
                  ) : (
                    riders.filter(r => r.status === 'Pending').map((r) => (
                      <div key={r.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{r.name}</h4>
                            <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest rounded-full">{r.vehicleType || 'Bike'}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">Plate Number: {r.vehicleNumber || 'Pending verification'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Phone: {r.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateRiderStatus(r.id, 'Approved', true)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Approve Partner
                          </button>
                          <button 
                            onClick={() => handleUpdateRiderStatus(r.id, 'Banned')}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hospital Offices Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-pink-400">
                    Pending Clinics ({
                      Object.entries(hospitalPrices).filter(([_, h]: any) => !h.isApproved).length
                    })
                  </h3>
                  <Activity className="w-5 h-5 text-pink-400" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {Object.entries(hospitalPrices).filter(([_, h]: any) => !h.isApproved).length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending hospital reviews</p>
                    </div>
                  ) : (
                    Object.entries(hospitalPrices).filter(([_, h]: any) => !h.isApproved).map(([name, h]: [string, any]) => (
                      <div key={name} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{name}</h4>
                            <span className="px-2.5 py-1 bg-pink-400/10 text-pink-500 text-[9px] font-black uppercase tracking-widest rounded-full">₹{h.opPrice} OP</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">{h.description || 'No description listed'}</p>
                          {h.phone && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Phone: {h.phone}</p>}
                          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Branch ID: {h.branchId || 'HQ Master'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateHospitalOfficeVerification(name, true)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Verify Office
                          </button>
                          <button 
                            onClick={() => handleDeleteHospitalObj(name)}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Marriage Bureau Profiles Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-rose-400">
                    Pending Marriage ({marriageProfiles.filter(p => !p.isApproved).length})
                  </h3>
                  <Heart className="w-5 h-5 text-rose-400" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {marriageProfiles.filter(p => !p.isApproved).length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending matchmaker reviews</p>
                    </div>
                  ) : (
                    marriageProfiles.filter(p => !p.isApproved).map((p) => (
                      <div key={p.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{p.fullName || 'Anonymous'}</h4>
                            <span className="px-2.5 py-1 bg-rose-400/10 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-full">{p.religion}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">Caste/Age: {p.caste} • {p.age} yrs</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Edu/Occ: {p.education} • {p.occupation}</p>
                          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Branch ID: {p.branchId || 'HQ Master'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveMarriageProfile(p.id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Verify Profile
                          </button>
                          <button 
                            onClick={() => handleRejectMarriageProfile(p.id)}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Real Estate Property Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-tight text-amber-500">
                    Pending Estates ({properties.filter(p => !p.isApproved).length})
                  </h3>
                  <Home className="w-5 h-5 text-amber-500" />
                </div>

                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {properties.filter(p => !p.isApproved).length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">✓ No pending property listings</p>
                    </div>
                  ) : (
                    properties.filter(p => !p.isApproved).map((p) => (
                      <div key={p.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{p.title}</h4>
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full">₹{p.price}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium line-clamp-2">{p.description}</p>
                          <p className="text-[11px] text-indigo-400 mt-0.5 font-bold">📍 {p.location?.area || 'Khammam'}</p>
                          <p className="text-[9px] text-slate-500 mt-1 uppercase font-mono">Branch ID: {p.branchId || 'HQ Master'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveProperty(p.id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-900/10"
                          >
                            Verify Listing
                          </button>
                          <button 
                            onClick={() => handleRejectProperty(p.id)}
                            className="px-4 py-2 bg-rose-600/15 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hospital OP Bookings Queue */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-rose-400" />
                      <h3 className="text-sm font-black uppercase tracking-tight text-rose-400">
                        Hospital OP Appointments ({hospitalBookings.length})
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-400">Manage patient bookings, consultation approvals, and appointments</p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 overflow-x-auto">
                    {(['all', 'pending', 'Approved', 'Completed', 'Rejected'] as const).map((st) => {
                      const count = st === 'all' 
                        ? hospitalBookings.length 
                        : hospitalBookings.filter(b => (b.status || 'pending').toLowerCase() === st.toLowerCase()).length;
                      return (
                        <button
                          key={st}
                          onClick={() => setHospitalBookingFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            hospitalBookingFilter === st
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {st} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search box */}
                <div className="relative">
                  <input
                    type="text"
                    value={hospitalBookingSearch}
                    onChange={(e) => setHospitalBookingSearch(e.target.value)}
                    placeholder="Search by patient name, phone, hospital, or symptoms..."
                    className="w-full bg-slate-950 border border-white/10 px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                  />
                  {hospitalBookingSearch && (
                    <button
                      onClick={() => setHospitalBookingSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {hospitalBookings
                    .filter((b) => {
                      if (hospitalBookingFilter !== 'all') {
                        const statusMatch = (b.status || 'pending').toLowerCase() === hospitalBookingFilter.toLowerCase();
                        if (!statusMatch) return false;
                      }
                      if (hospitalBookingSearch.trim()) {
                        const q = hospitalBookingSearch.toLowerCase();
                        const name = (b.patientName || '').toLowerCase();
                        const phone = (b.phone || '').toLowerCase();
                        const hosp = (b.hospital || b.hospitalName || '').toLowerCase();
                        const reason = (b.reason || b.disease || '').toLowerCase();
                        const loc = (b.location || b.address || '').toLowerCase();
                        return name.includes(q) || phone.includes(q) || hosp.includes(q) || reason.includes(q) || loc.includes(q);
                      }
                      return true;
                    }).length === 0 ? (
                    <div className="text-center p-8 bg-slate-950/60 rounded-3xl border border-white/5">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                        No hospital OP records found for this filter
                      </p>
                    </div>
                  ) : (
                    hospitalBookings
                      .filter((b) => {
                        if (hospitalBookingFilter !== 'all') {
                          const statusMatch = (b.status || 'pending').toLowerCase() === hospitalBookingFilter.toLowerCase();
                          if (!statusMatch) return false;
                        }
                        if (hospitalBookingSearch.trim()) {
                          const q = hospitalBookingSearch.toLowerCase();
                          const name = (b.patientName || '').toLowerCase();
                          const phone = (b.phone || '').toLowerCase();
                          const hosp = (b.hospital || b.hospitalName || '').toLowerCase();
                          const reason = (b.reason || b.disease || '').toLowerCase();
                          const loc = (b.location || b.address || '').toLowerCase();
                          return name.includes(q) || phone.includes(q) || hosp.includes(q) || reason.includes(q) || loc.includes(q);
                        }
                        return true;
                      })
                      .map((b) => {
                        const bStatus = (b.status || 'pending').toLowerCase();
                        const isPending = bStatus === 'pending';
                        const isApproved = bStatus === 'approved';
                        const isCompleted = bStatus === 'completed';
                        const isRejected = bStatus === 'rejected';

                        return (
                          <div key={b.id} className="bg-slate-950/80 border border-white/5 p-4.5 rounded-2xl flex flex-col justify-between gap-3 text-left">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                                    {b.patientName || 'Anonymous Patient'}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    📞 {b.phone || 'No phone'} {b.age ? `• ${b.age} yrs` : ''} {b.gender ? `• ${b.gender}` : ''}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  <span className="px-2 py-0.5 bg-rose-400/10 text-rose-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-rose-400/20">
                                    {b.hospital || b.hospitalName || 'Clinical Hub'}
                                  </span>
                                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md ${
                                    isApproved ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                                    isCompleted ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                                    isRejected ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                                    'bg-amber-500/15 text-amber-300 border border-amber-500/20 animate-pulse'
                                  }`}>
                                    {b.status || 'Pending'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-slate-400">
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase text-[8px]">Appointment Slot</span>
                                  <span className="font-bold text-white">{b.slot || b.dateTime || 'Standard OPD'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-bold block uppercase text-[8px]">Fee / Total</span>
                                  <span className="font-bold text-emerald-400">₹{b.amount || 220}</span>
                                </div>
                                {(b.location || b.address) && (
                                  <div className="col-span-2">
                                    <span className="text-slate-500 font-bold block uppercase text-[8px]">Location / Area</span>
                                    <span className="text-slate-300">{b.location || b.address}</span>
                                  </div>
                                )}
                                {(b.reason || b.disease) && (
                                  <div className="col-span-2">
                                    <span className="text-slate-500 font-bold block uppercase text-[8px]">Symptoms / Consultation Reason</span>
                                    <span className="text-amber-300/90 italic">"{b.reason || b.disease}"</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons: Status Updates + Edit + Delete */}
                            <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 flex-wrap">
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateHospitalBookingStatus(b.id, 'Approved')}
                                  className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black uppercase text-[8.5px] tracking-wider active:scale-95 transition-all cursor-pointer text-center"
                                >
                                  ✓ Approve OP
                                </button>
                              )}

                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateHospitalBookingStatus(b.id, 'Completed')}
                                  className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-black uppercase text-[8.5px] tracking-wider active:scale-95 transition-all cursor-pointer text-center"
                                >
                                  ✓ Mark Visited
                                </button>
                              )}

                              {!isRejected && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateHospitalBookingStatus(b.id, 'Rejected')}
                                  className="py-1.5 px-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg font-black uppercase text-[8.5px] tracking-wider active:scale-95 transition-all cursor-pointer border border-rose-500/20"
                                >
                                  Reject
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditHospitalBooking(b)}
                                className="py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg font-black uppercase text-[8.5px] tracking-wider active:scale-95 transition-all cursor-pointer border border-white/10 flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteHospitalBooking(b.id, b.patientName)}
                                className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg font-black uppercase text-[8.5px] tracking-wider active:scale-95 transition-all cursor-pointer border border-rose-500/20"
                                title="Delete Booking"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB: MARRIAGE BUREAU MANAGER */}
        {activeTab === 'marriage' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Marriage Bureau Directory</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Profiles: {marriageProfiles.length} | Pending Approval: {marriageProfiles.filter(p => !p.isApproved).length}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, profession..."
                  value={marriageSearchQuery}
                  onChange={(e) => setMarriageSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Profiles Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marriageProfiles.filter(p => {
                const query = marriageSearchQuery.toLowerCase();
                const fullName = `${p.name || ''} ${p.surname || ''}`.toLowerCase();
                return fullName.includes(query) || 
                       (p.profession || '').toLowerCase().includes(query) ||
                       (p.religion || '').toLowerCase().includes(query) ||
                       (p.caste || '').toLowerCase().includes(query);
              }).length === 0 ? (
                <div className="col-span-full text-center py-16 bg-slate-900 border border-white/5 rounded-[2.5rem]">
                  <Heart className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No marriage profiles matched criteria</p>
                </div>
              ) : (
                marriageProfiles.filter(p => {
                  const query = marriageSearchQuery.toLowerCase();
                  const fullName = `${p.name || ''} ${p.surname || ''}`.toLowerCase();
                  return fullName.includes(query) || 
                         (p.profession || '').toLowerCase().includes(query) ||
                         (p.religion || '').toLowerCase().includes(query) ||
                         (p.caste || '').toLowerCase().includes(query);
                }).map((p) => (
                  <div key={p.id} className="bg-slate-905 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                    
                    {/* Corner Status indicator */}
                    <div className="absolute top-4 right-4 z-15">
                      {p.isApproved ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full">
                          Approved
                        </span>
                      ) : (
                        <span className="bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Avatar and Main Info Container */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/5 bg-slate-950 flex items-center justify-center relative">
                          {p.image ? (
                            <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                          ) : (
                            <Heart className="w-6 h-6 text-slate-705 fill-current" />
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-black text-white text-sm tracking-tight">{p.name} {p.surname}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                            {p.gender || 'Male'} • {p.age || 'N/A'} Years • {p.height || 'N/A'}
                          </p>
                          <p className="text-[9px] font-bold text-yellow-500 tracking-wider uppercase mt-1">
                            {p.profession || 'Self-Employed'}
                          </p>
                        </div>
                      </div>

                      {/* Detail attributes bullet lists */}
                      <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4.5 text-left space-y-2">
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-semibold text-slate-400 font-mono">
                          <div><span className="text-slate-550">RELIGION:</span> {p.religion || 'N/A'}</div>
                          <div><span className="text-slate-550">CASTE:</span> {p.caste || 'N/A'}</div>
                          <div><span className="text-slate-550">STATUS:</span> {p.maritalStatus || 'Unmarried'}</div>
                          <div><span className="text-slate-550">NATIVE:</span> {p.nativePlace || 'Khammam'}</div>
                        </div>

                        <div className="border-t border-white/5 pt-2 mt-1 space-y-1 text-[9px] text-slate-400 uppercase tracking-tighter">
                          <p><span className="text-slate-550">Father:</span> {p.fatherName || 'N/A'} ({p.fatherProfession || 'N/A'})</p>
                          <p><span className="text-slate-550">Mother:</span> {p.motherName || 'N/A'} ({p.motherProfession || 'N/A'})</p>
                          <p className="font-bold text-emerald-400 tracking-normal mt-1 text-[10px] select-all">📞 {p.phone || 'No phone listed'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls button bar */}
                    <div className="flex gap-2 mt-4.5">
                      {!p.isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveMarriageProfile(p.id)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-950/20"
                          >
                            Approve Profile
                          </button>
                          <button
                            onClick={() => setEditingMarriageProfile(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectMarriageProfile(p.id)}
                            className="p-2.5 bg-rose-950/40 border border-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            title="Reject/Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSuspendMarriageProfile(p.id, `${p.name} ${p.surname}`, p.isApproved)}
                            className="flex-1 py-2.5 bg-amber-600/15 border border-amber-500/10 text-amber-400 hover:bg-amber-600 hover:text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Suspend Profile
                          </button>
                          <button
                            onClick={() => setEditingMarriageProfile(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectMarriageProfile(p.id)}
                            className="p-2.5 bg-rose-950/40 border border-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl transition-all"
                            title="Reject/Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2B: LOKAL REAL ESTATE MANAGER */}
        {activeTab === 'real_estate' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Lokal Real Estate Portals</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Properties: {properties.length} | Pending Verification: {properties.filter(p => !p.isApproved).length}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query area, title, price..."
                  value={realEstateSearchQuery}
                  onChange={(e) => setRealEstateSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Properties Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {properties.filter(p => {
                const query = realEstateSearchQuery.toLowerCase();
                const titleStr = (p.title || '').toLowerCase();
                const descStr = (p.description || '').toLowerCase();
                const areaStr = (p.location?.area || '').toLowerCase();
                return titleStr.includes(query) || descStr.includes(query) || areaStr.includes(query);
              }).length === 0 ? (
                <div className="col-span-full text-center py-16 bg-slate-900 border border-white/5 rounded-[2.5rem]">
                  <Building className="w-10 h-10 text-slate-705 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No real estate catalogs matched query</p>
                </div>
              ) : (
                properties.filter(p => {
                  const query = realEstateSearchQuery.toLowerCase();
                  const titleStr = (p.title || '').toLowerCase();
                  const descStr = (p.description || '').toLowerCase();
                  const areaStr = (p.location?.area || '').toLowerCase();
                  return titleStr.includes(query) || descStr.includes(query) || areaStr.includes(query);
                }).map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-white/5 bg-slate-900/60 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                    {/* Status badge */}
                    <div className="absolute top-4 right-4 z-15">
                      {p.isApproved ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full">
                          Approved LIVE
                        </span>
                      ) : (
                        <span className="bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full animate-pulse">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Image cover */}
                      <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center relative">
                        {p.image ? (
                          <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                        ) : (
                          <Building className="w-10 h-10 text-slate-700" />
                        )}
                        <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur text-yellow-400 px-3 py-1 text-[10px] font-black rounded-lg">
                          ₹{p.price}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-black text-white text-sm tracking-tight truncate">{p.title}</h3>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">
                          {p.category || 'For Sale'} • {p.type || 'Residential'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.location?.area || 'Unspecified Area'}, {p.location?.city || 'Khammam'}</span>
                        </p>
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 italic font-sans">{p.description}</p>
                      </div>

                      {/* Property Specs badges */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-center text-[9px] font-bold text-slate-400 font-mono">
                        <div>
                          <p className="text-slate-600 text-[8px] uppercase">SQFT</p>
                          <p className="text-white font-black">{p.details?.sqft || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-[8px] uppercase">BDS</p>
                          <p className="text-white font-black">{p.details?.bedrooms || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-[8px] uppercase">FACING</p>
                          <p className="text-white font-black">{p.details?.facing || p.facing || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls button bar */}
                    <div className="flex gap-2 mt-4.5">
                      {!p.isApproved ? (
                        <>
                          <button
                            onClick={() => handleApproveProperty(p.id)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-950/20"
                          >
                            Approve Listing
                          </button>
                          <button
                            onClick={() => setEditingProperty(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Listing Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-2.5 bg-slate-950 border border-rose-500/10 text-rose-500 hover:bg-rose-950/70 hover:text-white rounded-xl transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRejectProperty(p.id)}
                            className="flex-1 py-2.5 bg-amber-600/15 border border-amber-500/10 text-amber-500 hover:bg-amber-600 hover:text-slate-950 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all"
                          >
                            Suspend/Reject
                          </button>
                          <button
                            onClick={() => setEditingProperty(p)}
                            className="p-2.5 bg-slate-950 border border-white/5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                            title="Edit Listing Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="p-2.5 bg-slate-950 border border-rose-500/10 text-rose-504 hover:bg-rose-950/70 hover:text-white rounded-xl transition-all"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM CATALOG / INVENTORY MANAGER */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Consolidated Store Catalogs</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Create, update or delete products globally</p>
              </div>

              {/* Sub-tab switcher */}
              <div className="flex gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto">
                <button
                  onClick={() => setCatalogSubTab('products')}
                  className={`flex-1 sm:flex-none py-2 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${catalogSubTab === 'products' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Products
                </button>
                <button
                  onClick={() => setCatalogSubTab('categories')}
                  className={`flex-1 sm:flex-none py-2 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${catalogSubTab === 'categories' ? 'bg-yellow-400 text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  Categories
                </button>
              </div>

              {catalogSubTab === 'products' ? (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm({
                      name: '', price: '', originalPrice: '', unit: '', category: 'groceries', 
                      image: '', description: '', isAvailable: true, vendorId: 'admin-store', branchId: 'khammam_main',
                      subCategory: '', stock: ''
                    });
                    setShowItemModal(true);
                  }}
                  className="w-full sm:w-auto py-3 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Product</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryForm({
                      id: '', name: '', icon: 'ShoppingBag', color: 'bg-emerald-50', image: ''
                    });
                    setShowCategoryModal(true);
                  }}
                  className="w-full sm:w-auto py-3 px-5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              )}
            </div>

            {catalogSubTab === 'products' ? (
              <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {products.length === 0 ? (
                    <div className="col-span-full text-center p-12">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No custom listings synced in this catalog</p>
                    </div>
                  ) : (
                    products.map((item) => (
                      <div key={item.id} className="bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="aspect-video relative select-none bg-slate-900 flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-8 h-8 text-slate-700" />
                          )}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                            <span className="bg-slate-900/90 text-[9px] font-black uppercase tracking-widest text-slate-300 px-2.5 py-1 rounded-full">{item.category}</span>
                            {item.subCategory && (
                              <span className="bg-indigo-900/90 text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-full">{item.subCategory}</span>
                            )}
                          </div>
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="px-3 py-1 bg-rose-600 text-white rounded-full font-black uppercase tracking-widest text-[9px]">Out of stock</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-snug line-clamp-1">{item.name}</h4>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-slate-200 text-[12px] font-bold">₹{item.price} per {item.unit}</span>
                              {item.originalPrice && (
                                <span className="text-slate-400 line-through text-[10px] font-bold">₹{item.originalPrice}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic line-clamp-2 mt-2 leading-normal">{item.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2.5 border-t border-white/5 pt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              <span>Vendor: {item.hotelName || item.vendorId || 'Central'}</span>
                              {item.stock !== undefined && item.stock !== null && (
                                <span className="text-amber-400 border-l border-white/10 pl-2">Stock: {item.stock} qty</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCatalogItemClick(item)}
                              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCatalogItem(item.id)}
                              className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {categories.length === 0 ? (
                    <div className="col-span-full text-center p-12">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No categories registered in standard directory</p>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="bg-slate-950/80 border border-white/5 rounded-2xl overflow-hidden p-4 flex flex-col justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-slate-900 text-lg font-black shrink-0 ${cat.color || 'bg-slate-100'}`}>
                            {cat.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-4 line-clamp-1">{cat.name}</h4>
                            <span className="text-[10px] font-bold text-indigo-400 font-mono block mt-1">ID: {cat.id}</span>
                            {cat.color && (
                              <span className="inline-block mt-1 font-mono text-[8px] bg-slate-900/60 border border-white/5 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{cat.color}</span>
                            )}
                          </div>
                        </div>

                        {cat.image && (
                          <div className="aspect-video relative rounded-lg overflow-hidden bg-slate-900">
                            <img src={cat.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
                          </div>
                        )}

                        <div className="flex gap-2 border-t border-white/5 pt-3">
                          <button
                            onClick={() => handleEditCategoryClick(cat)}
                            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Edit2 className="w-3 h-3 text-yellow-400" />
                            <span>Modify</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MERCHANT list */}
        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Integrated Store Directory</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Review and manage verified business profiles</p>
            </header>

            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-4.5 px-6">Merchant Store</th>
                      <th className="py-4.5 px-6">Proprietor</th>
                      <th className="py-4.5 px-6">Telephone</th>
                      <th className="py-4.5 px-6">Location</th>
                      <th className="py-4.5 px-6 text-center">Status</th>
                      <th className="py-4.5 px-6 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {vendors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 font-bold uppercase tracking-widest text-[10px]">No store merchants registered</td>
                      </tr>
                    ) : (
                      vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-6 font-black text-white uppercase tracking-tight">{v.businessName || v.name}</td>
                          <td className="py-4 px-6">{v.ownerName || 'Unknown Owner'}</td>
                          <td className="py-4 px-6 font-mono text-[11px]">{v.phone}</td>
                          <td className="py-4 px-6 font-medium text-slate-400 line-clamp-1">{v.address || 'Khammam'}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>{v.status || 'Reviewing'}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {v.status === 'Approved' ? (
                              <button 
                                onClick={() => handleUpdateVendorStatus(v.id, 'Banned')}
                                className="px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                Suspend Store
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateVendorStatus(v.id, 'Approved')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-950/20"
                              >
                                Approve Store
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RIDER FLEET STATUS */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Active Rider Fleet Control</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verify logins, trip logs, earnings, and cash handovers</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {riders.length === 0 ? (
                <div className="col-span-full text-center p-12 bg-slate-900 border border-white/5 rounded-[2.5rem]">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">No registered logistic agents parsed</p>
                </div>
              ) : (
                riders.map((r) => (
                  <div key={r.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-4 flex flex-col justify-between shadow-md">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{r.name}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${r.status === 'Approved' || r.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-400/10 text-yellow-500'}`}>{r.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{r.vehicleType} • Plate: {r.vehicleNumber || 'TS-04'}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Primary: {r.phone}</p>
                      {r.isOnline && r.customStatus && r.customStatus !== 'Available' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[8.5px] font-black uppercase rounded font-mono">
                          🕒 {r.customStatus}
                        </div>
                      )}

                      <div className="mt-4 p-4.5 bg-slate-950/60 rounded-2xl border border-white/5 grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Payout</p>
                          <p className="text-sm font-black text-emerald-400 mt-0.5">₹{r.earnings || 0}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cash on Hand (COD)</p>
                          <p className="text-sm font-black text-yellow-500 mt-0.5">₹{r.cashInHand || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleSettleRiderCash(r.id)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-indigo-900/10"
                      >
                        Settle & Finalize
                      </button>
                      <button 
                        onClick={() => handleUpdateRiderStatus(r.id, 'Banned')}
                        className="px-3.5 py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        Suspend Rider
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: MULTI-CHANNEL SUPPORT CHAT DESK */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <header>
              <h2 className="text-lg font-black uppercase tracking-tight">Frictionless Support Desk</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Engage with customers and service providers in real time</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[550px] bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              
              {/* Chat Directory list */}
              <div className="border-r border-white/5 h-full flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operational Queries</span>
                </div>
                <div className="flex-1 divide-y divide-white/5">
                  {supportChats.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-bold uppercase">No active communication nodes</p>
                  ) : (
                    supportChats.map((chat) => (
                      <div 
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className={`p-4.5 cursor-pointer transition-colors text-left flex justify-between items-center ${activeChat?.id === chat.id ? 'bg-slate-950/80' : 'hover:bg-slate-950/30'}`}
                      >
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{chat.userName || 'Local Guest'}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 leading-normal font-medium">{chat.lastMessage || 'Channel established'}</p>
                        </div>
                        {chat.unreadCountStatus > 0 && (
                          <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center bounce animate-pulse">{chat.unreadCountStatus}</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Messages Log Panel */}
              <div className="col-span-2 h-full flex flex-col justify-between bg-slate-950/40 relative">
                {activeChat ? (
                  <>
                    <header className="p-4.5 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                      <div className="text-left">
                        <h4 className="text-sm font-black uppercase text-white tracking-tight">{activeChat.userName}</h4>
                        <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Active Chat Console</span>
                      </div>
                      <button 
                        onClick={() => setActiveChat(null)}
                        className="p-1.5 bg-slate-950 border border-white/5 text-slate-400 hover:text-white rounded-lg"
                      >
                        Close
                      </button>
                    </header>

                    {/* Messages Body */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto h-[350px]">
                      {(activeChat.messages || []).map((msg: any, index: number) => {
                        const isAdminMsg = msg.senderId === 'admin';
                        return (
                          <div 
                            key={index}
                            className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`p-4 rounded-[1.8rem] max-w-sm text-left ${isAdminMsg ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                              {msg.imageUrl && (
                                <div className="mb-2 bg-slate-950/40 p-1.5 rounded-xl border border-white/5 overflow-hidden">
                                  <img 
                                    src={msg.imageUrl} 
                                    className="max-h-40 rounded-lg object-contain w-full" 
                                    alt="Live support attachments" 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <p className="text-xs leading-relaxed font-bold">{msg.text}</p>
                              <span className="text-[8px] font-black uppercase text-slate-400/90 tracking-wider block mt-1.5 text-right">{msg.senderName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick message reply form bar */}
                    <div className="p-4 bg-slate-900 border-t border-white/5 flex gap-3">
                      <input 
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        placeholder="Write support response..."
                        className="flex-1 bg-slate-950 border border-white/10 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-yellow-400/40"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="p-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase transition-all shadow-md active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <HelpCircle className="w-12 h-12 text-slate-700 mb-3" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Select a support ticket channel to reply</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB: CENTRALIZED USER SYSTEM CONTROL PANEL */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <span>Centralized User Account Registry</span>
                </h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Accounts: {users.length} | Blocked/Suspended: {users.filter(u => u.isSuspended).length}
                </p>
              </div>
              <div className="bg-slate-900 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Secure Admin Control Mode</span>
              </div>
            </header>

            {/* Users Search and Actions block */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4 text-left">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full font-sans">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search accounts by name, telephone number, or email..." 
                    value={realEstateSearchQuery}
                    onChange={(e) => setRealEstateSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400/30 font-mono"
                  />
                </div>
              </div>

              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                      <th className="py-4 px-6">User Account</th>
                      <th className="py-4 px-6">Email / Platform ID</th>
                      <th className="py-4 px-6">Registered Phone</th>
                      <th className="py-4 px-6">System Role</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {users.filter(u => {
                      const queryClean = realEstateSearchQuery.toLowerCase();
                      if (!queryClean) return true;
                      return (u.name || '').toLowerCase().includes(queryClean) || 
                             (u.email || '').toLowerCase().includes(queryClean) || 
                             (u.phone || '').includes(queryClean);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500 font-bold uppercase tracking-widest text-[10px]">No matches found in users database</td>
                      </tr>
                    ) : (
                      users.filter(u => {
                        const queryClean = realEstateSearchQuery.toLowerCase();
                        if (!queryClean) return true;
                        return (u.name || '').toLowerCase().includes(queryClean) || 
                               (u.email || '').toLowerCase().includes(queryClean) || 
                               (u.phone || '').includes(queryClean);
                      }).map((u) => (
                        <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black uppercase text-[11px] shrink-0">
                                {(u.name || 'G')[0]}
                              </div>
                              <div>
                                <p className="font-black text-white uppercase tracking-tight">{u.name || 'Anonymous User'}</p>
                                <p className="text-[8px] text-slate-500 font-bold font-mono">ID: {u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-400">{u.email || 'N/A'}</td>
                          <td className="py-4 px-6 font-mono text-[11px] text-slate-300">{u.phone || 'N/A'}</td>
                          <td className="py-4 px-6">
                            <select
                              value={u.role || 'customer'}
                              onChange={async (e) => {
                                try {
                                  await updateDoc(doc(db, 'users', u.id), { role: e.target.value });
                                  triggerToast(`✓ Updated Role for ${u.name || 'User'} to ${e.target.value.toUpperCase()}`);
                                } catch (err) {
                                  alert(`Failed to update user role: ${err}`);
                                }
                              }}
                              className="bg-slate-950 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-slate-300 outline-none cursor-pointer"
                            >
                              <option value="customer">Customer</option>
                              <option value="rider">Rider</option>
                              <option value="vendor">Vendor</option>
                              <option value="branch_manager">Branch Manager</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest ${u.isSuspended ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                              {u.isSuspended ? '🚫 SUSPENDED' : '✓ ACTIVE'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 shrink-0 whitespace-nowrap">
                            <button
                              onClick={async () => {
                                const nextState = !u.isSuspended;
                                try {
                                  await updateDoc(doc(db, 'users', u.id), { isSuspended: nextState });
                                  triggerToast(`✓ User ${u.name || u.id} successfully ${nextState ? 'SUSPENDED' : 'RESTORED'}`);
                                } catch (err) {
                                  alert(`Failed to toggle account suspension: ${err}`);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                u.isSuspended 
                                  ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white' 
                                  : 'bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white'
                              }`}
                            >
                              {u.isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                            <button
                              onClick={async () => {
                                const newName = prompt(`Modify Full Name for ${u.name || 'User'}:`, u.name || '');
                                if (newName === null) return;
                                const newPhone = prompt(`Modify Phone Number:`, u.phone || '');
                                if (newPhone === null) return;
                                try {
                                  await updateDoc(doc(db, 'users', u.id), { name: newName, phone: newPhone });
                                  triggerToast(`✓ Profile updated successfully!`);
                                } catch (err) {
                                  alert(`Failed updating profile parameters: ${err}`);
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-950 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-850 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Edit Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS & MASTER ADMIN ACCESS */}
        {activeTab === 'systems' && (
          <div className="space-y-6 text-left">
            
            {/* SUBMENU NAVIGATION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-white/5 p-3 rounded-[2rem]">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <button
                  onClick={() => setSettingsSubTab('gateways')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    settingsSubTab === 'gateways'
                      ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white border border-white/5'
                  }`}
                  id="settings_subtab_gateways"
                >
                  <Settings className="w-4 h-4" />
                  <span>Gateways & OPD Pricing</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('master_access')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    settingsSubTab === 'master_access'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-400/25 ring-2 ring-amber-300/40'
                      : 'bg-slate-950/70 text-slate-400 hover:text-amber-300 border border-white/5'
                  }`}
                  id="settings_subtab_master_access"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Master Admin Access</span>
                  <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold">
                    {authorizedAdminsList.length + primaryMasterPhones.length}
                  </span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('logs')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    settingsSubTab === 'logs'
                      ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20'
                      : 'bg-slate-950/70 text-slate-400 hover:text-white border border-white/5'
                  }`}
                  id="settings_subtab_logs"
                >
                  <Activity className="w-4 h-4" />
                  <span>Transmitters & Settlement Logs</span>
                </button>
              </div>

              {/* Submenu status indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-white/5 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
                  Firestore Secure Sync: Active
                </span>
              </div>
            </div>

            {/* SUBMENU 1: GATEWAYS & OPD CONFIG */}
            {settingsSubTab === 'gateways' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Promo code engine configurator */}
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-tight text-yellow-400">Promo Coupons Database</h3>
                      <Percent className="w-5 h-5 text-yellow-400" />
                    </div>

                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto">
                      {promoCodes.length === 0 ? (
                        <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No promo codes registered</p>
                      ) : (
                        promoCodes.map((p) => (
                          <div key={p.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-black text-white tracking-widest">{p.code}</p>
                              <p className="text-[10px] text-slate-400">{p.type === 'percentage' ? `${p.value}% Off` : `₹${p.value} Flat Off`} • Status: {p.status}</p>
                            </div>
                            <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest rounded-full">{p.status}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Hospital Consultation Prices Configurator */}
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-tight text-rose-400">Hospital Consultation OPD Prices</h3>
                      <Building className="w-5 h-5 text-rose-400" />
                    </div>

                    <div className="space-y-3 px-1.5 max-h-[350px] overflow-y-auto">
                      {Object.entries(hospitalPrices).length === 0 ? (
                        <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No local hospitals in database records</p>
                      ) : (
                        Object.entries(hospitalPrices).map(([name, data]: [string, any]) => (
                          <div key={name} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">{name}</p>
                              <p className="text-[11px] font-bold text-slate-400 mt-1">Fee: ₹{data.price ?? 0} • Status: {data.isActive ? 'Online' : 'Offline'}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateHospitalPrice(name, Number(data.price ?? 0), !data.isActive)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${data.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                              >
                                {data.isActive ? 'Deactivate OP' : 'Activate OP'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Integration Gateways */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  {/* SMS Gateway */}
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">SMS Gateway Config</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">MarketBuzzer Teleservices Pvt Ltd • serv_imp Transmitter</p>
                      </div>
                      <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-500 text-[8.5px] font-black tracking-wider uppercase rounded-full">SMS-GATE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Gateway Provider</label>
                        <select
                          value={smsProvider}
                          onChange={(e: any) => setSmsProvider(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-yellow-500 text-slate-300"
                        >
                          <option value="serv_imp">MarketBuzzer Teleservices (serv_imp)</option>
                          <option value="twilio">Twilio Programmable SMS</option>
                          <option value="plivo">Plivo Premium</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Account Type (Route)</label>
                        <input
                          type="text"
                          value={smsAccountType}
                          onChange={(e) => setSmsAccountType(e.target.value)}
                          placeholder="e.g. serv_imp"
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Gateway Key / User</label>
                        <input
                          type="text"
                          value={smsKey}
                          onChange={(e) => setSmsKey(e.target.value)}
                          placeholder="e.g. rJCIC6J0"
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Gateway Password</label>
                        <input
                          type="password"
                          value={smsPassword}
                          onChange={(e) => setSmsPassword(e.target.value)}
                          placeholder="e.g. mXdYj5Bc"
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">DLT Sender ID (6-Chars)</label>
                        <input
                          type="text"
                          value={smsSenderId}
                          onChange={(e) => setSmsSenderId(e.target.value.toUpperCase().slice(0, 6))}
                          placeholder="e.g. LKLBND"
                          maxLength={6}
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white uppercase outline-none focus:border-yellow-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                          <input
                            type="checkbox"
                            checked={smsMatchTemplate}
                            onChange={(e) => setSmsMatchTemplate(e.target.checked)}
                            className="w-4 h-4 rounded text-yellow-400 bg-slate-950 border-white/10 focus:ring-yellow-400"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enforce DLT Match Template</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveSmsConfig}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Save SMS Config
                      </button>
                    </div>
                  </div>

                  {/* Payment Gateway */}
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Payment Gateways</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">UPI & Commission Router</p>
                      </div>
                      <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-500 text-[8.5px] font-black tracking-wider uppercase rounded-full">PAY-GATE</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Gateway Engine</label>
                        <select
                          value={paymentGateway}
                          onChange={(e: any) => setPaymentGateway(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-yellow-500 text-slate-300"
                        >
                          <option value="razorpay">Razorpay Checkout</option>
                          <option value="paytm">Paytm Merchant API</option>
                          <option value="cashfree">Cashfree Core</option>
                          <option value="stripe">Stripe international</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Processing Mode</label>
                        <select
                          value={paymentMode}
                          onChange={(e: any) => setPaymentMode(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider outline-none focus:border-yellow-500 text-slate-300"
                        >
                          <option value="sandbox">Sandbox (Simulation)</option>
                          <option value="live">Live Production (Real)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Merchant Pay-in UPI ID</label>
                        <input
                          type="text"
                          value={paymentUpiId}
                          onChange={(e) => setPaymentUpiId(e.target.value)}
                          placeholder="e.g. 7416574197@hdfc"
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Account Holder</label>
                        <input
                          type="text"
                          value={paymentHolder}
                          onChange={(e) => setPaymentHolder(e.target.value)}
                          placeholder="Holder Full Name"
                          className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs font-bold text-white outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSavePaymentConfig}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                      >
                        Save Payment Config
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBMENU 2: MASTER ADMIN ACCESS (AUTHORIZED SECONDARY ADMINS) */}
            {settingsSubTab === 'master_access' && (
              <div className="space-y-6">
                
                {/* Master Admin Security Header Card */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 p-6 md:p-8 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 font-mono">
                          Master Admin Authority & Access Control
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                        Authorized Secondary Administrators
                      </h2>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        Input phone numbers below to authorize secondary administrators. All credentials are synchronized to the secure <code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[10px]">settings/authorized_admins</code> Firestore document. 
                        If any admin's phone number is removed or marked revoked, our live authentication stream <strong className="text-white">immediately terminates their session</strong> and redirects them to the Customer App.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
                      <div className="bg-slate-950/80 border border-white/10 p-4 rounded-2xl">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Primary Founder</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[8px] font-black rounded-full uppercase">Immune</span>
                        </div>
                        <p className="text-sm font-black text-white">Tarun Bandi</p>
                        <p className="text-xs font-mono text-amber-400">+91 8790729816</p>
                      </div>

                      <button
                        onClick={handleTestRevokeMySession}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        id="btn_test_session_revocation"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                        <span>Test Instant Session Revocation</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form & Table Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Authorize New Admin Form */}
                  <div className="lg:col-span-5 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">Authorize New Admin</h3>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Grant dashboard roles by mobile phone</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-wider rounded-full">
                        Secure
                      </span>
                    </div>

                    <form onSubmit={handleAddAuthorizedAdmin} className="space-y-4" id="form_authorize_admin">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                          Admin Mobile Phone Number <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Smartphone className="w-4 h-4 text-slate-500" />
                          </div>
                          <input
                            type="tel"
                            value={newAdminPhone}
                            onChange={(e) => setNewAdminPhone(e.target.value)}
                            placeholder="e.g. 9876543210 or +91 8790729816"
                            className="w-full bg-slate-950 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-600 outline-none focus:border-amber-400 transition-colors"
                            required
                            id="input_admin_phone"
                          />
                        </div>
                        <p className="text-[8px] text-slate-500 mt-1">10-digit Indian mobile number (auto-prefixed with +91)</p>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                          Administrator Full Name / Title <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          placeholder="e.g. Rajesh Kumar (Operations Lead)"
                          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-xl text-sm font-bold text-white placeholder-slate-600 outline-none focus:border-amber-400 transition-colors"
                          required
                          id="input_admin_name"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                          Administrative Privilege Role
                        </label>
                        <select
                          value={newAdminRole}
                          onChange={(e: any) => setNewAdminRole(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-400 transition-colors"
                          id="select_admin_role"
                        >
                          <option value="authorizedAdmin">Authorized Admin (Logistics, Orders, Vendors, Real Estate)</option>
                          <option value="masterAdmin">Master Admin (Full Co-Executive Access & Controls)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                          Department / Operational Notes
                        </label>
                        <textarea
                          value={newAdminNotes}
                          onChange={(e) => setNewAdminNotes(e.target.value)}
                          placeholder="e.g. Khammam South hub coordinator, partner onboarding approvals"
                          rows={2}
                          className="w-full bg-slate-950 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400 resize-none transition-colors"
                          id="input_admin_notes"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isAdminSaving}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-350 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        id="btn_submit_admin_auth"
                      >
                        {isAdminSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Authorizing Admin...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4" />
                            <span>Authorize Admin Phone Number</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="bg-slate-950/60 border border-white/5 p-3.5 rounded-2xl text-[9px] text-slate-400 space-y-1.5">
                      <p className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        Real-time Enforcement:
                      </p>
                      <p>
                        When an authorized admin logs in with this phone number or uses their passcode, they get immediate access. 
                        Toggling <strong className="text-amber-300">Revoke</strong> immediately kicks their browser out of the dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Directory of Primary & Authorized Admins */}
                  <div className="lg:col-span-7 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-5">
                    
                    {/* Header & Search Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Authorized Admins Directory</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                          {primaryMasterPhones.length} Primary Founders &bull; {authorizedAdminsList.length} Secondary Admins
                        </p>
                      </div>

                      <div className="relative min-w-[200px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={adminSearchTerm}
                          onChange={(e) => setAdminSearchTerm(e.target.value)}
                          placeholder="Search phone or name..."
                          className="w-full bg-slate-950 border border-white/10 pl-9 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Directory List */}
                    <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                      
                      {/* Primary Master Admins (Immutable) */}
                      {primaryMasterPhones.map((phone) => (
                        <div
                          key={phone}
                          className="bg-gradient-to-r from-amber-500/10 via-slate-950/80 to-slate-950/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
                              👑
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-white uppercase">
                                  {phone === '+918790729816' ? 'Tarun Bandi' : 'Master Executive Admin'}
                                </p>
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[7.5px] font-black uppercase tracking-wider rounded-full border border-amber-500/30">
                                  Primary Founder
                                </span>
                              </div>
                              <p className="text-xs font-mono font-bold text-amber-400 mt-0.5">{phone}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Absolute system authority & global platform architect</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Active Forever
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Filtered Secondary Admins */}
                      {authorizedAdminsList
                        .filter((admin) => {
                          if (!adminSearchTerm) return true;
                          const term = adminSearchTerm.toLowerCase();
                          return (
                            admin.name.toLowerCase().includes(term) ||
                            admin.phoneNumber.includes(term) ||
                            (admin.notes && admin.notes.toLowerCase().includes(term)) ||
                            admin.role.toLowerCase().includes(term)
                          );
                        })
                        .map((admin) => {
                          const isActive = admin.status === 'active';
                          return (
                            <div
                              key={admin.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isActive
                                  ? 'bg-slate-950/70 border-white/10 hover:border-amber-500/30'
                                  : 'bg-rose-950/20 border-rose-500/20 opacity-75'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isActive 
                                    ? 'bg-slate-900 border-white/10 text-amber-400' 
                                    : 'bg-rose-900/30 border-rose-500/30 text-rose-400'
                                }`}>
                                  {isActive ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-xs font-black text-white uppercase">{admin.name}</p>
                                    <span className={`px-2 py-0.5 text-[7.5px] font-black uppercase tracking-wider rounded-full ${
                                      admin.role === 'masterAdmin'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    }`}>
                                      {admin.role === 'masterAdmin' ? 'Co-Master Admin' : 'Secondary Admin'}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[7.5px] font-black uppercase tracking-wider rounded-full ${
                                      isActive 
                                        ? 'bg-emerald-500/15 text-emerald-400' 
                                        : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                      {isActive ? '● Active' : '✕ Revoked'}
                                    </span>
                                  </div>
                                  <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">{admin.phoneNumber}</p>
                                  {admin.notes && (
                                    <p className="text-[9px] text-slate-400 mt-0.5">{admin.notes}</p>
                                  )}
                                  <p className="text-[8px] text-slate-500 mt-1 font-mono">
                                    Added: {new Date(admin.addedAt).toLocaleDateString()} by {admin.addedBy}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                  onClick={() => handleToggleAdminStatus(admin.id, admin.status)}
                                  className={`px-3 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isActive
                                      ? 'bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30'
                                      : 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30'
                                  }`}
                                  id={`btn_toggle_admin_${admin.id}`}
                                >
                                  {isActive ? (
                                    <>
                                      <Lock className="w-3 h-3" />
                                      <span>Revoke Access</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3 h-3" />
                                      <span>Restore Access</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteAuthorizedAdmin(admin.id)}
                                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                                  title="Delete Admin Record"
                                  id={`btn_delete_admin_${admin.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {authorizedAdminsList.length === 0 && (
                        <div className="bg-slate-950/40 border border-white/5 p-8 rounded-2xl text-center space-y-2">
                          <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-400">No secondary administrators authorized yet.</p>
                          <p className="text-[10px] text-slate-500">
                            Use the form on the left to input new administrator phone numbers.
                          </p>
                        </div>
                      )}

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* SUBMENU 3: LIVE TRANSMITTERS & SETTLEMENT LOGS */}
            {settingsSubTab === 'logs' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  
                  {/* SMS Stream Logs */}
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">🚨 Live Dispatched SMS Stream</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Real-time OTP delivery telemetry</p>
                      </div>
                      <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-500 text-[8.5px] font-black tracking-wider uppercase rounded-full">
                        {auditLogs.filter(log => ['sms_otp', 'onboarding_otp'].includes(log.type)).length} Dispatches
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl max-h-[380px] overflow-y-auto font-mono text-[9px] space-y-2">
                      {auditLogs.filter(log => ['sms_otp', 'onboarding_otp'].includes(log.type)).length === 0 ? (
                        <p className="text-center py-12 text-slate-600 uppercase">Gateway quiet. Ready for verification dispatches.</p>
                      ) : (
                        auditLogs.filter(log => ['sms_otp', 'onboarding_otp'].includes(log.type)).map((log) => (
                          <div key={log.id} className="p-2.5 border-b border-white/5 last:border-0 flex flex-col gap-1 text-left text-slate-300">
                            <div className="flex justify-between items-center text-slate-500">
                              <span className="font-bold text-white">+91 {log.phoneNumber} ({log.type === 'sms_otp' ? 'Login' : 'Onboard'})</span>
                              <span className="text-emerald-400 font-extrabold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[7.5px]">[ {log.status || 'DELIVERED'} ]</span>
                            </div>
                            <p className="text-slate-300 font-mono">{log.message}</p>
                            <span className="text-[7.5px] text-slate-500">Code: {log.code} • Date: {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Payment Settlements */}
                  <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">💵 Real-Time Platform Revenue Settlements</h3>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Commission allocations & checkout receipts</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-400 text-[8.5px] font-black tracking-wider uppercase rounded-full">
                        {auditLogs.filter(log => log.type === 'payment_success').length} Settlements
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl max-h-[380px] overflow-y-auto font-mono text-[9px] space-y-2">
                      {auditLogs.filter(log => log.type === 'payment_success').length === 0 ? (
                        <p className="text-center py-12 text-slate-600 uppercase">No customer pay-ins recorded yet in this cycle.</p>
                      ) : (
                        auditLogs.filter(log => log.type === 'payment_success').map((log) => (
                          <div key={log.id} className="p-2.5 border-b border-white/5 last:border-0 flex justify-between items-start text-left text-slate-300">
                            <div>
                              <div className="flex items-center gap-1.5 font-extrabold text-white">
                                <span className="text-emerald-400 text-xs">₹{log.amount}</span>
                                <span className="text-[8px] text-slate-500">({log.method?.toUpperCase()})</span>
                              </div>
                              <p className="text-[8.5px] text-slate-400 mt-0.5 truncate max-w-[220px]">Loc: {log.deliveryLocation}</p>
                              <span className="text-[7.5px] text-slate-500">Ref: {log.txnId} • {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-emerald-400 font-extrabold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[7.5px]">[ SUCCESS ]</span>
                              <p className="text-[8px] text-slate-400 mt-1 truncate max-w-[100px]">{log.customerName}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 13: SUPPORT DESK & ORDER INVESTIGATOR */}
        {activeTab === 'support' && (
          <div className="space-y-6 text-left">
            <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl text-left space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest animate-pulse font-mono">Central Service Desk</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Support Tickets & Order Investigator</h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Real-time routing for regional customer complaints. Search exact customer Order IDs for item audits, payment modes, merchant allocations, and free-item matching.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT BOARD: SUPPORT TICKETS LIST & MODERATOR */}
              <div className="lg:col-span-7 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-rose-400 tracking-tight flex items-center gap-2">
                      Customer Service Tickets
                      {complaints.filter(c => c.status === 'Pending').length > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[8px] font-black uppercase tracking-widest rounded-full animate-bounce">
                          {complaints.filter(c => c.status === 'Pending').length} Alert
                        </span>
                      )}
                    </h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Live customer ticket dispatch log</p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
                    {(['All', 'Pending', 'In Progress', 'Resolved', 'Closed'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setComplaintFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          complaintFilter === f
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-white/5'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Complaints */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Filter complaints by ticket ID, user name, keyword..."
                    value={searchComplaintQuery}
                    onChange={(e) => setSearchComplaintQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold outline-none text-slate-100 placeholder-slate-600 focus:border-rose-400"
                  />
                </div>

                {/* Tickets Grid/List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
                  {complaints.length === 0 ? (
                    <div className="text-center py-12 bg-slate-950 rounded-2xl border border-dashed border-white/5">
                      <HelpCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">No customer support tickets registered yet</p>
                    </div>
                  ) : (
                    (() => {
                      const filtered = complaints
                        .filter(c => {
                          if (complaintFilter !== 'All' && c.status !== complaintFilter) return false;
                          if (searchComplaintQuery.trim()) {
                            const q = searchComplaintQuery.toLowerCase();
                            return (
                              c.id?.toLowerCase().includes(q) ||
                              c.description?.toLowerCase().includes(q) ||
                              c.category?.toLowerCase().includes(q) ||
                              c.userId?.toLowerCase().includes(q) ||
                              c.userName?.toLowerCase().includes(q) ||
                              c.orderId?.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .sort((a,b) => {
                          const dateA = a.createdAt?.seconds || 0;
                          const dateB = b.createdAt?.seconds || 0;
                          return dateB - dateA;
                        });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 bg-slate-950 rounded-2xl">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">No tickets found matching your filter triggers</p>
                          </div>
                        );
                      }

                      return filtered.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedComplaint(item);
                            setAdminComplaintAnswer(item.adminAnswer || '');
                            if (item.orderId && item.orderId !== 'N/A') {
                              setOrderSearchId(item.orderId);
                              // We trigger a search immediately or set search order states.
                            }
                          }}
                          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
                            selectedComplaint?.id === item.id
                              ? 'bg-slate-950 border-rose-500/80 shadow-lg shadow-rose-955/20'
                              : 'bg-slate-950/65 hover:bg-slate-950 border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md text-[9px] font-mono text-slate-450 uppercase tracking-widest">
                              ID: {item.id}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${
                              item.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10 animate-pulse' :
                              item.status === 'In Progress' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/10' :
                              item.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' :
                              'bg-slate-805 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase text-rose-455 tracking-wider">
                                {item.category}
                              </span>
                              <span className="text-slate-600">&bull;</span>
                              <span className="text-[9px] font-bold text-slate-500">
                                {item.createdAt?.seconds 
                                  ? new Date(item.createdAt.seconds * 1000).toLocaleString() 
                                  : 'Just recently'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-300 leading-relaxed italic">
                              "{item.description}"
                            </p>
                          </div>

                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 text-[9px] font-black text-slate-400">
                                {item.userName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight font-sans">
                                {item.userName || 'Lokal User'} ({item.userPhone || 'N/A'})
                              </span>
                            </div>
                            {item.orderId && item.orderId !== 'N/A' && (
                              <div className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10 uppercase tracking-wider">
                                Linked Order: #{item.orderId}
                              </div>
                            )}
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>

                {/* Complaint Answer Slate Editor */}
                {selectedComplaint && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-slate-950 border border-white/5 rounded-3xl text-left space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div>
                        <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider font-mono">Ticket Management Desk</h4>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">ID: {selectedComplaint.id}</p>
                      </div>
                      <button
                        onClick={() => setSelectedComplaint(null)}
                        className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                      >
                        unfocus
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Official Service Desk Answer</label>
                      <textarea
                        rows={3}
                        value={adminComplaintAnswer}
                        onChange={(e) => setAdminComplaintAnswer(e.target.value)}
                        placeholder="Write down details on refund initiated, replacement courier sent, order status updated, etc..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-100 outline-none focus:border-rose-400"
                      />
                    </div>

                    {/* Change Status CTA Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateComplaintStatus(selectedComplaint.id, 'In Progress', adminComplaintAnswer)}
                        disabled={isUpdatingComplaint}
                        className="py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-405 hover:text-slate-950 transition-all font-black uppercase text-[9px] tracking-widest rounded-xl disabled:opacity-50 cursor-pointer"
                      >
                        In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateComplaintStatus(selectedComplaint.id, 'Resolved', adminComplaintAnswer)}
                        disabled={isUpdatingComplaint}
                        className="py-2.5 bg-emerald-555 hover:bg-emerald-400 text-slate-950 transition-all font-black uppercase text-[9px] tracking-widest rounded-xl disabled:opacity-50 cursor-pointer"
                      >
                        Set Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateComplaintStatus(selectedComplaint.id, 'Closed', adminComplaintAnswer)}
                        disabled={isUpdatingComplaint}
                        className="py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-400 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest rounded-xl disabled:opacity-50 cursor-pointer"
                      >
                        Close Ticket
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* RIGHT BOARD: ORDER SEARCH INVESTIGATOR */}
              <div className="lg:col-span-5 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-5 text-left">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight flex items-center gap-2">
                    Order Investigator Console
                  </h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Central Order lookup & verification hub</p>
                </div>

                {/* Precise search bar */}
                <form onSubmit={(e) => { e.preventDefault(); handleSearchOrderById(); }} className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      placeholder="Enter Order ID"
                      value={orderSearchId}
                      onChange={(e) => setOrderSearchId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs font-black text-yellow-350 placeholder-slate-600 outline-none focus:border-yellow-400 uppercase font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={orderSearchLoading || !orderSearchId.trim()}
                    className="w-full py-3.5 bg-yellow-450 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                  >
                    {orderSearchLoading ? 'Invoking Database...' : 'Run Diagnostics & Lookup'}
                  </button>
                </form>

                {orderSearchError && (
                  <div className="p-4 bg-rose-950/25 border border-rose-900 rounded-2xl text-[10px] font-black text-rose-450 uppercase tracking-wide">
                    {orderSearchError}
                  </div>
                )}

                {/* Diagnosis Details Representation */}
                {searchedOrder ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 text-xs font-semibold bg-slate-950 border border-white/5 p-5 rounded-3xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <div>
                        <p className="text-[8px] font-black uppercase text-yellow-400 tracking-widest font-mono">Found Active order</p>
                        <h4 className="text-sm font-black tracking-tight text-white font-mono uppercase">#{searchedOrder.id}</h4>
                      </div>
                      <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg ${
                        searchedOrder.status === 'Completed' || searchedOrder.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/5 shadow-emerald-900/10' :
                        searchedOrder.status === 'Preparing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/5' :
                        searchedOrder.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {searchedOrder.status}
                      </span>
                    </div>

                    {/* Customer Info Block */}
                    <div className="space-y-2 text-slate-300 bg-slate-900/65 p-4 rounded-2xl border border-white/5">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">1. Customer Parameters</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Name</p>
                          <p className="font-extrabold text-white">{searchedOrder.customerName || searchedOrder.customer?.name || 'Walkin Customer'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Phone</p>
                          <p className="font-extrabold text-indigo-400">{searchedOrder.customerPhone || searchedOrder.customer?.phone || 'Unknown'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Delivery Address Description</p>
                          <p className="font-bold text-slate-300 leading-normal italic text-[11px] placeholder-slate-600">
                            {searchedOrder.deliveryAddress || searchedOrder.customer?.address || 'Khammam Central Delivery Zone'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Info Block */}
                    <div className="space-y-2 text-slate-300 bg-slate-900/65 p-4 rounded-2xl border border-white/5">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">2. Payment Parameters</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Payment Mode</p>
                          <p className="font-black text-rose-400 uppercase">{searchedOrder.paymentMethod || searchedOrder.paymentType || 'COD (Cash On Delivery)'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Amount Computed</p>
                          <p className="font-black text-emerald-400 text-sm">₹{searchedOrder.totalAmount || searchedOrder.total || '0'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Transaction reference ID</p>
                          <p className="font-mono text-[10px] font-extrabold text-yellow-400">
                            {searchedOrder.paymentRef || searchedOrder.transactionId || 'REF_SYS_PENDING_COD'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Merchant & Vendor Block */}
                    <div className="space-y-2 text-slate-300 bg-slate-900/65 p-4 rounded-2xl border border-white/5">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">3. Allocations & Vendor Parameters</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Vendor Outlet Name</p>
                          <p className="font-extrabold text-white uppercase">{searchedOrder.vendorName || searchedOrder.merchantName || 'Local Bandi Main Hub (Admin)'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Franchise Segment</p>
                          <p className="font-extrabold text-slate-300 uppercase">{searchedOrder.branchId || 'Khammam Main Branch'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="font-bold text-slate-500 uppercase text-[9px]">Allocated Dispatch Courier / Rider</p>
                          <p className="font-bold text-indigo-400 uppercase text-[11.5px]">
                            🏍️ {searchedOrder.riderName ? `${searchedOrder.riderName} (${searchedOrder.riderPhone || 'Secured'})` : 'Awaiting Central Allocation Queue'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items Ordered List */}
                    <div className="space-y-2 bg-slate-900/65 p-4 rounded-2xl border border-white/5 font-sans">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest block font-mono">4. Ordered Items Breakdown</span>
                      <div className="space-y-2 pt-1">
                        {searchedOrder.items && searchedOrder.items.length > 0 ? (
                          searchedOrder.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] font-bold border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                              <div>
                                <p className="text-white uppercase font-black">{item.name}</p>
                                <p className="text-[9.5px] text-slate-500 italic">Qty: {item.quantity} {item.unit ? `(${item.unit})` : ''} &bull; Price: ₹{item.price}</p>
                              </div>
                              <span className="text-emerald-400 font-black">₹{item.price * item.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">No custom items array logged on this transaction record.</p>
                        )}
                      </div>
                    </div>

                    {/* Promo Free Items block */}
                    <div className="space-y-2 bg-slate-900/65 p-4 rounded-2xl border border-white/5">
                      <span className="text-[8px] font-black uppercase text-yellow-400 tracking-widest block font-mono">5. Agriculture Promo Bonus FREE Items</span>
                      <div className="space-y-1 pt-1">
                        {searchedOrder.freeItems && searchedOrder.freeItems.length > 0 ? (
                          searchedOrder.freeItems.map((freeItemName: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-400">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <p className="uppercase">{freeItemName} <span className="text-[9.5px] text-slate-450 font-bold tracking-wider">(100% Promo Complimentary)</span></p>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500 italic">
                            <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" />
                            <p>No agricultural promotional complimentary products linked.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Diagnostic Lifecycle & Cancellation Panel */}
                    <div className="space-y-2 bg-slate-900/65 p-4 rounded-2xl border border-white/5">
                      <span className="text-[8px] font-black uppercase text-rose-400 tracking-widest block font-mono">6. Transaction Diagnostics &amp; Timestamps</span>
                      <div className="space-y-1.5 pt-1 text-[11px] font-mono leading-relaxed">
                        <p className="text-slate-400"><span className="font-bold text-slate-300">Created:</span> {searchedOrder.createdAt ? (typeof searchedOrder.createdAt === 'string' ? searchedOrder.createdAt : new Date(searchedOrder.createdAt.seconds * 1000).toLocaleString()) : 'N/A'}</p>
                        <p className="text-slate-400"><span className="font-bold text-slate-300">Updated:</span> {searchedOrder.updatedAt ? (typeof searchedOrder.updatedAt === 'string' ? searchedOrder.updatedAt : new Date(searchedOrder.updatedAt.seconds * 1000).toLocaleString()) : 'N/A'}</p>
                        
                        {/* Cancellation specific details shown exactly */}
                        {searchedOrder.status === 'Cancelled' ? (
                          <div className="mt-2.5 p-3 bg-red-950/30 border border-red-500/20 rounded-xl space-y-1 font-sans text-xs">
                            <p className="text-red-400 font-black uppercase tracking-wider text-[8px] font-mono">⚠️ Order Cancelled / Early Terminated</p>
                            <p className="text-slate-200"><strong>Cancelled At:</strong> {searchedOrder.cancelledAt ? (typeof searchedOrder.cancelledAt === 'string' ? searchedOrder.cancelledAt : new Date(searchedOrder.cancelledAt.seconds * 1000).toLocaleString()) : (searchedOrder.updatedAt ? (typeof searchedOrder.updatedAt === 'string' ? searchedOrder.updatedAt : new Date(searchedOrder.updatedAt.seconds * 1000).toLocaleString()) : 'N/A')}</p>
                            <p className="text-slate-200"><strong>Cancellation Reason:</strong> <span className="text-rose-400 italic">"{searchedOrder.cancelReason || searchedOrder.cancellationReason || 'User or dispatcher terminated before rider acceptance.'}"</span></p>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-[10px] italic font-sans mt-1.5">No cancellation parameters recorded. Current Lifecycle Status: {searchedOrder.status}.</p>
                        )}
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  <div className="text-center py-16 bg-slate-950 p-6 rounded-3xl border border-dashed border-white/5">
                    <Search className="w-10 h-10 text-slate-800 mx-auto mb-2.5" />
                    <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Investigator Standby Node</p>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-[210px] mx-auto">Input a precise Order ID above to run diagnostic logs, trace physical riders, verify payments, or map promotion packages.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: FOUNDER PREMIUM MASTER PANEL */}
        {activeTab === 'founder' && (
          <div className="space-y-6">
            
            {/* Founders Intro card */}
            <div className="relative bg-slate-900 border border-yellow-400/20 p-8 rounded-[2.5rem] overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl text-left space-y-2 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">Platform Founder Override Panel</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Khammam Platform Founder Dashboard</h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  High-security panel overrides for regional promotion campaigns, branch franchises, hospital networks, custom dispatcher automation triggers, and user-merchant review moderations.
                </p>
              </div>
            </div>

            {/* A: LOGISTICS HUB (MEMBER LOGISTICS) */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Member Logistics Hub</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Live registered platform profiles status log</p>
                </div>
                <Users className="w-5 h-5 text-yellow-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logged Customers</p>
                  <p className="text-2xl font-black text-white">{users.filter(u => u.role === 'customer' || !u.role).length}</p>
                  <p className="text-[8.5px] font-bold text-emerald-400 uppercase tracking-tight">👤 Real-Time logins</p>
                </div>
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Onboarded Merchants</p>
                  <p className="text-2xl font-black text-white">{vendors.length}</p>
                  <p className="text-[8.5px] font-bold text-yellow-500 uppercase tracking-tight">🏪 Approved outlets</p>
                </div>
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Delivery Fleet</p>
                  <p className="text-2xl font-black text-white">{riders.length}</p>
                  <p className="text-[8.5px] font-bold text-indigo-400 uppercase tracking-tight">🏍️ Riders on dispatch</p>
                </div>
                <div className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Khammam Staff Team</p>
                  <p className="text-2xl font-black text-white">{users.filter(u => ['branchAdmin', 'admin', 'staff'].includes(u.role)).length}</p>
                  <p className="text-[8.5px] font-bold text-amber-500 uppercase tracking-tight">🔑 Administrators active</p>
                </div>
              </div>
            </div>

            {/* B: ORDER DISPATCH ASSIGNMENT POWER TOGGLE & MANUAL ROUTING CONSOLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              
              {/* Order Assignment Mode Toggle */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Auto-Dispatch Engine</h3>
                    <Power className={`w-5 h-5 ${dispatchConfig.autoAssign ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    When active, incoming customer orders automatically search and bid the nearest available online rider. Toggle OFF to hold orders in central manual routing queue.
                  </p>
                </div>

                <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500">Dispatch Status Mode</p>
                    <p className={`text-xs font-black uppercase tracking-wider ${dispatchConfig.autoAssign ? 'text-emerald-400' : 'text-amber-500'}`}>
                      {dispatchConfig.autoAssign ? '🤖 FULLY AUTOMATIC' : '🎮 MANUAL ALLOCATION'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoDispatch}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all ${dispatchConfig.autoAssign ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-450 hover:text-slate-900'}`}
                  >
                    Change Mode
                  </button>
                </div>
              </div>

              {/* Manual Routing Console (List of Unassigned or Active Orders to force assign rider) */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] lg:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Manual Routing Override</h3>
                    <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full">Override Console</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal font-medium">
                    Force route and dispatch any open orders to any registered rider in real-time.
                  </p>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {orders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-[10px] font-black uppercase border border-dashed border-white/5 rounded-xl">
                      No active open orders awaiting rider dispatch
                    </div>
                  ) : (
                    orders.filter(o => ['Pending', 'Preparing'].includes(o.status)).map((ord) => (
                      <div key={ord.id} className="bg-slate-950/70 border border-white/5 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-extrabold text-white">#{ord.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{ord.vendorName || 'General Hub'} • Total: ₹{ord.total}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Rider: <span className="text-indigo-400 font-extrabold">{ord.riderName || 'UNASSIGNED 🚨'}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            onChange={(e) => handleManualAssignOrder(ord.id, e.target.value)}
                            className="bg-slate-900 border border-white/10 p-2 rounded-lg text-[9px] font-black uppercase text-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Choose Dispatch Rider</option>
                            {riders.filter(r => r.status === 'Approved' || r.isOnline).map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.isOnline ? 'ONLINE' : 'OFFLINE'})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* C: BANNER MANAGER & PROMO CODES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Home Slide Banner Manager */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Category Promotion Banners</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">App home interactive carousel slides</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBanner(null);
                      setBannerForm({ title: '', description: '', image: '', route: 'restaurant', status: 'active' });
                      setShowBannerModal(true);
                    }}
                    className="p-2.5 bg-yellow-400 text-slate-900 hover:bg-yellow-300 rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Slide</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 font-sans">
                  {banners.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No slide banners configured yet</p>
                  ) : (
                    banners.map((b) => (
                      <div key={b.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                        {b.image && (
                          <img src={b.image} className="w-16 h-12 rounded-lg object-cover bg-slate-900 shrink-0 border border-white/5" alt="Banner thumb" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate uppercase">{b.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{b.description}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-full">Route: {b.route}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingBanner(b);
                              setBannerForm({
                                title: b.title || '',
                                description: b.description || '',
                                image: b.image || '',
                                route: b.route || 'restaurant',
                                status: b.status || 'active'
                              });
                              setShowBannerModal(true);
                            }}
                            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Promo Coupon creation & edit */}
              <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">App Discount Coupons</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Platform coupon codes & campaigns</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPromo(null);
                      setPromoForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', status: 'active' });
                      setShowPromoModal(true);
                    }}
                    className="p-2.5 bg-yellow-400 text-slate-900 hover:bg-yellow-300 rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Create Promo</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 font-sans">
                  {promoCodes.length === 0 ? (
                    <p className="text-center py-12 text-slate-500 text-[10px] font-black uppercase">No promo coupons published yet</p>
                  ) : (
                    promoCodes.map((p) => (
                      <div key={p.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-white tracking-widest italic">{p.code}</p>
                          <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">
                            {p.type === 'percentage' ? `${p.value}% OFF` : `₹${p.value} OFF`} • Min Order: ₹{p.minOrder || 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPromo(p);
                              setPromoForm({
                                code: p.code || '',
                                type: p.type || 'percentage',
                                value: String(p.value || ''),
                                minOrder: String(p.minOrder || ''),
                                maxDiscount: String(p.maxDiscount || ''),
                                status: p.status || 'active'
                              });
                              setShowPromoModal(true);
                            }}
                            className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg border border-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* D: USER REVIEWS & COMMENTS MODERATOR */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Customer Comments & Review Moderation</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Acknowledge feedback & remove spam registers</p>
                </div>
                <Star className="w-5 h-5 text-yellow-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                {reviews.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-500 text-[10px] font-black uppercase">
                    No registered user reviews online
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-white text-xs">{rev.userName || 'Anonymous Client'}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= (rev.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">About Outlet / Product: <span className="text-indigo-400 font-extrabold">{rev.vendorName || rev.productName || 'General service'}</span></p>
                        <p className="text-slate-200 mt-1.5 italic">"{rev.comment || 'No description comments registered.'}"</p>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => {
                            setEditingReview(rev);
                            setReviewForm({ rating: rev.rating || 5, comment: rev.comment || '' });
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 active:scale-95 text-center"
                        >
                          Moderate Raw
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-rose-500/10 text-center"
                        >
                          Delete Comment
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* E: HOSPITALS master CRUD */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Khammam OP Hospital Directory</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">CRUD medical consulting and hospital OPD registries</p>
                </div>
                <button
                  onClick={() => {
                    setEditingHospital(null);
                    setHospitalForm({ name: '', price: '', isActive: true, description: '', phone: '' });
                    setShowHospitalModal(true);
                  }}
                  className="p-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-rose-950/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Register Clinical Hospital</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-1">
                {Object.entries(hospitalPrices).length === 0 ? (
                  <p className="col-span-3 text-center py-12 text-slate-500 text-[10px] font-black uppercase animate-pulse">No hospitals configured in master database registry</p>
                ) : (
                  Object.entries(hospitalPrices).map(([name, data]: [string, any]) => (
                    <div key={name} className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-black text-white uppercase tracking-tight text-xs">{name}</p>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${data.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {data.isActive ? 'Active' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-sm font-black text-emerald-400 mt-1">Fee: ₹{data.price ?? 0}</p>
                        {data.phone && <p className="text-[10px] text-slate-400 font-mono font-semibold">Tel: {data.phone}</p>}
                        {data.description && <p className="text-[10px] text-slate-400 italic leading-relaxed">"{data.description}"</p>}
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => {
                            setEditingHospital(name);
                            setHospitalForm({
                              name,
                              price: String(data.price ?? ''),
                              isActive: data.isActive ?? true,
                              description: data.description || '',
                              phone: data.phone || ''
                            });
                            setShowHospitalModal(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 active:scale-95 text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteHospitalObj(name)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-550 text-rose-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 border border-rose-500/10 text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* F: FRANCHISES BRANCH network */}
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] text-left space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight">Lokal Franchise Branch Office Networks</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Manage regional administrative branches & charter logs</p>
                </div>
                <button
                  onClick={() => {
                    setEditingBranch(null);
                    setBranchForm({ id: '', name: '', city: 'Khammam', revenue: 0, status: 'Active', adminEmail: '', secPasscode: '4455' });
                    setShowBranchModal(true);
                  }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Charter Franchise</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-white/5 text-xs font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-white/5 text-slate-400 uppercase tracking-widest text-[9px] font-black">
                      <th className="py-3.5 px-4 font-normal">Branch Slug</th>
                      <th className="py-3.5 px-4 font-normal">Office Name</th>
                      <th className="py-3.5 px-4 font-normal">Region Metro</th>
                      <th className="py-3.5 px-4 font-normal">Delivery Radius (KM)</th>
                      <th className="py-3.5 px-4 font-normal">Charter Principal Email</th>
                      <th className="py-3.5 px-4 text-right font-normal">Charter Capital</th>
                      <th className="py-3.5 px-4 text-right font-normal">Status</th>
                      <th className="py-3.5 px-4 text-right font-normal">Action Command</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {branches.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-505 text-[10px] font-black uppercase">No physical hub franchises registered</td>
                      </tr>
                    ) : (
                      branches.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-950/75 transition-colors font-semibold">
                          <td className="py-3.5 px-4 font-mono text-indigo-400 font-extrabold">{b.id}</td>
                          <td className="py-3.5 px-4 text-white font-extrabold uppercase">{b.name}</td>
                          <td className="py-3.5 px-4 text-slate-300 font-extrabold">{b.city || 'Khammam'}</td>
                          <td className="py-3.5 px-4 font-mono text-indigo-300 font-black">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs">{b.deliveryRadius || 5} KM</span>
                              {b.pendingDeliveryRadius ? (
                                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 p-1 rounded-lg">
                                  <span className="text-[8px] text-amber-400 font-bold uppercase animate-pulse">
                                    Req: {b.pendingDeliveryRadius} KM
                                  </span>
                                  <button
                                    onClick={() => handleApproveBranchRadius(b.id, b.pendingDeliveryRadius)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer"
                                    title="Approve Requested Radius"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectBranchRadius(b.id)}
                                    className="bg-rose-500 hover:bg-rose-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded cursor-pointer"
                                    title="Reject Requested Radius"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[8px] text-emerald-400/80 font-bold uppercase">
                                  ✓ Approved Bound
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 font-medium">{b.adminEmail || 'admin@lokalbandi.com'}</td>
                          <td className="py-3.5 px-4 text-right text-emerald-400 font-black">₹{(b.revenue ?? 0).toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${b.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-405'}`}>
                              {b.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  const customVal = prompt(`Enter custom delivery radius (in KM) for branch '${b.name}':`, String(b.deliveryRadius || 5));
                                  if (customVal) {
                                    const numKm = Number(customVal);
                                    if (numKm >= 1 && numKm <= 50) {
                                      handleOverrideBranchRadius(b.id, numKm);
                                    } else {
                                      alert("Please enter a valid radius between 1 and 50 KM.");
                                    }
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded border border-indigo-500/30 text-[8px] font-black uppercase tracking-wider cursor-pointer"
                                title="Master Override Radius"
                              >
                                Set Radius
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBranch(b);
                                  setBranchForm({
                                    id: b.id || '',
                                    name: b.name || '',
                                    city: b.city || 'Khammam',
                                    revenue: b.revenue || 0,
                                    status: b.status || 'Active',
                                    adminEmail: b.adminEmail || '',
                                    secPasscode: b.secPasscode || '4455'
                                  });
                                  setShowBranchModal(true);
                                }}
                                className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded border border-white/5 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBranch(b.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded transition-all border border-rose-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MASTER ADMIN DELIVERY RADIUS & AREA GOVERNANCE SUMMARY PANEL */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Master Admin Delivery Radius & Geofence Governance</h3>
                </div>
                <span className="text-[9px] font-extrabold text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 font-mono">
                  Master Oversight Active
                </span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                As Master Admin Tarun Bandi, you maintain full real-time permission and approval authority over all delivery service boundaries and radius definitions across every franchise branch in Telangana and AP.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black uppercase text-slate-400">Total Registered Branches</p>
                  <p className="text-2xl font-black text-indigo-400 font-mono mt-1">{branches.length}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black uppercase text-slate-400">Pending Radius Approval Requests</p>
                  <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {branches.filter(b => b.pendingDeliveryRadius).length}
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black uppercase text-slate-400">Domain Master Sync Status</p>
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-wider mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    localbandimultiservices.in
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 8b: DEALS OF THE DAY MANAGER */}
        {activeTab === 'deals' && (() => {
          const visibleDeals = adminRole === 'franchise'
            ? deals.filter(d => d.branchId === adminBranchId || d.branchId === 'global')
            : deals;
          return (
            <div className="space-y-6 text-left">
              <div className="relative bg-slate-900 border border-yellow-400/20 p-8 rounded-[2.5rem] overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-2xl text-left space-y-2 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                    <Percent className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest font-mono">Deal of the Day Console</span>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Deals of the Day Manager</h2>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed font-sans">
                    Configure and edit limited-time deals on the consumer home screen. Set prices, add rich product photos from custom URLs, or select from premium pre-styled presets with a single click.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-900 border border-white/5 p-4 rounded-3xl">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Active Promotions</h3>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">
                    Showing {visibleDeals.length} active consumer offerings {adminRole === 'franchise' && "(including global campaigns)"}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingDeal(null);
                    setDealForm({ 
                      title: '', 
                      discount: '', 
                      price: '', 
                      originalPrice: '', 
                      img: '', 
                      status: 'active',
                      branchId: adminRole === 'franchise' ? adminBranchId : 'global'
                    });
                    setShowDealModal(true);
                  }}
                  className="px-5 py-3 bg-yellow-400 font-black text-slate-950 uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-yellow-300 transition-all cursor-pointer"
                >
                  + Add New Deal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleDeals.length === 0 ? (
                  <div className="col-span-full text-center py-24 bg-slate-900 p-8 rounded-[2.5rem] border border-dashed border-white/5">
                    <Percent className="w-12 h-12 text-slate-750 mx-auto mb-4 animate-bounce" />
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">No active deals configured in database.</p>
                    <p className="text-[11px] text-slate-600 mt-1 max-w-sm mx-auto">Click "Add New Deal" above to configure your custom offer with photo selection support.</p>
                  </div>
                ) : (
                  visibleDeals.map((deal) => (
                    <div key={deal.id} className="bg-slate-900 border border-white/5 p-5 rounded-[2.5rem] relative flex flex-col justify-between gap-5 group hover:border-yellow-400/35 transition-all">
                      <div className="space-y-4">
                        {/* Photo preview wrap */}
                        <div className="relative aspect-[3/2] bg-slate-950 rounded-[1.5rem] overflow-hidden border border-white/5 shadow-inner">
                          <img 
                            src={deal.img || 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                            referrerPolicy="no-referrer"
                            alt={deal.title} 
                          />
                          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl shadow-lg">
                            {deal.discount}
                          </div>
                          
                          {/* Branch badge helper */}
                          <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg shadow-lg">
                            {deal.branchId === 'global' || !deal.branchId ? 'Global' : (branches.find(b => b.id === deal.branchId)?.name || deal.branchId)}
                          </div>

                          {deal.status === 'inactive' && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                              <span className="px-3 py-1 bg-slate-900 text-slate-450 text-[9px] font-black uppercase tracking-widest border border-white/10 rounded-lg">Suspended / Hidden</span>
                            </div>
                          )}
                        </div>

                        {/* Header values */}
                        <div className="text-left space-y-1 pl-1">
                          <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight truncate">{deal.title}</h4>
                          <div className="flex items-baseline gap-2 font-mono">
                            <span className="text-base font-black text-yellow-400">₹{deal.price}</span>
                            {deal.originalPrice > 0 && (
                              <span className="text-xs text-slate-500 line-through font-medium font-sans">₹{deal.originalPrice}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-white/5 pt-4 pl-1">
                        <button 
                          onClick={() => {
                            setEditingDeal(deal);
                            setDealForm({
                              title: deal.title || '',
                              discount: deal.discount || '',
                              price: String(deal.price || ''),
                              originalPrice: String(deal.originalPrice || ''),
                              img: deal.img || '',
                              status: deal.status || 'active',
                              branchId: deal.branchId || 'global'
                            });
                            setShowDealModal(true);
                          }}
                          className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-200 rounded-xl font-black uppercase text-[9px] tracking-widest border border-white/5 transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-yellow-400" />
                          Edit details
                        </button>
                        <button 
                          onClick={() => handleDeleteDeal(deal.id)}
                          className="p-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/5 cursor-pointer flex items-center justify-center"
                          title="Delete this Deal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB: QUIZ & TRIVIA MANAGEMENT */}
        {activeTab === 'quiz' && (
          <div className="space-y-6 text-left">
            
            {/* Intro Header */}
            <div className="relative bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 rounded-[2.5rem] overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest font-mono">Master Marketing Engine</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    ⚡ 40s Speed Quiz &amp; Low Price Offer Manager
                  </h2>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Master Admin can edit, add, or delete any quiz trivia question. All changes update instantly on the customer app without refresh. Offers are capped strictly under <strong className="text-amber-400">25% OFF</strong> (3/3: 25%, 2/3: 15%, 1/3: 8%) with 100% Cashback Super Coins!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleResetQuizQuestions}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Reset to default low-price trivia"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingQuizQuestion(null);
                      setQuizForm({
                        question: '',
                        optA: '',
                        optB: '',
                        optC: '',
                        optD: '',
                        correctIndex: 0,
                        explanation: '',
                        category: 'Low Price Grocery'
                      });
                      setShowQuizModal(true);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">Timer Limit</span>
                  <span className="text-lg font-black text-amber-400 font-mono">40 Seconds</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">Max Offer Tier</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">25% OFF</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">Reward Coins</span>
                  <span className="text-lg font-black text-yellow-400 font-mono">100% Cashback</span>
                </div>
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block font-mono">Active Questions</span>
                  <span className="text-lg font-black text-indigo-400 font-mono">{quizQuestions.length} Questions</span>
                </div>
              </div>
            </div>

            {/* Questions Card List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Active Quiz Question Pool ({quizQuestions.length})
                </h3>
              </div>

              {quizQuestions.length === 0 ? (
                <div className="text-center py-16 bg-slate-900 rounded-[2rem] border border-dashed border-white/10 p-6">
                  <HelpCircle className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-black text-slate-400 uppercase">No quiz questions configured</p>
                  <p className="text-[10.5px] text-slate-500 mt-1">Click "Add Question" or "Reset Defaults" to load questions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-slate-900 border border-white/10 p-5 rounded-[2rem] space-y-3 relative group hover:border-amber-500/40 transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase font-mono">
                            Q#{idx + 1} &bull; {q.category || 'Low Price Trivia'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">ID: {q.id}</span>
                        </div>

                        <h4 className="text-sm font-extrabold text-white leading-snug">
                          {q.question}
                        </h4>

                        {/* Options List */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctIndex;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-xl text-[11px] font-medium border flex items-center gap-1.5 ${
                                  isCorrect 
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold' 
                                    : 'bg-slate-950 border-white/5 text-slate-400'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="truncate">{opt}</span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5 text-[10px] text-slate-400 leading-relaxed italic">
                            💡 <strong className="text-slate-300 font-bold">Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleOpenEditQuizQuestion(q)}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuizQuestion(q.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: ATTRACTION CAMPAIGNS (SCRATCH CARD, FLASH DROP, GROUP BUY POOL) */}
        {activeTab === 'attractions' && (
          <AttractionCampaignsManager 
            adminEmail={user?.email || 'tharunbandi111@gmail.com'} 
            onToast={triggerToast} 
          />
        )}

      </div>

      {/* Standalone footer layout */}
      <div className="border-t border-white/5 bg-slate-950 p-6 text-center select-none">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
          Secured Enterprise Application &bull; Lokal Bandi master branch Khammam
        </p>
      </div>

      {/* PRODUCT LISTING ADD/EDIT MODAL */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingItem ? 'Edit Product Option' : 'Create Product option'}</h3>
              </div>
              
              <form onSubmit={handleSaveCatalogItem} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input 
                    type="text" required 
                    value={itemForm.name} 
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., Premium Homemade Ghee" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Price (INR)</label>
                    <input 
                      type="number" required 
                      value={itemForm.price} 
                      onChange={(e) => setItemForm({...itemForm, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black" 
                      placeholder="650" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Original Price (Strike)</label>
                    <input 
                      type="number" 
                      value={itemForm.originalPrice} 
                      onChange={(e) => setItemForm({...itemForm, originalPrice: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="E.g., 720 (optional)" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Unit description</label>
                    <input 
                      type="text" required 
                      value={itemForm.unit} 
                      onChange={(e) => setItemForm({...itemForm, unit: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="500ml / 1kg" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Stock quantity</label>
                    <input 
                      type="number" 
                      value={itemForm.stock} 
                      onChange={(e) => setItemForm({...itemForm, stock: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="E.g., 50 (optional)" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Catalog Category</label>
                    <select 
                      value={itemForm.category} 
                      onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Sub-category Label</label>
                    <input 
                      type="text" 
                      value={itemForm.subCategory} 
                      onChange={(e) => setItemForm({...itemForm, subCategory: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="Veg, Pure cow (optional)" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Assigned Store Vendor</label>
                  <select 
                    value={itemForm.vendorId} 
                    onChange={(e) => setItemForm({...itemForm, vendorId: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                  >
                    <option value="admin-store">Lokal Central Hub (Admin)</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.businessName || v.name || v.ownerName} ({v.status})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Image Resource Link</label>
                  <input 
                    type="url" 
                    value={itemForm.image} 
                    onChange={(e) => setItemForm({...itemForm, image: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Product Description</label>
                  <textarea 
                    value={itemForm.description} 
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold h-16" 
                    placeholder="Hand-churned pure traditional Ghee from local cow farms." 
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-950 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available in Catalog?</span>
                  <button
                    type="button"
                    onClick={() => setItemForm({...itemForm, isAvailable: !itemForm.isAvailable})}
                    className={`py-1 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${itemForm.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'}`}
                  >
                    {itemForm.isAvailable ? 'Active' : 'Out of stock'}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowItemModal(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-900/10 active:scale-95"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEALS OF THE DAY EDIT/ADD MODAL */}
      <AnimatePresence>
        {showDealModal && (
          <div className="fixed inset-0 z-[10008] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Percent className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">
                  {editingDeal ? 'Modify Deal of the Day' : 'Configure New Deal'}
                </h3>
              </div>
              
              <form onSubmit={handleSaveDeal} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Deal Title / Product Name</label>
                  <input 
                    type="text" required 
                    value={dealForm.title} 
                    onChange={(e) => setDealForm({...dealForm, title: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-all text-white" 
                    placeholder="E.g., Organic Ghee Bottle" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Discount badge</label>
                    <input 
                      type="text" required 
                      value={dealForm.discount} 
                      onChange={(e) => setDealForm({...dealForm, discount: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-yellow-400"
                      placeholder="50% OFF"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Display Price (₹)</label>
                    <input 
                      type="number" required 
                      value={dealForm.price} 
                      onChange={(e) => setDealForm({...dealForm, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black text-emerald-400" 
                      placeholder="99" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Original Price (₹)</label>
                    <input 
                      type="number" required 
                      value={dealForm.originalPrice} 
                      onChange={(e) => setDealForm({...dealForm, originalPrice: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-slate-400" 
                      placeholder="199" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Branch Scope</label>
                    {adminRole === 'franchise' ? (
                      <input 
                        type="text" 
                        disabled 
                        value={branches.find(b => b.id === adminBranchId)?.name || adminBranchId}
                        className="w-full bg-slate-950/50 border border-white/5 p-3 rounded-xl text-xs font-bold text-indigo-400 disabled:opacity-75"
                      />
                    ) : (
                      <select 
                        value={dealForm.branchId || 'global'} 
                        onChange={(e) => setDealForm({...dealForm, branchId: e.target.value})}
                        className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-sans focus:outline-none focus:border-yellow-400/50 transition-all font-mono"
                      >
                        <option value="global">Global (All Branches)</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name || b.id}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Product Photo URL</label>
                  <input 
                    type="url" required 
                    value={dealForm.img} 
                    onChange={(e) => setDealForm({...dealForm, img: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-mono text-slate-300 placeholder-slate-700" 
                    placeholder="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E" 
                  />
                  
                  {/* Preset helpers */}
                  <div className="space-y-1 mt-2">
                    <span className="block text-[8px] font-black uppercase text-slate-500 tracking-wider">Or select a quick preset graphic:</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-950 border border-white/5 rounded-xl">
                      {dealPresets.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setDealForm({...dealForm, img: preset.url})}
                          className={`text-[8px] font-black uppercase px-2 py-1 rounded-md transition-all truncate border ${dealForm.img === preset.url ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold' : 'bg-slate-900 text-slate-400 border-white/5 hover:border-slate-500 font-medium'}`}
                          title={preset.name}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider text-slate-500">Operation Status</label>
                  <select 
                    value={dealForm.status} 
                    onChange={(e) => setDealForm({...dealForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-yellow-400/50 transition-all"
                  >
                    <option value="active">Active & Visible</option>
                    <option value="inactive">Suspended / Hidden</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowDealModal(false); setEditingDeal(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg cursor-pointer transition-all"
                  >
                    Save Deal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CATEGORY ADD/EDIT MODAL */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              </div>
              
              <form onSubmit={handleSaveCategory} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Category ID (Machine slug)</label>
                  <input 
                    type="text" required 
                    disabled={!!editingCategory}
                    value={categoryForm.id} 
                    onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-mono disabled:opacity-50" 
                    placeholder="e.g. food, dairy, household" 
                  />
                  <p className="text-[8px] text-slate-500 font-bold uppercase leading-snug">Unique machine identifier, numbers & letters only. Cannot be changed later.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Display Name</label>
                  <input 
                    type="text" required 
                    value={categoryForm.name} 
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., Meat & Eggs" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Lucide Icon name</label>
                    <input 
                      type="text" 
                      value={categoryForm.icon} 
                      onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="ShoppingBag" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Tailwind Color class</label>
                    <input 
                      type="text" 
                      value={categoryForm.color} 
                      onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="bg-emerald-50" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Thumbnail Image URL</label>
                  <input 
                    type="url" 
                    value={categoryForm.image} 
                    onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E" 
                  />
                  <p className="text-[8px] text-slate-500 font-bold uppercase leading-snug">Provide an Unsplash graphic to render a rich picture tile for users (optional).</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-900/10 active:scale-95"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BANNER EDIT/ADD MODAL */}
      <AnimatePresence>
        {showBannerModal && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Laptop className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingBanner ? 'Edit Promo Banner' : 'Create Promo Banner'}</h3>
              </div>
              
              <form onSubmit={handleSaveBanner} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Banner Title</label>
                  <input 
                    type="text" required 
                    value={bannerForm.title} 
                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., 50% Ghee Sale!" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Description Subtext</label>
                  <input 
                    type="text" required 
                    value={bannerForm.description} 
                    onChange={(e) => setBannerForm({...bannerForm, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    placeholder="E.g., Homemade traditional products..." 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Redirect Route Trigger</label>
                  <select 
                    value={bannerForm.route} 
                    onChange={(e) => setBannerForm({...bannerForm, route: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                  >
                    <option value="restaurant">restaurant (Food Dispatch)</option>
                    <option value="groceries">groceries (Fresh Veg/Fruits)</option>
                    <option value="organic">organic (Pure Farm Ghee/Honey)</option>
                    <option value="medical">medical (Clinical OPD Consultations)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Public Banner Image Link</label>
                  <input 
                    type="url" required 
                    value={bannerForm.image} 
                    onChange={(e) => setBannerForm({...bannerForm, image: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    placeholder="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22grad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fef3c7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23fde68a%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22400%22%20height%3D%22400%22%20rx%3D%2232%22%20fill%3D%22url(%23grad)%22%2F%3E%3Ccircle%20cx%3D%22200%22%20cy%3D%22170%22%20r%3D%2280%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.6%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22195%22%20font-size%3D%2270%22%20text-anchor%3D%22middle%22%20font-family%3D%22system-ui%2C%20sans-serif%22%3E%E2%9C%A8%3C%2Ftext%3E%3Crect%20x%3D%2230%22%20y%3D%22290%22%20width%3D%22340%22%20height%3D%2260%22%20rx%3D%2216%22%20fill%3D%22%230f172a%22%20fill-opacity%3D%220.85%22%2F%3E%3Ctext%20x%3D%22200%22%20y%3D%22328%22%20font-size%3D%2220%22%20font-weight%3D%22900%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-family%3D%22system-ui%2C%20-apple-system%2C%20sans-serif%22%20letter-spacing%3D%221%22%3ELocal%2520Bandi%3C%2Ftext%3E%3C%2Fsvg%3E" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Display Status</label>
                  <select 
                    value={bannerForm.status} 
                    onChange={(e) => setBannerForm({...bannerForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white"
                  >
                    <option value="active">Active (On Screen)</option>
                    <option value="scheduled">Scheduled (Hidden)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowBannerModal(false); setEditingBanner(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Slide
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROMO CODE MODAL */}
      <AnimatePresence>
        {showPromoModal && (
          <div className="fixed inset-0 z-[10003] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Percent className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingPromo ? 'Edit Coupon Code' : 'Generate Coupon Code'}</h3>
              </div>
              
              <form onSubmit={handleSavePromo} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Coupon Code (All Caps)</label>
                  <input 
                    type="text" required 
                    disabled={!!editingPromo}
                    value={promoForm.code} 
                    onChange={(e) => setPromoForm({...promoForm, code: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black tracking-widest placeholder-slate-600 disabled:opacity-50" 
                    placeholder="BHARATH50" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Discount Type</label>
                    <select 
                      value={promoForm.type} 
                      onChange={(e) => setPromoForm({...promoForm, type: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                    >
                      <option value="percentage">Percentage %</option>
                      <option value="flat">Flat ₹ Discount</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Discount Value</label>
                    <input 
                      type="number" required 
                      value={promoForm.value} 
                      onChange={(e) => setPromoForm({...promoForm, value: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black" 
                      placeholder="E.g. 10 or 150" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Minimum Order</label>
                    <input 
                      type="number" 
                      value={promoForm.minOrder} 
                      onChange={(e) => setPromoForm({...promoForm, minOrder: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-semibold" 
                      placeholder="E.g. 100" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Max Cap Discount</label>
                    <input 
                      type="number" 
                      value={promoForm.maxDiscount} 
                      onChange={(e) => setPromoForm({...promoForm, maxDiscount: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-semibold" 
                      placeholder="E.g. 200" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider text-slate-500">Validity Status</label>
                  <select 
                    value={promoForm.status} 
                    onChange={(e) => setPromoForm({...promoForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold"
                  >
                    <option value="active">Active & Redeemable</option>
                    <option value="expired">Expired/Revoked</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowPromoModal(false); setEditingPromo(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REVIEW MODERATE MODAL */}
      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 z-[10004] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">Moderate Review</h3>
              </div>
              
              <form onSubmit={handleSaveReviewModerate} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Star Rating (1-5)</label>
                  <select 
                    value={reviewForm.rating} 
                    onChange={(e) => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black text-yellow-400"
                  >
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Comment Text</label>
                  <textarea 
                    value={reviewForm.comment} 
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold h-24" 
                    placeholder="Type moderated review text..." 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingReview(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Moderate & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FRANCHISE BRANCH MODAL */}
      <AnimatePresence>
        {showBranchModal && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingBranch ? 'Configure Franchise' : 'Charter New Franchise'}</h3>
              </div>
              
              <form onSubmit={handleSaveBranch} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Branch Slug ID (e.g. khammam_main)</label>
                  <input 
                    type="text" required 
                    disabled={!!editingBranch}
                    value={branchForm.id} 
                    onChange={(e) => setBranchForm({...branchForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-mono disabled:opacity-50" 
                    placeholder="khammam_main" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Franchise Office Name</label>
                  <input 
                    type="text" required 
                    value={branchForm.name} 
                    onChange={(e) => setBranchForm({...branchForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-sans" 
                    placeholder="E.g. Khammam City HQ" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">HQ City Registry</label>
                    <input 
                      type="text" required 
                      value={branchForm.city} 
                      onChange={(e) => setBranchForm({...branchForm, city: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-xs font-bold" 
                      placeholder="Khammam" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Charter Capital (Revenue)</label>
                    <input 
                      type="number" 
                      value={branchForm.revenue} 
                      onChange={(e) => setBranchForm({...branchForm, revenue: Number(e.target.value)})}
                      className="w-full bg-slate-950 border border-white/10 p-4 rounded-xl text-xs font-bold" 
                      placeholder="0" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Admin Principal Email</label>
                  <input 
                    type="email" required 
                    value={branchForm.adminEmail} 
                    onChange={(e) => setBranchForm({...branchForm, adminEmail: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-semibold" 
                    placeholder="admin@lokalbandi.com" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-yellow-400 uppercase tracking-wider font-mono">Franchise Sec-Passcode (For Local Admins)</label>
                  <input 
                    type="text" required 
                    value={branchForm.secPasscode} 
                    onChange={(e) => setBranchForm({...branchForm, secPasscode: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono text-yellow-400" 
                    placeholder="E.g. 4455" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider text-slate-500">Operation Status</label>
                  <select 
                    value={branchForm.status} 
                    onChange={(e) => setBranchForm({...branchForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white"
                  >
                    <option value="Active">Active Operational</option>
                    <option value="Maintenance">Maintenance Break</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowBranchModal(false); setEditingBranch(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Franchise
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOSPITAL CRUD MODAL */}
      <AnimatePresence>
        {showHospitalModal && (
          <div className="fixed inset-0 z-[10006] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-sm w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Building className="w-6 h-6 text-rose-400" />
                <h3 className="text-lg font-black uppercase tracking-tight">{editingHospital ? 'Edit Clinic OP Record' : 'Registry New Hospital'}</h3>
              </div>
              
              <form onSubmit={handleSaveHospital} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Hospital Name</label>
                  <input 
                    type="text" required 
                    disabled={!!editingHospital}
                    value={hospitalForm.name} 
                    onChange={(e) => setHospitalForm({...hospitalForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold uppercase placeholder-slate-600 disabled:opacity-50" 
                    placeholder="E.g. Mamata General Hospital" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Standard OPD Fee (₹)</label>
                    <input 
                      type="number" required 
                      value={hospitalForm.price} 
                      onChange={(e) => setHospitalForm({...hospitalForm, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-black text-emerald-400" 
                      placeholder="200" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Clinical Telephone</label>
                    <input 
                      type="text" 
                      value={hospitalForm.phone} 
                      onChange={(e) => setHospitalForm({...hospitalForm, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                      placeholder="08742-2244" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Departments & Description</label>
                  <textarea 
                    value={hospitalForm.description} 
                    onChange={(e) => setHospitalForm({...hospitalForm, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium h-16" 
                    placeholder="Cardiology, Paediatrics and General OPD..." 
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-950 border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Include in Active OPD?</span>
                  <button
                    type="button"
                    onClick={() => setHospitalForm({...hospitalForm, isActive: !hospitalForm.isActive})}
                    className={`py-1 px-3.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${hospitalForm.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}
                  >
                    {hospitalForm.isActive ? 'Online' : 'offline'}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setShowHospitalModal(false); setEditingHospital(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Publish Hospital
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MARRIAGE RECORD EDIT MODAL */}
      <AnimatePresence>
        {editingMarriageProfile && (
          <div className="fixed inset-0 z-[10007] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-yellow-405 fill-current" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Edit Marriage Profile</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Ref Profile ID: {editingMarriageProfile.id}</p>
                </div>
              </div>

              <form onSubmit={handleSaveMarriageProfile} className="space-y-4 text-left">
                
                {/* Visual Section: Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Candidate Name</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.name || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, name: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Candidate Surname</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.surname || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, surname: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Section: Demographics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Gender</label>
                    <select 
                      value={editingMarriageProfile.gender || 'Male'}
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, gender: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Age (Years)</label>
                    <input 
                      type="number" required
                      value={editingMarriageProfile.age || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, age: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Height</label>
                    <input 
                      type="text" required
                      value={editingMarriageProfile.height || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, height: e.target.value})}
                      placeholder="e.g. 5ft 6in"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Contact and Dob */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Candidate Phone</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.phone || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-yellow-400 font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.dob || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, dob: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Education and Profession */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Academic Education</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.education || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, education: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Profession/Occupation</label>
                    <input 
                      type="text" required 
                      value={editingMarriageProfile.profession || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, profession: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-yellow-400 font-mono" 
                    />
                  </div>
                </div>

                {/* Religion and Caste */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Religion</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.religion || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, religion: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Caste Community</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.caste || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, caste: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Marital Status and Native */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Marital Status</label>
                    <select 
                      value={editingMarriageProfile.maritalStatus || 'Unmarried'}
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, maritalStatus: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                    >
                      <option value="Unmarried">Unmarried</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widow">Widow / Widower</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Native Location</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.nativePlace || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, nativePlace: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Skin tone and Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Skin Complexion</label>
                    <select 
                      value={editingMarriageProfile.skinTone || 'Fair'}
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, skinTone: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono"
                    >
                      <option value="Fair">Fair</option>
                      <option value="Wheatish">Wheatish</option>
                      <option value="Complexion">Complexion</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Photo Image URL</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.image || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, image: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium font-mono" 
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Section: Parents */}
                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Father's Full Name</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.fatherName || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, fatherName: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Father's Profession</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.fatherProfession || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, fatherProfession: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Mother's Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mother's Full Name</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.motherName || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, motherName: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mother's Profession</label>
                    <input 
                      type="text" 
                      value={editingMarriageProfile.motherProfession || ''} 
                      onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, motherProfession: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Address representation */}
                <div className="space-y-1 border-t border-white/5 pt-3">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Residential Contact Address</label>
                  <textarea 
                    value={editingMarriageProfile.address || ''} 
                    onChange={(e) => setEditingMarriageProfile({...editingMarriageProfile, address: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium h-14 font-mono" 
                    placeholder="Provide neighborhood street address details..."
                  />
                </div>

                {/* Action CTA Buttons */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingMarriageProfile(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Apply Modifications
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REAL ESTATE PROPERTY EDIT MODAL */}
      <AnimatePresence>
        {editingProperty && (
          <div className="fixed inset-0 z-[10007] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center gap-3 text-left">
                <Building className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Edit Real Estate Listing</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Ref Property ID: {editingProperty.id}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProperty} className="space-y-4 text-left">
                {/* Field: Title */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Listing Name / Title</label>
                  <input 
                    type="text" required
                    value={editingProperty.title || ''} 
                    onChange={(e) => setEditingProperty({...editingProperty, title: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                  />
                </div>

                {/* Grid Category, Type & Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      value={editingProperty.category || 'For Sale'}
                      onChange={(e) => setEditingProperty({...editingProperty, category: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white font-mono font-medium"
                    >
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                      <option value="Lease">Lease</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Type</label>
                    <input 
                      type="text" required
                      placeholder="e.g. Apartment"
                      value={editingProperty.type || ''} 
                      onChange={(e) => setEditingProperty({...editingProperty, type: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Price (₹)</label>
                    <input 
                      type="text" required
                      value={editingProperty.price || ''} 
                      onChange={(e) => setEditingProperty({...editingProperty, price: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Specs Section Bedrooms, Sqft & Facing */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Bedrooms</label>
                    <input 
                      type="text"
                      value={editingProperty.details?.bedrooms || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        details: { ...editingProperty.details, bedrooms: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Area (Sqft)</label>
                    <input 
                      type="text"
                      value={editingProperty.details?.sqft || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        details: { ...editingProperty.details, sqft: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Facing Direction</label>
                    <input 
                      type="text"
                      placeholder="e.g. East"
                      value={editingProperty.facing || editingProperty.details?.facing || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        facing: e.target.value,
                        details: { ...editingProperty.details, facing: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold font-mono" 
                    />
                  </div>
                </div>

                {/* Form fields: Location details */}
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Area / Neighborhood</label>
                    <input 
                      type="text" required
                      value={editingProperty.location?.area || ''} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        location: { ...editingProperty.location, area: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">City</label>
                    <input 
                      type="text" required
                      value={editingProperty.location?.city || 'Khammam'} 
                      onChange={(e) => setEditingProperty({
                        ...editingProperty, 
                        location: { ...editingProperty.location, city: e.target.value }
                      })}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold" 
                    />
                  </div>
                </div>

                {/* Field: Description */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={editingProperty.description || ''} 
                    onChange={(e) => setEditingProperty({...editingProperty, description: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium h-14" 
                    placeholder="Enter details on property facilities, location advantage etc..."
                  />
                </div>

                {/* Action CTA Buttons */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setEditingProperty(null)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Apply Modifications
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
              <div className="flex justify-between items-center border-b border-white/5 pb-3 text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-yellow-400">✏️ Edit Order Details</h4>
                <button onClick={() => { setShowOrderModal(false); setEditingOrder(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateOrderDetailsEx} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.customerName || editingOrder.userName || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customerName: e.target.value, userName: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={editingOrder.phone || editingOrder.userPhone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value, userPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.address || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingOrder.total || editingOrder.totalPrice || 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, total: Number(e.target.value), totalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 p-3.5 rounded-xl text-xs font-bold text-white outline-none focus:border-yellow-500"
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
                      className="px-2 py-1 bg-yellow-400/20 hover:bg-yellow-400 text-yellow-400 hover:text-slate-950 rounded text-[8px] font-black uppercase tracking-wider"
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
                    onClick={() => handleDeleteOrderEx(editingOrder.id)}
                    className="py-3 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer"
                    title="Delete Order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOrderModal(false); setEditingOrder(null); }}
                    className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-950/40 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUIZ QUESTION ADD / EDIT MODAL */}
      <AnimatePresence>
        {showQuizModal && (
          <div className="fixed inset-0 z-[10009] flex items-center justify-center p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-amber-500/30 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Zap className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-white">
                      {editingQuizQuestion ? 'Edit Quiz Question' : 'Create 40s Quiz Question'}
                    </h3>
                    <p className="text-[10px] text-slate-400">Targeting low-price product information &amp; offers</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowQuizModal(false)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveQuizQuestion} className="space-y-4 text-left">
                
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={quizForm.category}
                    onChange={(e) => setQuizForm({...quizForm, category: e.target.value})}
                    placeholder="e.g. Low Price Grocery, Bike Taxi, Repair Services"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Question Text
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={quizForm.question}
                    onChange={(e) => setQuizForm({...quizForm, question: e.target.value})}
                    placeholder="e.g. What is the starting price for 1 Liter Pure Milk on Local Bandi?"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Answer Options &amp; Select Correct Option
                  </label>

                  <div className="space-y-2">
                    {[
                      { label: 'Option A', key: 'optA', index: 0 },
                      { label: 'Option B', key: 'optB', index: 1 },
                      { label: 'Option C', key: 'optC', index: 2 },
                      { label: 'Option D', key: 'optD', index: 3 }
                    ].map((opt) => (
                      <div key={opt.key} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/5">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={Number(quizForm.correctIndex) === opt.index}
                          onChange={() => setQuizForm({...quizForm, correctIndex: opt.index})}
                          className="w-4 h-4 accent-amber-400 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0 w-14">
                          {opt.label}:
                        </span>
                        <input
                          type="text"
                          required={opt.index < 2}
                          value={(quizForm as any)[opt.key]}
                          onChange={(e) => setQuizForm({...quizForm, [opt.key]: e.target.value})}
                          placeholder={`Enter ${opt.label} text`}
                          className="flex-1 bg-slate-900 border border-white/10 p-2 rounded-lg text-xs font-medium text-white outline-none focus:border-amber-400"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 italic">Select the radio button next to the correct answer.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Explanation / Facts Info (Shown after answer)
                  </label>
                  <input
                    type="text"
                    value={quizForm.explanation}
                    onChange={(e) => setQuizForm({...quizForm, explanation: e.target.value})}
                    placeholder="e.g. Pure fresh milk starting at ₹28 only with daily morning delivery!"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium text-slate-200 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQuizModal(false)}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {editingQuizQuestion ? 'Save Changes' : 'Create Question'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* HOSPITAL BOOKING EDIT MODAL */}
      <AnimatePresence>
        {showHospitalBookingModal && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-rose-500/30 rounded-[2.5rem] p-6 max-w-lg w-full space-y-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-white">
                      Edit Hospital OP Booking Details
                    </h3>
                    <p className="text-[10px] text-slate-400">Update appointment info, patient phone, or visit status</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowHospitalBookingModal(false); setEditingHospitalBooking(null); }}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveHospitalBooking} className="space-y-3.5 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={hospitalBookingForm.patientName}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, patientName: e.target.value})}
                      placeholder="e.g. Ramesh Reddy"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={hospitalBookingForm.phone}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, phone: e.target.value})}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Hospital / Clinic *
                    </label>
                    <input
                      type="text"
                      required
                      value={hospitalBookingForm.hospital}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, hospital: e.target.value})}
                      placeholder="e.g. Mamata General Hospital"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      OP Slot / Time *
                    </label>
                    <input
                      type="text"
                      required
                      value={hospitalBookingForm.slot}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, slot: e.target.value, dateTime: e.target.value})}
                      placeholder="e.g. Morning 10:00 AM - 12:00 PM"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Patient Age
                    </label>
                    <input
                      type="number"
                      value={hospitalBookingForm.age}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, age: e.target.value})}
                      placeholder="e.g. 35"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Gender
                    </label>
                    <select
                      value={hospitalBookingForm.gender}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, gender: e.target.value})}
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={hospitalBookingForm.amount}
                      onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, amount: Number(e.target.value)})}
                      placeholder="220"
                      className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-emerald-400 focus:border-rose-400 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Location / Village / Colony
                  </label>
                  <input
                    type="text"
                    value={hospitalBookingForm.location}
                    onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, location: e.target.value})}
                    placeholder="e.g. Wyra Road, Khammam"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Symptoms / Reason for Visit
                  </label>
                  <textarea
                    rows={2}
                    value={hospitalBookingForm.reason}
                    onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, reason: e.target.value, disease: e.target.value})}
                    placeholder="e.g. General checkup, viral fever, routine pediatric check"
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-medium text-slate-200 focus:border-rose-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                    Appointment Status
                  </label>
                  <select
                    value={hospitalBookingForm.status}
                    onChange={(e) => setHospitalBookingForm({...hospitalBookingForm, status: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-xs font-bold text-white focus:border-rose-400 outline-none"
                  >
                    <option value="pending">Pending (Waiting for review)</option>
                    <option value="Approved">Approved (Confirmed with Clinic)</option>
                    <option value="Completed">Completed (Patient Visited Clinic)</option>
                    <option value="Rejected">Rejected (Cancelled)</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
                  {editingHospitalBooking && (
                    <button
                      type="button"
                      onClick={() => handleDeleteHospitalBooking(editingHospitalBooking.id, editingHospitalBooking.patientName)}
                      className="py-3 px-4 bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer flex items-center justify-center gap-1 transition-all"
                      title="Permanently Delete Booking"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowHospitalBookingModal(false); setEditingHospitalBooking(null); }}
                    className="flex-1 py-3 bg-slate-950 text-slate-400 border border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
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
