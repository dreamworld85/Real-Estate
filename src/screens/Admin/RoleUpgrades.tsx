import { useEffect, useState } from "react";
import { ShieldAlert, Check, X, ShieldAlert as AlertIcon } from "lucide-react";
import { api } from "@/lib/api";

interface RoleSwitchRequest {
  id: number;
  requested_role: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
}

export default function RoleUpgrades() {
  const [requests, setRequests] = useState<RoleSwitchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("Pending");
  const [actioningId, setActioningId] = useState<number | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    api.adminFetchRoleSwitches()
      .then((data) => setRequests(data))
      .catch((err) => console.error("Failed to fetch role switches:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm("Are you sure you want to approve this upgrade request?")) return;
    setActioningId(id);
    try {
      await api.adminApproveRoleSwitch(id);
      alert("Role upgrade approved successfully!");
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to approve request");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this upgrade request?")) return;
    setActioningId(id);
    try {
      await api.adminRejectRoleSwitch(id);
      alert("Role upgrade request rejected.");
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    } finally {
      setActioningId(null);
    }
  };

  const filteredRequests = requests.filter(r => filter === "All" || r.status === filter);

  return (
    <div className="px-4 py-5 flex flex-col gap-5">
      <div>
        <h2 className="font-display font-extrabold text-xl text-black">Role Upgrades</h2>
        <p className="text-xs text-slate mt-0.5">Review and approve user role upgrade and switch requests.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100/70 border border-charcoal/8 rounded-2xl w-full shadow-sm">
        {(["Pending", "Approved", "Rejected", "All"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`flex-1 py-2 text-center text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
              filter === opt ? "bg-white text-ink shadow-sm" : "text-slate hover:text-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-slate text-center py-10">Loading requests...</p>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white border border-charcoal/5 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-2 text-center">
          <AlertIcon size={24} className="text-slate/40" />
          <p className="text-xs font-semibold text-charcoal">No switch requests found</p>
          <p className="text-[10px] text-slate">Requests will appear here when users request role switch approvals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm flex flex-col gap-3.5 relative"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-bold text-sm text-ink">{req.user_name}</h4>
                  <p className="text-[10px] text-slate font-medium mt-0.5">Phone: {req.user_phone}</p>
                  {req.user_email && (
                    <p className="text-[10px] text-slate font-medium">Email: {req.user_email}</p>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    req.status === "Pending"
                      ? "bg-amber-50 text-amber-700 border-amber-600/10"
                      : req.status === "Approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-600/10"
                      : "bg-rose-50 text-rose-700 border-rose-600/10"
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px]">
                <span className="text-slate font-medium">
                  Requested: <span className="text-charcoal font-bold">{req.requested_role}</span>
                </span>
                <span className="text-slate/60">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>

              {req.status === "Pending" && (
                <div className="flex gap-2.5 mt-1 border-t border-slate-100 pt-3.5">
                  <button
                    disabled={actioningId !== null}
                    onClick={() => handleApprove(req.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    disabled={actioningId !== null}
                    onClick={() => handleReject(req.id)}
                    className="flex-1 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
