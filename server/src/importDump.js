import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "realastate_sparrow";

async function setup() {
  console.log(`Connecting to MySQL at ${dbHost}:${dbPort} as ${dbUser}...`);
  
  // 1. Connect without database name first to recreate the database
  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
  });

  console.log(`Dropping database "${dbName}" if it exists to ensure a clean import...`);
  await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);

  console.log(`Creating database "${dbName}"...`);
  await connection.query(`CREATE DATABASE \`${dbName}\`;`);
  await connection.end();

  // 2. Reconnect to the database to run the dump SQL
  console.log(`Connecting directly to database "${dbName}"...`);
  const dbConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    multipleStatements: true, // Allow executing multiple statements
  });

  // Find realastate_sparrow.sql in parent or current directory
  let dumpPath = path.resolve("..", "realastate_sparrow.sql");
  if (!fs.existsSync(dumpPath)) {
    dumpPath = path.resolve("realastate_sparrow.sql");
  }
  
  console.log(`Reading SQL dump from ${dumpPath}...`);
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`SQL dump file not found at ${dumpPath}`);
  }

  const sqlDump = fs.readFileSync(dumpPath, "utf8");
  console.log("Executing SQL dump queries...");
  await dbConnection.query(sqlDump);

  console.log("Database recreated and dump imported successfully!");
  await dbConnection.end();
}

setup().catch((err) => {
  console.error("Database import failed:", err);
  process.exit(1);
});
