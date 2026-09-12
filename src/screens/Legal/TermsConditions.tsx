import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { api } from "../../lib/api";

export default function TermsConditions() {
  const [title, setTitle] = useState("Terms & Conditions");
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    api.fetchSetting("page_terms_conditions_title")
      .then(d => { if (d && d.value) setTitle(d.value); })
      .catch(e => console.error("Error fetching title:", e));

    api.fetchSetting("page_terms_conditions_content")
      .then(d => { if (d && d.value) setContent(d.value); })
      .catch(e => console.error("Error fetching content:", e));
  }, []);

  return (
    <div className="min-h-screen pb-28 bg-cream">
      <Header title={title} showBack />
      
      <div className="p-5 flex flex-col gap-4 text-xs text-slate leading-relaxed">
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3">
          {content ? (
            <div className="whitespace-pre-line leading-relaxed text-charcoal">{content}</div>
          ) : (
            <>
              <p><strong>Effective Date:</strong> August 4, 2026</p>
              <p>
                By accessing and registering on GreenReal, you agree to comply with and be bound by the following terms of use. Please read these terms carefully.
              </p>

              <h3 className="font-display font-bold text-sm text-ink mt-2">1. Eligibility & Registration</h3>
              <p>
                To list properties or view contact details, you must create a validated user profile. You are responsible for maintaining the confidentiality of your credentials and all activities occurring under your profile.
              </p>

              <h3 className="font-display font-bold text-sm text-ink mt-2">2. Subscriptions & Trial Use</h3>
              <p>
                All new user accounts are granted a 3-day free trial period. Upon expiry, list viewing privileges will be limited unless a premium recurring subscription plan is successfully purchased through our Razorpay checkout gateway.
              </p>

              <h3 className="font-display font-bold text-sm text-ink mt-2">3. Accuracy of Listings</h3>
              <p>
                Owners, brokers, and agencies are solely responsible for ensuring the correctness, legitimacy, and physical state of the properties they list. Listings discovered to be fraudulent, outdated, or duplicate will be deleted by the admin team.
              </p>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
