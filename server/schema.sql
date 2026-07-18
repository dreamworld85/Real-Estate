-- Kerala Realty — MySQL schema
-- Run this against a fresh database, e.g.:
--   mysql -u root -p kerala_realty < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE,
  phone         VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  location      VARCHAR(160),
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  owner_id       INT NOT NULL,
  title          VARCHAR(200) NOT NULL,
  property_type  ENUM('House','Villa','Apartment','Land','Commercial Space') NOT NULL,
  purpose        ENUM('For Sale','For Rent') NOT NULL,
  price          DECIMAL(14,2) NOT NULL,
  area_sqft      INT NOT NULL,
  address        VARCHAR(255) NOT NULL,
  district       VARCHAR(80) NOT NULL,
  bedrooms       INT DEFAULT 0,
  bathrooms      INT DEFAULT 0,
  furnishing     ENUM('Unfurnished','Semi-Furnished','Fully Furnished') DEFAULT NULL,
  facing         VARCHAR(20),
  property_age   VARCHAR(30),
  description    TEXT,
  listing_role   ENUM('Owner','Broker','Agency') NOT NULL,
  status         ENUM('Draft','Pending','Active','Inactive','Rejected') DEFAULT 'Pending',
  views          INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_media (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  media_type   ENUM('image','video') NOT NULL,
  url          VARCHAR(500) NOT NULL,
  sort_order   INT DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_properties (
  user_id      INT NOT NULL,
  property_id  INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enquiries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  visitor_id   INT NOT NULL,
  message      VARCHAR(500),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_views (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  visitor_id   INT,
  viewed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES users(id) ON DELETE SET NULL
);
