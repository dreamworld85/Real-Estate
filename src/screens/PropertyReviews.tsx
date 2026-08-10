import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Star, Send, MessageSquare } from "lucide-react";
import { api, ApiReview, ApiPropertyDetail } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";

export default function PropertyReviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New review form states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadData() {
    if (!id) return;
    try {
      const [propData, reviewsData] = await Promise.all([
        api.fetchProperty(id),
        api.fetchReviews(id)
      ]);
      setProperty(propData);
      setReviews(reviewsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitReview(id, userRating, userComment);
      setSuccess(true);
      setUserComment("");
      setUserRating(5);
      await loadData(); // Reload list and average stats
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="px-6 py-10 text-sm text-slate">Loading reviews…</p>;
  }

  const avgRating = property?.avgRating || 0;
  const ratingCount = property?.ratingCount || 0;

  return (
    <div className="min-h-screen flex flex-col pb-28 bg-slate-50">
      {/* Custom Clean Header */}
      <div className="flex items-center px-4 py-4 bg-white border-b border-charcoal/5 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-1 hover:bg-slate-100 rounded-full text-ink transition-colors mr-2 cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display font-extrabold text-md text-black">Reviews & Ratings</h1>
      </div>

      <div className="px-6 py-5 flex flex-col gap-5 flex-1 max-w-[420px] mx-auto w-full">
        {/* Rating Summary Card */}
        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate uppercase font-bold tracking-wider">Overall Rating</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display font-extrabold text-3xl text-ink">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-slate">/ 5.0</span>
            </div>
            <p className="text-[10px] text-slate mt-1">{ratingCount} user ratings</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= Math.round(avgRating)
                      ? "fill-gold text-gold"
                      : "text-slate-200"
                  }
                />
              ))}
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold mt-1">
              Verified Listings
            </span>
          </div>
        </div>

        {/* Submit Review Card */}
        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">
            Write a Review
          </span>

          {user ? (
            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              {/* Interactive Stars */}
              <div className="flex items-center gap-2 py-1">
                <span className="text-xs text-charcoal font-semibold mr-1">Your Rating:</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= userRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      >
                        <Star
                          size={22}
                          className={active ? "fill-gold text-gold" : "text-slate-200"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                rows={3}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your experience with this property..."
                required
                className="w-full rounded-xl border border-charcoal/10 bg-slate-50 px-4 py-3 text-xs text-charcoal placeholder:text-slate/40 focus:border-emerald-600/50 outline-none resize-none h-20"
              />

              {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
              {success && (
                <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 py-1.5 px-3 rounded-lg">
                  Review submitted successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-display font-semibold text-xs transition-all shadow-md bg-ink hover:bg-black text-cream active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Send size={13} />
                <span>{submitting ? "Submitting Review…" : "Submit Review"}</span>
              </button>
            </form>
          ) : (
            <div className="py-4 text-center flex flex-col items-center gap-3">
              <p className="text-xs text-slate font-medium">Please sign in to submit a review for this property.</p>
              <button
                onClick={() => navigate("/login", { state: { from: `/property/${id}/reviews` } })}
                className="px-4 py-2 bg-ink hover:bg-black text-cream text-xs font-bold rounded-xl uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">
            Reviews ({reviews.length})
          </span>

          <div className="flex flex-col gap-3">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-ink">{r.reviewer_name}</h4>
                      <p className="text-[9px] text-slate mt-0.5">
                        {new Date(r.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5 bg-amber bg-opacity-10 px-2 py-1 rounded-lg">
                      <Star size={11} className="fill-gold text-gold shrink-0" />
                      <span className="text-[10px] font-bold text-amber">{r.rating}.0</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs text-slate/90 leading-relaxed border-t border-slate-50 pt-2 font-medium">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white border border-charcoal/4 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate">
                <MessageSquare size={24} className="opacity-30" />
                <p className="text-xs font-bold">No reviews yet</p>
                <p className="text-[10px] max-w-[200px] leading-relaxed">
                  Be the first to rate and review this listing!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
