import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, MessageSquare, Heart, Pencil, Power, Trash2, ChevronLeft, Share2, Star } from "lucide-react";
import { api, ApiPropertyDetail, mediaUrl, formatArea } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import BottomNav from "@/components/BottomNav";
import { useAddProperty } from "@/lib/AddPropertyContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

export default function OwnerPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { startEditing } = useAddProperty();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

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
    <div className="min-h-screen pb-28">
      <div className="relative">
        <div 
          onScroll={(e) => {
            const container = e.currentTarget;
            const scrollPos = container.scrollLeft;
            const width = container.offsetWidth;
            if (width > 0) {
              setActiveIdx(Math.round(scrollPos / width));
            }
          }}
          className="flex w-full h-64 overflow-x-auto snap-x snap-mandatory no-scrollbar bg-slate-100"
        >
          {property.images && property.images.length > 0 ? (
            <>
              {property.images.map((img, idx) => (
                <div key={`img-${idx}`} className="w-full h-full flex-shrink-0 snap-start">
                  <img
                    src={mediaUrl(img)}
                    alt={`${property.title} - image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {property.videos && property.videos.map((vid, idx) => (
                <div key={`vid-${idx}`} className="w-full h-full flex-shrink-0 snap-start bg-black flex items-center justify-center">
                  <video
                    src={mediaUrl(vid)}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="w-full h-full flex-shrink-0 snap-start">
              <img
                src={FALLBACK_IMAGE}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        {/* Indicators */}
        {((property.images?.length || 0) + (property.videos?.length || 0)) > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/35 px-2.5 py-1.5 rounded-full z-10">
            {Array.from({ length: (property.images?.length || 0) + (property.videos?.length || 0) }).map((_, idx) => (
              <span 
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  activeIdx === idx ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 rounded-full p-2 z-10 shadow-sm"
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <button className="absolute top-4 right-4 bg-white/90 rounded-full p-2 z-10 shadow-sm">
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
        <p className="text-sm text-slate mt-1">{formatArea(property.areaSqft, property.propertyType)} &middot; {property.district}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <button 
            onClick={() => navigate(`/property/${property.id}/reviews`)}
            className="flex items-center gap-1 bg-amber bg-opacity-10 hover:bg-opacity-20 text-amber px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer animate-fade-in"
          >
            <Star size={12} className="fill-gold text-gold" />
            <span>{property.avgRating ? property.avgRating.toFixed(1) : "0.0"}</span>
            <span className="text-slate/75 font-semibold">({property.ratingCount || 0} reviews)</span>
          </button>
        </div>

        {property.description && (
          <p className="text-sm text-slate leading-relaxed mt-4">{property.description}</p>
        )}

        {property.youtubeUrl && getYoutubeEmbedUrl(property.youtubeUrl) && (
          <div className="mt-6">
            <h2 className="font-display font-bold text-ink mb-2">Video Tour</h2>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-charcoal/8 shadow-sm">
              <iframe
                src={getYoutubeEmbedUrl(property.youtubeUrl)!}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>
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
          <button 
            onClick={() => {
              if (property) {
                startEditing(property);
                navigate("/add-property/details");
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 border border-forest text-forest font-display font-semibold text-[15px]"
          >
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
      <BottomNav />
    </div>
  );
}
