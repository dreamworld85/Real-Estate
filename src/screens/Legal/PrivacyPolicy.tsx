import React from "react";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pb-28 bg-cream">
      <Header title="Privacy Policy" showBack />
      
      <div className="p-5 flex flex-col gap-4 text-xs text-slate leading-relaxed">
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3">
          <p><strong>Effective Date:</strong> August 4, 2026</p>
          <p>
            At GreenReal (Kerala Realty), we value the trust you place in us. This Privacy Policy details how we collect, use, process, and protect your information when you register and use our platform.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">1. Data We Collect</h3>
          <p>
            We collect personal identity data required to create listings, including name, email address, phone number, physical location, and account passwords. We also collect IP addresses and user agents for security, spam prevention, and analytics.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">2. How Your Data is Used</h3>
          <p>
            Your information is primarily used to connect property buyers and renters with sellers/brokers/agencies. We also use your contact details to communicate platform announcements and authorize premium subscriptions.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">3. Payment Information</h3>
          <p>
            Subscription orders are securely processed through our certified payment partner, Razorpay. We do not store or collect your complete debit/credit card details or net banking credentials on our local servers.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
