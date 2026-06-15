// ─── ReviewsModal.tsx ─────────────────────────────────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import type { Review } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  show: boolean;
  restaurantId: number | null;
  reviews: { [key: number]: Review[] };
  loadingReviews: { [key: number]: boolean };
  userHasReviewed: { [key: number]: boolean };
  onClose: () => void;
  onReviewAdded: (restaurantId: number) => void;
};

export default function ReviewsModal({
  show, restaurantId, reviews, loadingReviews, userHasReviewed, onClose, onReviewAdded,
}: Props) {
  const { theme } = useTheme();
  const { authenticatedFetch, refreshToken, isTokenExpired } = useAuth();
  const [userRating, setUserRating]       = useState(0);
  const [userComment, setUserComment]     = useState('');
  const [submittingReview, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating]       = useState(0);
  const [editComment, setEditComment]     = useState('');
  const [deletingReview, setDeleting]     = useState(false);
  

  // ── Theme tokens ─────────────────────────────────────────────────────────────
  const bg        = theme === 'dark' ? '#111827'                : '#ffffff';
  const bgCard    = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const bgInput   = theme === 'dark' ? 'rgba(0,0,0,0.3)'       : 'rgba(0,0,0,0.04)';
  const bgSection = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const border    = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const borderSub = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textPri   = theme === 'dark' ? '#ffffff'                : '#0f172a';
  const textSec   = theme === 'dark' ? '#94a3b8'                : '#475569';
  const textMuted = theme === 'dark' ? '#475569'                : '#94a3b8';
  const starEmpty = theme === 'dark' ? '#334155'                : '#cbd5e1';
  const closeBtn  = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const closeIcon = theme === 'dark' ? '#94a3b8'                : '#475569';
  const cancelBtn = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const cancelTxt = theme === 'dark' ? '#94a3b8'                : '#475569';

  const close = () => {
    setUserRating(0);
    setUserComment('');
    setEditingReview(null);
    onClose();
  };
  // Add this helper function inside the component, after the state declarations
const ensureValidToken = async (): Promise<boolean> => {
  let token = localStorage.getItem('access_token');
  if (!token) {
    alert('Please login to continue');
    return false;
  }
  
  if (isTokenExpired(token)) {
    const newToken = await refreshToken();
    if (!newToken) {
      alert('Session expired. Please login again.');
      return false;
    }
  }
  return true;
};

 const handleAddReview = async () => {
  if (!restaurantId || userRating === 0) { 
    alert('Please select a rating'); 
    return; 
  }
  
  // Check token before proceeding
  const isValid = await ensureValidToken();
  if (!isValid) return;
  
  setSubmitting(true);
  try {
    const res = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/reviews/add/', {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId, rating: userRating, comment: userComment }),
    });
    const data = await res.json();
    if (res.ok) { 
      alert('Review added!'); 
      onReviewAdded(restaurantId); 
      setUserRating(0); 
      setUserComment(''); 
    } else {
      alert(data.error || 'Failed');
    }
  } catch { 
    alert('Error adding review'); 
  } finally { 
    setSubmitting(false); 
  }
};
const handleEditReview = async () => {
  if (!restaurantId || editRating === 0) { 
    alert('Please select a rating'); 
    return; 
  }
  
  // Check token before proceeding
  const isValid = await ensureValidToken();
  if (!isValid) return;
  
  setSubmitting(true);
  try {
    const res = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/reviews/update/', {
      method: 'PUT',
      body: JSON.stringify({ restaurant_id: restaurantId, rating: editRating, comment: editComment }),
    });
    const data = await res.json();
    if (res.ok) { 
      alert('Review updated!'); 
      onReviewAdded(restaurantId); 
      setEditingReview(null); 
      setEditRating(0); 
      setEditComment(''); 
    } else {
      alert(data.error || 'Failed');
    }
  } catch { 
    alert('Error'); 
  } finally { 
    setSubmitting(false); 
  }
};
  const handleDeleteReview = async () => {
  if (!restaurantId) return;
  if (!confirm('Delete your review?')) return;
  
  // Check token before proceeding
  const isValid = await ensureValidToken();
  if (!isValid) return;
  
  setDeleting(true);
  try {
    const res = await authenticatedFetch('https://basicsbox.pythonanywhere.com/api/reviews/delete/', {
      method: 'DELETE',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    });
    const data = await res.json();
    if (res.ok) { 
      alert('Review deleted!'); 
      onReviewAdded(restaurantId); 
    } else {
      alert(data.error || 'Failed');
    }
  } catch { 
    alert('Error'); 
  } finally { 
    setDeleting(false); 
  }
};
  const startEditing = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const currentReviews = restaurantId ? reviews[restaurantId] || [] : [];
  const isLoading      = restaurantId ? loadingReviews[restaurantId] : false;
  const hasReviewed    = restaurantId ? userHasReviewed[restaurantId] : false;

  return (
    <>
      {/* ── Main reviews modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {show && restaurantId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={close}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-5 max-h-[80vh] overflow-y-auto"
              style={{ background: bg, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm" style={{ color: textPri }}>Ratings & Reviews</h3>
                <button onClick={close}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ background: closeBtn }}>
                  <X className="w-4 h-4" style={{ color: closeIcon }} />
                </button>
              </div>

              {/* Write review */}
              {localStorage.getItem('access_token') ? (
                hasReviewed ? (
                  <div className="mb-4 p-3 rounded-2xl flex items-center gap-2 text-blue-500 text-xs font-black"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Star className="w-4 h-4 fill-blue-500" /> Already reviewed
                  </div>
                ) : (
                  <div className="mb-5 p-4 rounded-2xl" style={{ background: bgSection, border: `1px solid ${borderSub}` }}>
                    <p className="text-xs font-black mb-3" style={{ color: textPri }}>Rate your experience</p>
                    <div className="flex gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setUserRating(s)}>
                          <Star className={`w-8 h-8 transition-all ${userRating >= s ? 'fill-yellow-400 text-yellow-400 scale-110' : 'hover:text-yellow-400'}`}
                            style={{ color: userRating >= s ? undefined : starEmpty }} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Tell us about your experience..."
                      value={userComment}
                      onChange={e => setUserComment(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 text-xs focus:outline-none mb-3 resize-none rounded-xl transition-colors"
                      style={{
                        background: bgInput,
                        border: `1px solid ${borderSub}`,
                        color: textPri,
                      }}
                    />
                    <button
                      onClick={handleAddReview}
                      disabled={submittingReview || userRating === 0}
                      className="w-full py-2.5 rounded-xl font-black text-sm transition-all"
                      style={submittingReview || userRating === 0
                        ? { background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: textMuted, cursor: 'not-allowed' }
                        : { background: 'linear-gradient(135deg,#f97316,#fbbf24)', color: '#ffffff' }}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )
              ) : (
                <div className="mb-4 p-3 rounded-2xl text-center text-orange-500 text-xs font-black"
                  style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
                  Login to write a review
                </div>
              )}

              {/* All reviews label */}
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: textMuted }}>
                All Reviews ({currentReviews.length})
              </p>

              {/* Reviews list */}
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : currentReviews.length > 0 ? (
                <div className="space-y-3">
                  {currentReviews.map((r, idx) => {
                    const isMine = r.user_email === localStorage.getItem('email');
                    return (
                      <div key={idx} className="p-3 rounded-2xl" style={{ background: bgCard, border: `1px solid ${border}` }}>
                        {/* Review header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                              style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)' }}>
                              {r.user_email[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-black" style={{ color: textPri }}>
                              {r.user_email.split('@')[0]}
                            </span>
                            {isMine && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-black text-orange-500"
                                style={{ background: 'rgba(251,146,60,0.12)' }}>You</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg"
                            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                            <Star className="w-2.5 h-2.5 fill-white text-white" />
                            <span className="text-white text-[10px] font-black">{r.rating}</span>
                          </div>
                        </div>

                        {/* Comment */}
                        <p className="text-xs leading-relaxed" style={{ color: textSec }}>{r.comment}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px]" style={{ color: textMuted }}>
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                          {isMine && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => startEditing(r)}
                                className="text-[10px] text-blue-500 px-2 py-0.5 rounded-lg font-black transition-all hover:opacity-80"
                                style={{ background: 'rgba(59,130,246,0.1)' }}>
                                Edit
                              </button>
                              <button
                                onClick={handleDeleteReview}
                                disabled={deletingReview}
                                className="text-[10px] text-red-500 px-2 py-0.5 rounded-lg font-black transition-all hover:opacity-80 disabled:opacity-40"
                                style={{ background: 'rgba(239,68,68,0.1)' }}>
                                {deletingReview ? '...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-xs py-6" style={{ color: textMuted }}>
                  No reviews yet. Be the first!
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit review modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingReview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
            onClick={() => setEditingReview(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-5"
              style={{ background: bg, border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm" style={{ color: textPri }}>Edit Review</h3>
                <button
                  onClick={() => setEditingReview(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                  style={{ background: closeBtn }}>
                  <X className="w-3.5 h-3.5" style={{ color: closeIcon }} />
                </button>
              </div>

              {/* Star rating */}
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setEditRating(s)}>
                    <Star className={`w-7 h-7 transition-all ${editRating >= s ? 'fill-yellow-400 text-yellow-400' : 'hover:text-yellow-400'}`}
                      style={{ color: editRating >= s ? undefined : starEmpty }} />
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                placeholder="Update your review..."
                value={editComment}
                onChange={e => setEditComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-xs focus:outline-none mb-3 resize-none rounded-xl transition-colors"
                style={{ background: bgInput, border: `1px solid ${borderSub}`, color: textPri }}
              />

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2.5 rounded-xl font-black text-xs transition-all hover:opacity-80"
                  style={{ background: cancelBtn, color: cancelTxt }}>
                  Cancel
                </button>
                <button
                  onClick={handleEditReview}
                  disabled={submittingReview || editRating === 0}
                  className="flex-1 py-2.5 rounded-xl font-black text-xs transition-all"
                  style={submittingReview || editRating === 0
                    ? { background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: textMuted, cursor: 'not-allowed' }
                    : { background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', color: '#ffffff' }}>
                  {submittingReview ? 'Updating...' : 'Update Review'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}