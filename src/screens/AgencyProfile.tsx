import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Phone, MessageCircle, Building2, ChevronLeft, MapPin } from "lucide-react";
import { api, ApiPublicProfile, ApiProperty, mediaUrl } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import DesktopHeader from "@/components/DesktopHeader";
import DesktopFooter from "@/components/DesktopFooter";
import { useAuth } from "@/lib/AuthContext";

export default function AgencyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiPublicProfile | null>(null);
  const [listings, setListings] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1000);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1000);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.fetchPublicProfile(Number(id)),
      api.fetchProperties({ ownerId: id }),
    ])
      .then(([p, l]) => {
        setProfile(p);
        setListings(l);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
        {isDesktop && <DesktopHeader />}
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm font-semibold text-gray-500">Loading profile…</p>
        </div>
        {isDesktop && <DesktopFooter />}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col">
        {isDesktop && <DesktopHeader />}
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm font-semibold text-rose-500">{error || "Profile not found."}</p>
        </div>
        {isDesktop && <DesktopFooter />}
      </div>
    );
  }

  const whatsappVal = profile.whatsappNumber || profile.phone || "";
  const cleanWhatsapp = whatsappVal.replace(/\D/g, "");
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp.startsWith("91") ? cleanWhatsapp : `91${cleanWhatsapp}`}` : undefined;

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] w-full flex flex-col font-sans select-none relative">
        <DesktopHeader />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 text-left">
          {/* Back button */}
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black transition-colors w-fit cursor-pointer"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {/* Agency Desktop Profile Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-8 animate-fade-in">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 border border-gray-200 shadow-xs">
                {profile.avatarUrl ? (
                  <img
                    src={mediaUrl(profile.avatarUrl)}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 size={36} className="text-slate/60" />
                )}
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200/60 w-fit">
                  {profile.role || "Agent"}
                </span>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 mt-1">{profile.name}</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                  <MapPin size={14} className="text-emerald-600 shrink-0" />
                  <span>{profile.location || "Kerala"}</span>
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="flex items-center gap-6 sm:gap-8 bg-gray-50/80 border border-gray-200/60 rounded-2xl px-6 py-4 self-start lg:self-center">
              <div className="text-center min-w-[70px]">
                <p className="font-display font-black text-2xl text-gray-900 leading-none">{profile.totalListings}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Listings</p>
              </div>
              <div className="h-10 w-[1px] bg-gray-200" />
              <div className="text-center min-w-[70px]">
                <p className="font-display font-black text-2xl text-emerald-600 leading-none">{profile.distinctEnquirers}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Clients</p>
              </div>
              <div className="h-10 w-[1px] bg-gray-200" />
              <div className="text-center min-w-[70px]">
                <p className="font-display font-black text-2xl text-gray-900 leading-none">{profile.yearsActive}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">Years Active</p>
              </div>
            </div>

            {/* Action Buttons */}
            {(user?.hasAccess || user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trial") ? (
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <a
                  href={profile.phone ? `tel:${profile.phone}` : undefined}
                  className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 bg-black text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  <Phone size={15} /> Call Agent
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 bg-emerald-600 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex flex-col items-center text-center gap-2 max-w-xs shrink-0">
                <p className="text-xs font-bold text-gray-900">🔒 Contact Details Locked</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Upgrade your membership plan to unlock direct contact numbers.
                </p>
                <button
                  onClick={() => navigate("/subscription")}
                  className="mt-1 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-[11px] font-bold rounded-xl uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>

          {/* Active Listings Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
              <h2 className="font-display font-bold text-xl text-gray-900 tracking-tight">
                Active Listings by {profile.name} ({listings.length})
              </h2>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-500 font-medium text-sm shadow-xs">
                No active listings posted yet by this agency.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {listings.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </main>

        <DesktopFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-slate-50/50">
      <Header title="Agent / Agency" showBack />

      <div className="px-4 pt-3 flex flex-col gap-4 animate-fade-in">
        {/* Main Profile Card */}
        <div className="bg-white rounded-[24px] border border-charcoal/5 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 border border-charcoal/5">
              {profile.avatarUrl ? (
                <img
                  src={mediaUrl(profile.avatarUrl)}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 size={26} className="text-slate/60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/5">
                {profile.role || "Agent"}
              </span>
              <h2 className="font-display font-extrabold text-[17px] text-ink mt-1.5 truncate">{profile.name}</h2>
              <p className="text-xs text-slate mt-0.5 flex items-center gap-1 font-medium">
                <span>📍</span> {profile.location || "Kerala"}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 border-t border-b border-charcoal/5 py-4">
            <div className="text-center">
              <p className="font-display font-black text-lg text-ink leading-none">{profile.totalListings}</p>
              <p className="text-[9px] font-bold text-slate uppercase tracking-widest mt-1.5">Listings</p>
            </div>
            <div className="text-center border-l border-r border-charcoal/5">
              <p className="font-display font-black text-lg text-emerald-600 leading-none">{profile.distinctEnquirers}</p>
              <p className="text-[9px] font-bold text-slate uppercase tracking-widest mt-1.5">Clients</p>
            </div>
            <div className="text-center">
              <p className="font-display font-black text-lg text-ink leading-none">{profile.yearsActive}</p>
              <p className="text-[9px] font-bold text-slate uppercase tracking-widest mt-1.5">Years Active</p>
            </div>
          </div>

          {/* Action Buttons / Locked Banner */}
          {(user?.hasAccess || user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trial") ? (
            <div className="flex gap-3">
              <a
                href={profile.phone ? `tel:${profile.phone}` : undefined}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3.5 bg-ink text-cream font-display font-bold text-xs uppercase tracking-wider hover:bg-black active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                <Phone size={14} /> Call Agent
              </a>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-3.5 bg-emerald-600 text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
            </div>
          ) : (
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-charcoal/5 flex flex-col items-center text-center gap-2">
              <p className="text-xs font-bold text-ink">🔒 Contact Details Locked</p>
              <p className="text-[10px] text-slate leading-relaxed">
                Your trial period has expired and you have no active plan. Upgrade your plan to view this agent's contact numbers.
              </p>
              <button
                onClick={() => navigate("/subscription")}
                className="mt-1 px-4 py-2 bg-ink hover:bg-black text-cream text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          )}
        </div>

        {/* Listings Section */}
        <div>
          <h3 className="font-display font-extrabold text-[13px] text-ink uppercase tracking-widest mb-3 px-1 mt-2">
            Active Listings
          </h3>
          {listings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-charcoal/5 p-8 text-center text-slate font-medium text-xs shadow-sm">
              No active listings posted yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
