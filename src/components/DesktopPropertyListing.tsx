import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, List, ChevronDown, MapPin, BedDouble, Bath, Maximize } from "lucide-react";
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

interface DesktopPropertyListingProps {
  initialProperties?: ApiProperty[];
}

export default function DesktopPropertyListing({ initialProperties }: DesktopPropertyListingProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [properties, setProperties] = useState<ApiProperty[]>(initialProperties || []);
  const [loading, setLoading] = useState(!initialProperties);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("Default");
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);

  // Search Filters — Default purpose is empty to show ALL properties initially
  const [filters, setFilters] = useState({
    purpose: "",
    location: "",
    district: "All Kerala",
    propertyType: "All Types"
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const queryParams: Record<string, string> = {};
    if (filters.purpose) queryParams.purpose = filters.purpose;
    if (filters.location) queryParams.search = filters.location;
    if (filters.district && filters.district !== "All Kerala") queryParams.district = filters.district;
    if (filters.propertyType && filters.propertyType !== "All Types") queryParams.propertyType = filters.propertyType;

    api.fetchProperties(queryParams)
      .then((data) => setProperties(data || []))
      .catch((err) => console.error("Error fetching properties for desktop listing:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  // Extract unique available property types from dataset
  const availableTypes = Array.from(new Set(properties.map((p) => p.propertyType))).filter(Boolean);

  // Load Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const initMap = () => {
      if (window.google && window.google.maps && mapContainerRef.current) {
        if (!mapRef.current) {
          const map = new window.google.maps.Map(mapContainerRef.current, {
            center: KERALA_COORDS,
            zoom: 8,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          mapRef.current = map;
        }

        // Clear markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Add markers
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidCoords = false;

        properties.forEach((prop) => {
          const lat = prop.latitude ? parseFloat(String(prop.latitude)) : 10.850516 + (Math.random() - 0.5) * 2;
          const lng = prop.longitude ? parseFloat(String(prop.longitude)) : 76.271080 + (Math.random() - 0.5) * 2;
          const pos = { lat, lng };
          bounds.extend(pos);
          hasValidCoords = true;

          const marker = new window.google.maps.Marker({
            position: pos,
            map: mapRef.current,
            title: prop.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#2563EB",
              fillOpacity: 0.9,
              strokeColor: "#FFFFFF",
              strokeWeight: 3,
            },
          });

          marker.addListener("click", () => {
            setSelectedProperty(prop);
          });

          markersRef.current.push(marker);
        });

        if (hasValidCoords && properties.length > 0) {
          mapRef.current.fitBounds(bounds);
        }
      } else {
        timer = setTimeout(initMap, 400);
      }
    };

    initMap();
    return () => clearTimeout(timer);
  }, [properties]);

  const handlePropertyClick = (propId: number) => {
    if (!token) {
      navigate(`/login?redirect=/property/${propId}`);
    } else {
      navigate(`/property/${propId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] w-full flex flex-col font-sans">
      {/* Top Header */}
      <DesktopHeader
        initialPurpose={filters.purpose}
        initialLocation={filters.location}
        initialDistrict={filters.district}
        initialType={filters.propertyType}
        availableTypes={availableTypes}
        onSearchChange={(newFilters) => setFilters(newFilters)}
      />

      {/* Main Listing Body (Split View matching Image 1) */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Property Listing (7 Columns wide on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Listing Control Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight font-display">
                Property Listing
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Showing all {properties.length} available properties across Kerala
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500 hover:text-gray-800"}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs">
              <p className="text-gray-500 font-medium">No properties found matching your search criteria.</p>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
              {properties.map((prop) => {
                const firstImg = prop.images && prop.images.length > 0 ? prop.images[0] : null;
                const img = firstImg ? (firstImg.startsWith("/uploads/") ? mediaUrl(firstImg) : firstImg) : FALLBACK_IMAGE;
                const priceText = formatPrice(prop.price);

                return (
                  <div
                    key={prop.id}
                    onClick={() => handlePropertyClick(prop.id)}
                    className="group bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
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

        {/* Right Column: Embedded Interactive Map (5 Columns wide on desktop) matching Image 1 */}
        <div className="lg:col-span-5 relative h-[calc(100vh-220px)] sticky top-20 rounded-3xl overflow-hidden border border-gray-200/80 shadow-md">
          <div ref={mapContainerRef} className="w-full h-full bg-gray-100 min-h-[500px]"></div>

          {/* Selected Property Overlay Card on Map */}
          {selectedProperty && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shrink-0 shadow-xs transition"
              >
                View
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Footer matching user mockup media_1788721045135.png */}
      <DesktopFooter />
    </div>
  );
}
