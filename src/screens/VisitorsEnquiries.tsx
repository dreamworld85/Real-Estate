import { useEffect, useState } from "react";
import { Eye, MessageSquare } from "lucide-react";
import { api, ApiDashboardStats } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function VisitorsEnquiries() {
  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.fetchMyStats().then(setStats).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pb-28">
      <Header title="Visitors & Enquiries" showBack />

      <div className="px-4 pt-2">
        {loading && <p className="text-sm text-slate">Loading…</p>}
        {error && <p className="text-sm text-coral">{error}</p>}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-1.5">
                <Eye size={20} className="text-ink" />
                <p className="font-display font-extrabold text-2xl text-ink">{stats.totalViews}</p>
                <p className="text-xs text-slate">Total Views</p>
              </div>
              <div className="bg-white rounded-2xl shadow-card p-4 flex flex-col items-center gap-1.5">
                <MessageSquare size={20} className="text-forest" />
                <p className="font-display font-extrabold text-2xl text-ink">{stats.totalEnquiries}</p>
                <p className="text-xs text-slate">Total Enquiries</p>
              </div>
            </div>

            <h2 className="font-display font-bold text-ink mt-6 mb-3">Recent Visitors</h2>
            {stats.recentVisitors.length === 0 && (
              <p className="text-sm text-slate">No enquiries yet — they'll show up here.</p>
            )}
            <div className="flex flex-col gap-3">
              {stats.recentVisitors.map((v, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-card p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-display font-semibold text-charcoal text-sm">{v.visitorName}</p>
                    <p className="text-xs text-slate mt-0.5">{v.propertyTitle}</p>
                    {v.visitorLocation && <p className="text-xs text-slate">{v.visitorLocation}</p>}
                  </div>
                  <span className="text-xs text-slate shrink-0">{formatDateTime(v.enquiredAt)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
