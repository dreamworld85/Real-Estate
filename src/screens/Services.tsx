import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  UserCheck, 
  Store, 
  ArrowRight, 
  PhoneCall, 
  CheckCircle2, 
  TrendingUp, 
  Building, 
  Award, 
  Sparkles, 
  ShieldCheck,
  Star,
  ChevronRight,
  X,
  Check
} from "lucide-react";
import DesktopHeader from "@/components/DesktopHeader";
import DesktopFooter from "@/components/DesktopFooter";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import RequestInformationModal from "@/components/RequestInformationModal";

type ServiceTab = "Owners" | "Dealers" | "Builders";

const SERVICE_DETAILS: Record<string, { title: string; bullets: string[] }> = {
  Banners: {
    title: "Banners",
    bullets: [
      "Branding choices available across different pages such as home pages, search pages, project detail pages etc.",
      "Choose between different type of banner campaigns based on your target audience, required reach & impact, city, locality, budget and purchase preferences"
    ]
  },
  "Featured Listing": {
    title: "Featured Listing",
    bullets: [
      "Provides guaranteed prominence and exposure in preferred locality on top search results pages.",
      "Attract up to 5x more direct buyer inquiries and property views with eye-catching featured badges."
    ]
  },
  "Featured Project": {
    title: "Featured Project",
    bullets: [
      "Recommended product for getting new booking buyer leads for primary clients and builders.",
      "Includes dedicated project showcase banner, virtual walkthrough links, and direct promoter contact options."
    ]
  },
  "Premium Plan": {
    title: "Premium Plan",
    bullets: [
      "Let your property stand out from the crowd with larger display on search results and added animation to attract buyers.",
      "Enjoy priority listing promoter status, relationship manager support, and verified seller trust badge."
    ]
  }
};

export default function Services() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ServiceTab>("Dealers");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1000);
  
  // Drawer popup state for Know More
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);

  // Callback modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestServiceName, setRequestServiceName] = useState("General Service");

  // Responsive resize handler
  useState(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1000);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  const handleOpenDrawer = (serviceKey: string) => {
    setSelectedServiceKey(serviceKey);
  };

  const handleCloseDrawer = () => {
    setSelectedServiceKey(null);
  };

  const handleGetCallback = (serviceTitle?: string) => {
    if (serviceTitle) setRequestServiceName(serviceTitle);
    else if (selectedServiceKey) setRequestServiceName(selectedServiceKey);
    else setRequestServiceName("General Service");

    setSelectedServiceKey(null); // Close drawer
    setIsRequestModalOpen(true); // Open modal
  };

  const activeService = selectedServiceKey ? SERVICE_DETAILS[selectedServiceKey] : null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] w-full flex flex-col font-sans relative overflow-x-hidden">
      {/* Top Header for Desktop */}
      <DesktopHeader />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-10">
        
        {/* 3 Main Role Navigation Tabs (Owners, Dealers, Builders) */}
        <div className="flex items-center justify-center">
          <div className="bg-white p-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2 max-w-md w-full">
            {(["Owners", "Dealers", "Builders"] as ServiceTab[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 px-5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center select-none ${
                    isActive
                      ? "bg-[#1B5E4F] text-white shadow-md scale-[1.02]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1: Hero Banner - "New Plans to Contact..." */}
        <section className="flex flex-col items-center text-center gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-display">
              New Plans to Contact {activeTab}
            </h1>
            <div className="inline-block bg-blue-100/70 text-blue-900 font-extrabold text-sm sm:text-base px-4 py-1 rounded-md">
              to close deals faster and grow business
            </div>
          </div>

          {/* BOSS Feature Callout Banner Box */}
          <div className="w-full bg-[#EEF7FF] border border-blue-150 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs text-left relative overflow-hidden">
            {/* Left Graphic Badge */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/90 border border-blue-100 shadow-sm flex flex-col items-center justify-center shrink-0 p-2 relative">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-xs mb-1">
                  👤
                </div>
                <div className="w-10 h-2 bg-blue-300 rounded-full mb-1" />
                <div className="w-8 h-1.5 bg-gray-200 rounded-full" />
                <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-blue-400 opacity-60" />
                <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-amber-400 opacity-60" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-100/80 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  BROKER OWNER SUPPLY SOLUTION
                </span>
                <h3 className="text-xl font-black text-gray-900 font-display">
                  Introducing <span className="text-blue-600">BOSS</span>
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-1 max-w-md">
                  Unlock up to 50 {activeTab.toLowerCase()} contact every month with BOSS Plans starting at ₹999 per month
                </p>
              </div>
            </div>

            {/* Right Action Button */}
            <button
              onClick={() => navigate("/subscription")}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#0078D4] hover:bg-[#0060B5] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center shrink-0"
            >
              View Plans
            </button>
          </div>
        </section>

        {/* Section 2: Other Services for [Role] (2x2 Color Box Grid) */}
        <section className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
              Other Services for {activeTab}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              with our curated plans for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Banners (Warm Peach / Yellow #FFF8EC) */}
            <div 
              onClick={() => handleOpenDrawer("Banners")}
              className="bg-[#FFF8EC] border border-[#FDE6BA] rounded-3xl p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xs relative overflow-hidden group hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex-1 space-y-3 z-10">
                <h3 className="text-lg font-bold text-gray-900 font-display">Banners</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Get your brand noticed by property buyers by securing brand space on India's top real estate website
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrawer("Banners");
                  }}
                  className="text-[#0078D4] font-bold text-xs hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Know More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Graphic Illustration */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-100/60 border border-amber-200/80 flex flex-col items-center justify-center shrink-0 p-3 relative group-hover:scale-105 transition-transform">
                <div className="w-16 h-12 bg-amber-400 rounded-lg flex items-center justify-center shadow-xs">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="w-3 h-6 bg-amber-600/70 mt-1 rounded-sm" />
              </div>
            </div>

            {/* Card 2: Featured Listing (Light Sky Blue #F0F9FF) */}
            <div 
              onClick={() => handleOpenDrawer("Featured Listing")}
              className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-3xl p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xs relative overflow-hidden group hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex-1 space-y-3 z-10">
                <h3 className="text-lg font-bold text-gray-900 font-display">Featured Listing</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Provides guaranteed prominence and exposure in preferred locality
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrawer("Featured Listing");
                  }}
                  className="text-[#0078D4] font-bold text-xs hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Know More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Graphic Illustration */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-sky-100/60 border border-sky-200/80 flex items-center justify-center shrink-0 p-3 relative group-hover:scale-105 transition-transform">
                <div className="w-20 h-16 bg-white rounded-xl shadow-sm border border-sky-200 p-2 relative flex flex-col justify-between">
                  <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-12 h-1.5 bg-sky-500 rounded-full" />
                    <div className="w-8 h-1 bg-sky-200 rounded-full" />
                  </div>
                  <span className="absolute top-2 right-2 text-[7px] font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded">
                    Featured
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Featured Project (Warm Light Orange #FFF5E6) */}
            <div 
              onClick={() => handleOpenDrawer("Featured Project")}
              className="bg-[#FFF5E6] border border-[#FFD8A8] rounded-3xl p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xs relative overflow-hidden group hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex-1 space-y-3 z-10">
                <h3 className="text-lg font-bold text-gray-900 font-display">Featured Project</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Recommended product for getting new booking buyer leads for the primary clients
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrawer("Featured Project");
                  }}
                  className="text-[#0078D4] font-bold text-xs hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Know More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Graphic Illustration */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-orange-100/60 border border-orange-200/80 flex flex-col items-center justify-end shrink-0 p-2 relative group-hover:scale-105 transition-transform">
                <div className="w-14 h-20 bg-orange-400 rounded-t-xl p-1.5 flex flex-col items-center justify-between shadow-xs">
                  <Star className="w-4 h-4 fill-white text-white mt-1" />
                  <div className="grid grid-cols-2 gap-1 w-full px-1">
                    <div className="h-1.5 bg-white/70 rounded-xs" />
                    <div className="h-1.5 bg-white/70 rounded-xs" />
                    <div className="h-1.5 bg-white/70 rounded-xs" />
                    <div className="h-1.5 bg-white/70 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Premium Plan (Soft Blue #EFF6FF) */}
            <div 
              onClick={() => handleOpenDrawer("Premium Plan")}
              className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-3xl p-6 sm:p-8 flex items-start justify-between gap-4 shadow-xs relative overflow-hidden group hover:shadow-md transition-all cursor-pointer select-none"
            >
              <div className="flex-1 space-y-3 z-10">
                <h3 className="text-lg font-bold text-gray-900 font-display">Premium Plan</h3>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Let your property stand out from the crowd with larger display on search results and added animation to attract buyers
                </p>
                <div className="text-xs font-extrabold text-blue-700">₹899 Onwards</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrawer("Premium Plan");
                  }}
                  className="text-[#0078D4] font-bold text-xs hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Know More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Graphic Illustration */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-100/60 border border-blue-200/80 flex items-center justify-center shrink-0 p-3 relative group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center shadow-md relative">
                  <Building className="w-6 h-6 text-white" />
                  <div className="absolute -bottom-2 w-12 h-5 bg-blue-800 rounded-md flex items-center justify-center text-[9px] font-black uppercase">
                    ⭐ Premium
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Benefits Checklist Container ("WHY UPGRADE MY POSTING?") */}
        <section className="bg-[#FFFBF2] border border-[#FDE3B5] rounded-3xl p-8 sm:p-12 shadow-xs text-center flex flex-col items-center gap-8">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-500 bg-amber-100/70 px-3 py-1 rounded-full">
              WHY UPGRADE MY POSTING?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">
              Benefits of upgrading your posting on Sparrows
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
            {/* Benefit 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900 font-display">
                01. Appear higher in searches
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Upgraded postings appear higher in search results giving your posting more views and responses
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900 font-display">
                02. Hassle free selling/renting
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Relax and sell faster with our dedicated relationship manager assistance
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/subscription")}
            className="text-xs font-bold text-gray-900 hover:text-[#0078D4] transition-colors cursor-pointer inline-flex items-center gap-1.5 group"
          >
            <span>View {activeTab.toLowerCase()} plans to sell house faster</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

      </main>

      {/* Slide-over Drawer Popup matching media_1789386187538.png & media_1789386202353.png */}
      {selectedServiceKey && activeService && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Box */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between p-6 sm:p-8 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                {activeService.title}
              </h2>
              <button
                onClick={handleCloseDrawer}
                className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600 hover:text-gray-900 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Body Bullets matching reference screenshot */}
            <div className="flex-1 py-6 space-y-6 overflow-y-auto">
              {activeService.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  {/* Light Blue Circle with Checkmark matching screenshot */}
                  <div className="w-9 h-9 rounded-full bg-[#EBF5FF] text-[#0078D4] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs mt-0.5">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                    {bullet}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom Footer Action */}
            <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleGetCallback(activeService.title)}
                className="w-full py-3.5 px-6 bg-[#42b85d] hover:bg-[#369a4d] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Get a callback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST INFORMATION Modal Popup */}
      <RequestInformationModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        serviceName={requestServiceName}
        defaultClass={activeTab}
      />

      {/* Footer for Desktop */}
      <DesktopFooter />

      {/* Mobile Bottom Navigation Bar */}
      {!isDesktop && <BottomNav />}
    </div>
  );
}
