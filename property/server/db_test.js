import { pool } from "./src/db.js";

async function testConnection() {
  console.log("Attempting to connect to database...");
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);

  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS connectionTest");
    console.log("\n------------------------------------------------");
    console.log("✅ SUCCESS: Connected to the database successfully!");
    console.log(`Database response: ${rows[0].connectionTest === 2 ? "OK (1 + 1 = 2)" : "FAILED"}`);
    console.log("------------------------------------------------\n");
  } catch (error) {
    console.log("\n------------------------------------------------");
    console.log("❌ ERROR: Failed to connect to the database!");
    console.log("Error details:", error.message);
    console.log("------------------------------------------------\n");
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();
