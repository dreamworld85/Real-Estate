import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, User } from "lucide-react";
import { adminApi, AdminUser } from "@/lib/adminApi";

const filterTabs = [
  { label: "All Users", value: "All" },
  { label: "Owners Only", value: "Owner" },
  { label: "Brokers Only", value: "Broker" },
  { label: "Agencies Only", value: "Agency" },
];

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getUsers(search, activeTab);
        setUsers(data);
      } catch (err) {
        setError("Failed to load user directory.");
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">User Accounts</h2>
        <p className="text-xs text-slate mt-0.5">Manage and inspect registered platform accounts.</p>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-charcoal/10 px-4 py-3 shadow-sm">
        <Search size={16} className="text-slate/60" />
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs outline-none text-charcoal placeholder:text-slate/40"
        />
      </div>

      {/* Segments Filter Carousel */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold border whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab.value
                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                : "bg-white border-charcoal/10 text-charcoal hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users List Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-xs text-slate py-6 text-center">Loading accounts directory...</p>
        ) : error ? (
          <p className="text-xs text-coral py-6 text-center">{error}</p>
        ) : users.length > 0 ? (
          users.map((user) => (
            <Link
              key={user.id}
              to={`/admin/users/${user.id}`}
              className="flex items-center justify-between p-4 bg-white border border-charcoal/5 rounded-2xl shadow-sm hover:border-emerald-600/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  user.is_disabled ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600"
                }`}>
                  <User size={18} />
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-ink truncate">{user.name}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      user.role === "Agency"
                        ? "bg-purple-50 text-purple-600 border border-purple-100"
                        : user.role === "Broker"
                        ? "bg-teal-50 text-teal-600 border border-teal-100"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {user.role || "Owner"}
                    </span>
                    {user.is_disabled === 1 && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                        Suspended
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {user.phone && <span>Mobile: {user.phone}</span>}
                    {user.phone && user.email && <span className="text-slate/40 select-none">•</span>}
                    {user.email && <span>Email: {user.email}</span>}
                    {!user.phone && !user.email && <span>No contact info</span>}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate/40 shrink-0" />
            </Link>
          ))
        ) : (
          <div className="text-center py-10 bg-white border border-charcoal/4 rounded-2xl">
            <p className="text-xs text-slate font-medium">No registered accounts match search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
