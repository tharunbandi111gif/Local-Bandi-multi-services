import React, { useState } from 'react';
import { Star, Send, User, Pencil, Trash2, Check, X } from 'lucide-react';
import { Review } from '../types';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => void;
  isAdmin?: boolean;
  onDeleteReview?: (id: string) => void;
  onEditReview?: (id: string, updatedComment: string, updatedRating: number) => void;
}

export default function ReviewsSection({ 
  reviews, 
  onAddReview, 
  isAdmin = false,
  onDeleteReview,
  onEditReview
}: ReviewsSectionProps) {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);

  // States for inline editing
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');
  const [editingRating, setEditingRating] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddReview(newRating, newComment);
    setNewComment('');
    setNewRating(5);
    setShowAddReview(false);
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditingComment(review.comment);
    setEditingRating(review.rating);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditingComment('');
  };

  const saveEdit = (id: string) => {
    if (!editingComment.trim()) return;
    if (onEditReview) {
      onEditReview(id, editingComment, editingRating);
    }
    setEditingReviewId(null);
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
          reviews.map((review) => {
            const isEditing = editingReviewId === review.id;
            return (
              <div key={review.id} className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm relative group overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-105 rounded-full bg-yellow-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{review.userName}</p>
                      <p className="text-[10px] font-bold text-gray-400">{review.date}</p>
                    </div>
                  </div>

                  {/* Stars/Rating selector */}
                  {isEditing ? (
                    <div className="flex gap-1 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setEditingRating(star)}>
                          <Star className={`w-4 h-4 ${star <= editingRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center h-8">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>

                      {/* Administrative Option Handles */}
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 ml-4 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm">
                          <button
                            onClick={() => startEditing(review)}
                            className="p-1 hover:bg-white rounded-lg text-indigo-600 transition-colors"
                            title="Edit Comment"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (onDeleteReview) {
                                if (window.confirm("Are you sure you want to permanently delete this comment?")) {
                                  onDeleteReview(review.id);
                                }
                              }
                            }}
                            className="p-1 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <textarea
                      value={editingComment}
                      onChange={(e) => setEditingComment(e.target.value)}
                      className="w-full h-18 bg-gray-50 rounded-xl p-3 text-sm font-medium border-2 border-transparent focus:border-yellow-400 outline-none transition-all resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(review.id)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm font-medium leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            );
          })
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
