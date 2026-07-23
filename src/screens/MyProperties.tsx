import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Power, Trash2, Star } from "lucide-react";
import { api, ApiProperty, mediaUrl } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import StatusBadge from "@/components/StatusBadge";

type Tab = "All" | ApiProperty["status"];
const tabs: Tab[] = ["All", "Active", "Pending", "Inactive", "Draft"];
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80";

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function MyProperties() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("All");
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function loadProperties() {
    setLoading(true);
    setError(null);
    api
      .fetchMyProperties()
      .then(setProperties)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadProperties, []);

  async function handleToggleActive(p: ApiProperty) {
    setBusyId(p.id);
    try {
      const nextStatus = p.status === "Active" ? "Inactive" : "Active";
      await api.updatePropertyStatus(p.id, nextStatus);
      setProperties((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: nextStatus } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(p: ApiProperty) {
    setBusyId(p.id);
    try {
      await api.deleteProperty(p.id);
      setProperties((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete property");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = properties.filter((p) => tab === "All" || p.status === tab);

  return (
    <div className="min-h-screen pb-28">
      <Header title="My Properties" showBack />

      <div className="px-4 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const count = t === "All" ? properties.length : properties.filter((p) => p.status === t).length;
          const active = t === tab;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-ink text-cream" : "bg-white text-charcoal border border-charcoal/10"
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {loading && <p className="px-4 text-sm text-slate">Loading your properties…</p>}
      {error && <p className="px-4 text-sm text-coral mb-3">{error}</p>}

      <div className="px-4 flex flex-col gap-4">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate text-sm">No properties in "{tab}" yet.</p>
          </div>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-card shadow-card overflow-hidden">
            <button
              onClick={() => navigate(`/my-properties/${p.id}`)}
              className="w-full flex gap-3 p-3 text-left"
            >
              <img
                src={p.images[0] ? mediaUrl(p.images[0]) : FALLBACK_IMAGE}
                alt={p.title}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-ink">{formatPrice(p.price)}</p>
                <p className="text-sm text-charcoal truncate">{p.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={p.status} />
                  <span className="text-xs text-slate flex items-center gap-1">
                    <Eye size={12} /> {p.views} Views
                  </span>
                  {p.avgRating !== undefined && p.avgRating > 0 && (
                    <span className="text-xs text-amber font-semibold flex items-center gap-0.5 ml-1">
                      <Star size={11} className="fill-gold text-gold shrink-0" />
                      <span>{p.avgRating.toFixed(1)} ({p.ratingCount})</span>
                    </span>
                  )}
                </div>
              </div>
            </button>
            <div className="flex border-t border-charcoal/6">
              <button
                onClick={() => navigate(`/my-properties/${p.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-ink border-r border-charcoal/6"
              >
                <Eye size={14} /> View
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-forest border-r border-charcoal/6">
                <Pencil size={14} /> Edit
              </button>
              <button
                disabled={busyId === p.id || p.status === "Pending"}
                onClick={() => handleToggleActive(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-amber border-r border-charcoal/6 disabled:opacity-40"
              >
                <Power size={14} /> {p.status === "Active" ? "Deactivate" : "Activate"}
              </button>
              <button
                disabled={busyId === p.id}
                onClick={() => handleDelete(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-coral disabled:opacity-40"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
