import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, ShoppingCart, Star, Calendar, Mic, MicOff, ChevronDown, Check, X, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Product, Service, LanguageCode } from '../types';
import { PRODUCTS, SERVICES } from '../constants';
import MarriageBureau from './MarriageBureau';
import { translations } from '../translations';

interface CategoryListingProps {
  category: Category;
  language: LanguageCode;
  onBack: () => void;
  onProductClick: (prod: Product | Service) => void;
  isAdmin?: boolean;
  localInventory: (Product | Service)[];
}

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating';

export default function CategoryListing({ 
  category, 
  language, 
  onBack, 
  onProductClick, 
  isAdmin = false,
  localInventory 
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

  const allItems = localInventory;
  const itemsInCategory = allItems.filter(p => p.category === category.id);
  
  const subCategories = Array.from(new Set(itemsInCategory.map(item => (item as Product).subCategory).filter(Boolean))) as string[];
  
  const filteredItems = itemsInCategory.filter(item => {
    const matchesSubCat = selectedSubCat ? (item as Product).subCategory === selectedSubCat : true;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ((item as Product).hotelName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
                          ((item as Product).subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const itemRating = (item as Service).rating || 0;
    const matchesRating = itemRating >= minRating;
    return matchesSubCat && matchesSearch && matchesPrice && matchesRating;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'rating': return ((b as Service).rating || 0) - ((a as Service).rating || 0);
      default: return 0;
    }
  });

  const isServiceCategory = ['services', 'travel', 'marriage', 'events', 'maids', 'mechanics', 'construction', 'care', 'jobs'].includes(category.id);

  if (category.id === 'marriage') {
    return (
      <div className="h-full w-full bg-white flex flex-col">
        <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-50">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h2 className="text-xl font-black text-gray-900 flex-1">{category.name}</h2>
        </header>
        <MarriageBureau onBack={onBack} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-gray-50">
        {!isSearching ? (
          <>
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h2 className="text-xl font-black text-gray-900 flex-1">{category.name}</h2>
            <div className="flex items-center gap-1">
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
                placeholder={`${t.search} in ${category.name}...`}
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
                {sub}
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

        <div className="grid grid-cols-2 gap-4">
          {sortedItems.length > 0 ? (
            sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onProductClick(item as any)}
                className="bg-white rounded-[2rem] border border-gray-100 p-3 shadow-sm text-left flex flex-col active:scale-95 transition-all cursor-pointer"
              >
                <div className="relative mb-3">
                  {item.image && <img src={item.image} className="w-full h-40 object-cover rounded-2xl" alt={item.name} />}
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
                <h3 className="font-extrabold text-sm text-gray-900 mb-1 leading-tight">{item.name}</h3>
                {(item as Product).hotelName && (
                  <p className="text-[10px] text-gray-400 font-bold mb-1">{(item as Product).hotelName}</p>
                )}
                {(item as Service).bookings && (
                  <p className="text-[10px] text-gray-500 font-bold mb-2">{(item as Service).bookings}+ Bookings</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-yellow-600 font-black">₹{item.price}</span>
                  <div className={`p-2 rounded-xl ${isServiceCategory ? 'bg-gray-900' : 'bg-yellow-400'}`}>
                    {isServiceCategory ? (
                      <Calendar className="w-4 h-4 text-white" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-gray-900" />
                    )}
                  </div>
                </div>
                {isServiceCategory && (
                  <div className="mt-3 w-full py-2 bg-yellow-400 rounded-xl text-center text-[10px] font-black uppercase tracking-wider text-gray-900">
                    Book Now
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
                        <h4 className="font-extrabold text-gray-900 leading-tight">{item.name}</h4>
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
    </div>
  );
}

