import { pool } from "../db.js";

export async function checkUserAccess(userId) {
  if (!userId) {
    return { hasAccess: false, role: "Guest", isFreeGranted: false, isSubscribed: false, hasTrial: false };
  }

  const [rows] = await pool.query(
    "SELECT role, subscription_status, subscription_expires_at, trial_ends_at, custom_trial_expiry, is_free_subscription_granted, created_at FROM users WHERE id = ?",
    [userId]
  );
  if (rows.length === 0) {
    return { hasAccess: false, role: "Guest", isFreeGranted: false, isSubscribed: false, hasTrial: false, remainingDays: 0 };
  }

  const user = rows[0];
  
  // Fetch latest trial settings dynamically
  const [[brokerSetting]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'default_trial_days_broker'");
  const [[agencySetting]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'default_trial_days_agency'");
  const [[defaultSetting]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'default_trial_days'");
  const [[userSetting]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'default_trial_days_user'");
  const [[limitSetting]] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'default_free_inquiries_limit'");
  
  const brokerDays = brokerSetting ? parseInt(brokerSetting.value, 10) : 5;
  const agencyDays = agencySetting ? parseInt(agencySetting.value, 10) : 3;
  const defaultDays = defaultSetting ? parseInt(defaultSetting.value, 10) : 5;
  const userDays = userSetting ? parseInt(userSetting.value, 10) : 30;
  const freeLimit = limitSetting ? parseInt(limitSetting.value, 10) : 20;

  let defaultTrialExpiry = null;
  if (user.role === "broker") {
    defaultTrialExpiry = new Date(new Date(user.created_at).getTime() + brokerDays * 24 * 60 * 60 * 1000);
  } else if (user.role === "agency") {
    defaultTrialExpiry = new Date(new Date(user.created_at).getTime() + agencyDays * 24 * 60 * 60 * 1000);
  } else if (user.role === "user") {
    defaultTrialExpiry = new Date(new Date(user.created_at).getTime() + userDays * 24 * 60 * 60 * 1000);
  } else {
    defaultTrialExpiry = new Date(new Date(user.created_at).getTime() + defaultDays * 24 * 60 * 60 * 1000);
  }

  const isFreeGranted = user.is_free_subscription_granted === 1;
  const now = new Date();
  const isSubscribed = user.subscription_status === "active" && 
    (user.subscription_expires_at === null || new Date(user.subscription_expires_at) > now);
  
  const hasCustomTrial = user.custom_trial_expiry && new Date(user.custom_trial_expiry) > now;
  const hasDefaultTrial = defaultTrialExpiry && defaultTrialExpiry > now;
  const hasTrial = hasCustomTrial || hasDefaultTrial;

  let hasAccess = false;
  let clickCount = 0;

  if (isSubscribed || isFreeGranted) {
    hasAccess = true;
  } else if (user.role === "user") {
    if (hasTrial) {
      hasAccess = true;
    } else {
      const [[clickRow]] = await pool.query(
        "SELECT COUNT(DISTINCT property_id) AS count FROM contact_clicks WHERE user_id = ?",
        [userId]
      );
      clickCount = clickRow ? clickRow.count : 0;
      hasAccess = clickCount < freeLimit;
    }
  } else {
    hasAccess = hasTrial;
  }

  const trialExpiry = user.custom_trial_expiry || defaultTrialExpiry || user.trial_ends_at;

  const expiryTime = trialExpiry ? new Date(trialExpiry).getTime() : 0;
  const remainingDays = expiryTime > now.getTime() 
    ? Math.ceil((expiryTime - now.getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  return {
    hasAccess,
    role: user.role,
    isFreeGranted,
    isSubscribed,
    hasTrial,
    trialExpiry,
    remainingDays,
    inquiryCount: clickCount,
  };
}
