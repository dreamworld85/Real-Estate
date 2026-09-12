import React from "react";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

export default function DataDeletion() {
  return (
    <div className="min-h-screen pb-28 bg-cream">
      <Header title="User Data Deletion" showBack />
      
      <div className="p-5 flex flex-col gap-4 text-xs text-slate leading-relaxed">
        <div className="bg-white rounded-3xl p-5 border border-charcoal/5 shadow-sm flex flex-col gap-3">
          <p><strong>User Data Deletion Instructions</strong></p>
          <p>
            GreenReal (Kerala Realty) values your privacy. If you wish to delete your account, remove social logins (Google/Facebook), or request permanent erasure of your personal data from our platform, please follow the steps below.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">Option 1: Delete Account via App</h3>
          <p>
            1. Log in to your GreenReal account.<br />
            2. Go to <strong>Profile</strong> ➔ <strong>Edit Profile</strong>.<br />
            3. Scroll down and click <strong>Delete Account & Data</strong>.<br />
            4. Confirm deletion to permanently erase your profile, saved properties, and linked social accounts.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">Option 2: Delete Facebook App Connection</h3>
          <p>
            1. Go to your Facebook Account's <strong>Settings & Privacy</strong> ➔ <strong>Settings</strong>.<br />
            2. Click <strong>Apps and Websites</strong>.<br />
            3. Select <strong>Property App</strong> (GreenReal).<br />
            4. Click <strong>Remove</strong> to revoke access and request data deletion.
          </p>

          <h3 className="font-display font-bold text-sm text-ink mt-2">Option 3: Manual Data Erasure Request</h3>
          <p>
            You can also submit a manual data deletion request by emailing our privacy team at <strong>greensparrows85@gmail.com</strong> with the subject line <em>"Data Deletion Request"</em>. We will process and confirm permanent erasure within 48 hours.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
