import { useState, useEffect } from "react";
import { Heart, Star } from "lucide-react";
import { ApiProperty, mediaUrl, api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number, purpose?: string): string {
  let text = "";
  if (price >= 10000000) text = `₹${(price / 10000000).toFixed(2)} Cr`;
  else if (price >= 100000) text = `₹${(price / 100000).toFixed(1)} L`;
  else text = `₹${price.toLocaleString("en-IN")}`;

  if (purpose === "For Rent") {
    return `${text} for 1 night`;
  }
  return text;
}

export default function PropertyCard({ 
  property,
  onToggleSave,
  compact = false,
  onClick
}: { 
  property: ApiProperty;
  onToggleSave?: (id: number, isSaved: boolean) => void;
  compact?: boolean;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  const { user, token } = useAuth();
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

  const firstImg = property.images && property.images[0] ? property.images[0] : null;
  const image = firstImg
    ? (firstImg.startsWith("/uploads/") ? mediaUrl(firstImg) : firstImg)
    : FALLBACK_IMAGE;

  const rating = property.avgRating !== undefined && property.avgRating > 0 ? property.avgRating : 5.0;

  const displayTag = property.purpose === "For Rent"
    ? "For Rent"
    : (property.purpose === "For Sale" ? "Sales" : (property.purpose || "Sales"));

  const displayTitle = property.title.toLowerCase().includes(property.district.toLowerCase())
    ? property.title
    : `${property.title} in ${property.district}`;

  const priceFormatted = formatPrice(property.price, property.purpose);
  const roleFormatted = property.purpose === "For Rent" ? "" : (property.listingRole || "Broker");

  return (
    <div
      onClick={() => {
        if (onClick) {
          onClick();
        } else if (!token && window.innerWidth >= 1000) {
          localStorage.setItem("pending_deep_link", `/property/${property.id}`);
          navigate("/login", { state: { from: `/property/${property.id}` } });
        } else {
          navigate(isOwner ? `/my-properties/${property.id}` : `/property/${property.id}`);
        }
      }}
      className="group bg-transparent transition-all duration-300 cursor-pointer flex flex-col text-left select-none w-full"
    >
      {/* Property Image Container */}
      <div className="relative aspect-[4/3.1] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-xs">
        <img
          src={image}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />

        {/* Top Left Overlay Tag (Sales / For Rent / etc.) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2.5 py-0.5 bg-white/95 text-gray-900 font-semibold text-[10.5px] rounded-full shadow-xs backdrop-blur-xs select-none">
            {displayTag}
          </span>
        </div>

        {/* Top Right Overlay Favorite Heart Icon */}
        <button
          type="button"
          onClick={handleSaveClick}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/25 hover:bg-black/50 backdrop-blur-md text-white flex items-center justify-center transition-all shadow-xs active:scale-90 cursor-pointer"
          title="Favorite"
        >
          <Heart size={15} className={saved ? "fill-rose-500 text-rose-500" : "text-white"} />
        </button>
      </div>

      {/* Text Section Below Image */}
      <div className="pt-2 px-0.5 flex flex-col">
        {/* Line 1: Property Location / Title */}
        <h3 className="font-semibold text-[13px] sm:text-[13.5px] text-gray-900 truncate leading-tight group-hover:text-emerald-700 transition-colors">
          {displayTitle}
        </h3>

        {/* Line 2: Price + Agent/Broker/Owner + Rating Number */}
        <p className="text-xs text-gray-600 font-medium mt-1 truncate flex items-center gap-1">
          <span>{priceFormatted} {roleFormatted}</span>
          <span className="text-gray-400">·</span>
          <span className="flex items-center gap-0.5 text-gray-800 font-semibold">
            <Star size={12} className="fill-amber-400 text-amber-400 inline" />
            <span>{rating.toFixed(rating % 1 === 0 ? 1 : 2)}</span>
          </span>
        </p>
      </div>
    </div>
  );
}

