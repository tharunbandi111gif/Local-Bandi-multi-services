import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  Bike, 
  Building2, 
  ShoppingBag, 
  Radio, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Clock, 
  Phone, 
  Mail, 
  ExternalLink,
  ChevronDown,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  ArrowUpRight
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { UserRole, AccountStatus, ApprovalStatus } from '../../types';
import { logAuditAction } from '../../services/auditService';

interface UserRecord {
  id: string;
  name?: string;
  displayName?: string;
  phone?: string;
  email?: string;
  role?: string;
  accountStatus?: AccountStatus;
  approvalStatus?: ApprovalStatus;
  isApproved?: boolean;
  isDeactivated?: boolean;
  branchId?: string;
  branchName?: string;
  vendorId?: string;
  vendorName?: string;
  isOnline?: boolean;
  lastActive?: any;
  createdAt?: any;
}

interface GlobalMonitoringProps {
  currentAdminUid: string;
  currentAdminName: string;
  branches: Array<{ id: string; name: string; status?: string }>;
  orders: any[];
}

export default function GlobalMonitoringView({
  currentAdminUid,
  currentAdminName,
  branches,
  orders
}: GlobalMonitoringProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'vendor' | 'delivery' | 'branch_admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'pending' | 'disabled'>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserRecord | null>(null);
  const [editRole, setEditRole] = useState<string>('');
  const [editBranchId, setEditBranchId] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Live listeners for users, vendors, and delivery riders
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRecord));
      setUsers(userList);
      setLoading(false);
    }, (err) => console.warn('Users listener error:', err));

    const unsubVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
      setVendors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn('Vendors listener error:', err));

    const unsubRiders = onSnapshot(collection(db, 'deliveryPartners'), (snapshot) => {
      setRiders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.warn('Riders listener error:', err));

    return () => {
      unsubUsers();
      unsubVendors();
      unsubRiders();
    };
  }, []);

  // Aggregated Counters
  const customers = users.filter(u => !u.role || u.role === 'customer' || u.role === 'user');
  const vendorUsers = users.filter(u => u.role === 'vendor');
  const deliveryUsers = users.filter(u => u.role === 'delivery' || u.role === 'deliveryPartner');
  const branchAdmins = users.filter(u => u.role === 'branch_admin' || u.role === 'branchAdmin');

  // Customer metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.accountStatus !== 'disabled' && !c.isDeactivated).length;
  const onlineCustomers = customers.filter(c => c.isOnline === true).length;
  const offlineCustomers = Math.max(0, totalCustomers - onlineCustomers);

  // Vendor metrics
  const totalVendors = vendors.length || vendorUsers.length;
  const activeVendors = vendors.filter(v => v.status === 'Approved' || v.status === 'active').length;
  const onlineVendors = vendors.filter(v => v.isOnline === true).length;
  const offlineVendors = Math.max(0, totalVendors - onlineVendors);
  const pendingVendors = vendors.filter(v => v.status === 'Pending' || v.approvalStatus === 'pending').length;

  // Delivery metrics
  const totalRiders = riders.length || deliveryUsers.length;
  const busyRiders = riders.filter(r => r.status === 'On Trip' || r.activeOrderId).length;
  const availableRiders = riders.filter(r => r.isOnline === true && r.status !== 'On Trip' && !r.activeOrderId).length;
  const onlineRiders = riders.filter(r => r.isOnline === true).length;
  const offlineRiders = Math.max(0, totalRiders - onlineRiders);
  const pendingRiders = riders.filter(r => r.status === 'Pending' || r.approvalStatus === 'pending').length;

  // Branch metrics
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.status === 'Active' || !b.status).length;
  const inactiveBranches = Math.max(0, totalBranches - activeBranches);
  const onlineBranchAdmins = branchAdmins.filter(b => b.isOnline === true).length;

  // Order metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const acceptedOrders = orders.filter(o => (o.status || '').toLowerCase() === 'accepted').length;
  const preparingOrders = orders.filter(o => ['preparing', 'processing'].includes((o.status || '').toLowerCase())).length;
  const assignedOrders = orders.filter(o => (o.status || '').toLowerCase() === 'assigned').length;
  const outForDeliveryOrders = orders.filter(o => (o.status || '').toLowerCase().includes('delivery') || (o.status || '').toLowerCase() === 'pickedup').length;
  const deliveredOrders = orders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  const cancelledOrders = orders.filter(o => (o.status || '').toLowerCase() === 'cancelled').length;

  // User Action Handler
  const handleUserAction = async (
    targetUser: UserRecord, 
    action: 'approve' | 'reject' | 'enable' | 'disable' | 'change_role',
    extraPayload?: { role?: string; branchId?: string }
  ) => {
    try {
      const userRef = doc(db, 'users', targetUser.id);
      const updates: Record<string, any> = {
        updatedAt: serverTimestamp()
      };

      if (action === 'approve') {
        updates.approvalStatus = 'approved';
        updates.accountStatus = 'active';
        updates.isApproved = true;
      } else if (action === 'reject') {
        updates.approvalStatus = 'rejected';
        updates.isApproved = false;
      } else if (action === 'disable') {
        updates.accountStatus = 'disabled';
        updates.isDeactivated = true;
      } else if (action === 'enable') {
        updates.accountStatus = 'active';
        updates.isDeactivated = false;
      } else if (action === 'change_role' && extraPayload?.role) {
        updates.role = extraPayload.role;
        if (extraPayload.branchId !== undefined) {
          updates.branchId = extraPayload.branchId;
        }
      }

      await updateDoc(userRef, updates);

      // Central Audit Log
      await logAuditAction({
        actorId: currentAdminUid,
        actorName: currentAdminName,
        actorRole: 'master_admin',
        action: `USER_${action.toUpperCase()}`,
        targetCollection: 'users',
        targetId: targetUser.id,
        details: { action, updates }
      });

      setActionSuccessMsg(`Successfully updated user ${targetUser.name || targetUser.phone || targetUser.id}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setSelectedUserForEdit(null);
    } catch (err: any) {
      alert(`Action failed: ${err.message || err}`);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (u.name || u.displayName || '').toLowerCase().includes(term);
    const phoneMatch = (u.phone || '').includes(term);
    const emailMatch = (u.email || '').toLowerCase().includes(term);
    const idMatch = u.id.toLowerCase().includes(term);
    const matchesSearch = !term || nameMatch || phoneMatch || emailMatch || idMatch;

    if (!matchesSearch) return false;

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'customer') {
        if (u.role && u.role !== 'customer' && u.role !== 'user') return false;
      } else if (roleFilter === 'vendor') {
        if (u.role !== 'vendor') return false;
      } else if (roleFilter === 'delivery') {
        if (u.role !== 'delivery' && u.role !== 'deliveryPartner') return false;
      } else if (roleFilter === 'branch_admin') {
        if (u.role !== 'branch_admin' && u.role !== 'branchAdmin') return false;
      }
    }

    // Status filter
    if (statusFilter === 'online' && !u.isOnline) return false;
    if (statusFilter === 'offline' && u.isOnline) return false;
    if (statusFilter === 'pending' && u.approvalStatus !== 'pending' && u.isApproved !== false) return false;
    if (statusFilter === 'disabled' && u.accountStatus !== 'disabled' && !u.isDeactivated) return false;

    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Real-Time Global System Telemetry
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Master Admin Global Monitoring Hub
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Live synchronized status of all 5 standalone apps, user active presence radar, real-time fleet availability, and centralized access governance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Live Radar: {users.filter(u => u.isOnline).length} Active Now
            </span>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {actionSuccessMsg}
          </div>
        )}
      </div>

      {/* 5 STANDALONE APP SECTIONS: 5 PILLARS OF MONITORING */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. CUSTOMERS CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">1. Customer App</h3>
                <p className="text-[10px] text-slate-500 font-mono">com.localbandi.customer</p>
              </div>
            </div>
            <span className="text-xl font-black text-yellow-400">{totalCustomers}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Active</p>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">{activeCustomers}</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Online</p>
              <p className="font-bold text-yellow-400 text-sm mt-0.5">{onlineCustomers}</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Offline</p>
              <p className="font-bold text-slate-400 text-sm mt-0.5">{offlineCustomers}</p>
            </div>
          </div>
        </div>

        {/* 2. VENDORS CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">2. Vendor App</h3>
                <p className="text-[10px] text-slate-500 font-mono">com.localbandi.vendor</p>
              </div>
            </div>
            <span className="text-xl font-black text-emerald-400">{totalVendors}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Active</p>
              <p className="font-bold text-emerald-400 text-xs mt-0.5">{activeVendors}</p>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Online</p>
              <p className="font-bold text-yellow-400 text-xs mt-0.5">{onlineVendors}</p>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Offline</p>
              <p className="font-bold text-slate-400 text-xs mt-0.5">{offlineVendors}</p>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-amber-400 uppercase">Pending</p>
              <p className="font-bold text-amber-400 text-xs mt-0.5">{pendingVendors}</p>
            </div>
          </div>
        </div>

        {/* 3. DELIVERY PARTNERS CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">3. Delivery App</h3>
                <p className="text-[10px] text-slate-500 font-mono">com.localbandi.delivery</p>
              </div>
            </div>
            <span className="text-xl font-black text-blue-400">{totalRiders}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Available</p>
              <p className="font-bold text-emerald-400 text-xs mt-0.5">{availableRiders}</p>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">On Trip</p>
              <p className="font-bold text-indigo-400 text-xs mt-0.5">{busyRiders}</p>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Offline</p>
              <p className="font-bold text-slate-400 text-xs mt-0.5">{offlineRiders}</p>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <p className="text-[9px] text-amber-400 uppercase">Pending</p>
              <p className="font-bold text-amber-400 text-xs mt-0.5">{pendingRiders}</p>
            </div>
          </div>
        </div>

        {/* 4. BRANCHES & BRANCH ADMINS CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">4. Branch Admin App</h3>
                <p className="text-[10px] text-slate-500 font-mono">com.localbandi.branchadmin</p>
              </div>
            </div>
            <span className="text-xl font-black text-amber-400">{totalBranches}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Active Hubs</p>
              <p className="font-bold text-emerald-400 text-sm mt-0.5">{activeBranches}</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Admins</p>
              <p className="font-bold text-amber-400 text-sm mt-0.5">{branchAdmins.length}</p>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-400 uppercase">Online</p>
              <p className="font-bold text-yellow-400 text-sm mt-0.5">{onlineBranchAdmins}</p>
            </div>
          </div>
        </div>

        {/* 5. MASTER ADMIN OVERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">5. Master Admin Console</h3>
                <p className="text-[10px] text-slate-500 font-mono">com.localbandi.masteradmin</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              Super Admin Only
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Full Cross-App Inspection:</span>
              <span className="text-emerald-400 font-bold">Enabled</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Backend Access Gate:</span>
              <span className="text-emerald-400 font-bold">Enforced (403 Shield)</span>
            </div>
          </div>
        </div>

        {/* 6. ORDERS PIPELINE OVERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Orders Pipeline</h3>
                <p className="text-[10px] text-slate-500 font-mono">Real-time status breakdown</p>
              </div>
            </div>
            <span className="text-xl font-black text-purple-400">{totalOrders}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
            <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold block">{pendingOrders}</span>
              <span className="text-slate-500">Pending</span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <span className="text-indigo-400 font-bold block">{preparingOrders}</span>
              <span className="text-slate-500">Prep</span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <span className="text-blue-400 font-bold block">{outForDeliveryOrders}</span>
              <span className="text-slate-500">Out</span>
            </div>
            <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block">{deliveredOrders}</span>
              <span className="text-slate-500">Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME USER STATUS RADAR & GOVERNANCE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Real-Time User Presence & Governance Radar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live view of all users across the 5 apps. Manage roles, approval states, and account status in real-time.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 w-48 sm:w-64"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-yellow-500"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="delivery">Delivery Partner</option>
              <option value="branch_admin">Branch Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-yellow-500"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
              <option value="pending">Pending Approval</option>
              <option value="disabled">Disabled / Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3">User / Contact</th>
                <th className="py-3 px-3">Role & Scope</th>
                <th className="py-3 px-3">Branch / Vendor</th>
                <th className="py-3 px-3 text-center">Presence</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.slice(0, 50).map((u) => {
                  const role = u.role || 'customer';
                  const isOnline = u.isOnline === true;
                  const isApproved = u.approvalStatus === 'approved' || (u.approvalStatus !== 'pending' && u.isApproved !== false);
                  const isPending = u.approvalStatus === 'pending' || u.isApproved === false;
                  const isDisabled = u.accountStatus === 'disabled' || u.isDeactivated === true;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {u.name || u.displayName || 'Anonymous'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          {u.phone && <span>{u.phone}</span>}
                          {u.email && <span className="truncate max-w-[150px]">{u.email}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          role === 'vendor' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          role === 'delivery' || role === 'deliveryPartner' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          role === 'branch_admin' || role === 'branchAdmin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          role === 'master_admin' || role === 'masterAdmin' || role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {role}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {u.branchId ? (
                          <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Branch: {u.branchName || branches.find(b => b.id === u.branchId)?.name || u.branchId}
                          </span>
                        ) : u.vendorId ? (
                          <span className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Vendor: {u.vendorName || u.vendorId}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                          <span className={`text-[10px] font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isDisabled ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                            Disabled
                          </span>
                        ) : isPending ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            Pending Approval
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleUserAction(u, 'approve')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                                title="Approve Registration"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleUserAction(u, 'reject')}
                                className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 rounded text-[10px] font-bold transition flex items-center gap-1"
                                title="Reject Application"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}

                          {isDisabled ? (
                            <button
                              onClick={() => handleUserAction(u, 'enable')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Re-enable Account"
                            >
                              <Unlock className="w-3 h-3" /> Enable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(u, 'disable')}
                              className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Suspend Account"
                            >
                              <Lock className="w-3 h-3" /> Disable
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedUserForEdit(u);
                              setEditRole(u.role || 'customer');
                              setEditBranchId(u.branchId || '');
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition"
                          >
                            Edit Role
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT ROLE & BRANCH ASSIGNMENT MODAL */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit User Role & Scope</h3>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p><strong className="text-white">User:</strong> {selectedUserForEdit.name || selectedUserForEdit.phone || selectedUserForEdit.id}</p>
              <p><strong className="text-white">Current Role:</strong> {selectedUserForEdit.role || 'customer'}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Select Target Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="customer">Customer (com.localbandi.customer)</option>
                <option value="vendor">Vendor Merchant (com.localbandi.vendor)</option>
                <option value="delivery">Delivery Partner (com.localbandi.delivery)</option>
                <option value="branch_admin">Branch Admin (com.localbandi.branchadmin)</option>
                <option value="master_admin">Master Super Admin (com.localbandi.masteradmin)</option>
              </select>
            </div>

            {(editRole === 'branch_admin' || editRole === 'delivery' || editRole === 'vendor') && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Assign Regional Branch</label>
                <select
                  value={editBranchId}
                  onChange={(e) => setEditBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="">No Specific Branch (Global)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserAction(selectedUserForEdit, 'change_role', { role: editRole, branchId: editBranchId })}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-black transition"
              >
                Save Role Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
