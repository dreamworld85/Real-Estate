import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, Mail, Building2 } from "lucide-react";
import { api, ApiPublicProfile, ApiProperty } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function AgencyProfile() {
  const { id } = useParams();
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

  return (
    <div className="min-h-screen pb-28">
      <Header title="Agent / Agency" showBack />

      <div className="px-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-sage flex items-center justify-center shrink-0">
            <Building2 size={28} className="text-forest" />
          </div>
          <div>
            <p className="font-display font-bold text-lg text-ink">{profile.name}</p>
            <p className="text-sm text-slate">{profile.location || "Kerala"}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-2xl shadow-card p-3.5 text-center">
            <p className="font-display font-bold text-lg text-ink">{profile.totalListings}</p>
            <p className="text-xs text-slate mt-0.5">Listings</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-3.5 text-center">
            <p className="font-display font-bold text-lg text-ink">{profile.distinctEnquirers}</p>
            <p className="text-xs text-slate mt-0.5">Happy Clients</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-3.5 text-center">
            <p className="font-display font-bold text-lg text-ink">{profile.yearsActive}</p>
            <p className="text-xs text-slate mt-0.5">Years Active</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <a
            href={profile.phone ? `tel:${profile.phone}` : undefined}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 bg-ink text-cream font-display font-semibold text-[15px]"
          >
            <Phone size={16} /> Call
          </a>
          <a
            href={profile.email ? `mailto:${profile.email}` : undefined}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl py-3.5 border border-ink/20 text-ink font-display font-semibold text-[15px]"
          >
            <Mail size={16} /> Email
          </a>
        </div>

        <h2 className="font-display font-bold text-ink mt-7 mb-3">Active Listings</h2>
        {listings.length === 0 && <p className="text-sm text-slate">No active listings yet.</p>}
        <div className="flex flex-col gap-4">
          {listings.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
