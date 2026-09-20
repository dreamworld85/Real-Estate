import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ShieldCheck, Smartphone, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { api, mediaUrl } from "@/lib/api";

function GooglePlayIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} fill="none">
      <path
        d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9.0.2z"
        fill="#00F076"
      />
      <path
        d="M47 0C44 3.2 42.4 7.7 42.4 13.5v485c0 5.8 1.6 10.3 4.6 13.5l260.6-261L47 0z"
        fill="#00EAFF"
      />
      <path
        d="M325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z"
        fill="#FF3A44"
      />
      <path
        d="M453.7 232.3L385.4 193l-60.1 60.1 60.1 60.1 68.3-39.3c19.5-11.2 19.5-29.6 0-41.6z"
        fill="#FFC400"
      />
    </svg>
  );
}

function AppleIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" className={className} fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14.01-6.74-10.22-12.08-21.85-16.02-34.89-3.94-13.04-5.91-25.26-5.91-36.66 0-14.13 3.58-26.08 10.74-35.84 7.17-9.76 16.29-14.74 27.37-14.94 4.89 0 10.12 1.25 15.69 3.75 5.57 2.5 9.17 3.86 10.81 4.08 2.07-.43 5.92-1.85 11.55-4.25 5.63-2.4 10.63-3.52 15.01-3.37 13.05.65 23.38 5.66 31 15.01-11.53 6.96-17.18 16.63-16.96 29.02.22 9.79 3.96 17.93 11.23 24.42 7.27 6.49 15.86 10.22 25.77 11.2-2.18 6.52-4.68 13.15-7.51 19.89zM119.22 33.02c0-7.39 2.66-14.46 7.99-21.2 5.33-6.74 12.01-11.09 20.04-13.06.65 1.74.98 3.59.98 5.54 0 7.39-2.77 14.73-8.31 22.01-5.54 7.28-12.28 11.53-20.22 12.75-.11-1.96-.48-3.98-.48-6.04z" />
    </svg>
  );
}

export default function MyApp() {
  const navigate = useNavigate();
  const [deviceType, setDeviceType] = useState<"android" | "ios" | "desktop">("desktop");
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [appStoreUrl, setAppStoreUrl] = useState("https://www.apple.com/app-store/");
  const [playStoreUrl, setPlayStoreUrl] = useState("https://play.google.com/store");

  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/Android/i.test(ua)) {
      setDeviceType("android");
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      setDeviceType("ios");
    } else {
      setDeviceType("desktop");
    }

    // Attempt to fetch public dynamic store settings if configured
    fetch("https://api.greensparrows.com/api/admin/app-download-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.app_store_url) setAppStoreUrl(data.app_store_url);
          if (data.google_play_url) setPlayStoreUrl(data.google_play_url);
        }
      })
      .catch(() => {});
  }, []);

  const handleAndroidClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setDownloading("Sparrows Android APK");
    setTimeout(() => setDownloading(null), 4000);
  };

  const handleAppleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (deviceType === "ios") {
      if (appStoreUrl && !appStoreUrl.includes("apple.com/app-store")) {
        window.open(appStoreUrl, "_blank");
      } else {
        setShowIosPrompt(true);
      }
    } else {
      setShowIosPrompt(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between font-display text-charcoal select-none">
      {/* Top Header / Branding */}
      <div className="w-full pt-8 pb-4 px-6 flex flex-col items-center text-center">
        <div 
          onClick={() => navigate("/")}
          className="cursor-pointer flex items-center gap-2.5 mb-5 hover:opacity-90 transition-opacity"
        >
          <img
            src="/brand_logo-web.png"
            alt="Sparrows Logo"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <span className="text-xl font-extrabold text-[#091F40] tracking-tight">Sparrows</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#59AD63]/10 border border-[#59AD63]/25 text-[#2E7D32] text-[11px] font-bold uppercase tracking-wider mb-2">
          <Smartphone size={13} />
          <span>Official Mobile Apps</span>
        </div>

        <h1 className="text-2xl min-[400px]:text-3xl font-extrabold text-[#091F40] tracking-tight max-w-sm leading-snug">
          Get Sparrows on your device
        </h1>
        <p className="text-xs min-[400px]:text-sm text-slate mt-1.5 max-w-xs font-medium leading-relaxed">
          Find your dream home, apartment, land, or villa anywhere in Kerala with instant alerts.
        </p>

        {/* Device Detection Pill */}
        {deviceType === "android" && (
          <div className="mt-4 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Android detected • Tap Google Play to install
          </div>
        )}

        {deviceType === "ios" && (
          <div className="mt-4 px-3.5 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 rounded-full text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Apple iOS device detected
          </div>
        )}
      </div>

      {/* Main Buttons Section (Exact Styling from user image) */}
      <div className="w-full px-6 py-6 flex flex-col items-center gap-4 max-w-md mx-auto">
        {/* Google Play Button */}
        <a
          href="/sparrows.apk"
          download="sparrows.apk"
          onClick={handleAndroidClick}
          className="w-full py-4 px-8 bg-white border-2 border-black rounded-[28px] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-4 cursor-pointer group"
          aria-label="Download on Google Play"
        >
          <GooglePlayIcon className="w-9 h-9 shrink-0 group-hover:scale-105 transition-transform" />
          <span className="text-[26px] sm:text-[28px] font-bold text-black tracking-tight font-sans">
            Google Play
          </span>
        </a>

        {/* App Store Button */}
        <button
          type="button"
          onClick={handleAppleClick}
          className="w-full py-4 px-8 bg-white border-2 border-black rounded-[28px] shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-4 cursor-pointer group"
          aria-label="Download on the App Store"
        >
          <AppleIcon className="w-9 h-9 text-black shrink-0 group-hover:scale-105 transition-transform" />
          <span className="text-[26px] sm:text-[28px] font-bold text-black tracking-tight font-sans">
            App Store
          </span>
        </button>

        {downloading && (
          <div className="w-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-2xl p-3 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in shadow-sm">
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
            <span>Downloading {downloading}... Check your notifications.</span>
          </div>
        )}

        {/* Sparrows Admin App Option */}
        <div className="w-full mt-2 pt-4 border-t border-slate-200/80 flex flex-col items-center">
          <p className="text-[11px] font-bold text-slate/80 uppercase tracking-wider mb-2">
            Are you a Sparrows Administrator?
          </p>
          <a
            href="/sparrows-admin.apk"
            download="sparrows-admin.apk"
            className="w-full py-3 px-5 bg-slate-100 hover:bg-slate-200/80 text-[#091F40] border border-slate-300 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
          >
            <Download size={15} />
            <span>Download Sparrows Admin App (APK)</span>
          </a>
        </div>
      </div>

      {/* Trust & Feature Badges */}
      <div className="w-full px-6 py-6 flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-5 text-xs text-slate font-semibold mb-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#59AD63]" />
            <span>100% Verified & Safe</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <div className="flex items-center gap-1.5">
            <Smartphone size={16} className="text-[#59AD63]" />
            <span>Direct Fast Download</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="text-xs font-bold text-[#091F40] hover:text-[#59AD63] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Continue to Web Version</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* iOS Information Modal */}
      {showIosPrompt && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5 backdrop-blur-xs"
          onClick={() => setShowIosPrompt(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col gap-4 text-left font-display"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <AppleIcon className="w-8 h-8 text-black shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-[#091F40]">Sparrows for Apple iOS</h3>
                <p className="text-[11px] text-slate font-medium">iPhone and iPad Edition</p>
              </div>
            </div>

            <p className="text-xs text-slate leading-relaxed">
              Sparrows is currently available as a progressive mobile web app on iOS with full native capabilities.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col gap-2 text-xs">
              <span className="font-bold text-[#091F40] flex items-center gap-1.5">
                <Info size={14} className="text-sky-600" />
                How to install on iPhone/iPad:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate font-medium text-[11.5px]">
                <li>Tap the <strong>Share</strong> icon in Safari.</li>
                <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                <li>Tap <strong>Add</strong> at top right to open full-screen.</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowIosPrompt(false);
                  navigate("/home");
                }}
                className="flex-1 py-3 bg-[#59AD63] hover:bg-[#3F8F4B] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                Launch Web App
              </button>
              <button
                type="button"
                onClick={() => setShowIosPrompt(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-charcoal rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
