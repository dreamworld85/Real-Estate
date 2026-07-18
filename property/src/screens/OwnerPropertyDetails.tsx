import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, MessageSquare, Heart, Pencil, Power, Trash2, ChevronLeft, Share2 } from "lucide-react";
import { api, ApiPropertyDetail, mediaUrl } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function OwnerPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .fetchProperty(id)
      .then(setProperty)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleActive() {
    if (!property) return;
    setBusy(true);
    try {
      const nextStatus = property.status === "Active" ? "Inactive" : "Active";
      await api.updatePropertyStatus(property.id, nextStatus);
      setProperty({ ...property, status: nextStatus });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!property) return;
    setBusy(true);
    try {
      await api.deleteProperty(property.id);
      navigate("/my-properties");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="px-4 py-10 text-sm text-slate">Loading…</p>;
  if (error || !property) return <p className="px-4 py-10 text-sm text-coral">{error || "Not found."}</p>;

  const heroImage = property.images[0] ? mediaUrl(property.images[0]) : FALLBACK_IMAGE;

  return (
    <div className="min-h-screen pb-8">
      <div className="relative">
        <img src={heroImage} alt={property.title} className="w-full h-64 object-cover" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 rounded-full p-2"
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <button className="absolute top-4 right-4 bg-white/90 rounded-full p-2">
          <Share2 size={18} className="text-ink" />
        </button>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge status={property.status} />
        </div>
        <p className="font-display font-extrabold text-2xl text-ink">
          {formatPrice(property.price)}
        </p>
        <p className="font-display font-semibold text-charcoal mt-1">{property.title}</p>
        <p className="text-sm text-slate mt-1">{property.areaSqft} sq.ft &middot; {property.district}</p>

        {property.description && (
          <p className="text-sm text-slate leading-relaxed mt-4">{property.description}</p>
        )}

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-3.5 flex flex-col items-center gap-1">
            <Eye size={18} className="text-ink" />
            <p className="font-display font-bold text-lg text-ink">{property.views}</p>
            <p className="text-xs text-slate">Views</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-3.5 flex flex-col items-center gap-1">
            <MessageSquare size={18} className="text-forest" />
            <p className="font-display font-bold text-lg text-ink">{property.enquiryCount}</p>
            <p className="text-xs text-slate">Enquiries</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-3.5 flex flex-col items-center gap-1">
            <Heart size={18} className="text-coral" />
            <p className="font-display font-bold text-lg text-ink">{property.saveCount}</p>
            <p className="text-xs text-slate">Saves</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 border border-forest text-forest font-display font-semibold text-[15px]">
            <Pencil size={16} /> Edit Property
          </button>
        </div>
        <div className="flex gap-3 mt-3">
          <button
            disabled={busy}
            onClick={handleToggleActive}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 border border-amber text-amber font-display font-semibold text-[15px] disabled:opacity-40"
          >
            <Power size={16} /> {property.status === "Active" ? "Deactivate" : "Activate"}
          </button>
          <button
            disabled={busy}
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 border border-coral text-coral font-display font-semibold text-[15px] disabled:opacity-40"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
