import { useEffect, useState } from "react";
import { Bell, Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { api, ApiProperty, mediaUrl } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import BottomNav from "@/components/BottomNav";
import Select from "@/components/Select";

const categories = [
  { label: "All", icon: "🏡" },
  { label: "Land", icon: "🌴" },
  { label: "House", icon: "🏠" },
  { label: "Villa", icon: "🏘️" },
  { label: "Apartment", icon: "🏢" },
];

export default function Home() {
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Welcome to Kerala Realty!",
      message: "Find modern villas, houses, apartments, and lands that match your premium lifestyle.",
      time: "Just now",
      read: false,
    },
    {
      id: 2,
      title: "Listing Pending Approval",
      message: "Your property 'Land in Kottayam' was uploaded successfully and is currently under admin verification.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 3,
      title: "New Enquiry Received",
      message: "A visitor has inquired about your property listing. Check details under profile enquiries.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const hasUnread = notifications.some((n) => !n.read);

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Filter Drawer Temp State
  const [filterType, setFilterType] = useState("");
  const [filterPurpose, setFilterPurpose] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");

  // Applied Filter State (triggers API fetch)
  const [appliedType, setAppliedType] = useState("");
  const [appliedPurpose, setAppliedPurpose] = useState("");
  const [appliedDistrict, setAppliedDistrict] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {};
    if (activeCategory !== "All") params.propertyType = activeCategory;
    
    // Override with explicit filters if applied
    if (appliedType) params.propertyType = appliedType;
    if (appliedPurpose) params.purpose = appliedPurpose;
    if (appliedDistrict) params.district = appliedDistrict;

    api
      .fetchProperties(params)
      .then((data) => { if (!cancelled) setProperties(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCategory, appliedType, appliedPurpose, appliedDistrict]);

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-5 pb-3 flex items-center justify-between">
        <button className="flex items-center gap-1 text-ink font-display font-bold">
          Wayanad, Kerala <ChevronDown size={16} />
        </button>
        <button 
          onClick={handleOpenNotifications}
          aria-label="Notifications" 
          className="relative p-1 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
        >
          <Bell size={22} className="text-ink" />
          {hasUnread && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-cream" />
          )}
        </button>
      </header>

      <div className="px-4 mb-5 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-charcoal/10">
          <Search size={18} className="text-slate" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location, property..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </div>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className={`rounded-xl px-3.5 border transition-colors ${
            appliedType || appliedPurpose || appliedDistrict
              ? "bg-ink border-ink text-cream"
              : "bg-white border-charcoal/10 text-ink"
          }`}
          aria-label="Filter properties"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="px-4 mb-6 flex gap-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex flex-col items-center gap-1.5 min-w-[64px] py-2.5 rounded-2xl ${
              activeCategory === cat.label
                ? "bg-ink text-cream"
                : "bg-white text-charcoal border border-charcoal/8"
            }`}
          >
            <span className="text-lg leading-none">{cat.icon}</span>
            <span className="text-xs font-medium">{cat.label}</span>
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
          <section className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-display font-bold text-ink">Featured Properties</h2>
              <button className="text-sm font-semibold text-forest">View All</button>
            </div>
            <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar">
              {filteredProperties.slice(0, 5).map((p) => (
                <div key={p.id} className="min-w-[260px]">
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
          </section>

          <section className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-ink">Recently Added</h2>
              <button className="text-sm font-semibold text-forest">View All</button>
            </div>
            <div className="flex flex-col gap-4">
              {filteredProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
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

            <div className="flex flex-col gap-4">
              <Select
                label="Property Type"
                options={["House", "Villa", "Apartment", "Land", "Commercial Space"]}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              />
              <Select
                label="Purpose"
                options={["For Sale", "For Rent"]}
                value={filterPurpose}
                onChange={(e) => setFilterPurpose(e.target.value)}
              />
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
                  setFilterType("");
                  setFilterPurpose("");
                  setFilterDistrict("");
                  setAppliedType("");
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
                  setAppliedType(filterType);
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
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="flex gap-3 items-start p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-charcoal/5 transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                      <Bell size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-slate/50 mt-1.5 block font-semibold">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))
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
