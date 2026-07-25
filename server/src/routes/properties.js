import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

function toPublicProperty(row, media = [], isSaved = false) {
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
    youtubeUrl: row.youtube_url,
    createdAt: row.created_at,
    isSaved,
    contactNumber: row.contact_number,
    whatsappNumber: row.whatsapp_number,
    ownerName: row.owner_name,
    brokerName: row.broker_name,
    agencyName: row.agency_name,
    agencyLogoUrl: row.agency_logo_url,
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
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { district, propertyType, purpose, status = "Active", ownerId } = req.query;
    const clauses = ["status = ?"];
    const params = [status];

    if (district) { clauses.push("district = ?"); params.push(district); }
    if (propertyType) {
      const types = (Array.isArray(propertyType) ? propertyType : String(propertyType).split(","))
        .map(t => t.trim())
        .filter(Boolean);
      if (types.length > 0) {
        clauses.push(`property_type IN (${types.map(() => "?").join(",")})`);
        params.push(...types);
      }
    }
    if (purpose) { clauses.push("purpose = ?"); params.push(purpose); }
    if (ownerId) { clauses.push("owner_id = ?"); params.push(ownerId); }

    const [rows] = await pool.query(
      `SELECT * FROM properties WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    const mediaByProperty = await fetchMediaByPropertyIds(rows.map((r) => r.id));

    let savedIds = new Set();
    if (req.userId) {
      const [savedRows] = await pool.query(
        "SELECT property_id FROM saved_properties WHERE user_id = ?",
        [req.userId]
      );
      savedIds = new Set(savedRows.map((r) => r.property_id));
    }

    let ratingsMap = {};
    if (rows.length > 0) {
      const [ratingRows] = await pool.query(
        `SELECT property_id, COALESCE(AVG(rating), 0) AS avgRating, COUNT(*) AS ratingCount 
         FROM property_reviews 
         WHERE property_id IN (${rows.map(r => r.id).join(",")}) 
         GROUP BY property_id`
      );
      ratingRows.forEach(row => {
        ratingsMap[row.property_id] = {
          avgRating: Number(row.avgRating) || 0,
          ratingCount: Number(row.ratingCount) || 0
        };
      });
    }

    res.json(rows.map((r) => {
      const stats = ratingsMap[r.id] || { avgRating: 0, ratingCount: 0 };
      return {
        ...toPublicProperty(r, mediaByProperty[r.id] || [], savedIds.has(r.id)),
        avgRating: stats.avgRating,
        ratingCount: stats.ratingCount,
      };
    }));
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

    const [savedRows] = await pool.query(
      "SELECT property_id FROM saved_properties WHERE user_id = ?",
      [req.userId]
    );
    const savedIds = new Set(savedRows.map((r) => r.property_id));

    let ratingsMap = {};
    if (rows.length > 0) {
      const [ratingRows] = await pool.query(
        `SELECT property_id, COALESCE(AVG(rating), 0) AS avgRating, COUNT(*) AS ratingCount 
         FROM property_reviews 
         WHERE property_id IN (${rows.map(r => r.id).join(",")}) 
         GROUP BY property_id`
      );
      ratingRows.forEach(row => {
        ratingsMap[row.property_id] = {
          avgRating: Number(row.avgRating) || 0,
          ratingCount: Number(row.ratingCount) || 0
        };
      });
    }

    res.json(rows.map((r) => {
      const stats = ratingsMap[r.id] || { avgRating: 0, ratingCount: 0 };
      return {
        ...toPublicProperty(r, mediaByProperty[r.id] || [], savedIds.has(r.id)),
        avgRating: stats.avgRating,
        ratingCount: stats.ratingCount,
      };
    }));
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
    const [[ratingRow]] = await pool.query(
      "SELECT COALESCE(AVG(rating), 0) AS avgRating, COUNT(*) AS ratingCount FROM property_reviews WHERE property_id = ?",
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
      avgRating: Number(ratingRow.avgRating) || 0,
      ratingCount: Number(ratingRow.ratingCount) || 0,
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

router.get("/saved/mine", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.* FROM saved_properties sp
       JOIN properties p ON p.id = sp.property_id
       WHERE sp.user_id = ? ORDER BY sp.created_at DESC`,
      [req.userId]
    );
    const mediaByProperty = await fetchMediaByPropertyIds(rows.map((r) => r.id));
    res.json(rows.map((r) => toPublicProperty(r, mediaByProperty[r.id] || [], true)));
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
router.post("/", requireAuth, upload.any(), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      title, propertyType, purpose, price, areaSqft, address, district,
      bedrooms, bathrooms, furnishing, facing, propertyAge, description, listingRole,
      contactNumber, whatsappNumber, ownerName, brokerName, agencyName, youtubeUrl,
    } = req.body;

    if (!propertyType || !purpose || !price || !areaSqft || !address || !district || !listingRole) {
      return res.status(400).json({ error: "Missing required property fields" });
    }

    await conn.beginTransaction();

    const files = req.files || [];
    const logoFile = files.find((f) => f.fieldname === "agencyLogo");
    const mediaFiles = files.filter((f) => f.fieldname === "media");
    const agencyLogoUrl = logoFile ? `/uploads/${logoFile.filename}` : null;

    const [result] = await conn.query(
      `INSERT INTO properties
        (owner_id, title, property_type, purpose, price, area_sqft, address, district,
         bedrooms, bathrooms, furnishing, facing, property_age, description, listing_role,
         contact_number, whatsapp_number, owner_name, broker_name, agency_name, agency_logo_url, youtube_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        req.userId,
        title || `${propertyType} in ${district}`,
        propertyType, purpose, price, areaSqft, address, district,
        bedrooms || 0, bathrooms || 0, furnishing || null, facing || null,
        propertyAge || null, description || null, listingRole,
        contactNumber || null, whatsappNumber || null,
        ownerName || null, brokerName || null, agencyName || null, agencyLogoUrl,
        youtubeUrl || null,
      ]
    );

    const propertyId = result.insertId;
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
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

// POST /api/properties/:id/report — report this property listing
router.post("/:id/report", requireAuth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    const fullReason = description ? `${reason} - ${description}` : reason;

    // Check if the property exists
    const [propRows] = await pool.query("SELECT 1 FROM properties WHERE id = ?", [req.params.id]);
    if (propRows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    await pool.query(
      "INSERT INTO reported_listings (property_id, reporter_id, reason, status) VALUES (?, ?, ?, 'Pending')",
      [req.params.id, req.userId, fullReason.substring(0, 255)]
    );

    res.json({ message: "Property reported successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to report property" });
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

// GET /api/properties/:id/reviews — retrieve all reviews for a property
router.get("/:id/reviews", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.rating, pr.comment, pr.created_at, u.name as reviewer_name
       FROM property_reviews pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.property_id = ?
       ORDER BY pr.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/properties/:id/reviews — submit a new review
router.post("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if the property exists
    const [propRows] = await pool.query("SELECT 1 FROM properties WHERE id = ?", [req.params.id]);
    if (propRows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    await pool.query(
      "INSERT INTO property_reviews (property_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
      [req.params.id, req.userId, rating, comment]
    );

    res.json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
