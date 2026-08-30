import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Share2, Flag, Phone, MessageCircle, ChevronLeft, MapPin, X, Star, Maximize, BedDouble, Bath, Compass, Eye, Download, Play, Shield, Award, Calendar, Check, Building, Users, CheckCircle2, Tag, Image as ImageIcon } from "lucide-react";
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
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [tourScheduled, setTourScheduled] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedTourDate, setSelectedTourDate] = useState("");
  const [calendarNavigationDate, setCalendarNavigationDate] = useState(new Date());
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [enableScheduleVisit, setEnableScheduleVisit] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleThumbnailClick = (idx: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: carouselRef.current.clientWidth * idx,
        behavior: "smooth"
      });
      setActiveIdx(idx);
    }
  };

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

    api.fetchSetting("enable_schedule_visit")
      .then((data) => {
        if (data && data.value !== undefined) {
          setEnableScheduleVisit(data.value === "true");
        }
      })
      .catch((err) => console.error("Failed to load enable_schedule_visit setting:", err));
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

  async function handleScheduleTour(dateString: string) {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!dateString) return;
    try {
      setSaving(true);
      await api.schedulePropertyTour(Number(id), dateString);
      setTourScheduled(true);
      setShowCalendarModal(false);
      alert(`Visit successfully scheduled for ${dateString}!`);
    } catch (err: any) {
      alert(err.message || "Failed to schedule visit.");
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
              ref={carouselRef}
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
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 select-none">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center bg-forest text-cream rounded-full shadow-md hover:bg-forest/90 active:scale-95 transition-all cursor-pointer"
                aria-label="Back"
              >
                <ChevronLeft size={21} className="stroke-[2.5]" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleToggleSave}
                  disabled={saving}
                  className="w-9 h-9 flex items-center justify-center bg-white text-charcoal rounded-full shadow-md hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="Save"
                >
                  <Heart size={18} className={property.isSaved ? "fill-coral text-coral stroke-none" : "text-[#0d4c3a] stroke-[2.5]"} />
                </button>
                <button
                  onClick={handleShare}
                  className="w-9 h-9 flex items-center justify-center bg-white text-[#0d4c3a] rounded-full shadow-md hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 size={17} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Bottom Left indicator image count */}
            {(() => {
              const total = (property.images?.length || 0) + (property.videos?.length || 0);
              if (total <= 1) return null;
              return (
                <div className="absolute bottom-4 left-4 z-20 flex gap-1 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full items-center text-white text-[9.5px] font-black select-none shadow-sm">
                  <ImageIcon size={11} className="text-white shrink-0 mr-0.5" />
                  <span>{activeIdx + 1} / {total}</span>
                </div>
              );
            })()}

            {/* Thumbnails Row (Old Style absolute overlay) */}
            {property.images && property.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-transparent px-2 py-1.5 flex items-center gap-1.5 max-w-[90%] overflow-x-auto no-scrollbar z-20">
                {property.images.length <= 5 ? (
                  property.images.map((img, idx) => {
                    const isActive = activeIdx === idx;
                    return (
                      <button
                        key={`thumb-${idx}`}
                        onClick={() => handleThumbnailClick(idx)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                          isActive ? "border-white scale-105 shadow-md" : "border-white/50 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={mediaUrl(img)}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })
                ) : (
                  <>
                    {property.images.slice(0, 4).map((img, idx) => {
                      const isActive = activeIdx === idx;
                      return (
                        <button
                          key={`thumb-${idx}`}
                          onClick={() => handleThumbnailClick(idx)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                            isActive ? "border-white scale-105 shadow-md" : "border-white/50 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={mediaUrl(img)}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                    {(() => {
                      const remainingCount = property.images.length - 4;
                      const idx = 4;
                      const isActive = activeIdx >= idx;
                      return (
                        <button
                          onClick={() => handleThumbnailClick(idx)}
                          className={`w-9 h-9 rounded-xl overflow-hidden relative flex-shrink-0 transition-all border-2 cursor-pointer ${
                            isActive ? "border-white scale-105 shadow-md" : "border-white/50 opacity-85 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={mediaUrl(property.images[4])}
                            alt="More images"
                            className="w-full h-full object-cover brightness-[0.4]"
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white font-display select-none">
                            +{remainingCount}
                          </div>
                        </button>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pt-4 flex flex-col gap-4">
          {/* Price & Details Header */}
          <div className="bg-white rounded-3xl border border-charcoal/5 p-5 shadow-sm flex flex-col gap-3">
            {/* Badge & Star Rating Row */}
            <div className="flex items-center justify-between select-none">
              <span className="px-3 py-1 rounded-full border border-forest/35 bg-forest/5 text-forest text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Building size={11.5} className="text-forest" />
                {property.propertyType === "Plot / Land" ? "Land" : property.propertyType === "Independent House / Villa" ? "House" : property.propertyType}
              </span>
              <button 
                onClick={() => navigate(`/property/${property.id}/reviews`)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate hover:text-charcoal transition-colors cursor-pointer"
              >
                <Star size={14} className="fill-gold text-gold" />
                <span className="text-charcoal font-black">{property.avgRating ? property.avgRating.toFixed(1) : "4.0"}</span>
                <span>({property.ratingCount || 0} reviews)</span>
              </button>
            </div>

            {/* Title */}
            <div className="text-left mt-0.5">
              <h1 className="font-display font-black text-[18px] xs:text-[21px] text-forest leading-tight">
                {property.title.replace("Plot / Land", "Land").replace("Independent House / Villa", "House")}
              </h1>
              <p className="flex items-center gap-1.5 text-[11px] xs:text-[11.5px] text-slate mt-1 font-semibold">
                <MapPin size={13.5} className="text-[#25D366] shrink-0" /> 
                <span>{property.address}, {property.district}</span>
              </p>
            </div>

            {/* Price & Negotiable tag */}
            <div className="flex items-center justify-between mt-1 border-t border-charcoal/5 pt-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[16px] font-black text-ink leading-none whitespace-nowrap">
                  {formatPrice(property.price)}
                </span>
                {property.isPriceNegotiable && (
                  <span className="text-[7.5px] xs:text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-500/15 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                    Negotiable
                  </span>
                )}
              </div>
              {isOwner ? (
                <button 
                  onClick={() => setShowViewersModal(true)}
                  className="flex items-center gap-1 text-[9px] xs:text-[9.5px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100/85 px-2 py-1 rounded-full font-extrabold select-none cursor-pointer transition-colors shrink-0"
                >
                  <Eye size={12} className="text-indigo-500" />
                  <span>{property.views || 0} views</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[9px] xs:text-[9.5px] text-slate/75 bg-slate-50 border border-charcoal/5 px-2 py-1 rounded-full select-none font-bold shrink-0">
                  <Eye size={12} className="text-slate/60" />
                  <span>{property.views || 0} views</span>
                </div>
              )}
            </div>

            {/* Specs Horizontal Box Row */}
            <div className="grid grid-cols-4 border border-charcoal/8 bg-slate-50/20 rounded-2xl py-3 mt-2 shadow-inner select-none px-1">
              {property.propertyType === "Plot / Land" || property.propertyType === "Land" ? (
                <>
                  {/* Purpose */}
                  <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5">
                    <Tag size={16.5} className="text-forest/85" />
                    <span className="font-display font-medium text-[11.5px] xs:text-[13px] text-charcoal leading-none mt-0.5 capitalize">
                      {property.purpose || "Sale"}
                    </span>
                    <span className="text-[8px] xs:text-[9px] font-medium text-slate/75 uppercase tracking-wider">Purpose</span>
                  </div>
                  {/* Facing */}
                  <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5">
                    <Compass size={16.5} className="text-forest/85" />
                    <span className="font-display font-medium text-[11.5px] xs:text-[13px] text-charcoal leading-none mt-0.5 capitalize truncate max-w-[95%]">
                      {property.facing || "N/A"}
                    </span>
                    <span className="text-[8px] xs:text-[9px] font-medium text-slate/75 uppercase tracking-wider">Facing</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Beds */}
                  <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5">
                    <BedDouble size={16.5} className="text-forest/85" />
                    <span className="font-display font-medium text-[11.5px] xs:text-[13px] text-charcoal leading-none mt-0.5">{property.bedrooms || 0}</span>
                    <span className="text-[8px] xs:text-[9px] font-medium text-slate/75 uppercase tracking-wider">Beds</span>
                  </div>
                  {/* Baths */}
                  <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5">
                    <Bath size={16.5} className="text-forest/85" />
                    <span className="font-display font-medium text-[11.5px] xs:text-[13px] text-charcoal leading-none mt-0.5">{property.bathrooms || 0}</span>
                    <span className="text-[8px] xs:text-[9px] font-medium text-slate/75 uppercase tracking-wider">Bath</span>
                  </div>
                </>
              )}
              {/* Area */}
              <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5">
                <Maximize size={16.5} className="text-forest/85" />
                <span className="font-display font-medium text-[11px] xs:text-[12.5px] text-charcoal leading-none mt-0.5 truncate max-w-[95%]">
                  {property.propertyType === "Plot / Land" || property.propertyType === "Land" ? (
                    property.areaSqft >= 43560 
                      ? `${Number((property.areaSqft / 43560).toFixed(2))}`
                      : `${Number((property.areaSqft / 435.6).toFixed(2))}`
                  ) : (
                    property.areaSqft.toLocaleString()
                  )}
                </span>
                <span className="text-[8px] xs:text-[9px] font-medium text-slate/75 uppercase tracking-wider">
                  {property.propertyType === "Plot / Land" || property.propertyType === "Land" ? (
                    property.areaSqft >= 43560 ? "Acres" : "Cents"
                  ) : (
                    "sq.ft"
                  )}
                </span>
              </div>
              {/* Type */}
              <div className="flex flex-col items-center justify-center text-center gap-1">
                <Building size={16.5} className="text-forest/85" />
                <span className="font-display font-medium text-[11px] xs:text-[12.5px] text-charcoal leading-none mt-0.5 truncate max-w-[95%]">
                  {property.propertyType === "Plot / Land" ? "Land" : property.propertyType === "Independent House / Villa" ? "House" : property.propertyType}
                </span>
                <span className="text-[8px] xs:text-[9px] font-medium text-slate/75 uppercase tracking-wider">Type</span>
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
            {/* 3. OWNER / AGENT CARD SECTION */}
            <div className="flex items-center justify-between p-4 bg-slate-100/55 rounded-3xl border border-charcoal/5 gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar with checked verified badge overlay */}
                <div className="relative shrink-0 select-none">
                  {property.listingRole === "Agency" && property.agencyLogoUrl ? (
                    <img 
                      src={mediaUrl(property.agencyLogoUrl)} 
                      alt="Logo" 
                      className="w-14 h-14 agent-avatar-circle rounded-full object-cover border border-charcoal/8 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 agent-avatar-circle rounded-full bg-slate-50 border border-charcoal/8 flex items-center justify-center text-slate-700 font-extrabold text-base agent-avatar-text font-display shrink-0">
                      {property.listingRole ? property.listingRole.charAt(0) : "O"}
                    </div>
                  )}
                  {/* Verified green check badge */}
                  <div className="absolute -bottom-0.5 -right-0.5 bg-[#25D366] text-white rounded-full p-0.5 border border-white shadow-sm flex items-center justify-center w-[17px] h-[17px] agent-verified-badge">
                    <Check size={10} className="stroke-[4.5] agent-verified-check" />
                  </div>
                </div>

                <div className="flex flex-col min-w-0 text-left">
                  <span className="font-display font-black text-sm text-charcoal truncate max-w-[140px] leading-tight">
                    {property.listingRole === "Agency"
                      ? (property.agencyName || "Agency")
                      : property.listingRole === "Broker"
                      ? (property.brokerName || "Broker")
                      : (property.ownerName || "Owner")}
                  </span>
                  <span className="text-[9.5px] font-bold text-[#25D366] mt-0.5">
                    Verified Real Estate Agent
                  </span>
                  <button 
                    onClick={() => {
                      if (!token) {
                        localStorage.setItem("pending_deep_link", `/property/${property.id}`);
                        navigate("/login");
                        return;
                      }
                      if (!hasAccess) {
                        setShowPaywall(true);
                      } else {
                        setShowContactModal(true);
                      }
                    }}
                    className="text-[9.5px] text-slate font-black text-left hover:underline select-none mt-1 uppercase tracking-wider flex items-center gap-0.5"
                  >
                    View agent profile <span className="font-sans text-[8px] opacity-75">{`>`}</span>
                  </button>
                </div>
              </div>

              {/* Circular Action Buttons with Brand/WhatsApp Colors */}
              <div className="flex items-center gap-2.5 shrink-0 select-none">
                <a
                  href={hasAccess && (property.whatsappNumber || property.ownerPhone) ? `https://wa.me/${(property.whatsappNumber || property.ownerPhone || "").replace(/\D/g, "")}?text=${waMessage}` : undefined}
                  target={hasAccess ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => handleContactClick(e, "WhatsApp")}
                  className="w-10 h-10 agent-contact-btn flex items-center justify-center bg-white text-[#25D366] rounded-full shadow-md hover:bg-slate-50 transition-all active:scale-95 cursor-pointer border border-[#25D366]/20"
                  aria-label="WhatsApp agent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="agent-contact-icon-wa"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.016-5.08-2.868-6.932C16.357 2.022 13.899.98 11.282.98c-5.405 0-9.807 4.397-9.81 9.802-.001 1.636.406 3.23 1.18 4.613l-.97 3.548 3.635-.953zm11.752-6.52c-.3-.15-1.77-.874-2.046-.973-.275-.1-.475-.15-.675.15-.2.3-.77.973-.946 1.173-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.79-1.487-1.77-1.663-2.07-.176-.3-.019-.462.13-.61.136-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.675-.52-.174-.01-.374-.012-.574-.012-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.025 2.9 1.175 3.1c.15.2 2.021 3.085 4.898 4.32 1.05.45 1.8.725 2.4 1 .975.3 1.85.25 2.55.15.775-.113 2.375-.975 2.712-1.925.337-.95.337-1.763.238-1.925-.1-.163-.35-.263-.65-.413z" />
                  </svg>
                </a>
                <a
                  href={hasAccess && (property.contactNumber || property.ownerPhone) ? `tel:${property.contactNumber || property.ownerPhone}` : undefined}
                  onClick={(e) => handleContactClick(e, "Call")}
                  className="w-10 h-10 agent-contact-btn flex items-center justify-center bg-forest text-cream rounded-full shadow-md hover:bg-forest/95 transition-all active:scale-95 cursor-pointer"
                  aria-label="Call agent"
                >
                  <Phone size={17.5} className="agent-contact-icon-phone" />
                </a>
              </div>
            </div>

            {/* Description / Overview Section */}
            {property.description && (
              <div className="text-left flex flex-col gap-1.5 px-1.5 mt-0.5">
                <p className="text-[12px] text-slate font-medium leading-relaxed">
                  {property.description.length <= 150 || isDescExpanded ? (
                    <span className="whitespace-pre-line">{property.description}</span>
                  ) : (
                    <span>
                      {property.description.slice(0, 150)}...
                    </span>
                  )}
                </p>
                {property.description.length > 150 && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-forest font-black flex items-center gap-0.5 hover:underline cursor-pointer select-none text-[9.5px] uppercase tracking-wider text-left w-fit mt-0.5"
                  >
                    <span>{isDescExpanded ? "Read Less" : "Read More"}</span>
                    <span className="text-[8px]">{isDescExpanded ? "▲" : "▼"}</span>
                  </button>
                )}
              </div>
            )}

            {/* CTA action buttons Schedule & Enquire */}
            <div className="flex gap-2 mt-1.5">
              {enableScheduleVisit && (
                <button
                  onClick={() => {
                    if (tourScheduled) {
                      alert("You have already scheduled a visit for this property!");
                    } else {
                      setShowCalendarModal(true);
                    }
                  }}
                  className={`flex-1 py-3 px-2.5 rounded-2xl border font-display font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                    tourScheduled 
                      ? "bg-[#3e9c83]/10 border-[#3e9c83] text-[#3e9c83]" 
                      : "bg-white border-forest text-forest hover:bg-forest/5"
                  }`}
                >
                  <Calendar size={13.5} />
                  <span>{tourScheduled ? "Visit Scheduled" : "Schedule Visit"}</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  if (hasAccess && (property.whatsappNumber || property.ownerPhone)) {
                    window.open(`https://wa.me/${(property.whatsappNumber || property.ownerPhone || "").replace(/\D/g, "")}?text=${waMessage}`, "_blank");
                  } else {
                    setShowContactModal(true);
                  }
                }}
                className="flex-1 py-3 px-2.5 rounded-2xl bg-forest hover:bg-forest/90 text-white font-display font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Enquire Now</span>
              </button>
            </div>

            {/* Features / Value Badges Grid */}
            <div className="grid grid-cols-4 border border-charcoal/8 bg-slate-50/50 rounded-2xl py-3.5 mt-1 shadow-sm select-none text-[8.5px] text-charcoal font-medium">
              {/* Verified */}
              <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5 px-1">
                <Shield size={16} className="text-forest" />
                <span className="font-medium leading-tight text-ink mt-0.5">Verified</span>
                <span className="text-[7.5px] text-slate/75 font-medium leading-none">100% Verified</span>
              </div>
              {/* Direct Connect */}
              <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5 px-1">
                <Users size={16} className="text-forest" />
                <span className="font-medium leading-tight text-ink mt-0.5">Direct Deal</span>
                <span className="text-[7.5px] text-slate/75 font-medium leading-none">No Middleman</span>
              </div>
              {/* Support */}
              <div className="flex flex-col items-center justify-center text-center gap-1 border-r border-charcoal/5 px-1">
                <Compass size={16} className="text-forest" />
                <span className="font-medium leading-tight text-ink mt-0.5">24x7 Help</span>
                <span className="text-[7.5px] text-slate/75 font-medium leading-none">Anytime</span>
              </div>
              {/* Safe & Secure */}
              <div className="flex flex-col items-center justify-center text-center gap-1 px-1">
                <CheckCircle2 size={16} className="text-forest" />
                <span className="font-medium leading-tight text-ink mt-0.5">Safe Deal</span>
                <span className="text-[7.5px] text-slate/75 font-medium leading-none">100% Secure</span>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.016-5.08-2.868-6.932C16.357 2.022 13.899.98 11.282.98c-5.405 0-9.807 4.397-9.81 9.802-.001 1.636.406 3.23 1.18 4.613l-.97 3.548 3.635-.953zm11.752-6.52c-.3-.15-1.77-.874-2.046-.973-.275-.1-.475-.15-.675.15-.2.3-.77.973-.946 1.173-.175.2-.35.225-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.79-1.487-1.77-1.663-2.07-.176-.3-.019-.462.13-.61.136-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.675-.52-.174-.01-.374-.012-.574-.012-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.025 2.9 1.175 3.1c.15.2 2.021 3.085 4.898 4.32 1.05.45 1.8.725 2.4 1 .975.3 1.85.25 2.55.15.775-.113 2.375-.975 2.712-1.925.337-.95.337-1.763.238-1.925-.1-.163-.35-.263-.65-.413z" />
                  </svg>
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

      {/* Interactive Media Lightbox Modal */}
      {lightboxIdx !== null && property && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex flex-col justify-between items-center py-8 animate-fade-in"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Top Actions: Title & Close */}
          <div className="w-full max-w-[420px] px-6 flex justify-between items-center select-none text-white/90">
            <span className="font-display font-extrabold text-xs tracking-wider uppercase">
              {lightboxIdx + 1} / {((property.images?.length || 0) + (property.videos?.length || 0))}
            </span>
            <button 
              onClick={() => setLightboxIdx(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Media Swiper Box */}
          <div className="w-full flex-1 flex items-center justify-center p-4">
            {(() => {
              const images = property.images || [];
              const videos = property.videos || [];
              const totalImg = images.length;
              const isVid = lightboxIdx >= totalImg;
              
              if (isVid) {
                const vidSrc = videos[lightboxIdx - totalImg];
                return (
                  <video 
                    src={mediaUrl(vidSrc)} 
                    controls 
                    autoPlay 
                    className="max-h-[70vh] max-w-full rounded-2xl shadow-2xl" 
                    onClick={(e) => e.stopPropagation()} 
                  />
                );
              } else {
                const imgSrc = images[lightboxIdx] || FALLBACK_IMAGE;
                return (
                  <img 
                    src={mediaUrl(imgSrc)} 
                    alt="Gallery Preview" 
                    className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl" 
                    onClick={(e) => e.stopPropagation()} 
                  />
                );
              }
            })()}
          </div>

          {/* Bottom Thumbnails Navigation Strip */}
          <div className="w-full max-w-[420px] px-6 overflow-x-auto no-scrollbar flex gap-2 justify-center py-2 select-none">
            {property.images?.map((img, idx) => (
              <button
                key={`lightbox-nav-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(idx);
                }}
                className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  lightboxIdx === idx ? "border-[#52b775] scale-105" : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                <img src={mediaUrl(img)} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
            {property.videos?.map((vid, idx) => {
              const videoIdx = (property.images?.length || 0) + idx;
              return (
                <button
                  key={`lightbox-nav-vid-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(videoIdx);
                  }}
                  className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 relative transition-all ${
                    lightboxIdx === videoIdx ? "border-[#52b775] scale-105" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <video src={mediaUrl(vid)} className="w-full h-full object-cover brightness-[0.6]" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play size={12} className="fill-white text-white stroke-none" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Calendar Date Picker Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-[400px] rounded-t-[32px] sm:rounded-[32px] p-6 text-left flex flex-col gap-4 shadow-2xl animate-slide-up select-none">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-[16px] text-ink">Schedule Your Visit</h3>
                <p className="text-[10px] text-slate font-medium">Select a date to schedule a walkthrough tour.</p>
              </div>
              <button 
                onClick={() => setShowCalendarModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate hover:text-ink cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Custom Calendar Widget */}
            <div className="border border-charcoal/5 rounded-2xl p-4 bg-slate-50/50">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="font-display font-extrabold text-sm text-ink">
                  {calendarNavigationDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setCalendarNavigationDate(new Date(calendarNavigationDate.getFullYear(), calendarNavigationDate.getMonth() - 1, 1))}
                    className="w-7 h-7 rounded-lg border border-charcoal/10 flex items-center justify-center text-ink hover:bg-slate-100 cursor-pointer"
                  >
                    {"<"}
                  </button>
                  <button 
                    onClick={() => setCalendarNavigationDate(new Date(calendarNavigationDate.getFullYear(), calendarNavigationDate.getMonth() + 1, 1))}
                    className="w-7 h-7 rounded-lg border border-charcoal/10 flex items-center justify-center text-ink hover:bg-slate-100 cursor-pointer"
                  >
                    {">"}
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day} className="text-[9px] font-bold text-slate/60 uppercase">{day}</span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {(() => {
                  const yr = calendarNavigationDate.getFullYear();
                  const mth = calendarNavigationDate.getMonth();
                  const firstDayIndex = new Date(yr, mth, 1).getDay();
                  const totalDays = new Date(yr, mth + 1, 0).getDate();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  const slots = [];
                  for (let i = 0; i < firstDayIndex; i++) {
                    slots.push(<div key={`empty-${i}`} className="aspect-square" />);
                  }

                  for (let d = 1; d <= totalDays; d++) {
                    const dayObj = new Date(yr, mth, d);
                    const isPast = dayObj < today;
                    const isSelected = selectedTourDate === dayObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                    
                    slots.push(
                      <button
                        key={`day-${d}`}
                        disabled={isPast}
                        onClick={() => {
                          const formatted = dayObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                          setSelectedTourDate(formatted);
                        }}
                        className={`aspect-square text-xs font-bold font-display rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isPast 
                            ? "text-slate/30 cursor-not-allowed" 
                            : isSelected 
                              ? "bg-forest text-white shadow-md scale-105" 
                              : "text-ink hover:bg-forest/10"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  }
                  return slots;
                })()}
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                disabled={!selectedTourDate || saving}
                onClick={() => handleScheduleTour(selectedTourDate)}
                className="w-full py-3.5 bg-forest hover:bg-forest/90 text-white rounded-2xl text-xs font-bold font-display shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:bg-slate/30 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <span>{saving ? "Scheduling..." : "Confirm Schedule Visit"}</span>
              </button>
              {selectedTourDate && (
                <p className="text-[10px] text-emerald-600 font-bold text-center">
                  Selected Date: {selectedTourDate}
                </p>
              )}
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}
