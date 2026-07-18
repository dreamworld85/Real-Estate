import { Heart, MapPin, BedDouble, Bath } from "lucide-react";
import { ApiProperty, mediaUrl } from "@/lib/api";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function PropertyCard({ property }: { property: ApiProperty }) {
  const navigate = useNavigate();
  const image = property.images[0] ? mediaUrl(property.images[0]) : FALLBACK_IMAGE;

  return (
    <button
      onClick={() => navigate(`/property/${property.id}`)}
      className="w-full text-left bg-white rounded-card shadow-card overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="relative h-40 bg-sage">
        <img
          src={image}
          alt={property.title}
          className="h-full w-full object-cover"
        />
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
        >
          <Heart size={16} className="text-ink" />
        </span>
      </div>
      <div className="p-3.5 flex flex-col gap-1.5">
        <p className="font-display font-bold text-lg text-ink">
          {formatPrice(property.price)}
        </p>
        <p className="font-display font-semibold text-[15px] text-charcoal leading-snug">
          {property.title}
        </p>
        <p className="flex items-center gap-1 text-sm text-slate">
          <MapPin size={13} /> {property.address}, {property.district}
        </p>
        <div className="flex items-center gap-3 text-sm text-slate mt-1">
          <span>{property.areaSqft} sq.ft</span>
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
      </div>
    </button>
  );
}
