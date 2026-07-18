import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Share2, Flag, Phone, MessageCircle, ChevronLeft, MapPin } from "lucide-react";
import { api, ApiPropertyDetail, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import RoleBadge from "@/components/RoleBadge";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function PublicPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .fetchProperty(id)
      .then(setProperty)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!property) return;
    if (!token) return navigate("/login");
    setSaving(true);
    try {
      const { saved } = await api.toggleSaveProperty(property.id);
      setProperty((p) => (p ? { ...p, isSaved: saved, saveCount: p.saveCount + (saved ? 1 : -1) } : p));
    } catch {
      // Silently ignore — the button state just won't flip.
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: property?.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  if (loading) {
    return <p className="px-4 py-10 text-sm text-slate">Loading property…</p>;
  }
  if (error || !property) {
    return <p className="px-4 py-10 text-sm text-coral">{error || "Property not found."}</p>;
  }

  const heroImage = property.images[0] ? mediaUrl(property.images[0]) : FALLBACK_IMAGE;
  const waMessage = encodeURIComponent(`Hi, I'm interested in "${property.title}" listed on Kerala Realty.`);

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
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleSave} disabled={saving} className="bg-white/90 rounded-full p-2">
            <Heart size={18} className={property.isSaved ? "fill-coral text-coral" : "text-ink"} />
          </button>
          <button onClick={handleShare} className="bg-white/90 rounded-full p-2">
            <Share2 size={18} className="text-ink" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display font-extrabold text-2xl text-ink">
              {formatPrice(property.price)}
            </p>
            <p className="font-display font-semibold text-charcoal mt-1">{property.title}</p>
          </div>
          <RoleBadge role={property.listingRole} />
        </div>

        <p className="flex items-center gap-1 text-sm text-slate mt-2">
          <MapPin size={14} /> {property.address}, {property.district}
        </p>

        <div className="flex items-center gap-4 text-sm text-charcoal mt-4 py-3 border-y border-charcoal/8">
          <span>{property.areaSqft} sq.ft</span>
          {property.bedrooms > 0 && <span>{property.bedrooms} Beds</span>}
          {property.bathrooms > 0 && <span>{property.bathrooms} Baths</span>}
          {property.facing && <span>{property.facing} Facing</span>}
        </div>

        {property.description && (
          <div className="mt-4">
            <h2 className="font-display font-bold text-ink mb-1.5">Description</h2>
            <p className="text-sm text-slate leading-relaxed">{property.description}</p>
          </div>
        )}

        <div className="mt-5 bg-white rounded-card shadow-card p-4">
          <p className="text-xs text-slate mb-0.5">Listed by</p>
          <Link
            to={`/agency/${property.ownerId}`}
            className="font-display font-semibold text-ink hover:underline"
          >
            {property.ownerName}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <a
            href={property.ownerPhone ? `tel:${property.ownerPhone}` : undefined}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 bg-ink text-cream font-display font-semibold text-[15px]"
          >
            <Phone size={16} /> Call
          </a>
          <a
            href={property.ownerPhone ? `https://wa.me/${property.ownerPhone.replace(/\D/g, "")}?text=${waMessage}` : undefined}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 border border-forest text-forest font-display font-semibold text-[15px]"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>

        <button className="w-full flex items-center justify-center gap-1.5 text-sm text-slate mt-4">
          <Flag size={14} /> Report this listing
        </button>
      </div>
    </div>
  );
}
