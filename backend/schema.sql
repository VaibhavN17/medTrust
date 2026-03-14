-- MedTrust Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS medtrust;
USE medtrust;

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('patient','donor','ngo','admin') NOT NULL DEFAULT 'donor',
  phone         VARCHAR(20),
  avatar_url    TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
);

-- ─────────────────────────────────────────────
-- NGO PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE ngo_profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE,
  org_name        VARCHAR(200) NOT NULL,
  registration_no VARCHAR(100),
  website         TEXT,
  description     TEXT,
  verified_by     INT,
  verified_at     TIMESTAMP NULL,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────────
CREATE TABLE campaigns (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  patient_id       INT NOT NULL,
  title            VARCHAR(300) NOT NULL,
  slug             VARCHAR(300) UNIQUE,
  disease          VARCHAR(200) NOT NULL,
  description      TEXT NOT NULL,
  hospital_name    VARCHAR(300) NOT NULL,
  hospital_city    VARCHAR(150),
  hospital_state   VARCHAR(150),
  target_amount    DECIMAL(12,2) NOT NULL,
  collected_amount DECIMAL(12,2) DEFAULT 0.00,
  treatment_deadline DATE,
  urgency_level    ENUM('low','medium','high','critical') DEFAULT 'medium',
  status           ENUM('draft','pending','verified','rejected','completed','suspended') DEFAULT 'pending',
  cover_image_url  TEXT,
  verified_by      INT,
  verified_at      TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status   (status),
  INDEX idx_disease  (disease),
  INDEX idx_urgency  (urgency_level),
  FULLTEXT idx_search (title, disease, description, hospital_name)
);

-- ─────────────────────────────────────────────
-- DOCUMENTS (medical proof)
-- ─────────────────────────────────────────────
CREATE TABLE documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id   INT NOT NULL,
  document_type ENUM('hospital_report','identity_proof','treatment_estimate','prescription','other') NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     VARCHAR(300),
  file_size     INT,
  mime_type     VARCHAR(100),
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id)
);

-- ─────────────────────────────────────────────
-- DONATIONS
-- ─────────────────────────────────────────────
CREATE TABLE donations (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  donor_id           INT NOT NULL,
  campaign_id        INT NOT NULL,
  amount             DECIMAL(12,2) NOT NULL,
  currency           VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id  VARCHAR(200),
  razorpay_payment_id VARCHAR(200),
  razorpay_signature  VARCHAR(500),
  payment_status     ENUM('pending','captured','failed','refunded') DEFAULT 'pending',
  is_anonymous       BOOLEAN DEFAULT FALSE,
  message            TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_donor    (donor_id),
  INDEX idx_campaign (campaign_id),
  INDEX idx_status   (payment_status)
);

-- ─────────────────────────────────────────────
-- EXPENSES (transparency records)
-- ─────────────────────────────────────────────
CREATE TABLE expenses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id   INT NOT NULL,
  description   VARCHAR(500) NOT NULL,
  expense_type  ENUM('hospital_bill','medicine','surgery','consultation','tests','transport','other') NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  receipt_url   TEXT,
  receipt_name  VARCHAR(300),
  spent_on      DATE NOT NULL,
  uploaded_by   INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_campaign (campaign_id)
);

-- ─────────────────────────────────────────────
-- CAMPAIGN UPDATES
-- ─────────────────────────────────────────────
CREATE TABLE campaign_updates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  author_id   INT NOT NULL,
  title       VARCHAR(300),
  content     TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id)   REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- NGO VERIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE ngo_verifications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id     INT NOT NULL UNIQUE,
  ngo_user_id     INT NOT NULL,
  status          ENUM('pending','verified','rejected') DEFAULT 'pending',
  notes           TEXT,
  hospital_conf_url TEXT,
  verified_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (ngo_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- FRAUD FLAGS
-- ─────────────────────────────────────────────
CREATE TABLE fraud_flags (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  reported_by INT,
  reason      TEXT NOT NULL,
  status      ENUM('open','investigating','resolved','dismissed') DEFAULT 'open',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- EMAIL NOTIFICATIONS LOG
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(300) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user   (user_id),
  INDEX idx_unread (is_read)
);

-- ─────────────────────────────────────────────
-- SEED: Admin user (password: Admin@123)
-- ─────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, is_verified)
VALUES ('System Admin', 'admin@medtrust.in',
        '$2b$10$YourHashedPasswordHere', 'admin', TRUE);
