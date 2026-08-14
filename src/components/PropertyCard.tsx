import { useState, useEffect } from "react";
import { Heart, MapPin, BedDouble, Bath, Star, Eye } from "lucide-react";
import { ApiProperty, mediaUrl, formatArea, api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

function formatPostedDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // If posted in a different calendar year, include the year
  if (date.getFullYear() !== now.getFullYear()) {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function PropertyCard({ 
  property,
  onToggleSave,
  compact = false
}: { 
  property: ApiProperty;
  onToggleSave?: (id: number, isSaved: boolean) => void;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(property.isSaved || false);
  const [busy, setBusy] = useState(false);
  const isOwner = user && user.id === property.ownerId;

  useEffect(() => {
    setSaved(property.isSaved || false);
  }, [property.isSaved]);

  async function handleSaveClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.toggleSaveProperty(property.id);
      setSaved(res.saved);
      if (onToggleSave) {
        onToggleSave(property.id, res.saved);
      }
    } catch (err) {
      console.error("Failed to toggle save property:", err);
    } finally {
      setBusy(false);
    }
  }

  const image = property.images[0] ? mediaUrl(property.images[0]) : FALLBACK_IMAGE;

  return (
    <button
      onClick={() => navigate(isOwner ? `/my-properties/${property.id}` : `/property/${property.id}`)}
      className={`group w-full text-left bg-white rounded-[16px] border hover:scale-[1.005] transition-all duration-300 overflow-hidden active:scale-[0.99] cursor-pointer ${
        property.isFeatured 
          ? "border-amber-300 shadow-[0_8px_30px_rgb(200,155,60,0.06)] hover:border-amber-400/80 bg-gradient-to-b from-amber-50/15 to-white" 
          : "border-charcoal/4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
      }`}
    >
      <div className="relative h-32 bg-sage overflow-hidden">
        <img
          src={image}
          alt={property.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {property.isFeatured && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-gold text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-white/20 select-none">
            <Star size={8} className="fill-white text-white" />
            <span>Featured</span>
          </div>
        )}
        {property.avgRating !== undefined && (
          <div className={`absolute top-2.5 ${property.isFeatured ? "left-16" : "left-2.5"} bg-black/60 backdrop-blur-sm text-gold text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none transition-all`}>
            <Star size={10} className="fill-gold text-gold" />
            <span>{property.avgRating.toFixed(1)}</span>
          </div>
        )}
        <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
          <Eye size={10} />
          <span>{property.views || 0}</span>
        </div>
        <span
          onClick={handleSaveClick}
          className="absolute top-2.5 right-2.5 bg-white/90 rounded-full p-1.5 cursor-pointer hover:bg-white active:scale-95 transition-transform"
        >
          <Heart size={14} className={saved ? "fill-coral text-coral" : "text-ink"} />
        </span>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <p className="font-display font-bold text-[15px] text-ink">
            {formatPrice(property.price)}
          </p>
          {property.isPriceNegotiable && (
            <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-500/10 px-1.5 py-0.2 rounded uppercase tracking-wider">
              Nego
            </span>
          )}
        </div>
        <p className="font-display font-semibold text-xs text-charcoal leading-snug truncate">
          {property.title}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate mt-0.5 gap-2">
          <p className="flex items-center gap-0.5 truncate">
            <MapPin size={11} className="shrink-0 text-slate/80" /> 
            <span>{compact ? property.district : `${property.address}, ${property.district}`}</span>
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {!compact && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate/75 bg-slate-100/70 border border-charcoal/5 px-1.5 py-0.5 rounded-md">
                <Eye size={10} className="text-slate/60" />
                <span>{property.views || 0}</span>
              </span>
            )}
            <span className="shrink-0 text-[10px] text-slate/60 font-semibold bg-slate-100/70 border border-charcoal/5 px-1.5 py-0.5 rounded-md">
              {formatPostedDate(property.createdAt)}
            </span>
          </div>
        </div>
        {!compact && (
          <div className="flex items-center gap-3 text-xs text-slate mt-1 w-full">
            <span>{formatArea(property.areaSqft, property.propertyType)}</span>
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble size={13} /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath size={13} /> {property.bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-slate/75 ml-auto shrink-0">
              <Eye size={13} className="text-slate/60" />
              <span>{property.views || 0}</span>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
