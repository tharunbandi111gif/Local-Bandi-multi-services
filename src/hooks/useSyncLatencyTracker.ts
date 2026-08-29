import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, collection, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RealTimeSyncService } from '../services/realTimeSyncService';

export interface SyncLatencyMetrics {
  currentLatencyMs: number;
  maxLatencyMs: number;
  averageLatencyMs: number;
  lastSyncTimestamp: number;
  isStaleCacheDetected: boolean;
  hasPendingWrites: boolean;
  syncStatus: 'optimal' | 'moderate' | 'high_latency' | 'stale_cache';
  totalSnapshotsReceived: number;
}

export function useSyncLatencyTracker(options?: {
  thresholdMs?: number;
  onHighLatencyDetected?: (latencyMs: number, path: string) => void;
  onCacheAnomaly?: () => void;
}) {
  const thresholdMs = options?.thresholdMs || 500;
  const [metrics, setMetrics] = useState<SyncLatencyMetrics>({
    currentLatencyMs: 0,
    maxLatencyMs: 0,
    averageLatencyMs: 0,
    lastSyncTimestamp: Date.now(),
    isStaleCacheDetected: false,
    hasPendingWrites: false,
    syncStatus: 'optimal',
    totalSnapshotsReceived: 0
  });

  const latencyHistoryRef = useRef<number[]>([]);
  const isRefetchingRef = useRef(false);

  // Explicitly force a document mutation pulse or refetch across all core entities
  const forceGlobalResync = useCallback(async (reason: string = 'high_latency_threshold_exceeded') => {
    if (isRefetchingRef.current) return;
    isRefetchingRef.current = true;
    console.warn(`⚡ [SyncLatencyTracker] Triggering forced mutation & refetch signal! Reason: ${reason}`);

    try {
      // 1. Purge potentially stale local caches
      localStorage.removeItem('cached_local_inventory');
      
      // 2. Direct server getDocFromServer pulse on system_sync
      await RealTimeSyncService.forceRefetchDoc('settings/system_sync');
      
      // 3. Dispatch global storage and sync events for immediate UI reactive refresh
      window.dispatchEvent(new CustomEvent('sync_latency_resync_triggered', {
        detail: { reason, timestamp: Date.now() }
      }));
      window.dispatchEvent(new CustomEvent('system_sync_event', {
        detail: { action: 'FORCED_RESYNC', timestamp: Date.now() }
      }));
      window.dispatchEvent(new Event('storage'));
      
      console.log(`✅ [SyncLatencyTracker] Forced resync cycle completed successfully.`);
    } catch (err) {
      console.error(`❌ [SyncLatencyTracker] Forced resync encountered error:`, err);
    } finally {
      setTimeout(() => {
        isRefetchingRef.current = false;
      }, 1000);
    }
  }, []);

  // Monitor Firestore snapshot metadata changes in real-time
  useEffect(() => {
    if (!db) return;

    console.log(`📡 [SyncLatencyTracker] Initialized with ${thresholdMs}ms threshold...`);

    // 1. Listen to system_sync doc metadata
    const unsubSyncDoc = onSnapshot(
      doc(db, 'settings', 'system_sync'),
      { includeMetadataChanges: true },
      (snap) => {
        const receiveTime = Date.now();
        const fromCache = snap.metadata.fromCache;
        const hasPendingWrites = snap.metadata.hasPendingWrites;
        
        let serverTimestampMs: number | null = null;
        if (snap.exists()) {
          const data = snap.data();
          if (data?.timestamp) {
            serverTimestampMs = typeof data.timestamp === 'number' 
              ? data.timestamp 
              : new Date(data.timestamp).getTime();
          } else if (data?.updatedAt?.toMillis) {
            serverTimestampMs = data.updatedAt.toMillis();
          }
        }

        const calculatedLatency = serverTimestampMs ? Math.max(0, receiveTime - serverTimestampMs) : 0;
        
        // Track metrics
        latencyHistoryRef.current.push(calculatedLatency);
        if (latencyHistoryRef.current.length > 50) latencyHistoryRef.current.shift();
        
        const avg = Math.round(
          latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length
        );

        let status: 'optimal' | 'moderate' | 'high_latency' | 'stale_cache' = 'optimal';
        if (fromCache) {
          status = 'stale_cache';
        } else if (calculatedLatency > thresholdMs) {
          status = 'high_latency';
        } else if (calculatedLatency > thresholdMs / 2) {
          status = 'moderate';
        }

        setMetrics(prev => ({
          currentLatencyMs: calculatedLatency,
          maxLatencyMs: Math.max(prev.maxLatencyMs, calculatedLatency),
          averageLatencyMs: avg,
          lastSyncTimestamp: receiveTime,
          isStaleCacheDetected: fromCache,
          hasPendingWrites,
          syncStatus: status,
          totalSnapshotsReceived: prev.totalSnapshotsReceived + 1
        }));

        // Trigger anomaly handling if latency > thresholdMs
        if (calculatedLatency > thresholdMs && !hasPendingWrites && !fromCache) {
          console.warn(`🚨 [SyncLatencyTracker] Latency of ${calculatedLatency}ms exceeded ${thresholdMs}ms limit! Forcing immediate refetch.`);
          options?.onHighLatencyDetected?.(calculatedLatency, 'settings/system_sync');
          forceGlobalResync(`latency_${calculatedLatency}ms_exceeded_${thresholdMs}ms`);
        }

        if (fromCache && !hasPendingWrites && navigator.onLine) {
          console.warn(`⚠️ [SyncLatencyTracker] Detected fromCache=true while online!`);
          options?.onCacheAnomaly?.();
        }
      },
      (err) => {
        console.warn(`[SyncLatencyTracker] Error monitoring system_sync:`, err);
      }
    );

    // 2. Listen to sync latency anomaly events dispatched from RealTimeSyncService
    const handleAnomalyEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const meta = customEvent.detail;
      console.warn(`⚠️ [SyncLatencyTracker] Anomaly event received from RealTimeSyncService:`, meta);
      if (meta?.latencyMs && meta.latencyMs > thresholdMs) {
        forceGlobalResync(`anomaly_event_${meta.docPath}_${meta.latencyMs}ms`);
      }
    };

    window.addEventListener('sync_latency_anomaly', handleAnomalyEvent);

    return () => {
      unsubSyncDoc();
      window.removeEventListener('sync_latency_anomaly', handleAnomalyEvent);
    };
  }, [thresholdMs, options, forceGlobalResync]);

  return {
    metrics,
    forceGlobalResync
  };
}
