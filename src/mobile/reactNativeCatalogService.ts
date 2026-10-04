/**
 * Local Bandi Multi Services - React Native Real-Time Catalog & Orders Service
 * Designed for seamless integration into React Native (iOS / Android) and mobile wrappers.
 * Supports both standard Firebase Web SDK (v9/v10+) and @react-native-firebase/firestore.
 */

import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  limit, 
  orderBy,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Product, Service } from '../types';

export interface RNCatalogOptions {
  branchId?: string;
  categoryId?: string;
  includeInactive?: boolean;
}

export interface RNOrderTrackingState {
  orderId: string;
  status: 'accepted' | 'assigned' | 'preparing' | 'picked-up' | 'delivered' | 'cancelled' | string;
  currentStepIndex: number; // 0 to 4
  paymentMethod: 'cod' | 'cash' | 'upi' | 'card' | 'online' | string;
  requiresDeliveryOtp: boolean;
  deliveryOtp: string | null;
  pickupOtp: string;
  otpVerified: boolean;
  driverName?: string;
  driverPhone?: string;
  vendorName?: string;
  total: number;
  updatedAt?: any;
}

export class ReactNativeCatalogService {
  /**
   * Real-time database listener to fetch categories dynamically.
   * Master admin additions, updates, or deletions reflect immediately with ZERO manual refresh.
   */
  public static subscribeCategories(
    onCategoriesUpdate: (categories: Category[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!db) {
      onError?.(new Error("Firestore database instance is not initialized"));
      return () => {};
    }

    try {
      const categoriesCol = collection(db, 'categories');
      
      const unsubscribe = onSnapshot(
        categoriesCol,
        { includeMetadataChanges: true },
        (snapshot: QuerySnapshot) => {
          const categories: Category[] = [];

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            // Filter out deleted or soft-deleted items
            if (data.deleted === true || data.status === 'inactive' || data.status === 'deleted') {
              return;
            }

            categories.push({
              id: docSnap.id,
              name: data.name || docSnap.id,
              icon: data.icon || 'ShoppingBag',
              color: data.color || 'bg-emerald-50',
              image: data.image || data.img || '',
              description: data.description || '',
              sortOrder: data.sortOrder ?? 0,
              ...data
            } as Category);
          });

          // Sort by sortOrder if available, then by name
          categories.sort((a, b) => {
            if ((a as any).sortOrder !== undefined && (b as any).sortOrder !== undefined) {
              return (a as any).sortOrder - (b as any).sortOrder;
            }
            return (a.name || '').localeCompare(b.name || '');
          });

          console.log(`📱 [React Native Listener] Real-time categories synced: ${categories.length} items`);
          onCategoriesUpdate(categories);
        },
        (error) => {
          console.error("📱 [React Native Listener Error] Failed to sync categories:", error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error("📱 [React Native Listener Exception] subscribeCategories:", err);
      onError?.(err);
      return () => {};
    }
  }

  /**
   * Real-time database listener to fetch products and services dynamically.
   * Master admin price changes, stock changes, or status edits reflect immediately.
   */
  public static subscribeProducts(
    options: RNCatalogOptions = {},
    onProductsUpdate: (products: (Product | Service)[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!db) {
      onError?.(new Error("Firestore database instance is not initialized"));
      return () => {};
    }

    try {
      const { branchId = 'khammam_main', categoryId } = options;
      const productsCol = collection(db, 'products');

      // Subscribe to active inventory
      const q = query(productsCol, limit(500));

      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot: QuerySnapshot) => {
          const items: (Product | Service)[] = [];

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();

            // Ignore deleted documents
            if (data.deleted === true || data.status === 'deleted' || data.status === 'banned') {
              return;
            }

            // Optional category filter
            if (categoryId && data.category !== categoryId) {
              return;
            }

            // Branch isolation filter
            const itemBranch = data.branchId;
            const matchesBranch = 
              !itemBranch || 
              itemBranch === 'global' || 
              itemBranch === 'all' || 
              itemBranch === '' || 
              itemBranch === branchId ||
              branchId === 'khammam_main' ||
              branchId === 'all';

            if (!matchesBranch) {
              return;
            }

            items.push({
              id: docSnap.id,
              name: data.name || 'Product',
              price: Number(data.price || 0),
              image: data.image || '',
              category: data.category || 'general',
              inStock: data.inStock ?? (data.stock !== 0),
              isAvailable: data.isAvailable ?? true,
              vendorId: data.vendorId || 'admin-store',
              branchId: data.branchId || branchId,
              ...data
            } as unknown as (Product | Service));
          });

          console.log(`📱 [React Native Listener] Real-time products synced: ${items.length} items (Branch: ${branchId})`);
          onProductsUpdate(items);
        },
        (error) => {
          console.error("📱 [React Native Listener Error] Failed to sync products:", error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error("📱 [React Native Listener Exception] subscribeProducts:", err);
      onError?.(err);
      return () => {};
    }
  }

  /**
   * Real-time order tracking listener for React Native customer app.
   * Tracks the 5 lifecycle stages: 'accepted', 'assigned', 'preparing', 'picked-up', 'delivered'.
   * Outlines Cash on Delivery handover OTP vs Contactless Online Payment.
   */
  public static subscribeOrderTracking(
    orderId: string,
    onOrderUpdate: (tracking: RNOrderTrackingState | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!db || !orderId) {
      onError?.(new Error("Invalid db or orderId provided"));
      return () => {};
    }

    try {
      const orderRef = doc(db, 'orders', orderId);

      const unsubscribe = onSnapshot(
        orderRef,
        { includeMetadataChanges: true },
        (docSnap: DocumentSnapshot) => {
          if (!docSnap.exists()) {
            onOrderUpdate(null);
            return;
          }

          const d = docSnap.data();
          const rawStatus = (d.status || 'accepted').toLowerCase().replace(/\s+/g, '-');

          // Map to standard 5 stages
          let normalizedStatus: RNOrderTrackingState['status'] = 'accepted';
          let stepIndex = 0;

          if (rawStatus.includes('delivered')) {
            normalizedStatus = 'delivered';
            stepIndex = 4;
          } else if (rawStatus.includes('picked') || rawStatus === 'outfordelivery' || rawStatus.includes('delivery')) {
            normalizedStatus = 'picked-up';
            stepIndex = 3;
          } else if (rawStatus.includes('preparing') || rawStatus.includes('processing')) {
            normalizedStatus = 'preparing';
            stepIndex = 2;
          } else if (rawStatus.includes('assigned')) {
            normalizedStatus = 'assigned';
            stepIndex = 1;
          } else if (rawStatus.includes('accepted')) {
            normalizedStatus = 'accepted';
            stepIndex = 0;
          } else {
            normalizedStatus = rawStatus;
            stepIndex = 0;
          }

          const isCod = d.paymentMethod === 'cod' || d.paymentMethod === 'cash';

          const tracking: RNOrderTrackingState = {
            orderId: docSnap.id,
            status: normalizedStatus,
            currentStepIndex: stepIndex,
            paymentMethod: d.paymentMethod || 'cod',
            requiresDeliveryOtp: isCod,
            deliveryOtp: isCod ? (d.deliveryOtp || '1234') : null,
            pickupOtp: d.pickupOtp || '5678',
            otpVerified: d.otpVerified === true,
            driverName: d.deliveryPartnerName || d.riderName,
            driverPhone: d.deliveryPartnerPhone || d.riderPhone,
            vendorName: d.vendorName || 'Store Partner',
            total: Number(d.total || d.totalAmount || 0),
            updatedAt: d.updatedAt
          };

          onOrderUpdate(tracking);
        },
        (error) => {
          console.error(`📱 [React Native Listener Error] Order ${orderId}:`, error);
          onError?.(error);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.error(`📱 [React Native Listener Exception] Order ${orderId}:`, err);
      onError?.(err);
      return () => {};
    }
  }

  /**
   * Verification logic for delivery partner upon picking up order from vendor.
   * Delivery boy must provide pickup OTP.
   */
  public static async verifyPickupOtp(orderId: string, enteredOtp: string): Promise<{ success: boolean; message: string }> {
    if (!db || !orderId) return { success: false, message: 'Invalid order reference' };

    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) return { success: false, message: 'Order not found' };

      const orderData = snap.data();
      const expectedOtp = orderData.pickupOtp;

      if (!expectedOtp || enteredOtp.trim() === expectedOtp.trim()) {
        await updateDoc(orderRef, {
          status: 'picked-up',
          pickupOtpVerified: true,
          pickedUpAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { success: true, message: 'Pickup OTP verified successfully. Order status updated to picked-up.' };
      } else {
        return { success: false, message: 'Incorrect pickup OTP. Please verify with store merchant.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'OTP verification failed' };
    }
  }

  /**
   * Verification logic for delivery partner upon handover to customer.
   * If Cash on Delivery, customer provides deliveryOtp. If online payment, no OTP is needed.
   */
  public static async verifyDeliveryHandover(orderId: string, enteredOtp?: string): Promise<{ success: boolean; message: string }> {
    if (!db || !orderId) return { success: false, message: 'Invalid order reference' };

    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) return { success: false, message: 'Order not found' };

      const orderData = snap.data();
      const isCod = orderData.paymentMethod === 'cod' || orderData.paymentMethod === 'cash';

      if (isCod) {
        if (!enteredOtp || enteredOtp.trim() !== (orderData.deliveryOtp || '1234')) {
          return { success: false, message: 'Invalid delivery OTP. Collect cash and request 4-digit code from customer.' };
        }
      }

      await updateDoc(orderRef, {
        status: 'delivered',
        paymentStatus: 'Paid',
        otpVerified: true,
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, message: 'Order successfully delivered and verified!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Delivery verification failed' };
    }
  }
}
