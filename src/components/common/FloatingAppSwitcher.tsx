import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Truck, Bike, ShieldAlert, Layers, ChevronUp, X, ExternalLink, Building2, Store, Lock, Smartphone, Download } from 'lucide-react';
import AppDownloadModal from '../AppDownloadModal';
import { useFirebase, isStrictMasterAdminIdentity } from '../../contexts/FirebaseContext';

interface AppInfo {
  id: 'customer' | 'vendor' | 'partner' | 'admin' | 'franchise';
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

export default function FloatingAppSwitcher({ currentApp }: { currentApp: 'customer' | 'vendor' | 'partner' | 'admin' | 'franchise' }) {
  const { user, userProfile, isMasterAdmin: ctxIsMasterAdmin } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const isStrictMaster = Boolean(
    ctxIsMasterAdmin ||
    isStrictMasterAdminIdentity(
      user?.email || userProfile?.email,
      user?.phoneNumber || userProfile?.phone || localStorage.getItem('user_phone'),
      user?.uid
    )
  );

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return isStrictMaster || currentApp !== 'customer';
  });

  useEffect(() => {
    const handleSessionChange = () => {
      setIsAdminUnlocked(isStrictMaster || currentApp !== 'customer');
    };
    handleSessionChange();
    window.addEventListener('admin_session_updated', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);
    return () => {
      window.removeEventListener('admin_session_updated', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, [currentApp, isStrictMaster]);

  // Completely hide standalone gateway switcher from regular customer view
  if (!isAdminUnlocked && currentApp === 'customer') {
    return null;
  }

  const allApps: AppInfo[] = [
    {
      id: 'customer',
      name: 'Customer App',
      description: 'Order food, groceries, browse real estate, and book local services.',
      url: '/',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-indigo-500 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 shadow-indigo-500/5',
    },
    {
      id: 'vendor',
      name: 'Vendor Merchant App',
      description: 'Manage store catalog, accept incoming orders, and track sales revenue.',
      url: '/vendor.html',
      icon: <Store className="w-5 h-5" />,
      color: 'bg-emerald-500 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 shadow-emerald-500/5',
    },
    {
      id: 'partner',
      name: 'Delivery Partner App',
      description: 'Rider console with live GPS route navigation, trip pool & earnings ledger.',
      url: '/delivery.html',
      icon: <Bike className="w-5 h-5" />,
      color: 'bg-blue-500 text-blue-400 border-blue-500/20 hover:border-blue-500/40 text-blue-400 shadow-blue-500/5',
    },
    {
      id: 'franchise',
      name: 'Branch Admin App',
      description: 'Branch operations, delivery radius geo-mapping & regional team oversight.',
      url: '/branch-admin.html',
      icon: <Building2 className="w-5 h-5" />,
      color: 'bg-amber-500 text-amber-400 border-amber-500/20 hover:border-amber-500/40 text-amber-400 shadow-amber-500/5',
    },
    {
      id: 'admin',
      name: 'Master Admin Console',
      description: 'Master platform parameters, commissions, backups, AI diagnostics & founder panel.',
      url: '/admin.html',
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'bg-red-500 text-red-500 border-red-500/20 hover:border-red-500/40 text-red-500 shadow-red-500/5',
    },
  ];

  const apps = allApps.filter((a) => a.id !== 'admin' || isStrictMaster || currentApp === 'admin');

  const currentAppDetails = apps.find(a => a.id === currentApp) || apps[0];

  const handleNavigate = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="fixed bottom-4 right-4 z-[999991] font-sans">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950 z-[999991]"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-16 right-0 w-[320px] bg-slate-900 border border-white/10 rounded-[2.2rem] p-5 shadow-2xl z-[999992] overflow-hidden"
              id="app_switcher_menu"
            >
              {/* Blur accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Standalone Gateway</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">khammam platform</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 bg-white/[0.04] border border-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                  id="app_switcher_close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 relative z-10">
                {apps.map((app) => {
                  const isCurrent = app.id === currentApp;
                  return (
                    <div
                      key={app.id}
                      onClick={() => !isCurrent && handleNavigate(app.url)}
                      className={`group flex gap-3 p-3.5 rounded-2xl border transition-all duration-350 cursor-pointer ${
                        isCurrent
                          ? 'bg-slate-800/80 border-indigo-500/30 ring-1 ring-indigo-500/10'
                          : 'bg-slate-950/60 border-white/5 hover:bg-slate-900/60 hover:border-slate-800'
                      }`}
                      id={`switcher_option_${app.id}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                        isCurrent 
                          ? 'bg-indigo-500/20 border-indigo-500/30' 
                          : 'bg-white/[0.02] border-white/5 group-hover:scale-105'
                      }`}>
                        <div className={isCurrent ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}>
                          {app.icon}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-black tracking-tight uppercase leading-none ${
                            isCurrent ? 'text-indigo-400' : 'text-slate-200 group-hover:text-indigo-400 transition-colors'
                          }`}>
                            {app.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[7px] font-bold tracking-widest bg-indigo-500/25 border border-indigo-500/30 px-1 py-0.5 rounded text-indigo-300 uppercase scale-90">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed mt-1">
                          {app.description}
                        </p>
                      </div>

                      {!isCurrent && (
                        <div className="self-center text-slate-600 group-hover:text-slate-300 transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 space-y-2 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowDownloadModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                  <span>Download Standalone APKs</span>
                </button>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">
                  Live Firestore Sync &bull; Phone OTP Sign-Up
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main trigger button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all cursor-pointer placeholder-sky-200 pointer-events-auto"
        id="app_switcher_trigger"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <span className="text-slate-400">Standalone App:</span>
        <span className="text-white font-black italic">{currentAppDetails.name.replace(' Console', '').replace(' Portal', '').replace(' App', '')}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        defaultAppId={currentApp === 'partner' ? 'delivery' : currentApp === 'franchise' ? 'branch' : currentApp}
      />
    </div>
  );
}
