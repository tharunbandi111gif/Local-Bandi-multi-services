import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Printer, 
  ArrowUpRight, 
  AlertCircle, 
  ShieldCheck, 
  Bike, 
  Layers, 
  Receipt, 
  ExternalLink, 
  Sparkles, 
  X, 
  Building2, 
  Zap, 
  CreditCard,
  Banknote,
  DollarSign
} from 'lucide-react';
import { DeliveryPartnerProfile } from '../types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TripBreakdown {
  id: string; // e.g. ORD-98421
  orderDocId?: string;
  date: string;
  time: string;
  rawDate: Date;
  monthKey: string; // e.g. "2026-09"
  customerName: string;
  customerPhone?: string;
  pickupName: string;
  pickupAddress: string;
  deliveryAddress: string;
  itemsSummary: string;
  distanceKm: number;
  durationMins: number;
  
  // Line-item financial breakdown
  baseFare: number;
  distanceFare: number;
  customerTip: number;
  surgeBonus: number;
  onTimeIncentive: number;
  deductionFee: number;
  totalPayout: number;
  
  payoutBatchId: string;
  payoutReference?: string;
  status: 'Delivered';
  payoutStatus: 'Settled' | 'Processing' | 'Pending';
  paymentMode: 'Online Prepaid' | 'Cash on Delivery';
  cashCollected?: number;
}

export interface PayoutBatch {
  id: string; // e.g. PAY-20260907-8841
  referenceNumber: string; // e.g. UTR-9284102941
  periodLabel: string;
  date: string;
  monthKey: string;
  amount: number;
  tripsCount: number;
  paymentMethod: string;
  status: 'Settled' | 'Processing' | 'Pending';
  grossEarnings: number;
  tipsTotal: number;
  incentivesTotal: number;
  tripIds: string[];
}

interface RiderPayoutEarningsViewProps {
  profile: DeliveryPartnerProfile | null;
  tripHistory: any[];
  onBack: () => void;
  isAdmin?: boolean;
}

// Fixed reference dates and static historical seed data for realistic Indian tier-2 logistics
const AVAILABLE_MONTHS = [
  { key: '2026-09', label: 'September 2026 (Current)', shortLabel: 'Sep 2026', isCurrent: true },
  { key: '2026-08', label: 'August 2026', shortLabel: 'Aug 2026', isCurrent: false },
  { key: '2026-07', label: 'July 2026', shortLabel: 'Jul 2026', isCurrent: false },
  { key: '2026-06', label: 'June 2026', shortLabel: 'Jun 2026', isCurrent: false },
];

export const RiderPayoutEarningsView: React.FC<RiderPayoutEarningsViewProps> = ({
  profile,
  tripHistory,
  onBack,
  isAdmin = false
}) => {
  // Navigation tabs within Earnings
  const [earningsView, setEarningsView] = useState<'summary' | 'payouts' | 'trips'>('summary');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  
  // Trip filters
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState<'ALL' | 'Settled' | 'Pending'>('ALL');
  const [selectedTripModal, setSelectedTripModal] = useState<TripBreakdown | null>(null);
  
  // Payout filters
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'ALL' | 'Settled' | 'Processing' | 'Pending'>('ALL');
  const [selectedBatchModal, setSelectedBatchModal] = useState<PayoutBatch | null>(null);
  
  // Instant withdrawal request modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState<string | null>(null);

  // Local pending payout tracker
  const [localPendingPayout, setLocalPendingPayout] = useState<number>(() => profile?.pendingPayout ?? 450);

  // Synchronize with profile
  React.useEffect(() => {
    if (profile?.pendingPayout !== undefined) {
      setLocalPendingPayout(profile.pendingPayout);
    }
  }, [profile?.pendingPayout]);

  // Generate combined list of real Firestore trips + structured historical data
  const { allTrips, allPayoutBatches } = useMemo(() => {
    const generatedTrips: TripBreakdown[] = [];
    const generatedBatches: PayoutBatch[] = [];

    // 1. Process real Firestore Delivered orders
    const firestoreTrips: TripBreakdown[] = (tripHistory || []).map((order: any, idx: number) => {
      const orderDate = order.updatedAt?.seconds 
        ? new Date(order.updatedAt.seconds * 1000) 
        : (order.createdAt ? new Date(order.createdAt) : new Date(2026, 8, Math.max(1, 8 - (idx % 8)), 14, 20 + idx));
      
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const distance = order.distanceKm || parseFloat((2.8 + (idx * 0.7 % 4.5)).toFixed(1));
      const baseFare = 25;
      const distanceFare = Math.round(distance * 6);
      const customerTip = order.tipAmount || (idx % 3 === 0 ? 20 : idx % 5 === 0 ? 30 : 0);
      const surgeBonus = idx % 4 === 0 ? 15 : 0;
      const onTimeIncentive = 5;
      const totalPayout = baseFare + distanceFare + customerTip + surgeBonus + onTimeIncentive;
      const isSettled = idx > 1; // Last 2 are pending current cycle

      return {
        id: order.id ? (order.id.startsWith('ORD-') ? order.id : `ORD-${order.id.slice(-6).toUpperCase()}`) : `ORD-REAL-${idx + 101}`,
        orderDocId: order.id,
        date: orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        rawDate: orderDate,
        monthKey,
        customerName: order.customerName || `Customer #${(idx + 10).toString().padStart(3, '0')}`,
        customerPhone: order.customerPhone || '+91 98480 •••••',
        pickupName: order.vendorName || 'Bawarchi Grand Kitchen',
        pickupAddress: order.pickupAddress || 'Shop #14, Wyra Road, Khammam',
        deliveryAddress: order.deliveryAddress || 'Plot 42, Sri Sri Circle, Khammam',
        itemsSummary: Array.isArray(order.items) ? (order.items.join(', ') || '1x Meal Combo') : (order.items || '2x Hot Meals & Drinks'),
        distanceKm: distance,
        durationMins: Math.round(distance * 3.5 + 8),
        baseFare,
        distanceFare,
        customerTip,
        surgeBonus,
        onTimeIncentive,
        deductionFee: 0,
        totalPayout,
        payoutBatchId: isSettled ? 'PAY-20260904-9912' : 'PAY-PENDING-CYCLE',
        payoutReference: isSettled ? 'UTR-9284102941' : undefined,
        status: 'Delivered',
        payoutStatus: isSettled ? 'Settled' : 'Pending',
        paymentMode: order.paymentMethod === 'Cash On Delivery' ? 'Cash on Delivery' : 'Online Prepaid',
        cashCollected: order.paymentMethod === 'Cash On Delivery' ? (order.amount || 280) : 0
      };
    });

    generatedTrips.push(...firestoreTrips);

    // 2. Add realistic historical trips for past dates in Sep, Aug, Jul to provide full depth
    const mockSeedTrips: TripBreakdown[] = [
      // September 2026 (Recent Days)
      {
        id: 'ORD-98421',
        date: '08 Sep 2026',
        time: '01:15 PM',
        rawDate: new Date(2026, 8, 8, 13, 15),
        monthKey: '2026-09',
        customerName: 'Kavitha Reddy',
        customerPhone: '+91 98481 29481',
        pickupName: 'Heritage Fresh Superstore',
        pickupAddress: 'Mayuri Centre, Khammam Main Road',
        deliveryAddress: 'Flat 302, Green Meadows Apt, Mamillagudem',
        itemsSummary: '3x Organic Dairy Milk, Fresh Vegetables, Brown Bread',
        distanceKm: 3.8,
        durationMins: 16,
        baseFare: 25,
        distanceFare: 23,
        customerTip: 20,
        surgeBonus: 10,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 83,
        payoutBatchId: 'PAY-PENDING-CYCLE',
        status: 'Delivered',
        payoutStatus: 'Pending',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-98319',
        date: '07 Sep 2026',
        time: '08:45 PM',
        rawDate: new Date(2026, 8, 7, 20, 45),
        monthKey: '2026-09',
        customerName: 'Venkatesh Rao',
        customerPhone: '+91 99882 10921',
        pickupName: 'Paradise Biryani Palace',
        pickupAddress: 'Bypass Road, Gandhi Chowk, Khammam',
        deliveryAddress: 'H.No 4-2-89, Balanagar, Khammam',
        itemsSummary: '2x Hyderabadi Special Mutton Biryani, 1x Mirchi Salan',
        distanceKm: 5.2,
        durationMins: 22,
        baseFare: 25,
        distanceFare: 31,
        customerTip: 30,
        surgeBonus: 15,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 106,
        payoutBatchId: 'PAY-PENDING-CYCLE',
        status: 'Delivered',
        payoutStatus: 'Pending',
        paymentMode: 'Cash on Delivery',
        cashCollected: 740
      },
      {
        id: 'ORD-98104',
        date: '06 Sep 2026',
        time: '12:10 PM',
        rawDate: new Date(2026, 8, 6, 12, 10),
        monthKey: '2026-09',
        customerName: 'Anil Kumar Sharma',
        customerPhone: '+91 94401 88392',
        pickupName: 'Apollo Pharmacy Quick',
        pickupAddress: 'Wyra Road, Beside Bus Depot, Khammam',
        deliveryAddress: 'D.No 8-11-20, Prakash Nagar, Khammam',
        itemsSummary: 'Essential Medicines, Vitamin Supplements, Health Drinks',
        distanceKm: 2.4,
        durationMins: 12,
        baseFare: 25,
        distanceFare: 14,
        customerTip: 10,
        surgeBonus: 0,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 54,
        payoutBatchId: 'PAY-20260907-7721',
        payoutReference: 'UTR-9284102941',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-97992',
        date: '05 Sep 2026',
        time: '07:30 PM',
        rawDate: new Date(2026, 8, 5, 19, 30),
        monthKey: '2026-09',
        customerName: 'Priya Sundaram',
        pickupName: 'Sri Krishna Sweets & Bakery',
        pickupAddress: 'NTR Circle, Khammam',
        deliveryAddress: 'House #19, Khanapuram Haveli, Khammam',
        itemsSummary: 'Assorted Kaju Sweets (1kg), Hot Samosas (4 pcs)',
        distanceKm: 4.1,
        durationMins: 18,
        baseFare: 25,
        distanceFare: 25,
        customerTip: 15,
        surgeBonus: 10,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 80,
        payoutBatchId: 'PAY-20260907-7721',
        payoutReference: 'UTR-9284102941',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-97782',
        date: '04 Sep 2026',
        time: '02:20 PM',
        rawDate: new Date(2026, 8, 4, 14, 20),
        monthKey: '2026-09',
        customerName: 'Mohd. Imran',
        pickupName: 'New Green Mart Vegetables',
        pickupAddress: 'Rythu Bazaar, Khammam',
        deliveryAddress: 'Plot 11, NSP Colony, Khammam',
        itemsSummary: 'Weekly Organic Veggies & Fruit Basket',
        distanceKm: 3.2,
        durationMins: 15,
        baseFare: 25,
        distanceFare: 19,
        customerTip: 0,
        surgeBonus: 0,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 49,
        payoutBatchId: 'PAY-20260907-7721',
        payoutReference: 'UTR-9284102941',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-97510',
        date: '02 Sep 2026',
        time: '09:15 PM',
        rawDate: new Date(2026, 8, 2, 21, 15),
        monthKey: '2026-09',
        customerName: 'Suresh Goud',
        pickupName: 'Hotel Swagath Residency',
        pickupAddress: 'Station Road, Khammam',
        deliveryAddress: 'Rotary Nagar, Sector 3, Khammam',
        itemsSummary: 'North Indian Thali, Paneer Butter Masala',
        distanceKm: 4.6,
        durationMins: 20,
        baseFare: 25,
        distanceFare: 28,
        customerTip: 25,
        surgeBonus: 15,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 98,
        payoutBatchId: 'PAY-20260907-7721',
        payoutReference: 'UTR-9284102941',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Cash on Delivery',
        cashCollected: 520
      },

      // August 2026 Mock Trips
      {
        id: 'ORD-95412',
        date: '31 Aug 2026',
        time: '08:10 PM',
        rawDate: new Date(2026, 7, 31, 20, 10),
        monthKey: '2026-08',
        customerName: 'Lakshmi Narayana',
        pickupName: 'Ratnadeep Supermarket',
        pickupAddress: 'Trunk Road, Khammam',
        deliveryAddress: 'Bank Colony, Khammam',
        itemsSummary: 'Household Provisions, Groceries & Detergent',
        distanceKm: 3.5,
        durationMins: 16,
        baseFare: 25,
        distanceFare: 21,
        customerTip: 20,
        surgeBonus: 10,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 81,
        payoutBatchId: 'PAY-20260831-6619',
        payoutReference: 'UTR-8192039182',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-94921',
        date: '25 Aug 2026',
        time: '01:30 PM',
        rawDate: new Date(2026, 7, 25, 13, 30),
        monthKey: '2026-08',
        customerName: 'Rajesh Varma',
        pickupName: 'Chef Bakers Cafe',
        pickupAddress: 'Khammam Main Road',
        deliveryAddress: 'Teachers Colony, Khammam',
        itemsSummary: 'Chocolate Truffle Cake (1kg), Snacks Box',
        distanceKm: 4.8,
        durationMins: 21,
        baseFare: 25,
        distanceFare: 29,
        customerTip: 50,
        surgeBonus: 15,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 124,
        payoutBatchId: 'PAY-20260825-5510',
        payoutReference: 'UTR-7829103948',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-94110',
        date: '18 Aug 2026',
        time: '07:45 PM',
        rawDate: new Date(2026, 7, 18, 19, 45),
        monthKey: '2026-08',
        customerName: 'Bhavani Shankar',
        pickupName: 'Spicy Delight Kitchen',
        pickupAddress: 'Nehru Nagar, Khammam',
        deliveryAddress: 'Collectorate Staff Quarters, Khammam',
        itemsSummary: 'Chicken Dum Biryani, Tandoori Chicken Half',
        distanceKm: 3.9,
        durationMins: 18,
        baseFare: 25,
        distanceFare: 23,
        customerTip: 15,
        surgeBonus: 10,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 78,
        payoutBatchId: 'PAY-20260818-4421',
        payoutReference: 'UTR-7182930491',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Cash on Delivery',
        cashCollected: 610
      },

      // July 2026 Mock Trips
      {
        id: 'ORD-91204',
        date: '28 Jul 2026',
        time: '08:30 PM',
        rawDate: new Date(2026, 6, 28, 20, 30),
        monthKey: '2026-07',
        customerName: 'Satish Babu',
        pickupName: 'Khammam Tiffins Central',
        pickupAddress: 'Opp. Old Bus Stand, Khammam',
        deliveryAddress: 'Sundaraiah Nagar, Khammam',
        itemsSummary: '4x Masala Dosa, 2x Filter Coffee, Vada Combo',
        distanceKm: 3.1,
        durationMins: 14,
        baseFare: 25,
        distanceFare: 19,
        customerTip: 10,
        surgeBonus: 5,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 64,
        payoutBatchId: 'PAY-20260731-3310',
        payoutReference: 'UTR-6192830192',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      },
      {
        id: 'ORD-90812',
        date: '15 Jul 2026',
        time: '02:00 PM',
        rawDate: new Date(2026, 6, 15, 14, 0),
        monthKey: '2026-07',
        customerName: 'Farida Begum',
        pickupName: 'MedPlus Express',
        pickupAddress: 'Gole Bazaar, Khammam',
        deliveryAddress: 'Burhanpuram, Khammam',
        itemsSummary: 'Prescription Inhaler & First Aid Supplies',
        distanceKm: 2.7,
        durationMins: 13,
        baseFare: 25,
        distanceFare: 16,
        customerTip: 20,
        surgeBonus: 0,
        onTimeIncentive: 5,
        deductionFee: 0,
        totalPayout: 66,
        payoutBatchId: 'PAY-20260718-2201',
        payoutReference: 'UTR-5918293819',
        status: 'Delivered',
        payoutStatus: 'Settled',
        paymentMode: 'Online Prepaid'
      }
    ];

    generatedTrips.push(...mockSeedTrips);

    // 3. Construct Payout Batches
    generatedBatches.push(
      {
        id: 'PAY-PENDING-CYCLE',
        referenceNumber: 'IN-PROGRESS / Next Tuesday Cycle',
        periodLabel: 'Current Unsettled Cycle (07 Sep - 08 Sep)',
        date: 'Estimated 09 Sep 2026, 06:00 AM',
        monthKey: '2026-09',
        amount: generatedTrips.filter(t => t.payoutBatchId === 'PAY-PENDING-CYCLE').reduce((sum, t) => sum + t.totalPayout, 0) || 450,
        tripsCount: generatedTrips.filter(t => t.payoutBatchId === 'PAY-PENDING-CYCLE').length || 4,
        paymentMethod: profile?.bankName ? `${profile.bankName} (•••• ${profile.accountNumber?.slice(-4) || '4892'})` : 'Google Pay UPI: rider@okaxis',
        status: 'Pending',
        grossEarnings: generatedTrips.filter(t => t.payoutBatchId === 'PAY-PENDING-CYCLE').reduce((sum, t) => sum + t.totalPayout, 0) || 450,
        tipsTotal: generatedTrips.filter(t => t.payoutBatchId === 'PAY-PENDING-CYCLE').reduce((sum, t) => sum + t.customerTip, 0) || 50,
        incentivesTotal: generatedTrips.filter(t => t.payoutBatchId === 'PAY-PENDING-CYCLE').reduce((sum, t) => sum + t.surgeBonus + t.onTimeIncentive, 0) || 50,
        tripIds: generatedTrips.filter(t => t.payoutBatchId === 'PAY-PENDING-CYCLE').map(t => t.id)
      },
      {
        id: 'PAY-20260907-7721',
        referenceNumber: 'UTR-9284102941 (IMPS)',
        periodLabel: 'Weekly Remittance Cycle (01 Sep - 06 Sep)',
        date: '07 Sep 2026, 11:30 AM',
        monthKey: '2026-09',
        amount: 2840,
        tripsCount: 42,
        paymentMethod: profile?.bankName ? `${profile.bankName} •••• ${profile.accountNumber?.slice(-4) || '4892'}` : 'HDFC Bank (•••• 4892) - Direct IMPS',
        status: 'Settled',
        grossEarnings: 2840,
        tipsTotal: 420,
        incentivesTotal: 380,
        tripIds: generatedTrips.filter(t => t.payoutBatchId === 'PAY-20260907-7721').map(t => t.id)
      },
      {
        id: 'PAY-20260831-6619',
        referenceNumber: 'UTR-8192039182 (IMPS)',
        periodLabel: 'Weekly Remittance Cycle (25 Aug - 31 Aug)',
        date: '31 Aug 2026, 06:15 PM',
        monthKey: '2026-08',
        amount: 3620,
        tripsCount: 54,
        paymentMethod: 'HDFC Bank (•••• 4892) - Direct IMPS',
        status: 'Settled',
        grossEarnings: 3620,
        tipsTotal: 580,
        incentivesTotal: 490,
        tripIds: ['ORD-95412']
      },
      {
        id: 'PAY-20260825-5510',
        referenceNumber: 'UTR-7829103948 (IMPS)',
        periodLabel: 'Weekly Remittance Cycle (18 Aug - 24 Aug)',
        date: '25 Aug 2026, 02:40 PM',
        monthKey: '2026-08',
        amount: 3410,
        tripsCount: 50,
        paymentMethod: 'HDFC Bank (•••• 4892) - Direct IMPS',
        status: 'Settled',
        grossEarnings: 3410,
        tipsTotal: 520,
        incentivesTotal: 460,
        tripIds: ['ORD-94921']
      },
      {
        id: 'PAY-20260818-4421',
        referenceNumber: 'UTR-7182930491 (IMPS)',
        periodLabel: 'Weekly Remittance Cycle (11 Aug - 17 Aug)',
        date: '18 Aug 2026, 11:20 AM',
        monthKey: '2026-08',
        amount: 3890,
        tripsCount: 58,
        paymentMethod: 'HDFC Bank (•••• 4892) - Direct IMPS',
        status: 'Settled',
        grossEarnings: 3890,
        tipsTotal: 640,
        incentivesTotal: 550,
        tripIds: ['ORD-94110']
      },
      {
        id: 'PAY-20260731-3310',
        referenceNumber: 'UTR-6192830192 (IMPS)',
        periodLabel: 'Monthly Settlement Reconciliation (Jul End)',
        date: '31 Jul 2026, 04:00 PM',
        monthKey: '2026-07',
        amount: 14250,
        tripsCount: 216,
        paymentMethod: 'HDFC Bank (•••• 4892) - Direct IMPS',
        status: 'Settled',
        grossEarnings: 14250,
        tipsTotal: 2180,
        incentivesTotal: 1950,
        tripIds: ['ORD-91204', 'ORD-90812']
      }
    );

    return { allTrips: generatedTrips, allPayoutBatches: generatedBatches };
  }, [tripHistory, profile]);

  // Filtered trips for selected month
  const monthTrips = useMemo(() => {
    return allTrips.filter(t => t.monthKey === selectedMonth);
  }, [allTrips, selectedMonth]);

  // Filtered batches for selected month
  const monthBatches = useMemo(() => {
    return allPayoutBatches.filter(b => b.monthKey === selectedMonth);
  }, [allPayoutBatches, selectedMonth]);

  // Compute Cumulative Monthly Summary
  const monthlySummary = useMemo(() => {
    const isCurrent = selectedMonth === '2026-09';
    
    // Aggregate from month trips or realistic baselines
    const tripsCount = isCurrent ? Math.max(monthTrips.length, profile?.trips || 18) : (selectedMonth === '2026-08' ? 212 : 216);
    
    // Totals
    const basePayTotal = Math.round(tripsCount * 25);
    const distancePayTotal = Math.round(tripsCount * 21.5);
    const tipsTotal = isCurrent ? 510 : (selectedMonth === '2026-08' ? 2280 : 2180);
    const surgeTotal = isCurrent ? 390 : (selectedMonth === '2026-08' ? 1640 : 1550);
    const bonusTotal = isCurrent ? 250 : 1200; // Monthly super rider milestone bonus
    
    const grossEarnings = basePayTotal + distancePayTotal + tipsTotal + surgeTotal + bonusTotal;
    const settledAmount = isCurrent ? Math.max(0, grossEarnings - localPendingPayout) : grossEarnings;
    const pendingAmount = isCurrent ? localPendingPayout : 0;
    
    const averagePerTrip = tripsCount > 0 ? Math.round(grossEarnings / tripsCount) : 0;
    const totalDistanceKm = Math.round(tripsCount * 3.8);
    const activeHours = Math.round(tripsCount * 0.45);
    const effectiveHourlyRate = activeHours > 0 ? Math.round(grossEarnings / activeHours) : 0;

    const targetTrips = 200;
    const targetAchievedPercent = Math.min(100, Math.round((tripsCount / targetTrips) * 100));
    const growthPercent = selectedMonth === '2026-09' ? 14.2 : selectedMonth === '2026-08' ? 8.5 : 5.0;

    return {
      monthKey: selectedMonth,
      isCurrent,
      grossEarnings,
      settledAmount,
      pendingAmount,
      tripsCount,
      averagePerTrip,
      totalDistanceKm,
      activeHours,
      effectiveHourlyRate,
      basePayTotal,
      distancePayTotal,
      tipsTotal,
      surgeTotal,
      bonusTotal,
      targetTrips,
      targetAchievedPercent,
      growthPercent
    };
  }, [selectedMonth, monthTrips, profile?.trips, localPendingPayout]);

  // Filtered trips list based on user search & status
  const displayedTrips = useMemo(() => {
    return monthTrips.filter(trip => {
      const matchStatus = tripStatusFilter === 'ALL' || trip.payoutStatus === tripStatusFilter;
      const q = tripSearch.toLowerCase().trim();
      const matchSearch = !q || 
        trip.id.toLowerCase().includes(q) ||
        trip.customerName.toLowerCase().includes(q) ||
        trip.pickupName.toLowerCase().includes(q) ||
        trip.deliveryAddress.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [monthTrips, tripStatusFilter, tripSearch]);

  // Filtered payout batches
  const displayedBatches = useMemo(() => {
    return monthBatches.filter(b => {
      return payoutStatusFilter === 'ALL' || b.status === payoutStatusFilter;
    });
  }, [monthBatches, payoutStatusFilter]);

  // Handle instant withdrawal request
  const handleInitiateWithdrawal = () => {
    setWithdrawAmount(monthlySummary.pendingAmount > 0 ? monthlySummary.pendingAmount : 450);
    setIsWithdrawModalOpen(true);
  };

  const handleConfirmWithdrawal = async () => {
    setIsSubmittingWithdraw(true);
    try {
      // Simulate real bank/UPI transfer gateway processing
      await new Promise(r => setTimeout(r, 1200));

      if (profile?.id && db) {
        try {
          const partnerDocRef = doc(db, 'deliveryPartners', profile.id);
          await updateDoc(partnerDocRef, {
            pendingPayout: 0,
            lastPayoutDate: new Date().toISOString(),
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn("Could not update remote profile pendingPayout:", e);
        }
      }

      setLocalPendingPayout(0);
      setWithdrawSuccessMsg(`Success! ₹${withdrawAmount.toLocaleString()} has been queued for instant payout to your ${selectedWithdrawMethod === 'upi' ? 'UPI ID' : 'Bank Account'}. Reference UTR will be generated shortly.`);
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccessMsg(null);
      }, 2500);
    } catch (err) {
      alert("Failed to process withdrawal request. Please retry.");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 pb-28">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Return to home"
              id="rider-earnings-back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Rider Finance Ledger
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Auto-Settlement Active
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Earnings &amp; Payouts
              </h1>
            </div>
          </div>

          {/* Month Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 transition-all">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 ml-1.5" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 pr-2 py-1 outline-none cursor-pointer"
                id="rider-month-selector"
              >
                {AVAILABLE_MONTHS.map(m => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Switcher Pill Navigation */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setEarningsView('summary')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                earningsView === 'summary'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              id="tab-btn-monthly-summary"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Monthly Summary</span>
            </button>
            <button
              onClick={() => setEarningsView('payouts')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                earningsView === 'payouts'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              id="tab-btn-payout-history"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Payout History ({monthBatches.length})</span>
            </button>
            <button
              onClick={() => setEarningsView('trips')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                earningsView === 'trips'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              id="tab-btn-trip-breakdowns"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Trip Breakdowns ({monthTrips.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-6">

        {/* 1. TOP CUMULATIVE BALANCE & WITHDRAWAL CALLOUT */}
        <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-indigo-900/40">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full -mr-20 -mt-20 blur-3xl opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500 rounded-full -ml-16 -mb-16 blur-3xl opacity-15 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 font-mono bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {AVAILABLE_MONTHS.find(m => m.key === selectedMonth)?.shortLabel} Gross Accumulation
                </span>
                {monthlySummary.growthPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                    <TrendingUp className="w-2.5 h-2.5" /> +{monthlySummary.growthPercent}% vs Prev Month
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white font-mono">
                  ₹{monthlySummary.grossEarnings.toLocaleString()}
                </h2>
                <span className="text-xs text-slate-400 font-medium">Net Total Earned</span>
              </div>

              <p className="text-xs text-slate-300 mt-2 max-w-md leading-relaxed">
                Includes base delivery earnings, distance surge allowances, 100% customer tips, and weekly performance bonuses.
              </p>
            </div>

            {/* Current Withdrawable Balance Pill & Action */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[260px] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                  <span>Available to Withdraw:</span>
                  <span className="text-amber-300 font-black">Ready</span>
                </div>
                <p className="text-2xl font-black text-amber-400 font-mono">
                  ₹{monthlySummary.pendingAmount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">
                  Auto-settles every Tuesday • Instant IMPS Available
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleInitiateWithdrawal}
                  disabled={monthlySummary.pendingAmount <= 0}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                    monthlySummary.pendingAmount > 0
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                      : 'bg-white/10 text-slate-400 cursor-not-allowed'
                  }`}
                  id="btn-withdraw-now"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Withdraw Now</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: CUMULATIVE MONTHLY EARNINGS SUMMARY                    */}
        {/* ------------------------------------------------------------- */}
        {earningsView === 'summary' && (
          <div className="space-y-6">
            {/* Quick KPI Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  Completed Trips
                </span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {monthlySummary.tripsCount}
                </p>
                <span className="text-[10px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                  <Bike className="w-3 h-3" /> 100% Fulfilled
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  Average / Trip
                </span>
                <p className="text-xl font-black text-emerald-600 font-mono">
                  ₹{monthlySummary.averagePerTrip}
                </p>
                <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                  Base + Surges + Tips
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  Settled into Bank
                </span>
                <p className="text-xl font-black text-indigo-600 font-mono">
                  ₹{monthlySummary.settledAmount.toLocaleString()}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Disbursed
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                  Active Hours
                </span>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {monthlySummary.activeHours} hrs
                </p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                  ₹{monthlySummary.effectiveHourlyRate}/hr avg
                </span>
              </div>
            </div>

            {/* Categorized Earning Stream Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Itemized Monthly Earnings Stream
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transparent formula breakdown of your earnings for {AVAILABLE_MONTHS.find(m => m.key === selectedMonth)?.shortLabel}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {monthlySummary.tripsCount} Deliveries Total
                </span>
              </div>

              {/* Progress Visual Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${(monthlySummary.basePayTotal / monthlySummary.grossEarnings) * 100}%` }} 
                    className="bg-indigo-600 h-full" 
                    title="Base Pay"
                  />
                  <div 
                    style={{ width: `${(monthlySummary.distancePayTotal / monthlySummary.grossEarnings) * 100}%` }} 
                    className="bg-sky-500 h-full" 
                    title="Distance Surge"
                  />
                  <div 
                    style={{ width: `${(monthlySummary.tipsTotal / monthlySummary.grossEarnings) * 100}%` }} 
                    className="bg-amber-400 h-full" 
                    title="Customer Tips"
                  />
                  <div 
                    style={{ width: `${(monthlySummary.surgeTotal / monthlySummary.grossEarnings) * 100}%` }} 
                    className="bg-purple-500 h-full" 
                    title="Surge & Rain"
                  />
                  <div 
                    style={{ width: `${(monthlySummary.bonusTotal / monthlySummary.grossEarnings) * 100}%` }} 
                    className="bg-emerald-500 h-full" 
                    title="Milestone Bonus"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>0%</span>
                  <span>100% Net Retained</span>
                </div>
              </div>

              {/* Stream Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                      <span className="text-xs font-bold text-slate-700">Base Delivery Pay</span>
                    </div>
                    <span className="text-[10px] text-slate-500">₹25 per order completed</span>
                  </div>
                  <span className="text-sm font-black text-indigo-950 font-mono">
                    ₹{monthlySummary.basePayTotal.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                      <span className="text-xs font-bold text-slate-700">Distance Surge</span>
                    </div>
                    <span className="text-[10px] text-slate-500">₹6/km beyond threshold</span>
                  </div>
                  <span className="text-sm font-black text-sky-950 font-mono">
                    ₹{monthlySummary.distancePayTotal.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="text-xs font-bold text-slate-700">Customer Tips</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">100% directly to rider</span>
                  </div>
                  <span className="text-sm font-black text-amber-950 font-mono">
                    ₹{monthlySummary.tipsTotal.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                      <span className="text-xs font-bold text-slate-700">Peak &amp; Rain Surge</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Lunch, dinner &amp; bad weather</span>
                  </div>
                  <span className="text-sm font-black text-purple-950 font-mono">
                    ₹{monthlySummary.surgeTotal.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-xs font-bold text-slate-700">Milestone Bonus</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Tier achievement bonus</span>
                  </div>
                  <span className="text-sm font-black text-emerald-950 font-mono">
                    ₹{monthlySummary.bonusTotal.toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                      <span className="text-xs font-bold text-slate-700">Platform Deductions</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold">₹0 Commission Policy</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    ₹0
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Incentive Goal Tracker Card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">
                      Super Rider Monthly Bonus Tier
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Deliver 200 orders in a calendar month to unlock a flat ₹1,200 bonus reward!
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-700 font-mono">
                    {monthlySummary.tripsCount} / {monthlySummary.targetTrips} Trips
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {monthlySummary.targetAchievedPercent}% Completed
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-indigo-200/50 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${monthlySummary.targetAchievedPercent}%` }} 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-2">
                <span>Tier 1: 100 Trips (₹500 Bonus)</span>
                <span>Tier 2: 200 Trips (₹1,200 Bonus)</span>
              </div>
            </div>

            {/* Quick Action Navigation Buttons to deep views */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setEarningsView('payouts')}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Inspect Detailed Payout Batches
                    </span>
                    <span className="text-[10px] text-slate-500">
                      View UTR codes, bank transfers &amp; batch statements
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setEarningsView('trips')}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      Explore Individual Trip Breakdowns
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Per-trip base pay, km surge, customer tips &amp; route receipts
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: DETAILED PAYOUT HISTORY & BATCHES                     */}
        {/* ------------------------------------------------------------- */}
        {earningsView === 'payouts' && (
          <div className="space-y-4">
            {/* Filter pills for Payouts */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {(['ALL', 'Settled', 'Processing', 'Pending'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setPayoutStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      payoutStatusFilter === status
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {status === 'ALL' ? 'All Disbursements' : status}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-500 font-mono">
                Showing {displayedBatches.length} batch{displayedBatches.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Payout Batches List */}
            <div className="space-y-3">
              {displayedBatches.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase">
                    No payout records found for selected filter
                  </p>
                </div>
              ) : (
                displayedBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-indigo-200 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {batch.id}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                            batch.status === 'Settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : batch.status === 'Processing'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {batch.status === 'Settled' ? '✓ Settled to Bank' : batch.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{batch.periodLabel}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-lg font-black text-slate-900 font-mono">
                          ₹{batch.amount.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">{batch.date}</p>
                      </div>
                    </div>

                    {/* Batch details summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Method</span>
                        <span className="text-[11px] font-bold text-slate-700 truncate block">
                          {batch.paymentMethod}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">UTR / Ref</span>
                        <span className="text-[11px] font-mono font-bold text-indigo-700 truncate block">
                          {batch.referenceNumber}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Trips Included</span>
                        <span className="text-[11px] font-bold text-slate-700 block">
                          {batch.tripsCount} Deliveries
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Tips Included</span>
                        <span className="text-[11px] font-bold text-emerald-700 block font-mono">
                          +₹{batch.tipsTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedBatchModal(batch)}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Settlement Statement Slip</span>
                      </button>

                      <button
                        onClick={() => {
                          setEarningsView('trips');
                          setTripSearch('');
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Trips</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: INDIVIDUAL TRIP BREAKDOWNS (ORDER-BY-ORDER FARE)      */}
        {/* ------------------------------------------------------------- */}
        {earningsView === 'trips' && (
          <div className="space-y-4">
            {/* Search & Filter Header */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    placeholder="Search by Order ID, merchant, customer or location..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-indigo-500"
                    id="search-trip-input"
                  />
                  {tripSearch && (
                    <button
                      onClick={() => setTripSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1">
                  {(['ALL', 'Settled', 'Pending'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTripStatusFilter(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        tripStatusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Showing {displayedTrips.length} trip breakdown{displayedTrips.length !== 1 ? 's' : ''} for {AVAILABLE_MONTHS.find(m => m.key === selectedMonth)?.shortLabel}
                </span>
                <span className="font-mono text-emerald-600 font-bold">
                  Total Payout: ₹{displayedTrips.reduce((acc, t) => acc + t.totalPayout, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Individual Trips Accordion / Cards */}
            <div className="space-y-3">
              {displayedTrips.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase">
                    No trips match your query
                  </p>
                </div>
              ) : (
                displayedTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-300 transition-all space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {trip.id}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                            trip.payoutStatus === 'Settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {trip.payoutStatus}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {trip.date} • {trip.time}
                          </span>
                        </div>

                        {/* Customer & Merchant Summary */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                            <span className="truncate">{trip.pickupName}</span>
                            <span className="text-slate-400 font-normal">({trip.pickupAddress})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{trip.customerName}</span>
                            <span className="text-slate-400 font-normal">({trip.deliveryAddress})</span>
                          </div>
                        </div>
                      </div>

                      {/* Net trip earnings */}
                      <div className="text-right shrink-0">
                        <span className="text-xl font-black text-emerald-600 font-mono block">
                          +₹{trip.totalPayout}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {trip.distanceKm} km • {trip.durationMins}m
                        </span>
                      </div>
                    </div>

                    {/* Fare Itemized Breakdown Strip */}
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Base Fare</span>
                        <span className="font-mono font-bold text-slate-700">₹{trip.baseFare}</span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">
                          Distance ({trip.distanceKm}km)
                        </span>
                        <span className="font-mono font-bold text-slate-700">₹{trip.distanceFare}</span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Customer Tip</span>
                        <span className="font-mono font-bold text-amber-600">
                          {trip.customerTip > 0 ? `+₹${trip.customerTip}` : '₹0'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Surge / Incentive</span>
                        <span className="font-mono font-bold text-purple-600">
                          +₹{trip.surgeBonus + trip.onTimeIncentive}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Payment Mode</span>
                        <span className="font-bold text-slate-700 truncate block">
                          {trip.paymentMode}
                        </span>
                      </div>
                    </div>

                    {/* View Full Trip Receipt Modal Trigger */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setSelectedTripModal(trip)}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>View Itemized Delivery Slip</span>
                      </button>

                      {trip.paymentMode === 'Cash on Delivery' && trip.cashCollected && (
                        <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          COD Collected: ₹{trip.cashCollected}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: TRIP BREAKDOWN ITEM RECEIPT SLIP                      */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedTripModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Trip Payout Receipt
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Ref: {selectedTripModal.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTripModal(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Delivery Timestamp & Status */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Completed At</span>
                  <span className="font-bold text-slate-800">{selectedTripModal.date}, {selectedTripModal.time}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Payout Status</span>
                  <span className={`font-black font-mono px-2 py-0.5 rounded text-[10px] ${
                    selectedTripModal.payoutStatus === 'Settled' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedTripModal.payoutStatus}
                  </span>
                </div>
              </div>

              {/* Route details */}
              <div className="space-y-2 text-xs">
                <div className="bg-orange-50/60 p-3 rounded-2xl border border-orange-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-orange-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Pickup Merchant
                  </span>
                  <p className="font-bold text-slate-900">{selectedTripModal.pickupName}</p>
                  <p className="text-[11px] text-slate-600">{selectedTripModal.pickupAddress}</p>
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Customer Destination
                  </span>
                  <p className="font-bold text-slate-900">{selectedTripModal.customerName}</p>
                  <p className="text-[11px] text-slate-600">{selectedTripModal.deliveryAddress}</p>
                </div>
              </div>

              {/* Items Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Items Delivered</span>
                <p className="text-slate-800 font-medium">{selectedTripModal.itemsSummary}</p>
              </div>

              {/* Itemized Line-By-Line Financial Breakdown */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Pickup &amp; Drop Fare:</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedTripModal.baseFare.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Distance Pay ({selectedTripModal.distanceKm} km @ ₹6/km):</span>
                  <span className="font-mono font-bold text-slate-900">₹{selectedTripModal.distanceFare.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Customer Tip (100% credited):</span>
                  <span className="font-mono font-bold text-amber-600">+₹{selectedTripModal.customerTip.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Peak / Rain Surge Bonus:</span>
                  <span className="font-mono font-bold text-purple-600">+₹{selectedTripModal.surgeBonus.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>On-Time Delivery Incentive:</span>
                  <span className="font-mono font-bold text-emerald-600">+₹{selectedTripModal.onTimeIncentive.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Platform Commission / Fee:</span>
                  <span className="font-mono font-bold text-emerald-600">-₹0.00</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-black text-slate-900">
                  <span>Total Net Payout:</span>
                  <span className="text-lg font-mono text-emerald-600">₹{selectedTripModal.totalPayout.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setSelectedTripModal(null)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL 2: PAYOUT BATCH STATEMENT RECEIPT                        */}
      {/* ============================================================== */}
      <AnimatePresence>
        {selectedBatchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Settlement Statement
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Batch: {selectedBatchModal.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatchModal(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Disbursed Amount</span>
                <p className="text-2xl font-black font-mono text-emerald-400">
                  ₹{selectedBatchModal.amount.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-300">
                  Transferred via {selectedBatchModal.paymentMethod}
                </p>
              </div>

              <div className="space-y-2 text-xs border border-slate-200 rounded-2xl p-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Reference / UTR:</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedBatchModal.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Date:</span>
                  <span className="font-bold text-slate-800">{selectedBatchModal.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cycle Period:</span>
                  <span className="font-bold text-slate-800">{selectedBatchModal.periodLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Number of Trips Included:</span>
                  <span className="font-bold text-slate-800">{selectedBatchModal.tripsCount} Deliveries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Tips Included:</span>
                  <span className="font-bold text-amber-600 font-mono">₹{selectedBatchModal.tipsTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Performance Incentives:</span>
                  <span className="font-bold text-purple-600 font-mono">₹{selectedBatchModal.incentivesTotal}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedBatchModal(null)}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL 3: INSTANT WITHDRAWAL / CASH-OUT REQUEST                */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Request Instant Payout
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Transfer directly into your bank or UPI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {withdrawSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="text-xs font-black text-emerald-900">{withdrawSuccessMsg}</p>
                </div>
              ) : (
                <>
                  {/* Amount to withdraw */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Transferable Balance
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        ₹{monthlySummary.pendingAmount > 0 ? monthlySummary.pendingAmount.toLocaleString() : '450'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                        0% Processing Fee
                      </span>
                    </div>
                  </div>

                  {/* Destination Account Selection */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Choose Payout Destination:
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawMethod('upi')}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedWithdrawMethod === 'upi'
                          ? 'border-indigo-600 bg-indigo-50/50 text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-indigo-600" />
                        <div>
                          <span className="text-xs font-black block">Instant UPI VPA</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {profile?.upiId || 'rider.hero@okaxis'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 font-mono">Within 15 Mins</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawMethod('bank')}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedWithdrawMethod === 'bank'
                          ? 'border-indigo-600 bg-indigo-50/50 text-slate-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <div>
                          <span className="text-xs font-black block">Direct Bank IMPS</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {profile?.bankName || 'HDFC Bank'} (•••• {profile?.accountNumber?.slice(-4) || '4892'})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">1 - 2 Hours</span>
                    </button>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setIsWithdrawModalOpen(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmWithdrawal}
                      disabled={isSubmittingWithdraw}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingWithdraw ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Routing IMPS...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Confirm Withdrawal</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiderPayoutEarningsView;
