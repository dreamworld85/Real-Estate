import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

// Ensure uploads directory exists
const serverUploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(serverUploadsDir)) {
  console.log("Creating uploads directory...");
  fs.mkdirSync(serverUploadsDir, { recursive: true });
}

import { seedPlans } from "./seedPlans.js";

import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payments.js";

// Auto-migrate database table columns for subscription offers
async function checkDbMigration() {
  try {
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
    const [userCols] = await pool.query("SHOW COLUMNS FROM users");
    const userColNames = userCols.map(c => c.Field);
    
    if (!userColNames.includes("role")) {
      console.log("Adding role column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'");
    }

    if (!userColNames.includes("trial_ends_at")) {
      console.log("Adding trial_ends_at column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN trial_ends_at DATETIME NULL");
    }

    if (!userColNames.includes("subscription_status")) {
      console.log("Adding subscription_status column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) NULL");
    }

    if (!userColNames.includes("razorpay_subscription_id")) {
      console.log("Adding razorpay_subscription_id column to users...");
      await pool.query("ALTER TABLE users ADD COLUMN razorpay_subscription_id VARCHAR(255) NULL");
    }

    if (!userColNames.includes("is_disabled")) {
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

dotenv.config();

// Auto-configure persistent UPLOADS_DIR on Hostinger server
if (process.cwd().includes("api.greensparrows.com")) {
  const envPath = path.resolve(".env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  if (!envContent.includes("UPLOADS_DIR")) {
    console.log("Auto-injecting persistent UPLOADS_DIR into .env");
    envContent += "\nUPLOADS_DIR=/home/u859202671/domains/api.greensparrows.com/uploads\n";
    fs.writeFileSync(envPath, envContent, "utf8");
    // Reload environment variables
    dotenv.config();
  }
}

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

const uploadsDir = process.env.UPLOADS_DIR 
  ? path.resolve(process.env.UPLOADS_DIR) 
  : path.resolve("src/uploads");

// Ensure persistent upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

app.use("/uploads", express.static(uploadsDir));

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
