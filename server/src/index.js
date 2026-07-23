import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use("/uploads", express.static(path.resolve("src/uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/debug-files", (_req, res) => {
  try {
    const cwd = process.cwd();
    const resolvedPath = path.resolve("src/uploads");
    const exists = fs.existsSync(resolvedPath);
    const files = exists ? fs.readdirSync(resolvedPath) : [];
    res.json({
      cwd,
      resolvedPath,
      exists,
      filesCount: files.length,
      files: files.slice(0, 100),
    });
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
