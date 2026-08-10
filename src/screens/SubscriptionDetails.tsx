import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../lib/AuthContext";
import { CreditCard, ShieldCheck, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";
import SubscriptionPaywallModal from "../components/SubscriptionPaywallModal";
import { api } from "../lib/api";

export default function SubscriptionDetails() {
  const { user, login } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [premiumPlans, setPremiumPlans] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);

  React.useEffect(() => {
    api.fetchSubscriptionPlans()
      .then((plans) => {
        const myPlans = plans.filter(
          (p) => p.role.toLowerCase() === (user?.role || "").toLowerCase() && p.duration_months > 0
        ).sort((a, b) => a.duration_months - b.duration_months);

        const mapped = myPlans.map((p) => {
          let parsedFeatures: string[] = [];
          try {
            parsedFeatures = typeof p.features === "string" 
              ? JSON.parse(p.features) 
              : (Array.isArray(p.features) ? p.features : []);
          } catch (e) {
            console.error(e);
          }
          return {
            price: Number(p.price),
            discount: Number(p.discount || 0),
            description: p.description || "",
            duration_months: Number(p.duration_months),
            features: parsedFeatures,
          };
        });
        setPremiumPlans(mapped);
      })
      .catch((err) => console.error("Failed to fetch plan details:", err));
  }, [user]);

  // Derive subscription status
  const now = new Date();
  const trialEnds = user?.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const isTrialActive = trialEnds ? trialEnds > now : false;
  const isSubscriptionActive = user?.subscriptionStatus === "active";
  
  // Calculate remaining trial days
  const trialDaysLeft = trialEnds 
    ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Calculate total trial days dynamically from creation date
  const createdDate = (user as any)?.createdAt;
  const totalTrialDays = (createdDate && trialEnds)
    ? Math.max(1, Math.round((trialEnds.getTime() - new Date(createdDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialTitle = totalTrialDays > 0 ? `${totalTrialDays}-Day Free Trial` : "Free Trial Account";

  const handleSubscribeSuccess = () => {
    setShowCheckout(false);
    // Refresh user state by calling login with updated object (in a real app, you'd fetch GET /api/users/me)
    if (user) {
      login(localStorage.getItem("kr_token") || "", {
        ...user,
        subscriptionStatus: "active"
      });
    }
  };

  return (
    <div className="min-h-screen pb-28 bg-cream">
      <Header title="Subscription & Payments" showBack />

      <div className="p-5 flex flex-col gap-5">
        {/* Status Card */}
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate tracking-wider uppercase">Current Status</span>
            {isSubscriptionActive ? (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full select-none">Active Subscriber</span>
            ) : isTrialActive ? (
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full select-none">Trial Account</span>
            ) : (
              <span className="text-[10px] font-bold text-coral bg-coral/5 px-2.5 py-0.5 rounded-full select-none">Plan Expired</span>
            )}
          </div>

          <div className="flex items-center gap-3.5 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-ink/5 text-ink flex items-center justify-center shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-base text-ink leading-tight">
                {isSubscriptionActive 
                  ? "Premium Gold Plan" 
                  : isTrialActive 
                  ? trialTitle 
                  : "No Active Subscription"}
              </h4>
              <p className="text-[11px] text-slate mt-0.5 font-medium">
                {isSubscriptionActive 
                  ? "Billed monthly via Razorpay" 
                  : isTrialActive 
                  ? `${trialDaysLeft} days remaining` 
                  : "Upgrade now to reveal contact information"}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing & Benefit Package */}
        {(!isSubscriptionActive) && premiumPlans.length > 0 && (
          <div className="flex flex-col gap-5">
            {premiumPlans.map((planItem) => {
              const finalPrice = Math.max(0, planItem.price - planItem.discount);
              const durationLabel = 
                planItem.duration_months === 1 ? "1 Month Plan" :
                planItem.duration_months === 6 ? "6 Months Plan" :
                "1 Year Plan";
              const billingPeriodLabel =
                planItem.duration_months === 1 ? "month" :
                planItem.duration_months === 6 ? "6 months" :
                "year";
              
              const isPopular = planItem.duration_months === 6;
              const isBestValue = planItem.duration_months === 12;

              return (
                <div 
                  key={planItem.duration_months} 
                  className={`relative rounded-card p-5 border shadow-sm flex flex-col gap-4 font-display text-left transition-all ${
                    isPopular 
                      ? "border-amber/30 bg-amber/5 shadow-md shadow-amber/5" 
                      : isBestValue
                      ? "border-forest/20 bg-forest/5 shadow-md shadow-forest/5"
                      : "bg-white border-charcoal/5"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-2.5 right-4 bg-amber text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                      ★ Most Popular
                    </span>
                  )}
                  {isBestValue && (
                    <span className="absolute -top-2.5 right-4 bg-forest text-white text-[8px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm select-none">
                      Best Value
                    </span>
                  )}

                  <div className="border-b border-charcoal/5 pb-3.5 flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-display font-extrabold text-[15px] text-ink capitalize flex items-center gap-1.5">
                        {durationLabel}
                      </h4>
                      <p className="text-[10px] text-slate font-medium mt-0.5 leading-snug">{planItem.description || "Premium benefits package"}</p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <span className="font-display font-extrabold text-[20px] text-ink leading-none">₹{finalPrice}</span>
                      <span className="text-[9px] text-slate/75 font-semibold mt-1 bg-charcoal/5 px-1.5 py-0.5 rounded">/{billingPeriodLabel}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 my-1">
                    {planItem.features && planItem.features.length > 0 ? (
                      planItem.features.map((feat: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-charcoal leading-relaxed font-semibold">
                          <CheckCircle2 size={14} className="text-forest shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 text-xs text-charcoal font-semibold">
                          <CheckCircle2 size={14} className="text-forest shrink-0" />
                          <span>Reveal Owner & Broker direct numbers</span>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDuration(planItem.duration_months);
                      setShowCheckout(true);
                    }}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer mt-1 ${
                      isPopular 
                        ? "bg-amber hover:bg-amber/90 text-white shadow-amber/20" 
                        : isBestValue
                        ? "bg-forest hover:bg-forest/90 text-white shadow-forest/20"
                        : "bg-ink hover:bg-black text-cream"
                    }`}
                  >
                    <Sparkles size={13} /> Subscribe to {planItem.duration_months === 1 ? "1 Month" : planItem.duration_months === 6 ? "6 Months" : "1 Year"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {isSubscriptionActive && (
          <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3">
            <h4 className="font-display font-bold text-sm text-ink">Active Plan Details</h4>
            <p className="text-xs text-slate">
              Your subscription is active and managed by Razorpay. Auto-renewals occur monthly on your billing anniversary. You can request cancellations at any time.
            </p>
          </div>
        )}

        {/* Links to policies */}
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3 mt-1">
          <span className="text-[10px] font-bold text-slate tracking-wider uppercase border-b border-slate-100 pb-2 mb-1">
            Billing Information & Terms
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs text-ink font-semibold">
            <Link to="/privacy" className="hover:underline flex items-center gap-1.5 p-1">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:underline flex items-center gap-1.5 p-1">
              Terms of Use
            </Link>
            <Link to="/refund" className="hover:underline flex items-center gap-1.5 p-1">
              Refund Policy
            </Link>
            <Link to="/contact-us" className="hover:underline flex items-center gap-1.5 p-1">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Secure payments indicator */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate/75 mt-2">
          <ShieldCheck size={14} className="text-forest" /> Secured by 256-bit SSL & Razorpay
        </div>
      </div>

      {showCheckout && (
        <SubscriptionPaywallModal 
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSubscribeSuccess}
          initialDuration={selectedDuration}
        />
      )}

      <BottomNav />
    </div>
  );
}
