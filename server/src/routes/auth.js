import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    avatarUrl: row.avatar_url,
    trialEndsAt: row.trial_ends_at,
    subscriptionStatus: row.subscription_status,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    role: row.role,
  };
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session user" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ error: "Name, password, and email or phone are required" });
    }

    const userRole = "user";

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR phone = ?",
      [email || null, phone || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email or phone already exists" });
    }

    let trialEnds = null;
    if (userRole === "Broker" || userRole === "Agency" || userRole === "Owner") {
      const settingKey = userRole === "Agency" ? "default_trial_days_agency" : (userRole === "Broker" ? "default_trial_days_broker" : "default_trial_days");
      const [[daysRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = ?", [settingKey]);
      const defaultDays = daysRow ? parseInt(daysRow.value, 10) : (userRole === "Agency" ? 3 : 5);

      const date = new Date();
      date.setDate(date.getDate() + defaultDays);
      trialEnds = date;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email || null, phone || null, passwordHash, userRole, trialEnds]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [result.insertId]);
    const token = signToken(result.insertId);
    setAuthCookie(res, token);
    res.status(201).json({ token, user: toPublicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login  { identifier, password }  — identifier is email or phone
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifier and password are required" });
    }

    const trimmed = identifier.trim();
    let rows = [];

    if (trimmed.includes("@")) {
      // Robust Case-Insensitive Email match
      [rows] = await pool.query(
        "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
        [trimmed]
      );
    } else {
      // Robust Phone Number match (handles varying +91 prefixes dynamically)
      const cleanedInput = trimmed.replace(/\D/g, "");
      if (cleanedInput.length >= 10) {
        const last10 = cleanedInput.slice(-10);
        [rows] = await pool.query(
          "SELECT * FROM users WHERE phone LIKE ? OR phone = ?",
          [`%${last10}`, trimmed]
        );
      } else {
        [rows] = await pool.query(
          "SELECT * FROM users WHERE phone = ?",
          [trimmed]
        );
      }
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [rows[0].id]);
    const token = signToken(rows[0].id);
    setAuthCookie(res, token);
    res.json({ token, user: toPublicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
