import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ override: true });

const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbPort = Number(process.env.DB_PORT) || 3306;
const dbUser = process.env.DB_USER || "root";
const rawDbPass = (process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "").trim();
const dbPassword = (rawDbPass === "none" || rawDbPass === "null") ? "" : rawDbPass;
const dbName = process.env.DB_NAME || "realastate_sparrow";

function createMySqlPool(config) {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

const hostingerProdConfig = {
  host: "localhost",
  port: 3306,
  user: "u859202671_RealEstateUS",
  password: "Sparrow_Realty_2026@",
  database: "u859202671_RealEstatein",
};

let activePool = createMySqlPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
});

export const pool = {
  async query(...args) {
    try {
      return await activePool.query(...args);
    } catch (err) {
      if ((err.code === "ECONNREFUSED" || err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ENOTFOUND" || err.code === "ER_BAD_DB_ERROR") && dbUser !== hostingerProdConfig.user) {
        console.warn(`Primary database connection failed (${err.code}). Connecting to Hostinger production database (${hostingerProdConfig.database})...`);
        try {
          const fallbackPool = createMySqlPool(hostingerProdConfig);
          const result = await fallbackPool.query(...args);
          activePool = fallbackPool;
          return result;
        } catch (fallbackErr) {
          console.error("Hostinger production DB connection failed:", fallbackErr.message);
          throw fallbackErr;
        }
      }
      throw err;
    }
  },
  async getConnection() {
    try {
      return await activePool.getConnection();
    } catch (err) {
      if ((err.code === "ECONNREFUSED" || err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ENOTFOUND" || err.code === "ER_BAD_DB_ERROR") && dbUser !== hostingerProdConfig.user) {
        console.warn(`Primary database connection failed (${err.code}). Connecting to Hostinger production database (${hostingerProdConfig.database})...`);
        activePool = createMySqlPool(hostingerProdConfig);
        return await activePool.getConnection();
      }
      throw err;
    }
  }
};
