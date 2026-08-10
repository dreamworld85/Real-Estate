import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Home, Heart, MessageSquare, BarChart3, Pencil, Settings, LogOut, ChevronRight, CreditCard, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import BottomNav from "@/components/BottomNav";

const menuItems = [
  { icon: Home, label: "My Properties", path: "/my-properties" },
  { icon: Heart, label: "Saved Properties", path: "/saved" },
  { icon: MessageSquare, label: "My Enquiries", path: "/visitors-enquiries" },
  { icon: BarChart3, label: "Visitors & Insights", path: "/visitors-enquiries" },
  { icon: CreditCard, label: "Subscription", path: "/subscription" },
  { icon: Pencil, label: "Edit Profile", path: "/profile/edit" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, login, logout } = useAuth();
  const [switchStatus, setSwitchStatus] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (token) {
      api.fetchMyProfile()
        .then((updatedUser) => {
          login(token, updatedUser);
        })
        .catch((err) => console.error("Failed to refresh user profile:", err));
    }
  }, [token]);

  const [requestedRole, setRequestedRole] = useState<"Broker" | "Agency">("Broker");

  useEffect(() => {
    if (user?.role?.toLowerCase() === "broker") {
      setRequestedRole("Agency");
    } else {
      setRequestedRole("Broker");
    }
  }, [user]);

  useEffect(() => {
    if (user?.role && user?.role.toLowerCase() !== "user") {
      api.fetchRoleSwitchStatus()
        .then((data) => {
          if (data) {
            setSwitchStatus(data.status);
          }
        })
        .catch((err) => console.error("Failed to fetch upgrade request status:", err));
    }
  }, [user]);

  const handleRequestUpgrade = async () => {
    setRequesting(true);
    try {
      await api.requestRoleSwitch(requestedRole);
      setSwitchStatus("Pending");
      alert(`Role switch request to ${requestedRole} submitted to admin successfully!`);
    } catch (err: any) {
      alert(err.message || "Failed to submit upgrade request");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-cream">
      <header className="px-4 pt-6 pb-5 flex items-center gap-4 bg-white border-b border-charcoal/5">
        <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center border border-charcoal/10 shadow-inner">
          <UserIcon size={28} className="text-forest" />
        </div>
        <div>
          <p className="font-display font-bold text-lg text-ink">{user?.name || "Your Name"}</p>
          <p className="text-xs text-slate mt-0.5">{user?.phone || user?.email}</p>
          <div className="flex gap-2 items-center mt-1.5">
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-600/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user?.role?.toLowerCase() === "user" ? "Buyer" : user?.role || "Owner"}
            </span>
            {user?.subscriptionStatus === "active" && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-600/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Premium
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Upgrade request section for Locked Roles */}
      {user?.role && user?.role.toLowerCase() !== "user" && user?.role.toLowerCase() !== "agency" && (
        <div className="mx-4 mt-4 bg-white rounded-3xl p-4 border border-charcoal/5 shadow-sm flex flex-col gap-2.5 font-display">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Role Switch Request</span>
          {switchStatus === "Pending" ? (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 rounded-xl p-3 border border-amber-600/10">
              <ShieldAlert size={16} className="shrink-0" />
              <p className="text-xs font-semibold">Switch request is pending Admin Approval.</p>
            </div>
          ) : switchStatus === "Approved" ? (
            <div className="bg-emerald-50 text-emerald-700 rounded-xl p-3 border border-emerald-600/10 text-xs font-semibold">
              Your request was approved!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate">Submit a switch request to change your current locked role to Broker or Agency.</p>
              
              {user.role?.toLowerCase() === "owner" && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-charcoal">Request Change To:</label>
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as any)}
                    className="rounded-lg border border-charcoal/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-charcoal outline-none focus:border-black"
                  >
                    <option value="Broker">Broker</option>
                    <option value="Agency">Agency</option>
                  </select>
                </div>
              )}
              
              {switchStatus === "Rejected" && (
                <p className="text-xs font-bold text-rose-500">Your previous request was rejected. You can apply again.</p>
              )}
              <button
                disabled={requesting}
                onClick={handleRequestUpgrade}
                className="w-full py-2.5 px-4 rounded-xl bg-ink hover:bg-black text-cream text-xs font-bold shadow-md cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {requesting ? "Submitting..." : `Request switch to ${requestedRole}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Trial & Inquiry Status Card */}
      {user?.role && (user.role?.toLowerCase() !== "user" || user.hasTrial || (user.inquiryCount || 0) >= 20) && (
        <div className="mx-4 mt-4 bg-white rounded-3xl p-4 border border-charcoal/5 shadow-sm flex flex-col gap-2 font-display">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Account Status & Limits</span>
            {user?.subscriptionStatus === "active" ? (
              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-600/10 uppercase tracking-widest">Premium Active</span>
            ) : user?.hasTrial ? (
              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-600/10 uppercase tracking-widest">Free Trial</span>
            ) : user?.role?.toLowerCase() === "user" ? (
              <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-600/10 uppercase tracking-widest">Buyer Limits</span>
            ) : (
              <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-600/10 uppercase tracking-widest">Expired / Gated</span>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-xs font-bold text-ink">
                {user?.subscriptionStatus === "active" ? (
                  "Your premium subscription is currently active."
                ) : user?.hasTrial ? (
                  `Free Trial Active: ${user.remainingDays} day(s) remaining`
                ) : user?.role?.toLowerCase() === "user" ? (
                  (user?.inquiryCount || 0) >= 20 
                    ? "Free Inquiries Limit Reached (20/20)"
                    : `Free Inquiries: ${20 - (user?.inquiryCount || 0)} / 20 remaining`
                ) : (
                  "Your trial has expired. Upgrade to restore premium privileges."
                )}
              </p>
              <p className="text-[10px] text-slate/75 mt-0.5 font-sans">
                {user?.subscriptionStatus === "active" ? (
                  "Permanent direct contacts & lead visibility enabled."
                ) : user?.hasTrial ? (
                  "All premium features are fully unlocked during your trial."
                ) : user?.role?.toLowerCase() === "user" ? (
                  (user?.inquiryCount || 0) >= 20
                    ? "Upgrade to Premium to continue unlocking listing contact details."
                    : "You can click Call/WhatsApp to reveal direct contacts."
                ) : (
                  "Direct calling, WhatsApp shortcuts, and visitor details are locked."
                )}
              </p>
            </div>
            
            {/* Prominent Payment Button: Conditional Visibility (Hidden when trial/inquiries are active) */}
            {user?.subscriptionStatus !== "active" && (
              <>
                {(user?.hasTrial ? false : (user?.role?.toLowerCase() === "user" ? (user?.inquiryCount || 0) >= 20 : true)) && (
                  <button
                    onClick={() => navigate("/subscription")}
                    className="px-3.5 py-2 bg-ink hover:bg-black text-cream text-[10px] font-extrabold rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer shrink-0 ml-4"
                  >
                    Subscribe Now
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="px-4 mt-5 flex flex-col gap-2">
        {menuItems.map(({ icon: Icon, label, path }) => {
          const isSubscriptionItem = label === "Subscription";
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex items-center justify-between bg-white rounded-2xl shadow-card px-4 py-3.5"
            >
              <span className="flex items-center gap-3 text-charcoal font-medium text-[15px]">
                <Icon size={18} className="text-ink" /> {label}
              </span>
              <div className="flex items-center gap-2">
                {isSubscriptionItem && (
                  <>
                    {user?.subscriptionStatus === "active" ? (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-600/10 uppercase tracking-wider">
                        Premium Active
                      </span>
                    ) : user?.hasTrial ? (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-600/10 uppercase tracking-wider">
                        Free Trial: {user.remainingDays} days left
                      </span>
                    ) : (user?.role === "Broker" || user?.role === "Agency") ? (
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-600/10 uppercase tracking-wider">
                        Trial Expired
                      </span>
                    ) : null}
                  </>
                )}
                <ChevronRight size={16} className="text-slate" />
              </div>
            </button>
          );
        })}

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-3 text-coral font-medium text-[15px] px-4 py-3.5 mt-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
