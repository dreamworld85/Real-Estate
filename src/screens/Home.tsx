import { useEffect, useState } from "react";
import { Bell, Search, SlidersHorizontal, ChevronDown, ChevronRight, X, Leaf, Heart, Star } from "lucide-react";
import { api, ApiProperty, mediaUrl, ApiNotification } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import BottomNav from "@/components/BottomNav";
import Select from "@/components/Select";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

import allIcon from "../../header-icons/All.svg";
import landIcon from "../../header-icons/land.svg";
import houseIcon from "../../header-icons/house.svg";
import villaIcon from "../../header-icons/villa.svg";
import apartmentsIcon from "../../header-icons/Apartments.svg";

const categories = [
  { label: "All", icon: allIcon },
  { label: "Land", icon: landIcon },
  { label: "House", icon: houseIcon },
  { label: "Villa", icon: villaIcon },
  { label: "Apartment", icon: apartmentsIcon },
];

export default function Home() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [bannerUrl, setBannerUrl] = useState("/kerala_house_banner.jpg");

  useEffect(() => {
    api.fetchSetting("welcome_banner_url")
      .then((data) => {
        if (data && data.value) {
          setBannerUrl(data.value);
        }
      })
      .catch((err) => console.error("Failed to load banner setting:", err));
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
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-charcoal/5">
        {/* Brand Logo */}
        <div className="flex items-center gap-1.5 select-none">
          <div className="w-8 h-8 rounded-xl bg-forest/8 text-forest flex items-center justify-center">
            <Leaf size={16} className="fill-forest/10" />
          </div>
          <span className="font-display font-black text-lg text-ink tracking-tight">
            Green<span className="text-forest">Real</span>
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-slate bg-slate-100/70 border border-charcoal/5 px-3 py-1.5 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer select-none active:scale-95"
          >
            <span>{appliedDistrict || user?.location || "All Kerala"}</span>
            <ChevronDown size={11} className="text-slate/50" />
          </button>
          
          <button 
            onClick={handleOpenNotifications}
            aria-label="Notifications" 
            className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
          >
            <Bell size={20} className={`text-ink ${hasUnread ? "animate-bell-ring" : ""}`} />
            {hasUnread && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-cream z-10" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-cream animate-ping" />
              </>
            )}
          </button>
        </div>
      </header>

      <div className="px-4 mt-3.5 mb-5 flex gap-2 w-full items-stretch">
        <div className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 border border-charcoal/8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] focus-within:border-forest/40 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all min-w-0">
          <Search size={18} className="text-slate/75" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location, property..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate/40 text-charcoal font-medium min-w-0"
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className={`rounded-2xl px-3.5 border transition-all shadow-[0_8px_30px_rgb(0,0,0,0.02)] active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
            appliedTypes.length > 0 || appliedPurpose || appliedDistrict
              ? "bg-forest border-forest text-cream"
              : "bg-white border-charcoal/8 text-charcoal hover:bg-slate-50"
          }`}
          aria-label="Filter properties"
          title="Filter properties"
        >
          <SlidersHorizontal size={18} />
        </button>
        <button 
          onClick={() => navigate("/saved")}
          className="rounded-2xl px-3.5 border border-charcoal/8 bg-white text-charcoal hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.02)] active:scale-95 cursor-pointer flex items-center justify-center group shrink-0"
          aria-label="Saved properties"
          title="Saved properties"
        >
          <Heart size={18} className="text-slate/75 group-hover:text-rose-500 transition-colors" />
        </button>
      </div>

      <div className="w-full flex flex-nowrap gap-2 px-3.5 mb-5 py-0.5 justify-between">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex flex-col items-center gap-1 py-2 px-1 flex-1 max-w-[72px] rounded-xl transition-all duration-300 active:scale-95 cursor-pointer shrink-0 ${
              activeCategory === cat.label
                ? "bg-forest text-cream shadow-md shadow-forest/10 scale-105"
                : "bg-white text-charcoal/90 border border-charcoal/5 shadow-sm hover:bg-slate-50"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <img
                src={cat.icon}
                alt={`${cat.label} icon`}
                className={`w-4 h-4 object-contain transition-all duration-300 ${
                  activeCategory === cat.label ? "brightness-0 invert" : "opacity-80"
                }`}
              />
            </div>
            <span className="text-[10px] font-bold tracking-tight">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Welcome Banner */}
      <div className="px-4 mb-6">
        <div className="relative h-44 rounded-[24px] overflow-hidden shadow-card">
          <img
            src={mediaUrl(bannerUrl)}
            alt="Welcome Banner"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/85 via-black/25 to-transparent">
            <span className="text-[10px] font-bold text-gold uppercase tracking-widest mb-1.5">
              Perfect Stay
            </span>
            <h2 className="font-display font-extrabold text-lg text-white leading-tight tracking-wide">
              Find homes, villas, lands & escapes
            </h2>
            <p className="text-white/85 text-[11px] mt-0.5 max-w-[220px] leading-relaxed">
              Discover unique properties that match your lifestyle.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <p className="px-4 text-sm text-slate">Loading properties…</p>
      )}

      {error && (
        <p className="px-4 text-sm text-coral">
          Couldn't load properties: {error}
        </p>
      )}

      {!loading && !error && filteredProperties.length === 0 && (
        <p className="px-4 text-sm text-slate">
          No properties found matching your search.
        </p>
      )}

      {!loading && !error && filteredProperties.length > 0 && (
        <>
          {filteredProperties.some(p => p.isFeatured) && (
            <section className="mb-6 animate-fade-in">
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="fill-gold text-gold" />
                  <h2 className="font-display font-extrabold text-[15px] tracking-wide text-ink">Featured Listings</h2>
                </div>
                <button 
                  onClick={() => navigate("/search")}
                  className="text-xs font-bold text-forest hover:text-emerald-700 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  View All <ChevronRight size={13} className="text-forest/65" />
                </button>
              </div>
              <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar">
                {filteredProperties.filter((p) => p.isFeatured).slice(0, 8).map((p) => (
                  <div key={p.id} className="min-w-[260px]">
                    <PropertyCard property={p} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="px-4 pb-12">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="font-display font-extrabold text-[15px] tracking-wide text-ink">Recently Added</h2>
              <button 
                onClick={() => navigate("/search")}
                className="text-xs font-bold text-forest hover:text-emerald-700 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                View All <ChevronRight size={13} className="text-forest/65" />
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
  );
}
