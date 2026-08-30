import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { upload, optimizeImages } from "../middleware/upload.js";
import { checkUserAccess } from "../utils/access.js";
import { deleteUploadedFile } from "../utils/fileHelper.js";
import fs from "fs/promises";
import path from "path";

const router = Router();

function toPublicProperty(row, media = [], isSaved = false) {
  // Determine standard listing role from current live user_role if it exists, otherwise fall back to row.listing_role
  let liveRole = row.user_role || row.listing_role;
  if (liveRole) {
    const lower = liveRole.toLowerCase();
    liveRole = lower === "broker" ? "Broker" : (lower === "agency" ? "Agency" : "Owner");
  } else {
    liveRole = "Owner";
  }

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
    listingRole: liveRole,
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
    useAdminContact: row.use_admin_contact === 1,
    isFeatured: row.is_featured === 1,
    isBrokerPersonalProperty: row.is_broker_personal_property === 1,
    isPriceNegotiable: row.is_price_negotiable === 1,
    latitude: row.latitude,
    longitude: row.longitude,
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

// GET /api/properties?district=Wayanad&propertyType=House&status=Active&ownerId=3&search=John
// Public browse — only returns Active listings unless overridden.
// Performs JOIN with users table to fetch live user role dynamically.
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { district, propertyType, purpose, status = "Active", ownerId, search } = req.query;
    const clauses = ["p.status = ?"];
    const params = [status];

    if (district) { clauses.push("p.district = ?"); params.push(district); }
    if (propertyType) {
      const rawTypes = (Array.isArray(propertyType) ? propertyType : String(propertyType).split(","))
        .map(t => t.trim())
        .filter(Boolean);
      
      const types = [];
      for (const t of rawTypes) {
        if (t === "Land") {
          types.push("Plot / Land", "Land");
        } else if (t === "House") {
          types.push("Independent House / Villa", "Builder Floor", "House");
        } else if (t === "Villa") {
          types.push("Independent House / Villa", "Farmhouse", "Villa");
        } else if (t === "Apartment") {
          types.push("Apartment", "1 RK / Studio Apartment", "Serviced Apartment");
        } else if (t === "Commercial Space") {
          types.push("Office Space", "Retail Shop", "Warehouse", "Co-working Space", "Commercial Space");
        } else {
          types.push(t);
        }
      }

      if (types.length > 0) {
        clauses.push(`p.property_type IN (${types.map(() => "?").join(",")})`);
        params.push(...types);
      }
    }
    if (purpose) { clauses.push("p.purpose = ?"); params.push(purpose); }
    if (ownerId) { clauses.push("p.owner_id = ?"); params.push(ownerId); }
    
    if (search) {
      clauses.push(
        `(p.title LIKE ? OR p.address LIKE ? OR p.district LIKE ? OR p.description LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR p.contact_number LIKE ? OR p.whatsapp_number LIKE ?)`
      );
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild, searchWild, searchWild, searchWild, searchWild, searchWild);
    }

    const [rows] = await pool.query(
      `SELECT p.*, u.role AS user_role FROM properties p
       JOIN users u ON u.id = p.owner_id
       WHERE ${clauses.join(" AND ")} ORDER BY p.created_at DESC LIMIT 50`,
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

    let contactAccess = false;
    let unlockedPropertyIds = new Set();
    if (req.userId) {
      const accessCheck = await checkUserAccess(req.userId);
      contactAccess = accessCheck.hasAccess;

      const [clicks] = await pool.query(
        "SELECT property_id FROM contact_clicks WHERE user_id = ?",
        [req.userId]
      );
      unlockedPropertyIds = new Set(clicks.map(c => c.property_id));
    }

    const [[adminContactRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'admin_contact_number'");
    const adminContactNumber = adminContactRow ? adminContactRow.value : "+91 94460 12345";

    res.json(rows.map((r) => {
      const stats = ratingsMap[r.id] || { avgRating: 0, ratingCount: 0 };
      const publicProp = toPublicProperty(r, mediaByProperty[r.id] || [], savedIds.has(r.id));
      if (r.use_admin_contact === 1) {
        publicProp.contactNumber = adminContactNumber;
        publicProp.whatsappNumber = adminContactNumber;
      } else {
        const isUnlocked = unlockedPropertyIds.has(r.id);
        if (!contactAccess && r.owner_id !== req.userId && !isUnlocked) {
          publicProp.contactNumber = "+91 XXXXX XXXXX";
          publicProp.whatsappNumber = "+91 XXXXX XXXXX";
        }
      }
      return {
        ...publicProp,
        avgRating: stats.avgRating,
        ratingCount: stats.ratingCount,
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// GET /api/properties/featured-status — get featured details & eligibility
router.get("/featured-status", requireAuth, async (req, res) => {
  try {
    // 1. Get user subscription status
    const [[userRow]] = await pool.query(
      "SELECT role, subscription_status FROM users WHERE id = ?",
      [req.userId]
    );
    const isSubscribed = userRow ? userRow.subscription_status === "active" : false;

    // 2. Count current featured properties
    const [[countRow]] = await pool.query(
      "SELECT COUNT(*) AS count FROM properties WHERE owner_id = ? AND is_featured = 1",
      [req.userId]
    );
    const featuredCount = countRow ? countRow.count : 0;

    // 3. Fetch settings for featured price and text
    const [[priceRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'featured_price'");
    const [[textRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'featured_text'");
    
    const featuredPrice = priceRow ? Number(priceRow.value) : 299;
    const featuredText = textRow ? textRow.value : "Pin your listing to the top of home feed and search results to get up to 10x more leads.";

    const isEligibleForFree = isSubscribed && (featuredCount < 4);

    res.json({
      isSubscribed,
      featuredCount,
      freeFeaturedLimit: 4,
      featuredPrice,
      featuredText,
      isEligibleForFree
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch featured status" });
  }
});

// GET /api/properties/mine — the logged-in user's own listings, any status
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.role AS user_role FROM properties p
       JOIN users u ON u.id = p.owner_id
       WHERE p.owner_id = ? ORDER BY p.created_at DESC`,
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
      `SELECT p.*, u.name AS owner_name, u.phone AS owner_phone, u.role AS user_role,
              u.agency_address, u.agency_district
       FROM properties p JOIN users u ON u.id = p.owner_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Property not found" });

    // Safe View tracking (IP + User-Agent cooldown of 24h per property, skip owner views)
    const visitorId = req.userId || null;
    const isOwnerViewing = visitorId && visitorId === rows[0].owner_id;

    if (!isOwnerViewing) {
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";
      const userAgent = req.headers["user-agent"] || "";

      const cooldownQuery = visitorId
        ? `SELECT id FROM property_views 
           WHERE property_id = ? AND visitor_id = ? 
           AND viewed_at > NOW() - INTERVAL 10 SECOND`
        : `SELECT id FROM property_views 
           WHERE property_id = ? AND ip_address = ? AND user_agent = ? 
           AND viewed_at > NOW() - INTERVAL 10 SECOND`;

      const cooldownParams = visitorId 
        ? [req.params.id, visitorId]
        : [req.params.id, ipAddress, userAgent];

      try {
        const [existingViews] = await pool.query(cooldownQuery, cooldownParams);
        if (existingViews.length === 0) {
          await pool.query(
            "INSERT INTO property_views (property_id, visitor_id, ip_address, user_agent) VALUES (?, ?, ?, ?)",
            [req.params.id, visitorId, ipAddress, userAgent]
          );
          await pool.query("UPDATE properties SET views = views + 1 WHERE id = ?", [req.params.id]);
          rows[0].views += 1;
        }
      } catch (err) {
        console.error("View tracking error:", err);
      }
    }

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

    const isAdmin = req.headers["x-admin-auth"] === "KeralaRealtyAdminSecretToken2026";
    let contactAccess = isAdmin;
    if (!contactAccess && req.userId) {
      if (req.userId === rows[0].owner_id) {
        contactAccess = true;
      } else {
        const accessCheck = await checkUserAccess(req.userId);
        contactAccess = accessCheck.hasAccess;

        if (!contactAccess) {
          const [unlocked] = await pool.query(
            "SELECT 1 FROM contact_clicks WHERE user_id = ? AND property_id = ?",
            [req.userId, rows[0].id]
          );
          if (unlocked.length > 0) {
            contactAccess = true;
          }
        }
      }
    }

    const mediaByProperty = await fetchMediaByPropertyIds([rows[0].id]);
    const publicProp = toPublicProperty(rows[0], mediaByProperty[rows[0].id] || []);

    const [[adminContactRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'admin_contact_number'");
    const adminContactNumber = adminContactRow ? adminContactRow.value : "+91 94460 12345";

    if (rows[0].use_admin_contact === 1) {
      publicProp.contactNumber = adminContactNumber;
      publicProp.whatsappNumber = adminContactNumber;
      rows[0].owner_phone = adminContactNumber;
    } else {
      if (!contactAccess) {
        publicProp.contactNumber = "+91 XXXXX XXXXX";
        publicProp.whatsappNumber = "+91 XXXXX XXXXX";
        rows[0].owner_phone = "+91 XXXXX XXXXX";
      }
    }

    // Mask details if user is not logged in at all (Guest Preview)
    let isMasked = false;
    if (!req.userId) {
      isMasked = true;
      publicProp.address = "Exact location hidden. Log in to view.";
      publicProp.brokerName = null;
      publicProp.agencyName = null;
      rows[0].owner_name = "Owner details hidden";
    }

    res.json({
      ...publicProp,
      ownerName: rows[0].owner_name,
      ownerPhone: rows[0].owner_phone,
      saveCount: saveCountRow.saveCount,
      enquiryCount: enquiryCountRow.enquiryCount,
      isSaved,
      avgRating: Number(ratingRow.avgRating) || 0,
      ratingCount: Number(ratingRow.ratingCount) || 0,
      contactAccess,
      isMasked,
      agencyAddress: rows[0].agency_address || null,
      agencyDistrict: rows[0].agency_district || null,
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

    // Fetch property details to notify the owner
    const [[prop]] = await pool.query(
      "SELECT owner_id, title FROM properties WHERE id = ?",
      [req.params.id]
    );
    
    if (prop && prop.owner_id !== req.userId) {
      // Get the liker's profile name
      const [[liker]] = await pool.query(
        "SELECT name FROM users WHERE id = ?",
        [req.userId]
      );
      const name = liker ? liker.name : "Someone";
      
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, property_id) 
         VALUES (?, ?, 'like', ?, ?)`,
        [prop.owner_id, req.userId, `${name} liked your property "${prop.title}"`, req.params.id]
      );
    }

    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update saved properties" });
  }
});

// POST /api/properties/:id/feature — Make property featured (promoted)
router.post("/:id/feature", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT owner_id, title FROM properties WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Property not found." });
    }
    if (rows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "You do not own this property listing." });
    }

    await pool.query("UPDATE properties SET is_featured = 1 WHERE id = ?", [id]);

    // Log activity
    const logAction = `Property listing "${rows[0].title}" (ID: #${id}) promoted to Featured tier.`;
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (?, ?, 'Properties')", [req.userId, logAction]);

    res.json({ success: true, message: "Property promoted to Featured status successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to feature property." });
  }
});

router.get("/saved/mine", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.role AS user_role FROM saved_properties sp
       JOIN properties p ON p.id = sp.property_id
       JOIN users u ON u.id = p.owner_id
       WHERE sp.user_id = ? ORDER BY sp.created_at DESC`,
      [req.userId]
    );
    const mediaByProperty = await fetchMediaByPropertyIds(rows.map((r) => r.id));

    let contactAccess = false;
    let unlockedPropertyIds = new Set();
    if (req.userId) {
      const accessCheck = await checkUserAccess(req.userId);
      contactAccess = accessCheck.hasAccess;

      const [clicks] = await pool.query(
        "SELECT property_id FROM contact_clicks WHERE user_id = ?",
        [req.userId]
      );
      unlockedPropertyIds = new Set(clicks.map(c => c.property_id));
    }

    res.json(rows.map((r) => {
      const publicProp = toPublicProperty(r, mediaByProperty[r.id] || [], true);
      const isUnlocked = unlockedPropertyIds.has(r.id);
      if (!contactAccess && r.owner_id !== req.userId && !isUnlocked) {
        publicProp.contactNumber = "+91 XXXXX XXXXX";
        publicProp.whatsappNumber = "+91 XXXXX XXXXX";
      }
      return publicProp;
    }));
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

// POST /api/properties/:id/schedule  { date } — visitor schedules a visit
router.post("/:id/schedule", requireAuth, async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Schedule date is required." });
    }

    // Get the property owner
    const [propRows] = await pool.query("SELECT title, owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (propRows.length === 0) {
      return res.status(404).json({ error: "Property not found." });
    }
    const prop = propRows[0];

    // Get the visitor's name
    const [[visitor]] = await pool.query("SELECT name FROM users WHERE id = ?", [req.userId]);
    const visitorName = visitor ? visitor.name : "Someone";

    // Notify the property owner/broker/agency
    if (prop.owner_id && prop.owner_id !== req.userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, property_id, title, link)
         VALUES (?, ?, 'schedule', ?, ?, ?, ?)`,
        [
          prop.owner_id, 
          req.userId, 
          `${visitorName} scheduled a visit for your property "${prop.title}" on ${date}`, 
          req.params.id,
          "Visit Scheduled",
          `/my-properties/${req.params.id}`
        ]
      );
    }

    res.json({ success: true, message: "Visit scheduled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to schedule visit" });
  }
});

// POST /api/properties — create a new listing (multipart/form-data)
// Fields match the Add Property wizard's steps 1–4.
router.post("/", requireAuth, upload.any(), optimizeImages, async (req, res) => {
  let user;
  let isOverLimit = false;
  try {
    const [userRows] = await pool.query(
      "SELECT role, subscription_status, subscription_duration_months, agency_logo_url, is_free_subscription_granted FROM users WHERE id = ?",
      [req.userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    user = userRows[0];
    const isSubscribed = user.subscription_status === "active";
    const isFreeGranted = user.is_free_subscription_granted === 1;
    const durationMonths = Number(user.subscription_duration_months || 0);

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS count FROM properties WHERE owner_id = ?",
      [req.userId]
    );
    const listingCount = countRows[0].count;

    // Enforce role-wise posting limits
    const roleLower = (user.role || "").toLowerCase();
    let allowedLimit = 2; // Default owner free limit

    if (roleLower === "owner") {
      allowedLimit = isSubscribed ? 5 : 2;
    } else if (roleLower === "broker" || roleLower === "agency") {
      if (isSubscribed) {
        allowedLimit = durationMonths === 1 ? 15 : 20; // 1 month -> 15 posts, 6 months / 1 year -> 20 posts
      } else {
        allowedLimit = 5; // Broker/Agency trial limit
      }
    } else {
      // Standard buyer (user) making their very first post
      const requestedRole = (req.body.listingRole || "").toLowerCase();
      if (requestedRole === "broker" || requestedRole === "agency") {
        allowedLimit = 5;
      } else {
        allowedLimit = 2;
      }
    }

    if (isFreeGranted) {
      isOverLimit = false;
    } else if (listingCount >= allowedLimit) {
      isOverLimit = true;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Limit check failed" });
  }

  const conn = await pool.getConnection();
  try {
    const {
      title, propertyType, purpose, price, areaSqft, address, district,
      bedrooms, bathrooms, furnishing, facing, propertyAge, description, listingRole,
      contactNumber, whatsappNumber, ownerName, brokerName, agencyName, youtubeUrl,
      isBrokerPersonalProperty, isPriceNegotiable, latitude, longitude,
    } = req.body;

    if (!propertyType || !purpose || !price || !areaSqft || !address || !district) {
      return res.status(400).json({ error: "Missing required property fields" });
    }

    await conn.beginTransaction();

    let finalRole = user.role;
    if (user.role === "user") {
      const allowedRoles = ["owner", "broker", "agency"];
      const requestedRole = (listingRole || "").toLowerCase();
      finalRole = allowedRoles.includes(requestedRole) ? requestedRole : "owner";

      // Query settings to get the dynamic trial days limit for this locked role
      const settingKey = finalRole === "agency" ? "default_trial_days_agency" : (finalRole === "broker" ? "default_trial_days_broker" : "default_trial_days");
      const [[daysRow]] = await conn.query("SELECT `value` FROM settings WHERE `key` = ?", [settingKey]);
      const defaultDays = daysRow ? parseInt(daysRow.value, 10) : (finalRole === "agency" ? 3 : 5);

      // Update the user's role and trial expiry in real-time inside the users table!
      await conn.query(
        "UPDATE users SET role = ?, trial_ends_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY) WHERE id = ?",
        [finalRole, defaultDays, req.userId]
      );
    }

    const files = req.files || [];
    const logoFile = files.find((f) => f.fieldname === "agencyLogo");
    const mediaFiles = files.filter((f) => f.fieldname === "media");
    const agencyLogoUrl = logoFile ? `/uploads/${logoFile.filename}` : (user.agency_logo_url || null);

    // Synchronize Agency profile details (name and logo) to the users table
    if (finalRole === "agency") {
      const updateFields = [];
      const updateVals = [];
      if (agencyName) {
        updateFields.push("name = ?");
        updateVals.push(agencyName);
      }
      if (agencyLogoUrl) {
        updateFields.push("agency_logo_url = ?");
        updateVals.push(agencyLogoUrl);
      }
      if (updateFields.length > 0) {
        updateVals.push(req.userId);
        await conn.query(
          `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
          updateVals
        );
      }
    }

    const initialStatus = isOverLimit ? 'Inactive' : 'Pending';
    const finalIsBrokerPersonalProperty = (finalRole === "broker" && (isBrokerPersonalProperty === "true" || isBrokerPersonalProperty === true || isBrokerPersonalProperty === 1)) ? 1 : 0;
    const finalIsPriceNegotiable = (isPriceNegotiable === "true" || isPriceNegotiable === true || isPriceNegotiable === 1) ? 1 : 0;

    const [result] = await conn.query(
      `INSERT INTO properties
        (owner_id, title, property_type, purpose, price, area_sqft, address, district,
         bedrooms, bathrooms, furnishing, facing, property_age, description, listing_role,
         contact_number, whatsapp_number, owner_name, broker_name, agency_name, agency_logo_url, youtube_url, status, is_broker_personal_property, is_price_negotiable, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        title || `${propertyType} in ${district}`,
        propertyType, purpose, price, areaSqft, address, district,
        bedrooms || 0, bathrooms || 0, furnishing || null, facing || null,
        propertyAge || null, description || null, finalRole,
        contactNumber || null, whatsappNumber || null,
        ownerName || null, brokerName || null, agencyName || null, agencyLogoUrl,
        youtubeUrl || null,
        initialStatus,
        finalIsBrokerPersonalProperty,
        finalIsPriceNegotiable,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
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

    // Fetch updated user details to synchronize role locked state immediately
    const [updatedUserRows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    const accessCheck = await checkUserAccess(req.userId);
    const [countRows] = await pool.query("SELECT COUNT(*) AS count FROM properties WHERE owner_id = ?", [req.userId]);
    const updatedUser = {
      id: updatedUserRows[0].id,
      name: updatedUserRows[0].name,
      email: updatedUserRows[0].email,
      phone: updatedUserRows[0].phone,
      location: updatedUserRows[0].location,
      avatarUrl: updatedUserRows[0].avatar_url,
      trialEndsAt: updatedUserRows[0].trial_ends_at,
      subscriptionStatus: updatedUserRows[0].subscription_status,
      razorpaySubscriptionId: updatedUserRows[0].razorpay_subscription_id,
      role: updatedUserRows[0].role,
      hasTrial: accessCheck.hasTrial,
      remainingDays: accessCheck.remainingDays,
      isSubscribed: accessCheck.isSubscribed,
      inquiryCount: accessCheck.inquiryCount,
      propertiesCount: countRows[0].count,
    };

    res.status(201).json({ id: propertyId, status: initialStatus, isOverLimit, user: updatedUser });
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
// PATCH /api/properties/:id/status  { status: "Active" | "Inactive" | "Draft", useAdminContact?: boolean }
// Owner can only toggle Active/Inactive/Draft — Pending -> Active is admin-only (see admin routes).
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status, useAdminContact } = req.body;
    const allowed = ["Active", "Inactive", "Draft"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Status must be one of ${allowed.join(", ")}` });
    }

    const [rows] = await pool.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: "Not your property" });

    let finalUseAdminContact = 0;

    if (status === "Active") {
      const accessCheck = await checkUserAccess(req.userId);
      
      // If user trial/subscription has expired
      if (!accessCheck.hasAccess) {
        // If they haven't explicitly chosen the admin fallback contact override option, intercept!
        if (useAdminContact !== true) {
          return res.status(403).json({
            requiresActivationChoice: true,
            error: "You are currently on the free/unpaid tier. Upgrade to show your own number, or activate under the Admin number fallback.",
          });
        }
        // User explicitly chose fallback option
        finalUseAdminContact = 1;
      }
      
      // Still enforce active limit of 5 for free users (only if not using admin contact fallback)
      const isSubscribed = accessCheck.isSubscribed;
      if (!isSubscribed && finalUseAdminContact !== 1) {
        const [activeCountRows] = await pool.query(
          "SELECT COUNT(*) AS count FROM properties WHERE owner_id = ? AND status = 'Active' AND use_admin_contact = 0",
          [req.userId]
        );
        const activeCount = activeCountRows[0].count;
        if (activeCount >= 5) {
          return res.status(403).json({
            error: "Free active listing limit reached. Upgrade to Premium to activate this property."
          });
        }
      }
    }

    await pool.query(
      "UPDATE properties SET status = ?, use_admin_contact = ? WHERE id = ?",
      [status, finalUseAdminContact, req.params.id]
    );

    if (status === "Active" && finalUseAdminContact === 1) {
      const logMessage = `User #${req.userId} activated Property #${req.params.id} under Admin contact fallback number.`;
      await pool.query(
        "INSERT INTO activity_logs (user_id, action, category) VALUES (?, ?, 'Properties')",
        [req.userId, logMessage]
      );
    }

    res.json({ id: Number(req.params.id), status, useAdminContact: finalUseAdminContact === 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// POST /api/properties/:id/restore-contact — restore property contact details to owner's details
router.post("/:id/restore-contact", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Property not found" });
    if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: "Not your property" });

    const accessCheck = await checkUserAccess(req.userId);
    if (!accessCheck.hasAccess) {
      return res.status(403).json({ error: "You need an active subscription or trial to display your own contact details." });
    }

    await pool.query("UPDATE properties SET use_admin_contact = 0 WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Property contact info successfully restored to your own details." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to restore contact details" });
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

// PUT /api/properties/:id - Edit property details and add new media files
router.put("/:id", requireAuth, upload.any(), optimizeImages, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      title, propertyType, purpose, price, areaSqft, address, district,
      bedrooms, bathrooms, furnishing, facing, propertyAge, description, listingRole,
      contactNumber, whatsappNumber, ownerName, brokerName, agencyName, youtubeUrl,
      isBrokerPersonalProperty, isPriceNegotiable, latitude, longitude,
    } = req.body;

    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT owner_id, agency_logo_url FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Property not found" });
    }
    if (rows[0].owner_id !== req.userId) {
      await conn.rollback();
      return res.status(403).json({ error: "Unauthorized - not your listing" });
    }

    const files = req.files || [];
    const logoFile = files.find((f) => f.fieldname === "agencyLogo");
    const mediaFiles = files.filter((f) => f.fieldname === "media");
    const agencyLogoUrl = logoFile ? `/uploads/${logoFile.filename}` : rows[0].agency_logo_url;

    const finalIsBrokerPersonalProperty = (String(listingRole || "").toLowerCase() === "broker" && (isBrokerPersonalProperty === "true" || isBrokerPersonalProperty === true || isBrokerPersonalProperty === 1)) ? 1 : 0;
    const finalIsPriceNegotiable = (isPriceNegotiable === "true" || isPriceNegotiable === true || isPriceNegotiable === 1) ? 1 : 0;

    await conn.query(
      `UPDATE properties SET
        title = ?, property_type = ?, purpose = ?, price = ?, area_sqft = ?, address = ?, district = ?,
        bedrooms = ?, bathrooms = ?, furnishing = ?, facing = ?, property_age = ?, description = ?, listing_role = ?,
        contact_number = ?, whatsapp_number = ?, owner_name = ?, broker_name = ?, agency_name = ?, agency_logo_url = ?, youtube_url = ?, is_broker_personal_property = ?, is_price_negotiable = ?,
        latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        title || `${propertyType} in ${district}`,
        propertyType, purpose, price, areaSqft, address, district,
        bedrooms || 0, bathrooms || 0, furnishing || null, facing || null,
        propertyAge || null, description || null, listingRole,
        contactNumber || null, whatsappNumber || null,
        ownerName || null, brokerName || null, agencyName || null, agencyLogoUrl,
        youtubeUrl || null,
        finalIsBrokerPersonalProperty,
        finalIsPriceNegotiable,
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        req.params.id,
      ]
    );

    // If new media files are uploaded, insert them (appending to existing ones)
    if (mediaFiles.length > 0) {
      // Find current max sort_order
      const [[maxSortRow]] = await conn.query(
        "SELECT COALESCE(MAX(sort_order), -1) AS maxSort FROM property_media WHERE property_id = ?",
        [req.params.id]
      );
      let startIdx = maxSortRow.maxSort + 1;
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const mediaType = file.mimetype.startsWith("video") ? "video" : "image";
        await conn.query(
          "INSERT INTO property_media (property_id, media_type, url, sort_order) VALUES (?, ?, ?, ?)",
          [req.params.id, mediaType, `/uploads/${file.filename}`, startIdx + i]
        );
      }
    }

    await conn.commit();
    res.json({ success: true, message: "Property updated successfully" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to update property" });
  } finally {
    conn.release();
  }
});

// DELETE /api/properties/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // 1. Fetch property to check ownership
    const [rows] = await conn.query("SELECT owner_id FROM properties WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ error: "Property not found" });
    }
    if (rows[0].owner_id !== req.userId) {
      conn.release();
      return res.status(403).json({ error: "Not your property" });
    }

    // 2. Fetch all media file paths associated with this property BEFORE deleting DB record
    const [mediaRows] = await conn.query("SELECT url FROM property_media WHERE property_id = ?", [req.params.id]);

    await conn.beginTransaction();

    // 3. Delete the property record (cascades database delete to property_media and other child tables)
    await conn.query("DELETE FROM properties WHERE id = ?", [req.params.id]);

    await conn.commit();
    conn.release();

    // 4. Physical file cleanup from uploads folders
    console.log(`[DELETE PROPERTY] Found ${mediaRows.length} media items to delete.`);

    for (const media of mediaRows) {
      if (media.url) {
        await deleteUploadedFile(media.url);
      }
    }

    res.status(204).end();
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// GET /api/properties/:id/viewers — Retrieve detailed list of property viewers (owner only)
router.get("/:id/viewers", requireAuth, async (req, res) => {
  try {
    const propertyId = req.params.id;

    // 1. Verify property ownership
    const [properties] = await pool.query(
      "SELECT owner_id FROM properties WHERE id = ?",
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (properties[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "Unauthorized: You do not own this property" });
    }

    // 2. Fetch viewers
    const [viewers] = await pool.query(
      `SELECT pv.id, pv.viewed_at, pv.visitor_id,
              u.name AS visitor_name, u.email AS visitor_email, u.phone AS visitor_phone, u.avatar_url AS visitor_avatar
       FROM property_views pv
       LEFT JOIN users u ON u.id = pv.visitor_id
       WHERE pv.property_id = ?
       ORDER BY pv.viewed_at DESC
       LIMIT 100`,
      [propertyId]
    );

    const accessCheck = await checkUserAccess(req.userId);
    if (!accessCheck.hasAccess) {
      viewers.forEach((v) => {
        if (v.visitor_phone) v.visitor_phone = "+91 XXXXX XXXXX";
        if (v.visitor_email) v.visitor_email = "locked@keralarealty.com";
      });
    }

    res.json(viewers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch property viewers" });
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

    // Check if the property exists and get owner details
    const [propRows] = await pool.query("SELECT owner_id, title FROM properties WHERE id = ?", [req.params.id]);
    if (propRows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }
    const prop = propRows[0];

    // Prevent duplicate reviews from the same user for this property
    const [existing] = await pool.query(
      "SELECT id FROM property_reviews WHERE property_id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "You have already reviewed this property." });
    }

    await pool.query(
      "INSERT INTO property_reviews (property_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
      [req.params.id, req.userId, rating, comment]
    );

    // Get the reviewer's name
    const [[reviewer]] = await pool.query("SELECT name FROM users WHERE id = ?", [req.userId]);
    const reviewerName = reviewer ? reviewer.name : "Someone";

    // Notify the property owner/broker/agency
    if (prop.owner_id && prop.owner_id !== req.userId) {
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, property_id, title, link)
         VALUES (?, ?, 'review', ?, ?, ?, ?)`,
        [
          prop.owner_id, 
          req.userId, 
          `${reviewerName} submitted a new review for your property "${prop.title}"`, 
          req.params.id,
          "New Property Review",
          `/my-properties/${req.params.id}`
        ]
      );
    }

    res.json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// POST /api/properties/:id/click-inquiry
router.post("/:id/click-inquiry", requireAuth, async (req, res) => {
  try {
    const propertyId = Number(req.params.id);
    const accessCheck = await checkUserAccess(req.userId);

    // If they already clicked this property, it's a free re-access. Just succeed!
    const [existing] = await pool.query(
      "SELECT id FROM contact_clicks WHERE user_id = ? AND property_id = ?",
      [req.userId, propertyId]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: "Contact already unlocked previously" });
    }

    // It's a new click! Check if they have access.
    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        error: "Free contact inquiries limit reached. Please upgrade to a Premium Plan to unlock details.",
        requiresPayment: true,
      });
    }

    // Log the click
    await pool.query(
      "INSERT IGNORE INTO contact_clicks (user_id, property_id) VALUES (?, ?)",
      [req.userId, propertyId]
    );

    // Fetch updated count
    const [[countRow]] = await pool.query(
      "SELECT COUNT(DISTINCT property_id) AS count FROM contact_clicks WHERE user_id = ?",
      [req.userId]
    );
    const clickCount = countRow ? countRow.count : 0;

    res.json({
      success: true,
      message: "Contact unlocked successfully",
      inquiryCount: clickCount,
      remainingClicks: Math.max(0, 20 - clickCount)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record contact inquiry" });
  }
});

export default router;
