import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import React, { useEffect } from 'react';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { FirebaseProvider } from './contexts/FirebaseContext.tsx';
import { LanguageProvider } from './i18n.ts';
import './index.css';

// MSG91 OTP Widget Configuration & Initialization
const widgetId = "36666c664e56353538383733";
const authToken = "514095TuKDjYZn2WUw69fde13eP1";
console.log("✓ Web MSG91 direct fetch integration configured (Widget ID:", widgetId, ")");

// Silence Firebase quota-exhausted and assertion failures to prevent app crash
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
      return true; // Prevents the firing of the default event handler and crashing React
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
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  </StrictMode>,
);
