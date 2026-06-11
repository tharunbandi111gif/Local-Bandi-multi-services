import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Search, MapPin, 
  User, Calendar, Shield, X, 
  CheckCircle2, AlertCircle, Trash2, 
  TrendingUp, IndianRupee, MoreVertical,
  Settings, Power, FileText, Ban, LayoutDashboard, UserCheck, Lock, Users, HeartHandshake, Heart,
  Download, RefreshCw, ShieldCheck, Edit2, Ticket, Percent
} from 'lucide-react';
import { 
  collection, query, getDocs, 
  addDoc, updateDoc, doc, 
  serverTimestamp, onSnapshot,
  where, deleteDoc, setDoc, orderBy, deleteField
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Branch } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Polygon, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import DrawControl from './DrawControl';


interface BranchManagerProps {
  onBack: () => void;
  masterAdminName: string;
}

export default function BranchManager({ onBack, masterAdminName }: BranchManagerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const branchesRef = useRef<Branch[]>([]);
  React.useEffect(() => {
    branchesRef.current = branches;
  }, [branches]);
  const [productCategoryMap, setProductCategoryMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<'branches' | 'terms' | 'applications' | 'managers' | 'experience' | 'members' | 'promocodes' | 'analytics' | 'map' | 'audit'>('branches');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [franchiseApplications, setFranchiseApplications] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedMapBranchId, setSelectedMapBranchId] = useState<string | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<'All' | 'Payout' | 'Franchise Grant' | 'Inventory Update'>('All');
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [earningsPeriod, setEarningsPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    value: '',
    type: 'percentage' as 'percentage' | 'fixed',
    status: 'Active' as 'Active' | 'Inactive',
    expiryDate: ''
  });
  const [pulseDelta, setPulseDelta] = useState(0);
  const [customZones, setCustomZones] = useState<any[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [pendingZone, setPendingZone] = useState<any>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneBranchId, setZoneBranchId] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([17.2473, 80.1514]);
  const [mapZoom, setMapZoom] = useState<number>(9);
  const [locating, setLocating] = useState(false);

  // Helper component to programmatically pan/zoom map
  function ChangeMapCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(13);
          setLocating(false);
          alert(`✓ Map centered on your current location: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setLocating(false);
          alert("Error getting your current location: " + error.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleZoneCreated = (e: any) => {
    const { layerType, layer } = e;
    let serialized: any = null;
    if (layerType === 'circle') {
      const latLng = layer.getLatLng();
      serialized = {
        type: 'circle',
        center: [latLng.lat, latLng.lng],
        radius: layer.getRadius()
      };
    } else if (layerType === 'rectangle') {
      const latLngs = layer.getLatLngs()[0];
      serialized = {
        type: 'rectangle',
        bounds: latLngs.map((ll: any) => [ll.lat, ll.lng])
      };
    } else if (layerType === 'polygon') {
      const latLngs = layer.getLatLngs()[0];
      serialized = {
        type: 'polygon',
        positions: latLngs.map((ll: any) => [ll.lat, ll.lng])
      };
    }

    if (serialized) {
      setPendingZone(serialized);
      setZoneName('');
      setZoneBranchId('');
      setShowZoneModal(true);
    }
  };

  const handleSaveZone = async () => {
    if (!zoneName.trim()) {
      alert("Please provide a name for this custom coverage zone.");
      return;
    }
    try {
      await addDoc(collection(db, 'coverage_zones'), {
        ...pendingZone,
        name: zoneName,
        branchId: zoneBranchId || null,
        createdAt: serverTimestamp()
      });
      await logAuditAction('Zone Creation', `Created custom coverage zone '${zoneName}'`);
      setShowZoneModal(false);
      setPendingZone(null);
      alert("Custom coverage zone saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save zone: " + (err as Error).message);
    }
  };

  const handleDeleteZone = async (zoneId: string, name: string) => {
    if (!window.confirm(`Delete the custom coverage zone '${name}'?`)) return;
    try {
      await deleteDoc(doc(db, 'coverage_zones', zoneId));
      await logAuditAction('Zone Deletion', `Deleted custom coverage zone '${name}'`);
      alert("Zone deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete zone: " + (err as Error).message);
    }
  };

  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  const handleBulkSaveZones = async (updates: any[]) => {
    if (!window.confirm(`Apply boundary edits to ${updates.length} coverage zones in bulk?`)) return;
    try {
      const batchList = updates.map(update => {
        const docRef = doc(db, 'coverage_zones', update.id);
        const fieldsToUpdate: any = {};
        if (update.type === 'circle') {
          fieldsToUpdate.center = update.center;
          fieldsToUpdate.radius = update.radius;
        } else if (update.type === 'rectangle') {
          fieldsToUpdate.bounds = update.bounds;
        } else if (update.type === 'polygon') {
          fieldsToUpdate.positions = update.positions;
          fieldsToUpdate.bounds = update.bounds || null;
        }
        return updateDoc(docRef, fieldsToUpdate);
      });
      await Promise.all(batchList);
      await logAuditAction('Bulk Zone Update', `Adjusted boundaries in bulk for ${updates.length} zones`);
      setIsBulkEditMode(false);
      alert(`Successfully saved updated boundaries for ${updates.length} coverage zones in bulk!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save bulk adjustments: " + (err as Error).message);
    }
  };

  const handleBulkDeleteZones = async (deletedIds: string[]) => {
    if (!window.confirm(`Delete ${deletedIds.length} coverage zones in bulk?`)) return;
    try {
      const batchList = deletedIds.map(id => deleteDoc(doc(db, 'coverage_zones', id)));
      await Promise.all(batchList);
      await logAuditAction('Bulk Zone Deletion', `Deleted ${deletedIds.length} coverage zones in bulk`);
      setIsBulkEditMode(false);
      alert(`Successfully deleted ${deletedIds.length} coverage zones.`);
    } catch (err) {
      console.error(err);
      alert("Failed to bulk delete zones: " + (err as Error).message);
    }
  };

  // Real-time pulse animation for selected branch coverage circles
  useEffect(() => {
    let animationFrameId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // Oscillate radius between -600m and +600m in 1.8 seconds cycle
      const delta = Math.sin((elapsed % 1800) / 1800 * Math.PI * 2) * 600;
      setPulseDelta(delta);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Real-time pincode conflict checker
  const getPincodeConflicts = (pincodesStr: string, currentBranchId?: string) => {
    const inputPincodes = pincodesStr
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (inputPincodes.length === 0) return [];
    
    const conflicts: { pincode: string; branchName: string }[] = [];
    
    branches.forEach(b => {
      if (currentBranchId && b.id === currentBranchId) return;
      if (b.pincodes) {
        b.pincodes.forEach(p => {
          const cleanP = p.trim();
          if (inputPincodes.includes(cleanP)) {
            conflicts.push({ pincode: cleanP, branchName: b.name });
          }
        });
      }
    });
    
    return conflicts;
  };

  const PINCODE_COORDINATES: Record<string, [number, number]> = {
    "507001": [17.2473, 80.1514],
    "507002": [17.2580, 80.1650],
    "507003": [17.2350, 80.1400],
    "507163": [17.2110, 80.1120],
    "507159": [17.2850, 80.1890],
    "500001": [17.3850, 78.4867],
    "500002": [17.3616, 78.4747],
    "500003": [17.4399, 78.4983],
    "500008": [17.3970, 78.3960],
    "500016": [17.4436, 78.4912],
    "500018": [17.4483, 78.4428],
    "500028": [17.3922, 78.4326],
    "500032": [17.4265, 78.3415],
    "500072": [17.4855, 78.3885],
    "500081": [17.4435, 78.3772],
    "500082": [17.4150, 78.3240],
    "506001": [17.9689, 79.5941],
    "506002": [17.9750, 79.6100],
    "506015": [18.0120, 79.5630],
    "505001": [18.4386, 79.1288],
    "505002": [18.4410, 79.1390],
    "508213": [17.1420, 79.6240],
    "508214": [17.1510, 79.6380],
  };

  const getPincodeCoords = (pincode: string, branchName: string): [number, number] => {
    const cleanPin = pincode.trim();
    if (cleanPin && PINCODE_COORDINATES[cleanPin]) {
      return PINCODE_COORDINATES[cleanPin];
    }
    const pinNum = parseInt(cleanPin.replace(/\D/g, '')) || 507001;
    const hash = (pinNum * 2654435761) % 1000;
    const offsetLat = (hash % 100 - 50) / 1000;
    const offsetLng = (Math.floor(hash / 10) % 100 - 50) / 1000;
    
    let baseCoords: [number, number] = [17.2473, 80.1514];
    const lowerName = branchName.toLowerCase();
    if (lowerName.includes('hyderabad') || lowerName.includes('secunderabad')) {
      baseCoords = [17.3850, 78.4867];
    } else if (lowerName.includes('warangal') || lowerName.includes('hanamkonda')) {
      baseCoords = [17.9689, 79.5941];
    } else if (lowerName.includes('karimnagar')) {
      baseCoords = [18.4386, 79.1288];
    } else if (lowerName.includes('suryapet')) {
      baseCoords = [17.1420, 79.6240];
    }
    
    return [baseCoords[0] + offsetLat, baseCoords[1] + offsetLng];
  };

  const getDaysRemaining = (expiryDateStr: string) => {
    if (!expiryDateStr) return Infinity;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    expiry.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const logAuditAction = async (actionType: string, details: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        actionType,
        details,
        adminName: masterAdminName,
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  };

  const handleSendRenewalReminder = async (branch: Branch) => {
    try {
      const daysRem = getDaysRemaining(branch.agreementExpiry);
      const reminderMsg = `⚠️ ALERT: Franchise Agreement for branch '${branch.name}' is expiring in ${daysRem} days (Expiry: ${branch.agreementExpiry}). Please renew immediately to avoid franchise suspension!`;
      
      await logAuditAction(
        'Renewal Reminder Sent',
        `Dispatched formal Renewal Reminder to branch principal '${branch.adminName}' for '${branch.name}'. (Expiry Date: ${branch.agreementExpiry})`
      );

      if (branch.adminId) {
        await addDoc(collection(db, 'support_chats'), {
          userId: branch.adminId,
          userName: branch.adminName,
          lastMessageTimestamp: new Date().toISOString(),
          unreadCount: 1,
          messages: [
            {
              id: `rem-${Date.now()}`,
              senderId: 'admin_audit',
              senderName: 'Lokal Super Admin',
              senderType: 'admin',
              text: reminderMsg,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }

      alert(`✓ Renewal Reminder Sent Successfully!\n\nTo Admin: ${branch.adminName}\nPhone: ${branch.contactPhone}\nMessage: "${reminderMsg}"`);
    } catch (err) {
      console.error("Failed to send renewal reminder:", err);
      alert("Failed to send reminder: " + (err as Error).message);
    }
  };


  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const downloadBranchCSV = async (branch: Branch) => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('branchId', '==', branch.id));
      const snap = await getDocs(q);
      
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const currentMonthOrders = orders.filter((order: any) => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : 
                          order.timestamp ? new Date(order.timestamp) : null;
        return orderDate && orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
      });
      
      const deliveredOrders = currentMonthOrders.filter((o: any) => o.status === 'Delivered');
      const currentMonthRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      const hqShare = currentMonthRevenue * 0.25;
      
      let csvContent = "";
      
      csvContent += `Branch Order History & Revenue Metrics - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}\n`;
      csvContent += `Branch Name,${branch.name}\n`;
      csvContent += `Branch ID,${branch.id}\n`;
      csvContent += `Location,${branch.location}\n`;
      csvContent += `Total Current Month Orders,${currentMonthOrders.length}\n`;
      csvContent += `Completed Delivered Orders,${deliveredOrders.length}\n`;
      csvContent += `Total Monthly Revenue (Delivered),Rs. ${currentMonthRevenue.toFixed(2)}\n`;
      csvContent += `HQ Revenue Share (25%),Rs. ${hqShare.toFixed(2)}\n\n`;
      
      csvContent += `Order ID,Date & Time,Customer,Payment Mode,Items Count,Total Amount,Status,HQ Share\n`;
      
      currentMonthOrders.forEach((o: any) => {
        const orderId = o.id || '';
        const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleString() : (o.timestamp ? new Date(o.timestamp).toLocaleString() : '');
        const customer = (o.userName || o.userPhone || 'Guest').replace(/,/g, ' ');
        const paymentMode = o.paymentMode || o.paymentMethod || 'COD';
        const itemsCount = o.items || (o.orderItems ? o.orderItems.length : 0);
        const total = o.total || 0;
        const status = o.status || '';
        const hqVal = status === 'Delivered' ? (total * 0.25).toFixed(2) : '0.00';
        
        csvContent += `"${orderId}","${orderDate}","${customer}","${paymentMode}",${itemsCount},${total},"${status}",${hqVal}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Branch_Metrics_${branch.name.replace(/\s+/g, '_')}_${now.toLocaleString('default', { month: 'short' })}${currentYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Download Failed:", err);
      alert("Failed to download CSV: " + (err as Error).message);
    }
  };

  const getDailyOrderVolumeData = () => {
    const dataMap: Record<string, number> = {};
    const now = new Date();
    
    // Initialize the map for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
      dataMap[dateStr] = 0;
    }

    // Filter and count orders
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    allOrders.forEach(order => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : 
                       order.timestamp?.toDate ? order.timestamp.toDate() : null;
      
      if (orderDate && orderDate >= thirtyDaysAgo) {
        const dateStr = orderDate.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
        if (dataMap[dateStr] !== undefined) {
          dataMap[dateStr] += 1;
        }
      }
    });

    return Object.keys(dataMap).map(date => ({
      dateStr: date,
      'Order Volume': dataMap[date]
    }));
  };

  const getCategoryRevenueData = () => {
    const categoryRevenue: Record<string, number> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    allOrders.forEach(order => {
      const orderDate = order.createdAt ? new Date(order.createdAt) : 
                       order.timestamp?.toDate ? order.timestamp.toDate() : null;
      
      if (orderDate && orderDate >= thirtyDaysAgo) {
        if (order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach((item: any) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const subtotal = qty * price;

            let category = 'Other';
            if (item.category) {
              category = item.category;
            } else if (item.id && productCategoryMap[item.id]) {
              category = productCategoryMap[item.id];
            } else if (item.name && productCategoryMap[item.name]) {
              category = productCategoryMap[item.name];
            } else {
              const nameLower = String(item.name || '').toLowerCase();
              if (nameLower.includes('milk') || nameLower.includes('ghee') || nameLower.includes('butter') || nameLower.includes('paneer') || nameLower.includes('curd')) {
                category = 'dairy';
              } else if (nameLower.includes('service') || nameLower.includes('mechanic') || nameLower.includes('maid') || nameLower.includes('plumber') || nameLower.includes('electrician') || nameLower.includes('mechanics')) {
                category = 'services';
              } else if (nameLower.includes('water') || nameLower.includes('grocery') || nameLower.includes('batter') || nameLower.includes('sambar') || nameLower.includes('rice') || nameLower.includes('powder')) {
                category = 'groceries';
              } else if (nameLower.includes('taxi') || nameLower.includes('travel') || nameLower.includes('cab') || nameLower.includes('car')) {
                category = 'travel';
              } else {
                category = 'groceries';
              }
            }

            const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);
            categoryRevenue[displayCategory] = (categoryRevenue[displayCategory] || 0) + subtotal;
          });
        } else {
          const total = Number(order.total) || 0;
          categoryRevenue['Groceries'] = (categoryRevenue['Groceries'] || 0) + total;
        }
      }
    });

    return Object.keys(categoryRevenue).map(cat => ({
      categoryName: cat,
      'Revenue (₹)': categoryRevenue[cat]
    })).sort((a, b) => b['Revenue (₹)'] - a['Revenue (₹)']);
  };

  const forceSyncBranchMetrics = async () => {
    setSyncing(true);
    try {
      const vendorsRef = collection(db, 'vendors');
      const vendorsSnap = await getDocs(vendorsRef);
      const vendorsList = vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const ordersRef = collection(db, 'orders');
      const ordersSnap = await getDocs(ordersRef);
      const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      for (const branch of branches) {
        const branchVendors = vendorsList.filter((v: any) => v.branchId === branch.id);
        
        const branchOrders = ordersList.filter((o: any) => {
          if (o.branchId !== branch.id) return false;
          const orderDate = o.createdAt ? new Date(o.createdAt) : 
                            o.timestamp ? new Date(o.timestamp) : null;
          return orderDate && orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
        });

        const branchDeliveredOrders = branchOrders.filter((o: any) => o.status === 'Delivered');
        const branchRevenue = branchDeliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

        await updateDoc(doc(db, 'branches', branch.id), {
          vendorsCount: branchVendors.length,
          ordersCount: branchOrders.length,
          revenue: branchRevenue,
          updatedAt: serverTimestamp()
        });
      }

      setLastSyncTime(new Date());
      alert("All branches synched from current month Firestore order history successfully!");
    } catch (err) {
      console.error("Manual Branch Sync Failed:", err);
      alert("Sync failed: " + (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenNewPromo = () => {
    setEditingPromo(null);
    setPromoForm({
      code: '',
      value: '',
      type: 'percentage',
      status: 'Active',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });
    setShowPromoModal(true);
  };

  const handleOpenEditPromo = (promo: any) => {
    let defaultDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (promo.expiryDate) {
      try {
        const d = promo.expiryDate.toDate ? promo.expiryDate.toDate() : new Date(promo.expiryDate);
        if (!isNaN(d.getTime())) {
          defaultDateStr = d.toISOString().slice(0, 10);
        }
      } catch (err) {
        console.error("Error parsing promo expiryDate:", err);
      }
    }

    setEditingPromo(promo);
    setPromoForm({
      code: promo.code || '',
      value: promo.value !== undefined ? String(promo.value) : '',
      type: promo.type || 'percentage',
      status: promo.status || 'Active',
      expiryDate: defaultDateStr
    });
    setShowPromoModal(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.value) {
      alert("Please fill in code and value");
      return;
    }
    const dataToSave = {
      code: promoForm.code.toUpperCase().trim(),
      value: Number(promoForm.value),
      type: promoForm.type,
      status: promoForm.status,
      expiryDate: new Date(promoForm.expiryDate).toISOString(),
    };

    try {
      if (editingPromo) {
        await updateDoc(doc(db, 'promoCodes', editingPromo.id), dataToSave);
        await logAuditAction('Promo Edit', `Edited promo code '${dataToSave.code}' with value: ${dataToSave.value} (${dataToSave.type})`);
        alert("Coupon successfully updated!");
      } else {
        await addDoc(collection(db, 'promoCodes'), {
          ...dataToSave,
          usageCount: 0,
          createdAt: serverTimestamp()
        });
        await logAuditAction('Promo Creation', `Created promo code '${dataToSave.code}'`);
        alert("Coupon successfully created!");
      }
      setShowPromoModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'promoCodes');
    }
  };

  useEffect(() => {
    const runSync = async () => {
      const activeBranches = branchesRef.current;
      if (activeBranches.length === 0) return;
      try {
        const vendorsRef = collection(db, 'vendors');
        const vendorsSnap = await getDocs(vendorsRef);
        const vendorsList = vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const ordersRef = collection(db, 'orders');
        const ordersSnap = await getDocs(ordersRef);
        const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        for (const branch of activeBranches) {
          const branchVendors = vendorsList.filter((v: any) => v.branchId === branch.id);
          const branchOrders = ordersList.filter((o: any) => {
            if (o.branchId !== branch.id) return false;
            const orderDate = o.createdAt ? new Date(o.createdAt) : 
                              o.timestamp ? new Date(o.timestamp) : null;
            return orderDate && orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
          });
          const branchDeliveredOrders = branchOrders.filter((o: any) => o.status === 'Delivered');
          const branchRevenue = branchDeliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

          if (
            branch.vendorsCount !== branchVendors.length || 
            branch.ordersCount !== branchOrders.length || 
            Math.abs((branch.revenue || 0) - branchRevenue) > 0.01
          ) {
            await updateDoc(doc(db, 'branches', branch.id), {
              vendorsCount: branchVendors.length,
              ordersCount: branchOrders.length,
              revenue: branchRevenue
            });
          }
        }
        setLastSyncTime(new Date());
      } catch (e) {
        console.error("Background auto sync failed:", e);
      }
    };

    // Initial silent run shortly after mounting
    const delayTimer = setTimeout(() => {
      runSync();
    }, 2000);

    // Dynamic background service runs strictly every 90 seconds
    const intervalTimer = setInterval(() => {
      runSync();
    }, 90000);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'experience') {
      const q = query(collection(db, 'support_chats'), orderBy('lastMessageTimestamp', 'desc'));
      const unsubFeedbacks = onSnapshot(q, (snap) => {
        setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubFeedbacks();
    } else if (activeTab === 'managers') {
      const q = query(collection(db, 'users'), where('role', 'in', ['branchAdmin', 'admin']));
      const unsubManagers = onSnapshot(q, (snap) => {
        setManagers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubManagers();
    } else if (activeTab === 'members') {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubUsers = onSnapshot(q, (snap) => {
        setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubUsers();
    } else if (activeTab === 'promocodes') {
      const q = query(collection(db, 'promoCodes'), orderBy('createdAt', 'desc'));
      const unsubPromos = onSnapshot(q, (snap) => {
        setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubPromos();
    } else if (activeTab === 'applications') {
      const q = query(collection(db, 'franchise_applications'), orderBy('createdAt', 'desc'));
      const unsubApps = onSnapshot(q, (snap) => {
        setFranchiseApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubApps();
    } else if (activeTab === 'audit') {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
      const unsubAudit = onSnapshot(q, (snap) => {
        setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubAudit();
    } else if (activeTab === 'analytics') {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const unsubOrders = onSnapshot(q, (snap) => {
        setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // Fetch products and services for categorization map
      const loadCatalogMeta = async () => {
        try {
          const prodSnap = await getDocs(collection(db, 'products'));
          const servSnap = await getDocs(collection(db, 'services'));
          const mapping: Record<string, string> = {};
          prodSnap.docs.forEach(docSnap => {
            const d = docSnap.data();
            if (d.category) {
              mapping[docSnap.id] = d.category;
              mapping[d.name] = d.category;
            }
          });
          servSnap.docs.forEach(docSnap => {
            const d = docSnap.data();
            if (d.category) {
              mapping[docSnap.id] = d.category;
              mapping[d.name] = d.category;
            }
          });
          setProductCategoryMap(mapping);
        } catch (err) {
          console.error("Error loading products/services category map:", err);
        }
      };
      loadCatalogMeta();

      return () => unsubOrders();
    }
  }, [activeTab]);
  const [franchiseTerms, setFranchiseTerms] = useState({
    renewalDeadline: 'August 05',
    profitPercent: 25,
    mainBranch: 'Khammam HQ',
    founder: 'Tarun Bandi',
    generalTerms: '1. No misuse of brand name. 2. 25% profit share mandatory. 3. Physical agreement required annually. 4. Service excellence is non-negotiable.'
  });
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    city: '',
    district: '',
    state: 'Telangana',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    adminId: '', // Should be linked to a real user UID
    pincodes: '', // Added for regional control
    agreementExpiry: (() => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const aug5 = new Date(currentYear, 7, 5); // Month 7 is August (0-indexed)
      if (today > aug5) {
        return new Date(currentYear + 1, 7, 5).toISOString().split('T')[0];
      }
      return aug5.toISOString().split('T')[0];
    })(),
    revenueTarget: 50000,
    status: 'Active' as 'Active' | 'Offline'
  });


  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Branch name is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.location.trim()) errors.location = 'Primary service area is required';
    if (!formData.adminName.trim()) errors.adminName = 'Admin name is required';
    if (!formData.adminPhone.trim() || formData.adminPhone.length < 10) errors.adminPhone = 'Valid phone is required';
    if (formData.adminEmail && !formData.adminEmail.includes('@')) errors.adminEmail = 'Valid email is required';
    if (!formData.agreementExpiry) errors.agreementExpiry = 'Expiry date is required';
    
    // Cross-reference entered pincodes to prevent overlapping service coverage zones
    const conflicts = getPincodeConflicts(formData.pincodes, editingBranch?.id);
    if (conflicts.length > 0) {
      errors.pincodes = `Coverage overlap detected! Pincode(s) ${conflicts.map(c => c.pincode).join(', ')} already assigned to: ${[...new Set(conflicts.map(c => c.branchName))].join(', ')}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    // Persistent terms from settings/franchise_policy
    const unsubTerms = onSnapshot(doc(db, 'settings', 'franchise_policy'), (snap) => {
      if (snap.exists()) {
        setFranchiseTerms(snap.data() as any);
      }
    });

    const unsub = onSnapshot(collection(db, 'branches'), (snapshot) => {
      const branchData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Branch[];
      setBranches(branchData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'branches');
      setLoading(false);
    });

    const unsubZones = onSnapshot(collection(db, 'coverage_zones'), (snapshot) => {
      const zonesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomZones(zonesData);
    });

    return () => {
      unsubTerms();
      unsub();
      unsubZones();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const pincodeArray = formData.pincodes.split(',').map(p => p.trim()).filter(Boolean);
      const branchData = {
        ...formData,
        pincodes: pincodeArray,
        revenueTarget: Number(formData.revenueTarget) || 50000,
        updatedAt: serverTimestamp()
      };

      if (editingBranch) {
        await updateDoc(doc(db, 'branches', editingBranch.id), branchData);
        
        if (formData.adminId) {
          await updateDoc(doc(db, 'users', formData.adminId), {
            role: 'branchAdmin',
            branchId: editingBranch.id
          });
        }
        
        await logAuditAction('Branch Edit', `Edited branch '${editingBranch.name}' parameters (Target: ₹${branchData.revenueTarget})`);
        alert("Branch updated successfully!");
      } else {
        const branchRef = await addDoc(collection(db, 'branches'), {
          ...branchData,
          joinDate: serverTimestamp(),
          vendorsCount: 0,
          ordersCount: 0,
          revenue: 0,
          rating: 5.0,
          profitShare: 25,
          createdAt: serverTimestamp()
        });
        
        if (formData.adminId) {
          await updateDoc(doc(db, 'users', formData.adminId), {
            role: 'branchAdmin',
            branchId: branchRef.id
          });
        }
        
        await logAuditAction('Branch Creation', `Created new branch '${formData.name}' (Target: ₹${branchData.revenueTarget})`);
        alert("New Branch added successfully!");
      }
      setShowAddModal(false);
      setEditingBranch(null);
      setFormData({
        name: '',
        location: '',
        city: '',
        district: '',
        state: 'Telangana',
        adminName: '',
        adminPhone: '',
        adminEmail: '',
        adminId: '',
        pincodes: '',
        agreementExpiry: new Date(new Date().getFullYear() + 1, 7, 5).toISOString().split('T')[0],
        revenueTarget: 50000,
        status: 'Active'
      });
      setFormErrors({});
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'branches');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (branch: Branch) => {
    try {
      const newStatus = branch.status === 'Active' ? 'Offline' : 'Active';
      await updateDoc(doc(db, 'branches', branch.id), {
        status: newStatus
      });
      await logAuditAction('Branch Status Toggle', `Toggled branch '${branch.name}' status from '${branch.status}' to '${newStatus}'`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `branches/${branch.id}`);
    }
  };

  const deleteBranch = async (branch: Branch) => {
    if (!window.confirm(`CRITICAL: Terminate ${branch.name} franchise? All branch data will be purged and admin rights revoked.`)) return;
    try {
      if (branch.adminId) {
        await updateDoc(doc(db, 'users', branch.adminId), {
          role: 'user',
          branchId: null
        });
      }
      await deleteDoc(doc(db, 'branches', branch.id));
      await logAuditAction('Franchise Termination', `Terminated '${branch.name}' franchise and revoked admin rights for admin ID '${branch.adminId}'`);
      alert("Franchise Termination Complete.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `branches/${branch.id}`);
    }
  };


  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.adminName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm border-b border-indigo-50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-right">
            <h1 className="text-xl font-black text-slate-900 italic tracking-tighter">MASTER CONSOLE</h1>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Founder: {masterAdminName}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search branches, admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 py-4 pl-12 pr-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-indigo-400 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Branch</span>
          </button>
        </div>
      </div>

        <div className="flex gap-4 mt-6 overflow-x-auto scrollbar-hide pb-2">
          <button 
            onClick={() => setActiveTab('branches')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'branches' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            All Branches
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'applications' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Applications ({franchiseApplications.length})
          </button>
          <button 
            onClick={() => setActiveTab('managers')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'managers' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Admins
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            All Members
          </button>
          <button 
            onClick={() => setActiveTab('promocodes')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'promocodes' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Promo Codes
          </button>
          <button 
            onClick={() => setActiveTab('experience')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'experience' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Experience
          </button>
          <button 
            onClick={() => setActiveTab('terms')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'terms' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            SOP Policy
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Coverage Map
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
          >
            Audit Log
          </button>
        </div>


      {activeTab === 'branches' ? (
        <>
          {/* Stats Quick View */}
          <div className="px-6 py-6 overflow-x-auto scrollbar-hide flex gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] min-w-[160px] flex-1 shadow-sm border border-indigo-50">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Branches</p>
              <h3 className="text-2xl font-black text-slate-900">{branches.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] min-w-[160px] flex-1 shadow-sm border border-emerald-50">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                <IndianRupee className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Founder Revenue (25%)</p>
              <h3 className="text-2xl font-black text-slate-900">₹{branches.reduce((acc, b) => acc + (b.revenue * 0.25), 0).toFixed(0)}</h3>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] min-w-[160px] flex-1 shadow-sm border border-amber-50">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Satisfaction</p>
              <h3 className="text-2xl font-black text-slate-900">
                {(branches.reduce((acc, b) => acc + (b.rating || 5), 0) / (branches.length || 1)).toFixed(1)}/5
              </h3>
            </div>
          </div>

          {/* Metrics Control Panel */}
          <div className="px-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${syncing ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${syncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-700 leading-none">Auto-Sync Active</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                  Last: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            <button
              id="sync-branch-data-btn"
              onClick={forceSyncBranchMetrics}
              disabled={syncing}
              className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/80 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-indigo-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-indigo-600' : 'text-indigo-500'}`} />
              {syncing ? 'Syncing...' : 'Sync Branch Data'}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-6 pb-24 space-y-4 branch-manager-list">
            {loading ? (
               <div className="py-20 text-center">
                 <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-xs font-bold text-slate-400">Loading branches...</p>
               </div>
            ) : filteredBranches.length > 0 ? (
              filteredBranches.map((branch) => (
                <motion.div 
                  layout
                  key={branch.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.015, transition: { duration: 0.15 } }}
                  className={`bg-white p-6 rounded-[2.5rem] shadow-sm space-y-6 relative overflow-hidden transition-all hover:shadow-md cursor-pointer ${
                    getDaysRemaining(branch.agreementExpiry) < 30 
                      ? 'border-2 border-rose-400 shadow-rose-50/50' 
                      : 'border border-slate-100'
                  }`}
                >
                  {branch.status === 'Offline' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ring-4 ${branch.status === 'Active' ? 'bg-indigo-600 text-white ring-indigo-50' : 'bg-slate-100 text-slate-400 ring-slate-50'}`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">{branch.name}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                              {branch.location} {branch.city && `, ${branch.city}`} {branch.state && `(${branch.state})`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                               <TrendingUp className="w-3 h-3 text-amber-500" />
                               <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">CSAT: {branch.rating || 5.0}</p>
                            </div>
                            {branch.pincodes && branch.pincodes.length > 0 && (
                               <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-indigo-400" />
                                  <p className="text-[9px] font-bold text-indigo-500 uppercase">Coverage: {branch.pincodes.slice(0, 3).join(', ')}{branch.pincodes.length > 3 ? '...' : ''}</p>
                                </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${
                      branch.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {branch.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-3xl">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <User className="w-2.5 h-2.5" /> Branch Admin
                      </p>
                      <p className="text-xs font-black text-slate-700">{branch.adminName}</p>
                      <p className="text-[10px] font-bold text-slate-400">{branch.contactPhone}</p>
                    </div>
                    {(() => {
                      const daysRem = getDaysRemaining(branch.agreementExpiry);
                      const isExpired = daysRem <= 0;
                      const isExpiringSoon = daysRem < 30;

                      return (
                        <div className={`p-4 rounded-3xl flex flex-col justify-between transition-all ${
                          isExpiringSoon 
                            ? 'bg-rose-50 border border-rose-200' 
                            : 'bg-slate-50'
                        }`}>
                          <div>
                            <div className="flex justify-between items-start">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <Calendar className="w-2.5 h-2.5 text-indigo-500" /> Agreement Expiry
                              </p>
                              {isExpiringSoon && (
                                <span className="px-1.5 py-0.5 bg-rose-600 text-white font-sans text-[7px] font-black rounded uppercase tracking-wider">
                                  {isExpired ? 'EXPIRED' : `${daysRem} DAYS`}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs font-black ${isExpiringSoon ? 'text-rose-600' : 'text-slate-700'}`}>
                              {new Date(branch.agreementExpiry).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {isExpiringSoon && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendRenewalReminder(branch);
                              }}
                              className="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[8px] tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
                            >
                              <Power className="w-2.5 h-2.5 shrink-0 animate-pulse" />
                              Send Renewal Reminder
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>


                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-4">
                       <div className="text-center">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vendors</p>
                         <p className="text-sm font-black text-slate-900">{branch.vendorsCount || 0}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Orders</p>
                         <p className="text-sm font-black text-slate-900">{branch.ordersCount || 0}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Branch Revenue</p>
                         <p className="text-sm font-black text-emerald-600">₹{(branch.revenue || 0).toFixed(0)}</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest italic">HQ Share (25%)</p>
                         <p className="text-sm font-black text-indigo-600">₹{((branch.revenue || 0) * 0.25).toFixed(0)}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => downloadBranchCSV(branch)}
                        className="p-3 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-colors"
                        title="Download Month Order History & Revenue CSV"
                       >
                         <Download className="w-5 h-5" />
                       </button>
                       <button 
                        onClick={() => toggleStatus(branch)}
                        className={`group relative flex items-center w-14 h-8 rounded-full p-1 transition-all duration-300 shadow-inner ${
                          branch.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={branch.status === 'Active' ? 'Set Offline' : 'Set Online'}
                       >
                         <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                           branch.status === 'Active' ? 'translate-x-6' : 'translate-x-0'
                         }`} />
                       </button>
                       <button 
                        onClick={() => {
                          setEditingBranch(branch);
                          setFormData({
                            name: branch.name,
                            location: branch.location,
                            city: branch.city || '',
                            district: branch.district || '',
                            state: branch.state || 'Telangana',
                            adminName: branch.adminName,
                            adminPhone: branch.contactPhone,
                            adminEmail: branch.adminEmail || '',
                            adminId: branch.adminId || '',
                            pincodes: (branch.pincodes || []).join(', '),
                            agreementExpiry: branch.agreementExpiry,
                            revenueTarget: (branch as any).revenueTarget || 50000,
                            status: branch.status
                          });
                          setShowAddModal(true);
                        }}

                        className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors"
                       >
                         <Settings className="w-5 h-5" />
                       </button>
                       <button 
                        onClick={() => deleteBranch(branch)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No branches found matching your search</p>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'applications' ? (
        <div className="flex-1 px-6 py-8 space-y-4">
          {franchiseApplications.length > 0 ? (
            franchiseApplications.map((app) => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-indigo-50 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{app.fullName}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.phone}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-2 ${
                    app.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {app.status}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Desired Location: {app.location}</p>
                  </div>
                  {app.pincode && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-indigo-400" />
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pincode Eligibility: {app.pincode}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      if (!window.confirm(`Approve ${app.fullName} for ${app.location}?`)) return;
                      try {
                        const newBranchId = `${app.location.toLowerCase().replace(/\s+/g, '_')}_${app.pincode || Date.now()}`;
                        // 1. Create Branch
                        await setDoc(doc(db, 'branches', newBranchId), {
                          name: `Local Bandi ${app.location}`,
                          location: app.location,
                          adminName: app.fullName,
                          contactPhone: app.phone,
                          adminId: app.userId,
                          status: 'Active',
                          joinDate: serverTimestamp(),
                          agreementExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                          vendorsCount: 0,
                          ordersCount: 0,
                          revenue: 0,
                          profitShare: 25,
                          createdAt: serverTimestamp()
                        });
                        // 2. Update User Profile
                        await updateDoc(doc(db, 'users', app.userId), {
                          role: 'branchAdmin',
                          branchId: newBranchId
                        });
                        // 3. Mark application as approved
                        await updateDoc(doc(db, 'partner_applications', app.id), {
                          status: 'Approved'
                        });
                        await logAuditAction('Franchise Grant', `Approved franchise application for ${app.fullName} at location '${app.location}' under new Branch ID '${newBranchId}'`);
                        alert("Franchise Grant Successful!");
                        setActiveTab('branches');

                      } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'franchise_approval'); }
                    }}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                  >
                    Grant Franchise
                  </button>
                  <button 
                    onClick={async () => {
                      if (!window.confirm("Reject this application?")) return;
                      await updateDoc(doc(db, 'partner_applications', app.id), { status: 'Rejected' });
                    }}
                    className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No pending franchise requests</p>
            </div>
          )}
        </div>
      ) : activeTab === 'managers' ? (
        <div className="flex-1 px-6 py-8 space-y-4">
          {managers.length > 0 ? (
            managers.map((manager) => (
              <div key={manager.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{manager.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{manager.phone || manager.email || 'No Contact'}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Branch</div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[8px] font-black uppercase tracking-widest inline-block">
                    {branches.find(b => b.id === manager.branchId)?.name || 'Unassigned'}
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    if (confirm(`TERMINATE ADMIN: Revoke all management rights for ${manager.name}?`)) {
                      try {
                        await updateDoc(doc(db, 'users', manager.id), { role: 'user', branchId: null });
                        alert("Admin access revoked.");
                      } catch (err) {
                        handleFirestoreError(err, OperationType.UPDATE, `users/${manager.id}`);
                      }
                    }
                  }}
                  className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"
                  title="Terminate Admin Rights"
                >
                  <Lock className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No franchise admins found</p>
            </div>
          )}
        </div>
      ) : activeTab === 'members' ? (
        <div className="flex-1 px-6 py-8 space-y-4 pb-24">
           {allUsers.length > 0 ? (
             allUsers.map((u) => (
                <div key={u.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 italic tracking-tight">{u.name || (u.phone || 'Anonymous')}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.role || 'User'} • {u.phone || u.id}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const newName = prompt("Enter new name:", u.name || "");
                          const newRole = prompt("Enter new role (User, Admin, branchAdmin, Partner, DeliveryPartner):", u.role || "User");
                          const newPhone = prompt("Enter new phone:", u.phone || "");
                          
                          const updates: any = {};
                          if (newName !== null) updates.name = newName;
                          if (newRole !== null) updates.role = newRole;
                          if (newPhone !== null) updates.phone = newPhone;
                          
                          if (Object.keys(updates).length > 0) {
                            updateDoc(doc(db, 'users', u.id), updates);
                          }
                        }}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100"
                        title="Edit Basic User Data"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                           // Open a prompt to navigate or handle marriage bureau editing
                           // For now we just show a message or we could trigger a screen change in AppContent
                           // But since we are inside BranchManager, we can't easily change AppContent state from here
                           // without a callback. For now let's just allow editing their marriageBureauId if they have one
                           const mbId = prompt("Enter Marriage Bureau Profile ID to link (leave empty to unlink):", u.marriageBureauId || "");
                           if (mbId !== null) {
                             updateDoc(doc(db, 'users', u.id), { marriageBureauId: mbId || deleteField() });
                           }
                        }}
                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100"
                        title="Manage Marriage Profile Link"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete user ${u.name || u.phone}?`)) {
                            await deleteDoc(doc(db, 'users', u.id));
                          }
                        }}
                        className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             ))
           ) : (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No users found</p>
             </div>
           )}
        </div>
      ) : activeTab === 'promocodes' ? (
        <div className="flex-1 px-6 py-8 space-y-6 pb-24">
           <div className="flex justify-between items-center px-2">
             <div>
               <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight font-sans">Active Offers & Promo Codes</h3>
               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Campaign Coupons & Referral Discount Codes</p>
             </div>
             <button 
              onClick={handleOpenNewPromo}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-150"
             >
               <Plus className="w-4 h-4" />
               New Coupon
             </button>
           </div>

           {promoCodes.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {promoCodes.map((p) => {
                 const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
                 const isActive = p.status === 'Active' || !p.status;
                 return (
                   <div key={p.id} className={`bg-white p-6 rounded-[2.5rem] border-2 border-dashed shadow-sm flex items-center justify-between group overflow-hidden relative ${
                     isExpired ? 'border-rose-100 opacity-60' : 'border-slate-100'
                   }`}>
                      <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-50 rounded-full blur-2xl opacity-40" />
                      <div className="flex items-center gap-4 relative z-10">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                           isExpired ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'
                         }`}>
                           <Ticket className="w-6 h-6" />
                         </div>
                         <div>
                           <div className="flex items-center gap-2">
                             <h4 className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">{p.code}</h4>
                             <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                               !isActive ? 'bg-slate-100 text-slate-500' :
                               isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                             }`}>
                               {!isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                             </span>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                             {p.type === 'percentage' ? `${p.value}% OFF` : `₹${p.value} OFF`} • Exp: {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : 'Never'}
                           </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                         <div className="text-right mr-1">
                           <p className="text-[8px] font-black text-indigo-500 uppercase">Usage</p>
                           <p className="text-xs font-black text-slate-900">{p.usageCount || 0}</p>
                         </div>
                         <button 
                           onClick={() => handleOpenEditPromo(p)}
                           className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                           title="Edit Coupon Settings"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={async () => {
                             if (confirm(`Delete coupon ${p.code}?`)) {
                               await deleteDoc(doc(db, 'promoCodes', p.id));
                             }
                           }}
                           className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                           title="Delete Coupon"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 );
               })}
             </div>
           ) : (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <FileText className="w-16 h-16 text-slate-100 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active promo codes</p>
             </div>
           )}
        </div>
      ) : activeTab === 'experience' ? (
        <div className="flex-1 px-6 py-8 space-y-4">
           {feedbacks.length > 0 ? (
             feedbacks.map((fb, i) => (
                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start gap-4 hover:border-indigo-500 transition-all cursor-pointer">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <p className="font-black text-slate-900 italic tracking-tight">{fb.userName || 'Anonymous User'}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(fb.lastMessageTimestamp).toLocaleDateString()}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2">
                       {fb.messages?.[fb.messages.length - 1]?.text || 'No message content'}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Verified Customer</span>
                    </div>
                  </div>
                </div>
             ))
           ) : (
             <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
               <HeartHandshake className="w-16 h-16 text-slate-100 mx-auto mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No customer feedback logs found</p>
             </div>
           )}
        </div>
      ) : activeTab === 'terms' ? (
        <div className="flex-1 px-6 py-8 space-y-6 pb-24">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50 space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 italic tracking-tight">Master Agreement</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Franchise Terms & Conditions</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-[2rem]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Annual Renewal</p>
                    <p className="text-sm font-black text-indigo-600">Before {franchiseTerms.renewalDeadline}</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 leading-tight">Must visit Khammam Main Branch for signature.</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-[2rem]">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Profit Transfer</p>
                    <p className="text-sm font-black text-emerald-600">{franchiseTerms.profitPercent}% of GTV</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 leading-tight">Due on 1st of every month to Khammam HQ.</p>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Standard Operating Procedures (SOP)</label>
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 min-h-[200px]">
                    <textarea 
                      value={franchiseTerms.generalTerms}
                      onChange={(e) => setFranchiseTerms({...franchiseTerms, generalTerms: e.target.value})}
                      className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-600 italic leading-loose h-full resize-none"
                    />
                </div>
            </div>

            <button 
              onClick={async () => {
                try {
                  await setDoc(doc(db, 'settings', 'franchise_policy'), franchiseTerms);
                  alert("Legal terms updated for all branches!");
                } catch(e) { handleFirestoreError(e, OperationType.UPDATE, 'settings/franchise_policy'); }
              }}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200"
            >
              Update Global Terms
            </button>
          </div>

          <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
             <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
             <p className="text-[11px] font-black text-amber-800 italic leading-relaxed">
               "As Founder (Master Admin), you have the sole right to terminate any franchise agreement if the 'Local Bandi' brand name is misused or if the quality standards are not met."
             </p>
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="flex-1 px-6 py-8 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Active Branch Performance</h3>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Comparative Analytics Dashboard</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Operational Gross Receipts</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">₹{(branches.reduce((acc, b) => acc + (b.revenue || 0), 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">HQ Cumulative Share (25%)</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-600">₹{(branches.reduce((acc, b) => acc + ((b.revenue || 0) * 0.25), 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="p-5 bg-sky-50/50 rounded-3xl border border-sky-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Target Attainment Index</p>
                <div className="flex items-baseline gap-1">
                  {(() => {
                    const totalRev = branches.reduce((acc, b) => acc + (b.revenue || 0), 0);
                    const totalTarget = branches.reduce((acc, b) => acc + ((b as any).revenueTarget || 50000), 0);
                    const attainment = totalTarget > 0 ? (totalRev / totalTarget) * 100 : 0;
                    return (
                      <span className="text-xl font-black text-slate-900">{attainment.toFixed(1)}%</span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Live Periodic Earnings Selector & Breakdown Summary */}
            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Financial Reconciliation Hub</span>
                  <h4 className="text-lg font-black uppercase italic tracking-tight font-sans">HQ & Branch Periodic Audits</h4>
                </div>
                
                {/* Period Selector Tabs */}
                <div className="bg-slate-800/80 p-1 rounded-2xl border border-slate-700/50 flex gap-1 z-10 self-start sm:self-auto">
                  {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setEarningsPeriod(period)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-150 ${
                        earningsPeriod === period 
                          ? 'bg-yellow-400 text-slate-950 font-black shadow-lg shadow-yellow-400/20' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats Computation Grid */}
              {(() => {
                const filteredOrders = allOrders.filter(order => {
                  const orderDate = order.createdAt ? new Date(order.createdAt) : 
                                   order.timestamp?.toDate ? order.timestamp.toDate() : null;
                  if (!orderDate) return false;
                  const now = new Date();
                  if (earningsPeriod === 'daily') {
                    return orderDate.toDateString() === now.toDateString();
                  }
                  if (earningsPeriod === 'weekly') {
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return orderDate >= oneWeekAgo;
                  }
                  if (earningsPeriod === 'monthly') {
                    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return orderDate >= oneMonthAgo;
                  }
                  if (earningsPeriod === 'yearly') {
                    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    return orderDate >= oneYearAgo;
                  }
                  return false;
                });

                const codOrders = filteredOrders.filter(o => {
                  const pm = String(o.paymentMode || o.paymentMethod || 'COD').toUpperCase();
                  return pm === 'COD' || pm === 'CASH' || pm.includes('COD') || pm.includes('DELIVERY');
                });

                const onlineOrders = filteredOrders.filter(o => {
                  const pm = String(o.paymentMode || o.paymentMethod || '').toUpperCase();
                  return pm !== 'COD' && pm !== 'CASH' && !pm.includes('COD') && !pm.includes('DELIVERY') && pm !== '';
                });

                const totalMoney = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
                const codMoney = codOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
                const onlineMoney = onlineOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/30 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Gross Revenue ({earningsPeriod})</p>
                          <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30">Total</span>
                        </div>
                        <span className="text-3xl font-black text-white font-sans">₹{totalMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                        <span>Total Orders:</span>
                        <span className="font-extrabold text-white">{filteredOrders.length}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/30 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Cash on Delivery (COD)</p>
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">COD</span>
                        </div>
                        <span className="text-3xl font-black text-amber-400 font-sans">₹{codMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                        <span>COD Count:</span>
                        <span className="font-extrabold text-white">{codOrders.length}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700/30 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Online / UPI Paid</p>
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">Online</span>
                        </div>
                        <span className="text-3xl font-black text-emerald-400 font-sans">₹{onlineMoney.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
                        <span>Online Count:</span>
                        <span className="font-extrabold text-white">{onlineOrders.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="w-full h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branches.map(b => ({
                    name: b.name.replace("Local Bandi", "").trim(),
                    Revenue: b.revenue || 0,
                    Target: (b as any).revenueTarget || 50000,
                  }))}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="black" />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight="black" />
                  <Tooltip 
                    formatter={(value: any) => `₹${Number(value).toLocaleString()}`} 
                    contentStyle={{ 
                      borderRadius: '1.5rem', 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                      fontFamily: 'Inter, sans-serif'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  <Bar dataKey="Revenue" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Target" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Segmented Performance Insights: Daily Order Volumes & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Daily Order Volume */}
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Operational Velocity</span>
                  <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight mb-4">Daily Order Volume (Last 30 Days)</h4>
                </div>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getDailyOrderVolumeData()} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="dateStr" stroke="#64748b" fontSize={9} fontWeight="black" />
                      <YAxis stroke="#64748b" fontSize={9} fontWeight="black" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '1rem', 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                          fontFamily: 'Inter, sans-serif'
                        }} 
                      />
                      <Line type="monotone" dataKey="Order Volume" stroke="#6366F1" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Segment Revenue per Category */}
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                <div>
                  <span className="text-[9.5px] font-black text-emerald-500 uppercase tracking-widest block mb-1">Segment Penetration</span>
                  <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight mb-4">Revenue per Category (Last 30 Days)</h4>
                </div>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCategoryRevenueData()} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="categoryName" stroke="#64748b" fontSize={9} fontWeight="black" />
                      <YAxis stroke="#64748b" fontSize={9} fontWeight="black" />
                      <Tooltip 
                        formatter={(value: any) => `₹${Number(value).toLocaleString()}`} 
                        contentStyle={{ 
                          borderRadius: '1rem', 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                          fontFamily: 'Inter, sans-serif'
                        }} 
                      />
                      <Bar dataKey="Revenue (₹)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'map' ? (
        <div className="flex-1 px-6 py-8 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight font-sans">Regional Pincode Coverage Map</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5 font-semibold">Coverage Circles & Pincode Service Gaps</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  id="btn-use-current-location"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all"
                >
                  <span className={`w-2 h-2 rounded-full ${locating ? 'bg-indigo-400 animate-ping' : 'bg-emerald-400'}`} />
                  {locating ? 'Locating...' : 'Use Current Live Location'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkEditMode(!isBulkEditMode)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${
                    isBulkEditMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' 
                      : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-slate-100'
                  }`}
                >
                  <Settings className={`w-3.5 h-3.5 ${isBulkEditMode ? 'animate-spin' : ''}`} />
                  {isBulkEditMode ? 'Exit Bulk Edit' : 'Bulk Edit Zones'}
                </button>

                <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100 text-[8px] font-black uppercase tracking-wider text-indigo-600">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                  Coverage Area
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 text-[8px] font-black uppercase tracking-wider text-amber-600">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  Gaps / Untapped Area
                </span>
              </div>
            </div>

            {isBulkEditMode && (
              <div className="p-5 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl flex items-start gap-3 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-indigo-950 uppercase tracking-wide leading-none mb-1">Bulk Zone Editing Enabled</p>
                  <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">
                    Adjust boundaries for multiple areas at once: Click the Leaflet <span className="underline font-black">Edit layers (✏️)</span> icon on the map to show vertex adjusting handles on all shapes, drag to rescale, then click <span className="underline font-black text-indigo-600">Save</span> inside the map toolbar to save them dynamically to the cloud database!
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Map Column */}
              <div className="lg:col-span-3 h-[450px] relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-inner z-[1]">
                <MapContainer 
                  center={mapCenter}
                  zoom={mapZoom} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  <ChangeMapCenter center={mapCenter} zoom={mapZoom} />

                  <DrawControl 
                    onCreated={handleZoneCreated}
                    customZones={customZones}
                    isBulkEditActive={isBulkEditMode}
                    onBulkSave={handleBulkSaveZones}
                    onBulkDelete={handleBulkDeleteZones}
                  />

                  {/* Render custom drawn coverage zones only when not in bulk edit mode */}
                  {!isBulkEditMode && customZones.map((zone) => {
                    const pathOptions = {
                      color: '#6366f1',
                      fillColor: '#6366f1',
                      fillOpacity: 0.2,
                      weight: 3
                    };
                    if (zone.type === 'circle') {
                      return (
                        <Circle 
                          key={zone.id}
                          center={zone.center}
                          radius={zone.radius}
                          pathOptions={{ ...pathOptions, color: '#f59e0b', fillColor: '#f59e0b' }}
                          eventHandlers={{
                            click: (e) => {
                              L.DomEvent.stopPropagation(e as any);
                              if (window.confirm(`Are you sure you want to delete the custom coverage zone "${zone.name}"?`)) {
                                handleDeleteZone(zone.id, zone.name);
                              }
                            }
                          }}
                        >
                          <Popup>
                            <div className="font-sans text-xs p-1">
                              <p className="font-black text-slate-900">{zone.name}</p>
                              <p className="font-bold text-amber-600 text-[10px]">Custom Coverage Zone</p>
                              <p className="text-[9px] text-slate-400 font-medium mb-1">Radius: {Math.round(zone.radius)}m</p>
                              <p className="text-[9px] font-black text-slate-500 italic mb-2">💡 Click shape anywhere on map to delete directly!</p>
                              <button
                                type="button"
                                onClick={() => handleDeleteZone(zone.id, zone.name)}
                                className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black uppercase tracking-wider text-[9px] rounded-lg transition-colors"
                              >
                                Delete Zone
                              </button>
                            </div>
                          </Popup>
                        </Circle>
                      );
                    } else if (zone.type === 'rectangle') {
                      return (
                        <Rectangle 
                          key={zone.id}
                          bounds={zone.bounds}
                          pathOptions={{ ...pathOptions, color: '#10b981', fillColor: '#10b981' }}
                          eventHandlers={{
                            click: (e) => {
                              L.DomEvent.stopPropagation(e as any);
                              if (window.confirm(`Are you sure you want to delete the custom coverage zone "${zone.name}"?`)) {
                                handleDeleteZone(zone.id, zone.name);
                              }
                            }
                          }}
                        >
                          <Popup>
                            <div className="font-sans text-xs p-1">
                              <p className="font-black text-slate-900">{zone.name}</p>
                              <p className="font-bold text-emerald-600 text-[10px] mb-1">Custom Rectangle Zone</p>
                              <p className="text-[9px] font-black text-slate-500 italic mb-2">💡 Click shape anywhere on map to delete directly!</p>
                              <button
                                type="button"
                                onClick={() => handleDeleteZone(zone.id, zone.name)}
                                className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black uppercase tracking-wider text-[9px] rounded-lg transition-colors"
                              >
                                Delete Zone
                              </button>
                            </div>
                          </Popup>
                        </Rectangle>
                      );
                    } else if (zone.type === 'polygon') {
                      return (
                        <Polygon 
                          key={zone.id}
                          positions={zone.positions}
                          pathOptions={pathOptions}
                          eventHandlers={{
                            click: (e) => {
                              L.DomEvent.stopPropagation(e as any);
                              if (window.confirm(`Are you sure you want to delete the custom coverage zone "${zone.name}"?`)) {
                                handleDeleteZone(zone.id, zone.name);
                              }
                            }
                          }}
                        >
                          <Popup>
                            <div className="font-sans text-xs p-1">
                              <p className="font-black text-slate-900">{zone.name}</p>
                              <p className="font-bold text-indigo-600 text-[10px] mb-1">Custom Polygon Zone</p>
                              <p className="text-[9px] font-black text-slate-500 italic mb-2">💡 Click shape anywhere on map to delete directly!</p>
                              <button
                                type="button"
                                onClick={() => handleDeleteZone(zone.id, zone.name)}
                                className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black uppercase tracking-wider text-[9px] rounded-lg transition-colors"
                              >
                                Delete Zone
                              </button>
                            </div>
                          </Popup>
                        </Polygon>
                      );
                    }
                    return null;
                  })}
                  
                  {branches.filter(b => b.status === 'Active').map((b, bIdx) => {
                    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                    const color = colors[bIdx % colors.length];
                    const isSelected = selectedMapBranchId === b.id;

                    return (
                      <React.Fragment key={b.id}>
                        {/* Pincode coverage circles */}
                        {(b.pincodes || []).map((pinCode, pIdx) => {
                          const markerCoords = getPincodeCoords(pinCode, b.name);
                          return (
                            <React.Fragment key={`${b.id}-pin-${pIdx}`}>
                              <Circle 
                                center={markerCoords}
                                radius={4000} // radius in meters
                                pathOptions={{
                                  color: color,
                                  fillColor: color,
                                  fillOpacity: isSelected ? 0.35 : 0.15,
                                  weight: isSelected ? 3 : 2,
                                  dashArray: isSelected ? undefined : "5, 5"
                                }}
                              >
                                <Popup>
                                  <div className="font-sans text-xs">
                                    <p className="font-black text-slate-900">{b.name} {isSelected && '(Selected)'}</p>
                                    <p className="font-bold text-indigo-600">Pincode Area: {pinCode}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">Coverage Radius: 4 km</p>
                                  </div>
                                </Popup>
                              </Circle>
                              
                              {/* Pulse animation for selected branch coverages */}
                              {isSelected && (
                                <Circle 
                                  center={markerCoords}
                                  radius={4000 + pulseDelta}
                                  pathOptions={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.08 * (1 - Math.abs(pulseDelta) / 600),
                                    weight: 1.5,
                                    interactive: false
                                  }}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* Branch principal marker */}
                        {b.pincodes && b.pincodes.length > 0 && (
                          <Marker 
                            position={getPincodeCoords(b.pincodes[0], b.name)}
                            eventHandlers={{
                              click: () => {
                                setSelectedMapBranchId(b.id);
                              }
                            }}
                            icon={L.divIcon({
                              className: 'custom-div-icon',
                              html: `<div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 12px; border: 3.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: white;">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                      </svg>
                                    </div>`,
                              iconSize: [34, 34],
                              iconAnchor: [17, 17],
                            })}
                          >
                            <Popup>
                              <div className="font-sans text-xs">
                                <h4 className="font-black text-slate-900">{b.name}</h4>
                                <p className="font-bold text-slate-500 uppercase text-[9px]">Admin: {b.adminName}</p>
                                <p className="font-bold text-emerald-600 text-[10px] mt-1">GTV Monthly: ₹{(b.revenue || 0).toLocaleString()}</p>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Sidebar Column */}
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col justify-between space-y-4 max-h-[450px] overflow-y-auto scrollbar-hide">
                 <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mb-3 ml-1">Active Branches</h4>
                   <div className="space-y-1.5">
                     {branches.filter(b => b.status === 'Active').map((b, bIdx) => {
                       const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                       const color = colors[bIdx % colors.length];
                       const isSelected = selectedMapBranchId === b.id;
                       
                       return (
                         <div 
                           key={b.id}
                           onClick={() => {
                             setSelectedMapBranchId(b.id);
                             if (b.pincodes && b.pincodes.length > 0) {
                               const coords = getPincodeCoords(b.pincodes[0], b.name);
                               setMapCenter(coords);
                               setMapZoom(11);
                             }
                           }}
                           className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 text-white border-transparent' : 'bg-white hover:bg-slate-100 border-slate-200/60'}`}
                         >
                           <div className="flex items-center gap-2">
                             <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: isSelected ? 'white' : color }} />
                             <span className="text-[11px] font-black truncate">{b.name}</span>
                           </div>
                           <p className={`text-[9px] font-bold mt-1 uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                             {b.pincodes?.length || 0} Pincodes covered
                           </p>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                 {customZones.length > 0 && (
                   <div className="pt-2 border-t border-slate-200">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 mb-3 ml-1">Custom Zones</h4>
                     <div className="space-y-1.5">
                       {customZones.map((zone) => {
                         return (
                           <div 
                             key={zone.id}
                             className="p-3 bg-white hover:bg-slate-100/50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-2"
                           >
                             <div 
                               onClick={() => {
                                 let coords: [number, number] = [17.2473, 80.1514];
                                 if (zone.type === 'circle') coords = zone.center;
                                 else if (zone.type === 'rectangle') coords = zone.bounds[0];
                                 else if (zone.type === 'polygon') coords = zone.positions[0];
                                 setMapCenter(coords);
                                 setMapZoom(12);
                               }}
                               className="flex-1 cursor-pointer min-w-0"
                             >
                               <p className="text-[11px] font-black truncate text-slate-800">{zone.name}</p>
                               <span className="text-[8px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-widest leading-none">{zone.type}</span>
                             </div>
                             <button 
                               type="button"
                               onClick={(el) => {
                                 el.stopPropagation();
                                 handleDeleteZone(zone.id, zone.name);
                               }}
                               className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 transition"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> Untapped Regional Market Gaps
                </h4>
                <p className="text-[10px] text-slate-500 font-bold max-w-lg leading-relaxed uppercase">
                  Regions outside the mapped radii aren't serviced. We have identified these high-yield unserviced pincodes in Telangana for expansion:
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { pin: "507004", name: "Raghunadhapalem" },
                  { pin: "507115", name: "Wyra Rural" },
                  { pin: "500030", name: "Rajendranagar" },
                  { pin: "506003", name: "Hanamkonda East" }
                ].map((gap, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200/60 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg inline-block w-fit mb-1">{gap.pin}</span>
                    <span className="text-[9.5px] font-extrabold text-slate-700 uppercase tracking-tight leading-none">{gap.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="flex-1 px-6 py-8 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight font-sans">Super Admin Audit Ledger</h3>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Persistent Record of System Mutated States</p>
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Realtime Feed Connected</span>
              </div>
            </div>

            {/* Action Type Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Filter Logs:</span>
                <div className="flex flex-wrap gap-1">
                  {(['All', 'Payout', 'Franchise Grant', 'Inventory Update'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAuditActionFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                        auditActionFilter === filter 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-100/50'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                Showing {
                  (() => {
                    const filtered = auditLogs.filter(log => {
                      if (auditActionFilter === 'All') return true;
                      const action = String(log.actionType || log.action || '').toLowerCase();
                      const details = String(log.details || '').toLowerCase();
                      if (auditActionFilter === 'Payout') {
                        return action.includes('payout') || action.includes('settlement') || action.includes('financial') || details.includes('disbursed') || details.includes('payout');
                      }
                      if (auditActionFilter === 'Franchise Grant') {
                        return action.includes('franchise grant') || action.includes('approve franchise') || details.includes('franchise application') || details.includes('approved franchise');
                      }
                      if (auditActionFilter === 'Inventory Update') {
                        return action.includes('inventory') || action.includes('product') || action.includes('item') || details.includes('inventory') || details.includes('product') || details.includes('item');
                      }
                      return false;
                    });
                    return filtered.length;
                  })()
                } of {auditLogs.length} Records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pl-4">Operation</th>
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pl-4">Target Details</th>
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 pl-4">Mutated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const filteredList = auditLogs.filter(log => {
                      if (auditActionFilter === 'All') return true;
                      const action = String(log.actionType || log.action || '').toLowerCase();
                      const details = String(log.details || '').toLowerCase();
                      if (auditActionFilter === 'Payout') {
                        return action.includes('payout') || action.includes('settlement') || action.includes('financial') || details.includes('disbursed') || details.includes('payout');
                      }
                      if (auditActionFilter === 'Franchise Grant') {
                        return action.includes('franchise grant') || action.includes('approve franchise') || details.includes('franchise application') || details.includes('approved franchise');
                      }
                      if (auditActionFilter === 'Inventory Update') {
                        return action.includes('inventory') || action.includes('product') || action.includes('item') || details.includes('inventory') || details.includes('product') || details.includes('item');
                      }
                      return false;
                    });

                    return filteredList.length > 0 ? (
                      filteredList.map((log) => {
                        const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : 
                                        log.timestamp ? new Date(log.timestamp) : new Date();
                        
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 text-[10px] font-medium text-slate-500 font-mono">
                              {logDate.toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            <td className="py-4 pl-4">
                              <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg ${
                                log.actionType?.includes('Creation') ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                log.actionType?.includes('Termination') ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                log.actionType?.includes('Toggle') ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-slate-50 text-slate-700 border border-slate-200'
                              }`}>
                                {log.actionType || log.action || 'Unknown'}
                              </span>
                            </td>
                            <td className="py-4 pl-4 text-xs font-bold text-slate-700 max-w-sm truncate italic">
                              "{log.details}"
                            </td>
                            <td className="py-4 pl-4 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                              {log.adminName || log.user || 'Super Admin'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400 text-xs font-bold">
                          No {auditActionFilter !== 'All' ? auditActionFilter : ''} activity records matched the filter criteria
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}


      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">
                    {editingBranch ? 'Update Branch' : 'New Franchise'}
                  </h2>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Master Authorization Required</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-slate-100 rounded-2xl text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Branch Name & Location</label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <input 
                        required
                        placeholder="e.g. Local Bandi Hyderabad"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.name ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                      />
                      {formErrors.name && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.name}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <input 
                          required
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.city ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                        />
                        {formErrors.city && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.city}</p>}
                      </div>
                      <input 
                        required
                        placeholder="District"
                        value={formData.district}
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                        className="bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    
                    <select 
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Other">Other State</option>
                    </select>

                    <div className="space-y-1">
                      <input 
                        required
                        placeholder="Primary Service Area (e.g. Madhapur, HiTech City)"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.location ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                      />
                      {formErrors.location && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.location}</p>}
                    </div>

                    <div className="space-y-1">
                      <input 
                        placeholder="Assigned Pincodes (comma separated, e.g. 500001, 500002)"
                        value={formData.pincodes}
                        onChange={(e) => setFormData({...formData, pincodes: e.target.value})}
                        className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${
                          getPincodeConflicts(formData.pincodes, editingBranch?.id).length > 0 
                            ? 'border-rose-400 bg-rose-50/20' 
                            : 'border-transparent focus:border-indigo-500'
                        }`}
                      />
                      {(() => {
                        const conflicts = getPincodeConflicts(formData.pincodes, editingBranch?.id);
                        if (conflicts.length > 0) {
                          return (
                            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                              <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Overlapping Coverage Blocked!
                              </p>
                              <p className="text-[9px] font-bold text-rose-700 leading-tight mt-1 uppercase">
                                Pincode(s) <span className="underline">{conflicts.map(c => c.pincode).join(', ')}</span> already assigned to: <span className="font-extrabold text-rose-950 italic">{[...new Set(conflicts.map(c => c.branchName))].join(', ')}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Monthly Revenue Target (₹)</label>
                      <input 
                        required
                        type="number"
                        placeholder="e.g. 50000"
                        value={formData.revenueTarget}
                        onChange={(e) => setFormData({...formData, revenueTarget: Number(e.target.value) || 0})}
                        className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Franchise Admin Details</label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <input 
                        required
                        placeholder="Admin Full Name"
                        value={formData.adminName}
                        onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                        className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.adminName ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                      />
                      {formErrors.adminName && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.adminName}</p>}
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <input 
                          required
                          placeholder="Admin Phone"
                          value={formData.adminPhone}
                          onChange={(e) => setFormData({...formData, adminPhone: e.target.value})}
                          className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.adminPhone ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                        />
                        {formErrors.adminPhone && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.adminPhone}</p>}
                      </div>
                      <div className="flex-1 space-y-1">
                        <input 
                          placeholder="Admin Email (Optional)"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                          className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.adminEmail ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                        />
                        {formErrors.adminEmail && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.adminEmail}</p>}
                      </div>
                    </div>
                    <input 
                      placeholder="Admin User UID (Optional)"
                        value={formData.adminId}
                        onChange={(e) => setFormData({...formData, adminId: e.target.value})}
                        className="flex-1 bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                      />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Agreement Expiry</label>
                    <input 
                      required
                      type="date"
                      value={formData.agreementExpiry}
                      onChange={(e) => setFormData({...formData, agreementExpiry: e.target.value})}
                      className={`w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 outline-none transition-all ${formErrors.agreementExpiry ? 'border-rose-400' : 'border-transparent focus:border-indigo-500'}`}
                    />
                    {formErrors.agreementExpiry && <p className="text-[9px] font-bold text-rose-500 ml-1 italic">{formErrors.agreementExpiry}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Offline'})}
                      className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="Active">Operational (Active)</option>
                      <option value="Offline">Offline / Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-indigo-800 leading-relaxed italic">
                      "By adding this branch, the admin agrees to share 25% of total revenue with Local Bandi Multi Services Master HQ (Khammam). The agreement must be renewed annually before August 5th."
                    </p>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px]"
                >
                  <FileText className="w-5 h-5" />
                  {editingBranch ? 'Save Changes' : 'Grant Franchise Rights'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Zone Naming Modal */}
      <AnimatePresence>
        {showZoneModal && pendingZone && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 flex flex-col">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowZoneModal(false);
                setPendingZone(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
            >
              <h3 className="text-xl font-black text-slate-900 italic tracking-tighter mb-2">Save Custom Coverage Zone</h3>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">Visual Region Successfully Captured</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Zone Name / Reference</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Khammam bypass route, North Sector"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Associate with Branch (Optional)</label>
                  <select 
                    value={zoneBranchId}
                    onChange={(e) => setZoneBranchId(e.target.value)}
                    className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-slate-900"
                  >
                    <option value="">-- Let Zone be Independent --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => {
                    setShowZoneModal(false);
                    setPendingZone(null);
                  }}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveZone}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 transition-colors"
                >
                  Save Zone
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promo Code Add/Edit Modal */}
      <AnimatePresence>
        {showPromoModal && (
          <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPromoModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">
                    {editingPromo ? 'Edit Coupon' : 'New Coupon Code'}
                  </h2>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Master Campaign Authorization</p>
                </div>
                <button 
                  onClick={() => setShowPromoModal(false)}
                  className="p-3 bg-slate-100 rounded-2xl text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePromo} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Promo Code Name</label>
                  <input 
                    required
                    placeholder="e.g. LOKAL50"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({...promoForm, code: e.target.value})}
                    className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-slate-900 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Value / Offset</label>
                    <input 
                      required
                      type="number"
                      placeholder="e.g. 50"
                      value={promoForm.value}
                      onChange={(e) => setPromoForm({...promoForm, value: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Offset Type</label>
                    <select 
                      value={promoForm.type}
                      onChange={(e) => setPromoForm({...promoForm, type: e.target.value as 'percentage' | 'fixed'})}
                      className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Rupees (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Expiry Date</label>
                    <input 
                      required
                      type="date"
                      value={promoForm.expiryDate}
                      onChange={(e) => setPromoForm({...promoForm, expiryDate: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Status</label>
                    <select 
                      value={promoForm.status}
                      onChange={(e) => setPromoForm({...promoForm, status: e.target.value as 'Active' | 'Inactive'})}
                      className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-500 outline-none transition-all text-slate-900"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px]"
                >
                  <Ticket className="w-5 h-5" />
                  {editingPromo ? 'Save Coupon' : 'Create Coupon'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
