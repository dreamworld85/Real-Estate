import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Crosshair, MapPin, Search } from "lucide-react";
import { useAddProperty } from "@/lib/AddPropertyContext";
import BottomNav from "@/components/BottomNav";
import { INDIAN_STATES, getDistrictsForState } from "@/lib/indiaLocationData";

declare global {
  interface Window {
    google: any;
    L: any;
    gm_authFailure?: () => void;
    initAutocomplete?: () => void;
  }
}

export default function MapPickerStep() {
  const navigate = useNavigate();
  const { form, update } = useAddProperty();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [fetchedAddress, setFetchedAddress] = useState(form.address || form.mapAddress || "");
  const [manualAddress, setManualAddress] = useState(form.address || form.mapAddress || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setManualAddress(fetchedAddress);
  }, [fetchedAddress]);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  // Default coordinates (Kerala, India)
  const defaultLat = form.latitude || 10.850516;
  const defaultLng = form.longitude || 76.271080;

  useEffect(() => {
    // Handle Google Maps API key / auth failure (e.g. invalid key or billing issue)
    window.gm_authFailure = () => {
      console.warn("Google Maps Auth Failure. Automatically switching to OpenStreetMap / Leaflet map picker...");
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
      initLeafletOrFallback();
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    if (!apiKey) {
      initLeafletOrFallback();
      return;
    }

    if (window.google && window.google.maps) {
      setLoading(false);
      initializeMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setLoading(false);
      initializeMap();
    };
    script.onerror = () => {
      initLeafletOrFallback();
    };
    document.head.appendChild(script);

    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  // Automatically request device location on mount if coordinates are not set
  useEffect(() => {
    if (!form.latitude && !form.longitude && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords = { lat: latitude, lng: longitude };

          if (mapRef.current && markerRef.current) {
            mapRef.current.setCenter(coords);
            mapRef.current.setZoom(16);
            markerRef.current.setPosition(coords);
          }

          if (leafletMapRef.current && leafletMarkerRef.current) {
            leafletMapRef.current.setView([latitude, longitude], 16);
            leafletMarkerRef.current.setLatLng([latitude, longitude]);
          }

          updateCoordinates(coords);
          if (window.google && window.google.maps) {
            reverseGeocode(coords);
          } else {
            reverseGeocodeNominatim(coords);
          }
        },
        (error) => {
          console.warn("Auto geolocation prompt/error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  const initLeafletOrFallback = () => {
    setLoading(false);
    let attempts = 0;
    const checkL = () => {
      if (window.L && mapContainerRef.current) {
        initializeLeafletMap();
      } else if (attempts < 10) {
        attempts++;
        setTimeout(checkL, 200);
      } else {
        setApiError(true);
      }
    };
    checkL();
  };

  const initializeLeafletMap = () => {
    if (!mapContainerRef.current || !window.L) return;
    if (leafletMapRef.current) return;

    mapContainerRef.current.innerHTML = "";

    const center: [number, number] = [defaultLat, defaultLng];

    const map = window.L.map(mapContainerRef.current, {
      center: center,
      zoom: 13,
      zoomControl: true,
    });

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    }).addTo(map);

    leafletMapRef.current = map;

    // Force Leaflet to recalculate container bounds and load visible map tiles
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 100);
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 500);

    const customIcon = window.L.divIcon({
      className: "custom-leaflet-picker-gif-pin",
      html: `<img src="/images/location.gif" style="width: 48px; height: 48px; display: block; cursor: grab; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));" />`,
      iconSize: [48, 48],
      iconAnchor: [24, 48]
    });

    const marker = window.L.marker(center, {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    leafletMarkerRef.current = marker;

    if (!form.mapAddress && !form.address) {
      reverseGeocodeNominatim({ lat: defaultLat, lng: defaultLng });
    }

    map.on("click", (e: any) => {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng);
      updateCoordinates(coords);
      reverseGeocodeNominatim(coords);
    });

    marker.on("dragend", () => {
      const latlng = marker.getLatLng();
      const coords = { lat: latlng.lat, lng: latlng.lng };
      updateCoordinates(coords);
      reverseGeocodeNominatim(coords);
    });
  };

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const maps = window.google.maps;
    const center = { lat: defaultLat, lng: defaultLng };

    const map = new maps.Map(mapContainerRef.current, {
      center: center,
      zoom: 12,
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

    const marker = new maps.Marker({
      position: center,
      map: map,
      draggable: true,
      animation: maps.Animation.DROP,
      icon: {
        url: "/images/location.gif",
        scaledSize: new maps.Size(48, 48),
        origin: new maps.Point(0, 0),
        anchor: new maps.Point(24, 48)
      }
    });
    markerRef.current = marker;

    geocoderRef.current = new maps.Geocoder();

    if (!form.mapAddress && !form.address) {
      reverseGeocode(center);
    }

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

  const fetchNominatimSuggestions = (query: string) => {
    const fullQuery = query.toLowerCase().includes("india") ? query : `${query}, India`;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}&limit=6`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(fullQuery)}&limit=6`)
            .then((res) => res.json())
            .then((fallbackData) => {
              if (Array.isArray(fallbackData) && fallbackData.length > 0) {
                setSuggestions(fallbackData);
                setShowSuggestions(true);
              } else {
                fetchOpenMeteoSuggestions(query);
              }
            })
            .catch(() => fetchOpenMeteoSuggestions(query));
        }
      })
      .catch(() => fetchOpenMeteoSuggestions(query));
  };

  const fetchOpenMeteoSuggestions = (query: string) => {
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const formatted = data.results.map((item: any) => ({
            lat: String(item.latitude),
            lon: String(item.longitude),
            display_name: `${item.name}, ${item.admin1 || ""}, ${item.country || "India"}`,
            place_name: item.name,
            address: {
              city: item.name,
              district: item.admin2 || item.admin1 || "",
              state: item.admin1 || ""
            }
          }));
          setSuggestions(formatted);
          setShowSuggestions(true);
        }
      })
      .catch((err) => console.error("OpenMeteo suggestions error:", err));
  };

  // Debounced search for live suggestions (No premature auto-pan while typing)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      const query = searchQuery.trim();

      // Handle 6-digit Indian PIN Code in live autocomplete e.g. 673121
      if (/^\d{6}$/.test(query)) {
        try {
          const pinRes = await fetch(`https://api.postalpincode.in/pincode/${query}`);
          const pinData = await pinRes.json();
          if (pinData && pinData[0] && pinData[0].Status === "Success" && Array.isArray(pinData[0].PostOffice)) {
            const postOffices = pinData[0].PostOffice;
            const pinSuggestions = postOffices.map((po: any) => ({
              display_name: `${po.Name}, ${po.District}, ${po.State} - ${query}`,
              place_name: po.Name,
              search_query: `${po.Name}, ${po.District}, ${po.State}, India`,
              fallback_query: `${po.District}, ${po.State}, India`,
              district: po.District,
              state: po.State,
              address: {
                city: po.Name,
                district: po.District,
                state: po.State,
                postcode: query,
              },
            }));
            setSuggestions(pinSuggestions);
            setShowSuggestions(true);
            return;
          }
        } catch (e) {
          console.warn("PIN Code API fetch error:", e);
        }
      }

      // Try Google Places Autocomplete if available and valid
      if (window.google && window.google.maps && window.google.maps.places && !leafletMapRef.current) {
        try {
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          autocompleteService.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: "in" },
            },
            (predictions: any, status: any) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
                const formatted = predictions.map((p: any) => ({
                  display_name: p.description,
                  place_id: p.place_id,
                  isGooglePlace: true,
                  place_name: p.structured_formatting?.main_text || p.description.split(",")[0],
                  structured_formatting: p.structured_formatting,
                }));
                setSuggestions(formatted);
                setShowSuggestions(true);
              } else {
                fetchNominatimSuggestions(query);
              }
            }
          );
          return;
        } catch (e) {
          console.warn("Google Places Autocomplete error:", e);
        }
      }

      fetchNominatimSuggestions(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const applyLocationData = (params: {
    lat?: number;
    lng?: number;
    mapAddress?: string;
    cityOrAddress?: string;
    rawState?: string;
    rawDistrict?: string;
  }) => {
    const currentState = form.state || "Kerala";
    let matchedState: string = currentState;

    const fullAddressText = `${params.mapAddress || ""} ${params.cityOrAddress || ""} ${params.rawState || ""} ${params.rawDistrict || ""}`.toLowerCase();

    if (params.rawState) {
      const foundState = INDIAN_STATES.find((s) => s.toLowerCase() === params.rawState!.toLowerCase());
      if (foundState) {
        matchedState = foundState;
      }
    }
    
    if (!params.rawState || matchedState === currentState) {
      const stateMatch = INDIAN_STATES.find((s) => fullAddressText.includes(s.toLowerCase()));
      if (stateMatch) {
        matchedState = stateMatch;
      }
    }

    const dists = getDistrictsForState(matchedState);
    let matchedDistrict: string | undefined = undefined;

    if (params.rawDistrict) {
      const cleanRaw = params.rawDistrict.replace(/ District/i, "").trim().toLowerCase();
      const exactMatch = dists.find((d) => d.toLowerCase() === cleanRaw);
      const partialMatch = dists.find((d) => cleanRaw.includes(d.toLowerCase()) || d.toLowerCase().includes(cleanRaw));
      if (exactMatch) matchedDistrict = exactMatch;
      else if (partialMatch) matchedDistrict = partialMatch;
    }

    if (!matchedDistrict) {
      const addressDistrictMatch = dists.find((d) => fullAddressText.includes(d.toLowerCase()));
      if (addressDistrictMatch) {
        matchedDistrict = addressDistrictMatch;
      }
    }

    if (!matchedDistrict || !dists.includes(matchedDistrict)) {
      matchedDistrict = (form.district && dists.includes(form.district)) ? form.district : (dists[0] || "");
    }

    update({
      ...(params.lat !== undefined ? { latitude: params.lat } : {}),
      ...(params.lng !== undefined ? { longitude: params.lng } : {}),
      ...(params.mapAddress ? { mapAddress: params.mapAddress } : {}),
      ...(params.cityOrAddress ? { address: params.cityOrAddress } : {}),
      state: matchedState,
      district: matchedDistrict,
    });

    if (params.cityOrAddress) {
      setFetchedAddress(params.cityOrAddress);
      setManualAddress(params.cityOrAddress);
    }
  };

  const selectLocation = (locationItem: any) => {
    setShowSuggestions(false);

    // If item is a Google Place prediction
    if (locationItem.isGooglePlace && window.google && window.google.maps && geocoderRef.current) {
      geocoderRef.current.geocode({ placeId: locationItem.place_id }, (results: any, status: string) => {
        if (status === "OK" && results[0]) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };

          if (mapRef.current) {
            mapRef.current.setCenter(loc);
            mapRef.current.setZoom(15);
            if (markerRef.current) markerRef.current.setPosition(loc);
          }

          let googleDistrict = "";
          let googleState = "";
          let googleCity = "";
          for (const comp of results[0].address_components || []) {
            if (comp.types.includes("administrative_area_level_1")) googleState = comp.long_name;
            if (comp.types.includes("administrative_area_level_2")) googleDistrict = comp.long_name;
            if (comp.types.includes("locality") || comp.types.includes("sublocality_level_1") || comp.types.includes("neighborhood")) {
              if (!googleCity) googleCity = comp.long_name;
            }
          }
          const cityOrAddress = googleCity || locationItem.display_name.split(",")[0];

          applyLocationData({
            lat: coords.lat,
            lng: coords.lng,
            mapAddress: results[0].formatted_address || locationItem.display_name,
            cityOrAddress: cityOrAddress,
            rawState: googleState,
            rawDistrict: googleDistrict || googleCity,
          });
          return;
        }
        // Fallback to nominatim
        geocodeAddress(locationItem.display_name);
      });
      return;
    }

    // If item needs geocoding (e.g. PIN code post office item without pre-set lat/lon)
    if (!locationItem.lat || !locationItem.lon) {
      const queryToGeocode = locationItem.search_query || locationItem.display_name;
      const targetState = locationItem.state || "Kerala";
      const targetDistrict = locationItem.district || "Wayanad";

      geocodeAddress(queryToGeocode, {
        fallbackAddress: locationItem.display_name,
        fallbackState: targetState,
        fallbackDistrict: targetDistrict,
      });
      return;
    }

    const lat = parseFloat(locationItem.lat);
    const lng = parseFloat(locationItem.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    const displayName = locationItem.display_name;
    const addressParts = locationItem.address || {};
    const county = locationItem.district || addressParts.county || addressParts.state_district || addressParts.district || "";
    const city = addressParts.city || addressParts.town || addressParts.village || addressParts.suburb || addressParts.locality || locationItem.place_name || "";
    const state = locationItem.state || addressParts.state || "";
    const cityOrAddress = city || displayName.split(",")[0] || displayName;

    // Center Google Map & Marker
    if (window.google && window.google.maps && mapRef.current) {
      const maps = window.google.maps;
      const googleCoords = new maps.LatLng(lat, lng);
      mapRef.current.setCenter(googleCoords);
      mapRef.current.setZoom(15);
      if (markerRef.current) {
        markerRef.current.setPosition(googleCoords);
      }
    }

    // Center Leaflet Map & Marker
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 15);
      if (leafletMarkerRef.current) {
        leafletMarkerRef.current.setLatLng([lat, lng]);
      }
      setTimeout(() => {
        if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
      }, 50);
      setTimeout(() => {
        if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
      }, 200);
    }

    applyLocationData({
      lat: lat,
      lng: lng,
      mapAddress: displayName,
      cityOrAddress: cityOrAddress,
      rawState: state,
      rawDistrict: county || city,
    });
  };

  const geocodeNominatim = async (address: string, options?: { fallbackAddress?: string; fallbackState?: string; fallbackDistrict?: string }) => {
    if (!address || !address.trim()) return;
    setIsSearching(true);
    setShowSuggestions(false);

    const query = address.trim();

    // 1. Handle 6-digit Indian PIN Code search e.g. 673121
    if (/^\d{6}$/.test(query)) {
      try {
        const pinRes = await fetch(`https://api.postalpincode.in/pincode/${query}`);
        const pinData = await pinRes.json();
        if (pinData && pinData[0] && pinData[0].Status === "Success" && Array.isArray(pinData[0].PostOffice) && pinData[0].PostOffice.length > 0) {
          const po = pinData[0].PostOffice[0];
          const poQuery = `${po.Name}, ${po.District}, ${po.State}, India`;
          const distQuery = `${po.District}, ${po.State}, India`;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(poQuery)}&limit=1`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              selectLocation({
                ...data[0],
                district: po.District,
                state: po.State,
                display_name: `${po.Name}, ${po.District}, ${po.State} - ${query}`,
              });
              setIsSearching(false);
              return;
            }
          } catch (e) {
            console.warn("Nominatim fetch error for PIN code:", e);
          }

          // Fallback to district level search for PIN code
          try {
            const resDist = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(distQuery)}&limit=1`);
            const dataDist = await resDist.json();
            if (Array.isArray(dataDist) && dataDist.length > 0) {
              selectLocation({
                ...dataDist[0],
                district: po.District,
                state: po.State,
                display_name: `${po.Name}, ${po.District}, ${po.State} - ${query}`,
              });
              setIsSearching(false);
              return;
            }
          } catch (e) {
            console.warn("District level nominatim fetch error:", e);
          }

          // Default fallback coordinates for known Kerala districts
          const defaultLat = 10.850516;
          const defaultLng = 76.271080;
          applyLocationData({
            lat: defaultLat,
            lng: defaultLng,
            mapAddress: `${po.Name}, ${po.District}, ${po.State} - ${query}`,
            cityOrAddress: `${po.Name}, ${po.District}`,
            rawState: po.State,
            rawDistrict: po.District,
          });
          setIsSearching(false);
          return;
        }
      } catch (e) {
        console.warn("PIN Code API fetch error:", e);
      }
    }

    // 2. Nominatim Search
    const fullQuery = query.toLowerCase().includes("india") ? query : `${query}, India`;

    try {
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(fullQuery)}&limit=5`);
      let data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`);
        data = await res.json();
      }

      if (Array.isArray(data) && data.length > 0) {
        selectLocation(data[0]);
        setIsSearching(false);
        return;
      }
    } catch (err) {
      console.warn("Nominatim search error, trying Open-Meteo fallback:", err);
    }

    // 3. Fallback to Open-Meteo Geocoding
    try {
      const fallbackRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.results && fallbackData.results.length > 0) {
        const item = fallbackData.results[0];
        const itemLocation = {
          lat: String(item.latitude),
          lon: String(item.longitude),
          display_name: `${item.name}, ${item.admin1 || ""}, ${item.country || "India"}`,
          place_name: item.name,
          address: {
            city: item.name,
            district: item.admin2 || item.admin1 || "",
            state: item.admin1 || ""
          }
        };
        selectLocation(itemLocation);
        setIsSearching(false);
        return;
      }
    } catch (fallbackErr) {
      console.error("Geocoding fallback failed:", fallbackErr);
    }

    if (options?.fallbackAddress || options?.fallbackDistrict) {
      applyLocationData({
        mapAddress: options.fallbackAddress || address,
        cityOrAddress: options.fallbackAddress ? options.fallbackAddress.split(",")[0] : address,
        rawState: options.fallbackState || "Kerala",
        rawDistrict: options.fallbackDistrict || "Wayanad",
      });
      setIsSearching(false);
      return;
    }

    alert(`No location matches found for "${address}". Please try another town, city, landmark or PIN code.`);
    setIsSearching(false);
  };

  const geocodeAddress = (address: string, options?: { fallbackAddress?: string; fallbackState?: string; fallbackDistrict?: string }) => {
    if (leafletMapRef.current || !window.google || !window.google.maps || !geocoderRef.current) {
      geocodeNominatim(address, options);
      return;
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
        let googleState = "";
        let googleCity = "";
        const components = results[0].address_components || [];
        for (const component of components) {
          if (component.types.includes("administrative_area_level_1")) {
            googleState = component.long_name;
          }
          if (component.types.includes("administrative_area_level_2")) {
            googleDistrict = component.long_name;
          }
          if (component.types.includes("locality") || component.types.includes("sublocality_level_1") || component.types.includes("sublocality") || component.types.includes("neighborhood")) {
            if (!googleCity) googleCity = component.long_name;
          }
        }
        const cityOrAddress = googleCity || results[0].formatted_address;

        applyLocationData({
          lat: coords.lat,
          lng: coords.lng,
          mapAddress: results[0].formatted_address,
          cityOrAddress: cityOrAddress,
          rawState: googleState,
          rawDistrict: googleDistrict || googleCity,
        });
      } else {
        console.warn("Google Geocoder failed. Falling back to Nominatim: " + status);
        geocodeNominatim(address, options);
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
          const city = addressParts.city || addressParts.town || addressParts.village || addressParts.suburb || addressParts.locality || "";
          const state = addressParts.state || "";
          const cityOrAddress = city || displayName;

          applyLocationData({
            mapAddress: displayName,
            cityOrAddress: cityOrAddress,
            rawState: state,
            rawDistrict: county || city,
          });
        }
      })
      .catch(err => console.error("Nominatim reverse geocoding error:", err));
  };

  const reverseGeocode = (coords: { lat: number; lng: number }) => {
    if (leafletMapRef.current || !window.google || !window.google.maps) {
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
        let googleState = "";
        let googleCity = "";
        const components = results[0].address_components || [];
        for (const component of components) {
          if (component.types.includes("administrative_area_level_1")) {
            googleState = component.long_name;
          }
          if (component.types.includes("administrative_area_level_2")) {
            googleDistrict = component.long_name;
          }
          if (component.types.includes("locality") || component.types.includes("sublocality_level_1") || component.types.includes("sublocality") || component.types.includes("neighborhood")) {
            if (!googleCity) googleCity = component.long_name;
          }
        }
        const cityOrAddress = googleCity || formattedAddress;

        applyLocationData({
          mapAddress: formattedAddress,
          cityOrAddress: cityOrAddress,
          rawState: googleState,
          rawDistrict: googleDistrict || googleCity,
        });
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

        if (leafletMapRef.current && leafletMarkerRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 16);
          leafletMarkerRef.current.setLatLng([latitude, longitude]);
        }

        updateCoordinates(coords);
        if (window.google && window.google.maps) {
          reverseGeocode(coords);
        } else {
          reverseGeocodeNominatim(coords);
        }
      },
      (error) => {
        alert("Geolocation error: " + error.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleNext = () => {
    const selectedState = form.state || "Kerala";
    const dists = getDistrictsForState(selectedState);
    const selectedDistrict = form.district || (dists.length > 0 ? dists[0] : "Wayanad");

    update({
      mapAddress: manualAddress,
      address: manualAddress || form.address,
      state: selectedState,
      district: selectedDistrict,
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
        <div className="relative z-30">
          <div className="flex gap-2">
            <div className="flex-1 relative border border-[#59AD63]/40 rounded-[10px] px-4 py-3 bg-white flex items-center shadow-sm focus-within:border-[#59AD63] focus-within:ring-2 focus-within:ring-[#59AD63]/20 transition-all duration-150">
              <input
                type="text"
                placeholder="Search location, city or PIN code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    geocodeAddress(searchQuery);
                  }
                }}
                className="flex-1 text-[14px] font-medium text-[#091F40] placeholder:text-slate-400 outline-none bg-transparent pr-2"
              />
              <Search
                size={19}
                className="text-slate-400 hover:text-[#59AD63] shrink-0 cursor-pointer transition-colors"
                onClick={() => geocodeAddress(searchQuery)}
              />
            </div>
            <button
              type="button"
              disabled={isSearching}
              onClick={() => geocodeAddress(searchQuery)}
              className="px-5 rounded-[10px] font-bold text-xs text-white bg-[#59AD63] hover:bg-[#3F8F4B] transition-colors active:scale-95 cursor-pointer shadow-sm flex items-center justify-center shrink-0 disabled:opacity-60"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Search Autocomplete Suggestions Dropdown - Google Maps Style */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto py-1">
              {suggestions.map((item, idx) => {
                const formatSuggestionItem = (locItem: any) => {
                  if (locItem.isGooglePlace && locItem.structured_formatting) {
                    return {
                      main: locItem.structured_formatting.main_text || locItem.display_name.split(",")[0],
                      secondary: locItem.structured_formatting.secondary_text || locItem.display_name.split(",").slice(1).join(", ").trim(),
                    };
                  }
                  const parts = locItem.display_name ? locItem.display_name.split(",") : [locItem.place_name || "Location"];
                  const main = locItem.place_name || parts[0].trim();
                  const secondary = parts.slice(1).join(", ").trim();
                  return { main, secondary };
                };
                const { main, secondary } = formatSuggestionItem(item);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectLocation(item)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-100/90 border-b border-slate-100 last:border-b-0 transition-colors flex items-center gap-3.5 cursor-pointer group"
                  >
                    <MapPin size={18} className="text-slate-500 group-hover:text-[#59AD63] shrink-0 transition-colors" />
                    <div className="flex items-baseline gap-1.5 min-w-0 flex-wrap">
                      <span className="text-[13.5px] font-bold text-[#091F40] tracking-tight">
                        {main}
                      </span>
                      {secondary && (
                        <span className="text-[12px] font-medium text-slate-500 truncate">
                          {secondary}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
            placeholder="Enter city or property address here..."
            rows={2}
            className="w-full text-[13px] font-semibold text-charcoal placeholder:text-slate/40 outline-none bg-transparent resize-none leading-relaxed"
          />
        </div>

        {/* State & District Selection */}
        <div className="grid grid-cols-2 gap-3">
          {/* State */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[12px] font-bold text-[#091F40]">State</label>
            <div className="relative">
              <select
                value={form.state || "Kerala"}
                onChange={(e) => {
                  const newState = e.target.value;
                  const dists = getDistrictsForState(newState);
                  const newDistrict = dists.includes(form.district) ? form.district : (dists[0] || "");
                  update({ state: newState, district: newDistrict });
                }}
                className="w-full appearance-none rounded-[8px] border border-[#59AD63]/30 bg-white px-3 py-2.5 text-[12.5px] font-semibold text-charcoal outline-none focus:border-[#59AD63] focus:ring-1 focus:ring-[#59AD63]/30 transition-all cursor-pointer shadow-sm pr-7 truncate"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
            </div>
          </div>

          {/* District */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[12px] font-bold text-[#091F40]">District</label>
            <div className="relative">
              <select
                value={form.district}
                onChange={(e) => update({ district: e.target.value })}
                className="w-full appearance-none rounded-[8px] border border-[#59AD63]/30 bg-white px-3 py-2.5 text-[12.5px] font-semibold text-charcoal outline-none focus:border-[#59AD63] focus:ring-1 focus:ring-[#59AD63]/30 transition-all cursor-pointer shadow-sm pr-7 truncate"
              >
                <option value="">Select District</option>
                {getDistrictsForState(form.state || "Kerala").map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
            </div>
          </div>
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
