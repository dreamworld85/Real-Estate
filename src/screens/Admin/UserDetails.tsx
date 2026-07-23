import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, ShieldAlert, Trash2, Ban, ShieldCheck, ChevronLeft } from "lucide-react";
import { adminApi, AdminUser } from "@/lib/adminApi";

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      try {
        const data = await adminApi.getUserDetails(id);
        setUser(data);
      } catch (err) {
        setError("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [id]);

  async function handleToggleStatus() {
    if (!user || !id) return;
    setBusy(true);
    try {
      const nextDisabled = user.is_disabled !== 1;
      await adminApi.updateUserStatus(id, nextDisabled);
      setUser({ ...user, is_disabled: nextDisabled ? 1 : 0 });
    } catch (err) {
      alert("Failed to update account status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteUser() {
    if (!user || !id) return;
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete user "${user.name}"? This action is permanent!`);
    if (!confirmDelete) return;

    setBusy(true);
    try {
      await adminApi.deleteUser(id);
      navigate("/admin/users");
    } catch (err) {
      alert("Failed to delete user account.");
      setBusy(false);
    }
  }

  if (loading) return <p className="px-4 py-8 text-sm text-slate">Loading profile details...</p>;
  if (error || !user) return <p className="px-4 py-8 text-sm text-coral">{error || "User not found."}</p>;

  const statCards = [
    { label: "Active Listings", value: user.listings || 0 },
    { label: "Enquiries Made", value: user.enquiries || 0 },
    { label: "Saved Properties", value: user.saved || 0 },
    { label: "Reviews", value: user.reviews || 0, path: `/admin/users/${id}/reviews` },
  ];

  return (
    <div className="px-4 py-5 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate("/admin/users")}
          className="p-1 hover:bg-slate-100 rounded-full transition-all"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
        <div>
          <h2 className="font-display font-extrabold text-lg text-black">User Profile Inspector</h2>
          <p className="text-[10px] text-slate mt-0.5 uppercase tracking-wider font-bold">User Details</p>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white border border-charcoal/5 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-display font-bold text-xl mb-3 shadow-inner">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <h3 className="font-display font-extrabold text-base text-ink">{user.name}</h3>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
            user.is_disabled ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}>
            {user.is_disabled ? "Suspended" : "Active"}
          </span>
        </div>
        <p className="text-[10px] text-slate font-medium mt-1">Registered: {new Date(user.created_at).toLocaleDateString()}</p>

        {/* Contact details list */}
        <div className="w-full border-t border-charcoal/5 pt-4 mt-4 flex flex-col gap-2.5 text-left">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate">Email Address</span>
            <span className="font-semibold text-charcoal">{user.email || "Not provided"}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate">Phone Line</span>
            <span className="font-semibold text-charcoal">{user.phone || "Not provided"}</span>
          </div>
        </div>
      </div>

      {/* User statistics boxes */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-ink tracking-wide font-display">User Activity Metrics</span>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((c) => {
            const isClickable = !!c.path;
            const CardTag = isClickable ? "button" : "div";
            return (
              <CardTag
                key={c.label}
                onClick={c.path ? () => navigate(c.path) : undefined}
                className={`bg-white border border-charcoal/5 p-4 rounded-2xl flex flex-col shadow-sm text-left transition-all ${
                  isClickable ? "hover:border-emerald-500/25 hover:shadow-md active:scale-[0.98] cursor-pointer" : ""
                }`}
              >
                <span className="text-[10px] font-bold text-slate uppercase tracking-wider">{c.label}</span>
                <span className="font-display font-extrabold text-lg text-ink mt-2">{c.value}</span>
              </CardTag>
            );
          })}
        </div>
      </div>

      {/* Properties Posted / Updated */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-ink tracking-wide font-display">Properties Posted / Updated</span>
        {user.properties && user.properties.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {user.properties.map((p) => (
              <div 
                key={p.id} 
                onClick={() => navigate(`/admin/properties/${p.id}`)}
                className="bg-white border border-charcoal/5 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:border-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer text-left"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-display font-extrabold text-sm text-ink">{p.title}</span>
                  <span className="text-[10px] text-slate">{p.location} • ₹{p.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    p.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    p.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    "bg-slate-50 text-slate-600 border border-slate-200"
                  }`}>
                    {p.status}
                  </span>
                  <ChevronLeft size={14} className="rotate-180 text-slate/50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate italic bg-slate-50 border border-charcoal/5 rounded-2xl p-4 text-center">
            No properties posted or updated by this user.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-ink tracking-wide font-display">Administrative Controls</span>
        <div className="flex flex-col gap-2.5">
          <button
            disabled={busy}
            onClick={handleToggleStatus}
            className={`w-full py-4 rounded-xl flex items-center justify-between px-5 font-semibold text-xs transition-all active:scale-[0.99] border ${
              user.is_disabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <span className="flex items-center gap-2">
              {user.is_disabled ? <ShieldCheck size={16} /> : <Ban size={16} />}
              {user.is_disabled ? "Restore Account Access" : "Suspend Account Access"}
            </span>
            <ChevronLeft size={16} className="rotate-180 opacity-60" />
          </button>
          
          <button
            disabled={busy}
            onClick={handleDeleteUser}
            className="w-full py-4 rounded-xl flex items-center justify-between px-5 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-100 transition-all active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <Trash2 size={16} />
              Delete Account Permanently
            </span>
            <ChevronLeft size={16} className="rotate-180 opacity-60" />
          </button>
        </div>
      </div>
    </div>
  );
}
