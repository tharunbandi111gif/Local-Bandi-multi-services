import { Product, PriceSubscription } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

const STORAGE_KEY = 'lokal_price_trackers';

export function getPriceSubscriptions(): PriceSubscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read price subscriptions from storage:', err);
  }
  return [];
}

export function savePriceSubscriptions(subscriptions: PriceSubscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    window.dispatchEvent(new CustomEvent('price_subscriptions_updated', { detail: subscriptions }));
  } catch (err) {
    console.error('Failed to save price subscriptions to storage:', err);
  }
}

export function isProductTracked(productId: string): boolean {
  if (!productId) return false;
  const list = getPriceSubscriptions();
  return list.some(sub => sub.productId === productId && sub.active !== false);
}

export function getProductSubscription(productId: string): PriceSubscription | undefined {
  if (!productId) return undefined;
  const list = getPriceSubscriptions();
  return list.find(sub => sub.productId === productId && sub.active !== false);
}

export async function subscribeToPriceDrop(
  product: Product, 
  targetPrice?: number, 
  userId?: string
): Promise<PriceSubscription> {
  const currentSubs = getPriceSubscriptions();
  const existingIndex = currentSubs.findIndex(s => s.productId === product.id);

  const initial = existingIndex >= 0 ? currentSubs[existingIndex].initialPrice : product.price;

  const newSub: PriceSubscription = {
    id: `track_${product.id}_${Date.now()}`,
    userId,
    productId: product.id,
    productName: product.name,
    productImage: product.image,
    category: product.category,
    initialPrice: initial,
    targetPrice: targetPrice && targetPrice > 0 ? targetPrice : undefined,
    currentPrice: product.price,
    lastNotifiedPrice: product.price,
    createdAt: Date.now(),
    active: true
  };

  let updatedList: PriceSubscription[];
  if (existingIndex >= 0) {
    updatedList = [...currentSubs];
    updatedList[existingIndex] = newSub;
  } else {
    updatedList = [newSub, ...currentSubs];
  }

  savePriceSubscriptions(updatedList);

  // Sync to Firestore if user is authenticated and db is available
  if (userId && db) {
    try {
      const subRef = doc(db, 'price_subscriptions', `${userId}_${product.id}`);
      await setDoc(subRef, {
        ...newSub,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore price subscription sync (will continue with local storage):', err);
    }
  }

  // Create an initial confirmation in-app notification
  try {
    const notificationsRaw = localStorage.getItem('lokal_notifications');
    const notifications = notificationsRaw ? JSON.parse(notificationsRaw) : [];
    const confirmNotif = {
      id: `price_track_conf_${product.id}_${Date.now()}`,
      type: 'offer',
      title: `🔔 Price Tracker Active: ${product.name}`,
      message: targetPrice 
        ? `We'll notify you as soon as ${product.name} drops below ₹${targetPrice}!`
        : `We'll alert you instantly whenever ${product.name} drops below its current price of ₹${product.price}.`,
      timestamp: Date.now(),
      read: false,
      productId: product.id
    };
    localStorage.setItem('lokal_notifications', JSON.stringify([confirmNotif, ...notifications]));
    window.dispatchEvent(new Event('notifications_updated'));
  } catch (err) {
    console.error('Failed to create confirmation notification:', err);
  }

  return newSub;
}

export async function unsubscribeFromPriceDrop(productId: string, userId?: string): Promise<void> {
  const currentSubs = getPriceSubscriptions();
  const updatedList = currentSubs.filter(s => s.productId !== productId);
  savePriceSubscriptions(updatedList);

  if (userId && db) {
    try {
      const subRef = doc(db, 'price_subscriptions', `${userId}_${productId}`);
      await deleteDoc(subRef);
    } catch (err) {
      console.warn('Firestore price unsubscribe sync:', err);
    }
  }
}

/**
 * Evaluates current inventory against active price subscriptions.
 * Triggers in-app notifications and event dispatches whenever a drop is detected.
 */
export function checkAndNotifyPriceDrops(currentProducts: Product[]): {
  dropped: { product: Product; oldPrice: number; newPrice: number }[];
} {
  if (!currentProducts || currentProducts.length === 0) return { dropped: [] };

  const subs = getPriceSubscriptions();
  if (subs.length === 0) return { dropped: [] };

  const productMap = new Map<string, Product>();
  for (const p of currentProducts) {
    productMap.set(p.id, p);
  }

  const droppedList: { product: Product; oldPrice: number; newPrice: number }[] = [];
  let subsChanged = false;
  const updatedSubs = [...subs];

  for (let i = 0; i < updatedSubs.length; i++) {
    const sub = updatedSubs[i];
    if (!sub.active) continue;

    const liveProduct = productMap.get(sub.productId);
    if (!liveProduct) continue;

    const currentLivePrice = liveProduct.price;
    const previousPrice = sub.lastNotifiedPrice ?? sub.currentPrice ?? sub.initialPrice;

    // Detect price drop
    const isPriceDecreased = currentLivePrice < previousPrice;
    const meetsTarget = sub.targetPrice ? currentLivePrice <= sub.targetPrice : true;

    if (isPriceDecreased && meetsTarget) {
      droppedList.push({
        product: liveProduct,
        oldPrice: previousPrice,
        newPrice: currentLivePrice
      });

      // Update subscription record to avoid repeat spam
      updatedSubs[i] = {
        ...sub,
        currentPrice: currentLivePrice,
        lastNotifiedPrice: currentLivePrice
      };
      subsChanged = true;

      // Add to lokal_notifications
      try {
        const notifRaw = localStorage.getItem('lokal_notifications');
        const existingNotifs = notifRaw ? JSON.parse(notifRaw) : [];
        const discountAmount = previousPrice - currentLivePrice;
        const discountPercent = Math.round((discountAmount / previousPrice) * 100);

        const dropNotification = {
          id: `price_drop_${liveProduct.id}_${Date.now()}`,
          type: 'offer',
          title: `📉 Price Drop Alert: ${liveProduct.name}!`,
          message: `Great news! Price for ${liveProduct.name} dropped from ₹${previousPrice} to ₹${currentLivePrice} (${discountPercent}% OFF, save ₹${discountAmount})! Tap to order now.`,
          timestamp: Date.now(),
          read: false,
          productId: liveProduct.id
        };

        localStorage.setItem('lokal_notifications', JSON.stringify([dropNotification, ...existingNotifs]));
        window.dispatchEvent(new Event('notifications_updated'));

        // Dispatch specific alert event for toast banner
        window.dispatchEvent(new CustomEvent('price_drop_alert', {
          detail: {
            product: liveProduct,
            oldPrice: previousPrice,
            newPrice: currentLivePrice,
            discountPercent
          }
        }));
      } catch (err) {
        console.error('Failed to dispatch price drop notification:', err);
      }
    } else if (currentLivePrice !== sub.currentPrice) {
      // Just keep current price in sync without alerting (e.g. price increase)
      updatedSubs[i] = {
        ...sub,
        currentPrice: currentLivePrice
      };
      subsChanged = true;
    }
  }

  if (subsChanged) {
    savePriceSubscriptions(updatedSubs);
  }

  return { dropped: droppedList };
}
