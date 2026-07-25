import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";

dotenv.config();

// Auto-configure persistent UPLOADS_DIR on Hostinger server
if (process.cwd().includes("api.greensparrows.com")) {
  const envPath = path.resolve(".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  if (!envContent.includes("UPLOADS_DIR")) {
    console.log("Auto-injecting persistent UPLOADS_DIR into .env");
    envContent += "\nUPLOADS_DIR=/home/u859202671/domains/api.greensparrows.com/uploads\n";
    fs.writeFileSync(envPath, envContent, "utf8");
    // Reload environment variables
    dotenv.config();
  }
}

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const uploadsDir = process.env.UPLOADS_DIR 
  ? path.resolve(process.env.UPLOADS_DIR) 
  : path.resolve("src/uploads");

// Ensure persistent upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Auto-migrate files from Git folder to persistent uploads folder
const gitUploadsDir = path.resolve("src/uploads");
if (fs.existsSync(gitUploadsDir) && gitUploadsDir !== uploadsDir) {
  try {
    const files = fs.readdirSync(gitUploadsDir);
    files.forEach(file => {
      const srcFile = path.join(gitUploadsDir, file);
      const destFile = path.join(uploadsDir, file);
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Migrated upload asset: ${file}`);
      }
    });
  } catch (err) {
    console.error("Failed to migrate upload assets:", err);
  }
}

app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/debug-files", (_req, res) => {
  try {
    const cwd = process.cwd();
    const exists = fs.existsSync(uploadsDir);
    const files = exists ? fs.readdirSync(uploadsDir) : [];
    res.json({
      cwd,
      uploadsDir,
      exists,
      filesCount: files.length,
      files: files.slice(0, 100),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/debug-webapp", (_req, res) => {
  try {
    const webappPath = "/home/u859202671/domains/greensparrows.com/public_html/webapp";
    const exists = fs.existsSync(webappPath);
    const files = exists ? fs.readdirSync(webappPath) : [];
    res.json({ webappPath, exists, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Kerala Realty API listening on http://localhost:${port}`);
});
