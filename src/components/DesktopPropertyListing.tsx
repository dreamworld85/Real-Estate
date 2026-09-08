import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, List, ChevronDown, MapPin, BedDouble, Bath, Maximize, X, Search as SearchIcon } from "lucide-react";
import { ApiProperty, mediaUrl, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import DesktopHeader from "./DesktopHeader";
import DesktopFooter from "./DesktopFooter";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

const KERALA_COORDS = { lat: 10.850516, lng: 76.271080 };

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; radius: number }> = {
  Wayanad: { lat: 11.6854, lng: 76.1320, radius: 14000 },
  Kozhikode: { lat: 11.2588, lng: 75.7804, radius: 12000 },
  Kannur: { lat: 11.8745, lng: 75.3704, radius: 14000 },
  Kasaragod: { lat: 12.5102, lng: 74.9852, radius: 15000 },
  Malappuram: { lat: 11.0735, lng: 76.0740, radius: 14000 },
  Palakkad: { lat: 10.7867, lng: 76.6547, radius: 16000 },
  Thrissur: { lat: 10.5276, lng: 76.2144, radius: 12000 },
  Ernakulam: { lat: 9.9816, lng: 76.2999, radius: 14000 },
  Kochi: { lat: 9.9312, lng: 76.2673, radius: 10000 },
  Idukki: { lat: 9.9189, lng: 77.1025, radius: 18000 },
  Kottayam: { lat: 9.5916, lng: 76.5221, radius: 12000 },
  Alappuzha: { lat: 9.4981, lng: 76.3388, radius: 12000 },
  Pathanamthitta: { lat: 9.2648, lng: 76.7870, radius: 14000 },
  Kollam: { lat: 8.8932, lng: 76.6141, radius: 12000 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366, radius: 14000 },
  Trivandrum: { lat: 8.5241, lng: 76.9366, radius: 14000 }
};

interface DesktopPropertyListingProps {
  initialProperties?: ApiProperty[];
  initialShowMap?: boolean;
}

export default function DesktopPropertyListing({ 
  initialProperties, 
  initialShowMap = false 
}: DesktopPropertyListingProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [properties, setProperties] = useState<ApiProperty[]>(initialProperties || []);
  const [allProperties, setAllProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(!initialProperties);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("Default");
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);
  const [showMap, setShowMap] = useState<boolean>(initialShowMap);

  // Map Auto Search Location States
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [selectedMapLocation, setSelectedMapLocation] = useState<string | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Search Filters — Default purpose is empty to show ALL properties initially
  const [filters, setFilters] = useState({
    purpose: "",
    location: "",
    state: "All States (India)",
    district: "All Kerala",
    propertyType: "All Types"
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const boundaryCircleRef = useRef<any>(null);

  // Fetch master list of all properties once for complete map coverage
  useEffect(() => {
    api.fetchProperties({})
      .then((data) => {
        if (data) setAllProperties(data);
      })
      .catch((err) => console.error("Error fetching master properties list for map:", err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const queryParams: Record<string, string> = {};
    if (filters.purpose) queryParams.purpose = filters.purpose;
    if (filters.location) queryParams.search = filters.location;
    if (filters.state && filters.state !== "All States (India)") queryParams.state = filters.state;
    if (filters.district && filters.district !== "All Kerala") queryParams.district = filters.district;
    if (filters.propertyType && filters.propertyType !== "All Types") queryParams.propertyType = filters.propertyType;

    api.fetchProperties(queryParams)
      .then((data) => setProperties(data || []))
      .catch((err) => console.error("Error fetching properties for desktop listing:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  // Extract unique available property types & districts from dataset
  const availableTypes = Array.from(new Set(properties.map((p) => p.propertyType))).filter(Boolean);
  const locationSuggestions = Array.from(new Set([
    ...Object.keys(DISTRICT_COORDINATES),
    ...properties.map((p) => p.district).filter(Boolean),
  ])).sort();

  const filteredLocationSuggestions = mapSearchQuery
    ? locationSuggestions.filter((loc) => loc.toLowerCase().includes(mapSearchQuery.toLowerCase()))
    : locationSuggestions;

  // Active Location Query (from map search input OR top header district filter)
  const activeLocationQuery = selectedMapLocation || mapSearchQuery || (filters.district !== "All Kerala" ? filters.district : "");
  
  const mapFilteredProperties = properties.filter((p) => {
    if (!activeLocationQuery) return true;
    const q = activeLocationQuery.toLowerCase();
    return (
      p.district.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q)
    );
  });

  // Initialize OpenStreetMap (Leaflet) when map is visible
  useEffect(() => {
    if (!showMap) return;

    let timer: NodeJS.Timeout;

    const loadLeaflet = () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initMap();
        document.head.appendChild(script);
      }
    };

    const initMap = () => {
      if (!window.L) {
        loadLeaflet();
        timer = setTimeout(initMap, 300);
        return;
      }

      if (mapContainerRef.current) {
        if (!mapRef.current) {
          const map = window.L.map(mapContainerRef.current).setView([KERALA_COORDS.lat, KERALA_COORDS.lng], 8);
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
          }).addTo(map);
          mapRef.current = map;
        }

        // CRITICAL CANVAS RE-RENDER FIX: Invalidate size after animation frame so grey blank map never occurs
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 120);

        // Clear existing markers
        markersRef.current.forEach((m) => {
          if (m && typeof m.remove === "function") m.remove();
        });
        markersRef.current = [];

        // Clear existing location boundary circle
        if (boundaryCircleRef.current && typeof boundaryCircleRef.current.remove === "function") {
          boundaryCircleRef.current.remove();
          boundaryCircleRef.current = null;
        }

        const bounds: [number, number][] = [];
        const mapList = allProperties.length > 0 ? allProperties : properties;

        mapList.forEach((prop, idx) => {
          const rawLat = prop.latitude ? parseFloat(String(prop.latitude)) : null;
          const rawLng = prop.longitude ? parseFloat(String(prop.longitude)) : null;
          
          const lat = (rawLat && !isNaN(rawLat) && rawLat !== 0) 
            ? rawLat 
            : 10.850516 + ((idx % 5) * 0.15) - 0.3;
          const lng = (rawLng && !isNaN(rawLng) && rawLng !== 0) 
            ? rawLng 
            : 76.271080 + ((idx % 4) * 0.15) - 0.2;

          bounds.push([lat, lng]);

          const priceNum = parseFloat(String(prop.price));
          const priceText = priceNum >= 10000000 
            ? `₹${(priceNum / 10000000).toFixed(1)}Cr` 
            : priceNum >= 100000 
              ? `₹${(priceNum / 100000).toFixed(0)}L` 
              : `₹${priceNum.toLocaleString("en-IN")}`;

          const typeShort = (prop.propertyType || "Property")
            .replace("Independent House / ", "")
            .replace("Plot / ", "")
            .replace(" Commercial", "");

          const purposeShort = (prop.purpose || "For Sale").replace("For ", "");

          const isSelectedPin = selectedProperty?.id === prop.id;
          const isLocMatch = activeLocationQuery && (
            prop.district.toLowerCase().includes(activeLocationQuery.toLowerCase()) ||
            prop.address.toLowerCase().includes(activeLocationQuery.toLowerCase())
          );

          const bgStyle = isSelectedPin ? "#0F3D3E" : (isLocMatch ? "#1B5E4F" : "#3B82F6");
          const borderStyle = isSelectedPin ? "3px solid #E5C158" : "2px solid #ffffff";
          const scaleStyle = isSelectedPin ? "transform: scale(1.15); z-index: 99999;" : "";

          const customIcon = window.L.divIcon({
            className: `custom-leaflet-pill ${isSelectedPin ? "active-pill" : ""}`,
            html: `<div style="background:${bgStyle}; color:#ffffff; padding:4px 10px; border-radius:18px; font-weight:700; border:${borderStyle}; ${scaleStyle} box-shadow:0 4px 12px rgba(0,0,0,0.4); white-space:nowrap; cursor:pointer; text-align:center; line-height:1.2; transition:all 0.2s ease;">
              <div style="font-size:12px; font-weight:800; color:#FFFFFF;">${priceText}</div>
              <div style="font-size:9.5px; font-weight:600; color:#E8F0EA; text-transform:capitalize; margin-top:1px;">${typeShort} • ${purposeShort}</div>
            </div>`,
            iconSize: [85, 34],
            iconAnchor: [42, 17]
          });

          const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
          marker.on("click", (e: any) => {
            window.L.DomEvent.stopPropagation(e);
            setSelectedProperty(prop);
          });
          markersRef.current.push(marker);
        });

        // DRAW RED DASHED BOUNDARY MARKER OVERLAY AROUND SEARCHED / SELECTED LOCATION
        const matchedLocationKey = Object.keys(DISTRICT_COORDINATES).find(
          (key) => key.toLowerCase() === activeLocationQuery.toLowerCase()
        );

        if (matchedLocationKey && mapRef.current) {
          const locInfo = DISTRICT_COORDINATES[matchedLocationKey];
          const circle = window.L.circle([locInfo.lat, locInfo.lng], {
            radius: locInfo.radius,
            color: "#EF4444", // Red outline
            weight: 2.5,
            dashArray: "6, 8", // Dashed border matching Image 1
            fillColor: "#EF4444",
            fillOpacity: 0.08
          }).addTo(mapRef.current);

          boundaryCircleRef.current = circle;
          mapRef.current.fitBounds(circle.getBounds(), { padding: [30, 30] });
        } else if (bounds.length > 0 && mapRef.current && !selectedProperty) {
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      } else {
        timer = setTimeout(initMap, 300);
      }
    };

    initMap();
    return () => clearTimeout(timer);
  }, [properties, allProperties, selectedProperty, showMap, activeLocationQuery]);

  // Smoothly scroll selected property card into view when selected from map
  useEffect(() => {
    if (selectedProperty) {
      const cardEl = document.getElementById(`property-card-${selectedProperty.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedProperty]);

  const handlePropertyClick = (propId: number) => {
    if (!token) {
      navigate(`/login?redirect=/property/${propId}`);
    } else {
      navigate(`/property/${propId}`);
    }
  };

  // Sort properties
  const displayProperties = activeLocationQuery ? mapFilteredProperties : properties;
  const sortedProperties = [...displayProperties].sort((a, b) => {
    if (sortBy === "PriceAsc") return Number(a.price) - Number(b.price);
    if (sortBy === "PriceDesc") return Number(b.price) - Number(a.price);
    if (sortBy === "Newest") return b.id - a.id;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F3] w-full flex flex-col font-sans">
      {/* Top Header with Google Maps pin icon toggle */}
      <DesktopHeader
        initialPurpose={filters.purpose}
        initialLocation={filters.location}
        initialState={filters.state}
        initialDistrict={filters.district}
        initialType={filters.propertyType}
        availableTypes={availableTypes}
        onSearchChange={(newFilters) => setFilters(newFilters)}
        onToggleMap={() => setShowMap((prev) => !prev)}
        isMapOpen={showMap}
      />

      {/* TOGGLEABLE INTERACTIVE MAP VIEW WITH "FADE IN DOWN" ANIMATION */}
      {showMap && (
        <div className="w-full max-w-7xl mx-auto px-6 pt-6 animate-fade-in-down">
          <div className="bg-white rounded-3xl p-3 border border-gray-200 shadow-xl overflow-visible relative z-20">
            {/* Top Bar for Map matching user mockup (Image 2) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-b border-gray-100 mb-2 relative z-30">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center p-1.5 rounded-full bg-blue-50 border border-blue-200">
                  <img src="/google_maps_icon.png" alt="Google Maps" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    Interactive Map Explorer
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                      {mapFilteredProperties.length} Pins Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Click any price pin box on the map to inspect property details
                  </p>
                </div>
              </div>

              {/* AUTO SEARCH LOCATION INPUT BAR IN MAP BOX (Matching Image 2) */}
              <div className="relative min-w-[260px] max-w-sm flex-1 mx-2 z-40">
                <div className="flex items-center bg-gray-50 border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-full px-3.5 py-1.5 text-xs shadow-xs transition-all">
                  <MapPin className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search location or keyword (e.g. Wayanad)..."
                    value={mapSearchQuery}
                    onChange={(e) => {
                      setMapSearchQuery(e.target.value);
                      setSelectedMapLocation(null);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    className="w-full bg-transparent outline-none text-gray-900 font-medium placeholder-gray-400"
                  />
                  {mapSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setMapSearchQuery("");
                        setSelectedMapLocation(null);
                        setShowLocationDropdown(false);
                      }}
                      className="text-gray-400 hover:text-gray-700 ml-1 p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Auto-complete suggestions dropdown - High Z-Index & Overflow Fix */}
                {showLocationDropdown && filteredLocationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[99999] overflow-hidden py-1 max-h-60 overflow-y-auto">
                    {filteredLocationSuggestions.map((loc, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setMapSearchQuery(loc);
                          setSelectedMapLocation(loc);
                          setShowLocationDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-blue-50 text-xs font-semibold text-gray-800 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>{loc}</span>
                        </div>
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Show on Map</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition active:scale-95 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Hide Map</span>
              </button>
            </div>

            {/* Map Container - Explicitly scoped z-0 */}
            <div className="h-[420px] w-full rounded-2xl overflow-hidden relative z-0 bg-gray-100 border border-gray-200/80">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Selected Property Banner Overlay on Map */}
              {selectedProperty && (
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 z-20">
                  <img
                    src={selectedProperty.images && selectedProperty.images.length > 0 ? (selectedProperty.images[0].startsWith("/uploads/") ? mediaUrl(selectedProperty.images[0]) : selectedProperty.images[0]) : FALLBACK_IMAGE}
                    alt={selectedProperty.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-1">
                      {selectedProperty.purpose}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 truncate">{selectedProperty.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{selectedProperty.address || selectedProperty.district}</p>
                    <div className="font-extrabold text-sm text-gray-900 mt-1">{formatPrice(selectedProperty.price)}</div>
                  </div>
                  <button
                    onClick={() => handlePropertyClick(selectedProperty.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shrink-0 shadow-xs transition cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Listing Grid Body */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col gap-6">
        {/* Listing Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
              Property Listings
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Showing {sortedProperties.length} available properties {filters.district !== "All Kerala" ? `in ${filters.district}` : "across Kerala"}
            </p>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition cursor-pointer ${viewMode === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition cursor-pointer ${viewMode === "list" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-gray-700 cursor-pointer shadow-xs focus:outline-none"
              >
                <option value="Default">Sort by (Default)</option>
                <option value="PriceAsc">Price: Low to High</option>
                <option value="PriceDesc">Price: High to Low</option>
                <option value="Newest">Newest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        ) : sortedProperties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs">
            <p className="text-gray-500 font-medium">No properties found matching your search criteria.</p>
          </div>
        ) : (
          <div className={
            viewMode === "grid" 
              ? showMap
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }>
            {sortedProperties.map((prop) => {
              const firstImg = prop.images && prop.images.length > 0 ? prop.images[0] : null;
              const img = firstImg ? (firstImg.startsWith("/uploads/") ? mediaUrl(firstImg) : firstImg) : FALLBACK_IMAGE;
              const priceText = formatPrice(prop.price);
              const isSelected = selectedProperty?.id === prop.id;

              return (
                <div
                  key={prop.id}
                  id={`property-card-${prop.id}`}
                  onClick={() => handlePropertyClick(prop.id)}
                  onMouseEnter={() => setSelectedProperty(prop)}
                  className={`group bg-white rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col ${
                    isSelected
                      ? "border-2 border-[#1B5E4F] ring-4 ring-[#1B5E4F]/25 shadow-2xl scale-[1.01] z-10"
                      : "border border-gray-200/80 shadow-xs hover:shadow-xl"
                  }`}
                >
                  {/* Media Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={img}
                      alt={prop.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {prop.isFeatured && (
                        <span className="px-3 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-sm">
                          Featured
                        </span>
                      )}
                      <span className="px-3 py-1 bg-gray-900/80 text-white font-semibold text-[10px] rounded-full uppercase tracking-wider backdrop-blur-xs">
                        {prop.purpose || "For Sale"}
                      </span>
                    </div>

                    {/* Map pin icon overlay bottom left */}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white p-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {prop.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {prop.address || prop.district}
                      </p>
                    </div>

                    {/* Specs */}
                    <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-100 font-medium">
                      {prop.bedrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <BedDouble className="w-4 h-4 text-gray-400" />
                          <span>Beds: {prop.bedrooms}</span>
                        </div>
                      )}
                      {prop.bathrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4 text-gray-400" />
                          <span>Baths: {prop.bathrooms}</span>
                        </div>
                      )}
                      {prop.areaSqft && (
                        <div className="flex items-center gap-1">
                          <Maximize className="w-4 h-4 text-gray-400" />
                          <span>Sqft: {prop.areaSqft}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Row: Owner info & Price */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(prop.ownerName || "owner")}`}
                          alt="Owner"
                          className="w-7 h-7 rounded-full object-cover bg-gray-200"
                        />
                        <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">
                          {prop.ownerName || "Agent"}
                        </span>
                      </div>

                      <div className="text-base font-extrabold text-gray-900 font-heading">
                        {priceText}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Footer — same as homepage */}
      <DesktopFooter />
    </div>
  );
}
