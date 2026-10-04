import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuditLogEntry, UserRole } from '../types';

export interface LogAuditParams {
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'system';
  action: string;
  targetCollection: string;
  targetId: string;
  details?: Record<string, any> | string;
  branchId?: string | null;
}

export async function logAuditAction(params: LogAuditParams): Promise<string | null> {
  const payload = {
    ...params,
    timestamp: serverTimestamp(),
    createdAt: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    ipAddress: 'client-verified',
  };

  try {
    // 1. Write to activityLogs collection
    const ref1 = await addDoc(collection(db, 'activityLogs'), payload);

    // 2. Also write to audit_logs for backward compatibility
    addDoc(collection(db, 'audit_logs'), payload).catch(() => {});

    // 3. Post to backend endpoint if available
    if (typeof fetch !== 'undefined') {
      fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() })
      }).catch(() => {});
    }

    return ref1.id;
  } catch (err) {
    console.warn('Audit log write error:', err);
    return null;
  }
}
