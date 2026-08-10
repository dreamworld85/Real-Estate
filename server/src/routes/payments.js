import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

// Retrieve Razorpay credentials from environment variables
const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// POST /api/payments/create-subscription
// In standard checkout verification, we create an order based on user's role price & duration months
router.post("/create-subscription", requireAuth, async (req, res) => {
  try {
    const { durationMonths = 1 } = req.body;
    const [userRows] = await pool.query("SELECT role FROM users WHERE id = ?", [req.userId]);
    if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
    const role = userRows[0].role || "Owner";

    const [planRows] = await pool.query(
      "SELECT price, discount FROM subscription_plans WHERE role = ? AND duration_months = ?",
      [role, durationMonths]
    );
    const price = planRows.length > 0 ? Number(planRows[0].price) : 10.00;
    const discount = planRows.length > 0 ? Number(planRows[0].discount) : 0.00;
    const finalPrice = Math.max(0, price - discount);

    const amount = Math.round(finalPrice * 100); // INR in paise
    const currency = "INR";
    const receipt = `sub_rcpt_${req.userId}_${Date.now()}`;

    const options = {
      amount,
      currency,
      receipt,
    };

    console.log(`Creating Razorpay order for user ${req.userId} (Role: ${role}, Duration: ${durationMonths}M): Amount = ₹${finalPrice}`);
    const order = await razorpay.orders.create(options);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ error: "Failed to initiate payment: " + err.message });
  }
});

// POST /api/payments/verify-subscription
router.post("/verify-subscription", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, durationMonths = 1 } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    console.log(`Verifying payment signature for user ${req.userId}...`);
    if (expectedSignature !== razorpay_signature) {
      console.warn("Invalid payment signature verification failed.");
      return res.status(400).json({ error: "Invalid payment signature verification." });
    }

    console.log(`Signature verified! Activating subscription for user ${req.userId} (Duration: ${durationMonths} Months).`);
    
    // Set user subscription status to active and calculate the exact expiry datetime
    await pool.query(
      `UPDATE users 
       SET subscription_status = 'active', 
           razorpay_subscription_id = ?, 
           subscription_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MONTH),
           subscription_duration_months = ?
       WHERE id = ?`,
      [razorpay_payment_id, Number(durationMonths), Number(durationMonths), req.userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Subscription verification error:", err);
    res.status(500).json({ error: "Signature verification failed: " + err.message });
  }
});

// POST /api/payments/create-featured-order
router.post("/create-featured-order", requireAuth, async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required." });
    }

    // Verify property ownership and status
    const [rows] = await pool.query(
      "SELECT owner_id, title, status FROM properties WHERE id = ?",
      [propertyId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Property not found." });
    }
    if (rows[0].owner_id !== req.userId) {
      return res.status(403).json({ error: "You do not own this property listing." });
    }

    // Get featured price from settings
    const [[priceRow]] = await pool.query(
      "SELECT `value` FROM settings WHERE `key` = 'featured_price'"
    );
    const price = priceRow ? Number(priceRow.value) : 299;
    const amount = Math.round(price * 100); // in paise

    const receipt = `feat_rcpt_${propertyId}_${Date.now()}`;
    const options = {
      amount,
      currency: "INR",
      receipt,
    };

    console.log(`Creating Razorpay featured order for property ${propertyId} (Owner: ${req.userId}): Amount = ₹${price}`);
    const order = await razorpay.orders.create(options);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      propertyId,
    });
  } catch (err) {
    console.error("Razorpay featured order creation error:", err);
    res.status(500).json({ error: "Failed to initiate payment: " + err.message });
  }
});

// POST /api/payments/verify-featured-payment
router.post("/verify-featured-payment", requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, propertyId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !propertyId) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body.toString())
      .digest("hex");

    console.log(`Verifying featured payment signature for property ${propertyId} by user ${req.userId}...`);
    if (expectedSignature !== razorpay_signature) {
      console.warn("Invalid signature. Verification failed.");
      return res.status(400).json({ error: "Invalid payment signature verification." });
    }

    // Fetch title for logging
    const [[prop]] = await pool.query("SELECT title FROM properties WHERE id = ?", [propertyId]);
    const title = prop ? prop.title : `ID #${propertyId}`;

    // Update property featured status in database
    await pool.query(
      "UPDATE properties SET is_featured = 1 WHERE id = ?",
      [propertyId]
    );

    // Log activity
    const logAction = `Property listing "${title}" (ID: #${propertyId}) promoted to Featured tier via payment.`;
    await pool.query(
      "INSERT INTO activity_logs (user_id, action, category) VALUES (?, ?, 'Listings')",
      [req.userId, logAction]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Featured verification error:", err);
    res.status(500).json({ error: "Signature verification failed: " + err.message });
  }
});

export default router;
