import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Flame,
  Users,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Check,
  Zap,
  Tag,
  ShieldCheck,
  Eye,
  Percent,
  Clock,
  HelpCircle,
  Gift
} from 'lucide-react';
import {
  AttractionCampaignsConfig,
  ScratchRewardItem,
  FlashDropItem,
  DEFAULT_ATTRACTION_CONFIG,
  getLocalAttractionConfig,
  saveAttractionConfigToFirestore,
  subscribeToAttractionConfig
} from '../types/attractionCampaigns';
import { ScratchCardModal } from './ScratchCardModal';

interface AttractionCampaignsManagerProps {
  adminEmail?: string;
  onToast?: (msg: string) => void;
}

const COLOR_PRESETS = [
  { label: 'Gold Amber', value: 'from-amber-400 to-yellow-500' },
  { label: 'Emerald Mint', value: 'from-emerald-400 to-teal-500' },
  { label: 'Purple Indigo', value: 'from-purple-400 to-indigo-500' },
  { label: 'Ruby Rose', value: 'from-rose-400 to-red-500' },
  { label: 'Cyan Blue', value: 'from-cyan-400 to-blue-500' },
  { label: 'Sunset Orange', value: 'from-orange-400 to-amber-600' },
];

const HOUSEHOLD_PRESETS: FlashDropItem[] = [
  {
    id: 'preset-floor-cleaner',
    name: 'Citrus Fresh Antibacterial Floor Cleaner (2 Litre)',
    category: 'household',
    unit: '2 Litre Bottle',
    mrp: 198,
    price: 99,
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '8 left in stock',
    isActive: true
  },
  {
    id: 'preset-dishwash-gel',
    name: 'Concentrated Lemon Power Dish Wash Gel (1 Litre)',
    category: 'household',
    unit: '1 Litre Squeeze Bottle',
    mrp: 150,
    price: 75,
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '12 left in stock',
    isActive: true
  },
  {
    id: 'preset-fabric-conditioner',
    name: 'Spring Blossom Soft Care Fabric Conditioner (1 Litre)',
    category: 'household',
    unit: '1 Litre Ergonomic Pack',
    mrp: 220,
    price: 110,
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '6 left in stock',
    isActive: true
  },
  {
    id: 'preset-surface-disinfectant',
    name: 'Multi-Surface Herbal Disinfectant Spray (500ml)',
    category: 'household',
    unit: '500 ml Trigger Spray',
    mrp: 180,
    price: 90,
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '15 left in stock',
    isActive: true
  },
  {
    id: 'preset-detergent-liquid',
    name: 'Deep Clean Enzymatic Detergent Liquid (1 Litre)',
    category: 'household',
    unit: '1 Litre Jug',
    mrp: 240,
    price: 120,
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '10 left in stock',
    isActive: true
  }
];

export const AttractionCampaignsManager: React.FC<AttractionCampaignsManagerProps> = ({
  adminEmail,
  onToast
}) => {
  const [config, setConfig] = useState<AttractionCampaignsConfig>(getLocalAttractionConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'scratch' | 'flash' | 'pool'>('all');

  // Reward Edit/Add Modal state
  const [editingReward, setEditingReward] = useState<ScratchRewardItem | null>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [showTestScratchModal, setShowTestScratchModal] = useState(false);

  // Flash Item Edit/Add Modal state
  const [editingFlashItem, setEditingFlashItem] = useState<FlashDropItem | null>(null);
  const [isAddingFlashItem, setIsAddingFlashItem] = useState(false);

  // Form state for creating/editing a reward
  const [rewardForm, setRewardForm] = useState<ScratchRewardItem>({
    id: '',
    code: '',
    title: '',
    desc: '',
    discount: 5,
    color: 'from-amber-400 to-yellow-500',
    emoji: '🎉',
    isActive: true
  });

  // Form state for creating/editing a flash drop item
  const [flashItemForm, setFlashItemForm] = useState<FlashDropItem>({
    id: '',
    name: '',
    category: 'household',
    unit: '1 Litre Bottle',
    mrp: 198,
    price: 99,
    discount: '50% OFF',
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stock: '8 left in stock',
    isActive: true
  });

  useEffect(() => {
    const unsubscribe = subscribeToAttractionConfig((updated) => {
      setConfig(updated);
    });
    return () => unsubscribe();
  }, []);

  const triggerToast = (msg: string) => {
    if (onToast) onToast(msg);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const ok = await saveAttractionConfigToFirestore(config, adminEmail);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      triggerToast(ok ? '✅ Attraction Campaigns synced to live app!' : '✅ Saved locally!');
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      triggerToast('⚠️ Error saving campaigns');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all Customer Attraction Campaigns (Scratch Card, Flash Drop, Group Pool) to system default settings?")) {
      setConfig(DEFAULT_ATTRACTION_CONFIG);
      saveAttractionConfigToFirestore(DEFAULT_ATTRACTION_CONFIG, adminEmail);
      triggerToast('🔄 Reset to default campaigns');
    }
  };

  // Scratch Rewards Handlers
  const handleOpenAddReward = () => {
    setRewardForm({
      id: `reward-${Date.now()}`,
      code: `SAVE${Math.floor(Math.random() * 80 + 20)}`,
      title: 'SPECIAL DISCOUNT',
      desc: 'Exclusive Local Bandi Deal',
      discount: 25,
      color: 'from-amber-400 to-yellow-500',
      emoji: '🎁',
      isActive: true
    });
    setIsAddingReward(true);
    setEditingReward(null);
  };

  const handleOpenEditReward = (reward: ScratchRewardItem) => {
    setRewardForm({ ...reward });
    setEditingReward(reward);
    setIsAddingReward(false);
  };

  const handleSaveRewardForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.code.trim() || !rewardForm.title.trim()) {
      triggerToast('⚠️ Code and Title are required');
      return;
    }

    const cleanCode = rewardForm.code.toUpperCase().replace(/\s+/g, '');
    const cleanReward: ScratchRewardItem = {
      ...rewardForm,
      code: cleanCode
    };

    let updatedRewards = [...(config.scratchCard.rewards || [])];

    if (editingReward) {
      updatedRewards = updatedRewards.map(r => r.id === editingReward.id ? cleanReward : r);
      triggerToast(`✏️ Updated Reward: ${cleanCode}`);
    } else {
      updatedRewards.push(cleanReward);
      triggerToast(`➕ Added New Reward: ${cleanCode}`);
    }

    const updatedConfig: AttractionCampaignsConfig = {
      ...config,
      scratchCard: {
        ...config.scratchCard,
        rewards: updatedRewards
      }
    };

    setConfig(updatedConfig);
    saveAttractionConfigToFirestore(updatedConfig, adminEmail);
    setEditingReward(null);
    setIsAddingReward(false);
  };

  const handleDeleteReward = (rewardId: string, code: string) => {
    if (window.confirm(`Are you sure you want to permanently delete reward "${code}" from Scratch & Win?`)) {
      const updatedRewards = (config.scratchCard.rewards || []).filter(r => r.id !== rewardId);
      const updatedConfig: AttractionCampaignsConfig = {
        ...config,
        scratchCard: {
          ...config.scratchCard,
          rewards: updatedRewards
        }
      };
      setConfig(updatedConfig);
      saveAttractionConfigToFirestore(updatedConfig, adminEmail);
      triggerToast(`🗑️ Deleted reward: ${code}`);
    }
  };

  const handleToggleRewardActive = (rewardId: string) => {
    const updatedRewards = (config.scratchCard.rewards || []).map(r => {
      if (r.id === rewardId) return { ...r, isActive: !r.isActive };
      return r;
    });
    const updatedConfig: AttractionCampaignsConfig = {
      ...config,
      scratchCard: {
        ...config.scratchCard,
        rewards: updatedRewards
      }
    };
    setConfig(updatedConfig);
    saveAttractionConfigToFirestore(updatedConfig, adminEmail);
  };

  // Flash Drop Items Handlers
  const handleOpenAddFlashItem = () => {
    setFlashItemForm({
      id: `flash-item-${Date.now()}`,
      name: '',
      category: 'household',
      unit: '1 Litre Bottle',
      mrp: 198,
      price: 99,
      discount: '50% OFF',
      image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      stock: '8 left in stock',
      isActive: true
    });
    setIsAddingFlashItem(true);
    setEditingFlashItem(null);
  };

  const handleOpenEditFlashItem = (item: FlashDropItem) => {
    setFlashItemForm({ ...item });
    setEditingFlashItem(item);
    setIsAddingFlashItem(false);
  };

  const handleQuickAddPreset = (preset: FlashDropItem) => {
    const existing = (config.flashDrop.items || []).find(i => i.name.toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      triggerToast(`ℹ️ "${preset.name}" is already in Golden Hour list!`);
      return;
    }
    const newItem: FlashDropItem = {
      ...preset,
      id: `flash-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    const updatedItems = [...(config.flashDrop.items || []), newItem];
    const updatedConfig: AttractionCampaignsConfig = {
      ...config,
      flashDrop: {
        ...config.flashDrop,
        items: updatedItems
      }
    };
    setConfig(updatedConfig);
    saveAttractionConfigToFirestore(updatedConfig, adminEmail);
    triggerToast(`✨ Added "${preset.name}" to Flash Drop!`);
  };

  const handleSaveFlashItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashItemForm.name.trim()) {
      triggerToast('⚠️ Product name is required');
      return;
    }
    const cleanMrp = Number(flashItemForm.mrp) || 0;
    const cleanPrice = Number(flashItemForm.price) || 0;
    const calculatedDiscount = cleanMrp > cleanPrice && cleanMrp > 0
      ? `${Math.round(((cleanMrp - cleanPrice) / cleanMrp) * 100)}% OFF`
      : '50% OFF';

    const cleanItem: FlashDropItem = {
      ...flashItemForm,
      mrp: cleanMrp,
      price: cleanPrice,
      discount: flashItemForm.discount || calculatedDiscount
    };

    let updatedItems = [...(config.flashDrop.items || [])];
    if (editingFlashItem) {
      updatedItems = updatedItems.map(i => i.id === editingFlashItem.id ? cleanItem : i);
      triggerToast(`✏️ Updated product: ${cleanItem.name}`);
    } else {
      updatedItems.push(cleanItem);
      triggerToast(`➕ Added new product: ${cleanItem.name}`);
    }

    const updatedConfig: AttractionCampaignsConfig = {
      ...config,
      flashDrop: {
        ...config.flashDrop,
        items: updatedItems
      }
    };

    setConfig(updatedConfig);
    saveAttractionConfigToFirestore(updatedConfig, adminEmail);
    setEditingFlashItem(null);
    setIsAddingFlashItem(false);
  };

  const handleDeleteFlashItem = (itemId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from Golden Hour Flash Drop?`)) {
      const updatedItems = (config.flashDrop.items || []).filter(i => i.id !== itemId);
      const updatedConfig: AttractionCampaignsConfig = {
        ...config,
        flashDrop: {
          ...config.flashDrop,
          items: updatedItems
        }
      };
      setConfig(updatedConfig);
      saveAttractionConfigToFirestore(updatedConfig, adminEmail);
      triggerToast(`🗑️ Removed ${name}`);
    }
  };

  const handleToggleFlashItemActive = (itemId: string) => {
    const updatedItems = (config.flashDrop.items || []).map(i => {
      if (i.id === itemId) return { ...i, isActive: !(i.isActive !== false) };
      return i;
    });
    const updatedConfig: AttractionCampaignsConfig = {
      ...config,
      flashDrop: {
        ...config.flashDrop,
        items: updatedItems
      }
    };
    setConfig(updatedConfig);
    saveAttractionConfigToFirestore(updatedConfig, adminEmail);
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Banner & Global Controls */}
      <div className="relative bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border border-amber-500/30 p-6 sm:p-8 rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest font-mono">
                Growth &amp; Customer Attraction Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              🎁 Mystery Scratch Card, Flash Drop &amp; Group Pool Manager
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Master Admin has full authority to edit, configure, delete, or toggle all customer-facing promotional drivers. Changes reflect instantly on customer screens in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowTestScratchModal(true)}
              className="px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Test Scratch UI</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset all attraction features to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-350 hover:to-yellow-350 active:scale-95 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Synced to Live App!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save & Publish All'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          {[
            { id: 'all', label: 'All 3 Features', icon: Sparkles },
            { id: 'scratch', label: '1. Scratch & Win Card', icon: Gift },
            { id: 'flash', label: '2. Golden Flash Drop', icon: Flame },
            { id: 'pool', label: '3. Group Buy Pool', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 1: DAILY MYSTERY SCRATCH & WIN CARD                               */}
      {/* ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'scratch') && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-[2rem] p-6 space-y-6">
          {/* Header & Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-2xl">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Feature 1: Daily Mystery Scratch &amp; Win Card
                </h3>
                <p className="text-[11px] text-slate-400">
                  Interactive gold canvas where users swipe/scratch with finger or mouse to unlock instant discount codes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
              <button
                onClick={() => {
                  const updated: AttractionCampaignsConfig = {
                    ...config,
                    scratchCard: {
                      ...config.scratchCard,
                      isEnabled: !config.scratchCard.isEnabled
                    }
                  };
                  setConfig(updated);
                  saveAttractionConfigToFirestore(updated, adminEmail);
                  triggerToast(`Scratch Card is now ${updated.scratchCard.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  config.scratchCard.isEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-white/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${config.scratchCard.isEnabled ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'}`} />
                <span>{config.scratchCard.isEnabled ? 'Active on App' : 'Disabled'}</span>
              </button>
            </div>
          </div>

          {/* General Scratch Card Settings Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Header Badge</label>
              <input
                type="text"
                value={config.scratchCard.headerBadge}
                onChange={(e) => setConfig({
                  ...config,
                  scratchCard: { ...config.scratchCard, headerBadge: e.target.value }
                })}
                placeholder="Daily Lucky Scratch & Win"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Modal Title</label>
              <input
                type="text"
                value={config.scratchCard.title}
                onChange={(e) => setConfig({
                  ...config,
                  scratchCard: { ...config.scratchCard, title: e.target.value }
                })}
                placeholder="Scratch Your Mystery Gift!"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Min Order Subtotal (₹)</label>
              <input
                type="number"
                value={config.scratchCard.minSubtotal}
                onChange={(e) => setConfig({
                  ...config,
                  scratchCard: { ...config.scratchCard, minSubtotal: Number(e.target.value) || 0 }
                })}
                placeholder="199"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Scratch Rewards Inventory Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Scratch Rewards Pool ({config.scratchCard.rewards?.length || 0} Configured)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Customers randomly reveal one of the active rewards below when scratching. Master Admin can edit, toggle, or delete any reward.
                </p>
              </div>

              <button
                onClick={handleOpenAddReward}
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-350 active:scale-95 text-slate-950 font-black text-[10px] uppercase rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(config.scratchCard.rewards || []).map((reward) => (
                <div
                  key={reward.id}
                  className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    reward.isActive
                      ? 'bg-slate-950 border-amber-400/30 hover:border-amber-400/60'
                      : 'bg-slate-950/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{reward.emoji}</span>
                      <button
                        onClick={() => handleToggleRewardActive(reward.id)}
                        className={`px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider ${
                          reward.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                        }`}
                      >
                        {reward.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        {reward.code}
                      </span>
                      <h5 className="text-xs font-black text-white mt-1 uppercase tracking-tight">
                        {reward.title}
                      </h5>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{reward.desc}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-400">
                      Discount: <strong className="text-emerald-400">{reward.discount}%</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditReward(reward)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Edit reward details"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id, reward.code)}
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg transition-colors cursor-pointer"
                        title="Delete reward permanently"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 2: GOLDEN HOUR FLASH DROP                                         */}
      {/* ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'flash') && (
        <div className="bg-slate-900/90 border border-orange-500/30 rounded-[2rem] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-2xl">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Feature 2: Golden Hour Flash Drop Banner
                </h3>
                <p className="text-[11px] text-slate-400">
                  Limited-time urgency card on customer home screen with real-time countdown timer &amp; low-stock counter.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
              <button
                onClick={() => {
                  const updated: AttractionCampaignsConfig = {
                    ...config,
                    flashDrop: {
                      ...config.flashDrop,
                      isEnabled: !config.flashDrop.isEnabled
                    }
                  };
                  setConfig(updated);
                  saveAttractionConfigToFirestore(updated, adminEmail);
                  triggerToast(`Flash Drop is now ${updated.flashDrop.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  config.flashDrop.isEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-white/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${config.flashDrop.isEnabled ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'}`} />
                <span>{config.flashDrop.isEnabled ? 'Active on App' : 'Disabled'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Badge Tag</label>
              <input
                type="text"
                value={config.flashDrop.badge}
                onChange={(e) => setConfig({
                  ...config,
                  flashDrop: { ...config.flashDrop, badge: e.target.value }
                })}
                placeholder="Golden Hour Drop"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Main Title</label>
              <input
                type="text"
                value={config.flashDrop.title}
                onChange={(e) => setConfig({
                  ...config,
                  flashDrop: { ...config.flashDrop, title: e.target.value }
                })}
                placeholder="Flat 50% Off Flash Rush"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Stock Left Text</label>
              <input
                type="text"
                value={config.flashDrop.stockText}
                onChange={(e) => setConfig({
                  ...config,
                  flashDrop: { ...config.flashDrop, stockText: e.target.value }
                })}
                placeholder="Only 6 packs left in stock"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Offer Description</label>
              <input
                type="text"
                value={config.flashDrop.description}
                onChange={(e) => setConfig({
                  ...config,
                  flashDrop: { ...config.flashDrop, description: e.target.value }
                })}
                placeholder="Fresh Chicken, Tiffins & Veggies at direct farm prices!"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Duration (Minutes)</label>
              <select
                value={config.flashDrop.durationMinutes}
                onChange={(e) => setConfig({
                  ...config,
                  flashDrop: { ...config.flashDrop, durationMinutes: Number(e.target.value) || 15 }
                })}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400 cursor-pointer"
              >
                <option value={10}>10 Minutes Flash</option>
                <option value={15}>15 Minutes (Default)</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
              </select>
            </div>
          </div>

          {/* Flash Drop Products Catalog Manager */}
          <div className="pt-4 border-t border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Curated Flash Drop Products ({(config.flashDrop.items || []).length})</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Products featured exclusively during Golden Hour Flash Drop (e.g. Floor Cleaner, Dish Wash Gel, Fabric Conditioner).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddFlashItem}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-orange-900/20"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Quick Add Presets */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-white/5 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">
                ⚡ Quick-Add Household Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                {HOUSEHOLD_PRESETS.map((preset) => {
                  const isAdded = (config.flashDrop.items || []).some(i => i.name.toLowerCase() === preset.name.toLowerCase());
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleQuickAddPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border ${
                        isAdded
                          ? 'bg-slate-900 text-slate-500 border-white/5 cursor-not-allowed'
                          : 'bg-orange-500/10 hover:bg-orange-500 hover:text-slate-950 text-orange-300 border-orange-500/20 cursor-pointer active:scale-95'
                      }`}
                    >
                      <span>{isAdded ? '✓' : '+'}</span>
                      <span>{preset.name.split('(')[0].trim()}</span>
                      <span className="text-[8px] opacity-75 font-mono">₹{preset.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Flash Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(config.flashDrop.items || []).length === 0 ? (
                <div className="col-span-full text-center p-8 bg-slate-950/40 rounded-2xl border border-dashed border-white/10 text-slate-400 text-xs">
                  No flash products added yet. Click "Add Product" or use the quick-add presets above.
                </div>
              ) : (
                (config.flashDrop.items || []).map((item) => (
                  <div
                    key={item.id}
                    className={`bg-slate-950/80 border p-3 rounded-2xl flex flex-col justify-between gap-3 transition-all ${
                      item.isActive !== false ? 'border-orange-500/30' : 'border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60'}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-xl border border-white/10 shrink-0 bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="text-xs font-black text-white leading-snug line-clamp-2">
                            {item.name}
                          </h5>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.unit || 'Standard Pack'}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-black text-orange-400">₹{item.price}</span>
                          {item.mrp > item.price && (
                            <span className="text-[10px] text-slate-500 line-through">₹{item.mrp}</span>
                          )}
                          <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 text-[8px] font-black uppercase rounded">
                            {item.discount || '50% OFF'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleToggleFlashItemActive(item.id)}
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded cursor-pointer ${
                          item.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.isActive !== false ? '● Active in Drop' : '○ Paused'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditFlashItem(item)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-white/10 cursor-pointer transition-all"
                          title="Edit product"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFlashItem(item.id, item.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 cursor-pointer transition-all"
                          title="Delete product"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 3: NEIGHBORHOOD GROUP BUY POOL                                    */}
      {/* ========================================================================= */}
      {(activeSubTab === 'all' || activeSubTab === 'pool') && (
        <div className="bg-slate-900/90 border border-teal-500/30 rounded-[2rem] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/20 border border-teal-500/40 text-teal-400 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Feature 3: Neighborhood Group Buy Pool Widget
                </h3>
                <p className="text-[11px] text-slate-400">
                  Hyperlocal pooling widget where neighbors combine orders to unlock ₹25 Extra OFF and Free 15-min delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400">Status:</span>
              <button
                onClick={() => {
                  const updated: AttractionCampaignsConfig = {
                    ...config,
                    groupPool: {
                      ...config.groupPool,
                      isEnabled: !config.groupPool.isEnabled
                    }
                  };
                  setConfig(updated);
                  saveAttractionConfigToFirestore(updated, adminEmail);
                  triggerToast(`Group Buy Pool is now ${updated.groupPool.isEnabled ? 'ENABLED' : 'DISABLED'}`);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  config.groupPool.isEnabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-white/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${config.groupPool.isEnabled ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'}`} />
                <span>{config.groupPool.isEnabled ? 'Active on App' : 'Disabled'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Widget Title</label>
              <input
                type="text"
                value={config.groupPool.title}
                onChange={(e) => setConfig({
                  ...config,
                  groupPool: { ...config.groupPool, title: e.target.value }
                })}
                placeholder="Neighborhood Group Buy Pool"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Discount Amount (₹)</label>
              <input
                type="number"
                value={config.groupPool.discountAmount}
                onChange={(e) => setConfig({
                  ...config,
                  groupPool: { ...config.groupPool, discountAmount: Number(e.target.value) || 25 }
                })}
                placeholder="25"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Target Members</label>
              <input
                type="number"
                value={config.groupPool.targetMembers}
                onChange={(e) => setConfig({
                  ...config,
                  groupPool: { ...config.groupPool, targetMembers: Number(e.target.value) || 5 }
                })}
                placeholder="5"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Starting Joined Count</label>
              <input
                type="number"
                value={config.groupPool.currentJoined}
                onChange={(e) => setConfig({
                  ...config,
                  groupPool: { ...config.groupPool, currentJoined: Number(e.target.value) || 4 }
                })}
                placeholder="4"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Locked Promo Description</label>
              <input
                type="text"
                value={config.groupPool.lockedDescription}
                onChange={(e) => setConfig({
                  ...config,
                  groupPool: { ...config.groupPool, lockedDescription: e.target.value }
                })}
                placeholder="Join 4 neighbors near you to unlock FREE 15-min delivery & ₹25 Extra OFF!"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Unlocked Celebration Message</label>
              <input
                type="text"
                value={config.groupPool.unlockedDescription}
                onChange={(e) => setConfig({
                  ...config,
                  groupPool: { ...config.groupPool, unlockedDescription: e.target.value }
                })}
                placeholder="🎉 You unlocked Flat 25% Group Discount + FREE Delivery!"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REWARD ADD/EDIT MODAL                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {(isAddingReward || editingReward) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/30 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span>{editingReward ? 'Edit Scratch Reward' : 'Add New Lucky Reward'}</span>
                </h4>
                <button
                  onClick={() => {
                    setIsAddingReward(false);
                    setEditingReward(null);
                  }}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRewardForm} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Coupon Code</label>
                    <input
                      type="text"
                      required
                      value={rewardForm.code}
                      onChange={(e) => setRewardForm({ ...rewardForm, code: e.target.value.toUpperCase() })}
                      placeholder="GOLDEN50"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Emoji Icon</label>
                    <input
                      type="text"
                      required
                      value={rewardForm.emoji}
                      onChange={(e) => setRewardForm({ ...rewardForm, emoji: e.target.value })}
                      placeholder="🎉"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white text-center focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Reward Title</label>
                  <input
                    type="text"
                    required
                    value={rewardForm.title}
                    onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                    placeholder="FLAT 50% OFF"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={rewardForm.desc}
                    onChange={(e) => setRewardForm({ ...rewardForm, desc: e.target.value })}
                    placeholder="On all Fresh Tiffins & Groceries"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Discount % Value</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={rewardForm.discount}
                      onChange={(e) => setRewardForm({ ...rewardForm, discount: Number(e.target.value) || 25 })}
                      placeholder="50"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Theme Gradient</label>
                    <select
                      value={rewardForm.color}
                      onChange={(e) => setRewardForm({ ...rewardForm, color: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {COLOR_PRESETS.map(preset => (
                        <option key={preset.value} value={preset.value}>{preset.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingReward(false);
                      setEditingReward(null);
                    }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-400 hover:bg-amber-350 active:scale-95 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingReward ? 'Update Reward' : 'Save Reward'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLASH DROP ITEM ADD / EDIT MODAL */}
      <AnimatePresence>
        {(isAddingFlashItem || editingFlashItem) && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-orange-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h4 className="text-sm font-black uppercase tracking-tight text-white">
                    {editingFlashItem ? 'Edit Flash Drop Product' : 'Add Product to Golden Hour'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingFlashItem(false);
                    setEditingFlashItem(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveFlashItemForm} className="space-y-3.5 text-left">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Product Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={flashItemForm.name}
                    onChange={(e) => setFlashItemForm({ ...flashItemForm, name: e.target.value })}
                    placeholder="e.g. Citrus Fresh Antibacterial Floor Cleaner (2 Litre)"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Unit / Pack Size *
                    </label>
                    <input
                      type="text"
                      required
                      value={flashItemForm.unit}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, unit: e.target.value })}
                      placeholder="e.g. 1 Litre Bottle"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={flashItemForm.category}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, category: e.target.value })}
                      placeholder="household"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={flashItemForm.mrp}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, mrp: Number(e.target.value) || 0 })}
                      placeholder="198"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Deal Price (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={flashItemForm.price}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, price: Number(e.target.value) || 0 })}
                      placeholder="99"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-orange-400 focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={flashItemForm.discount}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, discount: e.target.value })}
                      placeholder="50% OFF"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Stock Urgency Text
                    </label>
                    <input
                      type="text"
                      value={flashItemForm.stock}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, stock: e.target.value })}
                      placeholder="6 left in stock"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Product Status
                    </label>
                    <select
                      value={flashItemForm.isActive !== false ? 'true' : 'false'}
                      onChange={(e) => setFlashItemForm({ ...flashItemForm, isActive: e.target.value === 'true' })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-400 cursor-pointer"
                    >
                      <option value="true">● Active in Flash Drop</option>
                      <option value="false">○ Paused / Hidden</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={flashItemForm.image}
                    onChange={(e) => setFlashItemForm({ ...flashItemForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-orange-400"
                  />
                  {flashItemForm.image && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={flashItemForm.image}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded-lg border border-white/10 bg-slate-950"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500&auto=format&fit=crop&q=60';
                        }}
                      />
                      <span className="text-[9px] text-slate-400">Image Preview</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFlashItem(false);
                      setEditingFlashItem(null);
                    }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950/40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingFlashItem ? 'Update Product' : 'Add to Golden Hour'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Test Scratch Modal */}
      <ScratchCardModal
        isOpen={showTestScratchModal}
        onClose={() => setShowTestScratchModal(false)}
        config={config.scratchCard}
        onRewardClaimed={(code, discount) => {
          triggerToast(`🎉 Test Scratch complete! Code: ${code} (${discount}% OFF)`);
        }}
      />
    </div>
  );
};
