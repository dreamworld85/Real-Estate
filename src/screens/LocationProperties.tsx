import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, BedDouble, Bath, Star, Heart, X } from "lucide-react";
import { api, ApiProperty, mediaUrl } from "@/lib/api";
import BottomNav from "@/components/BottomNav";
import PropertyCard from "@/components/PropertyCard";

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

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function LocationProperties() {
  const { locationName } = useParams<{ locationName: string }>();
  const navigate = useNavigate();
  const decodedLocation = locationName ? decodeURIComponent(locationName) : "";

  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Centered position coordinates
  const coords = DISTRICT_COORDINATES[decodedLocation] || { lat: 10.850516, lng: 76.271080 };

  useEffect(() => {
    // 1. Fetch properties in the selected location
    api.fetchProperties({ district: decodedLocation })
      .then((data) => {
        setProperties(data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch location properties:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [decodedLocation]);

  useEffect(() => {
    // 2. Load Google Maps Script
    if (window.google && window.google.maps) {
      setMapLoading(false);
      initializeMap();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoading(false);
      initializeMap();
    };
    script.onerror = () => {
      setMapLoading(false);
      console.error("Failed to load Google Maps");
    };
    document.head.appendChild(script);

    return () => {
      // Clear markers on unmount
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, [properties]);

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) return;

    const maps = window.google.maps;

    // Create Map
    const map = new maps.Map(mapContainerRef.current, {
      center: coords,
      zoom: 11,
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

    // Remove existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Place markers for each property that has coordinates
    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const markerCoords = { lat: Number(property.latitude), lng: Number(property.longitude) };

      const marker = new maps.Marker({
        position: markerCoords,
        map: map,
        title: property.title,
        icon: {
          path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: selectedProperty?.id === property.id ? "#FF5A5F" : "#59AD63",
          fillOpacity: 1,
          strokeWeight: 1.5,
          strokeColor: "#FFFFFF"
        }
      });

      marker.addListener("click", () => {
        handleMarkerClick(property);
      });

      markersRef.current.push({ id: property.id, marker });
    });
  };

  const handleMarkerClick = (property: ApiProperty) => {
    setSelectedProperty(property);
    if (mapRef.current && property.latitude && property.longitude) {
      mapRef.current.panTo({ lat: Number(property.latitude), lng: Number(property.longitude) });
    }

    // Highlight selected marker color
    markersRef.current.forEach(({ id, marker }) => {
      if (window.google && window.google.maps) {
        marker.setIcon({
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: id === property.id ? "#FF5A5F" : "#59AD63",
          fillOpacity: 1,
          strokeWeight: 1.5,
          strokeColor: "#FFFFFF"
        });
      }
    });
  };

  const handlePropertyCardClick = (property: ApiProperty) => {
    handleMarkerClick(property);
    // Smooth scroll map into view if clicked from list
    const mapElement = document.getElementById("properties-map");
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] font-display select-none overflow-x-hidden relative pb-28">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center px-6 pt-5 pb-3 bg-white border-b border-charcoal/5 shrink-0 sticky top-0 z-50 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-charcoal p-1.5 -ml-1.5 hover:bg-charcoal/5 rounded-full transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
        >
          <ChevronLeft size={22} className="text-[#091F40]" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-bold text-sm text-[#091F40]">Properties in {decodedLocation}</span>
          <span className="text-[9px] font-bold text-slate/50 tracking-wider uppercase leading-none mt-0.5">
            {properties.length} Listings Found
          </span>
        </div>

        <div className="w-8 h-8" />
      </div>

      {/* Map View Section */}
      <div id="properties-map" className="relative w-full h-[260px] bg-slate-50 border-b border-charcoal/5 shrink-0">
        {mapLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate bg-slate-100 z-10">
            <div className="w-8 h-8 border-4 border-[#59AD63] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading Map View...</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Property Preview Card */}
        {selectedProperty && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg border border-charcoal/5 p-3 flex gap-3 animate-slide-up z-20">
            {/* Cover Image */}
            <div 
              onClick={() => navigate(`/property/${selectedProperty.id}`)}
              className="w-20 h-20 rounded-lg bg-slate-50 overflow-hidden shrink-0 cursor-pointer"
            >
              <img 
                src={selectedProperty.images[0] ? mediaUrl(selectedProperty.images[0]) : FALLBACK_IMAGE} 
                alt={selectedProperty.title} 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info Column */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div onClick={() => navigate(`/property/${selectedProperty.id}`)} className="cursor-pointer">
                <div className="flex justify-between items-start gap-1">
                  <h4 className="text-[12px] font-bold text-charcoal truncate">{selectedProperty.title}</h4>
                  <span className="text-[11px] font-bold text-[#59AD63] shrink-0">{formatPrice(selectedProperty.price)}</span>
                </div>
                <p className="text-[10px] text-slate/60 truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="shrink-0" />
                  {selectedProperty.address}
                </p>
              </div>

              {/* Attributes row */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2.5 text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-0.5">
                    <BedDouble size={12} className="text-slate-400" /> {selectedProperty.bedrooms || 0} Bed
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Bath size={12} className="text-slate-400" /> {selectedProperty.bathrooms || 0} Bath
                  </span>
                  <span>{selectedProperty.areaSqft} sq.ft.</span>
                </div>

                <button 
                  onClick={() => navigate(`/property/${selectedProperty.id}`)}
                  className="text-[10px] font-bold text-white bg-[#59AD63] px-2.5 py-1 rounded-[4px] hover:bg-[#3F8F4B] transition-colors"
                >
                  View
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute -top-2.5 -right-2.5 bg-white border border-charcoal/10 text-charcoal hover:bg-slate-100 rounded-full p-1.5 shadow-md active:scale-90 transition-transform cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="px-6 pt-5 flex-1 flex flex-col gap-4">
        <h2 className="font-display font-semibold text-[16px] text-[#091F40]">Available Listings</h2>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#59AD63]" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-charcoal/5 rounded-2xl flex flex-col items-center justify-center gap-3">
            <MapPin size={32} className="text-slate-300" />
            <span className="text-xs font-bold text-charcoal/60">No properties listed in this area yet</span>
            <button
              onClick={() => navigate("/add-property")}
              className="mt-1 text-xs font-bold text-white bg-[#59AD63] hover:bg-[#3F8F4B] px-4 py-2 rounded-full shadow-sm"
            >
              Post a Property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {properties.map((property) => (
              <div key={property.id} className="relative group">
                <PropertyCard property={property} compact />
                {/* Visual click overlay/pan connector */}
                <button
                  type="button"
                  onClick={() => handlePropertyCardClick(property)}
                  className="absolute bottom-3 left-3 bg-[#59AD63] text-white rounded-full p-1.5 shadow-md z-20 hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
                  title="Show on map"
                >
                  <MapPin size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
