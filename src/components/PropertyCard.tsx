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
  const rating = property.avgRating !== undefined && property.avgRating > 0 ? property.avgRating : 4.5;

  return (
    <button
      onClick={() => navigate(isOwner ? `/my-properties/${property.id}` : `/property/${property.id}`)}
      className="relative w-full aspect-[4/4.1] rounded-[16px] overflow-hidden group hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-md text-left cursor-pointer border border-charcoal/5"
    >
      {/* Background Image */}
      <img
        src={image}
        alt={property.title}
        style={{ objectFit: "cover" }}
        className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Top Left: Verification Badge */}
      {property.isFeatured && (
        <div 
          style={{ width: "15px", height: "15px" }}
          className="absolute top-3 left-3 z-10 flex items-center justify-center bg-blue-500 text-white rounded-full shadow-sm border border-dashed border-white"
        >
          <svg 
            style={{ width: "10px", height: "10px" }}
            className="fill-current" 
            viewBox="0 0 20 20"
          >
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
          </svg>
        </div>
      )}

      {/* Top Right: Price Tag */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm text-charcoal text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm">
        {formatPrice(property.price)}
        {property.purpose === "For Rent" && <span className="text-[8px] font-medium text-slate-500">/ Mo</span>}
      </div>

      {/* Absolute Favorite Button (below price tag) */}
      <span
        onClick={handleSaveClick}
        className="absolute top-11 right-3 z-10 bg-black/45 backdrop-blur-sm hover:bg-black/60 active:scale-90 text-white rounded-full p-2 transition-all shadow-sm cursor-pointer"
      >
        <Heart size={15} className={saved ? "fill-coral text-coral" : "text-white"} />
      </span>

      {/* Bottom Content Container */}
      <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 flex flex-col pointer-events-none">
        {/* Star Rating Badge */}
        <div className="bg-white/95 backdrop-blur-sm text-charcoal text-[8px] font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 w-fit mb-1.5 shadow-sm">
          <Star size={11} className="fill-gold text-gold" />
          <span>{rating.toFixed(1)}</span>
        </div>

        {/* Property Title */}
        <h3 className="font-display font-medium text-[11px] text-white truncate leading-tight select-none">
          {property.title.replace("Plot / Land", "Land").replace("Independent House / Villa", "House")}
        </h3>

        {/* Location Row */}
        <div className="flex items-center gap-1 text-[8.5px] text-white/80 mt-0.5 select-none truncate">
          <MapPin size={11} className="shrink-0 text-white/80" />
          <span>{compact ? property.district : `${property.address}, ${property.district}`}</span>
        </div>
      </div>
    </button>
  );
}
