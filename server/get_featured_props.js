import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "realastate_sparrow"
});

async function run() {
  try {
    const [rows] = await pool.query("SELECT id, title, is_featured FROM properties WHERE is_featured = 1");
    console.log("FEATURED PROPERTIES:", rows);
    
    for (const row of rows) {
      const [media] = await pool.query("SELECT * FROM property_media WHERE property_id = ?", [row.id]);
      console.log(`MEDIA FOR PROP ${row.id}:`, media);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
