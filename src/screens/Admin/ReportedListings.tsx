import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle, ChevronRight, Eye } from "lucide-react";
import { adminApi, AdminReport } from "@/lib/adminApi";

export default function ReportedListings() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  async function loadReports() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getReports();
      setReports(data);
    } catch (err) {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleResolve(id: number) {
    setActionBusyId(id);
    try {
      await adminApi.resolveReport(id);
      await loadReports(); // Reload
    } catch (err) {
      alert("Failed to resolve report.");
    } finally {
      setActionBusyId(null);
    }
  }

  const pendingReports = reports.filter((r) => r.status === "Pending");
  const resolvedReports = reports.filter((r) => r.status === "Resolved");

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">Reported Listings</h2>
        <p className="text-xs text-slate mt-0.5">Review property postings reported by user accounts.</p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-ink tracking-wide font-display">Pending Review ({pendingReports.length})</span>
        {loading ? (
          <p className="text-xs text-slate py-4 text-center">Loading reports list...</p>
        ) : error ? (
          <p className="text-xs text-coral py-4 text-center">{error}</p>
        ) : pendingReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingReports.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-rose-200/60 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-rose-300 transition-all"
              >
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600 mt-0.5 shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Reported</span>
                      <span className="text-[9px] text-slate">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xs font-bold text-ink mt-1 truncate">{r.property_title}</h3>
                    <p className="text-[10px] text-slate mt-1 italic leading-relaxed truncate">
                      Reason: "{r.reason}"
                    </p>
                    <p className="text-[9px] text-slate/75 mt-1.5 font-medium">Reporter: {r.reporter_name}</p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-charcoal/5 pt-3 mt-1">
                  <Link
                    to={`/admin/properties/${r.property_id}`}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold text-charcoal transition-colors border border-charcoal/5"
                  >
                    <Eye size={13} /> View Listing
                  </Link>
                  <button
                    disabled={actionBusyId === r.id}
                    onClick={() => handleResolve(r.id)}
                    className="flex-[2] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1 text-[10px] font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    <CheckCircle size={13} /> Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white border border-charcoal/4 rounded-2xl">
            <p className="text-xs text-slate font-medium">All reports reviewed! Clean queue.</p>
          </div>
        )}
      </div>

      {resolvedReports.length > 0 && (
        <div className="flex flex-col gap-3 mt-4">
          <span className="text-xs font-bold text-slate tracking-wide font-display">Resolved Reports ({resolvedReports.length})</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resolvedReports.map((r) => (
              <div
                key={r.id}
                className="bg-white/80 border border-charcoal/5 p-4 rounded-2xl flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">{r.property_title}</p>
                    <p className="text-[9px] text-slate mt-0.5 truncate">Resolved reason: {r.reason}</p>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate uppercase bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  Resolved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
