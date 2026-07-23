import { useEffect, useState } from "react";
import { Search, Clock, ShieldAlert } from "lucide-react";
import { adminApi, AdminLog } from "@/lib/adminApi";

const categories = ["All", "Users", "Properties", "System"];

export default function ActivityLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getLogs(selectedCategory, search);
        setLogs(data);
      } catch (err) {
        setError("Failed to load activity logs.");
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadLogs, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, search]);

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">Audit Activity Logs</h2>
        <p className="text-xs text-slate mt-0.5">Real-time system transaction history feed.</p>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-charcoal/10 px-4 py-3 shadow-sm">
        <Search size={16} className="text-slate/60" />
        <input
          type="text"
          placeholder="Search activity events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs outline-none text-charcoal placeholder:text-slate/40"
        />
      </div>

      {/* Categories segments */}
      <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
              selectedCategory === cat
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : "bg-white border-charcoal/10 text-charcoal hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Logs Stream */}
      <div className="bg-white border border-charcoal/5 p-4 rounded-3xl shadow-sm flex flex-col gap-3.5">
        {loading ? (
          <p className="text-xs text-slate py-6 text-center">Loading audit feed...</p>
        ) : error ? (
          <p className="text-xs text-coral py-6 text-center">{error}</p>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 border-b border-charcoal/4 last:border-0 pb-3 last:pb-0">
              <div className={`p-2 rounded-xl text-xs mt-0.5 ${
                log.category === "Users" ? "bg-blue-50 text-blue-600" :
                log.category === "Properties" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
              }`}>
                {log.category === "System" ? <ShieldAlert size={14} /> : <Clock size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink leading-relaxed">{log.action}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate/60 font-semibold uppercase">
                  <span>{log.category}</span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate py-8 text-center">No logs recorded for this category.</p>
        )}
      </div>
    </div>
  );
}
