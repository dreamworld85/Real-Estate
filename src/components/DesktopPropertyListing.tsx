import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, List, ChevronDown, MapPin, X } from "lucide-react";
import { ApiProperty, mediaUrl, api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import DesktopHeader from "./DesktopHeader";
import DesktopFooter from "./DesktopFooter";
import PropertyCard from "./PropertyCard";
import { STATE_COORDINATES } from "@/lib/indiaLocationData";

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
  const [visibleMapProperties, setVisibleMapProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(!initialProperties);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("Default");
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);
  const [showMap, setShowMap] = useState<boolean>(initialShowMap);

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
    if (filters.district && !filters.district.startsWith("All ")) queryParams.district = filters.district;
    if (filters.propertyType && filters.propertyType !== "All Types") queryParams.propertyType = filters.propertyType;

    api.fetchProperties(queryParams)
      .then((data) => setProperties(data || []))
      .catch((err) => console.error("Error fetching properties for desktop listing:", err))
      .finally(() => setLoading(false));
  }, [filters]);

  // Extract unique available property types
  const availableTypes = Array.from(new Set(properties.map((p) => p.propertyType))).filter(Boolean);

  // Filter properties based on Leaflet map bounds
  const updateVisibleMapProperties = () => {
    if (!mapRef.current || !window.L) return;

    try {
      const bounds = mapRef.current.getBounds();
      const mapList = allProperties.length > 0 ? allProperties : (properties.length > 0 ? properties : []);

      const visible = mapList.filter((prop, idx) => {
        const distCoords = DISTRICT_COORDINATES[prop.district] || (prop.state ? STATE_COORDINATES[prop.state] : null);
        const rawLat = prop.latitude ? parseFloat(String(prop.latitude)) : null;
        const rawLng = prop.longitude ? parseFloat(String(prop.longitude)) : null;

        const lat = (rawLat && !isNaN(rawLat) && rawLat !== 0) 
          ? rawLat 
          : (distCoords ? distCoords.lat + ((idx % 5) * 0.05) - 0.1 : 10.850516 + ((idx % 5) * 0.15) - 0.3);
        const lng = (rawLng && !isNaN(rawLng) && rawLng !== 0) 
          ? rawLng 
          : (distCoords ? distCoords.lng + ((idx % 4) * 0.05) - 0.1 : 76.271080 + ((idx % 4) * 0.2) - 0.2);

        return bounds.contains(window.L.latLng(lat, lng));
      });

      setVisibleMapProperties(visible);
    } catch (err) {
      console.error("Error updating visible map properties:", err);
    }
  };

  // Handle filter state changes (Fly map to state location without page reload)
  const handleSearchChange = (newFilters: typeof filters) => {
    setFilters(newFilters);

    if (newFilters.state && newFilters.state !== "All States (India)" && mapRef.current && window.L) {
      const stCoords = STATE_COORDINATES[newFilters.state];
      if (stCoords) {
        mapRef.current.flyTo([stCoords.lat, stCoords.lng], 7, { duration: 1.2 });
      }
    }
  };

  // Initialize OpenStreetMap (Leaflet) when map is visible & destroy cleanly when toggled off
  useEffect(() => {
    if (!showMap) {
      if (mapRef.current) {
        try {
          markersRef.current.forEach((m) => {
            if (m && typeof m.remove === "function") m.remove();
          });
          markersRef.current = [];
          mapRef.current.remove();
        } catch (e) {
          console.error("Error removing Leaflet map:", e);
        }
        mapRef.current = null;
      }
      setSelectedProperty(null);
      return;
    }

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
          const initialLat = (filters.state && STATE_COORDINATES[filters.state]) 
            ? STATE_COORDINATES[filters.state].lat 
            : KERALA_COORDS.lat;
          const initialLng = (filters.state && STATE_COORDINATES[filters.state]) 
            ? STATE_COORDINATES[filters.state].lng 
            : KERALA_COORDS.lng;

          const map = window.L.map(mapContainerRef.current).setView([initialLat, initialLng], 7);
          window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
          }).addTo(map);

          mapRef.current = map;

          // Event listeners for dragging, scrolling, panning map
          map.on("moveend zoomend", () => {
            updateVisibleMapProperties();
          });
        }

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

        const mapList = allProperties.length > 0 ? allProperties : (properties.length > 0 ? properties : []);

        mapList.forEach((prop, idx) => {
          const rawLat = prop.latitude ? parseFloat(String(prop.latitude)) : null;
          const rawLng = prop.longitude ? parseFloat(String(prop.longitude)) : null;
          const distCoords = DISTRICT_COORDINATES[prop.district] || (prop.state ? STATE_COORDINATES[prop.state] : null);

          const lat = (rawLat && !isNaN(rawLat) && rawLat !== 0) 
            ? rawLat 
            : (distCoords ? distCoords.lat + ((idx % 5) * 0.05) - 0.1 : 10.850516 + ((idx % 5) * 0.15) - 0.3);
          const lng = (rawLng && !isNaN(rawLng) && rawLng !== 0) 
            ? rawLng 
            : (distCoords ? distCoords.lng + ((idx % 4) * 0.05) - 0.1 : 76.271080 + ((idx % 4) * 0.2) - 0.2);

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
          const bgStyle = isSelectedPin ? "#0F3D3E" : "#ffffff";
          const textColor = isSelectedPin ? "#ffffff" : "#000000";
          const borderStyle = isSelectedPin ? "2px solid #0F3D3E" : "1px solid #cbd5e1";
          const scaleStyle = isSelectedPin ? "transform: scale(1.15); z-index: 99999;" : "";

          const customIcon = window.L.divIcon({
            className: `custom-leaflet-pill ${isSelectedPin ? "active-pill" : ""}`,
            html: `<div style="background:${bgStyle}; color:${textColor}; padding:4px 10px; border-radius:16px; border:${borderStyle}; ${scaleStyle} box-shadow:0 3px 10px rgba(0,0,0,0.2); white-space:nowrap; cursor:pointer; text-align:center; line-height:1.2; transition:all 0.2s ease;">
              <div style="font-size:11.5px; font-weight:800;">${priceText}</div>
              <div style="font-size:9px; font-weight:700; color:${isSelectedPin ? '#e2e8f0' : '#059669'}; text-transform:capitalize; margin-top:1px;">${typeShort} • ${purposeShort}</div>
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

        updateVisibleMapProperties();
      } else {
        timer = setTimeout(initMap, 300);
      }
    };

    initMap();
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        try {
          markersRef.current.forEach((m) => {
            if (m && typeof m.remove === "function") m.remove();
          });
          markersRef.current = [];
          mapRef.current.remove();
        } catch (e) {
          console.error("Error destroying map on cleanup:", e);
        }
        mapRef.current = null;
      }
    };
  }, [allProperties, properties, selectedProperty, showMap]);

  // Smoothly scroll selected property card into view when selected from map
  useEffect(() => {
    if (selectedProperty) {
      const cardEl = document.getElementById(`property-card-${selectedProperty.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedProperty]);

  // Sort properties
  const displayProperties = properties;
  const sortedProperties = [...displayProperties].sort((a, b) => {
    if (sortBy === "PriceAsc") return Number(a.price) - Number(b.price);
    if (sortBy === "PriceDesc") return Number(b.price) - Number(a.price);
    if (sortBy === "Newest") return b.id - a.id;
    return 0;
  });

  const sortedVisibleMapProperties = [...visibleMapProperties].sort((a, b) => {
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
        onSearchChange={handleSearchChange}
        onToggleMap={() => setShowMap((prev) => !prev)}
        isMapOpen={showMap}
      />

      {/* DUAL SPLIT-SCREEN VIEW WHEN MAP IS ON (Matching Image 1) */}
      {showMap ? (
        <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Properties Grid Listing (Col 6 of 12) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Header Bar showing Available Properties count */}
              <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">
                    {sortedVisibleMapProperties.length} Properties Available in This Area
                  </h1>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Updated automatically as you pan or zoom the map
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-gray-700 cursor-pointer shadow-xs focus:outline-none"
                    >
                      <option value="Default">Sort by (Default)</option>
                      <option value="PriceAsc">Price: Low to High</option>
                      <option value="PriceDesc">Price: High to Low</option>
                      <option value="Newest">Newest First</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-56 bg-gray-200 rounded-2xl"></div>
                  ))}
                </div>
              ) : sortedVisibleMapProperties.length === 0 ? (
                /* ERROR MESSAGE WITH FADE-IN EFFECT WHEN NO PROPERTIES ARE IN VISIBLE MAP REGION */
                <div className="bg-white rounded-3xl p-10 text-center border border-gray-200/80 shadow-xs flex flex-col items-center justify-center gap-3 my-4 animate-fade-in">
                  <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shadow-xs">
                    <MapPin size={26} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    No properties listed in this location
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Try zooming out or moving the map to another region like Kerala or Karnataka to see available listings.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedVisibleMapProperties.map((prop) => (
                    <div
                      key={prop.id}
                      id={`property-card-${prop.id}`}
                      onMouseEnter={() => setSelectedProperty(prop)}
                      className="rounded-2xl transition-all duration-200 cursor-pointer"
                    >
                      <PropertyCard
                        property={prop}
                        onToggleSave={(id, isSaved) => {
                          setProperties((prev) =>
                            prev.map((p) => (p.id === id ? { ...p, isSaved } : p))
                          );
                          setAllProperties((prev) =>
                            prev.map((p) => (p.id === id ? { ...p, isSaved } : p))
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Map Container (Col 6 of 12) */}
            <div className="lg:col-span-6 sticky top-24 h-[calc(100vh-120px)] rounded-3xl overflow-hidden border border-gray-200 shadow-lg relative">
              <div ref={mapContainerRef} id="leaflet-map-desktop" className="w-full h-full z-10" />

              {/* OVERLAY CARD FOR SELECTED PROPERTY ON MAP CLICK (TOP-RIGHT MATCHING USER IMAGE) */}
              {selectedProperty && (
                <div
                  onClick={() => window.open(`/property/${selectedProperty.id}`, "_blank")}
                  className="absolute top-4 right-4 w-[380px] max-w-[calc(100%-32px)] bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border-2 border-sky-200/90 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300 z-20 cursor-pointer hover:shadow-2xl transition-all group select-none"
                >
                  <img
                    src={
                      selectedProperty.images && selectedProperty.images.length > 0
                        ? mediaUrl(selectedProperty.images[0])
                        : FALLBACK_IMAGE
                    }
                    alt={selectedProperty.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-xs border border-gray-100"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-20 py-0.5">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200/60 truncate max-w-[200px]">
                        {selectedProperty.propertyType}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200/60 shrink-0">
                        {(selectedProperty.purpose || "For Sale").replace("For ", "")}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-gray-500 truncate my-1">
                      {selectedProperty.address || selectedProperty.district}
                    </p>

                    <div className="flex items-baseline justify-between gap-2 mt-auto">
                      <span className="font-extrabold text-base text-gray-900 tracking-tight">
                        {formatPrice(selectedProperty.price)}
                      </span>
                      <span className="text-xs font-bold text-gray-800 truncate text-right">
                        {selectedProperty.ownerName || "Agent"} ({selectedProperty.listingRole || "Broker"})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* FULL WIDTH GRID VIEW WHEN MAP IS OFF */
        <div className="w-full max-w-[1750px] mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200/80">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-display">
                Properties in {filters.district !== "All Kerala" ? filters.district : filters.state}
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Showing {sortedProperties.length} results
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Grid / List View Mode buttons */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-emerald-600 shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-emerald-600 shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
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
            <div className="property-responsive-grid animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
                <div key={i} className="h-60 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          ) : sortedProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-xs">
              <p className="text-gray-500 font-medium">No properties found matching your search criteria.</p>
            </div>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "property-responsive-grid"
                : "flex flex-col gap-4"
            }>
              {sortedProperties.map((prop) => (
                <div
                  key={prop.id}
                  id={`property-card-${prop.id}`}
                  onMouseEnter={() => setSelectedProperty(prop)}
                  className="rounded-2xl transition-all duration-200"
                >
                  <PropertyCard
                    property={prop}
                    onToggleSave={(id, isSaved) => {
                      setProperties((prev) =>
                        prev.map((p) => (p.id === id ? { ...p, isSaved } : p))
                      );
                      setAllProperties((prev) =>
                        prev.map((p) => (p.id === id ? { ...p, isSaved } : p))
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Desktop Footer — same as homepage */}
      <DesktopFooter />
    </div>
  );
}
