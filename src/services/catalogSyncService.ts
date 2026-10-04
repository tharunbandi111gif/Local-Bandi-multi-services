import { 
  collection, 
  onSnapshot, 
  query, 
  limit, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  FirestoreError 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Product, Service } from '../types';
import { CATEGORIES, PRODUCTS, SERVICES } from '../constants';

export interface CatalogSyncState {
  categories: Category[];
  products: (Product | Service)[];
  isCategoriesLoading: boolean;
  isProductsLoading: boolean;
  lastSyncAt: number;
  syncSource: 'cache' | 'server' | 'optimistic';
}

export type CatalogChangeCallback = (state: CatalogSyncState) => void;

class CatalogSyncService {
  private categories: Category[] = [];
  private products: (Product | Service)[] = [];
  private isCategoriesLoading = true;
  private isProductsLoading = true;
  private lastSyncAt = Date.now();
  private syncSource: 'cache' | 'server' | 'optimistic' = 'cache';

  private subscribers: Set<CatalogChangeCallback> = new Set();
  private unsubCategories?: () => void;
  private unsubProducts?: () => void;
  private isInitialized = false;

  constructor() {
    this.loadFromCache();
  }

  private loadFromCache() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cachedCats = localStorage.getItem('cached_categories');
        if (cachedCats) {
          this.categories = JSON.parse(cachedCats);
        } else {
          this.categories = [...CATEGORIES];
        }

        const cachedProds = localStorage.getItem('cached_local_inventory');
        if (cachedProds) {
          this.products = JSON.parse(cachedProds);
        }
      } else {
        this.categories = [...CATEGORIES];
      }
    } catch (e) {
      this.categories = [...CATEGORIES];
    }
  }

  /**
   * Initializes real-time Firestore listeners for categories and products.
   * Ensures zero-refresh updates whenever Master Admin adds, modifies, or deletes an item.
   */
  public initialize(branchId: string = 'khammam_main') {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.startCategoriesListener();
    this.startProductsListener(branchId);

    // Listen to local admin update broadcasts
    if (typeof window !== 'undefined') {
      window.addEventListener('catalog_admin_updated', (e: any) => {
        console.log('⚡ [CatalogSync] Master Admin update detected. Triggering instant catalog re-emission:', e.detail);
        this.syncSource = 'optimistic';
        this.lastSyncAt = Date.now();
        this.notifySubscribers();
      });
    }
  }

  private startCategoriesListener() {
    if (!db) return;
    try {
      const categoriesCol = collection(db, 'categories');
      this.unsubCategories = onSnapshot(
        categoriesCol,
        { includeMetadataChanges: true },
        (snapshot) => {
          this.isCategoriesLoading = false;
          this.syncSource = snapshot.metadata.fromCache ? 'cache' : 'server';
          this.lastSyncAt = Date.now();

          const catMap = new Map<string, Category>();
          // Base defaults for guaranteed system categories
          CATEGORIES.forEach(c => {
            if (c && c.id) catMap.set(c.id, c);
          });

          // Authoritative live categories from Master Admin in Firestore
          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Discard deleted or inactive categories
            if (data.deleted === true || data.status === 'inactive' || data.status === 'deleted') {
              catMap.delete(docSnap.id);
              return;
            }

            catMap.set(docSnap.id, {
              id: docSnap.id,
              name: data.name || docSnap.id,
              icon: data.icon || 'ShoppingBag',
              color: data.color || 'bg-emerald-50',
              image: data.image || data.img || '',
              description: data.description || '',
              status: data.status || 'active',
              ...data
            } as Category);
          });

          this.categories = Array.from(catMap.values());

          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('cached_categories', JSON.stringify(this.categories));
            }
          } catch {}

          this.notifySubscribers();
        },
        (error: FirestoreError) => {
          console.warn('⚠️ [CatalogSync] Categories listener warning:', error.message);
          this.isCategoriesLoading = false;
          this.notifySubscribers();
        }
      );
    } catch (err) {
      console.error('Failed to attach categories listener:', err);
    }
  }

  private startProductsListener(currentBranchId: string) {
    if (!db) return;
    try {
      const productsQ = query(collection(db, 'products'), limit(500));
      this.unsubProducts = onSnapshot(
        productsQ,
        { includeMetadataChanges: true },
        (snapshot) => {
          this.isProductsLoading = false;
          this.syncSource = snapshot.metadata.fromCache ? 'cache' : 'server';
          this.lastSyncAt = Date.now();

          const cloudItems = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Product | Service))
            .filter(item => {
              if (!item || (item as any).deleted === true || (item as any).status === 'deleted') return false;
              
              // Master Admin items are always visible unless explicitly unapproved
              const vendorId = (item as any).vendorId;
              const isAdminItem = !vendorId || 
                vendorId === 'admin-store' || 
                vendorId === 'admin' || 
                vendorId === 'master-admin' || 
                vendorId === 'global' || 
                vendorId === 'central';

              if (isAdminItem) {
                return (item as any).isApproved !== false && (item as any).status !== 'rejected';
              }

              // Normal items: active, approved, or default available
              return (item as any).isApproved !== false && (item as any).status !== 'rejected' && (item as any).status !== 'banned';
            });

          const matchesBranch = (item: Product | Service) => {
            return (
              !item.branchId ||
              item.branchId === 'global' ||
              item.branchId === 'all' ||
              item.branchId === '' ||
              item.branchId === currentBranchId ||
              currentBranchId === 'khammam_main' ||
              currentBranchId === 'all'
            );
          };

          const merged = new Map<string, Product | Service>();

          if (cloudItems.length === 0) {
            // First run fallback if database empty
            [...PRODUCTS, ...SERVICES].forEach(item => {
              if (matchesBranch(item)) merged.set(item.id, item);
            });
          } else {
            // Real items from Firestore (Authoritative)
            cloudItems.forEach(item => {
              if (matchesBranch(item)) merged.set(item.id, item);
            });

            // Retain essential service-based profiles (plumber, electrician) if not present
            SERVICES.forEach(serv => {
              if (!merged.has(serv.id) && matchesBranch(serv) && (serv as any).deleted !== true) {
                merged.set(serv.id, serv);
              }
            });
          }

          this.products = Array.from(merged.values());

          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('cached_local_inventory', JSON.stringify(this.products));
            }
          } catch {}

          this.notifySubscribers();
        },
        (error: FirestoreError) => {
          console.warn('⚠️ [CatalogSync] Products listener warning:', error.message);
          this.isProductsLoading = false;
          this.notifySubscribers();
        }
      );
    } catch (err) {
      console.error('Failed to attach products listener:', err);
    }
  }

  public subscribe(callback: CatalogChangeCallback): () => void {
    this.subscribers.add(callback);
    // Send immediate current state
    callback(this.getState());

    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getState(): CatalogSyncState {
    return {
      categories: this.categories,
      products: this.products,
      isCategoriesLoading: this.isCategoriesLoading,
      isProductsLoading: this.isProductsLoading,
      lastSyncAt: this.lastSyncAt,
      syncSource: this.syncSource
    };
  }

  private notifySubscribers() {
    const state = this.getState();
    this.subscribers.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error notifying catalog subscriber:', err);
      }
    });
  }

  public destroy() {
    if (this.unsubCategories) this.unsubCategories();
    if (this.unsubProducts) this.unsubProducts();
    this.subscribers.clear();
    this.isInitialized = false;
  }
}

export const catalogSyncService = new CatalogSyncService();
