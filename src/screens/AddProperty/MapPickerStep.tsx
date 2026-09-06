import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crosshair, MapPin } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import BottomNav from "@/components/BottomNav";

declare global {
  interface Window {
    google: any;
    initAutocomplete?: () => void;
  }
}

export default function MapPickerStep() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [fetchedAddress, setFetchedAddress] = useState(form.mapAddress || "");
  const [manualAddress, setManualAddress] = useState(form.mapAddress || "");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setManualAddress(fetchedAddress);
  }, [fetchedAddress]);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const defaultLat = form.latitude || 10.850516;
  const defaultLng = form.longitude || 76.271080;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.L && mapContainerRef.current) {
        setLoading(false);
        initializeMap();
      } else {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const initializeMap = () => {
    if (!mapContainerRef.current || !window.L) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: [number, number] = [defaultLat, defaultLng];
    const map = window.L.map(mapContainerRef.current).setView(center, 12);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    mapRef.current = map;

    const customIcon = window.L.divIcon({
      className: "custom-leaflet-picker-pin",
      html: `<div style="background:#1B5E4F; color:#ffffff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; border:3px solid #ffffff; box-shadow:0 4px 6px -1px rgba(0,0,0,0.3); cursor:grab;">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = window.L.marker(center, { icon: customIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    map.addListener("click", (e: any) => {
      const clickedPos = e.latLng;
      marker.setPosition(clickedPos);
      map.panTo(clickedPos);
      const coords = { lat: clickedPos.lat(), lng: clickedPos.lng() };
      updateCoordinates(coords);
      reverseGeocode(coords);
    });

    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      const coords = { lat: position.lat(), lng: position.lng() };
      updateCoordinates(coords);
      reverseGeocode(coords);
    });
  };

  const geocodeNominatim = (address: string) => {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(address)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const displayName = data[0].display_name;
          const addressParts = data[0].address || {};
          const county = addressParts.county || addressParts.state_district || addressParts.district || "";

          if (window.google && window.google.maps) {
            const maps = window.google.maps;
            const googleCoords = new maps.LatLng(lat, lng);
            if (mapRef.current) {
              mapRef.current.setCenter(googleCoords);
              mapRef.current.setZoom(16);
            }
            if (markerRef.current) {
              markerRef.current.setPosition(googleCoords);
            }
          }

          update({
            latitude: lat,
            longitude: lng,
            mapAddress: displayName,
            ...(county ? { district: county.replace(" District", "") } : {})
          });
          setFetchedAddress(displayName);
        }
      })
      .catch(err => console.error("Nominatim geocoding error:", err));
  };

  const geocodeAddress = (address: string) => {
    if (!window.google || !window.google.maps) {
      geocodeNominatim(address);
      return;
    }
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    geocoderRef.current.geocode({ address: address }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };

        if (mapRef.current) {
          mapRef.current.setCenter(location);
          mapRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition(location);
        }

        let googleDistrict = "";
        const components = results[0].address_components || [];
        for (const component of components) {
          if (component.types.includes("administrative_area_level_2")) {
            googleDistrict = component.long_name;
            break;
          }
        }

        update({
          latitude: coords.lat,
          longitude: coords.lng,
          mapAddress: results[0].formatted_address,
          ...(googleDistrict ? { district: googleDistrict } : {})
        });
        setFetchedAddress(results[0].formatted_address);
      } else {
        console.warn("Google Geocoder failed. Falling back to Nominatim: " + status);
        geocodeNominatim(address);
      }
    });
  };



  const reverseGeocodeNominatim = (coords: { lat: number; lng: number }) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          const displayName = data.display_name;
          const addressParts = data.address || {};
          const county = addressParts.county || addressParts.state_district || addressParts.district || "";
          update({
            mapAddress: displayName,
            ...(county ? { district: county.replace(" District", "") } : {})
          });
          setFetchedAddress(displayName);
        }
      })
      .catch(err => console.error("Nominatim reverse geocoding error:", err));
  };

  const reverseGeocode = (coords: { lat: number; lng: number }) => {
    if (!window.google || !window.google.maps) {
      reverseGeocodeNominatim(coords);
      return;
    }
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    geocoderRef.current.geocode({ location: coords }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const formattedAddress = results[0].formatted_address;
        let googleDistrict = "";
        const components = results[0].address_components || [];
        for (const component of components) {
          if (component.types.includes("administrative_area_level_2")) {
            googleDistrict = component.long_name;
            break;
          }
        }
        update({
          mapAddress: formattedAddress,
          ...(googleDistrict ? { district: googleDistrict } : {})
        });
        setFetchedAddress(formattedAddress);
      } else {
        console.warn("Google reverse geocoding failed. Falling back to Nominatim: " + status);
        reverseGeocodeNominatim(coords);
      }
    });
  };

  const updateCoordinates = (coords: { lat: number; lng: number }) => {
    update({
      latitude: coords.lat,
      longitude: coords.lng
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };

        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(coords);
          mapRef.current.setZoom(16);
          markerRef.current.setPosition(coords);
        }

        updateCoordinates(coords);
        reverseGeocode(coords);
      },
      (error) => {
        alert("Geolocation error: " + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleNext = () => {
    update({
      mapAddress: manualAddress
    });
    navigate("/add-property/review");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pb-24 text-left font-display select-none overflow-x-hidden relative">
      {/* Top Green Progress Bar Line (80% completed) */}
      <div className="w-full h-1 bg-slate-100 flex shrink-0">
        <div className="h-full bg-[#59AD63] w-[80%] transition-all duration-300" />
      </div>

      {/* Header Row */}
      <div className="flex justify-between items-center px-6 pt-5 pb-2 shrink-0">
        <button 
          type="button"
          onClick={() => navigate("/add-property/media")}
          className="text-charcoal p-1.5 -ml-1.5 hover:bg-charcoal/5 rounded-full transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={22} className="text-[#091F40]" />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-bold text-sm text-[#091F40]">Exact Location</span>
          <span className="text-[9px] font-bold text-slate/50 tracking-wider uppercase leading-none mt-0.5">
            Step 4 of 5
          </span>
        </div>

        <div className="w-8 h-8" />
      </div>

      <div className="px-6 flex flex-col gap-5 mt-3 flex-1">
        <div className="flex flex-col">
          <h1 className="font-display font-extrabold text-[18px] text-[#091F40] leading-none">
            Pin Property Location
          </h1>
          <p className="text-xs text-slate/60 mt-1.5 font-medium leading-relaxed">
            Drag the green marker or search for the address to set the exact property location on the map.
          </p>
        </div>

        {/* Search Location Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative border border-[#59AD63]/30 rounded-[8px] px-4 py-3 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] focus-within:ring-1 focus-within:ring-[#59AD63]/30 transition-all duration-150">
            <input
              type="text"
              placeholder="Search location, town, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  geocodeAddress(searchQuery);
                }
              }}
              className="flex-1 text-[13.5px] font-semibold text-charcoal placeholder:text-slate/30 outline-none bg-transparent"
            />
          </div>
          <button
            type="button"
            onClick={() => geocodeAddress(searchQuery)}
            className="px-5 rounded-[8px] font-bold text-xs text-white bg-[#59AD63] hover:bg-[#3F8F4B] transition-colors active:scale-95 cursor-pointer shadow-sm flex items-center justify-center shrink-0"
          >
            Search
          </button>
        </div>

        {/* Map Container */}
        <div className="relative flex-1 min-h-[300px] rounded-[8px] overflow-hidden border border-slate-200 shadow-sm bg-slate-50 flex flex-col items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-slate z-10">
              <div className="w-8 h-8 border-4 border-[#59AD63] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading Map...</span>
            </div>
          )}
          
          {apiError && (
            <div className="p-6 text-center flex flex-col items-center gap-2">
              <MapPin size={32} className="text-rose-500" />
              <span className="text-sm font-bold text-[#091F40]">Failed to Load Google Maps</span>
              <p className="text-xs text-slate/60 max-w-[240px]">
                Please ensure a valid Google Maps API Key is provided or check your internet connection.
              </p>
            </div>
          )}

          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Detect my location button overlay */}
          {!loading && !apiError && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="absolute bottom-5 right-5 p-3 rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-all active:scale-90 cursor-pointer text-[#59AD63]"
              aria-label="Locate me"
            >
              <Crosshair size={20} />
            </button>
          )}
        </div>

        {/* Selected Coordinates info */}
        {form.latitude && form.longitude && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-[8px] flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1 font-bold text-charcoal">
              <MapPin size={12} className="text-[#59AD63]" />
              <span>Selected Coordinates</span>
            </div>
            <p className="text-slate/70 leading-relaxed font-semibold">
              Lat: {form.latitude.toFixed(6)}, Lng: {form.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {/* Address Review Box (Editable) */}
        <div className="p-4 bg-[#59AD63]/5 border border-[#59AD63]/25 rounded-[8px] flex flex-col gap-1.5 shadow-sm text-left focus-within:border-[#59AD63] focus-within:ring-1 focus-within:ring-[#59AD63]/30 transition-all duration-150">
          <div className="flex items-center gap-1 font-extrabold text-[12px] text-[#091F40] select-none">
            <MapPin size={14} className="text-[#59AD63]" />
            <span>Address Review Box (Edit or enter manually)</span>
          </div>
          <textarea
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Type property address here..."
            rows={2}
            className="w-full text-[13px] font-semibold text-charcoal placeholder:text-slate/40 outline-none bg-transparent resize-none leading-relaxed"
          />
        </div>

        {/* Actions Button */}
        <div className="mt-2 pb-6">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-[2px] font-display font-bold text-[14px] text-white bg-[#59AD63] hover:bg-[#3F8F4B] transition-all duration-200 cursor-pointer active:scale-98 shadow-sm flex items-center justify-center"
          >
            Continue to Review
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
