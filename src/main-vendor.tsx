import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import VendorApp from './components/VendorApp.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { FirebaseProvider } from './contexts/FirebaseContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import FloatingAppSwitcher from './components/common/FloatingAppSwitcher.tsx';
import StandaloneAppGate from './components/auth/StandaloneAppGate.tsx';
import './index.css';

// Silence Firebase quota-exhausted and assertion failures
if (typeof window !== 'undefined') {
  const isFirestoreError = (err: any) => {
    if (!err) return false;
    const msg = String(err.message || err);
    return msg.includes('FIRESTORE') || 
           msg.includes('firebase') || 
           msg.includes('quota') || 
           msg.includes('Unexpected state') ||
           msg.includes('resource-exhausted') ||
           msg.includes('Quota limit exceeded');
  };

  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (isFirestoreError(message) || isFirestoreError(error)) {
      console.warn("Muted background Firestore error:", message, error);
      return true;
    }
    if (originalOnError) {
      return originalOnError.apply(this, arguments as any);
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isFirestoreError(event.reason)) {
      console.warn("Muted background Firestore promise rejection:", event.reason);
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseProvider>
        <ThemeProvider>
          <StandaloneAppGate 
            targetApp="vendor"
            appName="Local Bandi Multi Services"
            appDescription="Merchant Catalog, Live Order Dispatch & Daily Revenue Settlements"
            themeColor="emerald"
          >
            <VendorApp />
          </StandaloneAppGate>
          <FloatingAppSwitcher currentApp="vendor" />
        </ThemeProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>,
);
