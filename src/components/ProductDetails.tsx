import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, ShieldCheck, Heart, Minus, Plus, MessageSquare, Phone, ZoomIn, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Review, CartItem } from '../types';
import ReviewsSection from './ReviewsSection';
import { HospitalOPForm } from './HospitalOPForm';
import { useTranslation } from '../i18n';
import { getLocalizedProductName, getLocalizedProductDescription } from '../utils/localizedContent';
import ImageZoom from './ImageZoomModal';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  isInWishlist: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (prod: Product, qty: number) => void;
  cart: CartItem[];
  hospitalPrices?: Record<string, { price: number; isActive: boolean }>;
  onBookHospitalOP?: (data: any) => void;
  isAdmin?: boolean;
}

const WEIGHT_SIZES = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const VOLUME_SIZES = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function ProductDetails({ 
  product, 
  onBack, 
  isInWishlist, 
  onToggleWishlist, 
  onAddToCart,
  cart,
  hospitalPrices,
  onBookHospitalOP,
  isAdmin = false
}: ProductDetailsProps) {
  const { language } = useTranslation();
  const [selectedSize, setSelectedSize] = useState(1);
  const stock = product.stock ?? 10;

  const pName = (product?.name || '').toLowerCase();
  const pUnit = (product?.unit || '').toLowerCase();

  const isWeightProduct = 
    pUnit.includes('kg') || 
    pUnit.includes('gram') ||
    pName.includes('rice') || 
    pName.includes('sugar') ||
    pName.includes('atta') ||
    pName.includes('daal') ||
    pName.includes('dal') || 
    pName.includes('pulse') ||
    pName.includes('flour') ||
    pName.includes('salt') ||
    pName.includes('chicken') ||
    pName.includes('mutton') ||
    pName.includes('meat') ||
    pName.includes('fish') ||
    pName.includes('prawn') ||
    pName.includes('vegetable') ||
    pName.includes('fruit') ||
    pName.includes('tomato') ||
    pName.includes('onion') ||
    pName.includes('potato');

  const isVolumeProduct = 
    pUnit.includes('l') || 
    pUnit.includes('ltr') ||
    pName.includes('milk') || 
    pName.includes('oil') ||
    pName.includes('juice') ||
    pName.includes('water') ||
    pName.includes('beverage') ||
    pName.includes('drink') ||
    pName.includes('petrol') ||
    pName.includes('diesel') ||
    pName.includes('ghee');

  const sizes = isWeightProduct ? WEIGHT_SIZES : isVolumeProduct ? VOLUME_SIZES : null;
  const isSizable = sizes !== null;
  
  const isChitFund = product && (
    product.category === 'sri_krishna_chitfund' || 
    product.category === 'sri-krishna-chitfund' || 
    product.category === 'chitfund' || 
    (product.category && product.category.toLowerCase().includes('chitfund')) || 
    (product.category && product.category.toLowerCase().includes('sri krishna chit'))
  );

  const currentId = isSizable ? `${product.id}_${selectedSize}` : product.id;
  const cartCount = cart.find(i => i.id === currentId)?.quantity || 0;

  const availableToAdd = Math.max(0, stock - cartCount);
  const [qty, setQty] = useState(availableToAdd > 0 ? 1 : 0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset qty if size changes and current qty is more than available
  React.useEffect(() => {
    if (qty > availableToAdd) {
      setQty(availableToAdd);
    } else if (qty === 0 && availableToAdd > 0) {
      setQty(1);
    }
  }, [selectedSize, availableToAdd]);

  const isOutOfStock = stock <= 0;
  const isAtLimit = availableToAdd <= 0;
  const isLowStock = stock > 0 && stock < 5;

  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="bg-rose-50 text-rose-500 border border-rose-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Out of Stock
        </span>
      );
    }
    if (isAtLimit) {
      return (
        <span className="bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Stock Limit Reached
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="bg-orange-50 text-orange-600 border border-orange-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full animate-pulse">
          Low Stock: Only {stock} Left!
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
        In Stock ({stock})
      </span>
    );
  };

  const handleQtyChange = (val: string) => {
    if (val === '') {
      setQty(0);
      return;
    }
    const num = parseInt(val);
    if (isNaN(num)) return;
    setQty(Math.min(Math.max(0, num), availableToAdd));
  };
  const [localReviews, setLocalReviews] = useState<Review[]>(product.reviews || [
    { id: 'r1', userName: 'Arjun K.', rating: 5, comment: 'Excellent quality, exactly what I ordered!', date: '2 days ago' },
    { id: 'r2', userName: 'Priya S.', rating: 4, comment: 'Good quality but delivery was slightly delayed. Overall happy.', date: '1 week ago' },
    { id: 'r3', userName: 'Rahul M.', rating: 5, comment: 'Best in the locality. Fresh and well packaged.', date: '2 weeks ago' },
    { id: 'r4', userName: 'Anjali D.', rating: 3, comment: 'Okay product, but price is a bit high compared to others.', date: '3 weeks ago' }
  ]);

  const handleAddReview = (rating: number, comment: string) => {
    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      userName: 'You',
      rating,
      comment,
      date: 'Just now'
    };
    setLocalReviews([newReview, ...localReviews]);
  };

  const handleDeleteReview = (id: string) => {
    setLocalReviews(prev => prev.filter(r => r.id !== id));
  };

  const handleEditReview = (id: string, updatedComment: string, updatedRating: number) => {
    setLocalReviews(prev => prev.map(r => r.id === id ? { ...r, comment: updatedComment, rating: updatedRating } : r));
  };

  const getDeliveryTime = () => {
    switch (product.category) {
      case 'dairy':
        return '15-20 Mins';
      case 'grocery':
        return '30-45 Mins';
      case 'sos':
        return '10-15 Mins';
      case 'restaurant':
        return '25-40 Mins';
      default:
        return '20-30 Mins';
    }
  };


  const getPriceForSize = (size: number) => {
    return Math.round(product.price * size);
  };

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-y-auto">
      <div className="relative h-2/5 shrink-0 overflow-hidden bg-slate-100">
        {product.image && (
          <ImageZoom 
            src={product.image} 
            alt={product.name}
            containerClassName="w-full h-full"
            className={`w-full h-full ${isChitFund ? 'object-contain bg-slate-50 p-4' : 'object-cover'}`}
          />
        )}
        <div className="absolute top-0 inset-x-0 p-6 pt-12 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent">
          <button onClick={onBack} className="p-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => onToggleWishlist(product.id)}
            className={`p-2 backdrop-blur-md rounded-2xl border border-white/30 transition-all active:scale-90 ${
              isInWishlist ? 'bg-pink-500 text-white border-pink-400' : 'bg-white/20 text-white'
            }`}
          >
            <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white -mt-10 rounded-t-[3rem] p-8 shadow-2xl relative z-10 space-y-6 pb-32">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="bg-yellow-100 px-3 py-1 rounded-lg">
              <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">{product.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-black text-gray-900">
                {(localReviews.reduce((acc, r) => acc + r.rating, 0) / localReviews.length).toFixed(1)}
              </span>
              <span className="text-gray-400 text-xs font-bold">({localReviews.length} Reviews)</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{getLocalizedProductName(product.name, language)}</h2>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open_customer_care', { detail: { type: 'user' } }));
              }}
              className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0"
              title="Chat with support about this item"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>
          </div>
          {product.hotelName && (
            <p className="text-sm font-black text-yellow-600 mt-1 flex items-center gap-1">
              by {product.hotelName}
            </p>
          )}
          {product.originalPrice && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-rose-600 font-black text-xs bg-rose-50 px-2 py-0.5 rounded-md italic">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
              <span className="text-gray-400 font-bold text-sm line-through">₹{product.originalPrice}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Estimated</p>
              <span className="text-sm font-black text-gray-900 leading-none">{getDeliveryTime()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Safety</p>
              <span className="text-sm font-black text-gray-900 leading-none">Fresh Verified</span>
            </div>
          </div>
        </div>

        <p className="text-gray-500 font-medium leading-relaxed">
          {product.description}
        </p>

        {(product.category === 'hospital_op' || (product.hotelName || '').toLowerCase().includes('hospital')) && hospitalPrices && onBookHospitalOP && (
          <div className="pt-6 border-t border-gray-100">
             <HospitalOPForm 
               prices={hospitalPrices}
               onBook={onBookHospitalOP}
             />
          </div>
        )}

        {sizes && (
          <div className="pt-4">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Pack Size</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${
                    selectedSize === size
                      ? 'bg-yellow-400 border-yellow-400 text-gray-900 shadow-md shadow-yellow-100 scale-105'
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {size === 0.5 ? (isWeightProduct ? '500g' : '500ml') : `${size}${isWeightProduct ? 'kg' : 'L'}`}
                  <div className="text-[10px] opacity-70">₹{getPriceForSize(size)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {isChitFund ? (
          <div className="bg-indigo-50 border border-indigo-100/60 rounded-[1.5rem] p-6 flex flex-col items-center text-center space-y-3 shadow-inner">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">Inquiry Basis Only</span>
            <p className="text-sm font-extrabold text-indigo-950">Sri Krishna Chit Fund Custom Plans</p>
            <p className="text-xs font-bold text-gray-500 max-w-sm">
              Chit fund products are customized to match every member's investment and safety needs. Direct checkout is disabled. Please reach our branch using Chat or Call support.
            </p>
          </div>
        ) : (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Select Quantity</label>
                {cartCount > 0 && <span className="text-[9px] font-bold text-emerald-600 uppercase mt-0.5">{cartCount} already in cart</span>}
              </div>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isOutOfStock ? 'out' : isAtLimit ? 'limit' : isLowStock ? 'low' : 'in'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                >
                  {getStockBadge()}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-6">
              <div className={`flex items-center bg-gray-50 border-2 rounded-[2rem] p-2 transition-all shadow-inner ${isAtLimit || isOutOfStock ? 'opacity-50 grayscale' : 'border-gray-100 group-focus-within:border-gray-300'}`}>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  disabled={qty <= 1 || isAtLimit || isOutOfStock}
                  onClick={() => setQty(qty - 1)}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-all disabled:opacity-50 text-gray-900"
                >
                  <Minus className="w-5 h-5" />
                </motion.button>
                
                <div className="relative overflow-hidden px-2">
                  <input 
                    type="number"
                    disabled={isAtLimit || isOutOfStock}
                    value={qty || ''}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    onBlur={() => {
                      if (!qty || qty < 1) {
                        if (availableToAdd > 0) setQty(1);
                        else setQty(0);
                      }
                    }}
                    className="w-16 text-center text-xl font-black text-gray-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:scale-110 transition-transform"
                  />
                </div>

                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  disabled={qty >= availableToAdd || isAtLimit || isOutOfStock}
                  onClick={() => setQty(qty + 1)}
                  className="w-12 h-12 flex items-center justify-center bg-yellow-400 rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50 text-gray-900"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              
              <motion.div 
                layout
                className="flex-1 text-right"
              >
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                <p className="text-2xl font-black text-gray-900">₹{getPriceForSize(selectedSize) * (isOutOfStock ? 0 : qty)}</p>
              </motion.div>
            </div>
          </div>
        )}

        <ReviewsSection 
          reviews={localReviews} 
          onAddReview={handleAddReview} 
          isAdmin={isAdmin}
          onDeleteReview={handleDeleteReview}
          onEditReview={handleEditReview}
        />
      </div>

      {isChitFund ? (
        <div className="p-6 pb-10 bg-white border-t border-gray-100 fixed bottom-0 inset-x-0 z-20 flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_customer_care', { detail: { type: 'user' } }));
            }}
            className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <MessageSquare className="w-5 h-5 text-white" /> Chat Support
          </motion.button>
          <a
            href="tel:+919988776655"
            className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-center"
          >
            <Phone className="w-5 h-5 text-white" /> Call Support
          </a>
        </div>
      ) : (
        <div className="p-6 pb-10 bg-white border-t border-gray-100 fixed bottom-0 inset-x-0 z-20 flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleWishlist(product.id)}
            className={`flex-shrink-0 w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all border-2 ${
              isInWishlist 
                ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-lg shadow-rose-100' 
                : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900'
            }`}
          >
            <Heart className={`w-7 h-7 ${isInWishlist ? 'fill-current' : ''}`} />
          </motion.button>
          <button 
            disabled={isOutOfStock || isAtLimit || qty < 1}
            onClick={() => {
              const sizeLabel = selectedSize === 0.5 ? (isWeightProduct ? '500g' : '500ml') : `${selectedSize}${isWeightProduct ? 'kg' : 'L'}`;
              const adjustedProduct = {
                ...product,
                price: getPriceForSize(selectedSize),
                name: sizes ? `${product.name} (${sizeLabel})` : product.name,
                id: sizes ? currentId : product.id
              };
              onAddToCart(adjustedProduct, qty);
            }}
            className={`flex-1 py-5 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${
              isOutOfStock || isAtLimit || qty < 1 ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed' : 'bg-gray-900 text-white shadow-gray-200'
            }`}
          >
            {isOutOfStock ? 'Currently Unavailable' : isAtLimit ? 'Max Stock in Cart' : qty < 1 ? 'Enter Quantity' : `Add to Cart - ₹${getPriceForSize(selectedSize) * qty}`}
          </button>
        </div>
      )}

      {/* Fullscreen Zoom Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[9999] flex flex-col justify-between p-6 backdrop-blur-md"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="text-left">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Sri Krishna Chit Fund Plan</span>
                <h3 className="text-white text-base font-black truncate max-w-[200px] sm:max-w-xs">{product.name}</h3>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
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
                  src={product.image}
                  className="max-h-[60vh] max-w-full object-contain cursor-zoom-out select-none active:scale-110 transition-transform"
                  alt={product.name}
                  onClick={() => setLightboxOpen(false)}
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
                      setLightboxOpen(false);
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
    </div>
  );
}
