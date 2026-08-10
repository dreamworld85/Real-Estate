import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, CreditCard, ChevronRight, Save, DollarSign, Users, TrendingUp, X } from "lucide-react";
import { api } from "@/lib/api";

interface PlanConfig {
  role: "user" | "owner" | "broker" | "agency";
  price: number;
  discount: number;
  description: string;
  duration_months: number;
  features: string[];
}

export default function Subscriptions() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [stats, setStats] = useState<{ user: number; owner: number; broker: number; agency: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"user" | "owner" | "broker" | "agency">("user");

  async function loadData() {
    try {
      const [plansData, statsData] = await Promise.all([
        api.fetchSubscriptionPlans(),
        (api as any).adminFetchSubscriptionStats(),
      ]);

      setPlans(
        plansData.map((p: any) => {
          let parsedFeatures: string[] = [];
          try {
            if (p.features) {
              parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
            }
          } catch (e) {
            console.error("Failed to parse features:", e);
          }
          return {
            role: p.role,
            price: Number(p.price),
            discount: Number(p.discount || 0),
            description: p.description || "",
            duration_months: Number(p.duration_months === 0 ? 0 : (p.duration_months || 1)),
            features: Array.isArray(parsedFeatures) ? parsedFeatures : [],
          };
        })
      );
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || "Failed to load subscription configuration.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePlans = async () => {
    setSaving(true);
    try {
      await api.adminUpdateSubscriptionPlans(plans);
      alert("Subscription plans and dynamic offer discounts updated successfully!");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update subscription plans");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-slate">Loading subscription configurations...</p>;
  }

  if (error) {
    return <p className="p-6 text-sm text-coral font-bold">{error}</p>;
  }

  // Calculate high-level stats for display
  const totalSubscribers = stats ? (stats.user || 0) + (stats.owner || 0) + (stats.broker || 0) + (stats.agency || 0) : 0;
  
  // Calculate projected monthly revenue estimation based on active subscribers & 1-month final price
  const projectedRevenue = ["user", "owner", "broker", "agency"].reduce((acc, role) => {
    const activeCount = stats ? (stats as any)[role] || 0 : 0;
    const plan1M = plans.find(p => p.role === role && p.duration_months === 1);
    const finalPrice = plan1M ? Math.max(0, plan1M.price - plan1M.discount) : 10;
    return acc + (activeCount * finalPrice);
  }, 0);

  const tabs: { role: "user" | "owner" | "broker" | "agency"; label: string }[] = [
    { role: "user", label: "User (Buyer)" },
    { role: "owner", label: "Owner" },
    { role: "broker", label: "Broker" },
    { role: "agency", label: "Agency" },
  ];

  // Filter plans for the active tab, sorted by duration_months ascending (1, 6, 12)
  const currentPlans = plans
    .filter((p) => p.role === activeTab)
    .sort((a, b) => a.duration_months - b.duration_months);

  const activeCount = stats ? (stats as any)[activeTab] || 0 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-black">Subscription & Pricing Panel</h1>
          <p className="text-xs text-slate mt-0.5">Configure live plan pricing, discounts, and offer descriptions for Kerala Realty.</p>
        </div>
        <button
          onClick={handleUpdatePlans}
          disabled={saving}
          className="mt-3 md:mt-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-display shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <Save size={14} />
          {saving ? "Saving Changes..." : "Save Settings"}
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Active Premium Members</span>
            <h3 className="font-display font-extrabold text-xl text-ink mt-0.5">{totalSubscribers} Users</h3>
          </div>
        </div>

        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Est. Monthly Revenue</span>
            <h3 className="font-display font-extrabold text-xl text-emerald-600 mt-0.5">₹{projectedRevenue.toLocaleString("en-IN")}/mo</h3>
          </div>
        </div>

        <div className="bg-white border border-charcoal/5 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Checkout Conversions</span>
            <h3 className="font-display font-extrabold text-xl text-ink mt-0.5 font-sans">Active</h3>
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const selected = activeTab === tab.role;
          return (
            <button
              key={tab.role}
              onClick={() => setActiveTab(tab.role)}
              className={`pb-3.5 px-4 font-display font-bold text-xs border-b-2 transition-all relative shrink-0 cursor-pointer ${
                selected 
                  ? "border-emerald-600 text-emerald-600" 
                  : "border-transparent text-slate/85 hover:text-charcoal"
              }`}
            >
              {tab.label} Settings
            </button>
          );
        })}
      </div>

      {/* Plans Config Cards Grid for selected Tab */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate/60 uppercase tracking-widest">{activeTab} Specific Packages</span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-500/10">
            {activeCount} Active Subscribers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentPlans.map((plan) => {
            const finalPrice = Math.max(0, plan.price - plan.discount);
            const durationLabel = 
              plan.duration_months === 0 ? "Free Trial Plan" :
              plan.duration_months === 1 ? "1 Month Package" :
              plan.duration_months === 6 ? "6 Months Package" :
              "1 Year Package";

            return (
              <div 
                key={`${plan.role}-${plan.duration_months}`} 
                className="bg-white border border-charcoal/5 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-5"
              >
                {/* Card Header */}
                <div className="border-b border-charcoal/5 pb-3">
                  <h3 className="font-display font-extrabold text-base text-ink">{durationLabel}</h3>
                  <p className="text-[10px] font-bold text-slate/60 uppercase tracking-widest mt-0.5">
                    {plan.duration_months === 0 ? "Initial trial limits" : `Duration: ${plan.duration_months} ${plan.duration_months === 1 ? "month" : "months"}`}
                  </p>
                </div>

                {/* pricing details */}
                {plan.duration_months === 0 ? (
                  <div className="flex flex-col justify-center items-center h-20 bg-slate-50 border border-charcoal/4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate/40 uppercase tracking-widest">Pricing Model</span>
                    <span className="font-display font-extrabold text-xs text-emerald-600 mt-1 uppercase tracking-wide">₹0.00 (Free Tier)</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider">Plan Price (₹)</label>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPlans((prev) => {
                              const idxInOriginal = prev.findIndex(p => p.role === plan.role && p.duration_months === plan.duration_months);
                              if (idxInOriginal === -1) return prev;
                              const next = [...prev];
                              next[idxInOriginal] = { ...next[idxInOriginal], price: val };
                              return next;
                            });
                          }}
                          className="w-full border border-charcoal/10 rounded-xl px-3 py-2 text-xs text-charcoal outline-none bg-slate-50 focus:bg-white focus:border-emerald-600 transition-all font-semibold"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider">Discount (₹)</label>
                        <input
                          type="number"
                          value={plan.discount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setPlans((prev) => {
                              const idxInOriginal = prev.findIndex(p => p.role === plan.role && p.duration_months === plan.duration_months);
                              if (idxInOriginal === -1) return prev;
                              const next = [...prev];
                              next[idxInOriginal] = { ...next[idxInOriginal], discount: val };
                              return next;
                            });
                          }}
                          className="w-full border border-charcoal/10 rounded-xl px-3 py-2 text-xs text-charcoal outline-none bg-slate-50 focus:bg-white focus:border-emerald-600 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* discount check */}
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-2xl border border-charcoal/4">
                      <span className="text-[10px] text-slate font-semibold">Checkout Payable:</span>
                      <span className="font-display font-extrabold text-xs text-emerald-600">₹{finalPrice} / duration</span>
                    </div>
                  </>
                )}

                {/* Marketing description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate uppercase tracking-wider">Offer Banner Text / Description</label>
                  <textarea
                    rows={2}
                    value={plan.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlans((prev) => {
                        const idxInOriginal = prev.findIndex(p => p.role === plan.role && p.duration_months === plan.duration_months);
                        if (idxInOriginal === -1) return prev;
                        const next = [...prev];
                        next[idxInOriginal] = { ...next[idxInOriginal], description: val };
                        return next;
                      });
                    }}
                    placeholder="Marketing text displayed in the paywall modal..."
                    className="w-full border border-charcoal/10 rounded-xl px-3.5 py-2.5 text-xs text-charcoal outline-none bg-slate-50 focus:bg-white focus:border-emerald-600 transition-all leading-relaxed font-medium"
                  />
                </div>

                {/* Dynamic features editor */}
                <div className="flex flex-col gap-2.5 mt-2 border-t border-charcoal/5 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate/60 uppercase tracking-widest">Included Features</span>
                    <button
                      onClick={() => {
                        setPlans((prev) => {
                          const idxInOriginal = prev.findIndex(p => p.role === plan.role && p.duration_months === plan.duration_months);
                          if (idxInOriginal === -1) return prev;
                          const next = [...prev];
                          const updatedFeatures = [...(next[idxInOriginal].features || [])];
                          updatedFeatures.push(""); // add blank item
                          next[idxInOriginal] = { ...next[idxInOriginal], features: updatedFeatures };
                          return next;
                        });
                      }}
                      className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-all border border-emerald-500/10 cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {(plan.features || []).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          placeholder="e.g. Premium badge visible"
                          onChange={(e) => {
                            const val = e.target.value;
                            setPlans((prev) => {
                              const idxInOriginal = prev.findIndex(p => p.role === plan.role && p.duration_months === plan.duration_months);
                              if (idxInOriginal === -1) return prev;
                              const next = [...prev];
                              const updatedFeatures = [...next[idxInOriginal].features];
                              updatedFeatures[fIdx] = val;
                              next[idxInOriginal] = { ...next[idxInOriginal], features: updatedFeatures };
                              return next;
                            });
                          }}
                          className="flex-1 border border-charcoal/10 rounded-xl px-2.5 py-1.5 text-xs text-charcoal outline-none bg-slate-50 focus:bg-white focus:border-emerald-600 transition-all font-medium"
                        />
                        <button
                          onClick={() => {
                            setPlans((prev) => {
                              const idxInOriginal = prev.findIndex(p => p.role === plan.role && p.duration_months === plan.duration_months);
                              if (idxInOriginal === -1) return prev;
                              const next = [...prev];
                              const updatedFeatures = next[idxInOriginal].features.filter((_, fi) => fi !== fIdx);
                              next[idxInOriginal] = { ...next[idxInOriginal], features: updatedFeatures };
                              return next;
                            });
                          }}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                          title="Remove feature"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    {(plan.features || []).length === 0 && (
                      <span className="text-[10px] text-slate/60 pl-1 italic">No features defined. Click add to declare.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
