import { pool } from "../db.js";

async function migrate() {
  console.log("Starting subscription database migration...");

  // 1. Add columns to users table
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes("trial_ends_at")) {
      console.log("Adding trial_ends_at column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP NULL DEFAULT NULL");
    }
    if (!colNames.includes("subscription_status")) {
      console.log("Adding subscription_status column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT NULL");
    }
    if (!colNames.includes("razorpay_subscription_id")) {
      console.log("Adding razorpay_subscription_id column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN razorpay_subscription_id VARCHAR(255) DEFAULT NULL");
    }
    console.log("Users table columns updated successfully.");
  } catch (err) {
    console.error("Failed to alter table users:", err);
  }

  // 2. Add columns to property_views table
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM property_views");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes("ip_address")) {
      console.log("Adding ip_address column to property_views...");
      await pool.query("ALTER TABLE property_views ADD COLUMN ip_address VARCHAR(45) DEFAULT NULL");
    }
    if (!colNames.includes("user_agent")) {
      console.log("Adding user_agent column to property_views...");
      await pool.query("ALTER TABLE property_views ADD COLUMN user_agent VARCHAR(255) DEFAULT NULL");
    }
    console.log("Property_views table columns updated successfully.");
  } catch (err) {
    console.error("Failed to alter table property_views:", err);
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
