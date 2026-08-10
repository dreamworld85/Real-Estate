import { pool } from "./db.js";

export async function seedPlans() {
  try {
    console.log("Enforcing complete subscription plans seed...");
    await pool.query("DELETE FROM subscription_plans");

    const plans = [
      // user (buyer)
      { role: 'user', duration_months: 0, price: 0.00, discount: 0.00, description: 'Basic buyer account with search and saved property access.', features: ["Browse active listings", "Search and filter districts", "Save favorite properties"] },
      { role: 'user', duration_months: 1, price: 299.00, discount: 50.00, description: 'Unlimited contact reveals & direct inquiry access for 1 month.', features: ["Reveal direct owner contacts", "WhatsApp chat shortcuts", "Save favorite listings", "Direct contact logs"] },
      { role: 'user', duration_months: 6, price: 1499.00, discount: 200.00, description: 'Unlimited contact reveals & direct inquiry access for 6 months.', features: ["Reveal direct owner contacts", "WhatsApp chat shortcuts", "Save favorite listings", "Direct contact logs", "Email notifications for price drops"] },
      { role: 'user', duration_months: 12, price: 2499.00, discount: 400.00, description: 'Unlimited contact reveals & direct inquiry access for 12 months.', features: ["Reveal direct owner contacts", "WhatsApp chat shortcuts", "Save favorite listings", "Direct contact logs", "Email notifications for price drops", "Priority support"] },

      // owner
      { role: 'owner', duration_months: 0, price: 0.00, discount: 0.00, description: 'Individual property owner free tier with basic posting.', features: ["Post up to 2 properties completely free", "Simple listing editor", "Basic email support"] },
      { role: 'owner', duration_months: 1, price: 399.00, discount: 50.00, description: 'Unlock direct contact details, WhatsApp shortcuts, and visitor leads for 1 month.', features: ["Post up to 5 properties", "View visitor statistics & leads", "Premium listing badge", "Direct lead contact details"] },
      { role: 'owner', duration_months: 6, price: 1999.00, discount: 300.00, description: 'Unlock direct contact details, WhatsApp shortcuts, and visitor leads for 6 months.', features: ["Post up to 5 properties", "View visitor statistics & leads", "Premium listing badge", "Direct lead contact details", "1 Featured listing booster"] },
      { role: 'owner', duration_months: 12, price: 3499.00, discount: 600.00, description: 'Unlock direct contact details, WhatsApp shortcuts, and visitor leads for 12 months.', features: ["Post up to 5 properties", "View visitor statistics & leads", "Premium listing badge", "Direct lead contact details", "3 Featured listing boosters", "Email marketing to active buyers"] },

      // broker
      { role: 'broker', duration_months: 0, price: 0.00, discount: 0.00, description: 'Broker free trial to list properties and manage leads.', features: ["Post up to 5 properties free trial limit", "Direct email support", "Simple property wizard"] },
      { role: 'broker', duration_months: 1, price: 799.00, discount: 100.00, description: 'Broker features + contact unlocks for 1 month.', features: ["Unlimited property listings", "Dedicated broker profile page", "Lead generation alerts", "Interactive customer inquiries tab"] },
      { role: 'broker', duration_months: 6, price: 3999.00, discount: 500.00, description: 'Broker features + contact unlocks for 6 months.', features: ["Unlimited property listings", "Dedicated broker profile page", "Lead generation alerts", "Interactive customer inquiries tab", "2 Featured listing boosters"] },
      { role: 'broker', duration_months: 12, price: 6999.00, discount: 1000.00, description: 'Broker features + contact unlocks for 12 months.', features: ["Unlimited property listings", "Dedicated broker profile page", "Lead generation alerts", "Interactive customer inquiries tab", "5 Featured listing boosters", "Priority listing verification"] },

      // agency
      { role: 'agency', duration_months: 0, price: 0.00, discount: 0.00, description: 'Agency free trial to configure corporate office and agents.', features: ["Post up to 5 properties free trial limit", "Direct email support", "Upload agency logo branding"] },
      { role: 'agency', duration_months: 1, price: 1499.00, discount: 200.00, description: 'Agency features + contact unlocks for 1 month.', features: ["Multiple broker account seats", "Agency branding & logo on listings", "Dedicated agency profile page", "Premium visibility filters"] },
      { role: 'agency', duration_months: 6, price: 7499.00, discount: 1000.00, description: 'Agency features + contact unlocks for 6 months.', features: ["Multiple broker account seats", "Agency branding & logo on listings", "Dedicated agency profile page", "Premium visibility filters", "3 Featured listing boosters"] },
      { role: 'agency', duration_months: 12, price: 12999.00, discount: 2000.00, description: 'Agency features + contact unlocks for 12 months.', features: ["Multiple broker account seats", "Agency branding & logo on listings", "Dedicated agency profile page", "Premium visibility filters", "8 Featured listing boosters", "Personal account manager"] }
    ];

    for (const plan of plans) {
      await pool.query(
        `INSERT INTO subscription_plans (role, duration_months, price, discount, description, features)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [plan.role, plan.duration_months, plan.price, plan.discount, plan.description, JSON.stringify(plan.features)]
      );
    }
    console.log("Subscription plans catalog verified & synchronized (16 records).");
  } catch (err) {
    console.error("Failed to seed subscription plans:", err);
  }
}
