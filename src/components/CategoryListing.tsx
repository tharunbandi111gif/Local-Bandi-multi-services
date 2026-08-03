import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, ShoppingCart, Star, Calendar, Mic, MicOff, ChevronDown, Check, X, ClipboardList, MessageSquare, Phone, ZoomIn, Edit3, Trash2, Camera, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, Service, LanguageCode } from '../types';
import { PRODUCTS, SERVICES, CATEGORIES } from '../constants';
import MarriageBureau from './MarriageBureau';
import { HospitalOPForm } from './HospitalOPForm';
import { translations } from '../translations';
import { getLocalizedCategoryName, getLocalizedSubcategoryName, getLocalizedProductName, getLocalizedProductDescription, getLocalizedServiceName, getLocalizedServiceDescription } from '../utils/localizedContent';
import { performSmartSearch } from '../utils/smartSearch';
import { AdminInput } from './common/AdminInput';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { compressImage } from '../lib/imageUtils';

interface CategoryListingProps {
  category: Category;
  language: LanguageCode;
  onBack: () => void;
  onProductClick: (prod: Product | Service) => void;
  isAdmin?: boolean;
  localInventory: (Product | Service)[];
  hospitalPrices?: Record<string, { price: number; isActive: boolean }>;
  onBookHospitalOP?: (data: any) => void;
  currentBranchId?: string;
}

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating';

export default function CategoryListing({ 
  category, 
  language, 
  onBack, 
  onProductClick, 
  isAdmin = false,
  localInventory,
  hospitalPrices,
  onBookHospitalOP,
  currentBranchId = 'khammam_main'
}: CategoryListingProps) {
  const t = translations[language].common || translations['en-IN'].common;
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState(0);
  const [compareItems, setCompareItems] = useState<Product[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{url: string, name: string} | null>(null);

  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const handleDeleteCatalogItem = (id: string, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      title: "Delete Item?",
      message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'products', id));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
        }
      }
    });
  };

  const handleSaveCatalogItem = async () => {
    if (!editingItem || !editingItem.name?.trim()) {
      alert("Product/Service Name is required!");
      return;
    }
    const docId = editingItem.id || `prod_${Date.now()}`;
    const itemToSave = {
      ...editingItem,
      id: docId,
      category: editingItem.category || category.id,
      branchId: editingItem.branchId || currentBranchId,
      isAvailable: editingItem.isAvailable ?? true,
      price: Number(editingItem.price) || 0,
      stock: editingItem.stock !== undefined ? Number(editingItem.stock) : 100,
      vendorId: editingItem.vendorId || 'admin-store',
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'products', docId), itemToSave, { merge: true });
      setShowEditModal(false);
      setEditingItem(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `products/${docId}`);
    }
  };

  const toggleCompare = (prod: Product) => {
    if (compareItems.find(i => i.id === prod.id)) {
      setCompareItems(compareItems.filter(i => i.id !== prod.id));
    } else if (compareItems.length < 2) {
      setCompareItems([...compareItems, prod]);
    }
  };

  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setIsSearching(true);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.start();
  };

  const itemsInCategory = React.useMemo(() => {
    if (!category) return [];
    const targetCatId = (category.id || '').toLowerCase();

    return localInventory.filter(p => {
      const pCat = (p.category || '').toLowerCase();

      const matchesCategory = pCat === targetCatId ||
        (targetCatId === 'veg' && (pCat === 'vegetables' || pCat === 'veg' || pCat === 'fruits')) ||
        (targetCatId === 'dairy' && (pCat === 'dairy' || pCat === 'milk' || pCat === 'dairy & eggs')) ||
        (targetCatId === 'meat' && (pCat === 'meat' || pCat === 'chicken' || pCat === 'fish' || pCat === 'meat & fish')) ||
        (targetCatId === 'bakery' && (pCat === 'bakery' || pCat === 'ice cream' || pCat === 'icecream')) ||
        (targetCatId === 'groceries' && (pCat === 'groceries' || pCat === 'snacks' || pCat === 'household')) ||
        (targetCatId === 'pharmacy' && (pCat === 'pharmacy' || pCat === 'medicine' || pCat === 'health')) ||
        (targetCatId === 'electronics' && (pCat === 'electronics' || pCat === 'mobiles')) ||
        (targetCatId === 'services' && (pCat === 'services' || pCat === 'home services'));

      const matchesBranch = !p.branchId || p.branchId === currentBranchId || currentBranchId === 'khammam_main';

      return matchesCategory && matchesBranch;
    });
  }, [localInventory, category?.id, currentBranchId]);

  const searchResult = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredProducts: itemsInCategory, didYouMean: undefined };
    }
    return performSmartSearch(searchQuery, itemsInCategory, [], language);
  }, [searchQuery, itemsInCategory, language]);
  
  const subCategories = React.useMemo(() => 
    Array.from(new Set(itemsInCategory.map(item => (item as Product).subCategory).filter(Boolean))) as string[],
  [itemsInCategory]);
  
  const filteredItems = React.useMemo(() => 
    searchResult.filteredProducts.filter(item => {
      const matchesSubCat = selectedSubCat ? (item as Product).subCategory === selectedSubCat : true;
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      const itemRating = (item as Service).rating || 0;
      const matchesRating = itemRating >= minRating;
      return matchesSubCat && matchesPrice && matchesRating;
    }),
  [searchResult.filteredProducts, selectedSubCat, priceRange, minRating]);

  const sortedItems = React.useMemo(() => 
    [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return ((b as Service).rating || 0) - ((a as Service).rating || 0);
        default: return 0;
      }
    }),
  [filteredItems, sortBy]);

  const isServiceCategory = category ? ['services', 'travel', 'marriage', 'events', 'maids', 'mechanics', 'construction', 'care', 'jobs', 'driving_school', 'beauty_parlour'].includes(category.id) : false;

  const categoryDisplayName = category ? getLocalizedCategoryName(category, language) : '';

  const isChitFund = category && (
    category.id === 'sri_krishna_chitfund' || 
    category.id === 'sri-krishna-chitfund' || 
    category.id === 'chitfund' || 
    category.name.toLowerCase().includes('chitfund') || 
    category.name.toLowerCase().includes('sri krishna chit')
  );

  if (!category) {
    return (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4">Category not selected</p>
        <button onClick={onBack} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-100">
          Go Back
        </button>
      </div>
    );
  }

  if (category.id === 'marriage') {
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-50">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900 flex-1">{categoryDisplayName}</h2>
        </header>
        <MarriageBureau onBack={onBack} isAdmin={isAdmin} />
      </div>
    );
  }

  const isHospitalCategory = category.id === 'hospital_op' || 
                             category.id === 'pharmacy' || 
                             category.name.toLowerCase().includes('hospital');

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-50">
        {!isSearching ? (
          <>
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="text-xl font-black text-gray-900 flex-1">{categoryDisplayName}</h2>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  setEditingItem({
                    id: '',
                    name: '',
                    price: '',
                    category: category.id,
                    branchId: currentBranchId,
                    image: '',
                    description: '',
                    unit: '1 unit',
                    stock: 100,
                    vendorId: 'admin-store',
                    isAvailable: true
                  });
                  setShowEditModal(true);
                }}
                className="p-2 bg-yellow-400 text-gray-900 font-bold rounded-xl flex items-center gap-1 text-xs px-3 shadow-sm hover:bg-yellow-500 transition-all active:scale-95 cursor-pointer"
                title={`Add product to ${categoryDisplayName}`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline font-black text-[10px] uppercase tracking-wider">Add</span>
              </button>
              <button 
                onClick={handleVoiceSearch} 
                className={`p-2 rounded-xl transition-all ${isListening ? 'bg-rose-100 text-rose-500 animate-pulse' : 'bg-gray-100 text-gray-700'}`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button onClick={() => setIsSearching(true)} className="p-2 bg-gray-100 rounded-xl">
                <Search className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${t.search} in ${categoryDisplayName}...`}
                className="w-full bg-gray-50 py-2.5 pl-10 pr-10 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-yellow-400"
              />
              <button
                onClick={handleVoiceSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'text-rose-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="text-xs font-black text-gray-400 uppercase tracking-wider px-2"
            >
              {t.cancel}
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {searchResult.didYouMean && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center justify-between text-xs">
            <span className="font-medium text-yellow-900">
              Did you mean <strong className="font-black underline">{searchResult.didYouMean}</strong>?
            </span>
            <button
              onClick={() => setSearchQuery(searchResult.didYouMean!)}
              className="px-3 py-1 bg-yellow-400 text-gray-900 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-sm"
            >
              Search
            </button>
          </div>
        )}

        {subCategories.length > 0 && (
          <div className="flex bg-gray-50 p-2 rounded-2xl gap-2 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setSelectedSubCat(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                !selectedSubCat ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {translations[language].home?.all || 'All'}
            </button>
            {subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubCat(sub)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedSubCat === sub ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {getLocalizedSubcategoryName(sub, language)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button 
            onClick={() => setShowFilters(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-100"
          >
            <Filter className="w-3.5 h-3.5" />
            {t.filter} {(minRating > 0 || priceRange[0] > 0 || priceRange[1] < 2000) && "•"}
          </button>
          
          <div className="flex-shrink-0 w-[1px] h-6 bg-gray-100 mx-1"></div>

          {[
            { id: 'relevance', label: t.relevance || 'Relevance' },
            { id: 'price-low', label: t.priceLowToHigh },
            { id: 'price-high', label: t.priceHighToLow },
            { id: 'rating', label: t.ratingHighToLow },
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setSortBy(opt.id as SortOption)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-2 ${
                sortBy === opt.id ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-white border-gray-50 text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pb-20">
          {isHospitalCategory && hospitalPrices && onBookHospitalOP && (
            <div className="col-span-2 mb-8 -mx-2">
              <div className="px-4 mb-4">
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">Quick Booking</span>
                <h2 className="text-xl font-black text-gray-900 mt-3 italic tracking-tight">Direct Hospital OP Booking</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none italic">Secure your session with Local Bandi Multi Services</p>
              </div>
              <HospitalOPForm 
                prices={hospitalPrices}
                onBook={onBookHospitalOP}
              />
              <div className="mt-12 mb-6 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-gray-100"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Other Health Options</span>
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-gray-100"></div>
              </div>
            </div>
          )}
          {sortedItems.length > 0 ? (
            sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onProductClick(item as any)}
                className="bg-white rounded-[2rem] border border-gray-100 p-3 shadow-sm text-left flex flex-col active:scale-95 transition-all cursor-pointer"
              >
                <div className="relative mb-3">
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-1.5 z-[20]">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem({ ...item });
                          setShowEditModal(true);
                        }}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-90 transition-all shadow-md flex items-center justify-center border border-indigo-500/20"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCatalogItem(item.id, item.name);
                        }}
                        className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 active:scale-90 transition-all shadow-md flex items-center justify-center border border-rose-400/20"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {item.image && (
                    <div 
                      onClick={(e) => {
                        if (isChitFund) {
                          e.stopPropagation();
                          setLightboxImage({ url: item.image!, name: item.name });
                        }
                      }}
                      className={`relative overflow-hidden rounded-2xl cursor-pointer ${isChitFund ? 'cursor-zoom-in' : ''}`}
                    >
                      <img 
                        src={item.image} 
                        className={`w-full ${isChitFund ? 'h-48 object-contain bg-slate-50 border border-indigo-100/60 p-2' : 'h-40 object-cover'} rounded-2xl transition-all hover:scale-105 duration-300`} 
                        alt={item.name} 
                      />
                      {isChitFund && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-center pointer-events-none">
                          <p className="text-[8px] font-black uppercase text-white tracking-wider flex items-center justify-center gap-1">
                            <ZoomIn className="w-3 h-3 text-yellow-400" /> Tap to view details clearly
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {(item as Service).rating && (
                        <span className="text-[10px] font-bold text-gray-700">{(item as Service).rating}</span>
                      )}
                    </div>
                    {!isServiceCategory && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(item as Product);
                        }}
                        className={`p-1.5 rounded-lg backdrop-blur-sm transition-all shadow-sm ${
                          compareItems.find(i => i.id === item.id) 
                          ? 'bg-yellow-400 text-gray-900 border border-yellow-500' 
                          : 'bg-white/80 text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        <ClipboardList className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-extrabold text-sm text-gray-900 mb-1 leading-tight">{getLocalizedProductName(item.name, language)}</h3>
                {(item as Product).hotelName && (
                  <p className="text-[10px] text-gray-400 font-bold mb-1">{(item as Product).hotelName}</p>
                )}
                {(item as Service).bookings && (
                  <p className="text-[10px] text-gray-500 font-bold mb-2">{(item as Service).bookings}+ Bookings</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-yellow-600 font-black">₹{item.price}</span>
                  {isChitFund ? (
                    <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Maturity Basis</span>
                  ) : (
                    <div className={`p-2 rounded-xl ${isServiceCategory ? 'bg-gray-900' : 'bg-yellow-400'}`}>
                      {isServiceCategory ? (
                        <Calendar className="w-4 h-4 text-white" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 text-gray-900" />
                      )}
                    </div>
                  )}
                </div>
                {isChitFund ? (
                  <div className="mt-3 flex gap-1.5 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('open_customer_care', { detail: { type: 'user' } }));
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 active:scale-95"
                    >
                      <MessageSquare className="w-3 h-3" /> Chat
                    </button>
                    <a
                      href="tel:+919988776655"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1 active:scale-95 text-center"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  </div>
                ) : isServiceCategory && (
                  <div className={`mt-3 w-full py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-wider ${category.id === 'hospital_op' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-yellow-400 text-gray-900'}`}>
                    {category.id === 'hospital_op' ? 'Book OP Session' : 'Book Now'}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 py-20 text-center flex flex-col items-center">
              <div className="bg-gray-100 p-8 rounded-full mb-4">
                <ShoppingCart className="w-12 h-12 text-gray-300" />
              </div>
              <p className="font-bold text-gray-400">{t.noResults}</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-[3rem] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-10">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Price Range</p>
                    <span className="text-sm font-bold text-yellow-600">₹{priceRange[0]} - ₹{priceRange[1]}</span>
                  </div>
                  <div className="px-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="2000" 
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                  </div>
                </section>

                <section>
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Minimum Rating</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[3, 4, 4.5, 4.8].map(r => (
                      <button 
                        key={r}
                        onClick={() => setMinRating(minRating === r ? 0 : r)}
                        className={`py-3 rounded-2xl font-bold text-xs transition-all border-2 ${
                          minRating === r ? 'bg-yellow-400 border-yellow-400 text-gray-900' : 'bg-gray-50 border-transparent text-gray-400'
                        }`}
                      >
                        {r}+
                      </button>
                    ))}
                  </div>
                </section>

                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => {
                      setPriceRange([0, 2000]);
                      setMinRating(0);
                    }}
                    className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all text-xs"
                  >
                    {t.reset}
                  </button>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="flex-[2] py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
                  >
                    {t.apply}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Comparison Sticky Bar */}
      <AnimatePresence>
        {compareItems.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 inset-x-6 z-40 bg-gray-900 rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-4">
                {compareItems.map((item, i) => (
                  <div key={item.id} className="w-10 h-10 rounded-xl border-2 border-gray-900 overflow-hidden bg-white">
                    {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} />}
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest px-2">
                {compareItems.length === 1 ? 'Select 1 more to compare' : 'Ready to compare'}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCompareItems([])}
                className="p-3 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {compareItems.length === 2 && (
                <button 
                  onClick={() => setShowComparison(true)}
                  className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Compare Now
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && compareItems.length === 2 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-[3rem] p-8 overflow-hidden shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900 italic tracking-tighter">VERSUS</h3>
                <button onClick={() => setShowComparison(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-gray-100 italic pointer-events-none">VS</div>
                
                {compareItems.map((item, idx) => (
                  <div key={item.id} className="space-y-6">
                    <div className="aspect-[4/5] rounded-[2rem] overflow-hidden border border-gray-100">
                      {item.image && <img src={item.image} className="w-full h-full object-cover" alt={item.name} />}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Product</p>
                        <h4 className="font-extrabold text-gray-900 leading-tight">{getLocalizedProductName(item.name, language)}</h4>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-xl font-black text-yellow-600 italic">₹{item.price}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-black text-gray-900">4.5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex gap-4">
                <button 
                  onClick={() => setShowComparison(false)}
                  className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase tracking-widest active:scale-95 transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex flex-col justify-between p-6 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="text-left">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Sri Krishna Chit Fund Plan</span>
                <h3 className="text-white text-base font-black truncate max-w-[200px] sm:max-w-xs">{lightboxImage.name}</h3>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Middle Zoomable Image */}
            <div className="flex-1 flex items-center justify-center py-4 w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative max-h-full max-w-full overflow-auto flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black select-none shadow-2xl p-2">
                <img
                  src={lightboxImage.url}
                  className="max-h-[60vh] max-w-full object-contain cursor-zoom-out select-none active:scale-110 transition-transform"
                  alt={lightboxImage.name}
                  onClick={() => setLightboxImage(null)}
                />
              </div>
            </div>

            {/* Bottom Controls / Contact */}
            <div className="w-full max-w-md mx-auto space-y-4 mb-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">💡 Pinch, Double-Click, or Scroll image to view in detail</p>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
                <p className="text-xs font-bold text-gray-300 text-center">
                  To subscribe or learn about this plan's maturity cycle, interest rate, and premium terms, connect directly with our support:
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setLightboxImage(null);
                      window.dispatchEvent(new CustomEvent('open_customer_care', { detail: { type: 'user' } }));
                    }}
                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-900/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat Support
                  </button>
                  <a
                    href="tel:+919988776655"
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/30 transition-colors flex items-center justify-center gap-2 text-center"
                  >
                    <Phone className="w-4 h-4" /> Call Support
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Catalog Item Modal */}
      <AnimatePresence>
        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar border border-gray-100"
            >
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>

              <h3 className="text-xl font-black text-gray-900 mb-6 italic tracking-tight flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" /> Edit Catalog Item
              </h3>

              <div className="space-y-4 mb-8">
                {/* Visual Image uploader */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Item Photo</span>
                  <div className="flex gap-4 items-center">
                    {editingItem.image ? (
                      <div className="relative">
                        <img src={editingItem.image} className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shadow-sm" alt="Preview animate-fade" />
                        <button 
                          onClick={() => setEditingItem({ ...editingItem, image: '' })}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 text-white rounded-full shadow-sm"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                        <Camera className="w-6 h-6 animate-pulse" />
                      </div>
                    )}
                    <label className="flex-1 py-3 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-black uppercase text-[9px] tracking-widest border border-gray-200 cursor-pointer text-center select-none shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95">
                      <Camera className="w-4 h-4 text-indigo-500" />
                      Select Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const compressed = await compressImage(reader.result as string);
                              setEditingItem(prev => ({ ...prev, image: compressed }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                <AdminInput 
                  label="Item Name"
                  placeholder="e.g. Organic Tomatoes"
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />

                <AdminInput 
                  label="Price (₹)"
                  type="number"
                  placeholder="e.g. 40"
                  value={editingItem.price === undefined || editingItem.price === null ? '' : editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value === '' ? '' : Number(e.target.value) })}
                />

                <AdminInput 
                  label="Description"
                  as="textarea"
                  placeholder="Enter details about this product or service..."
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />

                <AdminInput 
                  label="Unit Badge (Optional)"
                  placeholder="e.g. Per Kg, Per Session, Per Packet, Hour"
                  value={editingItem.unit || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                />

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Assigned Category</label>
                  <select
                    value={editingItem.category || category.id}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {!isServiceCategory && (
                  <AdminInput 
                    label="Current Available Stock"
                    type="number"
                    placeholder="e.g. 50"
                    value={editingItem.stock === undefined || editingItem.stock === null ? '' : editingItem.stock}
                    onChange={(e) => setEditingItem({ ...editingItem, stock: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCatalogItem}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 active:scale-95 transition-all text-center"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Catalog Item Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm?.isOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative text-center border border-gray-100"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2 italic tracking-tight">{deleteConfirm.title}</h3>
              <p className="text-xs font-bold text-gray-400 mb-8 leading-relaxed px-2">{deleteConfirm.message}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    await deleteConfirm.onConfirm();
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-200 active:scale-95 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

