import { useEffect, useState } from "react";
import { Eye, MessageSquare, Phone, MessageCircle, Lock, AlertCircle, Sparkles } from "lucide-react";
import { api, ApiDashboardStats } from "@/lib/api";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import SubscriptionPaywallModal from "@/components/SubscriptionPaywallModal";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function VisitorsEnquiries() {
  const { user, login } = useAuth();
  const [stats, setStats] = useState<ApiDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  async function loadStats() {
    try {
      const data = await api.fetchMyStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard insights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const isBrokerOrAgency = user?.role === "Broker" || user?.role === "Agency";
  const isSubscribed = user?.subscriptionStatus === "active";

  return (
    <div className="min-h-screen pb-28 bg-slate-50/50">
      <Header title="Visitors & Enquiries" showBack />

      <div className="px-4 pt-2 flex flex-col gap-4">
        {/* Banner Alert for Free Trial/Upgrade */}
        {!isSubscribed && stats && (
          <div className={`p-4 rounded-3xl border flex gap-3 shadow-sm ${
            !stats.hasTrial 
              ? "bg-rose-50 border-rose-100 text-rose-800" 
              : "bg-amber-50 border-amber-100 text-amber-800"
          }`}>
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 font-display">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                {!stats.hasTrial ? "Trial Expired / Access Gated" : `Free Trial Active`}
              </h4>
              <p className="text-[11px] leading-relaxed mt-1 font-sans">
                {!stats.hasTrial 
                  ? "Make payment to see details of who contacted or viewed your property. Paid users can access liked leads." 
                  : `Free Trial Active: ${stats.remainingDays} days remaining. Upgrade now to secure permanent access to client phone numbers.`}
              </p>
              <button 
                onClick={() => setShowPaywall(true)}
                className="mt-2.5 px-3 py-1.5 bg-ink text-cream text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer hover:bg-black shadow-sm"
              >
                <Sparkles size={11} /> Upgrade to Premium
              </button>
            </div>
          </div>
        )}

        {loading && <p className="text-xs text-slate px-2 font-medium">Loading insights...</p>}
        {error && <p className="text-xs text-coral px-2 font-bold">{error}</p>}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white border border-charcoal/5 rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1.5">
                <div className="p-2 bg-slate-50 rounded-xl text-ink">
                  <Eye size={18} />
                </div>
                <p className="font-display font-extrabold text-2xl text-ink">{stats.totalViews}</p>
                <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Total Views</p>
              </div>
              <div className="bg-white border border-charcoal/5 rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1.5">
                <div className="p-2 bg-emerald-50 rounded-xl text-forest">
                  <MessageSquare size={18} />
                </div>
                <p className="font-display font-extrabold text-2xl text-forest">{stats.totalEnquiries}</p>
                <p className="text-[10px] font-bold text-slate uppercase tracking-wider">Total Enquiries</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <h2 className="font-display font-extrabold text-sm text-ink uppercase tracking-wider">Recent Visitors</h2>
              {isBrokerOrAgency && !isSubscribed && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/10">
                  {stats.isTrialExpired ? "Locked" : "Trial Active"}
                </span>
              )}
            </div>

            {stats.recentVisitors.length === 0 && (
              <div className="bg-white border border-charcoal/5 rounded-3xl p-6 text-center shadow-sm">
                <p className="text-xs text-slate font-medium">No enquiries yet — they'll show up here.</p>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              {stats.recentVisitors.map((v, i) => {
                const waText = encodeURIComponent(`Hi ${v.visitorName}, thank you for your enquiry on "${v.propertyTitle}" via Kerala Realty!`);
                return (
                  <div key={i} className="bg-white border border-charcoal/5 rounded-3xl p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-display font-extrabold text-sm text-charcoal truncate ${
                            v.isLocked ? "filter blur-[4.5px] select-none pointer-events-none" : ""
                          }`}>
                            {v.visitorName}
                          </p>
                          {v.isLocked && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold text-rose-500 bg-rose-50 border border-rose-500/10 px-1.5 py-0.5 rounded-full uppercase">
                              <Lock size={8} /> Locked
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate mt-0.5 truncate">{v.propertyTitle}</p>
                        <p className={`text-[10px] text-slate/60 font-semibold truncate ${
                          v.isLocked ? "filter blur-[4.5px] select-none pointer-events-none mt-1" : "mt-0.5"
                        }`}>
                          {v.isLocked ? "locked@keralarealty.com" : v.visitorEmail}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate/40 shrink-0">{formatDateTime(v.enquiredAt)}</span>
                    </div>

                    <div className="flex gap-2 border-t border-charcoal/4 pt-3 mt-0.5">
                      {v.isLocked ? (
                        <>
                          <button
                            onClick={() => setShowPaywall(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 bg-ink hover:bg-black text-cream font-display font-bold text-xs shadow-sm cursor-pointer animate-pulse-slow"
                          >
                            <Phone size={13} /> Call Locked
                          </button>
                          <button
                            onClick={() => setShowPaywall(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 border border-forest text-forest font-display font-bold text-xs hover:bg-forest/5 cursor-pointer"
                          >
                            <MessageCircle size={13} /> WhatsApp
                          </button>
                        </>
                      ) : (
                        <>
                          <a
                            href={v.visitorPhone ? `tel:${v.visitorPhone}` : undefined}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 bg-ink hover:bg-black text-cream font-display font-bold text-xs shadow-sm"
                          >
                            <Phone size={13} /> Call Lead
                          </a>
                          {v.visitorPhone && (
                            <a
                              href={`https://wa.me/${v.visitorPhone.replace(/\D/g, "")}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 border border-forest text-forest font-display font-bold text-xs hover:bg-forest/5"
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showPaywall && (
        <SubscriptionPaywallModal
          onClose={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            if (user) {
              login(localStorage.getItem("kr_token") || "", {
                ...user,
                subscriptionStatus: "active"
              });
            }
            loadStats();
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
