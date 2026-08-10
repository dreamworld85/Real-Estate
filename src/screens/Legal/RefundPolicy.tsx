import React from "react";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { ShieldAlert } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen pb-28 bg-cream">
      <Header title="Cancellation & Refund" showBack />
      
      <div className="p-5 flex flex-col gap-4 text-xs text-slate leading-relaxed">
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-rose-50 p-3 rounded-2xl text-rose-600 font-bold mb-1">
            <ShieldAlert size={16} />
            <span>Strict No-Refund Policy</span>
          </div>

          <p>
            Please review our strict cancellation and refund policies before purchasing any premium subscription plans on Kerala Realty:
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">1. Subscription Cancellations</h3>
          <p>
            You can cancel your subscription plan at any time through your account settings or profile. Once cancelled, your premium access will remain active and you will continue to have full access to direct contact details until the end of your current billing period. No future recurring charges will be made.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">2. No-Refunds Policy</h3>
          <p>
            We do not offer refunds, credits, or prorated billing for any purchased subscription plans, including unused time, accidental purchases, or changes in preference. All payments made to Kerala Realty are strictly final and non-refundable.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
