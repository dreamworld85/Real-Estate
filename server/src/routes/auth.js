import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

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
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ error: "Name, password, and email or phone are required" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR phone = ?",
      [email || null, phone || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email or phone already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email || null, phone || null, passwordHash]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [result.insertId]);
    const token = signToken(result.insertId);
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

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR phone = ?",
      [identifier, identifier]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [rows[0].id]);
    const token = signToken(rows[0].id);
    res.json({ token, user: toPublicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
