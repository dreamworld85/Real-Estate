import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { 
  Building2, 
  Home, 
  Store, 
  Trees, 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  User, 
  PlusCircle,
  ChevronDown,
  LayoutGrid
} from "lucide-react";
import { api } from "@/lib/api";

const TYPE_ICON_MAP: Record<string, { label: string; icon: any }> = {
  "House": { label: "House", icon: Home },
  "Villa": { label: "Villa", icon: Home },
  "Apartment": { label: "Apartment", icon: Building2 },
  "Land": { label: "Land", icon: Trees },
  "Commercial Space": { label: "Commercial", icon: Store },
};

const DISTRICTS = [
  "All Kerala",
  "Kochi",
  "Trivandrum",
  "Kozhikode",
  "Thrissur",
  "Wayanad",
  "Kottayam",
  "Alappuzha",
  "Idukki",
  "Kannur",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Kollam",
  "Kasaragod",
];

interface DesktopHeaderProps {
  onSearchChange?: (filters: { purpose: string; location: string; district: string; propertyType: string }) => void;
  initialPurpose?: string;
  initialLocation?: string;
  initialDistrict?: string;
  initialType?: string;
  availableTypes?: string[];
}

export default function DesktopHeader({
  onSearchChange,
  initialPurpose = "",
  initialLocation = "",
  initialDistrict = "All Kerala",
  initialType = "All Types",
  availableTypes,
}: DesktopHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [purpose, setPurpose] = useState(initialPurpose);
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [district, setDistrict] = useState(initialDistrict);
  const [propertyType, setPropertyType] = useState(initialType);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [dynamicTypes, setDynamicTypes] = useState<string[]>(availableTypes || []);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (availableTypes && availableTypes.length > 0) {
      setDynamicTypes(availableTypes);
    } else {
      api.fetchProperties({})
        .then((data) => {
          if (data) {
            const types = Array.from(new Set(data.map(p => p.propertyType))).filter(Boolean);
            setDynamicTypes(types);
          }
        })
        .catch((err) => console.error("Failed to load property types for header:", err));
    }
  }, [availableTypes]);

  const handleSearch = (newPurpose = purpose, newType = propertyType) => {
    if (onSearchChange) {
      onSearchChange({ purpose: newPurpose, location: locationInput, district, propertyType: newType });
    } else {
      const params = new URLSearchParams();
      if (newPurpose) params.set("purpose", newPurpose);
      if (locationInput) params.set("search", locationInput);
      if (district && district !== "All Kerala") params.set("district", district);
      if (newType && newType !== "All Types") params.set("propertyType", newType);
      navigate(`/search?${params.toString()}`);
    }
  };

  const handlePurposeClick = (p: string) => {
    const val = p === "All" ? "" : p;
    setPurpose(val);
    handleSearch(val, propertyType);
  };

  const handleCategoryClick = (typeLabel: string) => {
    setActiveCategory(typeLabel);
    const matchedType = typeLabel === "All" ? "All Types" : typeLabel;
    setPropertyType(matchedType);
    handleSearch(purpose, matchedType);
  };

  const dropdownTypes = ["All Types", ...dynamicTypes];

  return (
    <div className="w-full flex flex-col z-50">
      {/* Top Header Row (Logo, Category Icons, Auth) */}
      <div className="w-full bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Brand Logo */}
          <div 
            onClick={() => navigate("/")} 
            className="flex items-center cursor-pointer select-none shrink-0"
          >
            <img 
              src="/brand_logo-web.png" 
              alt="Brand Logo" 
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </div>

          {/* Category Icons Horizontal Bar */}
          <div className="hidden min-[1150px]:flex items-center gap-3 overflow-x-auto py-1 px-2 no-scrollbar">
            {/* "All" Category Icon */}
            <button
              onClick={() => handleCategoryClick("All")}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap group border ${
                activeCategory === "All" || propertyType === "All Types"
                  ? "bg-[#E8F0EA] border-[#1B5E4F] text-[#1B5E4F] shadow-sm"
                  : "border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeCategory === "All" || propertyType === "All Types" ? "bg-white text-[#1B5E4F]" : "bg-gray-100 text-gray-500 group-hover:text-[#1B5E4F] group-hover:bg-white"}`}>
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium tracking-tight">All Properties</span>
            </button>

            {/* Dynamic Available Property Type Icons */}
            {dynamicTypes.map((type, idx) => {
              const config = TYPE_ICON_MAP[type] || { label: type, icon: Building2 };
              const Icon = config.icon;
              const isSelected = activeCategory === type || propertyType === type;
              return (
                <button
                  key={idx}
                  onClick={() => handleCategoryClick(type)}
                  className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap group border ${
                    isSelected
                      ? "bg-[#E8F0EA] border-[#1B5E4F] text-[#1B5E4F] shadow-sm"
                      : "border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white text-[#1B5E4F]" : "bg-gray-100 text-gray-500 group-hover:text-[#1B5E4F] group-hover:bg-white"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium tracking-tight">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Auth & Submit Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-[#1B5E4F] text-gray-700 font-medium text-sm transition"
              >
                <div className="w-7 h-7 rounded-full bg-[#E8F0EA] text-[#0F3D3E] flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="hidden sm:inline font-medium text-[#0F3D3E] max-w-[100px] truncate">{user.name || "Profile"}</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 hover:border-[#0F3D3E] text-[#0F3D3E] font-semibold text-sm transition shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>Sign in</span>
              </button>
            )}

            <button
              onClick={() => navigate(user ? "/add-property" : "/login?redirect=/add-property")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Property</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Filter Bar (FIXED STICKY TOP-0 ON SCROLL matching user mockup) */}
      {isScrolled && <div className="w-full h-[68px]" />}
      <div 
        className={`w-full transition-all duration-300 border-b z-50 ${
          isScrolled
            ? "fixed top-0 left-0 right-0 bg-[#FAF8F3]/95 backdrop-blur-md border-gray-300 shadow-md py-3 px-6"
            : "relative bg-[#FAF8F3] border-gray-200/80 py-4 px-6"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 justify-between">
          {/* Purpose Pills (All / For Rent / For Sale) */}
          <div className="flex items-center bg-gray-200/70 p-1 rounded-full text-xs font-semibold">
            {["All", "For Rent", "For Sale"].map((p) => {
              const active = (p === "All" && !purpose) || purpose === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePurposeClick(p)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-gray-700 hover:text-black font-medium"
                  }`}
                >
                  {p === "All" ? "All Properties" : p}
                </button>
              );
            })}
          </div>

          {/* Location Input */}
          <div className="flex-1 min-w-[200px] flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
            <MapPin className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search location or keyword..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
            />
          </div>

          {/* District Dropdown */}
          <div className="relative min-w-[150px] flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-xs">
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                if (onSearchChange) onSearchChange({ purpose, location: locationInput, district: e.target.value, propertyType });
              }}
              className="w-full bg-transparent outline-none appearance-none pr-6 cursor-pointer font-medium text-gray-700"
            >
              {DISTRICTS.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Property Type Dropdown */}
          <div className="relative min-w-[150px] flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-xs">
            <select
              value={propertyType}
              onChange={(e) => {
                setPropertyType(e.target.value);
                setActiveCategory(e.target.value === "All Types" ? "All" : e.target.value);
                if (onSearchChange) onSearchChange({ purpose, location: locationInput, district, propertyType: e.target.value });
              }}
              className="w-full bg-transparent outline-none appearance-none pr-6 cursor-pointer font-medium text-gray-700"
            >
              {dropdownTypes.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
          </div>

          {/* Advanced Search Button */}
          <button
            type="button"
            onClick={() => handleSearch()}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Search advanced</span>
          </button>

          {/* Submit Search Button */}
          <button
            type="button"
            onClick={() => handleSearch()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-md transition"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
