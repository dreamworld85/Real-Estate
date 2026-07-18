import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

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

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(toPublicUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/users/me  { name, phone, email, location, avatarUrl }
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { name, phone, email, location, avatarUrl } = req.body;
    await pool.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        location = COALESCE(?, location),
        avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [name, phone, email, location, avatarUrl, req.userId]
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    res.json(toPublicUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// GET /api/users/me/stats — dashboard totals + recent visitors, across all of the
// user's properties. Backs the Visitors & Enquiries screen.
router.get("/me/stats", requireAuth, async (req, res) => {
  try {
    const [[viewsRow]] = await pool.query(
      `SELECT COUNT(*) AS totalViews FROM property_views pv
       JOIN properties p ON p.id = pv.property_id WHERE p.owner_id = ?`,
      [req.userId]
    );
    const [[enquiriesRow]] = await pool.query(
      `SELECT COUNT(*) AS totalEnquiries FROM enquiries e
       JOIN properties p ON p.id = e.property_id WHERE p.owner_id = ?`,
      [req.userId]
    );
    const [recentVisitors] = await pool.query(
      `SELECT u.name AS visitorName, u.location AS visitorLocation,
              p.title AS propertyTitle, e.created_at AS enquiredAt
       FROM enquiries e
       JOIN properties p ON p.id = e.property_id
       JOIN users u ON u.id = e.visitor_id
       WHERE p.owner_id = ?
       ORDER BY e.created_at DESC LIMIT 20`,
      [req.userId]
    );

    res.json({
      totalViews: viewsRow.totalViews,
      totalEnquiries: enquiriesRow.totalEnquiries,
      recentVisitors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/users/:id/profile — public profile for Agency/Broker/Owner cards.
// "Years on Kerala Realty" is derived from account age rather than self-reported,
// since that's the only trustworthy signal we actually have.
router.get("/:id/profile", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const [[listingsRow]] = await pool.query(
      "SELECT COUNT(*) AS totalListings FROM properties WHERE owner_id = ? AND status = 'Active'",
      [req.params.id]
    );
    const [[clientsRow]] = await pool.query(
      `SELECT COUNT(DISTINCT e.visitor_id) AS distinctEnquirers
       FROM enquiries e JOIN properties p ON p.id = e.property_id
       WHERE p.owner_id = ?`,
      [req.params.id]
    );

    const joined = new Date(rows[0].created_at);
    const yearsActive = Math.max(0, (Date.now() - joined.getTime()) / (365 * 24 * 60 * 60 * 1000));

    res.json({
      ...toPublicUser(rows[0]),
      totalListings: listingsRow.totalListings,
      distinctEnquirers: clientsRow.distinctEnquirers,
      yearsActive: Math.round(yearsActive * 10) / 10,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
});

export default router;
