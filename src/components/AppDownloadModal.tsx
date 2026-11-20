import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Download, ExternalLink, X, Check, Copy, 
  ShoppingBag, Store, Bike, Building2, ShieldAlert, Sparkles, 
  Layers, QrCode, Phone, Terminal, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';

const PUBLIC_BASE_URL = 'https://ais-pre-nrxv6weliaidu3roycbqtf-790133860415.asia-southeast1.run.app';

export interface AppEntry {
  id: string;
  name: string;
  shortName: string;
  role: string;
  packageId: string;
  playStoreUrl: string;
  path: string;
  publicUrl: string;
  manifestPath: string;
  manifestUrl: string;
  pwabuilderUrl: string;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

export const FIVE_APPS: AppEntry[] = [
  {
    id: 'customer',
    name: 'Customer App',
    shortName: 'LocalBandi Customer',
    role: 'General Users & Shoppers',
    packageId: 'com.localbandi.customer',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.customer',
    path: '/',
    publicUrl: `${PUBLIC_BASE_URL}/`,
    manifestPath: '/manifest.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/`)}`,
    themeColor: '#facc15',
    badgeBg: 'bg-amber-400/10 border-amber-400/30',
    badgeText: 'text-amber-400',
    icon: <ShoppingBag className="w-5 h-5" />,
    description: 'Hyperlocal customer ordering for groceries, food delivery, dairy, hospital OPD booking, and local services in Khammam & surrounding branches.',
    features: [
      'Phone OTP Sign-up & Login',
      'Auto GPS & 5 KM Branch Serviceability',
      'Live Order Tracking & Printable Shipping Labels',
      'UPI, Cards, Netbanking & Cash on Delivery'
    ]
  },
  {
    id: 'vendor',
    name: 'Vendor & Merchant App',
    shortName: 'LocalBandi Partner',
    role: 'Store Owners & Merchants',
    packageId: 'com.localbandi.vendor',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.vendor',
    path: '/vendor.html',
    publicUrl: `${PUBLIC_BASE_URL}/vendor.html`,
    manifestPath: '/manifest-vendor.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-vendor.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/vendor.html`)}`,
    themeColor: '#10b981',
    badgeBg: 'bg-emerald-400/10 border-emerald-400/30',
    badgeText: 'text-emerald-400',
    icon: <Store className="w-5 h-5" />,
    description: 'Dedicated merchant management terminal to publish catalogs, toggle stock, accept orders, generate bills, and review revenue settlements.',
    features: [
      'Instant Sound Alert for New Orders',
      'Real-time Order Accept / Reject / Prepare',
      'Print Official Tax Invoices & Shipping Labels',
      'Direct Settlement & Commission Ledgers'
    ]
  },
  {
    id: 'delivery',
    name: 'Delivery Partner App',
    shortName: 'LocalBandi Rider',
    role: 'Drivers & Fleet Riders',
    packageId: 'com.localbandi.delivery',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.delivery',
    path: '/delivery.html',
    publicUrl: `${PUBLIC_BASE_URL}/delivery.html`,
    manifestPath: '/manifest-delivery.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-delivery.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/delivery.html`)}`,
    themeColor: '#3b82f6',
    badgeBg: 'bg-blue-400/10 border-blue-400/30',
    badgeText: 'text-blue-400',
    icon: <Bike className="w-5 h-5" />,
    description: 'Driver dispatch console with GPS navigation, trip pool broadcast, pickup and delivery OTP verification, and daily tip & earnings ledger.',
    features: [
      'Online / Offline Duty Status Toggle',
      'Google Maps GPS Route Guidance',
      'Pickup & Delivery Verification via OTP',
      'Real-time Daily & Weekly Earnings Dashboard'
    ]
  },
  {
    id: 'branch',
    name: 'Branch Admin App',
    shortName: 'LocalBandi Branch',
    role: 'Regional Franchise & Branch Managers',
    packageId: 'com.localbandi.branch',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.branchadmin',
    path: '/branch-admin.html',
    publicUrl: `${PUBLIC_BASE_URL}/branch-admin.html`,
    manifestPath: '/manifest-branch.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-branch.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/branch-admin.html`)}`,
    themeColor: '#f59e0b',
    badgeBg: 'bg-orange-400/10 border-orange-400/30',
    badgeText: 'text-orange-400',
    icon: <Building2 className="w-5 h-5" />,
    description: 'Franchise and branch operations hub to configure service radius (5 KM, 7 KM, 10 KM), approve local vendors, and monitor branch riders.',
    features: [
      'Interactive Map Delivery Radius Geofencing',
      'Local Vendor & Driver Approvals',
      'Branch-level Order Logistics & Complaints',
      'Branch Revenue & Performance Analytics'
    ]
  },
  {
    id: 'admin',
    name: 'Master Admin Console',
    shortName: 'LocalBandi Admin',
    role: 'Super Admins & Founders',
    packageId: 'com.localbandi.admin',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.localbandi.masteradmin',
    path: '/admin.html',
    publicUrl: `${PUBLIC_BASE_URL}/admin.html`,
    manifestPath: '/manifest-admin.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-admin.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/admin.html`)}`,
    themeColor: '#ef4444',
    badgeBg: 'bg-rose-400/10 border-rose-400/30',
    badgeText: 'text-rose-400',
    icon: <ShieldAlert className="w-5 h-5" />,
    description: 'Executive command center with full-system governance, Cashfree payment gateway parameters, SMS templates, Firestore oversight, and AI diagnostics.',
    features: [
      'Centralized User, Vendor & Driver Database',
      'Payment Gateway & SMS Provider Configuration',
      'AI Monitoring & System Health Diagnostics',
      'Automated Backups & Audit Trails'
    ]
  }
];

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAppId?: string;
}

export default function AppDownloadModal({ isOpen, onClose, defaultAppId = 'customer' }: AppDownloadModalProps) {
  const [selectedAppId, setSelectedAppId] = useState<string>(defaultAppId);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentApp = FIVE_APPS.find(a => a.id === selectedAppId) || FIVE_APPS[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-left"
          id="app_download_modal"
        >
          {/* Header */}
          <div className="p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 font-mono">
                  Local Bandi Multi Services &bull; 5 Standalone Apps
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                Download Apps &amp; Android APK Packages
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tab Pills for all 5 Apps */}
          <div className="p-3 bg-slate-950/60 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
            {FIVE_APPS.map((app) => {
              const isSelected = app.id === selectedAppId;
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-[1.02]'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  <span className={isSelected ? 'text-slate-950' : 'text-slate-400'}>{app.icon}</span>
                  <span>{app.name}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Selected App Detailed Card */}
            <div className="bg-slate-950 border border-white/10 rounded-3xl p-6 relative overflow-hidden space-y-5">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${currentApp.badgeBg} ${currentApp.badgeText}`}>
                    {currentApp.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white uppercase tracking-tight">{currentApp.name}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${currentApp.badgeBg} ${currentApp.badgeText}`}>
                        {currentApp.role}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-amber-400 font-bold mt-0.5">{currentApp.packageId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentApp.publicUrl, currentApp.id)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink === currentApp.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === currentApp.id ? 'Copied' : 'Copy Web Link'}</span>
                  </button>

                  <a
                    href={currentApp.path}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-350 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>Launch App</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
                  </a>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentApp.description}
              </p>

              {/* Core Features Matrix */}
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">
                  Integrated Capabilities &amp; Features
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentApp.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-900/80 rounded-xl border border-white/5 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: 4 Installation / Download Options */}
              <div className="pt-2 border-t border-white/5 space-y-3">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  Google Play &amp; Installation Options
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Option 1: Official Google Play Store Link */}
                  <div className="p-4 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-2xl flex flex-col justify-between space-y-2 transition-all group">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Google Play</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase">Google Play Store</div>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono truncate">{currentApp.packageId}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <a
                        href={currentApp.playStoreUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider text-center"
                      >
                        Open Store
                      </a>
                      <button
                        onClick={() => handleCopy(currentApp.playStoreUrl, `play_${currentApp.id}`)}
                        className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border border-white/10"
                      >
                        {copiedLink === `play_${currentApp.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Option 2: PWABuilder 1-Click Cloud APK */}
                  <a
                    href={currentApp.pwabuilderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-2xl flex flex-col justify-between space-y-2 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Cloud Build</span>
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase">1-Click Cloud APK</div>
                      <p className="text-[9px] text-slate-400 mt-0.5">Generate signed APK / Play Store AAB on PWABuilder.</p>
                    </div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Generate Package &rarr;</span>
                  </a>

                  {/* Option 3: Instant Chrome Native Install */}
                  <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">PWA Native</span>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase">Instant Chrome Install</div>
                      <p className="text-[9px] text-slate-400 mt-0.5">Open URL in mobile Chrome &rarr; Tap Menu (⋮) &rarr; "Install App".</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400">No Store Required</span>
                  </div>

                  {/* Option 4: Terminal Bubblewrap CLI */}
                  <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">CLI TWA</span>
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase">Bubblewrap CLI</div>
                      <p className="text-[9px] text-slate-400 mt-0.5">Official Google CLI command for standalone Android Studio build.</p>
                    </div>
                    <button
                      onClick={() => handleCopy(`bubblewrap init --manifest="${currentApp.manifestUrl}"\nbubblewrap build`, `cli_${currentApp.id}`)}
                      className="text-[9px] font-mono font-bold text-amber-400 text-left hover:underline cursor-pointer"
                    >
                      {copiedLink === `cli_${currentApp.id}` ? 'Copied Command!' : 'Copy CLI Command'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Number Sign-up Notice & Shared Central Backend */}
            <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white uppercase tracking-tight">
                    Phone Number Authentication &amp; Shared Backend
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    All 5 applications authenticate via verified phone number (+91 XXXXXXXXXX) and synchronize in real-time through the single central Firebase Firestore database and Cashfree payment system.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-500">
              Local Bandi Multi Services &bull; Production Android Ready
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-350 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
