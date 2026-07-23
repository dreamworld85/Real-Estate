import { useState, useEffect } from "react";
import { Heart, MapPin, BedDouble, Bath, Star } from "lucide-react";
import { ApiProperty, mediaUrl, formatArea, api } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
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
  const [saved, setSaved] = useState(property.isSaved || false);
  const [busy, setBusy] = useState(false);

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
      onClick={() => navigate(`/property/${property.id}`)}
      className="w-full text-left bg-white rounded-card shadow-card overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="relative h-32 bg-sage">
        <img
          src={image}
          alt={property.title}
          className="h-full w-full object-cover"
        />
        {property.avgRating !== undefined && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-gold text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none">
            <Star size={10} className="fill-gold text-gold" />
            <span>{property.avgRating.toFixed(1)}</span>
          </div>
        )}
        <span
          onClick={handleSaveClick}
          className="absolute top-2.5 right-2.5 bg-white/90 rounded-full p-1.5 cursor-pointer hover:bg-white active:scale-95 transition-transform"
        >
          <Heart size={14} className={saved ? "fill-coral text-coral" : "text-ink"} />
        </span>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-display font-bold text-[15px] text-ink">
          {formatPrice(property.price)}
        </p>
        <p className="font-display font-semibold text-xs text-charcoal leading-snug truncate">
          {property.title}
        </p>
        <p className="flex items-center gap-0.5 text-[11px] text-slate truncate">
          <MapPin size={11} className="shrink-0 text-slate/80" /> 
          <span>{compact ? property.district : `${property.address}, ${property.district}`}</span>
        </p>
        {!compact && (
          <div className="flex items-center gap-3 text-xs text-slate mt-1">
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
          </div>
        )}
      </div>
    </button>
  );
}
