import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ChevronDown, SlidersHorizontal, RefreshCw, Heart } from "lucide-react";
import { api, ApiProperty } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import BottomNav from "@/components/BottomNav";

const propertyTypes = ["House", "Villa", "Apartment", "Land", "Commercial Space"];
const purposes = ["For Sale", "For Rent"];
const districts = [
  "Wayanad", "Kozhikode", "Kannur", "Kasaragod", "Malappuram", "Palakkad",
  "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Alappuzha", "Pathanamthitta",
  "Kollam", "Thiruvananthapuram",
];

export default function Search() {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [query, setQuery] = useState("");
  
  const [rawResults, setRawResults] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run search automatically when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSearched(true);

    const params: Record<string, string> = {};
    if (district) params.district = district;
    if (propertyType) params.propertyType = propertyType;
    if (purpose) params.purpose = purpose;
    if (query) params.search = query;

    api.fetchProperties(params)
      .then((data) => { if (!cancelled) setRawResults(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [district, propertyType, purpose, query]);

  // Local filter by search query
  const results = rawResults.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      (p.ownerName && p.ownerName.toLowerCase().includes(q)) ||
      (p.contactNumber && p.contactNumber.toLowerCase().includes(q)) ||
      (p.whatsappNumber && p.whatsappNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen pb-28 bg-slate-50/50">
      <div className="px-6 pt-6 pb-4 max-w-7xl mx-auto w-full">
        {/* Search Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-ink">Search Properties</h1>
            <p className="text-xs text-slate mt-0.5 font-medium">Find properties across Kerala</p>
          </div>
          {(district || propertyType || purpose || query) && (
            <button
              onClick={() => {
                setDistrict("");
                setPropertyType("");
                setPurpose("");
                setQuery("");
              }}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl transition-all active:scale-95"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Search Input Bar + Saved */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2.5 bg-white rounded-2xl px-4 py-3 border border-charcoal/10 shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
            <SearchIcon size={18} className="text-slate" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address, title, district..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate/40 text-charcoal font-medium"
            />
          </div>
          <button
            onClick={() => navigate("/saved")}
            className="rounded-2xl px-3.5 border border-charcoal/10 bg-white text-charcoal hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center group"
            aria-label="Saved properties"
            title="Saved properties"
          >
            <Heart size={18} className="text-slate/75 group-hover:text-rose-500 transition-colors" />
          </button>
        </div>

        {/* 3-Column Pill Dropdowns */}
        <div className="grid grid-cols-3 gap-2.5 mb-2">
          {/* Property Type Dropdown */}
          <div className="relative">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-3.5 pr-8 py-3 text-xs font-semibold text-charcoal outline-none focus:border-black transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Types</option>
              {propertyTypes.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          </div>

          {/* Purpose Dropdown */}
          <div className="relative">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-3.5 pr-8 py-3 text-xs font-semibold text-charcoal outline-none focus:border-black transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Purpose</option>
              {purposes.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          </div>

          {/* District Dropdown */}
          <div className="relative">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-3.5 pr-8 py-3 text-xs font-semibold text-charcoal outline-none focus:border-black transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Districts</option>
              {districts.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid Results Section */}
      <div className="px-6 max-w-7xl mx-auto w-full mt-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-2xl border border-charcoal/10 px-4">
            <SlidersHorizontal className="mx-auto text-slate/40 mb-3" size={32} />
            <p className="text-sm font-semibold text-charcoal">No properties matched your search.</p>
            <p className="text-xs text-slate mt-1">Try resetting the filters or typing a different keyword.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} compact />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
