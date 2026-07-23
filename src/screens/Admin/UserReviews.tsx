import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, Star } from "lucide-react";
import { adminApi } from "@/lib/adminApi";

export default function UserReviews() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadReviews() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUserReviews(id);
      setReviews(data);
    } catch (err) {
      setError("Failed to load user reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [id]);

  async function handleDeleteReview(reviewId: number) {
    const confirmDelete = window.confirm("Are you sure you want to delete this review? This action is permanent!");
    if (!confirmDelete) return;

    setDeletingId(reviewId);
    try {
      await adminApi.deleteReview(reviewId);
      setReviews(reviews.filter((r) => r.id !== reviewId));
      alert("Review deleted successfully!");
    } catch (err) {
      alert("Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="px-4 py-8 text-sm text-slate">Loading user reviews...</p>;
  if (error) return <p className="px-4 py-8 text-sm text-coral">{error}</p>;

  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(`/admin/users/${id}`)}
          className="p-1 hover:bg-slate-100 rounded-full transition-all"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-lg text-black">User Reviews</h2>
          <p className="text-[10px] text-slate mt-0.5 uppercase tracking-wider font-bold">Written Feedback</p>
        </div>
      </div>

      {/* Reviews list */}
      <div className="flex flex-col gap-4">
        {reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Reviewed Property</span>
                  <button 
                    onClick={() => navigate(`/admin/properties/${r.property_id}`)}
                    className="font-display font-extrabold text-sm text-ink hover:text-emerald-600 transition-colors text-left"
                  >
                    {r.property_title || "Unnamed Property"}
                  </button>
                </div>
                
                <button 
                  disabled={deletingId === r.id}
                  onClick={() => handleDeleteReview(r.id)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all border border-rose-100 disabled:opacity-50"
                  title="Delete Review"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Star rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={14} 
                    className={`${star <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                  />
                ))}
                <span className="text-xs text-slate font-medium ml-1">({r.rating}/5)</span>
              </div>

              {/* Comment */}
              <p className="text-xs text-charcoal bg-slate-50/70 p-3 rounded-2xl border border-charcoal/5 leading-relaxed">
                {r.comment || <span className="text-slate italic">No comment provided.</span>}
              </p>

              {/* Date */}
              <span className="text-[9px] text-slate font-medium self-end">
                Posted: {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate italic bg-slate-50 border border-charcoal/5 rounded-2xl p-6 text-center">
            No reviews written by this user.
          </p>
        )}
      </div>
    </div>
  );
}
