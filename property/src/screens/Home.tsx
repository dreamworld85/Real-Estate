import { useEffect, useState } from "react";
import { Bell, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { api, ApiProperty } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import BottomNav from "@/components/BottomNav";

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: Record<string, string> = activeCategory === "All" ? {} : { propertyType: activeCategory };
    api
      .fetchProperties(params)
      .then((data) => { if (!cancelled) setProperties(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCategory]);

  return (
    <div className="min-h-screen pb-28">
      <header className="px-4 pt-5 pb-3 flex items-center justify-between">
        <button className="flex items-center gap-1 text-ink font-display font-bold">
          Wayanad, Kerala <ChevronDown size={16} />
        </button>
        <button aria-label="Notifications" className="relative">
          <Bell size={22} className="text-ink" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold" />
        </button>
      </header>

      <div className="px-4 mb-5 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-charcoal/10">
          <Search size={18} className="text-slate" />
          <input
            placeholder="Search location, property..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </div>
        <button className="bg-white rounded-xl px-3.5 border border-charcoal/10">
          <SlidersHorizontal size={18} className="text-ink" />
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

      {loading && (
        <p className="px-4 text-sm text-slate">Loading properties…</p>
      )}

      {error && (
        <p className="px-4 text-sm text-coral">
          Couldn't load properties: {error}
        </p>
      )}

      {!loading && !error && properties.length === 0 && (
        <p className="px-4 text-sm text-slate">
          No properties found for "{activeCategory}" yet.
        </p>
      )}

      {!loading && !error && properties.length > 0 && (
        <>
          <section className="mb-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <h2 className="font-display font-bold text-ink">Featured Properties</h2>
              <button className="text-sm font-semibold text-forest">View All</button>
            </div>
            <div className="px-4 flex gap-4 overflow-x-auto no-scrollbar">
              {properties.slice(0, 5).map((p) => (
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
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        </>
      )}

      <BottomNav />
    </div>
  );
}
