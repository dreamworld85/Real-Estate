import { useEffect, useState } from "react";
import { TrendingUp, BarChart3, MapPin } from "lucide-react";
import { adminApi, AdminAnalytics } from "@/lib/adminApi";

export default function Analytics() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const stats = await adminApi.getAnalytics();
        setData(stats);
      } catch (err) {
        setError("Failed to load analytics details.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) return <p className="px-4 py-8 text-sm text-slate">Loading analytics details...</p>;
  if (error || !data) return <p className="px-4 py-8 text-sm text-coral">{error || "Failed to load analytics."}</p>;

  // Find max value in user growth to scale height of line/bar
  const maxGrowthValue = Math.max(...data.userGrowth.map((g) => g.value)) || 1;
  const maxCategoryCount = Math.max(...data.categories.map((c) => c.count)) || 1;
  const maxLocationCount = Math.max(...data.locations.map((l) => l.count)) || 1;

  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">System Analytics</h2>
        <p className="text-xs text-slate mt-0.5">Platform growth dynamics and category stats.</p>
      </div>

      {/* User Growth Line Chart Mockup */}
      <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-ink">User Growth (Active)</span>
          </div>
          <span className="text-[9px] font-bold text-slate bg-slate-100 px-2 py-0.5 rounded">This Week</span>
        </div>

        {/* Visual Bar Graph */}
        <div className="h-32 flex items-end gap-3.5 border-b border-charcoal/8 pb-1 pt-4">
          {data.userGrowth.map((g) => {
            const pct = (g.value / maxGrowthValue) * 100;
            return (
              <div key={g.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
                <span className="text-[8px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {g.value}
                </span>
                <div 
                  style={{ height: `${pct * 0.7 + 10}%` }}
                  className="w-full bg-emerald-500 rounded-t-lg group-hover:bg-emerald-600 transition-all shadow-inner"
                />
                <span className="text-[9px] font-semibold text-slate mt-0.5">{g.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories Progress Bars */}
      <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-sky-600" />
          <span className="text-xs font-bold text-ink">Top Property Categories</span>
        </div>
        <div className="flex flex-col gap-3">
          {data.categories.map((cat) => (
            <div key={cat.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span className="text-charcoal">{cat.name}</span>
                <span className="text-ink">{cat.count} listings</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                  className="h-full bg-sky-500 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Locations Progress Bars */}
      <div className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-purple-600" />
          <span className="text-xs font-bold text-ink">Top Listing Districts</span>
        </div>
        <div className="flex flex-col gap-3">
          {data.locations.map((loc) => (
            <div key={loc.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px] font-semibold">
                <span className="text-charcoal">{loc.name}</span>
                <span className="text-ink">{loc.count} listings</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  style={{ width: `${(loc.count / maxLocationCount) * 100}%` }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
