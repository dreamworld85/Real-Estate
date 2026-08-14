import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone, Download, X } from "lucide-react";
import { api, ApiMobileShareSettings, mediaUrl } from "@/lib/api";

interface AppDownloadInterstitialProps {
  propertyTitle?: string;
  onMaybeLater: () => void;
}

const FALLBACK_LOGO = (
  <div className="w-10 h-10 bg-forest rounded-2xl flex items-center justify-center text-white shadow-md">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  </div>
);

export default function AppDownloadInterstitial({ propertyTitle, onMaybeLater }: AppDownloadInterstitialProps) {
  const [settings, setSettings] = useState<ApiMobileShareSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    api.fetchMobileShareSettings()
      .then((data) => setSettings(data))
      .catch((err) => console.error("Failed to fetch settings:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !settings) {
    return (
      <div className="h-screen w-full max-w-[420px] mx-auto bg-[#FAF8F3] flex items-center justify-center p-6 shadow-md">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate">Loading preview details...</p>
        </div>
      </div>
    );
  }

  const handleStoreRedirect = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const storeUrl = isAndroid ? settings.google_play_url : settings.app_store_url;
    window.open(storeUrl || "https://play.google.com/store", "_blank");
  };

  return (
    <div className="h-screen w-full max-w-[420px] mx-auto bg-[#FAF8F3] flex flex-col justify-between p-6 select-none shadow-md overflow-hidden relative font-display">
      
      {/* 1. TOP SECTION: Brand Logo/Text & Tagline */}
      <div className="flex flex-col items-center text-center mt-3 animate-fadeIn">
        <div className="mb-2">
          {settings.brand_logo_url ? (
            <img 
              src={mediaUrl(settings.brand_logo_url)} 
              alt={settings.brand_name} 
              className="w-auto object-contain animate-pulse-subtle"
              style={{ height: "5.5rem" }}
            />
          ) : (
            FALLBACK_LOGO
          )}
        </div>

        <h1 className="text-xl font-extrabold text-forest tracking-tight leading-none">
          {settings.brand_name}
        </h1>
        <p className="text-[10px] text-slate-500 font-bold tracking-wide mt-1.5">
          {settings.tagline}
        </p>

        {propertyTitle && (
          <div className="mt-2.5 bg-forest/5 text-forest text-[9px] font-black px-2 py-0.5 rounded-full border border-forest/10 shadow-sm inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-forest rounded-full animate-ping" />
            <span>Shared Listing: {propertyTitle}</span>
          </div>
        )}
      </div>

      {/* 2. MIDDLE SECTION: Center Illustration & Quote */}
      <div className="flex flex-col items-center text-center my-auto py-4">
        {/* Dynamic Center Illustration */}
        <div className="my-5 w-full flex justify-center">
          {settings.illustration_url ? (
            <img 
              src={mediaUrl(settings.illustration_url)} 
              alt="Illustration" 
              className="w-auto object-contain rounded-2xl animate-float"
              style={{ height: "10rem", maxHeight: "10rem" }}
            />
          ) : (
            <div className="w-28 h-28 rounded-[28px] bg-white border border-charcoal/5 flex items-center justify-center shadow-md relative">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-slate-100 opacity-60 filter blur-[1px]" />
              <div className="absolute -bottom-2 -right-3 w-10 h-10 rounded-full bg-emerald-50 opacity-50 filter blur-[1px]" />
              <div className="w-12 h-20 border-[3px] border-forest/15 rounded-2xl flex items-center justify-center bg-slate-50 shadow-inner">
                <Smartphone size={28} className="text-forest/80 stroke-[2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gold text-ink text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                ★
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-700 font-bold max-w-[240px] leading-relaxed">
          {settings.description_quote}
        </p>
      </div>

      {/* 3. BOTTOM SECTION: Primary CTA Button & Trust Badge */}
      <div className="flex flex-col items-center text-center mb-3 w-full">
        <button 
          onClick={() => setShowPromptModal(true)}
          className="w-full bg-forest hover:bg-emerald-800 text-cream py-3.5 rounded-2xl text-xs font-black tracking-wide shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <Download size={14} className="stroke-[3]" />
          <span>{settings.button_text}</span>
        </button>

        <div className="text-[10px] font-bold text-slate-500 mt-3.5 flex items-center justify-center gap-1.5 bg-white border border-charcoal/5 px-4 py-1.5 rounded-full shadow-sm">
          <ShieldCheck size={12} className="text-forest stroke-[2.5]" />
          <span>{settings.trust_text}</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BOTTOM SHEET INTERACTIVE MODAL OVERLAY (DIMMED & BLURRED BACKDROP) */}
      {/* ============================================================== */}
      {showPromptModal && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px] flex flex-col justify-end animate-fadeIn">
          {/* Backdrop Touch Dismiss handler */}
          <div 
            onClick={() => setShowPromptModal(false)}
            className="flex-1 cursor-pointer"
          />
          
          {/* Bottom Sheet wrapper */}
          <div className="bg-white rounded-t-[28px] p-6 shadow-[0_-10px_35px_rgb(0,0,0,0.22)] pb-8 flex flex-col gap-4 relative animate-slideUp border-t border-slate-100">
            
            {/* Sheet Handle */}
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto" />

            {/* Close Button */}
            <button 
              onClick={() => setShowPromptModal(false)}
              className="absolute right-5 top-5 p-1 rounded-full hover:bg-slate-50 transition-colors text-slate-400 hover:text-ink cursor-pointer"
            >
              <X size={16} className="stroke-[2.5]" />
            </button>

            {/* Prompt Icon Circle */}
            <div className="w-12 h-12 rounded-full bg-forest/10 text-forest flex items-center justify-center mx-auto mt-2 shadow-inner">
              <Download size={20} className="stroke-[3]" />
            </div>

            {/* Modal Heading & Subtext */}
            <div className="text-center px-1">
              <h3 className="text-sm font-extrabold text-ink leading-tight font-display">
                Open this property in {settings.brand_name} App
              </h3>
              <p className="text-[10px] text-slate/75 mt-2 font-semibold leading-relaxed font-display max-w-[280px] mx-auto">
                For the best experience and to view all property details, download the {settings.brand_name} app.
              </p>
            </div>

            {/* Official Store Badge buttons */}
            <div className="flex flex-col items-center gap-3.5 mt-3 px-2">
              {/* Google Play Store Badge Button */}
              <a 
                href={settings.google_play_url}
                target="_blank"
                rel="noreferrer"
                onClick={handleStoreRedirect}
                className="w-full flex justify-center active:scale-95 transition-all"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="h-[40px] w-[135px] object-contain shadow-sm rounded-lg hover:shadow transition-shadow"
                />
              </a>

              {/* Apple App Store Badge Button */}
              <a 
                href={settings.app_store_url}
                target="_blank"
                rel="noreferrer"
                onClick={handleStoreRedirect}
                className="w-full flex justify-center active:scale-95 transition-all"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store" 
                  className="h-[40px] w-[135px] object-contain shadow-sm rounded-lg hover:shadow transition-shadow"
                />
              </a>

            </div>

            {/* Maybe Later link to close and return to landing */}
            <button 
              onClick={() => setShowPromptModal(false)}
              className="text-[10px] font-black text-slate-500 hover:text-ink text-center underline mt-3.5 transition-colors cursor-pointer"
            >
              Maybe later
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
