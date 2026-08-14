import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Share2, Flag, Phone, MessageCircle, ChevronLeft, MapPin, X, Star, Maximize, BedDouble, Bath, Compass, Eye, Download } from "lucide-react";
import { api, ApiPropertyDetail, mediaUrl, formatArea } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import RoleBadge from "@/components/RoleBadge";
import BottomNav from "@/components/BottomNav";
import PropertyViewersModal from "@/components/PropertyViewersModal";
import SubscriptionPaywallModal from "@/components/SubscriptionPaywallModal";
import AppDownloadInterstitial from "./AppDownloadInterstitial";

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

export default function PublicPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user, login } = useAuth();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [bypassInterstitial, setBypassInterstitial] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isOwner = user && property && user.id === property.ownerId;
  const hasAccess = !!property?.contactAccess;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .fetchProperty(id)
      .then((data) => setProperty(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleSave() {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!property) return;

    setSaving(true);
    try {
      const { saved } = await api.toggleSaveProperty(property.id);
      setProperty({ 
        ...property, 
        isSaved: saved, 
        saveCount: property.saveCount + (saved ? 1 : -1) 
      });
    } catch (err: any) {
      alert(err.message || "Failed to update saved status.");
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

  const logClickEnquiry = async (type: "WhatsApp" | "Call") => {
    if (!property) return;
    try {
      await api.sendEnquiry(property.id, `Clicked ${type} contact button`);
    } catch (err) {
      console.error("Failed to log contact click:", err);
    }
  };

  const handleContactClick = async (e: React.MouseEvent, type: "Call" | "WhatsApp") => {
    e.preventDefault();
    if (!token) {
      localStorage.setItem("pending_deep_link", `/property/${id}`);
      navigate("/login");
      return;
    }
    if (!property) return;
    
    try {
      // Record click inquiry on backend dynamically (verifies 20 click limit)
      await api.recordClickInquiry(property.id);

      const targetUrl = type === "Call"
        ? `tel:${property.contactNumber}`
        : `https://wa.me/91${property.whatsappNumber}?text=${waMessage}`;
      
      window.open(targetUrl, "_blank");
      logClickEnquiry(type);
    } catch (err: any) {
      setShowPaywall(true);
    }
  };

  if (loading) {
    return <p className="px-4 py-10 text-sm text-slate">Loading property…</p>;
  }
  if (error || !property) {
    return <p className="px-4 py-10 text-sm text-coral">{error || "Property not found."}</p>;
  }

  const showInterstitial = !token && !bypassInterstitial;

  if (showInterstitial) {
    return (
      <AppDownloadInterstitial 
        propertyTitle={property.title} 
        onMaybeLater={() => setBypassInterstitial(true)} 
      />
    );
  }

  const priceStr = formatPrice(property.price);
  const locationStr = `${property.address}, ${property.district}`;
  const listedByStr = property.listingRole === "Agency"
    ? (property.agencyName || "Agency")
    : property.listingRole === "Broker"
    ? (property.brokerName || "Broker")
    : (property.ownerName || "Owner");

  const messageText = `Hi, I'm interested in "${property.title}" listed on Kerala Realty.

*Property Details:*
- *Price*: ${priceStr}
- *Location*: ${locationStr}
- *Listed By*: ${listedByStr}

View Details: ${window.location.origin}/property/${property.id}`;

  const waMessage = encodeURIComponent(messageText);

  return (
    <div className="w-full min-h-screen bg-[#FAF8F3] py-4">
      <div className="app-container w-full max-w-[420px] mx-auto bg-cream min-h-screen relative shadow-md overflow-x-hidden pb-28 text-left">
      {/* Top Banner Carousel */}
      <div className="relative px-4 pt-4">
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-charcoal/8 bg-slate-100 shadow-md">
          <div 
            onScroll={(e) => {
              const container = e.currentTarget;
              const scrollPos = container.scrollLeft;
              const width = container.offsetWidth;
              if (width > 0) {
                setActiveIdx(Math.round(scrollPos / width));
              }
            }}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {property.images && property.images.length > 0 ? (
              <>
                {property.images.map((img, idx) => (
                  <div key={`img-${idx}`} className="w-full h-full flex-shrink-0 snap-start">
                    <img
                      src={mediaUrl(img)}
                      alt={`${property.title} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {property.videos && property.videos.map((vid, idx) => (
                  <div key={`vid-${idx}`} className="w-full h-full flex-shrink-0 snap-start bg-black flex items-center justify-center">
                    <video
                      src={mediaUrl(vid)}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate">
                No images available
              </div>
            )}
          </div>

          {/* Floating Top Control Actions */}
           <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="w-8.5 h-8.5 flex items-center justify-center text-white drop-shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronLeft size={22} className="stroke-[2.5]" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleToggleSave}
                disabled={saving}
                className="w-8.5 h-8.5 flex items-center justify-center text-white drop-shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <Heart size={20} className={property.isSaved ? "fill-coral text-coral stroke-none" : "stroke-[2.5]"} />
              </button>
              <button
                onClick={handleShare}
                className="w-8.5 h-8.5 flex items-center justify-center text-white drop-shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <Share2 size={20} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Carousel indicators count */}
          {property.images && property.images.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/60 px-2.5 py-0.5 rounded-full text-white text-[9px] font-bold">
              {activeIdx + 1} / {property.images.length + (property.videos?.length || 0)}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        {/* Price & Details Header */}
        <div className="bg-white rounded-2xl border border-charcoal/5 p-4 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl text-ink leading-none">
                  {formatPrice(property.price)}
                </h1>
                {property.isPriceNegotiable && (
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Negotiable
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-charcoal mt-1.5">
                {property.propertyType} in {property.district}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-slate mt-1">
                <MapPin size={12} className="text-slate/60" /> {property.address}
              </p>
              {isOwner ? (
                <button 
                  onClick={() => setShowViewersModal(true)}
                  className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100/85 px-2 py-0.5 rounded-full font-bold select-none cursor-pointer mt-1.5 transition-colors"
                >
                  <Eye size={14} className="text-indigo-500" />
                  <span>{property.views || 0} views (Click to see who viewed)</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-slate/75 mt-1.5 pl-0.5">
                  <Eye size={14} className="text-slate/60" />
                  <span>{property.views || 0} views</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {property.listingRole && (
                <button 
                  onClick={() => {
                    if (!token) {
                      navigate("/login");
                      return;
                    }
                    if (!hasAccess) {
                      setShowPaywall(true);
                    } else {
                      setShowContactModal(true);
                    }
                  }}
                  className="hover:opacity-95 active:scale-95 transition-all select-none cursor-pointer"
                  title="View contact details"
                >
                  <RoleBadge role={property.listingRole} />
                </button>
              )}
              <button 
                onClick={() => navigate(`/property/${property.id}/reviews`)}
                className="flex items-center gap-0.5 bg-amber bg-opacity-10 hover:bg-opacity-20 text-amber px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer"
              >
                <Star size={11} className="fill-gold text-gold" />
                <span>{property.avgRating ? property.avgRating.toFixed(1) : "0.0"}</span>
                <span className="text-slate/75">({property.ratingCount || 0})</span>
              </button>
            </div>
          </div>
        </div>

        {property.isMasked ? (
          <div className="flex flex-col gap-4 mt-2 font-display pb-6">
            {/* Premium App Download Banner */}
            <div className="bg-gradient-to-br from-ink via-charcoal to-forest text-white border border-white/10 rounded-[28px] p-5 text-left shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row gap-5 items-center justify-between">
                {/* Left Side: Content & Actions */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold/25 text-gold flex items-center justify-center shrink-0 shadow-inner">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-cream tracking-wide">Unlock Details in Mobile App</h3>
                      <p className="text-[10px] text-white/70 mt-0.5 leading-relaxed font-semibold">
                        To safeguard owner privacy and prevent scraping, detailed features, map coordinates, and contact details are restricted to our mobile application.
                      </p>
                    </div>
                  </div>

                  {/* What they unlock in app */}
                  <div className="flex flex-col gap-2 bg-black/25 border border-white/5 p-3 rounded-2xl text-[10px] font-semibold text-white/90 leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="text-gold">✔</span>
                      <span>Direct Call & WhatsApp to Verified Owners/Agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gold">✔</span>
                      <span>Exact Local Map & Neighborhood Navigation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gold">✔</span>
                      <span>Push Notifications on matching listings</span>
                    </div>
                  </div>

                  {/* Primary Download CTAs */}
                  <div className="flex flex-col gap-2 font-bold mt-1">
                    <button
                      onClick={() => window.open(window.location.origin + "/login", "_blank")}
                      className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-gold text-ink py-3 rounded-xl text-xs font-black text-center shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={14} className="stroke-[3]" />
                      <span>Download Mobile App</span>
                    </button>
                  </div>
                </div>

                {/* Right Side: QR Code in the green box */}
                <div className="shrink-0 flex flex-col items-center gap-2 bg-black/20 border border-white/5 p-3 rounded-2xl text-center w-24 sm:w-28">
                  <div className="w-16 h-16 bg-white p-1 rounded-xl flex items-center justify-center shadow-inner">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-ink">
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="10" y="10" width="15" height="15" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                      <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="75" y="10" width="15" height="15" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                      <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                      <rect x="10" y="75" width="15" height="15" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                      <rect x="35" y="5" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="10" width="10" height="5" fill="currentColor" />
                      <rect x="60" y="5" width="5" height="5" fill="currentColor" />
                      
                      <rect x="35" y="25" width="10" height="5" fill="currentColor" />
                      <rect x="50" y="20" width="5" height="15" fill="currentColor" />
                      <rect x="60" y="25" width="5" height="5" fill="currentColor" />

                      <rect x="5" y="35" width="15" height="5" fill="currentColor" />
                      <rect x="10" y="45" width="5" height="10" fill="currentColor" />
                      <rect x="25" y="35" width="10" height="5" fill="currentColor" />

                      <rect x="35" y="35" width="5" height="5" fill="currentColor" />
                      <rect x="45" y="40" width="25" height="5" fill="currentColor" />
                      <rect x="75" y="35" width="15" height="5" fill="currentColor" />
                      
                      <rect x="35" y="50" width="10" height="10" fill="currentColor" />
                      <rect x="50" y="45" width="5" height="15" fill="currentColor" />
                      <rect x="65" y="50" width="15" height="5" fill="currentColor" />

                      <rect x="5" y="60" width="5" height="5" fill="currentColor" />
                      <rect x="15" y="60" width="10" height="5" fill="currentColor" />
                      <rect x="25" y="50" width="5" height="15" fill="currentColor" />

                      <rect x="35" y="70" width="15" height="5" fill="currentColor" />
                      <rect x="55" y="75" width="5" height="10" fill="currentColor" />
                      <rect x="70" y="70" width="10" height="5" fill="currentColor" />

                      <rect x="35" y="80" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="85" width="15" height="5" fill="currentColor" />
                      <rect x="70" y="80" width="5" height="15" fill="currentColor" />
                      <rect x="80" y="85" width="15" height="5" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-[8px] font-bold text-cream tracking-wide leading-none">Scan to Install</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Specifications Grid */}
            <div className="bg-white rounded-2xl border border-charcoal/5 p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-charcoal/5">
                  <div className="w-8 h-8 rounded-xl bg-forest/8 text-forest flex items-center justify-center shrink-0">
                    <Maximize size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate/65 tracking-wider uppercase leading-none">Area</p>
                    <p className="text-xs font-bold text-ink truncate mt-0.5">{formatArea(property.areaSqft, property.propertyType)}</p>
                  </div>
                </div>
                
                {property.bedrooms > 0 && (
                  <div className="flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-charcoal/5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/8 text-sky-600 flex items-center justify-center shrink-0">
                      <BedDouble size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate/65 tracking-wider uppercase leading-none">Beds</p>
                      <p className="text-xs font-bold text-ink truncate mt-0.5">{property.bedrooms} Bedrooms</p>
                    </div>
                  </div>
                )}
                
                {property.bathrooms > 0 && (
                  <div className="flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-charcoal/5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/8 text-purple-600 flex items-center justify-center shrink-0">
                      <Bath size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate/65 tracking-wider uppercase leading-none">Baths</p>
                      <p className="text-xs font-bold text-ink truncate mt-0.5">{property.bathrooms} Bathrooms</p>
                    </div>
                  </div>
                )}
                
                {property.facing && (
                  <div className="flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-charcoal/5">
                    <div className="w-8 h-8 rounded-xl bg-amber bg-opacity-10 text-amber flex items-center justify-center shrink-0">
                      <Compass size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate/65 tracking-wider uppercase leading-none">Facing</p>
                      <p className="text-xs font-bold text-ink truncate mt-0.5">{property.facing} Facing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description Card */}
            {property.description && (
              <div className="bg-white rounded-2xl border border-charcoal/5 p-4 shadow-sm">
                <h2 className="font-display font-bold text-sm text-ink mb-1.5">Description</h2>
                <p className="text-xs text-slate leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* Video Tour (YouTube) */}
            {property.youtubeUrl && getYoutubeEmbedUrl(property.youtubeUrl) && (
              <div className="bg-white rounded-2xl border border-charcoal/5 p-4 shadow-sm">
                <h2 className="font-display font-bold text-sm text-ink mb-2">Video Tour</h2>
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

            {/* Listed by / Contact details box */}
            <div className="bg-white rounded-2xl border border-charcoal/5 p-4 shadow-sm flex flex-col gap-3">
              <button 
                onClick={() => {
                  if (!token) {
                    localStorage.setItem("pending_deep_link", `/property/${id}`);
                    navigate("/login");
                    return;
                  }
                  if (!hasAccess) {
                    setShowPaywall(true);
                  } else {
                    setShowContactModal(true);
                  }
                }}
                className="w-full bg-slate-50/50 hover:bg-slate-100/60 rounded-xl border border-charcoal/5 p-3 text-left active:scale-[0.99] transition-all cursor-pointer flex justify-between items-center"
              >
                <div>
                  <p className="text-[9px] font-bold text-slate/70 tracking-wider uppercase leading-none">Listed by</p>
                  <div className="flex items-start gap-2 mt-1.5">
                    {property.listingRole === "Agency" && property.agencyLogoUrl && (
                      <img 
                        src={mediaUrl(property.agencyLogoUrl)} 
                        alt="Logo" 
                        className="w-10 h-10 rounded-full object-cover border border-charcoal/8 shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-ink text-xs hover:underline truncate max-w-[170px]">
                        {property.listingRole === "Agency"
                          ? (property.agencyName || "Agency")
                          : property.listingRole === "Broker"
                          ? (property.brokerName || "Broker")
                          : (property.ownerName || "Owner")}
                      </span>
                      {property.createdAt && (
                        <span className="text-[9px] text-slate/50 font-bold mt-0.5">
                          Listed Date: {new Date(property.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Contact</span>
              </button>

              {/* Primary Contact CTAs */}
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                <a
                  href={hasAccess && (property.contactNumber || property.ownerPhone) ? `tel:${property.contactNumber || property.ownerPhone}` : undefined}
                  onClick={(e) => handleContactClick(e, "Call")}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 bg-ink text-cream font-display font-bold text-xs hover:bg-black transition-all active:scale-[0.98]"
                >
                  <Phone size={14} /> Call
                </a>
                <a
                  href={hasAccess && (property.whatsappNumber || property.ownerPhone) ? `https://wa.me/${(property.whatsappNumber || property.ownerPhone || "").replace(/\D/g, "")}?text=${waMessage}` : undefined}
                  target={hasAccess ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => handleContactClick(e, "WhatsApp")}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3 border border-forest text-forest font-display font-bold text-xs hover:bg-forest/5 transition-all active:scale-[0.98]"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Report button */}
            <button 
              onClick={() => navigate(`/property/${property.id}/report`)}
              className="w-full flex items-center justify-center gap-1 text-[11px] text-slate hover:text-coral transition-colors py-1"
            >
              <Flag size={11} /> Report this listing
            </button>
          </>
        )}
  </div>

      {/* Contact Profile Details Popup Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 w-full max-w-[340px] shadow-2xl relative flex flex-col items-center text-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full text-slate transition-all"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Entity Icon / Image Profile Header */}
            {property.listingRole === "Agency" ? (
              <div className="flex flex-col items-center gap-2.5 mt-2">
                {property.agencyLogoUrl ? (
                  <img 
                    src={mediaUrl(property.agencyLogoUrl)} 
                    alt="Agency Logo" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-charcoal/10 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-charcoal/10 shadow-sm text-slate">
                    <span className="text-xl font-bold text-slate-500">A</span>
                  </div>
                )}
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full select-none">
                  Agency Profile
                </span>
                <h3 className="font-display font-extrabold text-lg text-ink leading-snug">
                  {property.agencyName || "Agency"}
                </h3>
              </div>
            ) : property.listingRole === "Broker" ? (
              <div className="flex flex-col items-center gap-2.5 mt-2">
                <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center border-2 border-sky-500/25 shadow-sm text-sky-600">
                  <span className="text-xl font-bold">B</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full select-none">
                  Broker Profile
                </span>
                <h3 className="font-display font-extrabold text-lg text-ink leading-snug">
                  {property.brokerName || "Broker"}
                </h3>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 mt-2">
                <div className="w-16 h-16 rounded-full bg-indigo-50/50 flex items-center justify-center border-2 border-indigo-500/20 shadow-sm text-indigo-600">
                  <span className="text-xl font-bold">O</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full select-none">
                  Owner Profile
                </span>
                <h3 className="font-display font-extrabold text-lg text-ink leading-snug">
                  {property.ownerName || "Owner"}
                </h3>
              </div>
            )}

            {/* Contact Buttons with Icon & Label */}
            <div className="w-full flex flex-col gap-2.5 mt-1 border-t border-slate-100 pt-4">
              {(property.contactNumber || property.ownerPhone) && (
                <a
                  href={hasAccess ? `tel:${property.contactNumber || property.ownerPhone}` : undefined}
                  onClick={(e) => handleContactClick(e, "Call")}
                  className="w-full py-3 px-4 rounded-xl bg-ink hover:bg-black text-cream text-xs font-bold font-display flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <Phone size={14} />
                  <span>Call: {hasAccess ? (property.contactNumber || property.ownerPhone) : "+91 XXXXX XXXXX"}{hasAccess && property.useAdminContact && " (admin's)"}</span>
                </a>
              )}
              
              {(property.whatsappNumber || property.ownerPhone) && (
                <a
                  href={hasAccess ? `https://wa.me/${(property.whatsappNumber || property.ownerPhone || "").replace(/\D/g, "")}?text=${waMessage}` : undefined}
                  target={hasAccess ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => handleContactClick(e, "WhatsApp")}
                  className="w-full py-3 px-4 rounded-xl border border-forest hover:bg-forest/5 text-forest text-xs font-bold font-display flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                >
                  <MessageCircle size={14} className="fill-forest/5" />
                  <span>WhatsApp: {hasAccess ? (property.whatsappNumber || property.ownerPhone) : "+91 XXXXX XXXXX"}{hasAccess && property.useAdminContact && " (admin's)"}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {showViewersModal && property && (
        <PropertyViewersModal 
          propertyId={property.id}
          propertyTitle={property.title}
          onClose={() => setShowViewersModal(false)}
        />
      )}
      {showPaywall && (
        <SubscriptionPaywallModal 
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            if (user) {
              login(localStorage.getItem("kr_token") || "", {
                ...user,
                subscriptionStatus: "active"
              });
            }
            // Refresh property detail to unlock contact options
            if (id) {
              api.fetchProperty(id)
                .then((data) => setProperty(data))
                .catch((err) => console.error(err));
            }
          }}
        />
      )}
      {property && !property.isMasked && <BottomNav />}
      </div>
    </div>
  );
}
