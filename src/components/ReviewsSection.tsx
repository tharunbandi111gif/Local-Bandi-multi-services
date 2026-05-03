import React, { useState } from 'react';
import { Star, Send, User } from 'lucide-react';
import { Review } from '../types';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => void;
}

export default function ReviewsSection({ reviews, onAddReview }: ReviewsSectionProps) {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddReview(newRating, newComment);
    setNewComment('');
    setNewRating(5);
    setShowAddReview(false);
  };

  return (
    <div className="space-y-6 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-gray-900">User Reviews</h3>
        <button 
          onClick={() => setShowAddReview(!showAddReview)}
          className="text-xs font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-4 py-2 rounded-xl active:scale-95 transition-all"
        >
          {showAddReview ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Ratings Summary */}
      {!showAddReview && reviews.length > 0 && (
        <div className="bg-gray-50/50 rounded-[2rem] p-6 flex items-center gap-8 border border-gray-100">
          <div className="text-center">
            <p className="text-4xl font-black text-gray-900 leading-none">
              {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
            </p>
            <div className="flex items-center gap-0.5 justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{reviews.length} total</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const percentage = (count / reviews.length) * 100;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 w-2">{stars}</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-900 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAddReview && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-[2rem] border-2 border-gray-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">Your Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                className="p-1 transition-all active:scale-125"
              >
                <Star className={`w-6 h-6 ${star <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea
            required
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience with this service..."
            className="w-full h-24 bg-white rounded-2xl p-4 text-sm font-medium border-2 border-transparent focus:border-yellow-400 outline-none transition-all resize-none"
          />
          <button
            type="submit"
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            Submit Review
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">{review.userName}</p>
                    <p className="text-[10px] font-bold text-gray-400">{review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium leading-relaxed">
                {review.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
