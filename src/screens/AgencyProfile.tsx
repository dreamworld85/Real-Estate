import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Phone, MessageCircle, Building2 } from "lucide-react";
import { api, ApiPublicProfile, ApiProperty, mediaUrl } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";

export default function AgencyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiPublicProfile | null>(null);
  const [listings, setListings] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <p className="px-4 py-10 text-sm text-slate">Loading profile…</p>;
  if (error || !profile) return <p className="px-4 py-10 text-sm text-coral">{error || "Profile not found."}</p>;

  const whatsappVal = profile.whatsappNumber || profile.phone || "";
  const cleanWhatsapp = whatsappVal.replace(/\D/g, "");
  const whatsappUrl = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp.startsWith("91") ? cleanWhatsapp : `91${cleanWhatsapp}`}` : undefined;

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
            <div className="flex flex-col gap-4">
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
