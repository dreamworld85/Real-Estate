import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { 
  Building2, 
  Smartphone, 
  QrCode, 
  MapPin, 
  Download, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  ChevronRight, 
  Phone, 
  Mail, 
  Map, 
  Shield 
} from "lucide-react";
import { api, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&q=80";

// Map dynamic string icon names to Lucide icon components
const FeatureIcons: Record<string, React.ComponentType<any>> = {
  CheckCircle2,
  Map,
  Shield,
  Star,
  Building2,
  Smartphone
};

interface Property {
  id: number;
  title: string;
  price: number;
  district: string;
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  isFeatured: boolean;
}

export default function Landing() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1000);
  const [googlePlayUrl, setGooglePlayUrl] = useState("https://play.google.com/store");
  const [appStoreUrl, setAppStoreUrl] = useState("https://www.apple.com/app-store");

  const [landingSettings, setLandingSettings] = useState({
    landing_hero_title: "Find Your Perfect Kerala Nest & Escape",
    landing_hero_description: "Explore curated houses, villas, apartments, and land plots across the lush greenery of Kerala. Connect directly with owners, brokers, and certified agencies.",
    landing_hero_image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80",
    landing_app_title: "Download Our Mobile App For Real-Time Notifications",
    landing_app_description: "Visiting our mobile app gives you access to maps, instant push notifications for matching properties, real-time agent chats, and location-aware search features. Scan the QR code or click the download button below to load the mobile-optimized experience directly on your smartphone.",
    landing_app_download_url: "http://localhost:5173/login",
    landing_app_qr_image: ""
  });
  
  const [features, setFeatures] = useState<{ id: number; title: string; description: string; icon: string }[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1000);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/mobile-share-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.google_play_url) setGooglePlayUrl(data.google_play_url);
        if (data.app_store_url) setAppStoreUrl(data.app_store_url);
      })
      .catch((err) => console.error("Error loading store links:", err));
  }, []);

  useEffect(() => {
    if (isMobile) return;

    // Fetch dynamic landing page settings and feature cards
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/admin/landing/content`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setLandingSettings((prev) => ({ ...prev, ...data.settings }));
        }
        if (data.features) {
          setFeatures(data.features);
        }
      })
      .catch((err) => console.error("Error loading landing content:", err));

    // Fetch listings from the backend public endpoint
    api.fetchProperties()
      .then((data) => {
        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          district: p.district,
          address: p.address,
          propertyType: p.propertyType,
          bedrooms: Number(p.bedrooms || 0),
          bathrooms: Number(p.bathrooms || 0),
          images: p.images || [],
          isFeatured: !!p.isFeatured
        }));
        setProperties(mapped.slice(0, 4));
      })
      .catch((err) => console.error("Error loading landing properties:", err))
      .finally(() => setLoading(false));
  }, [isMobile]);

  if (token && user) {
    return <Navigate to="/home" replace />;
  }

  if (isMobile) {
    return <Navigate to="/login" replace />;
  }

  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
    return `₹${price.toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-cream font-body text-charcoal w-full overflow-x-hidden selection:bg-gold/20 select-none">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-charcoal/5 px-8 py-4 flex items-center justify-between max-w-7xl mx-auto w-full transition-all">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-10 h-10 rounded-2xl bg-forest text-cream flex items-center justify-center shadow-md">
            <Building2 size={20} />
          </div>
          <span className="font-display font-black text-xl text-ink tracking-tight">
            Kerala<span className="text-forest">Realty</span>
          </span>
        </div>

        <div className="flex items-center gap-8 text-sm font-semibold text-charcoal/80">
          <a href="#showcase" className="hover:text-forest transition-colors">Properties</a>
          <a href="#features" className="hover:text-forest transition-colors">Platform Features</a>
          <a href="#download" className="hover:text-forest transition-colors">Download Mobile App</a>
          <a href="#contact" className="hover:text-forest transition-colors">Support</a>
        </div>

        <div>
          {user ? (
            <button
              onClick={() => navigate("/home")}
              className="bg-forest hover:bg-emerald-800 text-cream px-5 py-2.5 rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
            >
              <span>Go to App Dashboard</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="text-ink hover:text-forest text-xs font-bold font-display cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/login")}
                className="bg-forest hover:bg-emerald-800 text-cream px-5 py-2.5 rounded-2xl text-xs font-bold font-display shadow-md transition-all active:scale-[0.97] cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-sage/30 to-cream py-12 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 text-left flex flex-col gap-6">
            <span className="text-[11px] font-bold text-gold uppercase tracking-widest block bg-gold/10 px-3 py-1 rounded-full w-max">
              The Kerala Real Estate Platform
            </span>
            <h1 className="font-display font-extrabold text-5xl text-ink leading-tight tracking-wide">
              {landingSettings.landing_hero_title}
            </h1>
            <p className="text-slate text-sm max-w-lg leading-relaxed font-medium">
              {landingSettings.landing_hero_description}
            </p>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => navigate("/login")}
                className="bg-forest hover:bg-emerald-800 text-cream px-7 py-3.5 rounded-2xl text-xs font-bold font-display shadow-lg transition-all active:scale-[0.97] cursor-pointer flex items-center gap-2"
              >
                <span>Browse Listings</span>
                <ArrowRight size={15} />
              </button>
              <a
                href="#download"
                className="border border-charcoal/10 hover:bg-slate-50 text-ink px-7 py-3.5 rounded-2xl text-xs font-bold font-display transition-all cursor-pointer flex items-center gap-2"
              >
                <Smartphone size={15} />
                <span>Get Mobile App</span>
              </a>
            </div>
          </div>
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-charcoal/5 group aspect-[4/3] bg-sage">
              <img 
                src={mediaUrl(landingSettings.landing_hero_image)} 
                alt="Kerala Traditional House" 
                className="w-full h-full object-cover brightness-[0.85] group-hover:scale-[1.01] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-8 text-left">
                <p className="text-gold text-[10px] font-bold uppercase tracking-wider">Premium Listing</p>
                <h3 className="text-white font-display font-extrabold text-xl mt-1">Heritage Waterfront Villa</h3>
                <p className="text-white/80 text-xs mt-1.5 flex items-center gap-1">
                  <MapPin size={12} className="text-gold" />
                  <span>Alappuzha Backwaters, Kerala</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property Showcase Section */}
      <section id="showcase" className="py-12 px-8 max-w-7xl mx-auto w-full text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Featured Properties</span>
          <h2 className="font-display font-extrabold text-3xl text-ink">Explore Curated Listings</h2>
          <p className="text-slate text-xs max-w-md mt-1">Check out our latest premium verified listings, from traditional houses to urban flats.</p>
        </div>

        {loading ? (
          <div className="py-20 text-slate text-sm font-semibold">Loading verified properties...</div>
        ) : properties.length === 0 ? (
          <div className="py-20 text-slate text-sm font-semibold">No active properties available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {properties.map((p) => (
              <div 
                key={p.id}
                onClick={() => {
                  const element = document.getElementById("download");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="group cursor-pointer bg-white rounded-3xl border border-charcoal/5 shadow-sm hover:shadow-xl hover:scale-[1.005] transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative h-48 bg-sage overflow-hidden">
                  <img 
                    src={p.images[0] ? mediaUrl(p.images[0]) : FALLBACK_IMAGE} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.isFeatured && (
                    <div className="absolute top-3 left-3 bg-gold text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-white/20 select-none">
                      <Star size={8} className="fill-white text-white" />
                      <span>Featured Ad</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1.5 flex-1">
                  <p className="font-display font-bold text-lg text-ink">{formatPrice(p.price)}</p>
                  <h4 className="font-display font-bold text-xs text-charcoal leading-snug truncate">{p.title}</h4>
                  <p className="text-[11px] text-slate flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="shrink-0" />
                    <span>{p.address ? `${p.address}, ${p.district}` : p.district}</span>
                  </p>
                  <div className="flex gap-4 text-[10px] text-slate/85 font-semibold mt-3 pt-3 border-t border-charcoal/5">
                    <span>Type: {p.propertyType}</span>
                    {p.bedrooms > 0 && <span>Bedrooms: {p.bedrooms}</span>}
                    {p.bathrooms > 0 && <span>Bathrooms: {p.bathrooms}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* platform highlights / features */}
      <section id="features" className="bg-sage/20 py-12 px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 text-center flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Real Estate Simplified</span>
            <h2 className="font-display font-extrabold text-3xl text-ink">Built for Buyers, Owners & Brokers</h2>
            <p className="text-slate text-xs max-w-md mt-1">Our platform provides smart features designed to make property search and promotion completely seamless.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat) => {
              const IconComponent = FeatureIcons[feat.icon] || CheckCircle2;
              return (
                <div key={feat.id} className="bg-white p-6 rounded-3xl border border-charcoal/5 shadow-sm flex flex-col gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center shadow-inner">
                    <IconComponent size={24} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink">{feat.title}</h3>
                  <p className="text-xs text-slate leading-relaxed font-medium">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Client Reviews / Testimonials */}
      <section className="py-12 px-8 bg-cream w-full border-t border-b border-charcoal/5 text-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 text-center flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-forest uppercase tracking-wider block">Client Testimonials</span>
            <h2 className="font-display font-extrabold text-3xl text-ink">What Our Users Say</h2>
            <p className="text-slate text-xs max-w-md mt-1">Discover why thousands of buyers, sellers, and agents across Kerala trust our real estate platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white p-6 rounded-3xl border border-charcoal/5 shadow-sm flex flex-col justify-between text-left h-full">
              <div className="flex flex-col gap-4">
                <div className="flex gap-1 text-gold">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-xs text-charcoal/90 leading-relaxed font-semibold italic">
                  "Finding an apartment in Kochi without brokers was always a nightmare. Through Kerala Realty, I directly connected with the owner and completed everything in a week!"
                </p>
              </div>
              <div className="flex items-center gap-3.5 mt-6 border-t border-charcoal/5 pt-4">
                <div className="w-10 h-10 rounded-full bg-forest/10 text-forest font-bold flex items-center justify-center font-display shadow-inner">
                  AK
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-ink">Anoop K.</h4>
                  <p className="text-[10px] text-slate font-bold">Buyer, Kochi</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white p-6 rounded-3xl border border-charcoal/5 shadow-sm flex flex-col justify-between text-left h-full">
              <div className="flex flex-col gap-4">
                <div className="flex gap-1 text-gold">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-xs text-charcoal/90 leading-relaxed font-semibold italic">
                  "I listed my family house in Trivandrum on this platform. The admin panel made it super easy to track inquiries, and I found a family who rented it immediately."
                </p>
              </div>
              <div className="flex items-center gap-3.5 mt-6 border-t border-charcoal/5 pt-4">
                <div className="w-10 h-10 rounded-full bg-forest/10 text-forest font-bold flex items-center justify-center font-display shadow-inner">
                  MN
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-ink">Meera Nair</h4>
                  <p className="text-[10px] text-slate font-bold">Homeowner, Trivandrum</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white p-6 rounded-3xl border border-charcoal/5 shadow-sm flex flex-col justify-between text-left h-full">
              <div className="flex flex-col gap-4">
                <div className="flex gap-1 text-gold">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-xs text-charcoal/90 leading-relaxed font-semibold italic">
                  "As a professional broker, this app has drastically increased my reach. The shareable mobile link is my favorite feature—clients see property details instantly."
                </p>
              </div>
              <div className="flex items-center gap-3.5 mt-6 border-t border-charcoal/5 pt-4">
                <div className="w-10 h-10 rounded-full bg-forest/10 text-forest font-bold flex items-center justify-center font-display shadow-inner">
                  RV
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-ink">Rahul Varma</h4>
                  <p className="text-[10px] text-slate font-bold">Broker, Kozhikode</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Download App" Section */}
      <section id="download" className="py-12 px-8 max-w-7xl mx-auto w-full">
        <div className="bg-ink rounded-[40px] overflow-hidden text-white shadow-2xl relative border border-white/5">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-forest/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 lg:p-12 items-center">
            <div className="lg:col-span-7 text-left flex flex-col gap-6">
              <span className="text-[10px] font-bold text-gold uppercase tracking-widest block bg-white/10 px-3 py-1 rounded-full w-max">
                Get the Full Mobile Experience
              </span>
              <h2 className="font-display font-extrabold text-4xl leading-tight">
                {landingSettings.landing_app_title}
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-xl">
                {landingSettings.landing_app_description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {/* Google Play Store Badge */}
                <a 
                  href={googlePlayUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="active:scale-95 transition-all block"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                    alt="Get it on Google Play" 
                    className="h-[44px] w-auto object-contain rounded-lg shadow-md border border-white/5"
                  />
                </a>

                {/* Apple App Store Badge */}
                <a 
                  href={appStoreUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="active:scale-95 transition-all block"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                    alt="Download on the App Store" 
                    className="h-[44px] w-auto object-contain rounded-lg shadow-md border border-white/5"
                  />
                </a>
              </div>
            </div>

            {/* QR Code Segment */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[32px] shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full text-center">
                <div className="w-48 h-48 bg-white p-3.5 rounded-2xl flex items-center justify-center shadow-inner relative group overflow-hidden">
                  {landingSettings.landing_app_qr_image ? (
                    <img 
                      src={mediaUrl(landingSettings.landing_app_qr_image)} 
                      alt="QR Code Link" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    /* Custom QR SVG */
                    <svg viewBox="0 0 100 100" className="w-full h-full text-ink">
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      {/* Corners */}
                      <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="10" y="10" width="15" height="15" fill="white" />
                      <rect x="13" y="13" width="9" height="9" fill="currentColor" />

                      <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                      <rect x="75" y="10" width="15" height="15" fill="white" />
                      <rect x="78" y="13" width="9" height="9" fill="currentColor" />

                      <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                      <rect x="10" y="75" width="15" height="15" fill="white" />
                      <rect x="13" y="78" width="9" height="9" fill="currentColor" />

                      {/* QR Pixels placeholders */}
                      <rect x="35" y="5" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="10" width="10" height="5" fill="currentColor" />
                      <rect x="60" y="5" width="5" height="5" fill="currentColor" />
                      
                      <rect x="35" y="25" width="10" height="5" fill="currentColor" />
                      <rect x="50" y="20" width="5" height="15" fill="currentColor" />
                      <rect x="60" y="25" width="5" height="5" fill="currentColor" />

                      <rect x="5" y="35" width="15" height="5" fill="currentColor" />
                      <rect x="10" y="45" width="5" height="10" fill="currentColor" />
                      <rect x="25" y="35" width="10" height="5" fill="currentColor" />

                      <rect x="35" y="35" width="5" height="5" fill="currentColor" />
                      <rect x="45" y="40" width="25" height="5" fill="currentColor" />
                      <rect x="75" y="35" width="15" height="5" fill="currentColor" />
                      
                      <rect x="35" y="50" width="10" height="10" fill="currentColor" />
                      <rect x="50" y="45" width="5" height="15" fill="currentColor" />
                      <rect x="65" y="50" width="15" height="5" fill="currentColor" />

                      <rect x="5" y="60" width="5" height="5" fill="currentColor" />
                      <rect x="15" y="60" width="10" height="5" fill="currentColor" />
                      <rect x="25" y="50" width="5" height="15" fill="currentColor" />

                      <rect x="35" y="70" width="15" height="5" fill="currentColor" />
                      <rect x="55" y="75" width="5" height="10" fill="currentColor" />
                      <rect x="70" y="70" width="10" height="5" fill="currentColor" />

                      <rect x="35" y="80" width="5" height="15" fill="currentColor" />
                      <rect x="45" y="85" width="15" height="5" fill="currentColor" />
                      <rect x="70" y="80" width="5" height="15" fill="currentColor" />
                      <rect x="80" y="85" width="15" height="5" fill="currentColor" />
                    </svg>
                  )}
                </div>
                <div className="text-white">
                  <h4 className="font-display font-extrabold text-xs">Scan to Download App</h4>
                  <p className="text-[10px] text-white/60 mt-0.5">Point your camera to load instant link</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Footer */}
      <footer id="contact" className="bg-charcoal text-white pt-12 pb-6 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 text-left">
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-forest text-cream flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <span className="font-display font-black text-lg text-white tracking-tight">
                Kerala<span className="text-gold">Realty</span>
              </span>
            </div>
            <p className="text-xs text-white/65 leading-relaxed max-w-sm">
              Discover, buy, and lease properties across Kerala. GreenReal is the premier real estate platform connecting buyers and verified listing promoters.
            </p>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 text-xs font-semibold text-white/70">
            <h4 className="text-gold font-bold uppercase tracking-wider text-[10px]">Properties</h4>
            <a href="#showcase" className="hover:text-white transition-colors">Villas & Houses</a>
            <a href="#showcase" className="hover:text-white transition-colors">Apartments & Flats</a>
            <a href="#showcase" className="hover:text-white transition-colors">Land Plots</a>
            <a href="#showcase" className="hover:text-white transition-colors">Commercial Space</a>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 text-xs font-semibold text-white/70">
            <h4 className="text-gold font-bold uppercase tracking-wider text-[10px]">Legal Policies</h4>
            <span onClick={() => navigate("/privacy")} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span onClick={() => navigate("/terms")} className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</span>
            <span onClick={() => navigate("/refund")} className="hover:text-white transition-colors cursor-pointer">Refund Policy</span>
          </div>

          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="text-gold font-bold uppercase tracking-wider text-[10px]">Customer Support</h4>
            <div className="flex flex-col gap-2.5 text-xs text-white/75">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gold shrink-0" />
                <span>support@greensparrows.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gold shrink-0" />
                <span>+91 484 2901234 (10 AM - 6 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gold shrink-0" />
                <span>Green Sparrows, Infopark Phase II, Kochi, Kerala</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-white/45">
          <p>© {new Date().getFullYear()} Kerala Realty. All rights reserved. Managed by Green Sparrows.</p>
          <div className="flex gap-6">
            <span>Standard SSL Secured checkout</span>
            <span>Certified payment processes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
