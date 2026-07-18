import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// NOTE: This is a minimal placeholder. In production, gate these routes with
// an admin role check (e.g. a `role` column on `users`), not just requireAuth.

// GET /api/admin/properties/pending
router.get("/properties/pending", requireAuth, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM properties WHERE status = 'Pending' ORDER BY created_at ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pending properties" });
  }
});

// PATCH /api/admin/properties/:id/review  { decision: "approve" | "reject" }
router.patch("/properties/:id/review", requireAuth, async (req, res) => {
  try {
    const { decision } = req.body;
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "Decision must be 'approve' or 'reject'" });
    }
    const status = decision === "approve" ? "Active" : "Rejected";
    await pool.query("UPDATE properties SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ id: Number(req.params.id), status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to review property" });
  }
});

export default router;
