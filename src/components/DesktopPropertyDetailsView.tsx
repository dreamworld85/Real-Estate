import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Heart, 
  Share2, 
  Printer, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
  Building, 
  Calendar, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Image as ImageIcon,
  Check,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  Play
} from "lucide-react";
import { ApiPropertyDetail, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import DesktopHeader from "./DesktopHeader";
import DesktopFooter from "./DesktopFooter";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

interface DesktopPropertyDetailsViewProps {
  property: ApiPropertyDetail;
  onToggleSave?: () => void;
  saving?: boolean;
}

export default function DesktopPropertyDetailsView({
  property,
  onToggleSave,
  saving = false
}: DesktopPropertyDetailsViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Inquiry Form state
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactMessage, setContactMessage] = useState(`Hi, I am interested in ${property.title}. Please contact me with more details.`);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Build unified media items array (images + videos)
  const allMedia: Array<{ type: "image" | "video"; url: string }> = [];

  if (property.images && property.images.length > 0) {
    property.images.forEach((img: string) => {
      if (img) {
        allMedia.push({
          type: "image",
          url: img.startsWith("/uploads/") ? mediaUrl(img) : img
        });
      }
    });
  }

  if (property.videos && property.videos.length > 0) {
    property.videos.forEach((vid: string) => {
      if (vid) {
        allMedia.push({
          type: "video",
          url: vid.startsWith("/uploads/") ? mediaUrl(vid) : vid
        });
      }
    });
  }

  if (allMedia.length === 0) {
    allMedia.push({ type: "image", url: FALLBACK_IMAGE });
  }

  const totalMedia = allMedia.length;
  const mainMedia = allMedia[0];

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!showGalleryModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowGalleryModal(false);
      } else if (e.key === "ArrowLeft") {
        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : totalMedia - 1));
      } else if (e.key === "ArrowRight") {
        setActivePhotoIdx((prev) => (prev < totalMedia - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGalleryModal, totalMedia]);

  // Initialize OpenStreetMap (Leaflet) for Property Location
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const initMap = () => {
      const lat = property.latitude ? parseFloat(String(property.latitude)) : 10.850516;
      const lng = property.longitude ? parseFloat(String(property.longitude)) : 76.271080;

      if (window.L && mapContainerRef.current) {
        if (mapRef.current && typeof mapRef.current.remove === "function") {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = window.L.map(mapContainerRef.current).setView([lat, lng], 13);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap"
        }).addTo(map);
        mapRef.current = map;

        const customIcon = window.L.divIcon({
          className: "custom-leaflet-detail-marker",
          html: `<div style="background:#1B5E4F; color:#ffffff; padding:6px 12px; border-radius:20px; font-weight:500; font-size:13px; border:2px solid #ffffff; box-shadow:0 4px 6px -1px rgba(0,0,0,0.3); white-space:nowrap;">📍 ${property.title}</div>`,
          iconSize: null,
        });

        window.L.marker([lat, lng], { icon: customIcon }).addTo(map);
      } else {
        timer = setTimeout(initMap, 300);
      }
    };
    initMap();
    return () => clearTimeout(timer);
  }, [property]);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryLoading(true);
    setTimeout(() => {
      setInquiryLoading(false);
      setInquirySent(true);
    }, 800);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] w-full flex flex-col font-sans">
      {/* Top Header */}
      <DesktopHeader />

      {/* Main Content Container matching Image 2 */}
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Title Bar Section */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
              {property.title}
            </h1>

            {/* Sub-bar Specs & Address */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 font-medium mt-3">
              <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-xs">
                {property.bedrooms !== undefined && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                    Beds: {property.bedrooms}
                  </span>
                )}
                {property.bathrooms !== undefined && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-gray-400" />
                    Baths: {property.bathrooms}
                  </span>
                )}
                {property.areaSqft && (
                  <span className="flex items-center gap-1">
                    <Maximize className="w-3.5 h-3.5 text-gray-400" />
                    Sqft: {property.areaSqft}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{property.address}, {property.district}</span>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Price */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-3xl font-extrabold text-gray-900 font-heading">
              {formatPrice(property.price)}
              <span className="text-xs text-gray-500 font-normal ml-1">
                {property.purpose === "For Rent" ? "/month" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSave}
                disabled={saving}
                className={`p-2.5 rounded-full border transition ${
                  property.isSaved
                    ? "bg-rose-50 border-rose-200 text-rose-600"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
                title="Save Property"
              >
                <Heart className={`w-4 h-4 ${property.isSaved ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition"
                title="Share Property"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => window.print()}
                className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition"
                title="Print Listing"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 5-Photo Gallery Hero Grid matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[440px] rounded-3xl overflow-hidden shadow-sm">
          {/* Main Large Photo (7 Columns) */}
          <div 
            onClick={() => {
              setActivePhotoIdx(0);
              setShowGalleryModal(true);
            }}
            className="lg:col-span-7 relative h-full group bg-gray-100 cursor-pointer overflow-hidden"
          >
            {mainMedia.type === "video" ? (
              <div className="relative w-full h-full">
                <video src={mainMedia.url} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 fill-gray-900 text-gray-900 ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={mainMedia.url}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIdx(0);
                setShowGalleryModal(true);
              }}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full shadow-lg transition cursor-pointer z-10"
            >
              <ImageIcon className="w-4 h-4" />
              <span>View All Photos ({totalMedia})</span>
            </button>
          </div>

          {/* 4 Grid Photos (5 Columns, 2x2) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-full">
            {[0, 1, 2, 3].map((i) => {
              const targetIdx = (i + 1) % totalMedia;
              const mediaItem = allMedia[targetIdx];
              return (
                <div
                  key={i}
                  onClick={() => {
                    setActivePhotoIdx(targetIdx);
                    setShowGalleryModal(true);
                  }}
                  className="relative h-full bg-gray-100 rounded-xl overflow-hidden group cursor-pointer"
                >
                  {mediaItem.type === "video" ? (
                    <div className="relative w-full h-full">
                      <video src={mediaItem.url} className="w-full h-full object-cover brightness-90" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-gray-900 text-gray-900 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={mediaItem.url}
                      alt={`Sub view ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Body Split Section matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          {/* Left Main Content Column (8 Columns wide) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Description Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs">
              <h2 className="text-xl font-bold text-gray-900 mb-4 font-display">Description</h2>
              <div className="text-sm text-gray-600 leading-relaxed space-y-3">
                <p className={isDescExpanded ? "" : "line-clamp-4"}>
                  {property.description || "Located in a prime location in Kerala, this property offers excellent access to local transportation, shopping hubs, and educational institutions. Featuring modern architecture, ample natural lighting, and premium building materials throughout."}
                </p>
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-blue-600 font-bold text-xs hover:underline mt-2 inline-block"
                >
                  {isDescExpanded ? "View Less" : "View More"}
                </button>
              </div>
            </div>

            {/* Overview Grid Card (8 Icon items matching Image 2) */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs">
              <h2 className="text-xl font-bold text-gray-900 mb-6 font-display">Overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {/* 1. ID */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">ID</span>
                    <span className="text-xs font-extrabold text-gray-900">#{property.id}</span>
                  </div>
                </div>

                {/* 2. Type */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Type</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.propertyType}</span>
                  </div>
                </div>

                {/* 3. Garages / Furnishing */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Furnishing</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.furnishing || "Unfurnished"}</span>
                  </div>
                </div>

                {/* 4. Bedrooms */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Bedrooms</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.bedrooms || 0} Rooms</span>
                  </div>
                </div>

                {/* 5. Bathrooms */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Bathrooms</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.bathrooms || 0} Rooms</span>
                  </div>
                </div>

                {/* 6. Land Size */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Land Size</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.areaSqft} SqFt</span>
                  </div>
                </div>

                {/* 7. Year Built */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Property Age</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.propertyAge || "New"}</span>
                  </div>
                </div>

                {/* 8. Size */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="p-2.5 rounded-xl bg-white text-blue-600 shadow-xs">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Size</span>
                    <span className="text-xs font-extrabold text-gray-900">{property.areaSqft} SqFt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Location Map Section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-900 font-display">Location</h2>
              <div ref={mapContainerRef} className="w-full h-80 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden"></div>
            </div>
          </div>

          {/* Right Sticky Contact Seller Column (4 Columns wide matching Image 2) */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-lg flex flex-col gap-6">
              <h2 className="text-xl font-bold text-gray-900 font-display">Contact Sellers</h2>

              {/* Seller Avatar & Information */}
              <div 
                onClick={() => {
                  if (property.ownerId) {
                    navigate(`/agency/${property.ownerId}`);
                  }
                }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100/80 border border-gray-100 cursor-pointer transition-colors group select-none"
              >
                {property.ownerAvatarUrl || property.agencyLogoUrl ? (
                  <img
                    src={mediaUrl(property.ownerAvatarUrl || property.agencyLogoUrl!)}
                    alt="Seller Avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xl flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-105 transition-transform shrink-0">
                    {property.ownerName ? property.ownerName.charAt(0).toUpperCase() : "S"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {property.ownerName || property.agencyName || property.brokerName || "Seller"}
                  </h3>
                  <p className="text-[11px] font-semibold text-blue-600 hover:underline mt-0.5">
                    View profile & all listings →
                  </p>
                </div>
              </div>

              {/* Form Input Section */}
              {inquirySent ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-emerald-900">Inquiry Sent Successfully!</h4>
                  <p className="text-xs text-emerald-700">The seller will reach out to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      required
                      placeholder="Your Message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={inquiryLoading}
                    className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {inquiryLoading ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <span>Find Properties</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Gallery Lightbox Modal */}
      {showGalleryModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between items-center py-6 px-4 select-none animate-fade-in"
          onClick={() => setShowGalleryModal(false)}
        >
          {/* Top Actions: Counter & Close */}
          <div 
            className="w-full max-w-5xl px-4 flex justify-between items-center text-white/90 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-xs font-bold uppercase bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
              {activePhotoIdx + 1} / {totalMedia}
            </span>
            <button
              onClick={() => setShowGalleryModal(false)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Media Preview Area with Navigation Arrows */}
          <div 
            className="relative w-full max-w-5xl flex-1 flex items-center justify-center p-2 my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Arrow Button */}
            {totalMedia > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : totalMedia - 1));
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-sm transition-all active:scale-95 cursor-pointer shadow-xl"
                aria-label="Previous Media"
              >
                <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
              </button>
            )}

            {/* Media Content */}
            <div className="w-full h-full flex items-center justify-center">
              {(() => {
                const current = allMedia[activePhotoIdx] || allMedia[0];
                if (current.type === "video") {
                  return (
                    <video
                      src={current.url}
                      controls
                      autoPlay
                      className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl"
                    />
                  );
                } else {
                  return (
                    <img
                      src={current.url}
                      alt={`Gallery view ${activePhotoIdx + 1}`}
                      className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
                    />
                  );
                }
              })()}
            </div>

            {/* Right Navigation Arrow */}
            {totalMedia > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx((prev) => (prev < totalMedia - 1 ? prev + 1 : 0));
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-sm transition-all active:scale-95 cursor-pointer shadow-xl"
                aria-label="Next Media"
              >
                <ChevronRight className="w-7 h-7 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          <div 
            className="w-full max-w-5xl px-4 overflow-x-auto no-scrollbar flex gap-2.5 justify-center py-2 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {allMedia.map((item, idx) => (
              <button
                key={`lightbox-thumb-${idx}`}
                onClick={() => setActivePhotoIdx(idx)}
                className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 relative transition-all cursor-pointer ${
                  activePhotoIdx === idx
                    ? "border-blue-500 scale-105 shadow-md"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
              >
                {item.type === "video" ? (
                  <>
                    <video src={item.url} className="w-full h-full object-cover brightness-[0.6]" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-4 h-4 fill-white text-white" />
                    </div>
                  </>
                ) : (
                  <img src={item.url} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Footer matching user mockup media_1788721045135.png */}
      <DesktopFooter />
    </div>
  );
}
