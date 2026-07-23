import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, Eye, Check, X, Building2 } from "lucide-react";
import { adminApi, AdminProperty } from "@/lib/adminApi";
import { mediaUrl } from "@/lib/api";

const statusTabs = [
  { label: "All Listings", value: "All" },
  { label: "Pending Approvals", value: "Pending" },
  { label: "Approved Listings", value: "Active" },
  { label: "Rejected Listings", value: "Rejected" },
];

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setActiveTab(statusParam);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ status: val });
  };

  async function loadProperties() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getProperties(search, activeTab);
      setProperties(data);
    } catch (err) {
      setError("Failed to load property listings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadProperties, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  async function handleApprove(id: number) {
    setActionBusyId(id);
    try {
      await adminApi.updatePropertyStatus(id, "Active");
      await loadProperties(); // Reload
    } catch (err) {
      alert("Failed to approve property.");
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleReject(id: number) {
    setActionBusyId(id);
    try {
      await adminApi.updatePropertyStatus(id, "Rejected");
      await loadProperties(); // Reload
    } catch (err) {
      alert("Failed to reject property.");
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">Property Directory</h2>
        <p className="text-xs text-slate mt-0.5">Approve, reject, or manage uploaded listings.</p>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-charcoal/10 px-4 py-3 shadow-sm">
        <Search size={16} className="text-slate/60" />
        <input
          type="text"
          placeholder="Search by title, location, district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs outline-none text-charcoal placeholder:text-slate/40"
        />
      </div>

      {/* Segments Filter Carousel */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
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

      {/* Listings container */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-xs text-slate py-6 text-center">Loading property listings...</p>
        ) : error ? (
          <p className="text-xs text-coral py-6 text-center">{error}</p>
        ) : properties.length > 0 ? (
          properties.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-charcoal/5 rounded-2xl p-3 flex flex-col gap-3 shadow-sm"
            >
              <Link to={`/admin/properties/${p.id}`} className="flex gap-3 items-start">
                {p.images && p.images[0] ? (
                  <img
                    src={mediaUrl(p.images[0])}
                    alt={p.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Building2 size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      p.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      p.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-rose-50 text-rose-600 border border-rose-100"
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-[10px] text-slate font-medium">{p.propertyType}</span>
                  </div>
                  <h3 className="text-xs font-bold text-ink truncate mt-1 leading-tight">{p.title}</h3>
                  <p className="text-[10px] text-slate/70 mt-0.5 truncate">By: {p.uploader_name || "Owner"}</p>
                  <p className="text-[10px] text-slate mt-0.5 font-semibold">₹{Number(p.price).toLocaleString("en-IN")}</p>
                </div>
                <ChevronRight size={16} className="text-slate/30 mt-4 shrink-0" />
              </Link>

              {/* Action Buttons for Pending Approvals */}
              {p.status === "Pending" && (
                <div className="flex gap-2 border-t border-charcoal/5 pt-2 mt-0.5">
                  <button
                    disabled={actionBusyId === p.id}
                    onClick={() => handleApprove(p.id)}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-700 transition-colors"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    disabled={actionBusyId === p.id}
                    onClick={() => handleReject(p.id)}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-bold text-rose-600 transition-colors"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white border border-charcoal/4 rounded-2xl">
            <p className="text-xs text-slate font-medium">No properties match search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
