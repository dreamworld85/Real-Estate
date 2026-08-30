import { Router } from "express";
import { pool } from "../db.js";
import { upload } from "../middleware/upload.js";
import { deleteUploadedFile } from "../utils/fileHelper.js";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const router = Router();

// Middleware to verify admin login session
function checkAdminSession(req, res, next) {
  // Simple session check for admin.
  // In a real application we would use signed cookies or JWT,
  // but for local sandbox verification we can check headers or simple auth query/header
  const isAdmin = req.headers["x-admin-auth"] === "KeralaRealtyAdminSecretToken2026";
  if (!isAdmin) {
    return res.status(401).json({ message: "Unauthorized admin access." });
  }
  next();
}

// POST /api/admin/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "Welcome_2026@") {
    return res.json({ token: "KeralaRealtyAdminSecretToken2026" });
  }
  return res.status(400).json({ message: "Invalid admin credentials." });
});

// GET /api/admin/settings/:key (Public settings reader)
router.get("/settings/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const [[row]] = await pool.query("SELECT `value` FROM settings WHERE `key` = ?", [key]);
    if (!row) {
      return res.status(404).json({ message: "Setting not found." });
    }
    res.json({ key, value: row.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/subscription-plans (Public subscription plans reader)
router.get("/subscription-plans", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM subscription_plans");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/landing/content (Public route for fetching Landing page content)
router.get("/landing/content", async (req, res) => {
  try {
    const [settingsRows] = await pool.query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'landing_%'");
    const [featuresRows] = await pool.query("SELECT * FROM landing_features ORDER BY id ASC");
    
    const content = {};
    settingsRows.forEach(row => {
      content[row.key] = row.value;
    });
    
    res.json({
      settings: content,
      features: featuresRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/app-download-settings (Public)
router.get("/app-download-settings", async (req, res) => {
  try {
    const [[settings]] = await pool.query("SELECT * FROM app_download_page_settings LIMIT 1");
    if (!settings) {
      return res.status(404).json({ message: "App download settings not found." });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/mobile-share-settings (Public)
router.get("/mobile-share-settings", async (req, res) => {
  try {
    const [[settings]] = await pool.query("SELECT * FROM mobile_share_page_settings LIMIT 1");
    if (!settings) {
      return res.status(404).json({ message: "Settings not found." });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/admin/top-locations (Public)
router.get("/top-locations", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM top_locations ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply admin protection check to all subsequent routes
router.use(checkAdminSession);

// GET /api/admin/activity-logs (Admin Protected)
router.get("/activity-logs", async (req, res) => {
  try {
    const [propertyViews] = await pool.query(`
      SELECT 
        pv.id,
        pv.viewed_at,
        pv.ip_address,
        pv.user_agent,
        p.title as property_title,
        p.id as property_id,
        u.name as visitor_name,
        u.email as visitor_email
      FROM property_views pv
      JOIN properties p ON pv.property_id = p.id
      LEFT JOIN users u ON pv.visitor_id = u.id
      ORDER BY pv.viewed_at DESC
      LIMIT 200
    `);

    const [contactClicks] = await pool.query(`
      SELECT 
        cc.id,
        cc.created_at,
        p.title as property_title,
        p.id as property_id,
        u.name as user_name,
        u.email as user_email
      FROM contact_clicks cc
      JOIN properties p ON cc.property_id = p.id
      JOIN users u ON cc.user_id = u.id
      ORDER BY cc.created_at DESC
      LIMIT 200
    `);

    res.json({
      propertyViews,
      contactClicks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/app-download-settings (Admin Protected)
router.put("/app-download-settings", upload.single("logo"), async (req, res) => {
  try {
    const { 
      main_title, 
      subtitle, 
      google_play_url, 
      app_store_url, 
      safe_secure_title, 
      safe_secure_desc, 
      trusted_users_title, 
      trusted_users_desc, 
      footer_brand, 
      footer_tagline 
    } = req.body;

    let logoUrl = req.body.brand_logo_url; // fallback to existing logo URL

    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    // Get the first record ID or create if missing
    const [rows] = await pool.query("SELECT id FROM app_download_page_settings LIMIT 1");
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO app_download_page_settings (
          brand_logo_url, main_title, subtitle, google_play_url, app_store_url,
          safe_secure_title, safe_secure_desc, trusted_users_title, trusted_users_desc,
          footer_brand, footer_tagline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logoUrl || "", main_title || "", subtitle || "", google_play_url || "", app_store_url || "",
          safe_secure_title || "", safe_secure_desc || "", trusted_users_title || "", trusted_users_desc || "",
          footer_brand || "", footer_tagline || ""
        ]
      );
    } else {
      const settingId = rows[0].id;
      await pool.query(
        `UPDATE app_download_page_settings SET
          brand_logo_url = ?, main_title = ?, subtitle = ?, google_play_url = ?, app_store_url = ?,
          safe_secure_title = ?, safe_secure_desc = ?, trusted_users_title = ?, trusted_users_desc = ?,
          footer_brand = ?, footer_tagline = ?
        WHERE id = ?`,
        [
          logoUrl, main_title, subtitle, google_play_url, app_store_url,
          safe_secure_title, safe_secure_desc, trusted_users_title, trusted_users_desc,
          footer_brand, footer_tagline,
          settingId
        ]
      );
    }

    res.json({ message: "App download settings updated successfully.", brand_logo_url: logoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/mobile-share-settings (Admin Protected)
router.put("/mobile-share-settings", upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "illustration", maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      brand_name, 
      tagline, 
      description_quote, 
      button_text, 
      google_play_url, 
      app_store_url, 
      trust_text 
    } = req.body;

    let logoUrl = req.body.brand_logo_url;
    let illustrationUrl = req.body.illustration_url;

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.illustration && req.files.illustration[0]) {
        illustrationUrl = `/uploads/${req.files.illustration[0].filename}`;
      }
    }

    const [rows] = await pool.query("SELECT id FROM mobile_share_page_settings LIMIT 1");
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO mobile_share_page_settings (
          brand_name, brand_logo_url, tagline, illustration_url, 
          description_quote, button_text, google_play_url, app_store_url, trust_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand_name || "", logoUrl || "", tagline || "", illustrationUrl || "",
          description_quote || "", button_text || "", google_play_url || "", app_store_url || "", trust_text || ""
        ]
      );
    } else {
      const settingId = rows[0].id;
      await pool.query(
        `UPDATE mobile_share_page_settings SET
          brand_name = ?, brand_logo_url = ?, tagline = ?, illustration_url = ?, 
          description_quote = ?, button_text = ?, google_play_url = ?, app_store_url = ?, trust_text = ?
        WHERE id = ?`,
        [
          brand_name, logoUrl, tagline, illustrationUrl,
          description_quote, button_text, google_play_url, app_store_url, trust_text,
          settingId
        ]
      );
    }

    res.json({ 
      message: "Mobile share settings updated successfully.", 
      brand_logo_url: logoUrl,
      illustration_url: illustrationUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// PUT /api/admin/settings/:key (Admin settings updater)
router.put("/settings/:key", upload.single("banner"), async (req, res) => {
  try {
    const { key } = req.params;
    let value = req.body.value;

    const isImageKey = [
      "welcome_banner_url",
      "login_banner_url",
      "loading_banner_url",
      "landing_hero_image",
      "landing_app_qr_image"
    ].includes(key);

    if (isImageKey && req.file) {
      value = `/uploads/${req.file.filename}`;
    }

    if (value === undefined || value === null) {
      return res.status(400).json({ message: "Setting value is required." });
    }

    await pool.query(
      "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [key, value, value]
    );

    // Dynamic Recalculation of User Trials
    if (
      key === "default_trial_days" || 
      key === "default_trial_days_broker" || 
      key === "default_trial_days_agency" ||
      key === "default_trial_days_user"
    ) {
      const days = parseInt(value, 10);
      if (!isNaN(days) && days >= 0) {
        let role = "owner";
        if (key === "default_trial_days_broker") role = "broker";
        else if (key === "default_trial_days_agency") role = "agency";
        else if (key === "default_trial_days_user") role = "user";

        // Recalculate trial_ends_at for this role's users who don't have custom overrides
        await pool.query(
          "UPDATE users SET trial_ends_at = DATE_ADD(created_at, INTERVAL ? DAY) WHERE role = ? AND custom_trial_expiry IS NULL",
          [days, role]
        );
        
        const logAction = `Global trial settings updated for ${role} to ${days} days. User trial windows recalculated.`;
        await pool.query(
          "INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'System')",
          [logAction]
        );
      }
    }

    res.json({ message: "Setting updated successfully.", key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/landing/features (Create new feature card)
router.post("/landing/features", async (req, res) => {
  try {
    const { title, description, icon } = req.body;
    if (!title || !description || !icon) {
      return res.status(400).json({ message: "Title, description, and icon are required." });
    }
    const [result] = await pool.query(
      "INSERT INTO landing_features (title, description, icon) VALUES (?, ?, ?)",
      [title, description, icon]
    );
    res.json({ id: result.insertId, title, description, icon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/landing/features/:id (Update feature card)
router.put("/landing/features/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon } = req.body;
    if (!title || !description || !icon) {
      return res.status(400).json({ message: "Title, description, and icon are required." });
    }
    await pool.query(
      "UPDATE landing_features SET title = ?, description = ?, icon = ? WHERE id = ?",
      [title, description, icon, id]
    );
    res.json({ id: Number(id), title, description, icon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/landing/features/:id (Delete feature card)
router.delete("/landing/features/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM landing_features WHERE id = ?", [id]);
    res.json({ success: true, message: "Feature deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [[{ count: users }]] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [[{ count: properties }]] = await pool.query("SELECT COUNT(*) as count FROM properties");
    const [[{ count: pending }]] = await pool.query("SELECT COUNT(*) as count FROM properties WHERE status = 'Pending'");
    const [[{ count: reports }]] = await pool.query("SELECT COUNT(*) as count FROM reported_listings WHERE status = 'Pending'");

    const [[{ count: usersSignedToday }]] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE DATE(last_login) = CURDATE() OR DATE(created_at) = CURDATE()"
    );

    const [[{ count: propertiesPostedToday }]] = await pool.query(
      "SELECT COUNT(*) as count FROM properties WHERE DATE(created_at) = CURDATE()"
    );

    res.json({
      users,
      properties,
      pending,
      reports,
      usersSignedToday,
      propertiesPostedToday,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const { search = "", role = "All" } = req.query;
    let query = "SELECT id, name, email, phone, role, is_disabled, created_at FROM users WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (role !== "All") {
      query += " AND role = ?";
      params.push(role);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [[user]] = await pool.query("SELECT id, name, email, phone, role, is_disabled, custom_trial_expiry, trial_ends_at, is_free_subscription_granted, created_at FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ message: "User not found." });

    const [[{ count: listings }]] = await pool.query("SELECT COUNT(*) as count FROM properties WHERE owner_id = ? AND status = 'Active'", [id]);
    const [[{ count: enquiries }]] = await pool.query("SELECT COUNT(*) as count FROM enquiries WHERE visitor_id = ?", [id]);
    const [[{ count: saved }]] = await pool.query("SELECT COUNT(*) as count FROM saved_properties WHERE user_id = ?", [id]);
    const [[{ count: reviews }]] = await pool.query("SELECT COUNT(*) as count FROM property_reviews WHERE user_id = ?", [id]);

    const [userProperties] = await pool.query(
      "SELECT id, title, price, district AS location, status, updated_at FROM properties WHERE owner_id = ? ORDER BY updated_at DESC",
      [id]
    );

    const [mediaRows] = await pool.query(
      `SELECT m.url, m.property_id, p.title AS property_title 
       FROM property_media m
       JOIN properties p ON p.id = m.property_id
       WHERE p.owner_id = ? AND m.media_type = 'image'`,
      [id]
    );

    res.json({
      ...user,
      listings,
      enquiries,
      saved,
      reviews,
      properties: userProperties,
      uploadedPhotos: mediaRows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/status
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_disabled } = req.body;
    await pool.query("UPDATE users SET is_disabled = ? WHERE id = ?", [is_disabled, id]);
    
    // Log activity
    const action = is_disabled ? `User ID #${id} disabled by Admin` : `User ID #${id} enabled by Admin`;
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Users')", [action]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/users/:id/subscription-override
router.put("/users/:id/subscription-override", async (req, res) => {
  try {
    const { id } = req.params;
    const { custom_trial_expiry, is_free_subscription_granted } = req.body;

    const trialExpiryVal = custom_trial_expiry ? new Date(custom_trial_expiry) : null;

    // Check if free subscription or trial is newly granted or extended
    const [[existing]] = await pool.query("SELECT is_free_subscription_granted, custom_trial_expiry FROM users WHERE id = ?", [id]);
    const wasGranted = existing ? existing.is_free_subscription_granted === 1 : false;
    const previousTrialExpiry = existing && existing.custom_trial_expiry ? new Date(existing.custom_trial_expiry) : null;
    
    const isNowGranted = is_free_subscription_granted === true || is_free_subscription_granted === 1;
    const isTrialExtended = trialExpiryVal && (!previousTrialExpiry || trialExpiryVal.getTime() !== previousTrialExpiry.getTime());

    await pool.query(
      "UPDATE users SET custom_trial_expiry = ?, is_free_subscription_granted = ? WHERE id = ?",
      [trialExpiryVal, isNowGranted ? 1 : 0, id]
    );

    if (isNowGranted && !wasGranted) {
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, title, link)
         VALUES (?, null, 'System', ?, ?, ?)`,
        [
          id,
          "Congratulations! The Admin has granted you a Free Premium Subscription. You now have unlimited access to all features.",
          "Free Subscription Granted",
          "/profile"
        ]
      );
    }

    if (isTrialExtended) {
      const formattedDate = trialExpiryVal.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, type, message, title, link)
         VALUES (?, null, 'System', ?, ?, ?)`,
        [
          id,
          `Your premium trial period has been updated/extended by the Admin to expire on ${formattedDate}.`,
          "Trial Period Updated",
          "/profile"
        ]
      );
    }

    const action = `User ID #${id} subscription overrides updated by Admin (Free Grant: ${isNowGranted ? 'Yes' : 'No'}, Trial Expiry: ${custom_trial_expiry || 'None'})`;
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Users')", [action]);

    res.json({ success: true, message: "Subscription overrides updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    // 1. Fetch user avatar & logo
    const [[user]] = await conn.query("SELECT avatar_url, agency_logo_url FROM users WHERE id = ?", [id]);
    
    // 2. Fetch properties owned by this user
    const [properties] = await conn.query("SELECT id, agency_logo_url FROM properties WHERE owner_id = ?", [id]);
    
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
    await conn.query("DELETE FROM notifications WHERE user_id = ? OR sender_id = ?", [id, id]);
    await conn.query("DELETE FROM activity_logs WHERE user_id = ?", [id]);
    await conn.query("DELETE FROM role_switch_requests WHERE user_id = ?", [id]);
    await conn.query("DELETE FROM enquiries WHERE visitor_id = ?", [id]);
    await conn.query("DELETE FROM saved_properties WHERE user_id = ?", [id]);
    await conn.query("DELETE FROM contact_clicks WHERE user_id = ?", [id]);
    await conn.query("DELETE FROM property_reviews WHERE user_id = ?", [id]);

    if (propIds.length > 0) {
      await conn.query(`DELETE FROM properties WHERE owner_id = ?`, [id]);
    }

    await conn.query("DELETE FROM users WHERE id = ?", [id]);

    // Log admin activity
    const actionMsg = `User ID #${id} completely deleted by Admin`;
    await conn.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Users')", [actionMsg]);

    await conn.commit();

    // 5. Delete physical files from disk
    for (const relativePath of pathsToDelete) {
      if (relativePath) {
        await deleteUploadedFile(relativePath);
      }
    }

    res.json({ success: true, message: "User and all associated data permanently deleted." });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/admin/properties
router.get("/properties", async (req, res) => {
  try {
    const { search = "", status = "All" } = req.query;
    let query = `
      SELECT p.*, u.name as uploader_name 
      FROM properties p 
      JOIN users u ON p.owner_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += " AND (p.title LIKE ? OR p.address LIKE ? OR p.district LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (status !== "All") {
      query += " AND p.status = ?";
      params.push(status);
    }

    const [rows] = await pool.query(query, params);

    // Fetch media
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const [mediaRows] = await pool.query(
        "SELECT property_id, url FROM property_media WHERE property_id IN (?) ORDER BY sort_order ASC",
        [ids]
      );
      rows.forEach((row) => {
        row.images = mediaRows.filter((m) => m.property_id === row.id).map((m) => m.url);
      });
    }

    res.json(rows);
  } catch (err) {
    console.error("ADMIN PROPERTIES ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/properties/:id/status
router.put("/properties/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE properties SET status = ? WHERE id = ?", [status, id]);

    // Log activity
    const action = `Property ID #${id} status set to '${status}' by Admin`;
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Properties')", [action]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/properties/:id
router.delete("/properties/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    // 1. Fetch property uploader agency logo and media urls
    const [[property]] = await conn.query("SELECT agency_logo_url FROM properties WHERE id = ?", [id]);
    const [mediaFiles] = await conn.query("SELECT url FROM property_media WHERE property_id = ?", [id]);

    const pathsToDelete = [];
    if (property && property.agency_logo_url) {
      pathsToDelete.push(property.agency_logo_url);
    }
    for (const m of mediaFiles) {
      if (m.url) pathsToDelete.push(m.url);
    }

    // 2. Perform hard delete from DB
    await conn.query("DELETE FROM properties WHERE id = ?", [id]);

    // Log activity
    const action = `Property ID #${id} deleted by Admin`;
    await conn.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Properties')", [action]);

    await conn.commit();

    // 3. Delete physical files from disk
    for (const relativePath of pathsToDelete) {
      if (relativePath) {
        await deleteUploadedFile(relativePath);
      }
    }

    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/admin/reports
router.get("/reports", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rl.id, rl.reason, rl.status, rl.created_at,
             p.id as property_id, p.title as property_title,
             u.name as reporter_name
      FROM reported_listings rl
      LEFT JOIN properties p ON rl.property_id = p.id
      LEFT JOIN users u ON rl.reporter_id = u.id
      ORDER BY rl.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/reports/:id/resolve
router.put("/reports/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE reported_listings SET status = 'Resolved' WHERE id = ?", [id]);

    // Log activity
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, 'Report marked as Resolved by Admin', 'System')");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/logs
router.get("/logs", async (req, res) => {
  try {
    const { category = "All", search = "" } = req.query;
    let query = "SELECT id, action, category, created_at FROM activity_logs WHERE 1=1";
    const params = [];

    if (category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND action LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY created_at DESC LIMIT 100";
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/analytics
router.get("/analytics", async (req, res) => {
  try {
    // 1. User growth statistics (last 7 days)
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];
      days.push({ label, dateStr });
    }

    const [growthRows] = await pool.query(
      `SELECT DATE(created_at) as dateStr, COUNT(*) as count 
       FROM users 
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at)`
    );

    const userGrowth = days.map((day) => {
      const dbRow = growthRows.find((row) => {
        const rowDateStr = new Date(row.dateStr).toISOString().split("T")[0];
        return rowDateStr === day.dateStr;
      });
      return {
        label: day.label,
        value: dbRow ? dbRow.count : 0,
      };
    });

    // 2. Category distribution
    const [categories] = await pool.query(
      `SELECT property_type as name, COUNT(*) as count 
       FROM properties 
       GROUP BY property_type 
       ORDER BY count DESC`
    );

    // 3. Top listing locations (districts)
    const [locations] = await pool.query(
      `SELECT district as name, COUNT(*) as count 
       FROM properties 
       GROUP BY district 
       ORDER BY count DESC 
       LIMIT 5`
    );

    res.json({
      userGrowth,
      categories,
      locations,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id/reviews
router.get("/users/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT pr.id, pr.rating, pr.comment, pr.created_at, pr.property_id, p.title as property_title 
       FROM property_reviews pr 
       JOIN properties p ON p.id = pr.property_id 
       WHERE pr.user_id = ? 
       ORDER BY pr.created_at DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/reviews/:id
router.delete("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM property_reviews WHERE id = ?", [id]);
    
    // Log to activity logs
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, 'Review deleted by Admin', 'System')");

    res.json({ message: "Review deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/subscription-plans (Admin updates plan pricing)
router.put("/subscription-plans", async (req, res) => {
  try {
    const { plans } = req.body;
    if (!Array.isArray(plans)) {
      return res.status(400).json({ message: "Invalid payload format. Expected array of plans." });
    }

    for (const plan of plans) {
      const featuresJson = Array.isArray(plan.features) 
        ? JSON.stringify(plan.features) 
        : (plan.features || null);

      await pool.query(
        `INSERT INTO subscription_plans (role, duration_months, price, description, discount, features)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), description = VALUES(description), discount = VALUES(discount), features = VALUES(features)`,
        [plan.role, plan.duration_months || 1, plan.price, plan.description || "", plan.discount || 0.00, featuresJson]
      );
    }

    // Log activity
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, 'Subscription plans pricing updated by Admin', 'System')");

    res.json({ success: true, message: "Subscription plans updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/role-switches (Admin reviews upgrade requests)
// GET /api/admin/notifications
router.get("/notifications", async (req, res) => {
  try {
    // 1. Fetch recent user registrations (last 5)
    const [users] = await pool.query(
      "SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    );
    const userNotifications = users.map(u => ({
      id: `user-${u.id}`,
      type: "Registration",
      title: "New User Registration",
      message: `${u.name} registered as a buyer/user.`,
      time: u.created_at,
      link: `/admin/users/${u.id}`
    }));

    // 2. Fetch properties activated under Admin contact (last 5)
    const [properties] = await pool.query(
      `SELECT p.id, p.title, p.created_at, u.name AS owner_name 
       FROM properties p 
       JOIN users u ON p.owner_id = u.id 
       WHERE p.use_admin_contact = 1 AND p.status = 'Active' 
       ORDER BY p.created_at DESC LIMIT 5`
    );
    const propertyNotifications = properties.map(p => ({
      id: `prop-${p.id}`,
      type: "Activation",
      title: "Admin Contact Activation",
      message: `Property "${p.title}" activated under Admin contact fallback by ${p.owner_name}.`,
      time: p.created_at,
      link: `/admin/properties/${p.id}`
    }));

    // 3. Fetch pending role switch requests
    const [roleSwitches] = await pool.query(
      `SELECT r.id, r.requested_role, r.created_at, u.name AS user_name 
       FROM role_switch_requests r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.status = 'Pending' 
       ORDER BY r.created_at DESC LIMIT 5`
    );
    const switchNotifications = roleSwitches.map(r => ({
      id: `switch-${r.id}`,
      type: "RoleUpgrade",
      title: "Pending Role Switch",
      message: `${r.user_name} requested role switch to ${r.requested_role}.`,
      time: r.created_at,
      link: `/admin/role-upgrades`
    }));

    // 4. Fetch recent profile self-deletions from activity_logs (last 5)
    const [deletions] = await pool.query(
      `SELECT id, action, created_at FROM activity_logs 
       WHERE user_id IS NULL AND action LIKE '%self-deleted their account%' 
       ORDER BY created_at DESC LIMIT 5`
    );
    const deletionNotifications = deletions.map(d => ({
      id: `deletion-${d.id}`,
      type: "Deletion",
      title: "Account Self-Deletion",
      message: d.action,
      time: d.created_at,
      link: null
    }));

    // Combine and sort by time desc
    const allNotifications = [
      ...userNotifications,
      ...propertyNotifications,
      ...switchNotifications,
      ...deletionNotifications
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    res.json(allNotifications.slice(0, 10)); // return top 10 notifications
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admin notifications" });
  }
});

router.get("/role-switches", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rs.id, rs.requested_role, rs.status, rs.created_at,
             u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM role_switch_requests rs
      JOIN users u ON rs.user_id = u.id
      ORDER BY rs.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/role-switches/:id/approve
router.put("/role-switches/:id/approve", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    const [requestRows] = await conn.query(
      "SELECT user_id, requested_role FROM role_switch_requests WHERE id = ?",
      [id]
    );
    if (requestRows.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }
    const { user_id, requested_role } = requestRows[0];

    // Fetch global default trial days setting value based on role
    const finalRole = String(requested_role || "").toLowerCase();
    const settingKey = finalRole === "agency" ? "default_trial_days_agency" : (finalRole === "broker" ? "default_trial_days_broker" : "default_trial_days");
    const [[daysRow]] = await conn.query("SELECT `value` FROM settings WHERE `key` = ?", [settingKey]);
    const defaultDays = daysRow ? parseInt(daysRow.value, 10) : (finalRole === "agency" ? 3 : 5);

    // Update user role and initialize trial
    await conn.query("UPDATE users SET role = ?, trial_ends_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? DAY) WHERE id = ?", [finalRole, defaultDays, user_id]);
    
    // Update request status
    await conn.query("UPDATE role_switch_requests SET status = 'Approved' WHERE id = ?", [id]);

    // Send user-facing notification
    const notificationMessage = `Your role switch request has been approved! Your account role is now upgraded to ${requested_role}.`;
    await conn.query(
      "INSERT INTO notifications (user_id, sender_id, type, message) VALUES (?, null, 'RoleUpgrade', ?)",
      [user_id, notificationMessage]
    );

    // Log activity
    const action = `Role switch request approved for user ID #${user_id}. New Role: ${requested_role}`;
    await conn.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Users')", [action]);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/admin/role-switches/:id/reject
router.put("/role-switches/:id/reject", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();

    const [requestRows] = await conn.query(
      "SELECT user_id, requested_role FROM role_switch_requests WHERE id = ?",
      [id]
    );
    if (requestRows.length > 0) {
      const { user_id, requested_role } = requestRows[0];
      await conn.query("UPDATE role_switch_requests SET status = 'Rejected' WHERE id = ?", [id]);
      
      const notificationMessage = `Your role switch request to ${requested_role} was declined by the administrator.`;
      await conn.query(
        "INSERT INTO notifications (user_id, sender_id, type, message) VALUES (?, null, 'RoleUpgrade', ?)",
        [user_id, notificationMessage]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/admin/subscription-stats
router.get("/subscription-stats", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT role, COUNT(*) as active_subscribers 
      FROM users 
      WHERE subscription_status = 'active' 
      GROUP BY role
    `);
    const stats = { user: 0, owner: 0, broker: 0, agency: 0 };
    rows.forEach(r => {
      const roleKey = String(r.role || "").toLowerCase();
      if (stats[roleKey] !== undefined) {
        stats[roleKey] = r.active_subscribers;
      }
    });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/database/export
router.get("/database/export", checkAdminSession, (req, res) => {
  try {
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "3306";
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const database = process.env.DB_NAME || "realastate_sparrow";

    const xamppDumpPath = "C:\\xampp\\mysql\\bin\\mysqldump.exe";
    const dumpTool = fs.existsSync(xamppDumpPath) ? xamppDumpPath : "mysqldump";

    const args = [
      `-h`, host,
      `--port=${port}`,
      `-u`, user,
    ];
    if (password) {
      args.push(`-p${password}`);
    }
    args.push(database);

    console.log(`Starting database export using ${dumpTool} for ${database}...`);

    const dumpProcess = spawn(dumpTool, args);

    res.setHeader("Content-Disposition", `attachment; filename="${database}_backup_${Date.now()}.sql"`);
    res.setHeader("Content-Type", "application/sql");

    dumpProcess.stdout.pipe(res);

    let errorOutput = "";
    dumpProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    dumpProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Database export failed with code ${code}: ${errorOutput}`);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to generate database dump: " + errorOutput });
        }
      } else {
        console.log("Database export completed successfully.");
      }
    });
  } catch (err) {
    console.error("Database export error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// POST /api/admin/top-locations (Admin Protected)
router.post("/top-locations", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Location name is required." });
    }
    let imageUrl = "";
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({ message: "Image file or imageUrl is required." });
    }
    await pool.query("INSERT INTO top_locations (name, image_url) VALUES (?, ?)", [name, imageUrl]);
    res.json({ success: true, message: "Location added successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/top-locations/:id (Admin Protected)
router.put("/top-locations/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const [[existing]] = await pool.query("SELECT * FROM top_locations WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ message: "Location not found." });
    }
    
    let imageUrl = existing.image_url;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      // Clean up the old image file if it is different
      if (existing.image_url && existing.image_url !== imageUrl) {
        await deleteUploadedFile(existing.image_url);
      }
    }
    
    await pool.query(
      "UPDATE top_locations SET name = COALESCE(?, name), image_url = ? WHERE id = ?",
      [name || null, imageUrl, id]
    );
    res.json({ success: true, message: "Location updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/top-locations/:id (Admin Protected)
router.delete("/top-locations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [[existing]] = await pool.query("SELECT image_url FROM top_locations WHERE id = ?", [id]);
    
    await pool.query("DELETE FROM top_locations WHERE id = ?", [id]);
    
    if (existing && existing.image_url) {
      await deleteUploadedFile(existing.image_url);
    }
    
    res.json({ success: true, message: "Location deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
