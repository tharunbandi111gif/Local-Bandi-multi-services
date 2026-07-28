import * as firestore from '@firebase/firestore';
import { CATEGORIES, PRODUCTS, MARRIAGE_PROFILES } from '../constants';

// Re-export all standard Firestore functions
export * from '@firebase/firestore';

// Flag indicating whether Firestore has hit quota or is operating in offline sandbox mode
let isQuotaExceeded = localStorage.getItem('quota_exceeded_sandbox') === 'true';

// Helper to check if an error is a Firebase Quota Exceeded error
export function isQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return msg.includes('quota') || 
         msg.includes('resource-exhausted') || 
         msg.includes('exhausted') ||
         msg.includes('quota limit exceeded') ||
         err.code === 'resource-exhausted';
}

// Function to activate sandbox mode
export function activateSandbox() {
  if (isQuotaExceeded) return;
  isQuotaExceeded = true;
  localStorage.setItem('quota_exceeded_sandbox', 'true');
  console.log("⚡ [Firestore Wrapper] Switching to high-speed local Quota-Exhausted Sandbox mode.");
  window.dispatchEvent(new CustomEvent('sandbox_status_changed', { detail: { active: true } }));
}

// Function to manually reset sandbox mode to retry connecting to Firebase
export function resetSandbox() {
  isQuotaExceeded = false;
  localStorage.removeItem('quota_exceeded_sandbox');
  console.log("♻️ [Firestore Wrapper] Reset Sandbox. Retrying Firestore connection.");
  window.dispatchEvent(new CustomEvent('sandbox_status_changed', { detail: { active: false } }));
  window.location.reload();
}

// Helper to turn Firestore paths into valid localStorage keys
function getLocalKey(path: string): string {
  return `lokal_db_${path.replace(/\//g, '_')}`;
}

// Helper to seed excellent default mock datasets for key collections
function seedDefaultData(path: string): any[] {
  const key = getLocalKey(path);
  
  // Try retrieving from localStorage
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  let initial: any[] = [];
  
  if (path === 'categories') {
    initial = CATEGORIES;
  } else if (path === 'products') {
    initial = PRODUCTS;
  } else if (path === 'marriage_profiles' || path === 'marriage') {
    initial = MARRIAGE_PROFILES;
  } else if (path === 'branches') {
    initial = [
      {
        id: 'khammam_main',
        name: 'Khammam Main Branch',
        location: 'Khammam HQ',
        city: 'Khammam',
        district: 'Khammam',
        state: 'Telangana',
        adminId: 'tarun_bandi_hq',
        adminName: 'Tarun Bandi',
        contactPhone: '+918790729816',
        adminEmail: 'tarun@localbandi.com',
        secPasscode: 'Khammam@7416',
        revenue: 25000,
        vendorsCount: 3,
        ordersCount: 42,
        rating: 5,
        profitShare: 25,
        joinDate: '2026-06-16',
        agreementExpiry: '2027-06-16',
        status: 'Active'
      }
    ];
  } else if (path === 'vendors') {
    initial = [
      {
        id: 'v_groceries',
        name: 'Khammam Mega Mart',
        ownerName: 'Ramarao K.',
        phone: '9440123456',
        email: 'megamart@khammam.com',
        category: 'groceries',
        branchId: 'khammam_main',
        status: 'Approved',
        rating: 4.8,
        createdAt: new Date().toISOString()
      },
      {
        id: 'v_chicken',
        name: 'Elite Fresh Chicken',
        ownerName: 'Irfan Pathan',
        phone: '9848012345',
        email: 'elitefresh@khammam.com',
        category: 'meat',
        branchId: 'khammam_main',
        status: 'Approved',
        rating: 4.9,
        createdAt: new Date().toISOString()
      },
      {
        id: 'v_tiffin',
        name: 'Sree Sai Tiffins',
        ownerName: 'Satish G.',
        phone: '8790729816',
        email: 'sreesai@tiffin.com',
        category: 'food',
        branchId: 'khammam_main',
        status: 'Approved',
        rating: 4.7,
        createdAt: new Date().toISOString()
      }
    ];
  } else if (path.endsWith('/items')) {
    // Nested catalog items for vendors
    const parts = path.split('/');
    const vendorId = parts[1];
    
    let cat = 'groceries';
    if (vendorId === 'v_chicken') cat = 'meat';
    if (vendorId === 'v_tiffin') cat = 'food';
    
    initial = PRODUCTS.filter(p => p.category === cat).map(p => ({
      ...p,
      vendorId,
      status: 'Available'
    }));
  } else if (path === 'deliveryPartners') {
    initial = [
      {
        id: 'd_tarun',
        userId: 'tarun_bandi_hq',
        fullName: 'Tarun Bandi (Master Rider)',
        phone: '+918790729816',
        vehicleType: 'Super Bike',
        vehicleNumber: 'TS-04-ADMIN-1',
        branchId: 'khammam_main',
        branchName: 'Khammam Main Branch',
        pincode: '507001',
        status: 'Active',
        payoutRate: 45,
        earnings: 25000,
        trips: 150,
        rating: 5.0,
        pin: '1122'
      }
    ];
  } else if (path === 'coverage_zones') {
    initial = [
      {
        id: 'zone_khammam',
        name: 'Khammam Center Zone',
        branchId: 'khammam_main',
        pincode: '507001',
        coordinates: [
          { lat: 17.2473, lng: 80.1514 },
          { lat: 17.2553, lng: 80.1514 },
          { lat: 17.2553, lng: 80.1614 },
          { lat: 17.2473, lng: 80.1614 }
        ],
        status: 'Active'
      }
    ];
  } else if (path.startsWith('settings')) {
    if (path === 'settings/franchise_policy') {
      return {
        renewalDeadline: 'August 05',
        profitPercent: 25,
        mainBranch: 'Khammam HQ',
        founder: 'Tarun Bandi',
        generalTerms: '1. No misuse of brand name. 2. 25% profit share mandatory. 3. Physical agreement required annually. 4. Service excellence is non-negotiable.'
      } as any;
    } else if (path === 'settings/support') {
      return {
        contactPhone: '+91 87907 29816',
        contactEmail: 'care@localbandi.com',
        workingHours: '8:00 AM - 10:00 PM',
        escalationContact: 'Tarun Bandi (+91 74165 74197)'
      } as any;
    } else if (path === 'settings/payment_config') {
      return {
        cashOnDelivery: true,
        onlinePayment: true,
        upiId: 'tarunbandi@ybl',
        taxPercent: 5,
        deliveryBaseCharge: 30
      } as any;
    } else if (path === 'settings/security_config') {
      return {
        masterPin: '1122',
        gatewayCode: 'Tarun@KhammamHQ',
        bypassOtp: true
      } as any;
    } else if (path === 'settings/hospital_prices') {
      return {
        generalOP: 150,
        specialistOP: 350,
        dentalOP: 250,
        cardiologyOP: 500
      } as any;
    }
  }

  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

// Fetch items in local collection
export function getLocalCollection(path: string): any[] {
  const key = getLocalKey(path);
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  return seedDefaultData(path);
}

// Save list in local collection
export function saveLocalCollection(path: string, items: any[]) {
  const key = getLocalKey(path);
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('lokal_db_update', { detail: { path } }));
}

// Fetch single document in local DB
export function getLocalDoc(path: string): any {
  const parts = path.split('/');
  if (parts.length === 2) {
    const colName = parts[0];
    const docId = parts[1];
    const items = getLocalCollection(colName);
    const found = items.find(i => i.id === docId);
    return found || null;
  } else {
    const key = getLocalKey(path);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
    return seedDefaultData(path);
  }
}

// Save single document in local DB
export function saveLocalDoc(path: string, data: any) {
  const parts = path.split('/');
  if (parts.length === 2) {
    const colName = parts[0];
    const docId = parts[1];
    const items = getLocalCollection(colName);
    const idx = items.findIndex(i => i.id === docId);
    const updated = { id: docId, ...data };
    
    if (idx >= 0) {
      items[idx] = updated;
    } else {
      items.push(updated);
    }
    saveLocalCollection(colName, items);
  } else {
    const key = getLocalKey(path);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('lokal_db_update', { detail: { path } }));
  }
}

// Get clean reference path from collection or doc
export function getRefPath(ref: any): string {
  if (!ref) return '';
  if (typeof ref.path === 'string') return ref.path;
  if (typeof ref._path?.toUtString === 'function') return ref._path.toUtString();
  return ref.id || '';
}

// Create mock document snapshot
function createMockDocSnapshot(id: string, data: any) {
  return {
    id,
    exists: () => data !== undefined && data !== null,
    data: () => data,
    get: (field: string) => data ? data[field] : undefined
  };
}

// Create mock query snapshot
function createMockQuerySnapshot(docs: any[]) {
  const docSnaps = docs.map(d => createMockDocSnapshot(d.id, d));
  return {
    docs: docSnaps,
    empty: docSnaps.length === 0,
    forEach: (cb: any) => docSnaps.forEach(cb),
    size: docSnaps.length,
    metadata: { fromCache: true, hasPendingWrites: false }
  };
}

// Overridden getDoc function
export async function getDoc(ref: any) {
  const path = getRefPath(ref);
  if (isQuotaExceeded) {
    const localData = getLocalDoc(path);
    return createMockDocSnapshot(ref.id, localData);
  }
  try {
    return await firestore.getDoc(ref);
  } catch (err: any) {
    if (isQuotaError(err)) {
      activateSandbox();
      const localData = getLocalDoc(path);
      return createMockDocSnapshot(ref.id, localData);
    }
    throw err;
  }
}

// Overridden getDocs function
export async function getDocs(ref: any) {
  const path = getRefPath(ref);
  if (isQuotaExceeded) {
    const localData = getLocalCollection(path);
    return createMockQuerySnapshot(localData);
  }
  try {
    return await firestore.getDocs(ref);
  } catch (err: any) {
    if (isQuotaError(err)) {
      activateSandbox();
      const localData = getLocalCollection(path);
      return createMockQuerySnapshot(localData);
    }
    throw err;
  }
}

// Overridden addDoc function
export async function addDoc(collectionRef: any, data: any) {
  const path = getRefPath(collectionRef);
  const docId = Math.random().toString(36).substring(2, 15);
  const docWithId = { ...data, id: docId, createdAt: new Date().toISOString() };
  
  if (isQuotaExceeded) {
    const items = getLocalCollection(path);
    items.push(docWithId);
    saveLocalCollection(path, items);
    return { id: docId, path: `${path}/${docId}` } as any;
  }
  
  try {
    return await firestore.addDoc(collectionRef, data);
  } catch (err: any) {
    if (isQuotaError(err)) {
      activateSandbox();
      const items = getLocalCollection(path);
      items.push(docWithId);
      saveLocalCollection(path, items);
      return { id: docId, path: `${path}/${docId}` } as any;
    }
    throw err;
  }
}

// Overridden updateDoc function
export async function updateDoc(docRef: any, data: any) {
  const path = getRefPath(docRef);
  if (isQuotaExceeded) {
    const current = getLocalDoc(path) || {};
    const updated = { ...current, ...data };
    saveLocalDoc(path, updated);
    return;
  }
  try {
    return await firestore.updateDoc(docRef, data);
  } catch (err: any) {
    if (isQuotaError(err)) {
      activateSandbox();
      const current = getLocalDoc(path) || {};
      const updated = { ...current, ...data };
      saveLocalDoc(path, updated);
      return;
    }
    throw err;
  }
}

// Overridden setDoc function
export async function setDoc(docRef: any, data: any, options?: any) {
  const path = getRefPath(docRef);
  if (isQuotaExceeded) {
    let updated = data;
    if (options?.merge) {
      const current = getLocalDoc(path) || {};
      updated = { ...current, ...data };
    }
    saveLocalDoc(path, updated);
    return;
  }
  try {
    return await firestore.setDoc(docRef, data, options);
  } catch (err: any) {
    if (isQuotaError(err)) {
      activateSandbox();
      let updated = data;
      if (options?.merge) {
         const current = getLocalDoc(path) || {};
         updated = { ...current, ...data };
      }
      saveLocalDoc(path, updated);
      return;
    }
    throw err;
  }
}

// Overridden deleteDoc function
export async function deleteDoc(docRef: any) {
  const path = getRefPath(docRef);
  const parts = path.split('/');
  
  if (isQuotaExceeded) {
    if (parts.length === 2) {
      const col = parts[0];
      const docId = parts[1];
      const items = getLocalCollection(col);
      const filtered = items.filter(i => i.id !== docId);
      saveLocalCollection(col, filtered);
    }
    return;
  }
  
  try {
    return await firestore.deleteDoc(docRef);
  } catch (err: any) {
    if (isQuotaError(err)) {
      activateSandbox();
      if (parts.length === 2) {
        const col = parts[0];
        const docId = parts[1];
        const items = getLocalCollection(col);
        const filtered = items.filter(i => i.id !== docId);
        saveLocalCollection(col, filtered);
      }
      return;
    }
    throw err;
  }
}

// Overridden onSnapshot function with guaranteed error suppression and auto-failover
export function onSnapshot(ref: any, ...args: any[]): () => void {
  const path = getRefPath(ref);
  const parts = path.split('/');
  
  let nextFn: any = null;
  let errorFn: any = null;
  
  if (typeof args[0] === 'function') {
    nextFn = args[0];
    errorFn = typeof args[1] === 'function' ? args[1] : null;
  } else if (typeof args[0] === 'object' && args[0] !== null) {
    if (typeof args[1] === 'function') {
      nextFn = args[1];
      errorFn = typeof args[2] === 'function' ? args[2] : null;
    } else {
      nextFn = args[0].next;
      errorFn = args[0].error;
    }
  }
  
  // Guarantee there is an error callback so we NEVER crash with Uncaught Firestore SDK exceptions
  const safeErrorFn = (err: any) => {
    console.warn(`⚠️ [Firestore Wrapper] onSnapshot intercepted error on path "${path}":`, err.message || err);
    if (isQuotaError(err)) {
      activateSandbox();
      triggerLocalSnapshot();
    }
    if (errorFn) {
      try {
        errorFn(err);
      } catch (e) {}
    }
  };

  // Dispatch local data snapshot
  const triggerLocalSnapshot = () => {
    if (!nextFn) return;
    if (parts.length === 2) {
      const data = getLocalDoc(path);
      nextFn(createMockDocSnapshot(parts[1], data));
    } else {
      const items = getLocalCollection(path);
      nextFn(createMockQuerySnapshot(items));
    }
  };

  // If already sandbox active, return instant data and register localStorage sync listeners
  if (isQuotaExceeded) {
    setTimeout(triggerLocalSnapshot, 10);
    
    const onLocalUpdate = (e: any) => {
      if (e.detail.path === path || e.detail.path === parts[0]) {
        triggerLocalSnapshot();
      }
    };
    
    window.addEventListener('lokal_db_update', onLocalUpdate);
    return () => {
      window.removeEventListener('lokal_db_update', onLocalUpdate);
    };
  }

  // Otherwise, register real onSnapshot with safety wrapper
  let realUnsub: any = null;
  try {
    const newArgs: any[] = [];
    let foundNext = false;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === 'function') {
        if (!foundNext) {
          foundNext = true;
          newArgs.push((snap: any) => {
            if (nextFn) nextFn(snap);
          });
        } else {
          // Skip user error function to use our safeErrorFn
          break;
        }
      } else if (typeof arg === 'object' && arg !== null) {
        const wrappedObserver = {
          next: (snap: any) => { if (nextFn) nextFn(snap); },
          error: safeErrorFn,
          complete: arg.complete
        };
        newArgs.push(wrappedObserver);
        foundNext = true;
      } else {
        newArgs.push(arg);
      }
    }
    
    if (foundNext && typeof args[0] === 'function') {
      newArgs.push(safeErrorFn);
    }
    
    realUnsub = (firestore.onSnapshot as any)(ref, ...newArgs);
  } catch (err: any) {
    console.warn(`[Firestore Wrapper] Could not initiate real listener on "${path}", failing over:`, err.message || err);
    if (isQuotaError(err)) {
      activateSandbox();
    }
    
    setTimeout(triggerLocalSnapshot, 10);
    
    const onLocalUpdate = (e: any) => {
      if (e.detail.path === path || e.detail.path === parts[0]) {
        triggerLocalSnapshot();
      }
    };
    
    window.addEventListener('lokal_db_update', onLocalUpdate);
    return () => {
      window.removeEventListener('lokal_db_update', onLocalUpdate);
    };
  }

  // Monitor storage updates even while online to allow flawless offline updates to keep working
  const onLocalUpdate = (e: any) => {
    if (e.detail.path === path || e.detail.path === parts[0]) {
      triggerLocalSnapshot();
    }
  };
  window.addEventListener('lokal_db_update', onLocalUpdate);

  return () => {
    if (realUnsub) {
      try {
        realUnsub();
      } catch (e) {}
    }
    window.removeEventListener('lokal_db_update', onLocalUpdate);
  };
}
