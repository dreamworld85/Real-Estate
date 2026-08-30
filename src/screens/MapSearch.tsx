import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, X, Search as SearchIcon, ChevronDown, SlidersHorizontal } from "lucide-react";
import { api, ApiProperty, mediaUrl } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import PropertyCard from "@/components/PropertyCard";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Wayanad: { lat: 11.6854, lng: 76.1320 },
  Kozhikode: { lat: 11.2588, lng: 75.7804 },
  Kannur: { lat: 11.8745, lng: 75.3704 },
  Kasaragod: { lat: 12.5102, lng: 74.9852 },
  Malappuram: { lat: 11.0735, lng: 76.0740 },
  Palakkad: { lat: 10.7867, lng: 76.6547 },
  Thrissur: { lat: 10.5276, lng: 76.2144 },
  Ernakulam: { lat: 9.9816, lng: 76.2999 },
  Idukki: { lat: 9.9189, lng: 77.1025 },
  Kottayam: { lat: 9.5916, lng: 76.5221 },
  Alappuzha: { lat: 9.4981, lng: 76.3388 },
  Pathanamthitta: { lat: 9.2648, lng: 76.7870 },
  Kollam: { lat: 8.8932, lng: 76.6141 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 }
};

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function MapSearch() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);
  
  // Search query & location dropdown states
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Centered position on Kerala
  const keralaCoords = { lat: 10.850516, lng: 76.271080 };

  useEffect(() => {
    // 1. Fetch all properties
    api.fetchProperties({})
      .then((data) => {
        setProperties(data || []);
        
        // Extract distinct districts/cities
        if (data) {
          const unique = Array.from(new Set(data.map(p => p.district)))
            .filter(Boolean)
            .sort();
          setAvailableDistricts(unique);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch properties for map search:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    // 2. Load Google Maps Script in parallel on mount
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (!existingScript && !window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // 3. Map Initialization Hook (Runs when properties are loaded and script/DOM ref is ready)
  useEffect(() => {
    if (loading) return;

    let mapInitTimeout: NodeJS.Timeout;
    let retries = 0;

    const checkAndInit = () => {
      if (window.google && window.google.maps && mapContainerRef.current) {
        setMapLoading(false);
        if (!mapRef.current) {
          const maps = window.google.maps;
          const map = new maps.Map(mapContainerRef.current, {
            center: keralaCoords,
            zoom: 8,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });
          mapRef.current = map;
        }
      } else {
        retries++;
        if (retries < 100) { // Limit retry duration to 5 seconds max (50ms * 100)
          mapInitTimeout = setTimeout(checkAndInit, 50);
        } else {
          setMapLoading(false);
          console.error("Google Maps failed to load within 5 seconds.");
        }
      }
    };

    checkAndInit();

    return () => {
      clearTimeout(mapInitTimeout);
    };
  }, [loading]);

  // Compute filtered properties
  const filteredProperties = properties.filter((p) => {
    // Filter by district/location select dropdown
    if (district && p.district !== district) return false;

    // Filter by text search query
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAddress = p.address.toLowerCase().includes(q);
      const matchDistrict = p.district.toLowerCase().includes(q);
      const matchType = p.propertyType.toLowerCase().includes(q);
      return matchTitle || matchAddress || matchDistrict || matchType;
    }

    return true;
  });

  // 4. Keep markers in sync with filtered properties
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const maps = window.google.maps;

    // Clear existing markers safely by destructuring and checking type
    markersRef.current.forEach(({ marker }) => {
      if (marker && typeof marker.setMap === "function") {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Place markers for filtered properties
    filteredProperties.forEach((property) => {
      let lat = parseFloat(property.latitude as string);
      let lng = parseFloat(property.longitude as string);

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        const dist = property.district;
        const fallback = DISTRICT_COORDINATES[dist] || DISTRICT_COORDINATES["Wayanad"];
        const seed = property.id || 1;
        const offsetLat = (Math.sin(seed) * 0.5) * 0.04;
        const offsetLng = (Math.cos(seed) * 0.5) * 0.04;
        lat = fallback.lat + offsetLat;
        lng = fallback.lng + offsetLng;
      }

      const marker = new maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: property.title,
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: selectedProperty?.id === property.id ? "#FF5A5F" : "#60A963",
          fillOpacity: 1,
          strokeWeight: 1.5,
          strokeColor: "#FFFFFF"
        }
      });

      marker.addListener("click", () => {
        handleMarkerClick(property, lat, lng);
      });

      markersRef.current.push({ id: property.id, marker });
    });
  }, [filteredProperties, selectedProperty]);

  const handleMarkerClick = (property: ApiProperty, lat: number, lng: number) => {
    setSelectedProperty(property);
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(13);
    }
  };

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/search", { replace: true });
    }
  };

  const handlePropertyCardClick = (property: ApiProperty) => {
    let lat = parseFloat(property.latitude as string);
    let lng = parseFloat(property.longitude as string);

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      const dist = property.district;
      const fallback = DISTRICT_COORDINATES[dist] || DISTRICT_COORDINATES["Wayanad"];
      const seed = property.id || 1;
      const offsetLat = (Math.sin(seed) * 0.5) * 0.04;
      const offsetLng = (Math.cos(seed) * 0.5) * 0.04;
      lat = fallback.lat + offsetLat;
      lng = fallback.lng + offsetLng;
    }

    handleMarkerClick(property, lat, lng);

    const mapElement = mapContainerRef.current;
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] font-display select-none overflow-x-hidden relative pb-28">
      {/* Header */}
      <header className="px-4 py-4.5 bg-white border-b border-charcoal/5 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3.5">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl border border-charcoal/10 flex items-center justify-center text-charcoal hover:bg-slate-50 transition-colors shadow-sm cursor-pointer active:scale-95 shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-extrabold text-[15px] text-ink uppercase tracking-wider">Map Search</h1>
            <p className="text-[10px] font-bold text-slate mt-0.5 leading-none">Find properties on map</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold bg-[#60A963]/10 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {filteredProperties.length} Pins
          </span>
        </div>
      </header>

      {/* Search Filter Controls */}
      <div className="bg-white p-3 border-b border-charcoal/5 flex flex-col gap-2 shadow-xs shrink-0">
        <div className="flex gap-2">
          {/* Text Input Search Bar */}
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-charcoal/10 focus-within:border-black transition-all">
            <SearchIcon size={14} className="text-slate shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Wayanad, house, type..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate/40 text-charcoal font-medium"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate/50 hover:text-ink">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Location Select Dropdown */}
          <div className="w-[140px] relative">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full appearance-none rounded-xl border border-charcoal/12 bg-white pl-2.5 pr-6 py-2 text-[11px] font-semibold text-charcoal outline-none focus:border-black cursor-pointer shadow-xs"
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

      {/* Main Map Container (Set to a stable size to allow lists below) */}
      <div className="w-full h-[360px] relative shrink-0">
        {mapLoading && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-xs text-slate font-semibold mt-2.5">Loading Google Maps...</p>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Selected Property Preview Popup Card */}
        {selectedProperty && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-3xl border border-charcoal/5 shadow-2xl p-3.5 z-20 flex gap-3.5 animate-slide-up max-w-sm mx-auto">
            <div 
              className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer relative"
              onClick={() => navigate(`/property/${selectedProperty.id}`)}
            >
              <img
                src={selectedProperty.images && selectedProperty.images.length > 0 ? mediaUrl(selectedProperty.images[0]) : FALLBACK_IMAGE}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-[7.5px] font-extrabold bg-[#60A963] text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                {selectedProperty.propertyType}
              </span>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 
                    className="text-xs font-bold text-ink truncate cursor-pointer hover:underline"
                    onClick={() => navigate(`/property/${selectedProperty.id}`)}
                  >
                    {selectedProperty.title}
                  </h3>
                  <button 
                    onClick={() => setSelectedProperty(null)}
                    className="p-1 rounded-lg text-slate/50 hover:bg-slate-100 cursor-pointer hover:text-ink transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <p className="text-[10px] text-slate font-semibold flex items-center gap-1 mt-1 truncate">
                  <MapPin size={10} className="text-slate/60 shrink-0" />
                  {selectedProperty.address}, {selectedProperty.district}
                </p>
              </div>

              <div className="flex items-baseline justify-between mt-2.5">
                <span className="text-[13px] font-extrabold text-forest">
                  {formatPrice(selectedProperty.price)}
                </span>
                <button
                  onClick={() => navigate(`/property/${selectedProperty.id}`)}
                  className="px-2.5 py-1.5 bg-ink hover:bg-black text-cream text-[9px] font-extrabold rounded-lg transition-all active:scale-[0.97] cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Properties List Below Map */}
      <div className="flex-1 px-4 mt-4 mb-8">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-semibold text-xs text-ink uppercase tracking-wider">Properties in this area</h2>
          <span className="text-[10px] font-bold text-slate uppercase bg-slate-100 px-2 py-0.5 rounded-md">
            {filteredProperties.length} Matches
          </span>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-charcoal/10 px-4">
            <SlidersHorizontal className="mx-auto text-slate/40 mb-2" size={24} />
            <p className="text-xs font-semibold text-charcoal">No properties matched this search</p>
            <p className="text-[10px] text-slate mt-0.5">Try changing the keywords or location select filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProperties.map((p) => {
              const isSelected = selectedProperty?.id === p.id;
              return (
                <div 
                  key={p.id}
                  onClick={() => handlePropertyCardClick(p)}
                  className={`transition-all duration-300 rounded-3xl cursor-pointer ${
                    isSelected ? "ring-2 ring-emerald-500 scale-[0.98] shadow-md" : ""
                  }`}
                >
                  <PropertyCard property={p} compact />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
