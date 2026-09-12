import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendOtpEmail } from "../utils/mailer.js";

const router = Router();

function getCookie(req, name) {
  if (!req.headers.cookie) return null;
  const cookies = req.headers.cookie.split(";").reduce((acc, cookieStr) => {
    const parts = cookieStr.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=");
    acc[key] = val;
    return acc;
  }, {});
  return cookies[name] || null;
}

async function resolveSocialUser(provider, providerUserId, profileName, profileEmail, profilePicture) {
  // 1. Check social_accounts table
  const [socialRows] = await pool.query(
    "SELECT * FROM social_accounts WHERE provider = ? AND provider_user_id = ?",
    [provider, providerUserId]
  );

  let userId;
  if (socialRows.length > 0) {
    userId = socialRows[0].user_id;
  } else if (profileEmail && profileEmail.trim()) {
    // 2. Check users table by email
    const trimmedEmail = profileEmail.trim().toLowerCase();
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
      [trimmedEmail]
    );

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      // Link account in social_accounts
      await pool.query(
        "INSERT IGNORE INTO social_accounts (user_id, provider, provider_user_id) VALUES (?, ?, ?)",
        [userId, provider, String(providerUserId)]
      );
      if (!existingUsers[0].avatar_url && profilePicture) {
        await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [profilePicture, userId]);
      }
    } else {
      // Create new user in users table
      const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      const [insertRes] = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, 'user', ?)",
        [profileName || `${provider} User`, trimmedEmail, randomPassword, profilePicture || null]
      );
      userId = insertRes.insertId;
      await pool.query(
        "INSERT INTO social_accounts (user_id, provider, provider_user_id) VALUES (?, ?, ?)",
        [userId, provider, String(providerUserId)]
      );
    }
  } else {
    // Fallback if no email provided by provider
    const placeholderEmail = `${provider}_${providerUserId}@social.auth`;
    const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
    const [insertRes] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, 'user', ?)",
      [profileName || `${provider} User`, placeholderEmail, randomPassword, profilePicture || null]
    );
    userId = insertRes.insertId;
    await pool.query(
      "INSERT INTO social_accounts (user_id, provider, provider_user_id) VALUES (?, ?, ?)",
      [userId, provider, String(providerUserId)]
    );
  }

  await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
  const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  return userRows[0];
}

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
    trialEndsAt: row.trial_ends_at,
    subscriptionStatus: row.is_free_subscription_granted === 1 ? "active" : row.subscription_status,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    role: row.role,
    agencyLogoUrl: row.agency_logo_url,
    agencyAddress: row.agency_address,
    agencyDistrict: row.agency_district,
  };
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: toPublicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session user" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });
  res.json({ success: true, message: "Logged out successfully" });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({ error: "Name, password, and email or phone are required" });
    }

    const userRole = "user";

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR phone = ?",
      [email || null, phone || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email or phone already exists" });
    }

    let trialEnds = null;
    if (userRole === "Broker" || userRole === "Agency" || userRole === "Owner") {
      const settingKey = userRole === "Agency" ? "default_trial_days_agency" : (userRole === "Broker" ? "default_trial_days_broker" : "default_trial_days");
      const [[daysRow]] = await pool.query("SELECT `value` FROM settings WHERE `key` = ?", [settingKey]);
      const defaultDays = daysRow ? parseInt(daysRow.value, 10) : (userRole === "Agency" ? 3 : 5);

      const date = new Date();
      date.setDate(date.getDate() + defaultDays);
      trialEnds = date;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, phone, password_hash, role, trial_ends_at) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email || null, phone || null, passwordHash, userRole, trialEnds]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [result.insertId]);
    const token = signToken(result.insertId);
    setAuthCookie(res, token);
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

    const trimmed = identifier.trim();
    let rows = [];

    if (trimmed.includes("@")) {
      // Robust Case-Insensitive Email match
      [rows] = await pool.query(
        "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
        [trimmed]
      );
    } else {
      // Robust Phone Number match (handles varying +91 prefixes dynamically)
      const cleanedInput = trimmed.replace(/\D/g, "");
      if (cleanedInput.length >= 10) {
        const last10 = cleanedInput.slice(-10);
        [rows] = await pool.query(
          "SELECT * FROM users WHERE phone LIKE ? OR phone = ?",
          [`%${last10}`, trimmed]
        );
      } else {
        [rows] = await pool.query(
          "SELECT * FROM users WHERE phone = ?",
          [trimmed]
        );
      }
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [rows[0].id]);
    const token = signToken(rows[0].id);
    setAuthCookie(res, token);
    res.json({ token, user: toPublicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/forgot-password { email }
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email address is required" });
    }

    const trimmed = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [trimmed]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "No account registered with this email address" });
    }

    const user = rows[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await pool.query(
      "UPDATE users SET reset_otp = ?, reset_otp_expires_at = ? WHERE id = ?",
      [otpCode, expiresAt, user.id]
    );

    await sendOtpEmail(user.email, user.name, otpCode);

    res.json({
      success: true,
      message: `OTP sent to your registered email address (${user.email}).`,
      email: user.email,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send reset OTP. Please try again." });
  }
});

// POST /api/auth/verify-otp { email, otp }
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP code are required" });
    }

    const trimmed = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT id, reset_otp, reset_otp_expires_at FROM users WHERE LOWER(email) = LOWER(?)",
      [trimmed]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const user = rows[0];
    if (!user.reset_otp || user.reset_otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (new Date(user.reset_otp_expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP code has expired. Please request a new one." });
    }

    res.json({ valid: true, message: "OTP code verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// POST /api/auth/reset-password { email, otp, newPassword }
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP, and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const trimmed = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [trimmed]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const user = rows[0];
    if (!user.reset_otp || user.reset_otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    if (new Date(user.reset_otp_expires_at) < new Date()) {
      return res.status(400).json({ error: "OTP code has expired. Please request a new one." });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires_at = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [newHash, user.id]
    );

    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.json({
      success: true,
      message: "Password reset successful",
      token,
      user: toPublicUser(user)
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// POST /api/auth/google { credential, token, email, name, avatarUrl }
router.post("/google", async (req, res) => {
  try {
    const { credential, token: gToken, email: reqEmail, name: reqName, avatarUrl } = req.body;
    let email = reqEmail;
    let name = reqName || "Google User";
    let picture = avatarUrl || null;

    if (gToken) {
      try {
        const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${gToken}`);
        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          email = profile.email || email;
          name = profile.name || name;
          picture = profile.picture || picture;
        }
      } catch (gErr) {
        console.warn("[Google Auth] Could not fetch Google userinfo:", gErr.message);
      }
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email address is required for Google login" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    let [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [trimmedEmail]);

    let userRow;
    if (rows.length === 0) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const [insertResult] = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, 'user', ?)",
        [name, trimmedEmail, randomPassword, picture]
      );
      const [newRows] = await pool.query("SELECT * FROM users WHERE id = ?", [insertResult.insertId]);
      userRow = newRows[0];
    } else {
      userRow = rows[0];
      if (!userRow.avatar_url && picture) {
        await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [picture, userRow.id]);
        userRow.avatar_url = picture;
      }
    }

    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [userRow.id]);
    const token = signToken(userRow.id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Successfully authenticated with Google",
      token,
      user: toPublicUser(userRow),
    });
  } catch (err) {
    console.error("Google authentication error:", err);
    res.status(500).json({ error: "Google login failed" });
  }
});

// POST /api/auth/facebook { accessToken, email, name, avatarUrl }
router.post("/facebook", async (req, res) => {
  try {
    const { accessToken, email: reqEmail, name: reqName, avatarUrl } = req.body;
    let email = reqEmail;
    let name = reqName || "Facebook User";
    let picture = avatarUrl || null;

    if (accessToken) {
      try {
        const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
        if (fbRes.ok) {
          const fbProfile = await fbRes.json();
          email = fbProfile.email || email;
          name = fbProfile.name || name;
          if (fbProfile.picture && fbProfile.picture.data && fbProfile.picture.data.url) {
            picture = fbProfile.picture.data.url;
          }
        }
      } catch (fbErr) {
        console.warn("[Facebook Auth] Could not fetch Facebook profile:", fbErr.message);
      }
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email address is required for Facebook login" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    let [rows] = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", [trimmedEmail]);

    let userRow;
    if (rows.length === 0) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const [insertResult] = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, 'user', ?)",
        [name, trimmedEmail, randomPassword, picture]
      );
      const [newRows] = await pool.query("SELECT * FROM users WHERE id = ?", [insertResult.insertId]);
      userRow = newRows[0];
    } else {
      userRow = rows[0];
      if (!userRow.avatar_url && picture) {
        await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [picture, userRow.id]);
        userRow.avatar_url = picture;
      }
    }

    await pool.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [userRow.id]);
    const token = signToken(userRow.id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Successfully authenticated with Facebook",
      token,
      user: toPublicUser(userRow),
    });
  } catch (err) {
    console.error("Facebook authentication error:", err);
    res.status(500).json({ error: "Facebook login failed" });
  }
});

// GET /api/auth/google - Initiate Google OAuth Redirect Flow
router.get("/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!clientId) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Google OAuth is not configured on the server (missing GOOGLE_CLIENT_ID).")}`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid profile email",
    state: state,
    prompt: "select_account"
  }).toString();

  res.redirect(googleAuthUrl);
});

// GET /api/auth/google/callback - Handle Google OAuth Callback
router.get("/google/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code, state, error: oauthError } = req.query;
  const savedState = getCookie(req, "oauth_state");

  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.clearCookie("oauth_state", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });

  if (oauthError) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Google authentication was canceled or denied.")}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Missing authorization code from Google.")}`);
  }

  if (!savedState || savedState !== state) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Invalid CSRF state token. Please try logging in again.")}`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google OAuth] Token exchange failed:", tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(tokenData.error_description || "Failed to exchange authorization code with Google.")}`);
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Failed to fetch user profile from Google.")}`);
    }

    const profile = await profileRes.json();
    const userRow = await resolveSocialUser("google", profile.sub, profile.name, profile.email, profile.picture);

    const token = signToken(userRow.id);
    setAuthCookie(res, token);

    return res.redirect(`${frontendUrl}/login?oauth=success&token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("[Google Callback Error]:", err);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Server error during Google authentication.")}`);
  }
});

// GET /api/auth/facebook - Initiate Facebook OAuth Redirect Flow
router.get("/facebook", (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID || "1793278805029823";
  const redirectUri = process.env.FACEBOOK_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/auth/facebook/callback`;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!appId) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Facebook OAuth is not configured on the server (missing FACEBOOK_APP_ID).")}`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "email,public_profile",
    state: state,
  }).toString();

  res.redirect(fbAuthUrl);
});

// GET /api/auth/facebook/callback - Handle Facebook OAuth Callback
router.get("/facebook/callback", async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const { code, state, error: oauthError, error_description } = req.query;
  const savedState = getCookie(req, "oauth_state");

  const isProduction = process.env.NODE_ENV === "production" || process.cwd().includes("api.greensparrows.com");
  res.clearCookie("oauth_state", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax"
  });

  if (oauthError) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error_description || "Facebook authentication was canceled or denied.")}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Missing authorization code from Facebook.")}`);
  }

  if (!savedState || savedState !== state) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Invalid CSRF state token. Please try logging in again.")}`);
  }

  try {
    const appId = process.env.FACEBOOK_APP_ID || "1793278805029823";
    const appSecret = process.env.FACEBOOK_APP_SECRET || "e310c814c2b3207084adbe0a07b3786a";
    const redirectUri = process.env.FACEBOOK_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/auth/facebook/callback`;

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: String(code),
    }).toString();

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Facebook OAuth] Token exchange failed:", tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(tokenData.error?.message || "Failed to exchange authorization code with Facebook.")}`);
    }

    const profileRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`);
    if (!profileRes.ok) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Failed to fetch user profile from Facebook.")}`);
    }

    const profile = await profileRes.json();
    const avatarUrl = profile.picture?.data?.url || null;

    const userRow = await resolveSocialUser("facebook", profile.id, profile.name, profile.email, avatarUrl);

    const token = signToken(userRow.id);
    setAuthCookie(res, token);

    return res.redirect(`${frontendUrl}/login?oauth=success&token=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error("[Facebook Callback Error]:", err);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Server error during Facebook authentication.")}`);
  }
});

export default router;
