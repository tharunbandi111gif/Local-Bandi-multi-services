import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ScratchRewardItem {
  id: string;
  code: string;
  title: string;
  desc: string;
  discount: number; // Rupee amount strictly below ₹8 (e.g. 7, 6, 5, 4, 3, 2, 1)
  color: string;
  emoji: string;
  isActive: boolean;
}

export interface ScratchCardConfig {
  isEnabled: boolean;
  headerBadge: string;
  title: string;
  subtitle: string;
  minSubtotal: number;
  rewards: ScratchRewardItem[];
}

export interface FlashDropItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  mrp: number;
  price: number;
  discount: string;
  image: string;
  stock: string;
  isActive?: boolean;
}

export interface FlashDropConfig {
  isEnabled: boolean;
  badge: string;
  title: string;
  description: string;
  stockText: string;
  durationMinutes: number;
  targetCategory: string;
  ctaText: string;
  items: FlashDropItem[];
}

export interface GroupPoolConfig {
  isEnabled: boolean;
  title: string;
  targetMembers: number; // 6 members
  currentJoined: number;
  minOrderAmount: number; // ₹2500 minimum order requirement
  discountAmount: number; // 20% Flat
  includeFreeDelivery: boolean;
  lockedDescription: string;
  unlockedDescription: string;
}

export interface AttractionCampaignsConfig {
  scratchCard: ScratchCardConfig;
  flashDrop: FlashDropConfig;
  groupPool: GroupPoolConfig;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_SCRATCH_REWARDS: ScratchRewardItem[] = [
  { 
    id: 'scratch-1',
    code: 'SCRATCH07OFF', 
    title: '₹7 INSTANT CASH DISCOUNT', 
    desc: 'Valid on your daily basket orders above ₹99', 
    discount: 7, 
    color: 'from-amber-400 to-yellow-500', 
    emoji: '🎁',
    isActive: true 
  },
  { 
    id: 'scratch-2',
    code: 'SCRATCH06OFF', 
    title: '₹6 OFF DAILY SAVER', 
    desc: 'Instant discount applied directly at checkout', 
    discount: 6, 
    color: 'from-emerald-400 to-teal-500', 
    emoji: '✨',
    isActive: true 
  },
  { 
    id: 'scratch-3',
    code: 'SCRATCH05OFF', 
    title: '₹5 OFF BASKET CASHBACK', 
    desc: 'Special daily lucky discount for loyal shoppers', 
    discount: 5, 
    color: 'from-blue-400 to-indigo-500', 
    emoji: '🏷️',
    isActive: true 
  },
  { 
    id: 'scratch-4',
    code: 'SCRATCH04OFF', 
    title: '₹4 INSTANT OFF', 
    desc: 'Applicable on groceries, tiffins & essentials', 
    discount: 4, 
    color: 'from-purple-400 to-fuchsia-500', 
    emoji: '🎉',
    isActive: true 
  },
  { 
    id: 'scratch-5',
    code: 'SCRATCH03OFF', 
    title: '₹3 OFF QUICK SAVER', 
    desc: 'Daily surprise reward valid today only', 
    discount: 3, 
    color: 'from-rose-400 to-red-500', 
    emoji: '💫',
    isActive: true 
  }
];

export const DEFAULT_FLASH_ITEMS: FlashDropItem[] = [
  {
    id: 'flash-floor-cleaner',
    name: 'Citrus Fresh Antibacterial Floor Cleaner (2 Litre)',
    category: 'household',
    unit: '2 Litre Bottle',
    mrp: 198,
    price: 99,
    discount: '50% OFF (Up to ₹50)',
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '8 left in stock',
    isActive: true
  },
  {
    id: 'flash-dishwash-gel',
    name: 'Concentrated Lemon Power Dish Wash Gel (1 Litre)',
    category: 'household',
    unit: '1 Litre Squeeze Bottle',
    mrp: 150,
    price: 75,
    discount: '50% OFF (Up to ₹50)',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '12 left in stock',
    isActive: true
  },
  {
    id: 'flash-fabric-conditioner',
    name: 'Spring Blossom Soft Care Fabric Conditioner (1 Litre)',
    category: 'household',
    unit: '1 Litre Ergonomic Pack',
    mrp: 220,
    price: 110,
    discount: '50% OFF (Up to ₹50)',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '6 left in stock',
    isActive: true
  }
];

export const DEFAULT_ATTRACTION_CONFIG: AttractionCampaignsConfig = {
  scratchCard: {
    isEnabled: true,
    headerBadge: 'Daily Lucky Scratch & Win',
    title: 'Daily Lucky Mystery Scratch Card',
    subtitle: 'Daily customer reward! Eligible for first 7 days & every 4th month first week.',
    minSubtotal: 99,
    rewards: DEFAULT_SCRATCH_REWARDS
  },
  flashDrop: {
    isEnabled: true,
    badge: 'Golden Hour Drop (6-8 AM & 4-7 PM)',
    title: 'Flat 50% Off Golden Hour Drop',
    description: 'Selected Flash items at Flat 50% OFF (Max discount ₹50). Active 6-8 AM & 4-7 PM everyday!',
    stockText: 'Only selected limited items | Max ₹50 discount',
    durationMinutes: 120,
    targetCategory: 'household',
    ctaText: 'Claim 50% Deal',
    items: DEFAULT_FLASH_ITEMS
  },
  groupPool: {
    isEnabled: true,
    title: 'Neighborhood Group Buy Pool',
    targetMembers: 6,
    currentJoined: 5,
    minOrderAmount: 2500, // ₹2,500 minimum order requirement
    discountAmount: 20, // Flat 20% discount
    includeFreeDelivery: true,
    lockedDescription: 'Join 6 neighbors in a pool with min. ₹2,500 order to unlock Flat 20% Group Discount + FREE Delivery!',
    unlockedDescription: '🎉 Group of 6 neighbors assembled! Min. order ₹2,500 unlocks Flat 20% Pool Discount + FREE Delivery!'
  }
};

/**
 * Checks if current time is within Golden Hour windows:
 * Morning: 6:00 AM - 8:00 AM (06:00 to 07:59)
 * Evening: 4:00 PM - 7:00 PM (16:00 to 18:59)
 */
export function isGoldenHourActive(): boolean {
  const now = new Date();
  const hour = now.getHours();
  // Morning 6am to 8am (06:00 to 07:59) OR Evening 4pm to 7pm (16:00 to 18:59)
  return (hour >= 6 && hour < 8) || (hour >= 16 && hour < 19);
}

/**
 * Returns human-readable label of the current/next Golden Hour window.
 */
export function getNextGoldenHourSlotText(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 6) return 'Today 6:00 AM - 8:00 AM';
  if (hour >= 6 && hour < 8) return 'Active Now (Ends at 8:00 AM)';
  if (hour < 16) return 'Today 4:00 PM - 7:00 PM';
  if (hour >= 16 && hour < 19) return 'Active Now (Ends at 7:00 PM)';
  return 'Tomorrow 6:00 AM - 8:00 AM';
}

/**
 * Returns remaining seconds in the active slot or seconds until the next slot starts.
 */
export function getGoldenHourTimerSeconds(): { seconds: number; isActive: boolean; label: string } {
  const now = new Date();
  const currentTotalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  const morningStart = 6 * 3600;       // 06:00
  const morningEnd = 8 * 3600;         // 08:00
  const eveningStart = 16 * 3600;      // 16:00
  const eveningEnd = 19 * 3600;        // 19:00

  if (currentTotalSeconds >= morningStart && currentTotalSeconds < morningEnd) {
    return {
      seconds: morningEnd - currentTotalSeconds,
      isActive: true,
      label: 'Morning Slot Ends In'
    };
  }

  if (currentTotalSeconds >= eveningStart && currentTotalSeconds < eveningEnd) {
    return {
      seconds: eveningEnd - currentTotalSeconds,
      isActive: true,
      label: 'Evening Slot Ends In'
    };
  }

  if (currentTotalSeconds < morningStart) {
    return {
      seconds: morningStart - currentTotalSeconds,
      isActive: false,
      label: 'Starts at 6:00 AM In'
    };
  }

  if (currentTotalSeconds >= morningEnd && currentTotalSeconds < eveningStart) {
    return {
      seconds: eveningStart - currentTotalSeconds,
      isActive: false,
      label: 'Starts at 4:00 PM In'
    };
  }

  // After 19:00 -> until tomorrow 6:00 AM
  const secondsUntilMidnight = 86400 - currentTotalSeconds;
  return {
    seconds: secondsUntilMidnight + morningStart,
    isActive: false,
    label: 'Starts Tomorrow 6:00 AM In'
  };
}

export interface ScratchEligibilityResult {
  isEligible: boolean;
  type: 'new_user_7days' | 'fourth_month_week1' | 'locked';
  dayIndex: number;
  totalDays: number;
  message: string;
  badge: string;
}

/**
 * Checks Daily Scratch Card eligibility:
 * 1. Eligible for first-time join / new login customers for first 7 days only (Day 1 to 7).
 * 2. After 7 days: Eligible in the first week (Days 1 to 7) of every 4th month (Month 4, Month 8, Month 12, etc.).
 */
export function getScratchCardEligibility(userJoinedDate?: number | string | Date): ScratchEligibilityResult {
  let joinTime = 0;

  if (userJoinedDate) {
    joinTime = new Date(userJoinedDate).getTime();
  } else if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lokal_customer_join_time') || localStorage.getItem('customer_first_login_time');
    if (saved) {
      joinTime = Number(saved) || new Date(saved).getTime();
    } else {
      // First recorded join now
      joinTime = Date.now();
      try {
        localStorage.setItem('lokal_customer_join_time', String(joinTime));
      } catch (_) {}
    }
  } else {
    joinTime = Date.now();
  }

  const now = new Date();
  const diffDays = Math.max(0, Math.floor((now.getTime() - joinTime) / (1000 * 60 * 60 * 24)));

  // Case 1: First 7 days of new customer registration
  if (diffDays < 7) {
    return {
      isEligible: true,
      type: 'new_user_7days',
      dayIndex: diffDays + 1,
      totalDays: 7,
      badge: `New Customer Day ${diffDays + 1}/7`,
      message: `Welcome Offer! Daily scratch card active for your first 7 days (Day ${diffDays + 1} of 7).`
    };
  }

  // Case 2: Every 4th month, first week (Day 1 to 7)
  const currentMonth = now.getMonth() + 1; // 1 to 12
  const currentDayOfMonth = now.getDate(); // 1 to 31
  const isCalendar4thMonth = (currentMonth % 4 === 0);
  const isCalendarFirstWeek = (currentDayOfMonth >= 1 && currentDayOfMonth <= 7);

  // Also check relative 4-month milestone from user signup date
  const monthsSinceJoin = Math.floor(diffDays / 30);
  const isRelative4thMonth = monthsSinceJoin > 0 && (monthsSinceJoin % 4 === 0);
  const isRelativeFirstWeek = (diffDays % 30) < 7;

  if ((isCalendar4thMonth && isCalendarFirstWeek) || (isRelative4thMonth && isRelativeFirstWeek)) {
    const day = isCalendarFirstWeek ? currentDayOfMonth : ((diffDays % 30) + 1);
    return {
      isEligible: true,
      type: 'fourth_month_week1',
      dayIndex: day,
      totalDays: 7,
      badge: `Month 4 Week 1 Special (Day ${day}/7)`,
      message: `🎉 Exclusive 4th Month Loyalty Festival! Scratch daily during week 1 (Days 1–7).`
    };
  }

  // Case 3: Locked until next milestone
  const nextMonthMod = 4 - (currentMonth % 4);
  const nextMonthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][(currentMonth - 1 + (nextMonthMod === 0 ? 4 : nextMonthMod)) % 12];

  return {
    isEligible: false,
    type: 'locked',
    dayIndex: 0,
    totalDays: 7,
    badge: 'Loyalty Milestone Locked',
    message: `Daily Scratch Card was active during your first 7 days. Next scratch event unlocks 1st week of ${nextMonthName} (Every 4th Month)!`
  };
}

const STORAGE_KEY = 'localbandi_attraction_campaigns_v4';
const FIRESTORE_DOC_PATH = 'settings/attraction_campaigns';

export function getLocalAttractionConfig(): AttractionCampaignsConfig {
  if (typeof window === 'undefined') return DEFAULT_ATTRACTION_CONFIG;
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_ATTRACTION_CONFIG,
        ...parsed,
        scratchCard: {
          ...DEFAULT_ATTRACTION_CONFIG.scratchCard,
          ...(parsed.scratchCard || {}),
          rewards: parsed.scratchCard?.rewards && parsed.scratchCard.rewards.length > 0
            ? parsed.scratchCard.rewards
            : DEFAULT_SCRATCH_REWARDS
        },
        flashDrop: {
          ...DEFAULT_ATTRACTION_CONFIG.flashDrop,
          ...(parsed.flashDrop || {}),
          items: parsed.flashDrop?.items && parsed.flashDrop.items.length > 0
            ? parsed.flashDrop.items
            : DEFAULT_FLASH_ITEMS
        },
        groupPool: {
          ...DEFAULT_ATTRACTION_CONFIG.groupPool,
          ...(parsed.groupPool || {})
        }
      };
    }
  } catch (err) {
    console.warn("Failed reading local attraction config:", err);
  }
  return DEFAULT_ATTRACTION_CONFIG;
}

export function saveLocalAttractionConfig(config: AttractionCampaignsConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('attraction-campaigns-updated', { detail: config }));
  } catch (err) {
    console.warn("Failed saving local attraction config:", err);
  }
}

export async function saveAttractionConfigToFirestore(config: AttractionCampaignsConfig, adminEmail?: string) {
  const payload: AttractionCampaignsConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'Master Admin'
  };

  saveLocalAttractionConfig(payload);

  try {
    const docRef = doc(db, 'settings', 'attraction_campaigns');
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore sync warning (saved locally):", err);
    return false;
  }
}

export function subscribeToAttractionConfig(callback: (config: AttractionCampaignsConfig) => void) {
  // Immediately return cached
  callback(getLocalAttractionConfig());

  // Firestore real-time subscription
  try {
    const docRef = doc(db, 'settings', 'attraction_campaigns');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<AttractionCampaignsConfig>;
        const merged: AttractionCampaignsConfig = {
          scratchCard: {
            ...DEFAULT_ATTRACTION_CONFIG.scratchCard,
            ...(data.scratchCard || {}),
            rewards: data.scratchCard?.rewards && data.scratchCard.rewards.length > 0
              ? data.scratchCard.rewards
              : DEFAULT_SCRATCH_REWARDS
          },
          flashDrop: {
            ...DEFAULT_ATTRACTION_CONFIG.flashDrop,
            ...(data.flashDrop || {}),
            items: data.flashDrop?.items && data.flashDrop.items.length > 0
              ? data.flashDrop.items
              : DEFAULT_FLASH_ITEMS
          },
          groupPool: {
            ...DEFAULT_ATTRACTION_CONFIG.groupPool,
            ...(data.groupPool || {})
          },
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy
        };
        saveLocalAttractionConfig(merged);
        callback(merged);
      }
    }, (error) => {
      console.warn("Firestore subscription error for attraction campaigns:", error);
    });

    // Custom event listener for local updates
    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        callback(e.detail);
      }
    };
    window.addEventListener('attraction-campaigns-updated', handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('attraction-campaigns-updated', handleCustomEvent);
    };
  } catch (err) {
    console.warn("Subscription fallback:", err);
    return () => {};
  }
}
