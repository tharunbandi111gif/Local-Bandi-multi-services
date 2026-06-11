import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  initializeFirestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize app only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with long-polling auto-detection for better connectivity
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export const setupRecaptcha = (containerId: string) => {
  if (typeof window === 'undefined') return null;

  const element = document.getElementById(containerId);
  if (!element) {
    console.debug(`[Recaptcha] Container #${containerId} not found yet.`);
    return null;
  }

  // Clear existing verifier to prevent "auth/argument-error" from multiple initializations
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    } catch (e) {
      console.warn("Error clearing old recaptcha:", e);
    }
  }

  try {
    if (!auth) {
      console.error("Auth not initialized");
      return null;
    }

    const verifier = new RecaptchaVerifier(auth, element, {
      'size': 'invisible',
      'callback': () => {
        console.debug("reCAPTCHA solved");
      },
      'expired-callback': () => {
        console.debug("reCAPTCHA expired");
      }
    });

    // Clear any previous rendering leftovers in the element
    if (element.children.length > 0) {
      element.innerHTML = '';
    }

    verifier.render(); // Explicitly render for more stability
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  } catch (error) {
    console.error("Recaptcha initialization failed:", error);
    return null;
  }
};

export type { ConfirmationResult };

// Test Connection with retry/warmup logic
async function testConnection() {
  const check = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Firebase connection established.");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('the client is offline') || error.message.includes('unavailable')) {
          console.warn("Cloud Firestore is operating in offline mode or unavailable. Waiting for connection...");
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
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Provide user-friendly feedback for common errors
  let friendlyMessage = "";
  let recoveryOption = "";
  let shouldThrow = true;

  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota limit exceeded')) {
    friendlyMessage = "Daily database limit reached. We are currently performing system maintenance to increase capacity. Your orders and data are safe.";
    recoveryOption = "Please try again in a few hours or tomorrow morning.";
    shouldThrow = false;
  } else if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
    friendlyMessage = "Network connection lost. The app is running in offline mode.";
    recoveryOption = "Check your internet connection. We will sync as soon as you are back online.";
    shouldThrow = false;
  } else if (errorMessage.includes('insufficient permissions')) {
    console.warn("Permission denied for path:", path);
    shouldThrow = false;
    // Usually don't show to user unless critical
  } else if (errorMessage.includes('auth/operation-not-allowed')) {
    friendlyMessage = "Selected payment method (Cash) requires admin pre-approval for this account.";
    recoveryOption = "Please contact founder via Customer Care or use an online payment method.";
  } else if (errorMessage.includes('No document to update') || errorMessage.toLowerCase().includes('notfound') || errorMessage.toLowerCase().includes('not-found')) {
    friendlyMessage = "This order or document was not found or has been removed from the server.";
    recoveryOption = "The database may have been cleared or the record has been deleted by an administrator. Please refresh the page.";
    shouldThrow = false;
  }

  if (friendlyMessage) {
    window.dispatchEvent(new CustomEvent('lokal_error', { 
      detail: { message: friendlyMessage, recovery: recoveryOption, originalError: errorMessage } 
    }));
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
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
  
  if (operationType === OperationType.GET || operationType === OperationType.LIST) {
    shouldThrow = false;
  }
  
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}
