import { pool } from "../db.js";

async function migrate() {
  console.log("Starting role-based gating database migration...");

  // 1. Add role column to users table
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM users");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes("role")) {
      console.log("Adding role column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN role ENUM('Owner', 'Broker', 'Agency') NOT NULL DEFAULT 'Owner'");
    } else {
      console.log("role column already exists in users table.");
    }
  } catch (err) {
    console.error("Failed to alter table users:", err);
  }

  // 2. Create role_switch_requests table
  try {
    console.log("Creating role_switch_requests table if not exists...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_switch_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        requested_role ENUM('Broker', 'Agency') NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("role_switch_requests table ready.");
  } catch (err) {
    console.error("Failed to create role_switch_requests table:", err);
  }

  // 3. Create subscription_plans table
  try {
    console.log("Creating subscription_plans table if not exists...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        role ENUM('Owner', 'Broker', 'Agency') PRIMARY KEY,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("subscription_plans table ready.");

    // Prepopulate default subscription plans
    console.log("Prepopulating default pricing for subscription plans...");
    await pool.query(`
      INSERT INTO subscription_plans (role, price) VALUES
        ('Owner', 10.00),
        ('Broker', 20.00),
        ('Agency', 50.00)
      ON DUPLICATE KEY UPDATE price=price
    `);
    console.log("Default pricing updated.");
  } catch (err) {
    console.error("Failed to set up subscription_plans table:", err);
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
