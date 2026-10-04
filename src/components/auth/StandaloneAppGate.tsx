import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Store, 
  Bike, 
  Building2, 
  Lock, 
  LogOut, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  Phone, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Users,
  Eye,
  KeyRound,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useFirebase, BOOTSTRAP_MASTER_ADMINS } from '../../contexts/FirebaseContext';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { StandaloneAppRole, UserRole } from '../../types';
import Login from '../Login';
import PartnerOnboarding from '../PartnerOnboarding';
import { logAuditAction } from '../../services/auditService';

interface StandaloneAppGateProps {
  targetApp: StandaloneAppRole;
  appName: string;
  appDescription: string;
  themeColor: 'yellow' | 'emerald' | 'blue' | 'amber' | 'red';
  children: React.ReactNode;
}

const APP_CONFIGS = {
  customer: {
    name: 'Local Bandi Customer App',
    packageId: 'com.localbandi.customer',
    url: '/',
    allowedRoles: ['customer', 'user', 'master_admin', 'masterAdmin', 'admin'],
    roleName: 'Customer',
    icon: Users,
    headerBg: 'bg-yellow-500',
    headerText: 'text-yellow-950',
    accentColor: '#facc15'
  },
  vendor: {
    name: 'Local Bandi Vendor App',
    packageId: 'com.localbandi.vendor',
    url: '/vendor.html',
    allowedRoles: ['vendor', 'master_admin', 'masterAdmin', 'admin'],
    roleName: 'Vendor Merchant',
    icon: Store,
    headerBg: 'bg-emerald-600',
    headerText: 'text-white',
    accentColor: '#10b981'
  },
  delivery: {
    name: 'Local Bandi Delivery Partner App',
    packageId: 'com.localbandi.delivery',
    url: '/delivery.html',
    allowedRoles: ['delivery', 'deliveryPartner', 'master_admin', 'masterAdmin', 'admin'],
    roleName: 'Delivery Partner',
    icon: Bike,
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    accentColor: '#2563eb'
  },
  branch_admin: {
    name: 'Local Bandi Branch Admin App',
    packageId: 'com.localbandi.branchadmin',
    url: '/branch-admin.html',
    allowedRoles: ['branch_admin', 'branchAdmin', 'master_admin', 'masterAdmin', 'admin'],
    roleName: 'Branch Administrator',
    icon: Building2,
    headerBg: 'bg-amber-600',
    headerText: 'text-white',
    accentColor: '#f59e0b'
  },
  master_admin: {
    name: 'Local Bandi Master Admin App',
    packageId: 'com.localbandi.masteradmin',
    url: '/admin.html',
    allowedRoles: ['master_admin', 'masterAdmin', 'admin'],
    roleName: 'Master Super Admin',
    icon: ShieldAlert,
    headerBg: 'bg-rose-700',
    headerText: 'text-white',
    accentColor: '#ef4444'
  }
};

export default function StandaloneAppGate({
  targetApp,
  appName,
  appDescription,
  themeColor,
  children
}: StandaloneAppGateProps) {
  const { user, userProfile, logout, isMasterAdmin: ctxIsMasterAdmin } = useFirebase();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [overrideMode, setOverrideMode] = useState(false);
  const [deniedLogSent, setDeniedLogSent] = useState(false);

  const config = APP_CONFIGS[targetApp];
  const IconComponent = config.icon;

  // Determine if current authenticated user is Master Admin
  const cleanPhone = (user?.phoneNumber || userProfile?.phone || '').replace(/\D/g, '').slice(-10);
  const userEmail = user?.email || userProfile?.email || '';
  const userProfileRole = (userProfile?.role as string) || '';
  
  const isMasterAdmin = ctxIsMasterAdmin ||
    BOOTSTRAP_MASTER_ADMINS.emails.includes(userEmail) ||
    BOOTSTRAP_MASTER_ADMINS.phones.some(p => p.replace(/\D/g, '').slice(-10) === cleanPhone && cleanPhone.length >= 10) ||
    userProfileRole === 'masterAdmin' ||
    userProfileRole === 'master_admin' ||
    userProfileRole === 'admin' ||
    localStorage.getItem('admin_session_active') === 'true';

  // Normalize user's active role
  const rawRole = userProfileRole || (isMasterAdmin ? 'master_admin' : 'customer');
  const normalizedRole: UserRole = 
    isMasterAdmin ? 'master_admin' :
    (rawRole === 'vendor' ? 'vendor' :
     rawRole === 'delivery' || rawRole === 'deliveryPartner' ? 'delivery' :
     rawRole === 'branchAdmin' || rawRole === 'branch_admin' ? 'branch_admin' : 'customer');

  const approvalStatus = (userProfile as any)?.approvalStatus || (userProfile?.isApproved !== false ? 'approved' : 'pending');
  const accountStatus = (userProfile as any)?.accountStatus || ((userProfile as any)?.isDeactivated ? 'disabled' : 'active');

  // Real-time online heartbeat and presence synchronization
  useEffect(() => {
    if (!user) {
      setCheckingAuth(false);
      return;
    }

    const uid = user.uid;
    const userRef = doc(db, 'users', uid);

    // Update active status & presence
    updateDoc(userRef, {
      isOnline: true,
      lastActive: serverTimestamp(),
      activeApp: targetApp
    }).catch(() => {});

    // Periodic heartbeat every 45s
    const heartbeat = setInterval(() => {
      updateDoc(userRef, {
        isOnline: true,
        lastActive: serverTimestamp()
      }).catch(() => {});
    }, 45000);

    // On unmount/unload mark offline
    const handleUnload = () => {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/user/presence', JSON.stringify({ uid, isOnline: false }));
        }
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleUnload);

    setCheckingAuth(false);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleUnload);
      updateDoc(userRef, {
        isOnline: false,
        lastActive: serverTimestamp()
      }).catch(() => {});
    };
  }, [user, targetApp]);

  // Log unauthorized access attempts to audit log
  useEffect(() => {
    if (user && !deniedLogSent) {
      const isRoleAllowed = config.allowedRoles.includes(normalizedRole) || isMasterAdmin;
      if (!isRoleAllowed && targetApp !== 'customer') {
        logAuditAction({
          actorId: user.uid,
          actorName: user.displayName || userProfile?.name || cleanPhone || 'Unknown User',
          actorRole: normalizedRole,
          action: 'ACCESS_DENIED_UNAUTHORIZED_APP',
          targetCollection: 'system_security',
          targetId: targetApp,
          details: {
            attemptedApp: targetApp,
            userRole: normalizedRole,
            phone: cleanPhone,
            email: userEmail
          }
        });
        setDeniedLogSent(true);
      }
    }
  }, [user, normalizedRole, targetApp, isMasterAdmin, deniedLogSent]);

  // If customer app, allow guest browsing
  if (targetApp === 'customer') {
    return (
      <div className="w-full min-h-screen">
        {children}
      </div>
    );
  }

  // If not logged in on restricted apps, show role-dedicated login barrier
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
        {/* Top App Header */}
        <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.headerBg} flex items-center justify-center text-white shadow-lg`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                {appName}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {config.packageId}
                </span>
              </h1>
              <p className="text-xs text-slate-400">{appDescription}</p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
          >
            Customer App <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </header>

        {/* Dedicated Sign-In Center */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl ${config.headerBg} text-white mx-auto flex items-center justify-center shadow-xl mb-4`}>
                <IconComponent className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 mb-2">
                <Lock className="w-3 h-3 text-amber-400" /> Authorized Login Required
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">{appName}</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Sign in with your registered phone number or Google account to access your {config.roleName} dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${config.headerBg} hover:opacity-90 active:scale-[0.99]`}
              >
                <Phone className="w-4 h-4" />
                Sign In with Phone OTP / Google
              </button>

              {(targetApp === 'vendor' || targetApp === 'delivery') && (
                <button
                  onClick={() => setShowOnboardingModal(true)}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Not registered yet? Register as {config.roleName}
                </button>
              )}
            </div>

            {/* Security Notice */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-500">
              <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p>
                Strict Role Enforcement: Only verified {config.roleName} accounts approved by Master Admin can access this console.
              </p>
            </div>
          </div>
        </main>

        {/* Embedded Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 border border-slate-800 relative">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
              <Login onLogin={() => setShowLoginModal(false)} />
            </div>
          </div>
        )}

        {/* Registration Modal */}
        {showOnboardingModal && (
          <PartnerOnboarding
            userId={user?.uid || 'guest_temp'}
            defaultType={targetApp === 'vendor' ? 'Vendor' : 'DeliveryPartner'}
            onClose={() => setShowOnboardingModal(false)}
            onSuccess={() => setShowOnboardingModal(false)}
          />
        )}
      </div>
    );
  }

  // 1. MASTER ADMIN APP - STRICT SECURITY CHECK
  if (targetApp === 'master_admin') {
    if (!isMasterAdmin) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-500 mx-auto flex items-center justify-center shadow-xl mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3">
              <Lock className="w-3.5 h-3.5" /> ACCESS DENIED (403)
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Master Admin Authorization Required</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This Central Command Center is restricted exclusively to authenticated and authorized Local Bandi Super Administrators.
            </p>

            <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Account:</span>
                <span className="text-white font-semibold">{user.email || user.phoneNumber || user.uid}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Identified Role:</span>
                <span className="text-rose-400 font-bold uppercase">{normalizedRole}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Status:</span>
                <span className="text-amber-400">Unauthorized Console</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  window.location.href = normalizedRole === 'vendor' ? '/vendor.html' :
                    normalizedRole === 'delivery' ? '/delivery.html' :
                    normalizedRole === 'branch_admin' ? '/branch-admin.html' : '/';
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-2"
              >
                Launch Your Authorized App ({normalizedRole.toUpperCase()}) <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => logout()}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-400 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-800/40 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out & Switch Account
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // 2. ACCOUNT STATUS CHECK (Disabled / Suspended)
  if (accountStatus === 'disabled' || accountStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-amber-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-xl mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Account Suspended / Disabled</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your {config.roleName} account has been deactivated or suspended by the Local Bandi platform administrator.
          </p>
          <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
            For reactivation or review, please contact Master Admin Support at <span className="text-amber-400 font-bold">+91 8790729816</span> or email <span className="text-amber-400 font-bold">support@localbandi.com</span>.
          </div>
          <button
            onClick={() => logout()}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 3. APPROVAL STATUS CHECK (Pending Review)
  if (approvalStatus === 'pending' && !isMasterAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-blue-600/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center shadow-xl mb-4">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
            Application Under Review
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Pending Master Admin Approval</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your registration as a {config.roleName} has been submitted successfully. Master Admin is verifying your business & verification details.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Applicant Name:</span>
              <span className="text-white font-semibold">{user.displayName || userProfile?.name || 'Registered Partner'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Phone:</span>
              <span className="text-white font-semibold">{cleanPhone || 'Registered Phone'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="text-amber-400 font-bold">Pending Approval</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Check Approval Status
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. CROSS-ROLE MISMATCH CHECK (e.g. Customer trying to access Vendor or Delivery App)
  const isRoleAuthorized = config.allowedRoles.includes(normalizedRole) || isMasterAdmin;
  if (!isRoleAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-xl mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            Role Mismatch
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This application is reserved exclusively for <span className="text-white font-semibold">{config.roleName}s</span>. Your account is currently authenticated as a <span className="text-amber-400 font-bold uppercase">{normalizedRole}</span>.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Account:</span>
              <span className="text-white font-semibold">{user.email || user.phoneNumber || user.uid}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Your Role:</span>
              <span className="text-amber-400 font-bold uppercase">{normalizedRole}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Required Role:</span>
              <span className="text-emerald-400 font-bold uppercase">{config.roleName}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                window.location.href = normalizedRole === 'vendor' ? '/vendor.html' :
                  normalizedRole === 'delivery' ? '/delivery.html' :
                  normalizedRole === 'branch_admin' ? '/branch-admin.html' : '/';
              }}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 transition flex items-center justify-center gap-2"
            >
              Open Your Authorized App ({normalizedRole.toUpperCase()}) <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. MASTER ADMIN INSPECTION BANNER (When Master Admin inspects other apps)
  const isMasterAdminInspecting = isMasterAdmin && targetApp !== 'master_admin';

  return (
    <div className="w-full min-h-screen relative">
      {isMasterAdminInspecting && (
        <div className="bg-rose-700 text-white px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-[999990] shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-white" />
            <span>
              <strong>MASTER ADMIN OVERRIDE & AUDIT MODE:</strong> You are viewing the {config.name} with Super Admin privileges.
            </span>
          </div>
          <a
            href="/admin.html"
            className="px-3 py-1 rounded bg-white text-rose-800 font-bold text-[11px] hover:bg-rose-50 transition flex items-center gap-1"
          >
            Return to Master Admin <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}
      {children}
    </div>
  );
}
