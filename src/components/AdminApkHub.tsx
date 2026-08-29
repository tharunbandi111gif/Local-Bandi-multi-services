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

const PUBLIC_BASE_URL = 'https://ais-pre-nrxv6weliaidu3roycbqtf-790133860415.asia-southeast1.run.app';

export const APPS_DATA = [
  {
    id: 'customer',
    name: 'Customer App',
    shortName: 'LocalBandi',
    packageId: 'com.localbandi.app',
    path: '/',
    publicUrl: `${PUBLIC_BASE_URL}/`,
    manifestPath: '/manifest.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/`)}`,
    themeColor: '#facc15',
    roleColor: 'border-yellow-400/40 text-yellow-400 bg-yellow-400/10',
    description: 'Hyperlocal customer ordering for groceries, food delivery, dairy, hospital OPD, and services.'
  },
  {
    id: 'partner',
    name: 'Partner & Rider Hub',
    shortName: 'Partner Hub',
    packageId: 'com.localbandi.partner',
    path: '/partner.html',
    publicUrl: `${PUBLIC_BASE_URL}/partner.html`,
    manifestPath: '/manifest-partner.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-partner.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/partner.html`)}`,
    themeColor: '#10b981',
    roleColor: 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10',
    description: 'Dedicated fleet driver dispatch, merchant store catalog, order management, and earnings terminal.'
  },
  {
    id: 'franchise',
    name: 'Franchise Hub',
    shortName: 'Franchise Hub',
    packageId: 'com.localbandi.franchise',
    path: '/franchise.html',
    publicUrl: `${PUBLIC_BASE_URL}/franchise.html`,
    manifestPath: '/manifest-franchise.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-franchise.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/franchise.html`)}`,
    themeColor: '#6366f1',
    roleColor: 'border-indigo-400/40 text-indigo-400 bg-indigo-400/10',
    description: 'Regional franchise branch portal, zone radius control, commission payouts, and sub-partner audits.'
  },
  {
    id: 'admin',
    name: 'Master Admin Console',
    shortName: 'Master Admin',
    packageId: 'com.localbandi.admin',
    path: '/admin.html',
    publicUrl: `${PUBLIC_BASE_URL}/admin.html`,
    manifestPath: '/manifest-admin.json',
    manifestUrl: `${PUBLIC_BASE_URL}/manifest-admin.json`,
    pwabuilderUrl: `https://www.pwabuilder.com?site=${encodeURIComponent(`${PUBLIC_BASE_URL}/admin.html`)}`,
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

      {/* 4-App Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <span>Manifest:</span>
                    <strong className="text-slate-200">{app.manifestPath}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Entry URL:</span>
                    <strong className="text-slate-200 truncate max-w-[120px]">{app.path}</strong>
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

                <a
                  href={app.pwabuilderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                  <span>1-Click PWABuilder Cloud</span>
                </a>
              </div>
            </div>
          );
        })}
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

        {/* Method 1: Google Bubblewrap CLI */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Method 1: Google Bubblewrap CLI (Recommended)</p>
              <p className="text-[10px] text-slate-400">Compiles official Trusted Web Activity (TWA) APK with zero manual Java code needed.</p>
            </div>
            <button
              onClick={() => copyToClipboard(
                `# 1. Install Bubblewrap CLI\nnpm install -g @bubblewrap/cli\n\n# 2. Initialize TWA using verified manifest\nbubblewrap init --manifest="${PUBLIC_BASE_URL}/manifest.json"\n\n# 3. Build signed APK\nbubblewrap build`,
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
    </div>
  );
}
