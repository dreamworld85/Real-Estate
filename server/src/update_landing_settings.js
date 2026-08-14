import { pool } from "./db.js";

async function run() {
  try {
    await pool.query("UPDATE settings SET value = ? WHERE `key` = ?", [
      "Find Your Perfect Dream Property in Kerala",
      "landing_hero_title"
    ]);
    await pool.query("UPDATE settings SET value = ? WHERE `key` = ?", [
      "Explore residential houses, luxury waterfront villas, modern apartments, and premium land plots. Connect directly with owners, brokers, and certified developers across Kerala.",
      "landing_hero_description"
    ]);
    await pool.query("UPDATE settings SET value = ? WHERE `key` = ?", [
      "Get the Kerala Realty App",
      "landing_app_title"
    ]);
    await pool.query("UPDATE settings SET value = ? WHERE `key` = ?", [
      "Unlock premium features like direct broker chat, real-time listing notifications, interactive map search, and zero-brokerage owner listings. Scan the QR code to install the mobile app.",
      "landing_app_description"
    ]);
    console.log("Settings updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating settings:", err);
    process.exit(1);
  }
}

run();
