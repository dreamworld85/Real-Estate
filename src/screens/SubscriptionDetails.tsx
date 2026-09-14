import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import DesktopHeader from "../components/DesktopHeader";
import DesktopFooter from "../components/DesktopFooter";
import { useAuth } from "../lib/AuthContext";
import { 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Award,
  ArrowRight,
  Lock,
  Check
} from "lucide-react";
import SubscriptionPaywallModal from "../components/SubscriptionPaywallModal";
import { api } from "../lib/api";

export default function SubscriptionDetails() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [premiumPlans, setPremiumPlans] = useState<any[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1000);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1000);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
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
    if (user) {
      login(localStorage.getItem("kr_token") || "", {
        ...user,
        subscriptionStatus: "active"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] w-full flex flex-col font-sans relative overflow-x-hidden">
      {/* Header based on Laptop / Mobile screen size */}
      {isDesktop ? <DesktopHeader /> : <Header title="Subscription & Payments" showBack />}

      {/* Main Content Area */}
      <main className={isDesktop ? "max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col gap-8 flex-1" : "p-5 flex flex-col gap-5 pb-28 flex-1"}>
        
        {/* Laptop Hero Header */}
        {isDesktop && (
          <div className="text-center space-y-3 py-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0078D4] bg-blue-50 px-3.5 py-1 rounded-full border border-blue-100 inline-block">
              MEMBERSHIP & PRICING PLANS
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-display">
              Choose the Right Plan to Accelerate Your Deals
            </h1>
            <p className="text-sm text-gray-600 font-medium max-w-2xl mx-auto">
              Unlock direct buyer & promoter contact numbers, list unlimited properties, and get guaranteed top visibility across Sparrows Property.
            </p>
          </div>
        )}

        {/* Current Account Status Banner */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF5FF] text-[#0078D4] flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  Current Status
                </span>
                {isSubscriptionActive ? (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Active Subscriber
                  </span>
                ) : isTrialActive ? (
                  <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Trial Account ({trialDaysLeft} days left)
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Plan Expired
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-lg text-gray-900 font-display">
                {isSubscriptionActive 
                  ? "Premium Gold Subscription" 
                  : isTrialActive 
                  ? trialTitle 
                  : "No Active Subscription"}
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                {isSubscriptionActive 
                  ? "Your account enjoys full premium access to buyer contacts and featured listings." 
                  : isTrialActive 
                  ? `Enjoy full trial access. Upgrade before ${trialEnds?.toLocaleDateString()} to keep unmasked buyer contacts.` 
                  : "Upgrade now to reveal direct owner & broker contact numbers and feature your listings."}
              </p>
            </div>
          </div>

          {!isSubscriptionActive && (
            <button
              onClick={() => {
                if (premiumPlans.length > 0) setSelectedDuration(premiumPlans[0].duration_months || 1);
                setShowCheckout(true);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-[#1B5E4F] hover:bg-[#14483d] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer text-center shrink-0 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Upgrade Account</span>
            </button>
          )}
        </div>

        {/* Pricing Packages Section */}
        {(!isSubscriptionActive) && premiumPlans.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">
                Available Membership Plans
              </h2>
              <span className="text-xs text-gray-500 font-medium">Select a plan to proceed</span>
            </div>

            {/* Grid Layout: 3 Columns on Laptop (>= 1000px), 1 Column on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
                    className={`relative rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col justify-between gap-6 transition-all duration-200 bg-white hover:shadow-lg ${
                      isPopular 
                        ? "border-amber-400 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 to-white" 
                        : isBestValue
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/30 to-white"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Badge */}
                    {isPopular && (
                      <span className="absolute -top-3 right-6 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm select-none flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Most Popular
                      </span>
                    )}
                    {isBestValue && (
                      <span className="absolute -top-3 right-6 bg-[#1B5E4F] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm select-none flex items-center gap-1">
                        <Award className="w-3 h-3" /> Best Value
                      </span>
                    )}

                    {/* Package Header */}
                    <div className="space-y-4">
                      <div className="border-b border-gray-100 pb-4 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-lg text-gray-900 font-display">
                            {durationLabel}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">
                            {planItem.description || "Full access subscription package"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-2xl sm:text-3xl font-black text-gray-900 font-display">₹{finalPrice}</span>
                          <span className="text-[10px] text-gray-500 font-bold block">/{billingPeriodLabel}</span>
                        </div>
                      </div>

                      {/* Feature Bullet Points */}
                      <div className="space-y-3 py-2">
                        {planItem.features && planItem.features.length > 0 ? (
                          planItem.features.map((feat: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 font-semibold leading-relaxed">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <span>{feat}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 font-semibold leading-relaxed">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <span>Reveal Owner & Broker direct mobile numbers</span>
                            </div>
                            <div className="flex items-start gap-3 text-xs sm:text-sm text-gray-700 font-semibold leading-relaxed">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                              <span>Priority placement on locality search results</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        setSelectedDuration(planItem.duration_months);
                        setShowCheckout(true);
                      }}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold font-display flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                        isPopular 
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" 
                          : isBestValue
                          ? "bg-[#1B5E4F] hover:bg-[#14483d] text-white shadow-emerald-700/20"
                          : "bg-gray-900 hover:bg-black text-white"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Subscribe to {planItem.duration_months === 1 ? "1 Month" : planItem.duration_months === 6 ? "6 Months" : "1 Year"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isSubscriptionActive && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-2">
            <h4 className="font-extrabold text-base text-gray-900 font-display">Active Plan Details</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Your subscription is active and managed securely via Razorpay. Auto-renewals occur monthly on your billing anniversary. You can request cancellations or modifications at any time through support.
            </p>
          </div>
        )}

        {/* Links to billing & policies */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block border-b border-gray-100 pb-2">
            Billing Information & Terms
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-gray-800">
            <Link to="/privacy" className="hover:text-[#0078D4] transition flex items-center gap-1.5 py-1">
              <span>Privacy Policy</span>
            </Link>
            <Link to="/terms" className="hover:text-[#0078D4] transition flex items-center gap-1.5 py-1">
              <span>Terms of Use</span>
            </Link>
            <Link to="/refund" className="hover:text-[#0078D4] transition flex items-center gap-1.5 py-1">
              <span>Refund Policy</span>
            </Link>
            <Link to="/contact-us" className="hover:text-[#0078D4] transition flex items-center gap-1.5 py-1">
              <span>Contact Us</span>
            </Link>
          </div>
        </div>

        {/* Secure payments indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 py-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured by 256-bit SSL encryption & Razorpay</span>
        </div>
      </main>

      {/* Checkout Modal */}
      {showCheckout && (
        <SubscriptionPaywallModal 
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSubscribeSuccess}
          initialDuration={selectedDuration}
        />
      )}

      {/* Footer rendering: Desktop Footer on Laptop (>= 1000px), Mobile Bottom Nav on Phone */}
      {isDesktop ? <DesktopFooter /> : <BottomNav />}
    </div>
  );
}
