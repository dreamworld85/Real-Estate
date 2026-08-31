import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config({ override: true });

// Auto-configure persistent UPLOADS_DIR on Hostinger server
if (process.cwd().includes("api.greensparrows.com") || process.cwd().includes("u859202671")) {
  const envPath = path.resolve(".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  if (!envContent.includes("UPLOADS_DIR")) {
    console.log("Auto-injecting persistent UPLOADS_DIR into .env");
    envContent += "\nUPLOADS_DIR=/home/u859202671/domains/api.greensparrows.com/uploads\n";
    fs.writeFileSync(envPath, envContent, "utf8");
    dotenv.config({ override: true });
  }
}

import { getUploadDir, getAllCandidateUploadDirs } from "./utils/uploadDir.js";
import { pool } from "./db.js";

// Ensure uploads directory exists
const serverUploadsDir = getUploadDir();

import { seedPlans } from "./seedPlans.js";

import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payments.js";

// Auto-migrate database table columns for subscription offers
async function checkDbMigration() {
  try {
    const [userCols] = await pool.query("SHOW COLUMNS FROM users");
    const userColNames = userCols.map(c => c.Field);
    if (!userColNames.includes("reset_otp")) {
      console.log("Adding reset_otp column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10) NULL");
    }
    if (!userColNames.includes("reset_otp_expires_at")) {
      console.log("Adding reset_otp_expires_at column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN reset_otp_expires_at DATETIME NULL");
    }

    const [cols] = await pool.query("SHOW COLUMNS FROM subscription_plans");
    const colNames = cols.map(c => c.Field);
    if (!colNames.includes("description")) {
      console.log("Adding description column to subscription_plans...");
      await pool.query("ALTER TABLE subscription_plans ADD COLUMN description VARCHAR(255) NULL DEFAULT ''");
    }
    if (!colNames.includes("discount")) {
      console.log("Adding discount column to subscription_plans...");
      await pool.query("ALTER TABLE subscription_plans ADD COLUMN discount DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    }
    
    // Create notifications table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sender_id INT NULL,
        type VARCHAR(50) NOT NULL,
        message VARCHAR(500) NOT NULL,
        property_id INT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      )
    `);
    console.log("Database notifications table verified.");

    const [notifCols] = await pool.query("SHOW COLUMNS FROM notifications");
    const notifColNames = notifCols.map(c => c.Field);
    if (!notifColNames.includes("title")) {
      console.log("Adding title column to notifications...");
      await pool.query("ALTER TABLE notifications ADD COLUMN title VARCHAR(120) NULL");
    }
    if (!notifColNames.includes("link")) {
      console.log("Adding link column to notifications...");
      await pool.query("ALTER TABLE notifications ADD COLUMN link VARCHAR(255) NULL");
    }

    // Verify settings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(120) PRIMARY KEY,
        \`value\` TEXT NOT NULL
      )
    `);

    // Seed default landing page settings if they don't exist
    const defaultSettings = [
      { key: "landing_hero_title", value: "Find Your Perfect Kerala Nest & Escape" },
      { key: "landing_hero_description", value: "Explore curated houses, villas, apartments, and land plots across the lush greenery of Kerala. Connect directly with owners, brokers, and certified agencies." },
      { key: "landing_hero_image", value: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80" },
      { key: "landing_app_title", value: "Download Our Mobile App For Real-Time Notifications" },
      { key: "landing_app_description", value: "Visiting our mobile app gives you access to maps, instant push notifications for matching properties, real-time agent chats, and location-aware search features. Scan the QR code or click the download button below to load the mobile-optimized experience directly on your smartphone." },
      { key: "landing_app_download_url", value: "http://localhost:5173/login" },
      { key: "landing_app_qr_image", value: "" },
      { key: "login_heading", value: "Hello!" },
      { key: "login_subheading", value: "Welcome to Property" }
    ];

    for (const setting of defaultSettings) {
      await pool.query(
        "INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, ?)",
        [setting.key, setting.value]
      );
    }

    // Verify app_download_page_settings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_download_page_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand_logo_url VARCHAR(255) NULL,
        main_title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(500) NOT NULL,
        google_play_url VARCHAR(255) NOT NULL,
        app_store_url VARCHAR(255) NOT NULL,
        safe_secure_title VARCHAR(255) NOT NULL,
        safe_secure_desc VARCHAR(255) NOT NULL,
        trusted_users_title VARCHAR(255) NOT NULL,
        trusted_users_desc VARCHAR(255) NOT NULL,
        footer_brand VARCHAR(255) NOT NULL,
        footer_tagline VARCHAR(255) NOT NULL
      )
    `);

    const [downloadSettingsCount] = await pool.query("SELECT COUNT(*) as count FROM app_download_page_settings");
    if (downloadSettingsCount[0].count === 0) {
      await pool.query(`
        INSERT INTO app_download_page_settings (
          brand_logo_url, 
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
        ) VALUES (
          '', 
          'You\\'ve received a property on Kerala Realty', 
          'To view this property and more details, download the Kerala Realty app.', 
          'https://play.google.com/store', 
          'https://www.apple.com/app-store', 
          'Safe & Secure', 
          'We don\\'t share any personal information.', 
          'Trusted by thousands', 
          'Trusted by thousands of users across Kerala.', 
          'Kerala Realty', 
          'Your trusted property partner in Kerala'
        )
      `);
      console.log("Seeded default app download page settings successfully.");
    }

    // Verify mobile_share_page_settings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mobile_share_page_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        brand_name VARCHAR(150) NOT NULL,
        brand_logo_url VARCHAR(255) NULL,
        tagline VARCHAR(255) NOT NULL,
        illustration_url VARCHAR(255) NULL,
        description_quote VARCHAR(500) NOT NULL,
        button_text VARCHAR(150) NOT NULL,
        google_play_url VARCHAR(255) NOT NULL,
        app_store_url VARCHAR(255) NOT NULL
      )
    `);

    const [shareCols] = await pool.query("SHOW COLUMNS FROM mobile_share_page_settings");
    const shareColNames = shareCols.map(c => c.Field);
    if (!shareColNames.includes("background_image_url")) {
      console.log("Adding background_image_url column to mobile_share_page_settings...");
      await pool.query("ALTER TABLE mobile_share_page_settings ADD COLUMN background_image_url VARCHAR(255) NULL DEFAULT '/share_interstitial_bg.png'");
    }

    const [mobileShareSettingsCount] = await pool.query("SELECT COUNT(*) as count FROM mobile_share_page_settings");
    if (mobileShareSettingsCount[0].count === 0) {
      await pool.query(`
        INSERT INTO mobile_share_page_settings (
          brand_name,
          brand_logo_url,
          tagline,
          illustration_url,
          description_quote,
          button_text,
          google_play_url,
          app_store_url,
          trust_text
        ) VALUES (
          'Sparrow Properties',
          '/brand_logo.png',
          'Your trusted property partner',
          '',
          'The best way to buy, sell and rent properties.',
          'Download the App to continue',
          'https://play.google.com/store',
          'https://www.apple.com/app-store',
          'Secure. Trusted. Reliable.'
        )
      `);
      console.log("Seeded default mobile share page settings successfully.");
    }

    // Verify landing_features table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS landing_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(80) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default landing features if empty
    const [featuresCount] = await pool.query("SELECT COUNT(*) as count FROM landing_features");
    if (featuresCount[0].count === 0) {
      const defaultFeatures = [
        { title: "Verified Listings", description: "Every property on our platform goes through mandatory moderation and title review checks, ensuring high-quality leads and scam-free deals.", icon: "CheckCircle2" },
        { title: "District & Local Maps", description: "Easily filter properties by district, location, area size, and exact budget. Make informed choices with local community map references.", icon: "Map" },
        { title: "Direct Inquiry Channels", description: "Direct phone and WhatsApp integrations let you contact owners or certified agents instantly, cutting out unnecessary delay or middleman margins.", icon: "Shield" }
      ];
      for (const feat of defaultFeatures) {
        await pool.query(
          "INSERT INTO landing_features (title, description, icon) VALUES (?, ?, ?)",
          [feat.title, feat.description, feat.icon]
        );
      }
      console.log("Seeded default landing page features successfully.");
    }

    // Verify property_reviews table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Database property_reviews table verified.");

    // Verify property_views table exists and has all columns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        visitor_id INT NULL,
        ip_address VARCHAR(100) NULL,
        user_agent VARCHAR(500) NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrate property_views if columns are missing
    const [viewCols] = await pool.query("SHOW COLUMNS FROM property_views");
    const viewColNames = viewCols.map(c => c.Field);
    if (!viewColNames.includes("ip_address")) {
      console.log("Adding ip_address column to property_views...");
      await pool.query("ALTER TABLE property_views ADD COLUMN ip_address VARCHAR(100) NULL");
    }
    if (!viewColNames.includes("user_agent")) {
      console.log("Adding user_agent column to property_views...");
      await pool.query("ALTER TABLE property_views ADD COLUMN user_agent VARCHAR(500) NULL");
    }
    console.log("Database property_views table verified.");
    
    // Seed default trial days if not exists
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('default_trial_days', '5')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('default_trial_days_broker', '5')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('default_trial_days_agency', '3')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('contact_email', 'support@greensparrows.com')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('contact_phone', '+91 484 2901234 (10 AM - 6 PM)')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('contact_address', 'GreenSparrows Ventures Private Limited,\\nSkyline Signature Heights, Kakkanad,\\nKochi, Kerala - 682030')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('featured_price', '299')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('featured_text', 'Pin your listing to the top of home feed and search results to get up to 10x more leads.')");

    // Add custom trial and free subscription columns to users table
    const [existingUserCols] = await pool.query("SHOW COLUMNS FROM users");
    const existingUserColNames = existingUserCols.map(c => c.Field);
    
    if (!existingUserColNames.includes("role")) {
      console.log("Adding role column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'");
    }

    if (!existingUserColNames.includes("trial_ends_at")) {
      console.log("Adding trial_ends_at column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN trial_ends_at DATETIME NULL");
    }

    if (!existingUserColNames.includes("subscription_status")) {
      console.log("Adding subscription_status column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) NULL");
    }

    if (!existingUserColNames.includes("razorpay_subscription_id")) {
      console.log("Adding razorpay_subscription_id column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN razorpay_subscription_id VARCHAR(255) NULL");
    }

    if (!existingUserColNames.includes("is_disabled")) {
      console.log("Adding is_disabled column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN is_disabled TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!userColNames.includes("last_login")) {
      console.log("Adding last_login column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL");
    }

    if (!userColNames.includes("custom_trial_expiry")) {
      console.log("Adding custom_trial_expiry column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN custom_trial_expiry DATETIME NULL");
    }
    
    if (!userColNames.includes("is_free_subscription_granted")) {
      console.log("Adding is_free_subscription_granted column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN is_free_subscription_granted TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!userColNames.includes("subscription_expires_at")) {
      console.log("Adding subscription_expires_at column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME NULL");
    }

    if (!userColNames.includes("subscription_duration_months")) {
      console.log("Adding subscription_duration_months column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN subscription_duration_months INT NULL");
    }

    if (!userColNames.includes("agency_address")) {
      console.log("Adding agency_address column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN agency_address TEXT NULL");
    }

    if (!userColNames.includes("agency_district")) {
      console.log("Adding agency_district column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN agency_district VARCHAR(100) NULL");
    }

    if (!userColNames.includes("agency_logo_url")) {
      console.log("Adding agency_logo_url column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN agency_logo_url VARCHAR(255) NULL");
    }

    if (!userColNames.includes("whatsapp_number")) {
      console.log("Adding whatsapp_number column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN whatsapp_number VARCHAR(50) NULL");
    }

    // Modify subscription_plans table schema
    const [planCols] = await pool.query("SHOW COLUMNS FROM subscription_plans");
    const planColNames = planCols.map(c => c.Field);
    if (!planColNames.includes("duration_months")) {
      console.log("Upgrading subscription_plans table for multi-duration plans...");
      await pool.query("ALTER TABLE subscription_plans DROP PRIMARY KEY");
      await pool.query("ALTER TABLE subscription_plans ADD COLUMN duration_months INT NOT NULL DEFAULT 1");
      await pool.query("ALTER TABLE subscription_plans ADD PRIMARY KEY (role, duration_months)");
      
      // Seed 6-month and 12-month plans (and User buyer plans)
      await pool.query(`
        INSERT IGNORE INTO subscription_plans (role, duration_months, price, discount, description) VALUES
        ('Owner', 6, 75.00, 15.00, 'Save 20% on 6-month plan'),
        ('Owner', 12, 120.00, 30.00, 'Best Value: 1 year premium'),
        ('Broker', 6, 950.00, 190.00, 'Save 17%: 6 months broker plan'),
        ('Broker', 12, 1600.00, 400.00, 'Best Value: 1 year broker premium'),
        ('Agency', 6, 999.00, 199.00, 'Save 17%: 6 months agency plan'),
        ('Agency', 12, 1699.00, 400.00, 'Best Value: 1 year agency premium'),
        ('User', 1, 20.00, 0.00, 'Buyer basic subscription to unlock unlimited contacts'),
        ('User', 6, 99.00, 20.00, 'Save 17%: 6 months buyer plan'),
        ('User', 12, 150.00, 30.00, 'Best Value: 1 year buyer premium')
      `);
    }

    // Ensure role column is VARCHAR(50) and features column exists
    await pool.query("ALTER TABLE subscription_plans MODIFY COLUMN role VARCHAR(50) NOT NULL");
    const [updatedPlanCols] = await pool.query("SHOW COLUMNS FROM subscription_plans");
    const updatedPlanColNames = updatedPlanCols.map(c => c.Field);
    if (!updatedPlanColNames.includes("features")) {
      await pool.query("ALTER TABLE subscription_plans ADD COLUMN features TEXT NULL");
    }

    // Add use_admin_contact column to properties table
    const [propCols] = await pool.query("SHOW COLUMNS FROM properties");
    const propColNames = propCols.map(c => c.Field);
    if (!propColNames.includes("use_admin_contact")) {
      console.log("Adding use_admin_contact column to properties...");
      await pool.query("ALTER TABLE properties ADD COLUMN use_admin_contact TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!propColNames.includes("is_price_negotiable")) {
      console.log("Adding is_price_negotiable column to properties...");
      await pool.query("ALTER TABLE properties ADD COLUMN is_price_negotiable TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!propColNames.includes("is_featured")) {
      console.log("Adding is_featured column to properties...");
      await pool.query("ALTER TABLE properties ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!propColNames.includes("is_broker_personal_property")) {
      console.log("Adding is_broker_personal_property column to properties...");
      await pool.query("ALTER TABLE properties ADD COLUMN is_broker_personal_property TINYINT(1) NOT NULL DEFAULT 0");
    }

    // Run role migration: User -> user, Owner -> owner, etc.
    await pool.query("UPDATE users SET role = 'user' WHERE role = 'User' OR role = 'buyer' OR role = ''");
    await pool.query("UPDATE users SET role = 'owner' WHERE role = 'Owner'");
    await pool.query("UPDATE users SET role = 'broker' WHERE role = 'Broker'");
    await pool.query("UPDATE users SET role = 'agency' WHERE role = 'Agency'");

    // Modify Enum column to lowercase
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('owner','broker','agency','user','Admin') DEFAULT 'user'");

    // Convert subscription plans roles
    await pool.query("UPDATE subscription_plans SET role = 'user' WHERE role = 'User' OR role = 'buyer'");
    await pool.query("UPDATE subscription_plans SET role = 'owner' WHERE role = 'Owner'");
    await pool.query("UPDATE subscription_plans SET role = 'broker' WHERE role = 'Broker'");
    await pool.query("UPDATE subscription_plans SET role = 'agency' WHERE role = 'Agency'");

    // Seed default admin contact number and email
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('admin_contact_number', '+91 94460 12345')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('admin_email', 'admin@keralarealty.com')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('default_trial_days_user', '30')");
    await pool.query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('default_free_inquiries_limit', '20')");

    // Create contact_clicks table tracking unique contact clicks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        property_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_property (user_id, property_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create top_locations table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS top_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Database top_locations table verified.");

    // Seed default top locations if empty
    const [locations] = await pool.query("SELECT COUNT(*) AS count FROM top_locations");
    if (locations[0].count === 0) {
      console.log("Seeding default top locations...");
      const defaultLocations = [
        { name: "Bali", image_url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&h=300&fit=crop" },
        { name: "Jakarta", image_url: "https://images.unsplash.com/photo-1505995433366-e12047f3f144?w=300&h=300&fit=crop" },
        { name: "Yogyakarta", image_url: "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=300&h=300&fit=crop" }
      ];
      for (const loc of defaultLocations) {
        await pool.query("INSERT INTO top_locations (name, image_url) VALUES (?, ?)", [loc.name, loc.image_url]);
      }
    }

    // Synchronize pricing & feature plans catalog
    await seedPlans();
  } catch (err) {
    console.error("Database migration check failed:", err);
  }
}
checkDbMigration();

// Auto-generate system-documentation.json in the project root on server startup
function generateSystemDocumentationFile() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootPath = path.resolve(__dirname, "..", "..");
    const docPath = path.join(rootPath, "system-documentation.json");

    const docContent = {
      appName: "Kerala Realty",
      techStack: {
        frontend: "React, Tailwind CSS, Lucide Icons",
        backend: "Node.js, Express",
        database: "MySQL"
      },
      overview: {
        targetAudience: "Kerala-based property buyers, owners, brokers, and agencies",
        uiDesign: "Senior-friendly, optimized for single-screen views, compact layout design"
      },
      userRolesAndWorkflows: {
        defaultRole: "user (buyer)",
        freeInquiryLimit: 20,
        roleTransition: "Permanent role lock (Owner, Broker, or Agency) upon first property creation step based on uploader contact info",
        adminRoleApproval: "Role switches and upgrades require explicit administrator approval via the admin console"
      },
      postingLimitsAndSubscriptions: {
        limits: {
          Owner: "2 free listings initially, then up to 5 properties/month under paid plans",
          Broker: "15 to 20 property postings per month limit",
          Agency: "15 to 20 property postings per month limit"
        },
        subscriptionPlans: {
          durations: ["1 Month", "6 Months", "1 Year"],
          dynamicManagement: "Admin manages package features, pricing tiers, and discounts dynamically"
        }
      },
      viewTrackingSystem: {
        incrementLogic: "Real-time, synchronous increment (+1) per property detail page load",
        cooldownFilter: {
          authenticatedUser: "24-hour uniqueness cooldown scoped to visitor_id (prevents duplicate counting)",
          anonymousVisitor: "24-hour uniqueness cooldown scoped to IP Address + User Agent combination",
          ownerExclusion: "Owner visits to their own property pages are excluded from view stats"
        },
        uiDisplay: "Eye icon (Lucide-react Eye) with view count rendered next to property cards and detail headers"
      },
      adminControls: {
        pricingSettings: "Toggled via general settings panel (e.g., featured listings price)",
        freeTierTrialConfig: "Default trial days configured per user role (e.g., 5-30 days)",
        fallbackContact: "Option to fallback to admin contact number for listings uploaded under unpaid/inactive subscriptions"
      }
    };

    fs.writeFileSync(docPath, JSON.stringify(docContent, null, 2), "utf8");
    console.log("System documentation JSON generated successfully at project root.");
  } catch (err) {
    console.error("Failed to generate system documentation JSON:", err);
  }
}
generateSystemDocumentationFile();

// Auto-generate kerala-realty-system-blueprint.json in the project root on server startup
function generateSystemBlueprintFile() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const rootPath = path.resolve(__dirname, "..", "..");
    const docPath = path.join(rootPath, "kerala-realty-system-blueprint.json");

    const docContent = {
      blueprintName: "Kerala Realty System Blueprint",
      version: "1.0.0",
      projectMetadata: {
        appName: "Kerala Realty",
        architecture: "Client-Server (Single Page Application)",
        techStack: {
          frontend: "React, React Router DOM, Tailwind CSS, Lucide Icons, Fetch API",
          backend: "Node.js, Express, Nodemon, JWT, Multer",
          database: "MySQL",
          paymentGateway: "Razorpay"
        }
      },
      databaseSchema: {
        users: {
          description: "Stores user accounts and their current active subscription status and role.",
          fields: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(255) NOT NULL",
            email: "VARCHAR(255) UNIQUE NULL",
            phone: "VARCHAR(50) UNIQUE NULL",
            whatsapp_number: "VARCHAR(50) NULL",
            password: "VARCHAR(255) NOT NULL",
            role: "ENUM('owner','broker','agency','user','Admin') DEFAULT 'user'",
            trial_ends_at: "DATETIME NULL",
            subscription_status: "VARCHAR(50) NULL",
            subscription_expires_at: "DATETIME NULL",
            subscription_duration_months: "INT NULL",
            razorpay_subscription_id: "VARCHAR(255) NULL",
            is_free_subscription_granted: "TINYINT(1) DEFAULT 0",
            is_disabled: "TINYINT(1) DEFAULT 0",
            last_login: "TIMESTAMP NULL",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
          }
        },
        properties: {
          description: "Stores property listings submitted by owners, brokers, and agencies.",
          fields: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            owner_id: "INT NOT NULL (FK users.id)",
            title: "VARCHAR(255) NOT NULL",
            property_type: "VARCHAR(100) NOT NULL",
            purpose: "VARCHAR(50) NOT NULL",
            price: "DECIMAL(15,2) NOT NULL",
            area_sqft: "INT NOT NULL",
            address: "TEXT NOT NULL",
            district: "VARCHAR(100) NOT NULL",
            bedrooms: "INT DEFAULT 0",
            bathrooms: "INT DEFAULT 0",
            furnishing: "VARCHAR(100) NULL",
            facing: "VARCHAR(100) NULL",
            property_age: "VARCHAR(100) NULL",
            description: "TEXT NULL",
            listing_role: "VARCHAR(50) NOT NULL",
            status: "ENUM('Draft','Pending','Active','Inactive','Rejected') DEFAULT 'Pending'",
            views: "INT DEFAULT 0",
            youtube_url: "VARCHAR(255) NULL",
            contact_number: "VARCHAR(50) NULL",
            whatsapp_number: "VARCHAR(50) NULL",
            use_admin_contact: "TINYINT(1) DEFAULT 0",
            is_featured: "TINYINT(1) DEFAULT 0",
            is_price_negotiable: "TINYINT(1) DEFAULT 0",
            is_broker_personal_property: "TINYINT(1) DEFAULT 0",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
          }
        },
        subscription_plans: {
          description: "Stores the dynamic plans catalog offered to each role.",
          fields: {
            role: "VARCHAR(50) NOT NULL",
            duration_months: "INT NOT NULL",
            price: "DECIMAL(10,2) NOT NULL",
            discount: "DECIMAL(10,2) DEFAULT 0.00",
            description: "VARCHAR(255) NULL",
            features: "TEXT NULL",
            "PRIMARY KEY": "(role, duration_months)"
          }
        },
        property_views: {
          description: "Tracks uniqueness of page views per property.",
          fields: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            property_id: "INT NOT NULL (FK properties.id)",
            visitor_id: "INT NULL (FK users.id)",
            ip_address: "VARCHAR(100) NULL",
            user_agent: "VARCHAR(500) NULL",
            viewed_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
          }
        },
        contact_clicks: {
          description: "Tracks unique seller contact unveils by buyers.",
          fields: {
            id: "INT AUTO_INCREMENT PRIMARY KEY",
            user_id: "INT NOT NULL (FK users.id)",
            property_id: "INT NOT NULL (FK properties.id)",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "UNIQUE KEY": "(user_id, property_id)"
          }
        }
      },
      frontendUserPages: {
        home: {
          features: [
            "Welcome banner with customizable URL from settings",
            "Filter pills for All, Land, House, Villa, Apartment categories",
            "Search bar with text query matching location & title",
            "Grid of featured and regular listings as Property Cards",
            "Bottom Navigation for Home, Search, Add Property, Enquiries, Profile"
          ]
        },
        search: {
          features: [
            "Dynamic query-based lookup including seller name, email, contact numbers, address, and location",
            "Filters for Property Type, Purpose (For Sale / For Rent), and District",
            "Sleek cards listing price, title, location, views (with Eye icon), and posted date"
          ]
        },
        propertyDetails: {
          features: [
            "Dynamic banner image/video slider carousel",
            "Dynamic Role Badge fetched synchronously from users.role",
            "Views counter rendered next to small Eye icon",
            "Primary action CTAs: Call and WhatsApp buttons",
            "Automatic contact number fallback to Admin contact if owner has no active plan"
          ]
        },
        addPropertyWizard: {
          steps: [
            "Step 1: Category (Commercial, Residential, Land), Purpose (Sale, Rent, Lease), Location details",
            "Step 2: Media Uploader (Compact image thumbnails grid, horizontal video button)",
            "Step 3: Details & Contact (Furnishing, Age dropdowns, WhatsApp, owner role choice: Owner, Broker, Agency which locks their profile role, personal broker checkbox)",
            "Step 4: Review (Price, specifications summary with validation to confirm and publish)"
          ]
        },
        subscriptionCheckout: {
          features: [
            "Role-specific pricing plans cards (1 Month, 6 Months, 1 Year durations)",
            "Razorpay checkout integration on click of Buy Now button"
          ]
        }
      },
      adminPanelPages: {
        pricingSettings: {
          layout: "2-column grid displaying pricing, discounts, duration, and feature lists for Owner, Broker, and Agency tiers",
          controls: "Allows adding, deleting, and modifying plans dynamically in the database"
        },
        trialAndRoleUpgrades: {
          controls: "Admin approves pending role upgrade requests and extends or expires trial days dynamically"
        },
        userAndPropertyManagement: {
          controls: [
            "Ability to block, activate, or verify user profiles",
            "View and moderate all property listings",
            "Define fallback contact number settings"
          ]
        }
      },
      businessLogicAndWorkflows: {
        onboarding: "New users sign up with a default role of 'user' (buyer) and are never prompted to pay until they perform seller actions.",
        freeInquiryThreshold: "Buyers can unlock details for up to 20 unique properties. Once exceeded, a checkout page unlocks to purchase a Buyer subscription.",
        roleTransitionLock: "When a buyer uploads their first property, they must pick a seller role (Owner, Broker, or Agency). This role is permanently locked into their user profile.",
        postingLimits: {
          Owner: "2 free listings initially, then up to 5 listings/month under a paid subscription.",
          BrokerAndAgency: "Up to 15-20 listings/month limit depending on plan settings."
        },
        viewTracking: "Visits are tracked synchronously. Cooldown prevents counting duplicates from the same visitor ID or IP + User Agent within 24 hours. Owner visits are skipped."
      }
    };

    fs.writeFileSync(docPath, JSON.stringify(docContent, null, 2), "utf8");
    console.log("Master system blueprint JSON generated successfully at project root.");
  } catch (err) {
    console.error("Failed to generate master system blueprint JSON:", err);
  }
}
generateSystemBlueprintFile();

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174,http://localhost:5175,https://property.greensparrows.com,https://greensparrows.com,https://api.greensparrows.com")
  .split(",")
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*") || origin.includes("greensparrows.com")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

const uploadsDir = getUploadDir();
const candidateUploadDirs = getAllCandidateUploadDirs();

// Auto-migrate files from Git folder to persistent uploads folder
const gitUploadsDir = path.resolve("src/uploads");
if (fs.existsSync(gitUploadsDir) && gitUploadsDir !== uploadsDir) {
  try {
    const files = fs.readdirSync(gitUploadsDir);
    files.forEach(file => {
      const srcFile = path.join(gitUploadsDir, file);
      const destFile = path.join(uploadsDir, file);
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Migrated upload asset: ${file}`);
      }
    });
  } catch (err) {
    console.error("Failed to migrate upload assets:", err);
  }
}

// Permissive CORS & Cross-Origin-Resource-Policy headers for static files in /uploads
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Serve static files from all candidate upload locations
candidateUploadDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    app.use("/uploads", express.static(dir));
  }
});

// Explicit fallback endpoint for /uploads/:filename to guarantee image file delivery
app.get("/uploads/:filename", (req, res) => {
  const filename = path.basename(req.params.filename);
  for (const dir of candidateUploadDirs) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  return res.status(404).send("File not found");
});

app.use("/apk", express.static(uploadsDir));

app.get(["/apk", "/apk/"], (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Download Sparrows Android APK</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #FAF8F3; color: #22302E; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-width: 400px; width: 100%; box-sizing: border-box; }
          h1 { color: #0F3D3E; margin-bottom: 8px; font-size: 24px; }
          p { color: #6B7A78; font-size: 14px; margin-bottom: 24px; }
          .btn { display: block; width: 100%; padding: 14px 20px; margin: 10px 0; background: #1B5E4F; color: #fff; text-decoration: none; border-radius: 12px; font-weight: 600; box-sizing: border-box; transition: background 0.2s; }
          .btn:hover { background: #0F3D3E; }
          .btn-admin { background: #0F3D3E; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Sparrows Mobile Apps</h1>
          <p>Download the official Android APK files below:</p>
          <a href="/apk/sparrows.apk" class="btn" download>📱 Download Sparrows App (User)</a>
          <a href="/apk/sparrows-admin.apk" class="btn btn-admin" download>🛠️ Download Sparrows Admin App</a>
        </div>
      </body>
    </html>
  `);
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/debug-files", (_req, res) => {
  try {
    const cwd = process.cwd();
    const exists = fs.existsSync(uploadsDir);
    const files = exists ? fs.readdirSync(uploadsDir) : [];
    res.json({
      cwd,
      uploadsDir,
      exists,
      filesCount: files.length,
      files: files.slice(0, 100),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Kerala Realty API listening on http://localhost:${port}`);
});
