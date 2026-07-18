import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

function toPublicProperty(row, media = []) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    propertyType: row.property_type,
    purpose: row.purpose,
    price: Number(row.price),
    areaSqft: row.area_sqft,
    address: row.address,
    district: row.district,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    furnishing: row.furnishing,
    facing: row.facing,
    propertyAge: row.property_age,
    description: row.description,
    listingRole: row.listing_role,
    status: row.status,
    views: row.views,
    images: media.filter((m) => m.media_type === "image").map((m) => m.url),
    videos: media.filter((m) => m.media_type === "video").map((m) => m.url),
    createdAt: row.created_at,
  };
}

async function fetchMediaByPropertyIds(ids) {
  if (ids.length === 0) return {};
  const [rows] = await pool.query(
    `SELECT * FROM property_media WHERE property_id IN (?) ORDER BY sort_order ASC`,
    [ids]
  );
  const byProperty = {};
  for (const row of rows) {
    (byProperty[row.property_id] ||= []).push(row);
  }
  return byProperty;
}

// GET /api/properties?district=Wayanad&propertyType=House&status=Active&ownerId=3
// Public browse — only returns Active listings unless overridden.
router.get("/", async (req, res) => {
  try {
    const { district, propertyType, purpose, status = "Active", ownerId } = req.query;
    const clauses = ["status = ?"];
    const params = [status];

    if (district) { clauses.push("district = ?"); params.push(district); }
    if (propertyType) { clauses.push("property_type = ?"); params.push(propertyType); }
    if (purpose) { clauses.push("purpose = ?"); params.push(purpose); }
    if (ownerId) { clauses.push("owner_id = ?"); params.push(ownerId); }

    const [rows] = await pool.query(
      `SELECT * FROM properties WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    const mediaByProperty = await fetchMediaByPropertyIds(rows.map((r) => r.id));
    res.json(rows.map((r) => toPublicProperty(r, mediaByProperty[r.id] || [])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// GET /api/properties/mine — the logged-in user's own listings, any status
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM properties WHERE owner_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    const mediaByProperty = await fetchMediaByPropertyIds(rows.map((r) => r.id));
    res.json(rows.map((r) => toPublicProperty(r, mediaByProperty[r.id] || [])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch your properties" });
  }
});

// GET /api/properties/:id
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS owner_name, u.phone AS owner_phone
       FROM properties p JOIN users u ON u.id = p.owner_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Property not found" });

    // Fire-and-forget view tracking; doesn't block the response.
    pool.query(
      "INSERT INTO property_views (property_id, visitor_id) VALUES (?, ?)",
      [req.params.id, req.userId || null]
    ).catch(() => {});
    pool.query("UPDATE properties SET views = views + 1 WHERE id = ?", [req.params.id]).catch(() => {});

    const [[saveCountRow]] = await pool.query(
      "SELECT COUNT(*) AS saveCount FROM saved_properties WHERE property_id = ?",
      [req.params.id]
    );
    const [[enquiryCountRow]] = await pool.query(
      "SELECT COUNT(*) AS enquiryCount FROM enquiries WHERE property_id = ?",
      [req.params.id]
    );
    let isSaved = false;
    if (req.userId) {
      const [savedRows] = await pool.query(
        "SELECT 1 FROM saved_properties WHERE user_id = ? AND property_id = ?",
        [req.userId, req.params.id]
      );
      isSaved = savedRows.length > 0;
    }

    const mediaByProperty = await fetchMediaByPropertyIds([rows[0].id]);
    res.json({
      ...toPublicProperty(rows[0], mediaByProperty[rows[0].id] || []),
      ownerName: rows[0].owner_name,
      ownerPhone: rows[0].owner_phone,
      saveCount: saveCountRow.saveCount,
      enquiryCount: enquiryCountRow.enquiryCount,
      isSaved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

// POST /api/properties/:id/save — toggle save for the logged-in user
router.post("/:id/save", requireAuth, async (req, res) => {
  try {
    const [existing] = await pool.query(
      "SELECT 1 FROM saved_properties WHERE user_id = ? AND property_id = ?",
      [req.userId, req.params.id]
    );
    if (existing.length > 0) {
      await pool.query(
        "DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?",
        [req.userId, req.params.id]
      );
      return res.json({ saved: false });
    }
    await pool.query(
      "INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?)",
      [req.userId, req.params.id]
    );
    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update saved properties" });
  }
});

// GET /api/properties/saved/mine — the logged-in user's saved listings
router.get("/saved/mine", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.* FROM saved_properties sp
       JOIN properties p ON p.id = sp.property_id
       WHERE sp.user_id = ? ORDER BY sp.created_at DESC`,
      [req.userId]
    );
    const mediaByProperty = await fetchMediaByPropertyIds(rows.map((r) => r.id));
    res.json(rows.map((r) => toPublicProperty(r, mediaByProperty[r.id] || [])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved properties" });
  }
});

// POST /api/properties/:id/enquiries  { message } — visitor contacts the owner
router.post("/:id/enquiries", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    await pool.query(
      "INSERT INTO enquiries (property_id, visitor_id, message) VALUES (?, ?, ?)",
      [req.params.id, req.userId, message || null]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send enquiry" });
  }
});

// POST /api/properties — create a new listing (multipart/form-data)
// Fields match the Add Property wizard's steps 1–4.
router.post("/", requireAuth, upload.array("media", 17), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      title, propertyType, purpose, price, areaSqft, address, district,
      bedrooms, bathrooms, furnishing, facing, propertyAge, description, listingRole,
    } = req.body;

    if (!propertyType || !purpose || !price || !areaSqft || !address || !district || !listingRole) {
      return res.status(400).json({ error: "Missing required property fields" });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO properties
        (owner_id, title, property_type, purpose, price, area_sqft, address, district,
         bedrooms, bathrooms, furnishing, facing, property_age, description, listing_role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        req.userId,
        title || `${propertyType} in ${district}`,
        propertyType, purpose, price, areaSqft, address, district,
        bedrooms || 0, bathrooms || 0, furnishing || null, facing || null,
        propertyAge || null, description || null, listingRole,
      ]
    );

    const propertyId = result.insertId;
    const files = req.files || [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = file.mimetype.startsWith("video") ? "video" : "image";
      await conn.query(
        "INSERT INTO property_media (property_id, media_type, url, sort_order) VALUES (?, ?, ?, ?)",
        [propertyId, mediaType, `/uploads/${file.filename}`, i]
      );
    }

    await conn.commit();
    res.status(201).json({ id: propertyId, status: "Pending" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create property" });
  } finally {
    conn.release();
  }
});

// PATCH /api/properties/:id/status  { status: "Active" | "Inactive" | "Draft" }
// Owner can only toggle Active/Inactive/Draft — Pending -> Active is admin-only (see admin routes).
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Active", "Inactive", "Draft"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of ${allowed.join(", ")}` });
    }

    const [rows] = await pool.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: "Not your property" });

    await pool.query("UPDATE properties SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ id: Number(req.params.id), status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE /api/properties/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: "Not your property" });

    await pool.query("DELETE FROM properties WHERE id = ?", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;
