import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { checkUserAccess } from "../utils/access.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});
const upload = multer({ storage });

const router = Router();

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    whatsappNumber: row.whatsapp_number,
    location: row.location,
    avatarUrl: row.avatar_url,
    trialEndsAt: row.custom_trial_expiry || row.trial_ends_at,
    subscriptionStatus: row.subscription_status,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    role: row.role,
    createdAt: row.created_at,
    subscriptionDurationMonths: row.subscription_duration_months,
  };
}

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    const accessCheck = await checkUserAccess(req.userId);
    const [countRows] = await pool.query("SELECT COUNT(*) AS count FROM properties WHERE owner_id = ?", [req.userId]);
    res.json({
      ...toPublicUser(rows[0]),
      hasAccess: accessCheck.hasAccess,
      hasTrial: accessCheck.hasTrial,
      remainingDays: accessCheck.remainingDays,
      isSubscribed: accessCheck.isSubscribed,
      inquiryCount: accessCheck.inquiryCount,
      propertiesCount: countRows[0].count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/users/me  { name, phone, email, location, avatarUrl, whatsappNumber }
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { name, phone, email, location, avatarUrl, whatsappNumber } = req.body;
    await pool.query(
      `UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        location = COALESCE(?, location),
        avatar_url = COALESCE(?, avatar_url),
        whatsapp_number = COALESCE(?, whatsapp_number)
       WHERE id = ?`,
      [name, phone, email, location, avatarUrl, whatsappNumber, req.userId]
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    const accessCheck = await checkUserAccess(req.userId);
    const [countRows] = await pool.query("SELECT COUNT(*) AS count FROM properties WHERE owner_id = ?", [req.userId]);
    res.json({
      ...toPublicUser(rows[0]),
      hasAccess: accessCheck.hasAccess,
      hasTrial: accessCheck.hasTrial,
      remainingDays: accessCheck.remainingDays,
      isSubscribed: accessCheck.isSubscribed,
      inquiryCount: accessCheck.inquiryCount,
      propertiesCount: countRows[0].count,
    });
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
    const accessCheck = await checkUserAccess(req.userId);
    const isTrialExpired = (accessCheck.role === "Broker" || accessCheck.role === "Agency") && !accessCheck.hasAccess;

    const [recentVisitors] = await pool.query(
      `SELECT u.name AS visitorName, u.location AS visitorLocation, u.phone AS visitorPhone, u.email AS visitorEmail,
              p.title AS propertyTitle, e.created_at AS enquiredAt
       FROM enquiries e
       JOIN properties p ON p.id = e.property_id
       JOIN users u ON u.id = e.visitor_id
       WHERE p.owner_id = ?
       ORDER BY e.created_at DESC LIMIT 20`,
      [req.userId]
    );

    const processedVisitors = recentVisitors.map(v => {
      if (isTrialExpired) {
        return {
          visitorName: "Locked Visitor Profile",
          visitorLocation: "Subscribe to unlock details",
          visitorPhone: "+91 XXXXX XXXXX",
          visitorEmail: "locked@keralarealty.com",
          propertyTitle: v.propertyTitle,
          enquiredAt: v.enquiredAt,
          isLocked: true
        };
      }
      return {
        ...v,
        isLocked: false
      };
    });

    res.json({
      totalViews: viewsRow.totalViews,
      totalEnquiries: enquiriesRow.totalEnquiries,
      recentVisitors: processedVisitors,
      isTrialExpired,
      hasTrial: accessCheck.hasTrial,
      remainingDays: accessCheck.remainingDays,
      role: accessCheck.role,
      isSubscribed: accessCheck.isSubscribed,
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

// POST /api/users/me/role-switch
router.post("/me/role-switch", requireAuth, async (req, res) => {
  try {
    const { requestedRole } = req.body;
    const allowedRoles = ["Broker", "Agency"];
    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ error: "Invalid requested role. You can only switch to Broker or Agency." });
    }

    const [userRows] = await pool.query("SELECT role FROM users WHERE id = ?", [req.userId]);
    if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
    const userRole = userRows[0].role;

    if (userRole === "user") {
      return res.status(400).json({ error: "You can select your role directly when posting your first property." });
    }

    if (userRole === requestedRole) {
      return res.status(400).json({ error: "You are already in this role." });
    }

    const [existing] = await pool.query(
      "SELECT id FROM role_switch_requests WHERE user_id = ? AND requested_role = ? AND status = 'Pending'",
      [req.userId, requestedRole]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Upgrade request already pending admin approval" });
    }

    await pool.query(
      "INSERT INTO role_switch_requests (user_id, requested_role, status) VALUES (?, ?, 'Pending')",
      [req.userId, requestedRole]
    );

    res.status(201).json({ message: "Upgrade request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit upgrade request" });
  }
});

// GET /api/users/me/role-switch
router.get("/me/role-switch", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT status, created_at FROM role_switch_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1",
      [req.userId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch switch request status" });
  }
});

// GET /api/users/me/notifications
router.get("/me/notifications", requireAuth, async (req, res) => {
  try {
    const accessCheck = await checkUserAccess(req.userId);
    const isLocked = !accessCheck.hasAccess;

    const [rows] = await pool.query(
      `SELECT n.*, u.name AS sender_name, u.role AS sender_role, u.avatar_url AS sender_avatar
       FROM notifications n
       LEFT JOIN users u ON u.id = n.sender_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC LIMIT 50`,
      [req.userId]
    );

    const processed = rows.map((n) => {
      if (isLocked && n.type !== "RoleUpgrade" && n.type !== "System") {
        let msg = "Someone contacted you (Upgrade to view profile)";
        if (n.type === "like") {
          msg = "Someone liked your property (Upgrade to view profile)";
        } else if (n.type === "review") {
          msg = "Someone reviewed your property (Upgrade to view profile)";
        }
        return {
          ...n,
          sender_name: "Locked Profile",
          sender_avatar: null,
          message: msg,
          isLocked: true,
        };
      }
      return {
        ...n,
        isLocked: false,
      };
    });

    res.json(processed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// POST /api/users/me/notifications/read-all
router.post("/me/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = 1 WHERE user_id = ?",
      [req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// POST /api/users/setup-role (Set user role details and lock role)
router.post("/setup-role", requireAuth, upload.single("agencyLogo"), async (req, res) => {
  try {
    const { role, ownerName, brokerName, agencyName, contactPhone, whatsappNumber, agencyAddress, agencyDistrict } = req.body;
    const allowedRoles = ["owner", "broker", "agency"];
    const targetRole = (role || "").toLowerCase();

    if (!allowedRoles.includes(targetRole)) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    // Check if user is already locked
    const [[user]] = await pool.query("SELECT role FROM users WHERE id = ?", [req.userId]);
    if (user && user.role !== "user") {
      return res.status(400).json({ error: "Your account role is already locked. Contact Admin to switch." });
    }

    // Query settings to get default trial days for this role
    const settingKey = targetRole === "agency" ? "default_trial_days_agency" : (targetRole === "broker" ? "default_trial_days_broker" : "default_trial_days");
    const [[daysRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = ?", [settingKey]);
    const defaultDays = daysRow ? parseInt(daysRow.value, 10) : (targetRole === "agency" ? 3 : 5);

    // Save details to users table
    const nameToSave = targetRole === "owner" ? ownerName : (targetRole === "broker" ? brokerName : agencyName);
    const agencyLogoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const finalAvatar = targetRole === "agency" && agencyLogoUrl ? agencyLogoUrl : null;

    await pool.query(
      `UPDATE users 
       SET role = ?, 
           name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           whatsapp_number = COALESCE(?, whatsapp_number),
           avatar_url = COALESCE(?, avatar_url),
           agency_logo_url = ?,
           agency_address = ?,
           agency_district = ?,
           trial_ends_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY)
       WHERE id = ?`,
      [
        targetRole, 
        nameToSave, 
        contactPhone, 
        whatsappNumber || null,
        finalAvatar, 
        targetRole === "agency" && agencyLogoUrl ? agencyLogoUrl : null,
        targetRole === "agency" ? (agencyAddress || null) : null,
        targetRole === "agency" ? (agencyDistrict || null) : null,
        defaultDays, 
        req.userId
      ]
    );

    const [updatedUser] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    const accessCheck = await checkUserAccess(req.userId);
    res.json({ 
      success: true, 
      message: "Role setup completed and locked successfully.",
      user: {
        ...toPublicUser(updatedUser[0]),
        hasAccess: accessCheck.hasAccess,
        hasTrial: accessCheck.hasTrial,
        remainingDays: accessCheck.remainingDays,
        isSubscribed: accessCheck.isSubscribed,
        inquiryCount: accessCheck.inquiryCount,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to setup role" });
  }
});

// DELETE /api/users/me — Self-deletion of account and all associated data
router.delete("/me", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const userId = req.userId;
    
    // 1. Fetch user avatar & logo
    const [[user]] = await conn.query("SELECT name, email, avatar_url, agency_logo_url FROM users WHERE id = ?", [userId]);
    
    // 2. Fetch properties owned by this user
    const [properties] = await conn.query("SELECT id, agency_logo_url FROM properties WHERE owner_id = ?", [userId]);
    
    // 3. Fetch media files associated with these properties
    const propIds = properties.map(p => p.id);
    let mediaFiles = [];
    if (propIds.length > 0) {
      [mediaFiles] = await conn.query(
        `SELECT url FROM property_media WHERE property_id IN (${propIds.map(() => "?").join(",")})`,
        propIds
      );
    }

    // Collect all media paths to delete
    const pathsToDelete = [];
    if (user) {
      if (user.avatar_url) pathsToDelete.push(user.avatar_url);
      if (user.agency_logo_url) pathsToDelete.push(user.agency_logo_url);
    }
    for (const p of properties) {
      if (p.agency_logo_url) pathsToDelete.push(p.agency_logo_url);
    }
    for (const m of mediaFiles) {
      if (m.url) pathsToDelete.push(m.url);
    }

    // 4. Perform permanent deletion in database tables
    // Clear notifications referencing this user
    await conn.query("DELETE FROM notifications WHERE user_id = ? OR sender_id = ?", [userId, userId]);
    // Clear activity logs referencing this user
    await conn.query("DELETE FROM activity_logs WHERE user_id = ?", [userId]);
    // Clear role switch requests
    await conn.query("DELETE FROM role_switch_requests WHERE user_id = ?", [userId]);
    // Clear enquiries where this user is visitor
    await conn.query("DELETE FROM enquiries WHERE visitor_id = ?", [userId]);
    // Clear saved properties
    await conn.query("DELETE FROM saved_properties WHERE user_id = ?", [userId]);
    // Clear contact clicks
    await conn.query("DELETE FROM contact_clicks WHERE user_id = ?", [userId]);
    // Clear property reviews
    await conn.query("DELETE FROM property_reviews WHERE user_id = ?", [userId]);

    // Now delete properties (which will cascade to property_media and enquiries)
    if (propIds.length > 0) {
      await conn.query(`DELETE FROM properties WHERE owner_id = ?`, [userId]);
    }

    // Insert persistent activity log of self-deletion (user_id is null so it's not cascaded out)
    if (user) {
      await conn.query(
        "INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Users')",
        [`User "${user.name}" (email: ${user.email || 'N/A'}) self-deleted their account.`]
      );
    }

    // Finally delete the user account
    await conn.query("DELETE FROM users WHERE id = ?", [userId]);

    await conn.commit();

    // 5. Delete physical files from disk
    const serverUploadsDir = path.join(process.cwd(), "uploads");
    for (const relativePath of pathsToDelete) {
      if (typeof relativePath === "string" && relativePath.startsWith("/uploads/")) {
        const filename = relativePath.substring("/uploads/".length);
        const fullPath = path.join(serverUploadsDir, filename);
        try {
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log("Successfully deleted physical file:", fullPath);
          }
        } catch (err) {
          console.error("Failed to delete physical file:", fullPath, err);
        }
      }
    }

    res.json({ success: true, message: "Account and all associated data permanently deleted." });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to delete account" });
  } finally {
    conn.release();
  }
});

export default router;
