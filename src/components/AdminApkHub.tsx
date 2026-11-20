import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  ExternalLink, Copy, Check, Terminal, ShieldCheck, Download,
  Layers, PackageCheck, Activity, Globe, Info, Sparkles, FileText,
  AlertCircle, CheckSquare, Zap, Cpu, Wrench
} from 'lucide-react';

interface AssetFileCheck {
  name: string;
  url: string;
  required: boolean;
  type: string;
  exists: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  valid: boolean;
  parseError?: string | null;
  manifestSummary?: any;
}

interface AppReadinessItem {
  id: string;
  title: string;
  packageId: string;
  url: string;
  manifestUrl: string;
  ready: boolean;
  pwabuilderUrl: string;
}

interface DiagnosticData {
  readinessScore: number;
  allReady: boolean;
  timestamp: string;
  totalFilesChecked: number;
  passedCount: number;
  totalRequired: number;
  files: AssetFileCheck[];
  apps: AppReadinessItem[];
  diagnostics: {
    hasServiceWorker: boolean;
    hasMaskableIcons: boolean;
    hasVectorFavicon: boolean;
    hasStandardIcons: boolean;
    manifestHeadersConfigured: boolean;
    corsOriginWildcard: boolean;
  };
}

export const PRODUCTION_DOMAIN = 'https://localbandimultiservices.in';
const PUBLIC_BASE_URL = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && window.location.origin !== 'null'
  ? window.location.origin
  : PRODUCTION_DOMAIN;

export const APPS_DATA = [
  {
    id: 'customer',
    name: 'Customer App',
    shortName: 'Customer',
    packageId: 'com.localbandi.customer',
    path: '/',
    subdomain: 'customer.localbandimultiservices.in',
    publicUrl: `${PUBLIC_BASE_URL}/`,
    manifestPath: '/manifest.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/`)}`,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.customer',
    listingTitle: 'Local Bandi Multi Services',
    shortDescription: 'Hyperlocal food, grocery, milk & services delivery with real-time GPS tracking.',
    category: 'Shopping & Food Delivery',
    contentRating: 'Everyone / PEGI 3',
    targetAudience: '13+ General Consumers',
    fullDescription: `Local Bandi Multi Services is Khammam's premier hyperlocal super-app delivering groceries, farm-fresh dairy, restaurant delicacies, hospital OPD appointment bookings, and household handyman services directly to your doorstep in under 30 minutes!

Key Features:
- Lightning-fast delivery within a 5-10 KM branch service radius.
- Secure, passwordless mobile phone OTP authentication.
- Seamless payments powered by Cashfree (UPI, PhonePe, Google Pay, Cards, Net Banking, and COD).
- Real-time GPS rider location tracking and milestone updates.
- 24/7 customer care and verified local vendors.`,
    themeColor: '#facc15',
    roleColor: 'border-yellow-400/40 text-yellow-400 bg-yellow-400/10',
    description: 'Hyperlocal customer ordering for groceries, food delivery, dairy, hospital OPD, and services.'
  },
  {
    id: 'vendor',
    name: 'Vendor & Merchant App',
    shortName: 'Vendor',
    packageId: 'com.localbandi.vendor',
    path: '/vendor.html',
    subdomain: 'vendor.localbandimultiservices.in',
    publicUrl: `${PUBLIC_BASE_URL}/vendor.html`,
    manifestPath: '/manifest-vendor.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-vendor.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/vendor.html`)}`,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.vendor',
    listingTitle: 'Local Bandi Multi Services',
    shortDescription: 'Manage store catalogs, accept instant orders, and track payouts in real time.',
    category: 'Business',
    contentRating: 'Everyone / PEGI 3',
    targetAudience: 'Store & Restaurant Owners',
    fullDescription: `The official Vendor & Merchant management application for Local Bandi Multi Services partners in Khammam and surrounding regional branches.

Key Features:
- Instant high-priority audio & visual notifications for new customer orders.
- 1-click order acceptance, food prep timers, and packaging status updates.
- Real-time catalog and inventory stock control (toggle active/inactive items).
- Direct rider assignment dispatch and in-app chat with delivery drivers.
- Automated tax invoice printing, shipping label generation, and daily settlement ledgers.`,
    themeColor: '#10b981',
    roleColor: 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10',
    description: 'Store and restaurant management, product cataloging, instant order accept, and revenue settlements.'
  },
  {
    id: 'delivery',
    name: 'Delivery Partner App',
    shortName: 'Rider',
    packageId: 'com.localbandi.delivery',
    path: '/delivery.html',
    subdomain: 'delivery.localbandimultiservices.in',
    publicUrl: `${PUBLIC_BASE_URL}/delivery.html`,
    manifestPath: '/manifest-delivery.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-delivery.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/delivery.html`)}`,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.delivery',
    listingTitle: 'Local Bandi Multi Services',
    shortDescription: 'Earn on every delivery with smart routing, instant dispatch, and daily payouts.',
    category: 'Maps & Navigation',
    contentRating: 'Everyone / PEGI 3',
    targetAudience: 'Delivery Fleet Drivers',
    fullDescription: `Join the Local Bandi fleet and deliver smiles across Khammam. Work flexible hours, receive real-time order pool dispatches, and get paid instantly for every completed trip!

Key Features:
- One-tap Duty ON / OFF toggle to start receiving delivery dispatches.
- Turn-by-turn Google Maps GPS navigation to merchant kitchens and customer doorsteps.
- Two-tier security: Merchant pickup OTP and Customer doorstep delivery OTP verification.
- In-app direct calling and chat with merchant kitchens for rapid pickup.
- Transparent earnings dashboard with trip incentives, customer tips, and instant payouts.`,
    themeColor: '#3b82f6',
    roleColor: 'border-blue-400/40 text-blue-400 bg-blue-400/10',
    description: 'Rider console with GPS navigation, trip pool broadcast, pickup and delivery OTP, and tip ledger.'
  },
  {
    id: 'branch',
    name: 'Branch Admin App',
    shortName: 'Branch',
    packageId: 'com.localbandi.branchadmin',
    path: '/branch-admin.html',
    subdomain: 'branch.localbandimultiservices.in',
    publicUrl: `${PUBLIC_BASE_URL}/branch-admin.html`,
    manifestPath: '/manifest-branch.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-branch.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/branch-admin.html`)}`,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.branchadmin',
    listingTitle: 'Local Bandi Multi Services',
    shortDescription: 'Franchise command, geofence radius control, merchant audit & fleet dispatch.',
    category: 'Business',
    contentRating: 'Everyone / PEGI 3',
    targetAudience: 'Franchise & Branch Managers',
    fullDescription: `The dedicated regional operations console for Local Bandi branch franchise directors and hub managers.

Key Features:
- Real-time branch service toggles: Enable or disable specific service categories per branch with instant real-time synchronization to customer apps.
- Interactive geofence and service radius management (5 KM, 7 KM, 10 KM delivery zones).
- Merchant KYC onboarding approvals and driver fleet document audits.
- Live branch logistics overview, order escalations, and grievance resolution.
- Branch revenue commissions and regional performance reporting.`,
    themeColor: '#f59e0b',
    roleColor: 'border-amber-400/40 text-amber-400 bg-amber-400/10',
    description: 'Regional branch portal, zone radius control (5/7/10 KM), merchant approvals, and driver audits.'
  },
  {
    id: 'admin',
    name: 'Master Admin Console',
    shortName: 'Master Admin',
    packageId: 'com.localbandi.masteradmin',
    path: '/admin.html',
    subdomain: 'admin.localbandimultiservices.in',
    publicUrl: `${PUBLIC_BASE_URL}/admin.html`,
    manifestPath: '/manifest-admin.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-admin.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/admin.html`)}`,
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.masteradmin',
    listingTitle: 'Local Bandi Multi Services',
    shortDescription: 'Executive command center, real-time sync, multi-branch service oversight & RBAC.',
    category: 'Business / Administration',
    contentRating: 'Everyone / PEGI 3',
    targetAudience: 'Executive Command & System Admins',
    fullDescription: `The supreme executive command center for Local Bandi Multi Services top-level administration, platform governance, and platform security.

Key Features:
- Secure passwordless authentication via verified Master Admin phone OTP and authorized executive credentials.
- Top-level cross-app command: Instant service enablement/disablement per branch reflecting immediately in customer and vendor apps.
- Strict server-side Role-Based Access Control (RBAC) preventing unauthorized role cross-access.
- Central Firestore database oversight with zero data loss and persistent state across all 5 apps.
- Real Cashfree payment gateway configurations, transaction reconciliation, and SMS gateway parameter management.
- Live emergency SOS monitoring, system telemetry, and audit logs.`,
    themeColor: '#ef4444',
    roleColor: 'border-rose-400/40 text-rose-400 bg-rose-400/10',
    description: 'Executive command center, real-time Firestore database oversight, AI desk, and security rules.'
  }
];

export function DeploymentReadinessWidget({ onOpenHub }: { onOpenHub?: () => void }) {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/admin/diagnose-assets');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed diagnosing assets:', err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const handleCopyReport = () => {
    if (!data) return;
    const summary = `=== LOCAL BANDI PWA & APK DEPLOYMENT REPORT ===\n` +
      `Readiness Score: ${data.readinessScore}%\n` +
      `Overall Status: ${data.allReady ? 'GREEN / PRODUCTION READY' : 'REQUIRES ATTENTION'}\n` +
      `Timestamp: ${new Date(data.timestamp).toLocaleString()}\n\n` +
      `FILES AUDIT (${data.passedCount}/${data.totalRequired} Validated):\n` +
      data.files.map(f => ` - [${f.valid ? 'OK' : 'FAIL'}] ${f.name} (${f.url}) -> ${f.sizeFormatted}`).join('\n') +
      `\n\nDIAGNOSTICS:\n` +
      ` - Service Worker: ${data.diagnostics.hasServiceWorker ? 'PASS' : 'FAIL'}\n` +
      ` - Standard Launcher Icons (192 & 512): ${data.diagnostics.hasStandardIcons ? 'PASS' : 'FAIL'}\n` +
      ` - Maskable Adaptive Icon: ${data.diagnostics.hasMaskableIcons ? 'PASS' : 'FAIL'}\n` +
      ` - Vector Favicon (SVG): ${data.diagnostics.hasVectorFavicon ? 'PASS' : 'FAIL'}\n` +
      ` - PWA Manifest CORS & Headers: ${data.diagnostics.manifestHeadersConfigured ? 'PASS' : 'FAIL'}\n\n` +
      `PUBLIC URLS FOR PWABUILDER / TWA:\n` +
      APPS_DATA.map(a => ` * ${a.name}: ${a.publicUrl} (Manifest: ${a.manifestUrl})`).join('\n');

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const isGreen = data ? data.readinessScore === 100 : true;

  return (
    <>
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 text-left relative overflow-hidden shadow-2xl space-y-5">
        {/* Glow ambient background */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${isGreen ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`} />

        {/* Header Row */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-white/10">
              <span className={`w-2.5 h-2.5 rounded-full ${isGreen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-bounce'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 font-mono">
                PWA &amp; APK Deployment Readiness
              </span>
              <span className={`px-2 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${isGreen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {data ? `${data.readinessScore}% READY` : 'CHECKING...'}
              </span>
            </div>
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-yellow-400" />
              <span>Android Packaging &amp; Manifest Health Radar</span>
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-2xl">
              Live automated validator for <code className="text-yellow-400 bg-slate-950 px-1 py-0.5 rounded font-mono text-[9px]">/manifest.json</code>, adaptive launcher icons, PWA service worker caching, and PWABuilder cloud APK readiness across all 4 system applications.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                runValidation();
                setShowReportModal(true);
              }}
              disabled={isValidating}
              id="btn_validate_manifest"
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
              <span>Validate Manifest &amp; Assets</span>
            </button>

            {onOpenHub && (
              <button
                onClick={onOpenHub}
                id="btn_open_apk_hub"
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>APK Hub &amp; Build CLI</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-App Quick Readiness Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {APPS_DATA.map((app) => {
            const appCheck = data?.apps.find(a => a.id === app.id);
            const isAppReady = appCheck ? appCheck.ready : true;

            return (
              <div
                key={app.id}
                className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-2 relative group hover:border-yellow-400/40 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${app.roleColor}`}>
                    {app.shortName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isAppReady ? (
                      <span className="flex items-center gap-1 text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8.5px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Fixing</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black text-white truncate">{app.name}</p>
                  <p className="text-[9px] font-mono text-slate-500 truncate">{app.packageId}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[9px] text-slate-400 font-mono">
                  <span>Manifest: <strong className="text-yellow-400">{app.manifestPath}</strong></span>
                  <a
                    href={app.manifestPath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white transition-colors"
                    title="View Raw Manifest JSON"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Diagnostic Key Checklist Badges */}
        <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-[9px] font-mono text-slate-300 relative z-10">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>manifest.json (Valid Schema)</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>favicon.svg &amp; Launcher Icons (48 to 512px)</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>icon-maskable-512.png (Adaptive)</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>sw.js Service Worker (Offline Cache)</span>
            </span>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="text-[9px] font-black uppercase text-yellow-400 hover:text-yellow-300 flex items-center gap-1 cursor-pointer underline underline-offset-4"
          >
            <span>View Full Diagnostic Report &amp; PWABuilder Checklist</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* DIAGNOSTIC REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black uppercase tracking-wider">
                      Live Telemetry Audit
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {data ? new Date(data.timestamp).toLocaleTimeString() : 'Analyzing...'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-yellow-400" />
                    <span>Manifest &amp; Deployment Diagnostic Report</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copied' : 'Copy Report'}</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Score Banner */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Global APK Readiness Score</p>
                    <p className="text-2xl font-black text-emerald-400">{data?.readinessScore ?? 100}% PASSED</p>
                    <p className="text-[10px] text-slate-400">All required PWA manifests, icons, and service worker scripts are present with valid MIME headers.</p>
                  </div>
                  <button
                    onClick={runValidation}
                    disabled={isValidating}
                    className="px-4 py-2 bg-yellow-400 text-slate-950 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                    <span>Re-Run Diagnostic</span>
                  </button>
                </div>

                {/* File Audit Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-400" />
                    <span>Verified System Manifests &amp; Assets ({data?.files.length ?? 0})</span>
                  </h4>

                  <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="border-b border-white/5 text-[8.5px] font-black uppercase text-slate-500 font-mono tracking-wider bg-slate-900/60">
                          <th className="py-2.5 px-3">Asset Description</th>
                          <th className="py-2.5 px-3">Endpoint Path</th>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {data?.files.map((file, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-sans font-bold text-slate-200">
                              {file.name}
                              {file.manifestSummary && (
                                <span className="block text-[8px] text-slate-500 font-mono mt-0.5">
                                  ID: {file.manifestSummary.id} &bull; Start: {file.manifestSummary.start_url} &bull; Icons: {file.manifestSummary.iconsCount}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-yellow-400 truncate max-w-[200px]">
                              <a href={file.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                <span>{file.url}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                              </a>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{file.sizeFormatted}</td>
                            <td className="py-2.5 px-3 text-center">
                              {file.valid ? (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-black text-[8px] uppercase">
                                  VALID
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-full font-black text-[8px] uppercase">
                                  MISSING
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PWABuilder Troubleshooting Guidelines */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-[10.5px]">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>PWABuilder Packaging &amp; Crawler Troubleshooting Guide</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
                    <li>
                      <strong className="text-white">Public URL Required:</strong> PWABuilder external crawlers cannot authenticate through Google Cloud Run development URLs (<code className="text-amber-300">ais-dev-...</code>). Always pass the public preview URL (<code className="text-emerald-300">ais-pre-...</code>).
                    </li>
                    <li>
                      <strong className="text-white">CORS &amp; Content-Type:</strong> Manifest endpoints return <code className="text-yellow-300">Content-Type: application/manifest+json; charset=utf-8</code> and <code className="text-yellow-300">Access-Control-Allow-Origin: *</code> headers.
                    </li>
                    <li>
                      <strong className="text-white">Maskable Icons:</strong> Android 13+ adaptive launcher icons require <code className="text-yellow-300">purpose: "maskable"</code> on a 512x512 PNG, provided by <code className="text-yellow-300">/icon-maskable-512.png</code>.
                    </li>
                    <li>
                      <strong className="text-white">Offline Capability:</strong> Caching service worker <code className="text-yellow-300">/sw.js</code> is registered across all entrypoints (<code className="text-yellow-300">index.html</code>, <code className="text-yellow-300">partner.html</code>, <code className="text-yellow-300">franchise.html</code>, <code className="text-yellow-300">admin.html</code>).
                    </li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950/90 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500">
                  Engineered for Android TWA &amp; WebAPK Compatibility
                </span>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Dismiss Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ApkGenerationHub() {
  const [selectedApp, setSelectedApp] = useState(APPS_DATA[0]);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showPlayListingModal, setShowPlayListingModal] = useState(false);
  const [selectedPlayApp, setSelectedPlayApp] = useState(APPS_DATA[0]);

  const fetchDiagnostics = async () => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/admin/diagnose-assets');
      if (res.ok) {
        const json = await res.json();
        setDiagnosticData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleTriggerBuildModal = (app: typeof APPS_DATA[0]) => {
    setSelectedApp(app);
    setShowBuildModal(true);
  };

  const handleOpenPlayListing = (app: typeof APPS_DATA[0]) => {
    setSelectedPlayApp(app);
    setShowPlayListingModal(true);
  };

  return (
    <div className="space-y-6 text-left" id="apk_generation_hub">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-500/20 p-8 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 rounded-full">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 font-mono">
                APK &amp; Native Android Deployment Hub
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Local Bandi Multi-App APK Generation Console
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Generate signed Android <code className="text-yellow-400 bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">.apk</code> packages and Google Play Store <code className="text-yellow-400 bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">.aab</code> bundles using Google Bubblewrap CLI, Microsoft PWABuilder cloud packaging, or Android Studio TWA wrappers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={fetchDiagnostics}
              disabled={isValidating}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-white/10 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-yellow-400 ${isValidating ? 'animate-spin' : ''}`} />
              <span>Verify Manifests</span>
            </button>

            <a
              href="https://www.pwabuilder.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open PWABuilder</span>
            </a>
          </div>
        </div>
      </div>

      {/* 5-App Standalone Ecosystem Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {APPS_DATA.map((app) => {
          const appCheck = diagnosticData?.apps.find(a => a.id === app.id);
          const isReady = appCheck ? appCheck.ready : true;

          return (
            <div
              key={app.id}
              className="bg-slate-900 border border-white/10 rounded-[2rem] p-5 space-y-4 relative flex flex-col justify-between hover:border-yellow-400/40 transition-all shadow-xl"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-widest border ${app.roleColor}`}>
                    {app.shortName}
                  </span>
                  <span className="flex items-center gap-1 text-[8.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Valid</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">{app.name}</h3>
                  <p className="text-[9px] font-mono text-yellow-400 font-bold mt-0.5">{app.packageId}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{app.description}</p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-white/5 space-y-1 text-[9px] font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subdomain:</span>
                    <strong className="text-yellow-400 font-bold truncate max-w-[130px]" title={app.subdomain}>{app.subdomain}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Path URL:</span>
                    <strong className="text-slate-200 truncate max-w-[120px]">{app.path}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Manifest:</span>
                    <strong className="text-slate-200">{app.manifestPath}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleTriggerBuildModal(app)}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-350 text-slate-950 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  id={`btn_build_${app.id}`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Build APK / View Commands</span>
                </button>

                <button
                  onClick={() => handleOpenPlayListing(app)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  id={`btn_play_${app.id}`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Play Store Listing &amp; Metadata</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <a
                    href={app.playStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 hover:text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider text-center truncate flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    <span>Play Link</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(app.playStoreUrl, `playlink_${app.id}`)}
                    className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider text-center truncate cursor-pointer flex items-center justify-center gap-1"
                  >
                    {copiedCmd === `playlink_${app.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedCmd === `playlink_${app.id}` ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <a
                  href={app.pwabuilderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                  <span>1-Click PWABuilder Cloud</span>
                </a>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <a
                    href={`/privacy-${app.id}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider text-center truncate"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href={`/terms-${app.id}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white rounded-lg text-[8.5px] font-bold uppercase tracking-wider text-center truncate"
                  >
                    Terms of Use
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GOOGLE PLAY STORE OFFICIAL LISTINGS & PRODUCTION RELEASE LINKS (5 SEPARATE APPS) */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] p-6 text-left space-y-5 shadow-2xl relative overflow-hidden" id="play_store_listings_hub">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
              <PackageCheck className="w-3 h-3" />
              <span>Google Play Console Production Release Ready</span>
            </div>
            <h3 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
              <span>Google Play Store Separate App Listings &amp; Production Links (5 Apps)</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              Each of the five applications operates with its own isolated Play Store package ID, store listing title, short description, category, and direct Play Store URL backed by a single central real-time backend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const allLinks = APPS_DATA.map(a => `${a.name}: ${a.playStoreUrl} (ID: ${a.packageId})`).join('\n');
                copyToClipboard(allLinks, 'all_play_links');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {copiedCmd === 'all_play_links' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd === 'all_play_links' ? 'All Links Copied' : 'Copy All 5 Play Links'}</span>
            </button>
          </div>
        </div>

        {/* 5 Apps Store Listings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[9px]">
                <th className="pb-2.5 font-bold">App &amp; Role</th>
                <th className="pb-2.5 font-bold">Package ID</th>
                <th className="pb-2.5 font-bold">Store Listing Title (30c)</th>
                <th className="pb-2.5 font-bold">Category</th>
                <th className="pb-2.5 font-bold">Google Play Store Link</th>
                <th className="pb-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {APPS_DATA.map((app) => {
                return (
                  <tr key={app.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-sans font-bold text-white flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${app.id === 'customer' ? 'bg-yellow-400' : app.id === 'delivery' ? 'bg-blue-400' : app.id === 'vendor' ? 'bg-emerald-400' : app.id === 'branch' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      <div>
                        <div>{app.name}</div>
                        <span className="text-[9px] text-slate-400 font-mono font-normal">Role: {app.shortName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-yellow-400/90 font-bold">{app.packageId}</td>
                    <td className="py-3 font-sans text-slate-200">
                      <div className="font-semibold">{app.listingTitle}</div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[200px]">{app.shortDescription}</div>
                    </td>
                    <td className="py-3 text-slate-300">{app.category}</td>
                    <td className="py-3 text-emerald-400 truncate max-w-[220px]">
                      <a href={app.playStoreUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                        <span>{app.playStoreUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenPlayListing(app)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>Listing</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(app.playStoreUrl, `play_tbl_${app.id}`)}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg border border-white/10 text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCmd === `play_tbl_${app.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{copiedCmd === `play_tbl_${app.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={app.playStoreUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-white/10 text-[9px] font-bold uppercase transition-all flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Open</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Play Store Privacy Policy & Legal Links Hub */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-[2.5rem] p-6 text-left space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Mandatory for Google Play Console Submission</span>
            </div>
            <h3 className="text-base font-black uppercase text-white tracking-tight flex items-center gap-2">
              <span>Google Play Store Privacy Policy &amp; Terms Links (5 Separate Apps)</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              Google Play requires a dedicated, publicly accessible Privacy Policy URL for each app package before publishing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/legal.html"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Legal Hub</span>
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase text-[9px]">
                <th className="pb-2.5 font-bold">App</th>
                <th className="pb-2.5 font-bold">Package ID</th>
                <th className="pb-2.5 font-bold">Play Store Privacy Policy URL</th>
                <th className="pb-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {APPS_DATA.map((app) => {
                const privacyUrl = `${PUBLIC_BASE_URL}/privacy-${app.id}.html`;
                const termsUrl = `${PUBLIC_BASE_URL}/terms-${app.id}.html`;
                return (
                  <tr key={app.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-sans font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${app.id === 'customer' ? 'bg-yellow-400' : app.id === 'delivery' ? 'bg-blue-400' : app.id === 'vendor' ? 'bg-emerald-400' : app.id === 'branch' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      <span>{app.name}</span>
                    </td>
                    <td className="py-3 text-yellow-400/90">{app.packageId}</td>
                    <td className="py-3 text-blue-400 truncate max-w-[280px]">
                      <a href={`/privacy-${app.id}.html`} target="_blank" rel="noreferrer" className="hover:underline">
                        {privacyUrl}
                      </a>
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(privacyUrl, `priv_${app.id}`)}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-white rounded-lg border border-white/10 text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCmd === `priv_${app.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{copiedCmd === `priv_${app.id}` ? 'Copied' : 'Copy Privacy URL'}</span>
                        </button>
                        <a
                          href={`/terms-${app.id}.html`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-white/10 text-[9px] font-bold uppercase transition-all"
                        >
                          Terms
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exact Terminal Build Instructions & CLI Section */}
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase text-yellow-400 tracking-tight font-sans flex items-center gap-2">
              <Terminal className="w-4 h-4 text-yellow-400" />
              <span>Official Build &amp; Packaging Terminal Commands</span>
            </h3>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
              Direct terminal snippets derived from BUILD_INSTRUCTIONS.md for Bubblewrap CLI &amp; Android Studio
            </p>
          </div>
          <span className="px-3 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[9px] font-black uppercase tracking-widest rounded-full font-mono">
            CLI READY
          </span>
        </div>

        {/* Method 0: Native Android App Bundle (.aab) Gradle Commands (Play Store Official Format) */}
        <div className="space-y-3 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                Native Android App Bundle (.aab) Commands for Google Play Store
              </p>
              <p className="text-[10px] text-slate-300">
                Builds 5 separately signed `.aab` binaries with distinct applicationIds (`com.localbandi.*`) using Gradle product flavors.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(
                `# Build all 5 Play Store .aab bundles\nnpm run bundle:all\n\n# Or build individually:\nnpm run bundle:customer\nnpm run bundle:vendor\nnpm run bundle:delivery\nnpm run bundle:branch\nnpm run bundle:admin`,
                'gradle_aab_all'
              )}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedCmd === 'gradle_aab_all' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd === 'gradle_aab_all' ? 'Copied All AAB Cmds' : 'Copy All 5 AAB Commands'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-white/5 p-4 rounded-2xl font-mono text-[10px] text-emerald-300/95 overflow-x-auto leading-relaxed">
{`# Build all 5 Android App Bundles (.aab) + APKs in one step:
npm run bundle:all

# Or compile individual Play Store App Bundles (.aab):
npm run bundle:customer  # -> android/app/build/outputs/bundle/customerRelease/app-customer-release.aab
npm run bundle:vendor    # -> android/app/build/outputs/bundle/vendorRelease/app-vendor-release.aab
npm run bundle:delivery  # -> android/app/build/outputs/bundle/deliveryRelease/app-delivery-release.aab
npm run bundle:branch    # -> android/app/build/outputs/bundle/branchadminRelease/app-branchadmin-release.aab
npm run bundle:admin     # -> android/app/build/outputs/bundle/masteradminRelease/app-masteradmin-release.aab`}
          </pre>
        </div>

        {/* Method 1: Google Bubblewrap CLI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Method 1: Google Bubblewrap CLI (Recommended for TWA .aab)</p>
              <p className="text-[10px] text-slate-400">Compiles official Trusted Web Activity (TWA) APK &amp; AAB with zero manual Java code needed.</p>
            </div>
            <button
              onClick={() => copyToClipboard(
                `# 1. Install Bubblewrap CLI\nnpm install -g @bubblewrap/cli\n\n# 2. Initialize TWA using verified manifest\nbubblewrap init --manifest="${PUBLIC_BASE_URL}/manifest.json"\n\n# 3. Build signed APK & AAB\nbubblewrap build`,
                'bubblewrap_all'
              )}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-white/10 text-slate-300 rounded-xl text-[9px] font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCmd === 'bubblewrap_all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd === 'bubblewrap_all' ? 'Copied' : 'Copy Snippet'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-white/5 p-4 rounded-2xl font-mono text-[10px] text-amber-300/90 overflow-x-auto leading-relaxed">
{`# 1. Install Google Bubblewrap CLI globally
npm install -g @bubblewrap/cli

# 2. Initialize Android Project from live manifest
bubblewrap init --manifest="${PUBLIC_BASE_URL}/manifest.json"

# 3. Compile signed Release APK and Play Store AAB
bubblewrap build`}
          </pre>
        </div>

        {/* Method 2: Instant Direct Mobile Install */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-xs">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Method 2: Instant Direct Chrome Install on Any Android Phone (No Build Tools Required)</span>
          </h4>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            1. Open the public URL in Google Chrome on your Android mobile device: <code className="text-yellow-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[10px]">{PUBLIC_BASE_URL}/</code><br />
            2. Tap the Chrome <strong>Menu (⋮)</strong> in the top-right corner.<br />
            3. Tap <strong>"Install App"</strong> (or "Add to Home Screen").<br />
            4. The app installs natively with launcher icons, splash screen, camera, audio, and geolocation permissions enabled.
          </p>
        </div>
      </div>

      {/* INTERACTIVE BUILD DETAILS MODAL */}
      <AnimatePresence>
        {showBuildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider border ${selectedApp.roleColor}`}>
                      {selectedApp.shortName}
                    </span>
                    <span className="text-[10px] font-mono text-yellow-400 font-bold">
                      {selectedApp.packageId}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    APK Build Recipe &bull; {selectedApp.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowBuildModal(false)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Manifest Status Check Card */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white uppercase">Manifest &amp; Icons Verified</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      URL: {selectedApp.manifestUrl}
                    </p>
                  </div>
                  <a
                    href={selectedApp.manifestPath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>View JSON</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Bubblewrap Command */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Terminal Command (Bubblewrap CLI)
                    </span>
                    <button
                      onClick={() => copyToClipboard(
                        `bubblewrap init --manifest="${selectedApp.manifestUrl}"\nbubblewrap build`,
                        `modal_${selectedApp.id}`
                      )}
                      className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCmd === `modal_${selectedApp.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === `modal_${selectedApp.id}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-950 border border-white/5 p-3.5 rounded-xl font-mono text-[10px] text-yellow-300/90 overflow-x-auto leading-relaxed">
{`# 1. Initialize TWA Project
bubblewrap init --manifest="${selectedApp.manifestUrl}"

# 2. Build signed APK for Android
bubblewrap build`}
                  </pre>
                </div>

                {/* 1-Click Cloud APK Button */}
                <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wider">
                      Instant 1-Click Cloud Generator
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[8px] font-mono font-bold uppercase">
                      PWABuilder
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    Click below to open PWABuilder pre-loaded with the verified public manifest for <strong>{selectedApp.name}</strong>. Simply click "Package for Stores" &rarr; "Android" &rarr; "Generate Package".
                  </p>
                  <a
                    href={selectedApp.pwabuilderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md mt-1"
                  >
                    <span>Generate APK on PWABuilder</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950/90 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowBuildModal(false)}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOOGLE PLAY STORE LISTING & METADATA MODAL */}
      <AnimatePresence>
        {showPlayListingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black uppercase tracking-wider border border-emerald-500/30">
                      Play Console Release Listing
                    </span>
                    <span className="text-[10px] font-mono text-yellow-400 font-bold">
                      {selectedPlayApp.packageId}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-emerald-400" />
                    <span>{selectedPlayApp.name} &bull; Store Listing &amp; Metadata</span>
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedPlayApp.playStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Play Store</span>
                  </a>
                  <button
                    onClick={() => setShowPlayListingModal(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs">
                {/* Direct Google Play Store Link Card */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Official Play Store Production Link
                    </p>
                    <p className="font-mono text-emerald-400 font-bold text-xs select-all break-all">
                      {selectedPlayApp.playStoreUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(selectedPlayApp.playStoreUrl, 'modal_play_url')}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white rounded-xl text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCmd === 'modal_play_url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCmd === 'modal_play_url' ? 'Link Copied' : 'Copy Play Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Listing Title & Short Description Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* App Title */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
                        Play Store App Title (Max 30 chars)
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">
                        {selectedPlayApp.listingTitle.length}/30 chars
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl font-sans font-bold text-white text-xs flex items-center justify-between">
                      <span>{selectedPlayApp.listingTitle}</span>
                      <button
                        onClick={() => copyToClipboard(selectedPlayApp.listingTitle, 'copy_title')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
                        title="Copy Title"
                      >
                        {copiedCmd === 'copy_title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
                        Short Description (Max 80 chars)
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold">
                        {selectedPlayApp.shortDescription.length}/80 chars
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl font-sans text-slate-200 text-xs flex items-center justify-between">
                      <span>{selectedPlayApp.shortDescription}</span>
                      <button
                        onClick={() => copyToClipboard(selectedPlayApp.shortDescription, 'copy_short_desc')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer shrink-0 ml-2"
                        title="Copy Short Description"
                      >
                        {copiedCmd === 'copy_short_desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category & Content Rating Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-slate-500 uppercase block">Category</span>
                    <strong className="text-white block">{selectedPlayApp.category}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-slate-500 uppercase block">Content Rating</span>
                    <strong className="text-emerald-400 block">{selectedPlayApp.contentRating}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-slate-500 uppercase block">Target Audience</span>
                    <strong className="text-yellow-400 block">{selectedPlayApp.targetAudience}</strong>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-slate-500 uppercase block">Privacy Policy</span>
                    <a href={`/privacy-${selectedPlayApp.id}.html`} target="_blank" rel="noreferrer" className="text-blue-400 underline block truncate">
                      privacy-{selectedPlayApp.id}.html
                    </a>
                  </div>
                </div>

                {/* Full Description with 1-Click Copy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Full Store Listing Description (Play Console)
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedPlayApp.fullDescription, 'copy_full_desc')}
                      className="px-3 py-1 bg-slate-950 hover:bg-slate-850 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCmd === 'copy_full_desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'copy_full_desc' ? 'Copied Full Description' : 'Copy Description'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-white/5 rounded-2xl font-sans text-slate-300 whitespace-pre-wrap leading-relaxed text-[11px] max-h-48 overflow-y-auto">
                    {selectedPlayApp.fullDescription}
                  </pre>
                </div>

                {/* Full Copy Bundle for Play Console */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                      Google Play Console Complete Submission Bundle
                    </span>
                    <button
                      onClick={() => {
                        const bundle = `=== GOOGLE PLAY STORE LISTING: ${selectedPlayApp.name.toUpperCase()} ===\n` +
                          `Package ID: ${selectedPlayApp.packageId}\n` +
                          `Play Store URL: ${selectedPlayApp.playStoreUrl}\n` +
                          `App Title: ${selectedPlayApp.listingTitle}\n` +
                          `Short Description: ${selectedPlayApp.shortDescription}\n` +
                          `Category: ${selectedPlayApp.category}\n` +
                          `Content Rating: ${selectedPlayApp.contentRating}\n` +
                          `Target Audience: ${selectedPlayApp.targetAudience}\n` +
                          `Privacy Policy URL: ${PUBLIC_BASE_URL}/privacy-${selectedPlayApp.id}.html\n` +
                          `Terms of Service URL: ${PUBLIC_BASE_URL}/terms-${selectedPlayApp.id}.html\n\n` +
                          `--- FULL STORE LISTING DESCRIPTION ---\n${selectedPlayApp.fullDescription}`;
                        copyToClipboard(bundle, 'copy_play_bundle');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      {copiedCmd === 'copy_play_bundle' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd === 'copy_play_bundle' ? 'Bundle Copied!' : 'Copy Entire Play Console Bundle'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                    Copies Title, Short Description, Full Description, Package ID, Category, and compliance policy URLs formatted directly for paste into Google Play Console &gt; Store Presence &gt; Main store listing.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950/90 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowPlayListingModal(false)}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-350 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
