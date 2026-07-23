import { Router } from "express";
import { pool } from "../db.js";
import { upload } from "../middleware/upload.js";

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

// Apply admin protection check to all subsequent routes
router.use(checkAdminSession);

// PUT /api/admin/settings/:key (Admin settings updater)
router.put("/settings/:key", upload.single("banner"), async (req, res) => {
  try {
    const { key } = req.params;
    let value = req.body.value;

    if ((key === "welcome_banner_url" || key === "login_banner_url") && req.file) {
      value = `/uploads/${req.file.filename}`;
    }

    if (value === undefined || value === null) {
      return res.status(400).json({ message: "Setting value is required." });
    }

    await pool.query(
      "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?",
      [key, value, value]
    );

    res.json({ message: "Setting updated successfully.", key, value });
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
    let query = "SELECT id, name, email, phone, is_disabled, created_at FROM users WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild);
    }

    if (role !== "All") {
      // Find users with specific listings matching role
      query += " AND id IN (SELECT DISTINCT owner_id FROM properties WHERE listing_role = ?)";
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
    const [[user]] = await pool.query("SELECT id, name, email, phone, is_disabled, created_at FROM users WHERE id = ?", [id]);
    if (!user) return res.status(404).json({ message: "User not found." });

    const [[{ count: listings }]] = await pool.query("SELECT COUNT(*) as count FROM properties WHERE owner_id = ? AND status = 'Active'", [id]);
    const [[{ count: enquiries }]] = await pool.query("SELECT COUNT(*) as count FROM enquiries WHERE visitor_id = ?", [id]);
    const [[{ count: saved }]] = await pool.query("SELECT COUNT(*) as count FROM saved_properties WHERE user_id = ?", [id]);
    const [[{ count: reviews }]] = await pool.query("SELECT COUNT(*) as count FROM property_reviews WHERE user_id = ?", [id]);

    const [userProperties] = await pool.query(
      "SELECT id, title, price, district AS location, status, updated_at FROM properties WHERE owner_id = ? ORDER BY updated_at DESC",
      [id]
    );

    res.json({
      ...user,
      listings,
      enquiries,
      saved,
      reviews,
      properties: userProperties,
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

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    // Log activity
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, 'User completely deleted by Admin', 'Users')");

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM properties WHERE id = ?", [id]);

    // Log activity
    const action = `Property ID #${id} deleted by Admin`;
    await pool.query("INSERT INTO activity_logs (user_id, action, category) VALUES (null, ?, 'Properties')", [action]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

export default router;
