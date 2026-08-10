import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, CheckCircle2, ShieldCheck, Sparkles, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

interface SubscriptionPaywallModalProps {
  onClose: () => void;
  onSuccess: () => void;
  targetRole?: string;
  initialDuration?: number;
}

export default function SubscriptionPaywallModal({
  onClose,
  onSuccess,
  targetRole,
  initialDuration
}: SubscriptionPaywallModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<{ role: string; price: number; discount: number; description: string; duration_months: number; features?: string[] }[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<number>(initialDuration || 1);

  React.useEffect(() => {
    if (initialDuration) {
      setSelectedDuration(initialDuration);
    }
  }, [initialDuration]);

  React.useEffect(() => {
    const activeRole = (targetRole || user?.role || "user").toLowerCase();
    api.fetchSubscriptionPlans()
      .then((data) => {
        const myPlans = data.filter((p) => p.role.toLowerCase() === activeRole && Number(p.duration_months) > 0).map((p: any) => {
          let parsedFeatures: string[] = [];
          try {
            if (p.features) {
              parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
            }
          } catch (e) {
            console.error("Failed to parse paywall features:", e);
          }
          return {
            role: p.role,
            price: Number(p.price),
            discount: Number(p.discount || 0),
            description: p.description || "",
            duration_months: Number(p.duration_months || 1),
            features: Array.isArray(parsedFeatures) ? parsedFeatures : []
          };
        });
        setPlans(myPlans);
      })
      .catch((err) => console.error("Failed to fetch paywall plan details:", err));
  }, [user, targetRole]);

  const activePlan = plans.find((p) => p.duration_months === selectedDuration) || plans.find((p) => p.duration_months === 1) || plans[0];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load payment gateway script. Check your internet connection.");
        setLoading(false);
        return;
      }

      // 1. Create order on backend with selected duration
      const subscription = await api.initiateSubscription(selectedDuration);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: subscription.amount,
        currency: subscription.currency,
        order_id: subscription.id,
        name: "Kerala Realty",
        description: activePlan?.description || "Premium Broker & Buyer Access",
        handler: async function (response: any) {
          try {
            setLoading(true);
            await (api as any).verifySubscription({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              durationMonths: selectedDuration
            });
            alert("Payment Verified! Subscription Activated.");
            onSuccess();
          } catch (err: any) {
            alert("Verification failed: " + (err.message || err));
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#0F3D3E", // Primary Theme color (ink)
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || "Failed to initiate subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-cream rounded-3xl p-6 w-full max-w-[360px] border border-charcoal/10 shadow-2xl relative flex flex-col items-center text-center gap-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100/80 rounded-full text-slate transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>
 
        <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center animate-pulse mt-2 shadow-inner">
          <Lock size={30} />
        </div>
        
        <div>
          <h3 className="font-display font-extrabold text-xl text-ink">Unlock Contact Details</h3>
          <p className="text-xs text-slate mt-1.5 px-2">
            {activePlan?.description || "Your free trial has ended. Subscribe to get unlimited access to properties & owners."}
          </p>
          {activePlan && activePlan.discount > 0 && (
            <div className="inline-block text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full mt-2.5 uppercase tracking-wide border border-emerald-500/10">
              Offer: Save ₹{activePlan.discount} on this package!
            </div>
          )}
        </div>

        {/* Multi-tier Duration Selector */}
        <div className="w-full flex p-1 bg-charcoal/5 rounded-2xl border border-charcoal/5 gap-1 font-display">
          {[
            { months: 1, label: "1 Month" },
            { months: 6, label: "6 Months" },
            { months: 12, label: "1 Year" }
          ].map((opt) => {
            const p = plans.find(plan => plan.duration_months === opt.months);
            const priceVal = p ? Math.max(0, p.price - p.discount) : 10;
            return (
              <button
                key={opt.months}
                onClick={() => setSelectedDuration(opt.months)}
                className={`flex-1 py-2 px-1 text-[11px] font-bold rounded-xl flex flex-col items-center transition-all cursor-pointer ${
                  selectedDuration === opt.months 
                    ? "bg-white text-ink shadow-sm scale-[1.02]" 
                    : "text-slate/85 hover:text-charcoal"
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-80 mt-0.5">₹{priceVal}</span>
              </button>
            );
          })}
        </div>
 
        <div className="w-full bg-white rounded-2xl p-4 border border-charcoal/5 flex flex-col gap-2.5 text-left shadow-sm max-h-[140px] overflow-y-auto">
          {((activePlan as any)?.features || []).map((feat: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs font-bold text-charcoal">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
          {(!activePlan || !(activePlan as any)?.features || (activePlan as any).features.length === 0) && (
            <>
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Bypass Platform Inquiry Limits</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Reveal Owner Direct Contact Numbers</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Instant WhatsApp Communication Shortcuts</span>
              </div>
            </>
          )}
        </div>
 
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3.5 bg-ink hover:bg-black text-cream rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles size={14} /> {loading ? "Initiating..." : `Subscribe Now @ ₹${activePlan ? Math.max(0, activePlan.price - activePlan.discount) : 10}`}
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-2.5 text-xs font-bold text-slate hover:text-charcoal cursor-pointer"
          >
            Go Back
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate/75">
          <ShieldCheck size={13} className="text-forest" /> Secure Checkout via Razorpay
        </div>

        {/* Legal Links */}
        <div className="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[9px] text-slate/60 mt-0.5 border-t border-slate-100/50 pt-2.5 w-full">
          <Link to="/privacy" onClick={onClose} className="hover:underline">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" onClick={onClose} className="hover:underline">Terms</Link>
          <span>•</span>
          <Link to="/refund" onClick={onClose} className="hover:underline">Refund Policy</Link>
          <span>•</span>
          <Link to="/contact-us" onClick={onClose} className="hover:underline">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
