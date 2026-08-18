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
  targetMembers: number; // 54 members
  currentJoined: number;
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
    discount: '50% OFF',
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
    discount: '50% OFF',
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
    discount: '50% OFF',
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
    subtitle: 'Daily customer reward! Scratch once daily to reveal instant discount.',
    minSubtotal: 99,
    rewards: DEFAULT_SCRATCH_REWARDS
  },
  flashDrop: {
    isEnabled: true,
    badge: 'Golden Hour Drop',
    title: 'Flat 50% Off Flash Rush',
    description: 'Floor Cleaner, Dish Wash Gel & Fabric Conditioner at direct 50% OFF!',
    stockText: 'Only limited units available right now',
    durationMinutes: 15,
    targetCategory: 'household',
    ctaText: 'Claim 50% Deal',
    items: DEFAULT_FLASH_ITEMS
  },
  groupPool: {
    isEnabled: true,
    title: 'Neighborhood Group Buy Pool',
    targetMembers: 54,
    currentJoined: 53,
    discountAmount: 20, // Flat 20% discount
    includeFreeDelivery: true,
    lockedDescription: 'Invite 54 neighbors with your referral link to unlock 1-Time Flat 20% Group Discount + FREE Delivery!',
    unlockedDescription: '🎉 Referral target reached (54/54 joined)! You unlocked 1-Time Flat 20% Group Buy Pool Discount!'
  }
};

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
