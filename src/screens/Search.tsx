import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search as SearchIcon, ChevronDown, SlidersHorizontal, RefreshCw, Heart, MapPin } from "lucide-react";
import { api, ApiProperty } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import BottomNav from "@/components/BottomNav";

import DesktopPropertyListing from "@/components/DesktopPropertyListing";

const propertyTypes = ["House", "Villa", "Apartment", "Land", "Commercial Space"];
const purposes = ["For Sale", "For Rent"];

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const showFeaturedOnly = searchParams.get("featured") === "true";
  const [district, setDistrict] = useState("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  
  useEffect(() => {
    const qParam = new URLSearchParams(location.search).get("q") || "";
    setQuery(qParam);
  }, [location.search]);
  
  const [rawResults, setRawResults] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active properties on mount to extract available districts/cities
  useEffect(() => {
    api.fetchProperties({})
      .then((data) => {
        if (data) {
          const uniqueDistricts = Array.from(new Set(data.map(p => p.district)))
            .filter(Boolean)
            .sort();
          setAvailableDistricts(uniqueDistricts);
        }
      })
      .catch((err) => console.error("Failed to load active districts for filter dropdown:", err));
  }, []);

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
    if (showFeaturedOnly) {
      if (!p.isFeatured) return false;
    } else {
      const isAllowedFeaturedType = 
        p.propertyType === "House" || 
        p.propertyType === "Villa" || 
        p.propertyType === "Apartment";
      
      if (p.isFeatured && !isAllowedFeaturedType) {
        return false;
      }
    }
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
    <>
      {/* Desktop Layout for width >= 1000px matching Image 1 */}
      <div className="hidden min-[1000px]:block w-full">
        <DesktopPropertyListing initialProperties={results} />
      </div>

      {/* Mobile Layout for width < 1000px */}
      <div className="min-[1000px]:hidden min-h-screen pb-28 bg-[#FAF8F3] w-full max-w-md mx-auto overflow-x-hidden">
      <div className="px-4 pt-4 pb-3 w-full sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md shadow-xs border-b border-gray-200/50">
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
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 shrink-0"
            >
              <RefreshCw size={11} className="shrink-0" />
              Reset
            </button>
          )}
        </div>

        {/* Search Input Bar + Saved */}
        <div className="flex gap-2 mb-4 items-center">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-3.5 py-2.5 border border-charcoal/10 shadow-sm focus-within:border-black transition-all min-w-0">
            <SearchIcon size={16} className="text-slate shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address, title, district..."
              className="flex-1 bg-transparent text-xs sm:text-sm outline-none placeholder:text-slate/40 text-charcoal font-medium min-w-0"
            />
          </div>
          
          {/* Dedicated Map Search Button */}
          <button
            onClick={() => navigate("/map-search")}
            className="w-11 h-11 rounded-2xl border border-[#60A963]/25 bg-[#60A963]/10 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Map Search"
            title="Map Search"
          >
            <MapPin size={18} className="shrink-0" />
          </button>

          <button
            onClick={() => navigate("/saved")}
            className="w-11 h-11 rounded-2xl border border-charcoal/10 bg-white text-charcoal hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center group shrink-0"
            aria-label="Saved properties"
            title="Saved properties"
          >
            <Heart size={16} className="text-slate/75 group-hover:text-rose-500 transition-colors shrink-0" />
          </button>
        </div>

        {showFeaturedOnly && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-600/10 px-4 py-2.5 rounded-2xl mb-4 text-xs font-bold text-emerald-800 animate-fade-in">
            <span>Showing Featured Listings Only</span>
            <button
              onClick={() => navigate("/search")}
              className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-600/10 active:scale-95 transition-all cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* 3-Column Pill Dropdowns */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {/* Property Type Dropdown */}
          <div className="relative">
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-2 pr-5.5 py-2.5 text-[10.5px] font-semibold text-charcoal outline-none focus:border-black transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Types</option>
              {propertyTypes.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          </div>

          {/* Purpose Dropdown */}
          <div className="relative">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-2 pr-5.5 py-2.5 text-[10.5px] font-semibold text-charcoal outline-none focus:border-black transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Purpose</option>
              {purposes.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          </div>

          {/* District Dropdown (Renamed to Locations and Dynamic) */}
          <div className="relative">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-2 pr-5.5 py-2.5 text-[10.5px] font-semibold text-charcoal outline-none focus:border-black transition-colors cursor-pointer shadow-sm"
            >
              <option value="">All Locations</option>
              {availableDistricts.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid Results Section */}
      <div className="px-4 max-w-md mx-auto w-full mt-2">
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
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} compact />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
    </>
  );
}
