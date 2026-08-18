import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ override: true });

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME || "realastate_sparrow";

async function setup() {
  console.log(`Connecting to MySQL at ${dbHost}:${dbPort} as ${dbUser}...`);
  
  // 1. Connect without database name first to create the database
  const connection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
  });

  console.log(`Creating database "${dbName}" if it doesn't exist...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();

  // 2. Reconnect to the database to run the schema
  console.log(`Connecting directly to database "${dbName}"...`);
  const dbConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    multipleStatements: true, // Allow executing schema.sql statements
  });

  const schemaPath = path.resolve("schema.sql");
  console.log(`Reading schema from ${schemaPath}...`);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  console.log("Executing schema SQL queries...");
  await dbConnection.query(schemaSql);

  console.log("Database initialized successfully!");
  await dbConnection.end();
}

setup().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
