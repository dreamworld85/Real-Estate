import { useEffect, useState } from "react";
import { Bell, Search, SlidersHorizontal, ChevronDown, ChevronRight, X, Heart, Star, MapPin } from "lucide-react";
import { api, ApiProperty, mediaUrl, ApiNotification, ApiUser } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import FeaturedPropertyCard from "@/components/FeaturedPropertyCard";
import BottomNav from "@/components/BottomNav";
import Select from "@/components/Select";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import DesktopPropertyListing from "@/components/DesktopPropertyListing";

import allIcon from "../../header-icons/All.png";
import landIcon from "../../header-icons/land.png";
import houseIcon from "../../header-icons/house.png";
import villaIcon from "../../header-icons/villa.png";
import apartmentsIcon from "../../header-icons/Apartments.png";

const categories = [
  { label: "All", icon: allIcon },
  { label: "Land", icon: landIcon },
  { label: "House", icon: houseIcon },
  { label: "Apartment", icon: apartmentsIcon },
];

const MOCK_AGENTS = [
  { id: 9991, name: "Amanda", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", role: "Broker" },
  { id: 9992, name: "Anderson", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", role: "Broker" },
  { id: 9993, name: "Samantha", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", role: "Broker" },
  { id: 9994, name: "Andrew", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", role: "Broker" }
];

export default function Home() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [agents, setAgents] = useState<ApiUser[]>([]);
  const [topLocations, setTopLocations] = useState<{ id: number; name: string; image_url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [bannerUrl, setBannerUrl] = useState("/kerala_house_banner.jpg");
  const [bannerTitle, setBannerTitle] = useState("Find homes, villas, lands & escapes");
  const [bannerSubtitle, setBannerSubtitle] = useState("Discover unique properties that match your lifestyle.");
  const isVideoBanner = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext || "");
  };

  useEffect(() => {
    api.fetchAgents()
      .then((data) => {
        if (data) setAgents(data);
      })
      .catch((err) => console.error("Failed to fetch agents:", err));
  }, []);

  useEffect(() => {
    api.fetchTopLocations()
      .then((data) => {
        if (data) setTopLocations(data);
      })
      .catch((err) => console.error("Failed to fetch top locations:", err));
  }, []);

  useEffect(() => {
    api.fetchSetting("welcome_banner_url")
      .then((data) => {
        if (data && data.value) {
          setBannerUrl(data.value);
        }
      })
      .catch((err) => console.error("Failed to load banner setting:", err));

    api.fetchSetting("welcome_banner_title")
      .then((data) => {
        if (data && data.value) {
          setBannerTitle(data.value);
        }
      })
      .catch((err) => console.error("Failed to load banner title setting:", err));

    api.fetchSetting("welcome_banner_subtitle")
      .then((data) => {
        if (data && data.value) {
          setBannerSubtitle(data.value);
        }
      })
      .catch((err) => console.error("Failed to load banner subtitle setting:", err));
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  async function loadNotifications() {
    try {
      const data = await api.fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const hasUnread = notifications.some((n) => n.is_read === 0);

  const handleOpenNotifications = async () => {
    setIsNotificationsOpen(true);
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Drawer Temp State
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  // Applied Filter State (triggers API fetch)
  const [appliedTypes, setAppliedTypes] = useState<string[]>([]);
  const [appliedPurpose, setAppliedPurpose] = useState("");
  const [appliedDistrict, setAppliedDistrict] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {};
    
    if (appliedTypes.length > 0) {
      params.propertyType = appliedTypes.join(",");
    } else if (activeCategory !== "All") {
      params.propertyType = activeCategory;
    }
    
    if (appliedPurpose) params.purpose = appliedPurpose;
    if (appliedDistrict) params.district = appliedDistrict;

    api
      .fetchProperties(params)
      .then((data) => { if (!cancelled) setProperties(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCategory, appliedTypes, appliedPurpose, appliedDistrict]);

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );
  });

  const displayLocation = appliedDistrict 
    ? `${appliedDistrict}, Kerala` 
    : user?.location 
    ? `${user.location}, Kerala` 
    : "Wayanad, Kerala";

  return (
    <>
      {/* Desktop Layout for width >= 1000px matching Image 1 */}
      <div className="hidden min-[1000px]:block w-full">
        <DesktopPropertyListing initialProperties={properties} />
      </div>

      {/* Mobile Layout for width < 1000px */}
      <div className="min-[1000px]:hidden min-h-screen pb-28 w-full max-w-md mx-auto bg-cream overflow-x-hidden relative">
      {/* Top curved backdrop decoration */}
      <div className="absolute top-0 left-0 w-[55%] h-[160px] bg-[#60A963] rounded-br-[100px] z-0 pointer-events-none" />

      {/* Sticky Header Nav */}
      <header className="sticky top-0 z-20 bg-transparent px-5 py-2 flex items-center justify-between border-none w-full">
        {/* Brand Logo - Properly cropped & professional */}
        <div className="flex items-center select-none shrink-0 z-10">
          <img 
            src="/brand_logo.png" 
            alt="Logo" 
            className="h-[46px] w-auto object-contain"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 select-none shrink-0 z-10">
          <button 
            onClick={handleOpenNotifications}
            aria-label="Notifications" 
            className="relative w-9 h-9 bg-white border border-charcoal/5 flex items-center justify-center rounded-full shadow-sm hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer shrink-0"
          >
            <Bell size={16} className={`text-ink ${hasUnread ? "animate-bell-ring" : ""}`} />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-white z-10" />
            )}
          </button>
          
          {user?.avatarUrl ? (
            <img 
              src={mediaUrl(user.avatarUrl)} 
              alt="Profile" 
              className="w-9 h-9 rounded-full object-cover border border-white shadow-sm shrink-0 cursor-pointer animate-fade-in"
              onClick={() => navigate("/profile")}
            />
          ) : (
            <div 
              className="w-9 h-9 rounded-full bg-[#59AD63] text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0 cursor-pointer border border-white select-none animate-fade-in uppercase"
              onClick={() => navigate("/profile")}
            >
              {(user?.name || "J").charAt(0)}
            </div>
          )}
        </div>
      </header>

      {/* Welcome Greetings - Clean, Compact, Minimal */}
      <div className="px-5 pt-[5px] text-left select-none relative z-10">
        <h1 className="text-[13px] text-white/95 font-medium leading-none">
          Hi, {user?.name ? user.name.split(" ")[0] : "Alex"}! 👋
        </h1>
        <p className="text-[13px] font-semibold text-ink mt-1.5 font-display leading-tight tracking-tight">
          Find your perfect place
        </p>
      </div>

      {/* Responsive Search Input Row */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }
        }}
        className="px-5 mt-5 z-10 relative"
      >
        <div className="flex items-center bg-[#F5F4F8] rounded-2xl px-4 py-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-charcoal/5 gap-3">
          <Search 
            size={18} 
            className="text-slate/60 shrink-0 cursor-pointer hover:text-charcoal transition-colors" 
            onClick={() => {
              if (searchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search House, Apartment, etc"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate/40 text-charcoal font-semibold"
          />
          <div className="h-5 w-[1px] bg-charcoal/10" />
          <SlidersHorizontal 
            size={18} 
            className="text-slate/60 cursor-pointer shrink-0 hover:text-charcoal transition-colors" 
            onClick={() => setIsFilterOpen(true)}
          />
        </div>
      </form>

      {/* Categories Horizontal Rounded Card Blocks */}
      <div className="px-5 mt-5 flex gap-2.5 overflow-x-auto no-scrollbar select-none z-10 relative">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`flex-1 min-w-[60px] h-[60px] rounded-[14px] flex flex-col items-center justify-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.015)] transition-all active:scale-95 cursor-pointer border ${
                isActive 
                  ? "bg-[#3F8F4B] text-white border-[#3F8F4B] shadow-md shadow-[#3F8F4B]/10 font-bold" 
                  : "bg-white text-charcoal border-charcoal/5 hover:bg-slate-50 font-medium"
              }`}
            >
              <img 
                src={cat.icon} 
                alt={cat.label} 
                className={`w-5 h-5 object-contain ${isActive ? "brightness-0 invert" : ""}`}
              />
              <span className="text-[9.5px] tracking-wide font-semibold block">{cat.label}</span>
            </button>
          );
        })}
      </div>



      {loading && (
        <p className="px-5 mt-6 text-sm text-slate select-none text-left">Loading properties…</p>
      )}

      {error && (
        <p className="px-5 mt-6 text-sm text-coral select-none text-left">
          Couldn't load properties: {error}
        </p>
      )}

      {!loading && !error && filteredProperties.length === 0 && (
        <p className="px-5 mt-6 text-sm text-slate select-none text-left">
          No properties found matching your search.
        </p>
      )}

      {!loading && !error && (
        <>


          {/* Featured Estates Slider */}
          {activeCategory === "All" && filteredProperties.filter((p) => p.isFeatured).length > 0 && (
            <section className="mt-6 text-left select-none z-10 relative">
              <div className="flex items-center justify-between px-5 mb-3">
                <h2 className="font-display font-semibold text-[16px] tracking-wide text-ink">Featured Estates</h2>
                <button 
                  onClick={() => navigate("/search?featured=true")}
                  className="text-[10px] font-bold text-slate/70 hover:text-charcoal cursor-pointer uppercase tracking-wider"
                >
                  view all
                </button>
              </div>
              <div className="px-5 flex gap-4 overflow-x-auto no-scrollbar">
                {filteredProperties.filter((p) => p.isFeatured).slice(0, 8).map((p) => (
                  <div key={p.id} className="min-w-[290px] w-[calc(100vw-36px)] max-w-[360px]">
                    <FeaturedPropertyCard property={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Welcome Banner */}
          {activeCategory === "All" && bannerUrl && (
            <div className="px-5 mt-6 select-none">
              <div className="relative h-[11rem] rounded-2xl overflow-hidden border border-charcoal/5 shadow-sm bg-slate-100 flex items-center">
                {isVideoBanner(bannerUrl) ? (
                  <video 
                    src={mediaUrl(bannerUrl)} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
                  />
                ) : (
                  <img 
                    src={mediaUrl(bannerUrl)} 
                    alt="Homepage Banner" 
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
                  />
                )}
                <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <h3 className="font-display font-extrabold text-[15px] text-white leading-tight">
                    {bannerTitle}
                  </h3>
                  <p className="text-white/80 text-[10px] mt-1 leading-snug">
                    {bannerSubtitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Popular Locations dynamic list row */}
          {activeCategory === "All" && topLocations.length > 0 && (
            <section className="mt-8 mb-6 text-left select-none animate-fade-in">
              <div className="flex items-center justify-between px-5 mb-3.5">
                <h2 className="font-display font-semibold text-[16px] tracking-wide text-ink">Popular Locations</h2>
                <button 
                  onClick={() => navigate("/top-locations")}
                  className="text-[10px] font-bold text-slate/70 hover:text-charcoal cursor-pointer uppercase tracking-wider"
                >
                  explore
                </button>
              </div>
              <div className="px-5 flex items-center gap-3 w-full py-1 overflow-x-auto no-scrollbar flex-nowrap">
                {topLocations.map((loc) => (
                  <div 
                    key={loc.id} 
                    onClick={() => navigate(`/location/${encodeURIComponent(loc.name)}`)}
                    className="relative w-[105px] h-[135px] shrink-0 rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-charcoal/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <img 
                      src={mediaUrl(loc.image_url)} 
                      alt={loc.name} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent flex flex-col justify-end p-2.5 text-left">
                      <span className="text-[12px] font-bold text-white leading-tight truncate block">{loc.name}</span>
                      <span className="text-[9px] font-semibold text-white/70 mt-0.5 truncate block">Kerala</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Explore Nearby Estates (general grid list) */}
          <section className="px-5 pb-12 mt-8">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="font-display font-semibold text-[16px] tracking-wide text-ink">Explore Nearby Estates</h2>
              <button 
                onClick={() => navigate("/search")}
                className="text-[10px] font-bold text-slate/70 hover:text-charcoal cursor-pointer uppercase tracking-wider"
              >
                view all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProperties.map((p) => (
                <PropertyCard key={p.id} property={p} compact={true} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Bottom Sheet Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="absolute inset-0" onClick={() => setIsFilterOpen(false)} />
          
          <div className="relative w-full max-w-[420px] bg-white rounded-t-[24px] p-6 shadow-2xl z-10 animate-slide-up pb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-ink">Filter Properties</h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="text-slate hover:text-charcoal font-semibold text-sm"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Property Type - Multi-Select Pills */}
              <div className="flex flex-col gap-2">
                <label className="font-display font-bold text-sm text-ink">
                  Property Type
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {["House", "Villa", "Apartment", "Land", "Commercial Space"].map((type) => {
                    const active = filterTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setFilterTypes((prev) =>
                            prev.includes(type)
                              ? prev.filter((t) => t !== type)
                              : [...prev, type]
                          );
                        }}
                        className={`px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                          active
                            ? "bg-sky-50/50 border-sky-500 text-sky-700 font-semibold shadow-sm"
                            : "bg-white border-charcoal/8 text-charcoal hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purpose - Single-Select Pills */}
              <div className="flex flex-col gap-2">
                <label className="font-display font-bold text-sm text-ink">
                  Purpose
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {["For Sale", "For Rent"].map((p) => {
                    const active = filterPurpose === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setFilterPurpose(active ? "" : p);
                        }}
                        className={`px-4 py-2.5 rounded-full border text-xs font-medium transition-all ${
                          active
                            ? "bg-sky-50/50 border-sky-500 text-sky-700 font-semibold shadow-sm"
                            : "bg-white border-charcoal/8 text-charcoal hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District - Kept as same dropdown */}
              <Select
                label="District"
                options={[
                  "Wayanad", "Kozhikode", "Kannur", "Kasaragod", "Malappuram", "Palakkad",
                  "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Alappuzha", "Pathanamthitta",
                  "Kollam", "Thiruvananthapuram",
                ]}
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => {
                  setFilterTypes([]);
                  setFilterPurpose("");
                  setFilterDistrict("");
                  setAppliedTypes([]);
                  setAppliedPurpose("");
                  setAppliedDistrict("");
                  setIsFilterOpen(false);
                }}
                className="rounded-2xl py-3.5 border border-charcoal/10 font-semibold text-sm text-charcoal hover:bg-sage/20"
              >
                Reset All
              </button>
              <button
                onClick={() => {
                  setAppliedTypes(filterTypes);
                  setAppliedPurpose(filterPurpose);
                  setAppliedDistrict(filterDistrict);
                  setIsFilterOpen(false);
                }}
                className="rounded-2xl py-3.5 bg-ink text-cream font-semibold text-sm hover:bg-forest"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div 
          className="absolute inset-0 bg-black/25 z-50"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div 
            className="absolute top-16 left-4 right-4 bg-white rounded-2xl flex flex-col p-5 shadow-xl border border-charcoal/8 animate-slide-down max-h-[65%] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-charcoal/6 pb-3 mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Notifications</h3>
                <p className="text-[10px] text-slate font-medium">Your recent property updates</p>
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs font-bold text-coral hover:underline pr-1 transition-all active:scale-95"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
                >
                  <X size={20} className="text-charcoal" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex flex-col gap-3 pb-2 no-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const isLike = notif.type === "like";
                  return (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        if (notif.sender_id) {
                          navigate(`/agency/${notif.sender_id}`);
                        }
                      }}
                      className={`flex gap-3 items-start p-3 bg-slate-50/50 hover:bg-slate-100 rounded-2xl border transition-colors cursor-pointer ${
                        notif.is_read === 0 ? "border-emerald-500/20 bg-emerald-50/10" : "border-charcoal/5"
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isLike ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {isLike ? <Heart size={15} fill="currentColor" /> : <Bell size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-ink flex items-center justify-between">
                          <span>{isLike ? "New Property Like" : "Notification"}</span>
                          {notif.is_read === 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </p>
                        <p className="text-[11px] text-slate mt-0.5 leading-relaxed font-semibold">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-slate/50 mt-1.5 block font-bold">
                          {new Date(notif.created_at).toLocaleString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-slate-50 text-slate-400">
                    <Bell size={24} />
                  </div>
                  <p className="text-xs font-semibold text-charcoal">No notifications yet</p>
                  <p className="text-[10px] text-slate">We'll let you know when updates arrive.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
    </>
  );
}
