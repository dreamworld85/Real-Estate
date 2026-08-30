import { Download, ShieldCheck, Smartphone, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ApkDownload() {
  return (
    <div className="min-h-screen w-full bg-[#FAF8F3] flex flex-col items-center justify-center p-4 sm:p-6 font-display">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 shadow-xl border border-charcoal/5 flex flex-col gap-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="w-9 h-9 rounded-full bg-sage flex items-center justify-center text-forest hover:bg-forest hover:text-white transition-colors">
            <ChevronLeft size={20} className="stroke-[2.5]" />
          </Link>
          <span className="text-[11px] font-extrabold text-gold bg-gold/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Official Android APK
          </span>
        </div>

        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-forest rounded-2xl flex items-center justify-center text-white shadow-lg shadow-forest/20 mb-3">
            <Smartphone size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-black text-ink tracking-tight">
            Download Sparrows App
          </h1>
          <p className="text-xs font-semibold text-slate mt-1 max-w-[280px]">
            Mobile-first Real Estate & Property Management for Kerala
          </p>
        </div>

        {/* User App APK Card */}
        <div className="bg-sage/70 rounded-2xl p-4 border border-forest/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-forest flex items-center gap-2">
              <span>📱 Sparrows User App</span>
            </h2>
            <span className="text-[10px] font-bold text-slate bg-white px-2 py-0.5 rounded-md shadow-2xs">v1.0.0</span>
          </div>
          <p className="text-[11px] text-charcoal/80 font-medium leading-relaxed">
            Browse properties, search listings, contact owners directly via Call/WhatsApp, and manage your listings.
          </p>
          <a
            href="/sparrows.apk"
            download
            className="w-full bg-forest hover:bg-emerald-800 text-cream py-3 rounded-xl text-xs font-black tracking-wide shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Download size={14} className="stroke-[3]" />
            <span>Download Sparrows APK (~5.7 MB)</span>
          </a>
        </div>

        {/* Admin App APK Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>🛡️ Sparrows Admin App</span>
            </h2>
            <span className="text-[10px] font-bold text-slate bg-white px-2 py-0.5 rounded-md shadow-2xs">v1.0.0</span>
          </div>
          <p className="text-[11px] text-charcoal/80 font-medium leading-relaxed">
            Admin mobile dashboard for approving property listings, user control, and system analytics.
          </p>
          <a
            href="/sparrows-admin.apk"
            download
            className="w-full bg-white hover:bg-sage text-ink border-2 border-ink py-2.5 rounded-xl text-xs font-extrabold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Download size={14} className="stroke-[3]" />
            <span>Download Admin APK (~5.7 MB)</span>
          </a>
        </div>

        {/* Installation Instructions */}
        <div className="bg-white rounded-2xl p-4 border border-charcoal/5 shadow-2xs flex flex-col gap-2">
          <h3 className="text-xs font-black text-ink flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-forest stroke-[2.5]" />
            <span>Installation Guide</span>
          </h3>
          <ol className="text-[11px] text-slate font-medium space-y-1.5 pl-4 list-decimal">
            <li>Download the <strong>.apk</strong> file to your device.</li>
            <li>Tap the downloaded file to install.</li>
            <li>If prompted, enable <em>"Install from unknown sources"</em>.</li>
            <li>Launch the app and enjoy!</li>
          </ol>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link to="/" className="text-xs font-extrabold text-forest hover:underline">
            Return to Web Application
          </Link>
        </div>

      </div>
    </div>
  );
}
