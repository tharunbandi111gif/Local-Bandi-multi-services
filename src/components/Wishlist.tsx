import React, { useState } from 'react';
import { ArrowLeft, Heart, ShoppingBag, Trash2, Search, Mic, MicOff } from 'lucide-react';
import { Product, Service, LanguageCode } from '../types';
import { PRODUCTS, SERVICES } from '../constants';
import { translations } from '../translations';

interface WishlistProps {
  wishlistIds: string[];
  language: LanguageCode;
  onBack: () => void;
  onProductClick: (prod: Product | Service) => void;
  onRemove: (id: string) => void;
}

export default function Wishlist({ wishlistIds, language, onBack, onProductClick, onRemove }: WishlistProps) {
  const t = translations[language].wishlist || translations['en-IN'].wishlist;
  const common = translations[language].common || translations['en-IN'].common;
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
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

  const allItems = [...PRODUCTS, ...SERVICES];
  const items = allItems.filter(item => wishlistIds.includes(item.id));
  
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (items.length === 0) {
    return (
      <div className="h-full w-full bg-white flex flex-col p-6 pt-12 items-center justify-center text-center">
        <button onClick={onBack} className="absolute top-12 left-6 p-2 bg-gray-100 rounded-xl">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <div className="bg-pink-100 w-32 h-32 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-16 h-16 text-pink-600 fill-pink-600" />
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">{t.emptyTitle}</h3>
        <p className="text-gray-500 mb-8 max-w-[200px]">{t.emptySub}</p>
        <button 
          onClick={onBack}
          className="px-10 py-4 bg-yellow-400 text-gray-900 rounded-2xl font-black shadow-lg shadow-yellow-100 active:scale-95 transition-all"
        >
          {t.explore}
        </button>
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
            <h2 className="text-xl font-black text-gray-900 flex-1">{t.title} ({items.length})</h2>
            <button onClick={() => setIsSearching(true)} className="p-2 bg-gray-100 rounded-xl">
              <Search className="w-5 h-5 text-gray-700" />
            </button>
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
                placeholder={t.searchPlaceholder}
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
              {common.cancel}
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 font-inter">
        {filteredItems.length > 0 ? filteredItems.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm relative group">
            {item.image && <img src={item.image} className="w-20 h-20 rounded-2xl object-cover" alt={item.name} />}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 leading-tight pr-6 line-clamp-1">{item.name}</h3>
                <p className="text-yellow-600 font-black mt-1">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onProductClick(item as any)}
                  className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  View Detail
                </button>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="bg-gray-100 p-8 rounded-full mb-4">
              <Search className="w-12 h-12 text-gray-300" />
            </div>
            <p className="font-bold text-gray-400">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
