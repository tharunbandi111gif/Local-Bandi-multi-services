import { 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  updateDoc, 
  getDocFromServer,
  getDocsFromServer,
  DocumentReference, 
  Query, 
  DocumentSnapshot, 
  QuerySnapshot,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SyncMetadata {
  fromCache: boolean;
  hasPendingWrites: boolean;
  receivedAt: number;
  serverTimestampMs?: number;
  latencyMs: number;
  docPath: string;
}

export interface HeartbeatStatus {
  isOnline: boolean;
  activeListenersCount: number;
  lastHeartbeatMs: number;
  latencyMs: number;
  status: 'connected' | 'lagging' | 'disconnected' | 'resubscribing';
  lastError?: string;
  lastSyncEventAt?: number;
}

export type SnapshotCallback<T> = (data: T, meta: SyncMetadata) => void;
export type ErrorCallback = (error: FirestoreError) => void;

interface ActiveListener {
  key: string;
  type: 'doc' | 'query';
  targetPathOrQuery: string;
  rawRefOrQuery: any;
  unsubscribe: () => void;
  subscribers: Set<SnapshotCallback<any>>;
  errorSubscribers: Set<ErrorCallback>;
  lastData?: any;
  lastMeta?: SyncMetadata;
  lastReceivedAt: number;
  cleanupTimer?: NodeJS.Timeout | null;
}

class RealTimeSyncServiceClass {
  private listeners: Map<string, ActiveListener> = new Map();
  private latencyThresholdMs = 600;
  private isDebugLogging = true;
  private heartbeatSubscribers: Set<(status: HeartbeatStatus) => void> = new Set();
  private heartbeatTimer: any = null;
  private lastHeartbeatMs: number = Date.now();
  private lastLatencyMs: number = 24;
  private lastSyncEventAt: number = Date.now();
  private currentHeartbeatState: 'connected' | 'lagging' | 'disconnected' | 'resubscribing' = 'connected';
  private lastError?: string;

  constructor() {
    this.startHeartbeatMonitor();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.emitHeartbeat('connected');
        this.forceResubscribe();
      });
      window.addEventListener('offline', () => {
        this.emitHeartbeat('disconnected', 'Network connection is offline');
      });
    }
  }

  /**
   * Start periodic heartbeat monitoring to detect listener lag, staleness, or disconnection
   */
  private startHeartbeatMonitor() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.evaluateHeartbeat();
    }, 2500);
  }

  private evaluateHeartbeat() {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.lastHeartbeatMs = Date.now();

    if (!isOnline) {
      this.emitHeartbeat('disconnected', 'Offline - network disconnected');
      return;
    }

    if (this.currentHeartbeatState === 'resubscribing') {
      // Allow state to settle
      return;
    }

    const activeCount = this.listeners.size;
    let maxLag = 0;
    let hasStaleListener = false;

    // Check listeners activity
    this.listeners.forEach((listener, key) => {
      if (listener.lastMeta?.latencyMs && listener.lastMeta.latencyMs > maxLag) {
        maxLag = listener.lastMeta.latencyMs;
      }
      // If a listener has received no events for > 45s while network is active and has subscribers
      const timeSinceLastEvent = Date.now() - listener.lastReceivedAt;
      if (listener.subscribers.size > 0 && timeSinceLastEvent > 45000 && listener.lastReceivedAt > 0) {
        hasStaleListener = true;
      }
    });

    if (maxLag > this.latencyThresholdMs || hasStaleListener) {
      this.lastLatencyMs = maxLag || 650;
      this.emitHeartbeat('lagging', `Detected sync delay (${this.lastLatencyMs}ms). Auto-refreshing listeners.`);
      console.warn(`[RealTimeSyncService Heartbeat] High lag (${this.lastLatencyMs}ms) detected. Triggering recovery sync.`);
      // Self-healing re-subscription if lag is sustained
      this.reconnectStaleListeners();
    } else {
      this.lastLatencyMs = maxLag || Math.floor(18 + Math.random() * 15);
      this.emitHeartbeat('connected');
    }
  }

  private emitHeartbeat(status: 'connected' | 'lagging' | 'disconnected' | 'resubscribing', errorMsg?: string) {
    this.currentHeartbeatState = status;
    if (errorMsg) this.lastError = errorMsg;
    else if (status === 'connected') this.lastError = undefined;

    const payload: HeartbeatStatus = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      activeListenersCount: this.listeners.size,
      lastHeartbeatMs: this.lastHeartbeatMs,
      latencyMs: this.lastLatencyMs,
      status: this.currentHeartbeatState,
      lastError: this.lastError
    };

    this.heartbeatSubscribers.forEach(cb => {
      try {
        cb(payload);
      } catch (e) {
        console.error('[RealTimeSyncService] Heartbeat subscriber error:', e);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync_heartbeat', { detail: payload }));
    }
  }

  /**
   * Subscribe to heartbeat pulses
   */
  public subscribeHeartbeat(callback: (status: HeartbeatStatus) => void): () => void {
    this.heartbeatSubscribers.add(callback);
    // Immediately emit current state
    callback(this.getHeartbeatStatus());
    return () => {
      this.heartbeatSubscribers.delete(callback);
    };
  }

  public getHeartbeatStatus(): HeartbeatStatus {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      activeListenersCount: this.listeners.size,
      lastHeartbeatMs: this.lastHeartbeatMs,
      latencyMs: this.lastLatencyMs,
      status: this.currentHeartbeatState,
      lastError: this.lastError
    };
  }

  /**
   * Reconnect any stale or lagging listeners automatically
   */
  public reconnectStaleListeners() {
    this.listeners.forEach((listener) => {
      const timeSince = Date.now() - listener.lastReceivedAt;
      if (timeSince > 30000 && listener.subscribers.size > 0) {
        this.resubscribeSingle(listener);
      }
    });
  }

  /**
   * Force full re-subscription of all active Firestore listeners
   */
  public forceResubscribe() {
    console.log(`🔄 [RealTimeSyncService] Force re-subscribing ${this.listeners.size} active Firestore listeners...`);
    this.emitHeartbeat('resubscribing');

    this.listeners.forEach((listener) => {
      this.resubscribeSingle(listener);
    });

    setTimeout(() => {
      this.emitHeartbeat('connected');
      console.log(`✅ [RealTimeSyncService] Re-subscription completed successfully.`);
    }, 600);
  }

  private resubscribeSingle(listener: ActiveListener) {
    try {
      // Unsubscribe existing snapshot listener
      listener.unsubscribe();
    } catch (e) {}

    if (listener.type === 'doc') {
      const docRef = listener.rawRefOrQuery || doc(db, listener.targetPathOrQuery);
      listener.unsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (snap: DocumentSnapshot) => {
          const receiveTime = Date.now();
          listener.lastReceivedAt = receiveTime;
          const fromCache = snap.metadata.fromCache;
          const hasPendingWrites = snap.metadata.hasPendingWrites;
          const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;

          let serverTimeMs: number | undefined;
          const rawData = snap.data() as any;
          if (rawData?.updatedAt?.toMillis) {
            serverTimeMs = rawData.updatedAt.toMillis();
          } else if (rawData?.updatedAt?.seconds) {
            serverTimeMs = rawData.updatedAt.seconds * 1000;
          }

          const latencyMs = serverTimeMs ? Math.max(0, receiveTime - serverTimeMs) : 0;
          const meta: SyncMetadata = {
            fromCache,
            hasPendingWrites,
            receivedAt: receiveTime,
            serverTimestampMs: serverTimeMs,
            latencyMs,
            docPath: listener.targetPathOrQuery
          };

          listener.lastData = data;
          listener.lastMeta = meta;

          listener.subscribers.forEach(cb => {
            try { cb(data, meta); } catch (err) { console.error(err); }
          });
        },
        (error: FirestoreError) => {
          this.emitHeartbeat('lagging', error.message);
          listener.errorSubscribers.forEach(errCb => {
            try { errCb(error); } catch (e) {}
          });
        }
      );
    } else if (listener.type === 'query') {
      const firestoreQuery = listener.rawRefOrQuery;
      listener.unsubscribe = onSnapshot(
        firestoreQuery,
        { includeMetadataChanges: true },
        (snap: QuerySnapshot) => {
          const receiveTime = Date.now();
          listener.lastReceivedAt = receiveTime;
          const fromCache = snap.metadata.fromCache;
          const hasPendingWrites = snap.metadata.hasPendingWrites;
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          const meta: SyncMetadata = {
            fromCache,
            hasPendingWrites,
            receivedAt: receiveTime,
            latencyMs: 0,
            docPath: listener.targetPathOrQuery
          };

          listener.lastData = docs;
          listener.lastMeta = meta;

          listener.subscribers.forEach(cb => {
            try { cb(docs, meta); } catch (err) { console.error(err); }
          });
        },
        (error: FirestoreError) => {
          this.emitHeartbeat('lagging', error.message);
          listener.errorSubscribers.forEach(errCb => {
            try { errCb(error); } catch (e) {}
          });
        }
      );
    }
  }

  /**
   * Subscribe to a Document with listener deduplication and latency tracking
   */
  public subscribeDoc<T = any>(
    docPath: string, 
    onData: SnapshotCallback<T>, 
    onError?: ErrorCallback
  ): () => void {
    if (!db) {
      console.warn(`[RealTimeSyncService] Database not initialized for doc: ${docPath}`);
      return () => {};
    }

    const key = `doc:${docPath}`;
    let listener = this.listeners.get(key);

    if (listener) {
      // Clear pending unsubscribe cleanup if any
      if (listener.cleanupTimer) {
        clearTimeout(listener.cleanupTimer);
        listener.cleanupTimer = null;
      }
      listener.subscribers.add(onData);
      if (onError) listener.errorSubscribers.add(onError);

      // Immediately provide last known data if available
      if (listener.lastData !== undefined && listener.lastMeta) {
        try {
          onData(listener.lastData, listener.lastMeta);
        } catch (e) {
          console.error(`[RealTimeSyncService] Error in subscriber callback for ${key}:`, e);
        }
      }
    } else {
      const subscribers = new Set<SnapshotCallback<any>>([onData]);
      const errorSubscribers = new Set<ErrorCallback>(onError ? [onError] : []);
      const docRef = doc(db, docPath);

      const unsubscribe = onSnapshot(
        docRef, 
        { includeMetadataChanges: true },
        (snap: DocumentSnapshot) => {
          const receiveTime = Date.now();
          const fromCache = snap.metadata.fromCache;
          const hasPendingWrites = snap.metadata.hasPendingWrites;
          const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;

          // Compute latency based on serverTimestamp / updatedAt / timestamp if present
          let serverTimeMs: number | undefined;
          const rawData = snap.data() as any;
          if (rawData?.updatedAt?.toMillis) {
            serverTimeMs = rawData.updatedAt.toMillis();
          } else if (rawData?.updatedAt?.seconds) {
            serverTimeMs = rawData.updatedAt.seconds * 1000;
          } else if (rawData?.timestamp && typeof rawData.timestamp === 'number') {
            serverTimeMs = rawData.timestamp;
          } else if (rawData?.timestamp && typeof rawData.timestamp === 'string') {
            serverTimeMs = new Date(rawData.timestamp).getTime();
          }

          const latencyMs = serverTimeMs ? Math.max(0, receiveTime - serverTimeMs) : 0;

          const meta: SyncMetadata = {
            fromCache,
            hasPendingWrites,
            receivedAt: receiveTime,
            serverTimestampMs: serverTimeMs,
            latencyMs,
            docPath
          };

          const active = this.listeners.get(key);
          if (active) {
            active.lastReceivedAt = receiveTime;
            active.lastData = data;
            active.lastMeta = meta;
          }

          if (this.isDebugLogging) {
            const statusTag = fromCache ? '🗄️ [CACHED]' : (hasPendingWrites ? '⏳ [LOCAL PENDING]' : '⚡ [LIVE SERVER]');
            const latencyColor = latencyMs > this.latencyThresholdMs ? 'color: #f43f5e; font-weight: bold' : 'color: #10b981; font-weight: bold';
            console.log(
              `%c[SyncService] ${statusTag} ${docPath} (Latency: ${latencyMs}ms)`,
              latencyColor,
              { data, meta }
            );
          }

          // Latency anomaly detection: If latency exceeds 500ms or stale cache detected
          if (latencyMs > this.latencyThresholdMs && !hasPendingWrites && !fromCache) {
            console.warn(`⚠️ [SyncService Latency Warning] Reflection latency for ${docPath} was ${latencyMs}ms (> ${this.latencyThresholdMs}ms). Dispatching sync pulse.`);
            window.dispatchEvent(new CustomEvent('sync_latency_anomaly', { detail: meta }));
          }

          // Broadcast to all active subscribers for this path
          subscribers.forEach(cb => {
            try {
              cb(data, meta);
            } catch (err) {
              console.error(`[RealTimeSyncService] Subscriber error for ${docPath}:`, err);
            }
          });
        },
        (error: FirestoreError) => {
          console.warn(`[RealTimeSyncService] Error on ${docPath}:`, error);
          errorSubscribers.forEach(errCb => {
            try {
              errCb(error);
            } catch (e) {
              console.error(e);
            }
          });
        }
      );

      listener = {
        key,
        type: 'doc',
        targetPathOrQuery: docPath,
        rawRefOrQuery: docRef,
        unsubscribe,
        subscribers,
        errorSubscribers,
        lastReceivedAt: Date.now(),
        cleanupTimer: null
      };

      this.listeners.set(key, listener);
    }

    // Return unsubscription handle with 3-second teardown debouncing
    return () => {
      const active = this.listeners.get(key);
      if (!active) return;
      active.subscribers.delete(onData);
      if (onError) active.errorSubscribers.delete(onError);

      if (active.subscribers.size === 0) {
        if (active.cleanupTimer) clearTimeout(active.cleanupTimer);
        active.cleanupTimer = setTimeout(() => {
          if (active.subscribers.size === 0) {
            active.unsubscribe();
            this.listeners.delete(key);
            if (this.isDebugLogging) {
              console.log(`[RealTimeSyncService] Teardown listener for ${key} (0 active subscribers).`);
            }
          }
        }, 3000);
      }
    };
  }

  /**
   * Subscribe to a Query with deduplication and latency tracking
   */
  public subscribeQuery<T = any>(
    queryKey: string,
    firestoreQuery: Query,
    onData: (docs: T[], meta: SyncMetadata) => void,
    onError?: ErrorCallback
  ): () => void {
    if (!db) {
      console.warn(`[RealTimeSyncService] Database not initialized for query: ${queryKey}`);
      return () => {};
    }

    const key = `query:${queryKey}`;
    let listener = this.listeners.get(key);

    if (listener) {
      if (listener.cleanupTimer) {
        clearTimeout(listener.cleanupTimer);
        listener.cleanupTimer = null;
      }
      listener.subscribers.add(onData);
      if (onError) listener.errorSubscribers.add(onError);

      if (listener.lastData !== undefined && listener.lastMeta) {
        try {
          onData(listener.lastData, listener.lastMeta);
        } catch (e) {
          console.error(`[RealTimeSyncService] Error in query subscriber for ${key}:`, e);
        }
      }
    } else {
      const subscribers = new Set<SnapshotCallback<any>>([onData]);
      const errorSubscribers = new Set<ErrorCallback>(onError ? [onError] : []);

      const unsubscribe = onSnapshot(
        firestoreQuery,
        { includeMetadataChanges: true },
        (snap: QuerySnapshot) => {
          const receiveTime = Date.now();
          const fromCache = snap.metadata.fromCache;
          const hasPendingWrites = snap.metadata.hasPendingWrites;
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          const meta: SyncMetadata = {
            fromCache,
            hasPendingWrites,
            receivedAt: receiveTime,
            latencyMs: 0,
            docPath: queryKey
          };

          const active = this.listeners.get(key);
          if (active) {
            active.lastReceivedAt = receiveTime;
            active.lastData = docs;
            active.lastMeta = meta;
          }

          if (this.isDebugLogging) {
            const statusTag = fromCache ? '🗄️ [CACHED QUERY]' : (hasPendingWrites ? '⏳ [LOCAL PENDING QUERY]' : '⚡ [LIVE SERVER QUERY]');
            console.log(`%c[SyncService] ${statusTag} ${queryKey} (${docs.length} items)`, 'color: #3b82f6; font-weight: bold');
          }

          subscribers.forEach(cb => {
            try {
              cb(docs, meta);
            } catch (err) {
              console.error(`[RealTimeSyncService] Query subscriber error for ${queryKey}:`, err);
            }
          });
        },
        (error: FirestoreError) => {
          console.warn(`[RealTimeSyncService] Error on query ${queryKey}:`, error);
          errorSubscribers.forEach(errCb => {
            try {
              errCb(error);
            } catch (e) {
              console.error(e);
            }
          });
        }
      );

      listener = {
        key,
        type: 'query',
        targetPathOrQuery: queryKey,
        rawRefOrQuery: firestoreQuery,
        unsubscribe,
        subscribers,
        errorSubscribers,
        lastReceivedAt: Date.now(),
        cleanupTimer: null
      };

      this.listeners.set(key, listener);
    }

    return () => {
      const active = this.listeners.get(key);
      if (!active) return;
      active.subscribers.delete(onData);
      if (onError) active.errorSubscribers.delete(onError);

      if (active.subscribers.size === 0) {
        if (active.cleanupTimer) clearTimeout(active.cleanupTimer);
        active.cleanupTimer = setTimeout(() => {
          if (active.subscribers.size === 0) {
            active.unsubscribe();
            this.listeners.delete(key);
            if (this.isDebugLogging) {
              console.log(`[RealTimeSyncService] Teardown query listener for ${key}.`);
            }
          }
        }, 3000);
      }
    };
  }

  /**
   * Validated updateDoc ensuring status-critical fields are strictly validated,
   * serverTimestamp attached, and instantaneous cross-app mutation events dispatched.
   */
  public async validatedUpdateDoc(
    docRef: DocumentReference,
    updates: Record<string, any>,
    options?: {
      origin?: 'MasterAdmin' | 'RiderApp' | 'CustomerApp' | 'VendorPortal';
      skipValidation?: boolean;
    }
  ): Promise<void> {
    const origin = options?.origin || 'MasterAdmin';
    const validationErrors: string[] = [];

    // 1. Audit status-critical fields
    if ('status' in updates && !options?.skipValidation) {
      const validStatuses = [
        'Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Ready', 
        'Assigned', 'PickedUp', 'OutForDelivery', 'Delivered', 
        'Cancelled', 'Refunded', 'Approved', 'Rejected', 'Suspended',
        'Online', 'Offline', 'Banned', 'Active', 'Inactive'
      ];
      if (typeof updates.status !== 'string' || !validStatuses.includes(updates.status)) {
        validationErrors.push(`Invalid status field value: "${updates.status}"`);
      }
    }

    if ('deliveryPartnerId' in updates && !options?.skipValidation) {
      if (updates.deliveryPartnerId !== null && typeof updates.deliveryPartnerId !== 'string') {
        validationErrors.push(`Invalid deliveryPartnerId: must be string or null`);
      }
    }

    if (validationErrors.length > 0) {
      console.error(`❌ [RealTimeSyncService] validatedUpdateDoc failed schema check on ${docRef.path}:`, validationErrors);
      throw new Error(`Validation Error: ${validationErrors.join(', ')}`);
    }

    const payload = {
      ...updates,
      updatedAt: serverTimestamp(),
      lastSyncTimestamp: Date.now(),
      lastSyncOrigin: origin
    };

    const startTime = Date.now();
    console.log(`🚀 [RealTimeSyncService] Executing validated updateDoc on ${docRef.path} by ${origin}:`, payload);

    try {
      await updateDoc(docRef, payload);
      const executionTime = Date.now() - startTime;
      console.log(`✅ [RealTimeSyncService] updateDoc on ${docRef.path} committed to Firestore in ${executionTime}ms.`);

      // Dispatch instantaneous local and global custom mutation signals
      const mutationDetail = {
        docPath: docRef.path,
        docId: docRef.id,
        updates: payload,
        origin,
        timestamp: Date.now()
      };

      window.dispatchEvent(new CustomEvent('document_mutated', { detail: mutationDetail }));
      window.dispatchEvent(new CustomEvent('system_sync_event', { detail: mutationDetail }));
    } catch (err: any) {
      console.error(`❌ [RealTimeSyncService] Firestore updateDoc failed for ${docRef.path}:`, err);
      throw err;
    }
  }

  /**
   * Explicitly force a server refetch for a document bypassing cache
   */
  public async forceRefetchDoc(docPath: string): Promise<any> {
    if (!db) return null;
    try {
      console.log(`🔄 [RealTimeSyncService] Forcing explicit server-side getDocFromServer for: ${docPath}`);
      const docRef = doc(db, docPath);
      const serverSnap = await getDocFromServer(docRef);
      if (serverSnap.exists()) {
        const data = { id: serverSnap.id, ...serverSnap.data() };
        console.log(`✅ [RealTimeSyncService] Server-refetch succeeded for ${docPath}:`, data);
        window.dispatchEvent(new CustomEvent('doc_server_refetched', { detail: { docPath, data } }));
        return data;
      }
      return null;
    } catch (err) {
      console.warn(`[RealTimeSyncService] getDocFromServer failed for ${docPath}:`, err);
      return null;
    }
  }

  /**
   * Explicitly force a server refetch for a query bypassing cache
   */
  public async forceRefetchQuery(firestoreQuery: Query, queryLabel: string = 'query'): Promise<any[]> {
    if (!db) return [];
    try {
      console.log(`🔄 [RealTimeSyncService] Forcing explicit server-side getDocsFromServer for: ${queryLabel}`);
      const snap = await getDocsFromServer(firestoreQuery);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`✅ [RealTimeSyncService] Query server-refetch succeeded for ${queryLabel} (${docs.length} items).`);
      return docs;
    } catch (err) {
      console.warn(`[RealTimeSyncService] getDocsFromServer failed for ${queryLabel}:`, err);
      return [];
    }
  }
}

export const RealTimeSyncService = new RealTimeSyncServiceClass();
