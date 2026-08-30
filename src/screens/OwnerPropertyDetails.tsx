import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, MessageSquare, Heart, Pencil, Power, Trash2, ChevronLeft, Share2, Star, Sparkles, X, User, Phone, MessageCircle, Play } from "lucide-react";
import { api, ApiPropertyDetail, mediaUrl, formatArea } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import BottomNav from "@/components/BottomNav";
import { useAddProperty } from "@/lib/AddPropertyContext";
import { useAuth } from "@/lib/AuthContext";
import PropertyViewersModal from "@/components/PropertyViewersModal";
import PropertyActivationModal from "@/components/PropertyActivationModal";

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

export default function OwnerPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startEditing } = useAddProperty();
  const [property, setProperty] = useState<ApiPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [showActivationChoice, setShowActivationChoice] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featuredData, setFeaturedData] = useState<any>(null);
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
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.fetchProperty(id),
      api.fetchFeaturedStatus().catch(() => null)
    ])
      .then(([prop, feat]) => {
        setProperty(prop);
        setFeaturedData(feat);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleToggleActive() {
    if (!property) return;
    setBusy(true);
    try {
      const nextStatus = property.status === "Active" ? "Inactive" : "Active";
      await api.updatePropertyStatus(property.id, nextStatus);
      setProperty({ ...property, status: nextStatus });
    } catch (err: any) {
      if (err.requiresActivationChoice) {
        setShowActivationChoice(true);
      } else {
        alert(err.message || "Failed to update property status.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleActivateFree() {
    if (!property) return;
    setShowActivationChoice(false);
    setBusy(true);
    try {
      await api.updatePropertyStatus(property.id, "Active", true);
      setProperty({ ...property, status: "Active" });
      setTimeout(() => {
        alert("Property activated successfully under Admin Number fallback!");
      }, 100);
    } catch (err: any) {
      alert(err.message || "Failed to activate property.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!property) return;
    setBusy(true);
    try {
      await api.deleteProperty(property.id);
      navigate("/my-properties");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="px-4 py-10 text-sm text-slate">Loading…</p>;
  if (error || !property) return <p className="px-4 py-10 text-sm text-coral">{error || "Not found."}</p>;

  const heroImage = property.images[0] ? mediaUrl(property.images[0]) : FALLBACK_IMAGE;

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <div className="relative">
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
          className="flex w-full h-64 overflow-x-auto snap-x snap-mandatory no-scrollbar bg-slate-100"
        >
          {property.images && property.images.length > 0 ? (
            <>
              {property.images.map((img, idx) => (
                <div key={`img-${idx}`} className="w-full h-full flex-shrink-0 snap-start">
                  <img
                    src={mediaUrl(img)}
                    alt={`${property.title} - image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {property.videos && property.videos.map((vid, idx) => (
                <div key={`vid-${idx}`} className="w-full h-full flex-shrink-0 snap-start bg-black flex items-center justify-center">
                  <video
                    src={mediaUrl(vid)}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="w-full h-full flex-shrink-0 snap-start">
              <img
                src={FALLBACK_IMAGE}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        {/* Thumbnails Row */}
        {property.images && (property.images.length + (property.videos?.length || 0)) > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-transparent px-2 py-1.5 flex items-center gap-1.5 max-w-[90%] overflow-x-auto no-scrollbar z-20">
            {(() => {
              const mediaItems = [
                ...(property.images || []).map((img) => ({ type: "image" as const, url: img })),
                ...(property.videos || []).map((vid) => ({ type: "video" as const, url: vid }))
              ];

              if (mediaItems.length <= 5) {
                return mediaItems.map((item, idx) => {
                  const isActive = activeIdx === idx;
                  return (
                    <button
                      key={`thumb-${idx}`}
                      onClick={() => handleThumbnailClick(idx)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                        isActive ? "border-white scale-105 shadow-md" : "border-white/50 opacity-80 hover:opacity-100"
                      }`}
                    >
                      {item.type === "image" ? (
                        <img
                          src={mediaUrl(item.url)}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                          <video
                            src={mediaUrl(item.url)}
                            className="w-full h-full object-cover brightness-[0.7]"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play size={10} className="fill-white text-white stroke-[2.5]" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                });
              } else {
                return (
                  <>
                    {mediaItems.slice(0, 4).map((item, idx) => {
                      const isActive = activeIdx === idx;
                      return (
                        <button
                          key={`thumb-${idx}`}
                          onClick={() => handleThumbnailClick(idx)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                            isActive ? "border-white scale-105 shadow-md" : "border-white/50 opacity-80 hover:opacity-100"
                          }`}
                        >
                          {item.type === "image" ? (
                            <img
                              src={mediaUrl(item.url)}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                              <video
                                src={mediaUrl(item.url)}
                                className="w-full h-full object-cover brightness-[0.7]"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Play size={10} className="fill-white text-white stroke-[2.5]" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {(() => {
                      const remainingCount = mediaItems.length - 4;
                      const idx = 4;
                      const isActive = activeIdx >= idx;
                      const lastItem = mediaItems[4];
                      return (
                        <button
                          onClick={() => handleThumbnailClick(idx)}
                          className={`w-9 h-9 rounded-xl overflow-hidden relative flex-shrink-0 transition-all border-2 cursor-pointer ${
                            isActive ? "border-white scale-105 shadow-md" : "border-white/50 opacity-85 hover:opacity-100"
                          }`}
                        >
                          {lastItem.type === "image" ? (
                            <img
                              src={mediaUrl(lastItem.url)}
                              alt="More media"
                              className="w-full h-full object-cover brightness-[0.4]"
                            />
                          ) : (
                            <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                              <video
                                src={mediaUrl(lastItem.url)}
                                className="w-full h-full object-cover brightness-[0.3]"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                                <Play size={10} className="fill-white text-white stroke-[2.5]" />
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white font-display select-none">
                            +{remainingCount}
                          </div>
                        </button>
                      );
                    })()}
                  </>
                );
              }
            })()}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white rounded-full p-2 z-10 shadow-sm transition-all cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <button className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 z-10 shadow-sm transition-all cursor-pointer">
          <Share2 size={18} className="text-ink" />
        </button>
      </div>

      <div className="px-6 pt-5 flex flex-col gap-4">
        <div className="bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={property.status} />
            {property.isFeatured && (
              <span className="bg-gold/15 text-gold text-[10px] font-extrabold px-2 py-0.5 rounded border border-gold/30 uppercase tracking-wider flex items-center gap-1">
                <Star size={10} className="fill-gold text-gold" /> Featured
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold text-[18px] text-ink leading-tight">
                {formatPrice(property.price)}
              </p>
              {property.isPriceNegotiable && (
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Negotiable
                </span>
              )}
            </div>
            <p className="font-display font-medium text-charcoal mt-1 text-[14px]">{property.title}</p>
            <p className="text-xs text-slate mt-0.5">{formatArea(property.areaSqft, property.propertyType)} &middot; {property.district}</p>
          </div>
          
          <div className="flex items-center gap-1.5 border-t border-charcoal/5 pt-2">
            <button 
              onClick={() => navigate(`/property/${property.id}/reviews`)}
              className="flex items-center gap-1 bg-amber/10 hover:bg-amber/20 text-amber px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer animate-fade-in"
            >
              <Star size={12} className="fill-gold text-gold" />
              <span>{property.avgRating ? property.avgRating.toFixed(1) : "0.0"}</span>
              <span className="text-slate/75 font-semibold">({property.ratingCount || 0} reviews)</span>
            </button>
          </div>
        </div>

        {property.description && (
          <div className="bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Description</p>
            <p className="text-xs text-slate leading-relaxed">{property.description}</p>
          </div>
        )}

        {property.youtubeUrl && getYoutubeEmbedUrl(property.youtubeUrl) && (
          <div className="bg-white border border-charcoal/5 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
            <p className="text-[10px] font-bold text-slate uppercase tracking-wider pl-0.5">Video Tour</p>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-charcoal/8 shadow-sm">
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

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setShowViewersModal(true)}
            className="bg-sky-50/30 border border-sky-100 rounded-2xl p-3 flex flex-col items-center gap-1 hover:bg-sky-50 transition-colors active:scale-95 cursor-pointer w-full text-center"
          >
            <Eye size={18} className="text-sky-600" />
            <p className="font-display font-extrabold text-base text-sky-700">{property.views}</p>
            <p className="text-[9px] font-bold text-sky-600/90 uppercase tracking-wider">Views</p>
          </button>
          <div className="bg-white border border-charcoal/5 rounded-2xl p-3 flex flex-col items-center gap-1 justify-center">
            <MessageSquare size={18} className="text-forest" />
            <p className="font-display font-extrabold text-base text-ink">{property.enquiryCount}</p>
            <p className="text-[9px] font-bold text-slate/80 uppercase tracking-wider">Enquiries</p>
          </div>
          <div className="bg-white border border-charcoal/5 rounded-2xl p-3 flex flex-col items-center gap-1 justify-center">
            <Heart size={18} className="text-coral" />
            <p className="font-display font-extrabold text-base text-ink">{property.saveCount}</p>
            <p className="text-[9px] font-bold text-slate/80 uppercase tracking-wider">Saves</p>
          </div>
        </div>

        {/* Restore Contact Info Option for Subscribed Users */}
        {property.useAdminContact && user?.subscriptionStatus === "active" && (
          <div className="bg-emerald-50 border border-emerald-200/40 rounded-2xl p-4 shadow-sm flex flex-col gap-3 font-display animate-fade-in">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none">✨</span>
              <div className="flex-1">
                <h4 className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">Active Subscription!</h4>
                <p className="text-[10px] text-emerald-800 leading-normal mt-0.5">
                  Currently displaying Admin contact. Click below to restore your own details.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!window.confirm("Restore your contact number to this listing?")) return;
                setBusy(true);
                try {
                  await api.restorePropertyContact(property.id);
                  const updated = await api.fetchProperty(property.id);
                  setProperty(updated);
                  alert("Successfully restored your contact details!");
                } catch (err: any) {
                  alert(err.message || "Failed to update contact details.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold text-center transition-all shadow-md cursor-pointer"
            >
              Restore My Number
            </button>
          </div>
        )}

        {/* Contact Info Added in the Post */}
        <div className="bg-white rounded-2xl border border-charcoal/5 p-4 shadow-sm flex flex-col gap-3 font-display">
          <div className="flex items-center justify-between border-b border-charcoal/5 pb-2">
            <h3 className="font-bold text-[10px] text-slate uppercase tracking-wider">Contact Info in Post</h3>
            <span className="text-[9px] font-extrabold text-forest bg-forest/5 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {property.listingRole}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {/* Person */}
            <div className="flex items-center gap-3 p-2.5 bg-slate-50/50 rounded-xl border border-charcoal/5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate shrink-0">
                <User size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate/75 uppercase tracking-wide leading-none">Listing Person</p>
                <p className="text-xs font-bold text-ink mt-1 truncate">
                  {property.listingRole === "Agency"
                    ? (property.agencyName || "Agency")
                    : property.listingRole === "Broker"
                    ? (property.brokerName || "Broker")
                    : (property.ownerName || "Owner")}
                </p>
              </div>
            </div>

            {/* Phone */}
            {property.contactNumber && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-charcoal/5 hover:border-forest/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-forest/5 flex items-center justify-center text-forest shrink-0">
                    <Phone size={13} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate/75 uppercase tracking-wide leading-none">
                      Contact Number {property.useAdminContact && <span className="text-amber-600 font-bold"> (admin's)</span>}
                    </p>
                    <p className="text-xs font-bold text-ink mt-1">{property.contactNumber}</p>
                  </div>
                </div>
                <a 
                  href={`tel:${property.contactNumber}`}
                  className="px-2.5 py-1 bg-ink text-cream hover:bg-black rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Call
                </a>
              </div>
            )}

            {/* WhatsApp */}
            {property.whatsappNumber && (
              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-charcoal/5 hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MessageCircle size={13} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate/75 uppercase tracking-wide leading-none">
                      WhatsApp Number {property.useAdminContact && <span className="text-emerald-600 font-bold"> (admin's)</span>}
                    </p>
                    <p className="text-xs font-bold text-ink mt-1">{property.whatsappNumber}</p>
                  </div>
                </div>
                <a 
                  href={`https://wa.me/${property.whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Chat
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button 
            onClick={() => {
              if (property) {
                startEditing(property);
                navigate("/add-property/details");
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-semibold text-xs shadow-md shadow-emerald-100 active:scale-[0.99] cursor-pointer"
          >
            <Pencil size={14} /> Edit Listing Details
          </button>
          <div className="flex gap-2.5">
            <button
              disabled={busy}
              onClick={handleToggleActive}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 border border-charcoal/15 bg-white hover:bg-slate-50 text-slate font-display font-bold text-xs shadow-sm cursor-pointer disabled:opacity-40"
            >
              <Power size={13} className="text-amber-600" /> {property.status === "Active" ? "Deactivate" : "Activate"}
            </button>
            <button
              disabled={busy}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 border border-rose-200 bg-rose-50/20 hover:bg-rose-50 text-rose-600 font-display font-bold text-xs shadow-sm cursor-pointer disabled:opacity-40"
            >
              <Trash2 size={13} /> Delete Listing
            </button>
          </div>
        </div>

        {property.status === "Active" && !property.isFeatured && (
          <div className="mt-2 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/30 flex flex-col gap-2.5">
            <div>
              <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Star size={13} className="fill-gold text-gold" />
                Feature Your Listing
              </h4>
              <p className="text-[10px] text-slate mt-0.5 leading-relaxed">
                Pin your listing to the top of home feed and search results to get up to 10x more leads.
              </p>
            </div>
            <button
              onClick={() => setShowFeatureModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gold hover:bg-gold-500 text-white text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] cursor-pointer animate-fade-in"
            >
              <Sparkles size={12} /> Promote to Featured ({featuredData?.isEligibleForFree ? "Free Trial" : `₹${featuredData?.featuredPrice || 299}`})
            </button>
          </div>
        )}
      </div>
      {showViewersModal && (
        <PropertyViewersModal 
          propertyId={property.id}
          propertyTitle={property.title}
          onClose={() => setShowViewersModal(false)}
        />
      )}
      {showActivationChoice && (
        <PropertyActivationModal
          onClose={() => setShowActivationChoice(false)}
          onUpgrade={() => {
            setShowActivationChoice(false);
            navigate("/subscription");
          }}
          onContinueFree={handleActivateFree}
        />
      )}
      {showFeatureModal && (
        <FeatureListingModal
          propertyId={property.id}
          featuredData={featuredData}
          onClose={() => setShowFeatureModal(false)}
          onSuccess={() => {
            setProperty(prev => prev ? { ...prev, isFeatured: true } : null);
          }}
        />
      )}
      <BottomNav />
    </div>
  );
}

interface FeatureListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  propertyId: number;
  featuredData: any;
}

function FeatureListingModal({ onClose, onSuccess, propertyId, featuredData }: FeatureListingModalProps) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const price = featuredData?.featuredPrice || 299;
  const isFree = !!featuredData?.isEligibleForFree;
  const promoText = featuredData?.featuredText || "Pinned to the top section of search results and homepage";

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      await api.featureProperty(propertyId);
      setStatus("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Featured upgrade activation failed");
      setStatus("error");
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-sm p-6 flex flex-col gap-6 animate-slide-up shadow-2xl border border-charcoal/5">
        {status === "success" ? (
          <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce">
              <Sparkles size={30} />
            </div>
            <h3 className="font-display font-extrabold text-lg text-ink">
              {isFree ? "Activation Successful!" : "Payment Successful!"}
            </h3>
            <p className="text-xs text-slate max-w-[240px] leading-relaxed">
              {isFree 
                ? "Your property has been successfully featured for free under your active subscription trial!" 
                : "Your property is now featured. Pinned visibility has been enabled successfully!"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Premium Upgrade</span>
                <h3 className="font-display font-extrabold text-lg text-ink mt-0.5">Feature Your Listing</h3>
              </div>
              <button 
                onClick={onClose} 
                disabled={processing}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} className="text-slate" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 bg-slate-50 p-4 rounded-2xl border border-charcoal/5">
              <div className="flex items-start gap-2.5">
                <span className="text-sm shrink-0">⭐</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">Priority Top Placement</span>
                  <span className="text-[10px] text-slate mt-0.5 leading-tight">{promoText}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-sm shrink-0">🎨</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">Featured Golden Badge</span>
                  <span className="text-[10px] text-slate mt-0.5 leading-tight">Vibrant gold status label makes your listing pop visually</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-sm shrink-0">📈</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">10x Views & Enquiries</span>
                  <span className="text-[10px] text-slate mt-0.5 leading-tight">Direct uploader listings gain maximum user interaction</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-gold/5 p-4 rounded-2xl border border-gold/15">
              <span className="text-xs text-slate font-medium">Feature Promotion Fee:</span>
              <span className="font-display font-extrabold text-base text-gold">
                {isFree ? "₹0 (Free Trial)" : `₹${price}`}
              </span>
            </div>

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-4 rounded-2xl bg-ink text-cream hover:bg-black text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {processing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                  {isFree ? "Activating Free Promotion..." : "Processing Payment..."}
                </>
              ) : (
                isFree ? "Activate Free Featured Promotion" : `Pay ₹${price} to Activate`
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
