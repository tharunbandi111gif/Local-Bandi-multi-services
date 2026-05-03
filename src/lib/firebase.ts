import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize app only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with long-polling for better connectivity in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Test Connection with retry/warmup logic
async function testConnection() {
  const check = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firebase connection established.");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('the client is offline')) {
          console.warn("Cloud Firestore is operating in offline mode. Waiting for connection...");
          setTimeout(check, 5000);
        } else if (error.message.includes('insufficient permissions')) {
          // This actually means we connected! Just that we can't read 'test' collection, which is fine.
          console.log("Firebase connectivity verified.");
        }
      }
    }
  };
  check();
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
