import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "realastate_sparrow";

async function runMigration() {
  console.log(`Connecting to ${dbHost}:${dbPort}/${dbName}...`);
  const conn = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  // 1. Add is_disabled to users
  try {
    const [rows] = await conn.query(`SHOW COLUMNS FROM users LIKE 'is_disabled'`);
    if (rows.length === 0) {
      console.log("Adding is_disabled column to users table...");
      await conn.query(`ALTER TABLE users ADD COLUMN is_disabled TINYINT DEFAULT 0`);
    } else {
      console.log("is_disabled column already exists in users.");
    }
  } catch (e) {
    console.error("Error adding is_disabled:", e);
  }

  // 2. Create reported_listings table
  try {
    console.log("Creating reported_listings table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reported_listings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        reporter_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        status ENUM('Pending', 'Resolved') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } catch (e) {
    console.error("Error creating reported_listings:", e);
  }

  // 3. Create activity_logs table
  try {
    console.log("Creating activity_logs table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(255) NOT NULL,
        category ENUM('Users', 'Properties', 'System') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  } catch (e) {
    console.error("Error creating activity_logs:", e);
  }

  // 4. Insert mock reported listings if empty
  try {
    const [reports] = await conn.query(`SELECT COUNT(*) as count FROM reported_listings`);
    if (reports[0].count === 0) {
      console.log("Inserting mock reported listings...");
      const [props] = await conn.query(`SELECT id FROM properties LIMIT 5`);
      const [usrs] = await conn.query(`SELECT id FROM users LIMIT 5`);
      if (props.length > 0 && usrs.length > 0) {
        const propId = props[0].id;
        const reporterId = usrs[0].id;
        await conn.query(`
          INSERT INTO reported_listings (property_id, reporter_id, reason, status) VALUES
          (?, ?, 'Fake Information - pictures do not match actual location.', 'Pending'),
          (?, ?, 'Irrelevant content - listing belongs to a different district.', 'Pending')
        `, [propId, reporterId, propId, reporterId]);
      }
    }
  } catch (e) {
    console.error("Error inserting mock reports:", e);
  }

  // 5. Insert mock activity logs if empty
  try {
    const [logs] = await conn.query(`SELECT COUNT(*) as count FROM activity_logs`);
    if (logs[0].count === 0) {
      console.log("Inserting mock activity logs...");
      const [usrs] = await conn.query(`SELECT id FROM users LIMIT 3`);
      const userId = usrs.length > 0 ? usrs[0].id : null;
      await conn.query(`
        INSERT INTO activity_logs (user_id, action, category) VALUES
        (?, 'User registered as Seller', 'Users'),
        (?, 'New property submitted #P10023', 'Properties'),
        (null, 'Admin approved property #P10023', 'System'),
        (null, 'Admin updated site settings', 'System'),
        (?, 'User profile updated', 'Users')
      `, [userId, userId, userId]);
    }
  } catch (e) {
    console.error("Error inserting mock logs:", e);
  }

  await conn.end();
  console.log("Migrations successfully applied!");
}

runMigration().catch(console.error);
