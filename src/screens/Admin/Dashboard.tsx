import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  UserCheck, 
  FileWarning, 
  Send,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { adminApi, AdminStats, AdminLog } from "@/lib/adminApi";

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, logsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getLogs("All", ""),
        ]);
        setStats(statsData);
        setLogs(logsData.slice(0, 4)); // Show recent 4 logs
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <p className="px-4 py-8 text-sm text-slate">Loading dashboard details...</p>;
  }

  if (error || !stats) {
    return <p className="px-4 py-8 text-sm text-coral">{error || "Failed to load dashboard."}</p>;
  }

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-600 bg-blue-50", trend: `+${stats.usersSignedToday || 0} signed in today`, path: "/admin/users" },
    { label: "Total Properties", value: stats.properties, icon: Building2, color: "text-emerald-600 bg-emerald-50", trend: `+${stats.propertiesPostedToday || 0} posted today`, path: "/admin/properties" },
    { label: "Pending Approvals", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50", trend: stats.pending > 0 ? "Needs action" : "Up to date", path: "/admin/properties?status=Pending" },
    { label: "Reported Listings", value: stats.reports, icon: AlertTriangle, color: "text-rose-600 bg-rose-50", trend: stats.reports > 0 ? "Needs review" : "Clear", path: "/admin/reports" },
  ];

  return (
    <div className="px-4 md:px-6 py-5 flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-slate-50 border border-charcoal/5 text-ink rounded-3xl p-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Workspace Overview</span>
          <h2 className="font-display font-extrabold text-xl md:text-2xl mt-1 text-black">Welcome back, Admin</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Here is what is happening today at Sparrows Property.</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <TrendingUp size={140} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stats & Controls */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Grid Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <button 
                  key={card.label} 
                  onClick={() => navigate(card.path)}
                  className="bg-white border border-charcoal/5 rounded-2xl p-4 flex flex-col justify-between shadow-sm text-left hover:border-emerald-500/20 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer w-full min-h-[120px]"
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-[10px] font-bold text-slate uppercase tracking-wider leading-tight">{card.label}</span>
                    <div className={`p-2 rounded-xl shrink-0 ${card.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-display font-extrabold text-2xl text-ink leading-none">{card.value}</h3>
                    <p className="text-[9px] font-semibold text-slate mt-1.5 truncate">{card.trend}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-ink tracking-wide font-display">Quick Controls</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <button 
                onClick={() => navigate("/admin/properties")}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white border border-charcoal/5 shadow-sm hover:border-emerald-600/20 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckSquare size={16} />
                </div>
                <span className="text-[10px] font-bold text-ink leading-tight">Approve Listings</span>
              </button>
              <button 
                onClick={() => navigate("/admin/users")}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white border border-charcoal/5 shadow-sm hover:border-emerald-600/20 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                <div className="p-2.5 rounded-full bg-blue-50 text-blue-600">
                  <UserCheck size={16} />
                </div>
                <span className="text-[10px] font-bold text-ink leading-tight">Manage Users</span>
              </button>
              <button 
                onClick={() => navigate("/admin/reports")}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white border border-charcoal/5 shadow-sm hover:border-emerald-600/20 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                <div className="p-2.5 rounded-full bg-rose-50 text-rose-600">
                  <FileWarning size={16} />
                </div>
                <span className="text-[10px] font-bold text-ink leading-tight">Review Reports</span>
              </button>
              <button 
                onClick={() => navigate("/admin/settings")}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white border border-charcoal/5 shadow-sm hover:border-emerald-600/20 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer"
              >
                <div className="p-2.5 rounded-full bg-amber-50 text-amber-600">
                  <Send size={16} />
                </div>
                <span className="text-[10px] font-bold text-ink leading-tight">Settings Panel</span>
              </button>
              <button 
                onClick={() => navigate("/admin/role-upgrades")}
                className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white border border-charcoal/5 shadow-sm hover:border-emerald-600/20 hover:shadow-md active:scale-95 transition-all text-center cursor-pointer animate-pulse-slow col-span-2 sm:col-span-1"
              >
                <div className="p-2.5 rounded-full bg-teal-50 text-teal-600">
                  <ShieldCheck size={16} />
                </div>
                <span className="text-[10px] font-bold text-ink leading-tight">Role Upgrades</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Stream */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink tracking-wide font-display">Audit Activity Stream</span>
            <Link to="/admin/logs" className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 hover:underline">
              View All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="flex flex-col gap-3.5 bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm h-full max-h-[360px] overflow-y-auto no-scrollbar">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-charcoal/4 last:border-0 pb-3 last:pb-0">
                  <div className={`p-2 rounded-lg text-xs mt-0.5 shrink-0 ${
                    log.category === "Users" ? "bg-blue-50 text-blue-600" :
                    log.category === "Properties" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                  }`}>
                    <Clock size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink leading-snug">{log.action}</p>
                    <span className="text-[9px] text-slate mt-1 block">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate py-6 text-center italic">No recent activities logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
