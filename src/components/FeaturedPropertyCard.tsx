import { Star, ChevronRight } from "lucide-react";
import { ApiProperty, mediaUrl } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function FeaturedPropertyCard({ property }: { property: ApiProperty }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user && user.id === property.ownerId;

  const image = property.images[0] ? mediaUrl(property.images[0]) : FALLBACK_IMAGE;
  const rating = property.avgRating !== undefined && property.avgRating > 0 ? property.avgRating : 4.5;

  return (
    <div
      onClick={() => navigate(isOwner ? `/my-properties/${property.id}` : `/property/${property.id}`)}
      className="relative w-full aspect-[16/10] rounded-[16px] overflow-hidden group hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-md text-left cursor-pointer border border-charcoal/5 bg-slate-100 select-none"
    >
      {/* Background Image */}
      <img
        src={image}
        alt={property.title}
        style={{ objectFit: "cover" }}
        className="absolute inset-0 w-full h-full scale-[1.28] group-hover:scale-[1.33] transition-transform duration-500"
      />

      {/* Vignette Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      {/* Top Left: Rating Badge (White Pill) */}
      <div className="absolute top-3.5 left-3.5 z-10 bg-white/95 backdrop-blur-sm text-charcoal text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm border border-charcoal/5">
        <span>{rating.toFixed(1)}</span>
        <Star size={9.5} className="fill-gold text-gold" />
      </div>

      {/* Bottom Left Content Info */}
      <div className="absolute bottom-12 left-5 right-5 z-10 text-white flex flex-col gap-0.5 text-left">
        <h3 className="font-display font-extrabold text-[16px] leading-tight text-white drop-shadow-sm select-none truncate">
          {property.title.replace("Plot / Land", "Land").replace("Independent House / Villa", "House")}
        </h3>
        <p className="text-[10px] text-white/85 font-medium mt-0.5 drop-shadow-sm select-none">
          {formatPrice(property.price)}
          {property.purpose === "For Rent" && <span className="text-[8px] font-medium">/Mo</span>}
          {` • ${property.propertyType === "Plot / Land" ? "Land" : property.propertyType === "Independent House / Villa" ? "House" : property.propertyType}`}
        </p>
      </div>

      {/* Bottom Left Curved Box with Right Arrow */}
      <div className="bg-[#60A963] text-white rounded-tr-[16px] rounded-bl-[16px] w-12 h-10 flex items-center justify-center absolute bottom-0 left-0 z-20 shadow-md">
        <ChevronRight size={18} className="text-white" />
      </div>
    </div>
  );
}
