import React from "react";
import { Link } from "react-router-dom";
import { Download, Smartphone, ShieldCheck, ArrowLeft, CheckCircle2, Building2 } from "lucide-react";

export default function ApkDownload() {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col justify-between p-4 sm:p-6 md:p-10 text-[#22302E]">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-[#1B5E4F] hover:text-[#0F3D3E] font-medium transition-colors">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B5E4F] flex items-center justify-center text-white">
            <Building2 size={18} />
          </div>
          <span className="font-bold text-lg text-[#0F3D3E]">Sparrows</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1B5E4F]/10 text-[#1B5E4F] text-xs font-semibold uppercase tracking-wider mb-4">
            <Smartphone size={14} /> Android App Downloads
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F3D3E] mb-3">
            Download Sparrows Mobile Apps
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
            Access location-aware search, instant push notifications, real-time chats, and property management directly on your Android device.
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* User App */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#1B5E4F]/10 text-[#1B5E4F] flex items-center justify-center mb-5">
                <Smartphone size={28} />
              </div>
              <h2 className="text-xl font-bold text-[#0F3D3E] mb-2">Sparrows User App</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                For buyers, tenants, and property owners. Browse Kerala properties, contact sellers directly, and receive real-time alerts.
              </p>
              <div className="space-y-2 mb-8 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#1B5E4F]" />
                  <span>Version 1.0 (Android APK)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#1B5E4F]" />
                  <span>Size: ~5.7 MB</span>
                </div>
              </div>
            </div>

            <a
              href="/apk/sparrows.apk"
              download="sparrows.apk"
              className="w-full py-3.5 px-5 bg-[#1B5E4F] hover:bg-[#0F3D3E] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download size={18} />
              <span>Download Sparrows App</span>
            </a>
          </div>

          {/* Admin App */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[#0F3D3E]/10 text-[#0F3D3E] flex items-center justify-center mb-5">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-xl font-bold text-[#0F3D3E] mb-2">Sparrows Admin App</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                For administrators and moderation teams. Manage users, moderate listings, handle role upgrade requests, and review reports.
              </p>
              <div className="space-y-2 mb-8 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0F3D3E]" />
                  <span>Version 1.0 (Admin APK)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#0F3D3E]" />
                  <span>Size: ~5.7 MB</span>
                </div>
              </div>
            </div>

            <a
              href="/apk/sparrows-admin.apk"
              download="sparrows-admin.apk"
              className="w-full py-3.5 px-5 bg-[#0F3D3E] hover:bg-[#082223] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download size={18} />
              <span>Download Admin App</span>
            </a>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="mt-12 max-w-xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-gray-200 text-xs text-gray-600 space-y-2">
          <div className="font-semibold text-gray-800 text-sm mb-1">📱 How to Install APK on Android:</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the download button above for the app you need.</li>
            <li>Once downloaded, tap the APK file in your notification bar or Downloads folder.</li>
            <li>If prompted, allow <strong>"Install from Unknown Sources"</strong> in your Android settings.</li>
            <li>Tap <strong>Install</strong> and launch the app!</li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-gray-500 border-t border-gray-200/60 mt-8">
        &copy; {new Date().getFullYear()} Sparrows Kerala Realty. All rights reserved.
      </footer>
    </div>
  );
}
