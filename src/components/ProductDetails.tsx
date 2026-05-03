import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, ShieldCheck, Heart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Review } from '../types';
import ReviewsSection from './ReviewsSection';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  isInWishlist: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (prod: Product, qty: number) => void;
}

export default function ProductDetails({ product, onBack, isInWishlist, onToggleWishlist, onAddToCart }: ProductDetailsProps) {
  const [qty, setQty] = useState(1);
  const stock = product.stock ?? 10;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock < 5;

  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="bg-rose-50 text-rose-500 border border-rose-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
          Out of Stock
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
          Low Stock: Only {stock} Left!
        </span>
      );
    }
    return (
      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
        In Stock
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
    setQty(Math.min(Math.max(0, num), stock));
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

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-y-auto">
      <div className="relative h-2/5 shrink-0">
        {product.image && <img src={product.image} className="w-full h-full object-cover" alt={product.name} />}
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
              <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">{product.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-black text-gray-900">
                {(localReviews.reduce((acc, r) => acc + r.rating, 0) / localReviews.length).toFixed(1)}
              </span>
              <span className="text-gray-400 text-xs font-bold">({localReviews.length} Reviews)</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{product.name}</h2>
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

        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Select Quantity</label>
            <AnimatePresence mode="wait">
              <motion.div 
                key={isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
              >
                {getStockBadge()}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center bg-gray-50 border-2 rounded-[2rem] p-2 transition-all shadow-inner ${isOutOfStock ? 'opacity-50 grayscale' : 'border-gray-100 group-focus-within:border-gray-300'}`}>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                disabled={qty <= 1 || isOutOfStock}
                onClick={() => setQty(qty - 1)}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-100 active:scale-95 transition-all disabled:opacity-50 text-gray-900"
              >
                <Minus className="w-5 h-5" />
              </motion.button>
              
              <div className="relative overflow-hidden px-2">
                <input 
                  type="number"
                  disabled={isOutOfStock}
                  value={qty || ''}
                  onKeyDown={(e) => {
                    if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  onBlur={() => {
                    if (!qty || qty < 1) setQty(1);
                  }}
                  className="w-16 text-center text-xl font-black text-gray-900 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:scale-110 transition-transform"
                />
              </div>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                disabled={qty >= stock || isOutOfStock}
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
              <p className="text-2xl font-black text-gray-900">₹{product.price * (isOutOfStock ? 0 : qty)}</p>
            </motion.div>
          </div>
        </div>

        <ReviewsSection reviews={localReviews} onAddReview={handleAddReview} />
      </div>

      <div className="p-6 bg-white border-t border-gray-100 fixed bottom-0 inset-x-0 z-20 flex gap-3">
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
          disabled={isOutOfStock || qty < 1}
          onClick={() => onAddToCart(product, qty)}
          className={`flex-1 py-5 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all ${
            isOutOfStock || qty < 1 ? 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed' : 'bg-gray-900 text-white shadow-gray-200'
          }`}
        >
          {isOutOfStock ? 'Currently Unavailable' : qty < 1 ? 'Enter Quantity' : `Add to Cart - ₹${product.price * qty}`}
        </button>
      </div>
    </div>
  );
}
