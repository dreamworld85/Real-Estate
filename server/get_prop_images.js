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
    const [media] = await pool.query("SELECT * FROM property_media WHERE property_id = 16");
    console.log("MEDIA FOR PROP 16:", media);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
