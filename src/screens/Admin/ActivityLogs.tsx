import { useEffect, useState } from "react";
import { Search, Clock, ShieldAlert, Eye, PhoneCall, FileText } from "lucide-react";
import { adminApi, AdminLog } from "@/lib/adminApi";

const categories = ["All", "Users", "Properties", "System"];

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState<"audit" | "visitors">("audit");
  
  // Audit Logs State
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Visitor Logs State
  const [visitorLogs, setVisitorLogs] = useState<{ propertyViews: any[]; contactClicks: any[] }>({
    propertyViews: [],
    contactClicks: [],
  });
  const [visitorFilter, setVisitorFilter] = useState<"all" | "views" | "contacts">("all");
  const [loadingVisitors, setLoadingVisitors] = useState(false);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  // Load System Audit Logs
  useEffect(() => {
    if (activeTab !== "audit") return;
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
  }, [selectedCategory, search, activeTab]);

  // Load Visitor Views & Inquiries Logs
  useEffect(() => {
    if (activeTab !== "visitors") return;
    setLoadingVisitors(true);
    setVisitorError(null);
    adminApi.getActivityLogs()
      .then((data) => {
        setVisitorLogs(data);
      })
      .catch((err) => {
        console.error(err);
        setVisitorError("Failed to load visitor activity logs.");
      })
      .finally(() => {
        setLoadingVisitors(false);
      });
  }, [activeTab]);

  // Process combined visitor activities list
  const combinedVisitorLogs = [
    ...visitorLogs.propertyViews.map((pv) => ({
      id: `view-${pv.id}`,
      type: "view",
      title: pv.visitor_name || `Guest Visitor`,
      detail: `viewed listing: "${pv.property_title}"`,
      time: pv.viewed_at,
      metadata: pv.user_agent || "No device metadata available",
      subText: pv.visitor_email ? `Email: ${pv.visitor_email}` : `IP Address: ${pv.ip_address || "Unknown"}`
    })),
    ...visitorLogs.contactClicks.map((cc) => ({
      id: `click-${cc.id}`,
      type: "contact",
      title: cc.user_name || "Registered User",
      detail: `clicked to reveal contact details for: "${cc.property_title}"`,
      time: cc.created_at,
      metadata: `Action Category: Lead Click`,
      subText: `User Email: ${cc.user_email || "N/A"}`
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Filter combined lists
  const filteredVisitorLogs = combinedVisitorLogs.filter((log) => {
    if (visitorFilter === "views") return log.type === "view";
    if (visitorFilter === "contacts") return log.type === "contact";
    return true;
  });

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      {/* Page Header */}
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">System Activity & Visitor Logs</h2>
        <p className="text-xs text-slate mt-0.5">Audit transaction history and trace user listing engagement logs.</p>
      </div>

      {/* Tab Switch Segment */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-max self-start gap-1">
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-5 py-2 rounded-xl text-xs font-bold font-display transition-all ${
            activeTab === "audit"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate hover:text-black"
          }`}
        >
          System Audit Logs
        </button>
        <button
          onClick={() => setActiveTab("visitors")}
          className={`px-5 py-2 rounded-xl text-xs font-bold font-display transition-all ${
            activeTab === "visitors"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate hover:text-black"
          }`}
        >
          Visitor Listing Logs
        </button>
      </div>

      {/* RENDER TAB 1: System Audit Logs */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-charcoal/10 px-4 py-3 shadow-sm">
            <Search size={16} className="text-slate/60" />
            <input
              type="text"
              placeholder="Search audit actions..."
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
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all flex-shrink-0 cursor-pointer ${
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
      )}

      {/* RENDER TAB 2: Visitor Engagement Logs */}
      {activeTab === "visitors" && (
        <div className="flex flex-col gap-4">
          {/* Sub Filters segments */}
          <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
            {(["all", "views", "contacts"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setVisitorFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all flex-shrink-0 cursor-pointer ${
                  visitorFilter === filter
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "bg-white border-charcoal/10 text-charcoal hover:bg-slate-50"
                }`}
              >
                {filter === "all" ? "All Visitor Logs" : filter === "views" ? "Property Views Only" : "Contact Enquiries"}
              </button>
            ))}
          </div>

          {/* Visitor Logs Stream */}
          <div className="bg-white border border-charcoal/5 p-4 rounded-3xl shadow-sm flex flex-col gap-4">
            {loadingVisitors ? (
              <p className="text-xs text-slate py-8 text-center">Loading visitor logs...</p>
            ) : visitorError ? (
              <p className="text-xs text-coral py-8 text-center">{visitorError}</p>
            ) : filteredVisitorLogs.length > 0 ? (
              filteredVisitorLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-charcoal/4 last:border-0 pb-3.5 last:pb-0">
                  <div className={`p-2 rounded-xl text-xs mt-0.5 ${
                    log.type === "view" ? "bg-sky-50 text-sky-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {log.type === "view" ? <Eye size={15} /> : <PhoneCall size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink leading-relaxed">
                      <span className="font-extrabold text-charcoal">{log.title}</span> {log.detail}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate/50 font-semibold">
                      <span className="text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded font-black border border-emerald-600/10">
                        {log.subText}
                      </span>
                      <span>•</span>
                      <span>{new Date(log.time).toLocaleString()}</span>
                    </div>
                    {log.type === "view" && (
                      <p className="text-[9px] text-slate/40 mt-1 italic font-medium truncate max-w-sm lg:max-w-xl">
                        Browser: {log.metadata}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate py-10 text-center">No visitor log data recorded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
