import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Bike, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  UserCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, RoleDashboardCard } from '../types';

interface MyDashboardsSectionProps {
  isMaster: boolean;
  isVendorApproved: boolean;
  isDeliveryApproved: boolean;
  isBranchAdminApproved: boolean;
  vendorProfileId?: string;
  deliveryProfileId?: string;
  vendorProfile?: any;
  deliveryProfile?: any;
  onNavigate: (screen: Screen, id?: string) => void;
  userPhone?: string;
  userName?: string;
}

export default function MyDashboardsSection({
  isMaster,
  isVendorApproved,
  isDeliveryApproved,
  isBranchAdminApproved,
  vendorProfileId,
  deliveryProfileId,
  vendorProfile,
  deliveryProfile,
  onNavigate,
  userPhone,
  userName
}: MyDashboardsSectionProps) {
  const [showRoleSwitcherModal, setShowRoleSwitcherModal] = useState(false);
  const [activeSelectedRole, setActiveSelectedRole] = useState<'customer' | 'vendor' | 'delivery' | 'branchAdmin' | 'masterAdmin'>('customer');

  // Scalable role registry mapping
  const roleCards: Array<{
    id: string;
    roleKey: 'customer' | 'vendor' | 'delivery' | 'branchAdmin' | 'masterAdmin';
    title: string;
    description: string;
    badge: string;
    status: string;
    isAvailable: boolean;
    icon: React.ElementType;
    bgGradient: string;
    borderColor: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    btnLabel: string;
    btnClass: string;
    onOpen: () => void;
  }> = [
    // 1. Customer Profile (Always available to every user)
    {
      id: 'dash_customer',
      roleKey: 'customer',
      title: 'Customer Profile',
      description: 'Shopper account, instant orders, live GPS delivery tracking, and reward points.',
      badge: 'Active Profile',
      status: 'Current Mode',
      isAvailable: true,
      icon: ShoppingBag,
      bgGradient: 'from-amber-500/10 via-slate-900/5 to-slate-900/0 dark:from-amber-500/5',
      borderColor: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
      iconColor: 'text-amber-500',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      btnLabel: 'Customer View',
      btnClass: 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20',
      onOpen: () => {
        setActiveSelectedRole('customer');
        // Already on Customer Profile
      }
    },

    // 2. Vendor Dashboard (Appears only when approved or Master Admin)
    {
      id: 'dash_vendor',
      roleKey: 'vendor',
      title: 'Vendor Dashboard',
      description: 'Manage store catalog items, process live orders, track sales revenue, and payouts.',
      badge: 'Approved Partner',
      status: vendorProfile?.status || 'Active & Online',
      isAvailable: isVendorApproved || isMaster,
      icon: Store,
      bgGradient: 'from-emerald-500/10 via-slate-900/5 to-slate-900/0 dark:from-emerald-500/5',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      btnLabel: 'Open Store Console',
      btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20',
      onOpen: () => {
        setActiveSelectedRole('vendor');
        const targetId = vendorProfileId || (isMaster ? 'admin-store' : undefined);
        onNavigate('vendor', targetId);
      }
    },

    // 3. Delivery Partner Console (Appears only when approved or Master Admin)
    {
      id: 'dash_delivery',
      roleKey: 'delivery',
      title: 'Delivery Console',
      description: 'Trip pool dispatch, turn-by-turn navigation, cash collection ledger, and driver wallet.',
      badge: 'Approved Rider',
      status: deliveryProfile?.status || 'Active Ready',
      isAvailable: isDeliveryApproved || isMaster,
      icon: Bike,
      bgGradient: 'from-orange-500/10 via-slate-900/5 to-slate-900/0 dark:from-orange-500/5',
      borderColor: 'border-orange-500/20 hover:border-orange-500/40',
      iconBg: 'bg-orange-500/15 text-orange-500 border border-orange-500/30',
      iconColor: 'text-orange-500',
      badgeBg: 'bg-orange-500/15 border-orange-500/30',
      badgeText: 'text-orange-600 dark:text-orange-400',
      btnLabel: 'Open Rider Console',
      btnClass: 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20',
      onOpen: () => {
        setActiveSelectedRole('delivery');
        const targetId = deliveryProfileId || (isMaster ? 'admin-rider' : undefined);
        onNavigate('delivery', targetId);
      }
    },

    // 4. Local Branch Admin Dashboard (Appears only when approved or Master Admin)
    {
      id: 'dash_branch',
      roleKey: 'branchAdmin',
      title: 'Branch Admin Dashboard',
      description: 'Branch hub operations, zone coverage polygon, local merchants & regional fleet oversight.',
      badge: 'Branch Manager',
      status: 'Branch Management Access',
      isAvailable: isBranchAdminApproved || isMaster,
      icon: Building2,
      bgGradient: 'from-blue-500/10 via-slate-900/5 to-slate-900/0 dark:from-blue-500/5',
      borderColor: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/15 text-blue-500 border border-blue-500/30',
      iconColor: 'text-blue-500',
      badgeBg: 'bg-blue-500/15 border-blue-500/30',
      badgeText: 'text-blue-600 dark:text-blue-400',
      btnLabel: 'Open Branch Hub',
      btnClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20',
      onOpen: () => {
        setActiveSelectedRole('branchAdmin');
        onNavigate('branchManager');
      }
    },

    // 5. Master Admin Control Panel (Master Admin Only)
    {
      id: 'dash_master',
      roleKey: 'masterAdmin',
      title: 'Master Admin Control Panel',
      description: 'Total platform authority: branches, vendor approvals, catalog indexing, payments & full RBAC.',
      badge: 'Master Admin',
      status: 'Super Administrator',
      isAvailable: isMaster,
      icon: ShieldCheck,
      bgGradient: 'from-purple-500/10 via-slate-900/5 to-slate-900/0 dark:from-purple-500/5',
      borderColor: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/15 text-purple-500 border border-purple-500/30',
      iconColor: 'text-purple-500',
      badgeBg: 'bg-purple-500/15 border-purple-500/30',
      badgeText: 'text-purple-600 dark:text-purple-400',
      btnLabel: 'Launch Master Panel',
      btnClass: 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-amber-500/20',
      onOpen: () => {
        setActiveSelectedRole('masterAdmin');
        window.location.href = '/admin';
      }
    }
  ];

  // Filter cards to only those that the user has approved access to
  const visibleCards = roleCards.filter(c => c.isAvailable);

  // If user has NO approved roles beyond Customer and is not Master Admin:
  // Rule 2: "Users with no additional approved roles must see only normal customer options."
  const hasPartnerOrAdminRoles = visibleCards.length > 1;
  if (!hasPartnerOrAdminRoles) {
    return null;
  }

  const roleCount = visibleCards.length;

  return (
    <div className="px-6 mb-8 w-full font-sans" id="my_dashboards_section">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white italic tracking-tight font-display">
              My Dashboards
            </h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {roleCount} Approved Role{roleCount > 1 ? 's' : ''} &bull; Single Account
            </p>
          </div>
        </div>

        {/* Multi-Role Quick Switcher Button (Rule 13) */}
        {roleCount > 1 && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowRoleSwitcherModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all border border-white/10"
            id="btn_switch_role"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Switch Role</span>
          </motion.button>
        )}
      </div>

      {/* Dynamic Role Dashboard Cards Grid */}
      <div className="space-y-3.5">
        {visibleCards.map((card, index) => {
          const CardIcon = card.icon;
          const isCustomerCard = card.roleKey === 'customer';

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-[2rem] border ${card.borderColor} bg-gradient-to-br ${card.bgGradient} bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group`}
              id={`role_card_${card.roleKey}`}
            >
              {/* Background ambient watermark icon */}
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <CardIcon className="w-24 h-24 text-gray-900 dark:text-white" />
              </div>

              <div className="relative z-10 flex flex-col gap-3.5">
                {/* Top Row: Icon + Title & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm`}>
                      <CardIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tight uppercase">
                          {card.title}
                        </h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${card.badgeBg} ${card.badgeText} text-[9px] font-black uppercase tracking-wider`}>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight mt-0.5">
                        Status: <span className="text-gray-600 dark:text-gray-300">{card.status}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                  {card.description}
                </p>

                {/* Bottom Action Bar */}
                <div className="pt-1 flex items-center justify-between border-t border-gray-100 dark:border-slate-800">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {isCustomerCard ? 'Standard Profile' : 'Role-Protected Console'}
                  </span>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={card.onOpen}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 ${card.btnClass}`}
                  >
                    <span>{card.btnLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Switch Role Interactive Modal (Rule 13) */}
      <AnimatePresence>
        {showRoleSwitcherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 max-w-md w-full border border-gray-100 dark:border-slate-800 shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white italic tracking-tight font-display">
                      Switch Active Role
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Seamless transition &bull; No re-login needed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoleSwitcherModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Roles List */}
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {visibleCards.map((card) => {
                  const CardIcon = card.icon;
                  const isCurrentSelected = activeSelectedRole === card.roleKey;

                  return (
                    <motion.button
                      key={`switch_${card.id}`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowRoleSwitcherModal(false);
                        card.onOpen();
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isCurrentSelected 
                          ? 'border-amber-500 bg-amber-500/10 text-gray-900 dark:text-white shadow-sm' 
                          : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                          <CardIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-white">
                            {card.title}
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">
                            {card.badge}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrentSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider">
                            Active
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Single Account Notice */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>All roles are bound to your single authenticated profile ({userPhone || 'account'}).</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
