-- MedTrust Database Schema (PostgreSQL)
-- For use with Neon PostgreSQL
-- Run: psql -d neondb < schema.sql

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('patient','donor','ngo','admin');
CREATE TYPE campaign_status AS ENUM ('draft','pending','verified','rejected','completed','suspended');
CREATE TYPE urgency_level AS ENUM ('low','medium','high','critical');
CREATE TYPE document_type AS ENUM ('hospital_report','identity_proof','treatment_estimate','prescription','other');
CREATE TYPE payment_status AS ENUM ('pending','captured','failed','refunded');
CREATE TYPE expense_type AS ENUM ('hospital_bill','medicine','surgery','consultation','tests','transport','other');
CREATE TYPE verification_status AS ENUM ('pending','verified','rejected');
CREATE TYPE fraud_status AS ENUM ('open','investigating','resolved','dismissed');

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(200) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role DEFAULT 'donor',
  phone           VARCHAR(20),
  avatar_url      TEXT,
  is_verified     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ─────────────────────────────────────────────
-- NGO PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE ngo_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  org_name        VARCHAR(200) NOT NULL,
  registration_no VARCHAR(100),
  website         TEXT,
  description     TEXT,
  verified_by     INT REFERENCES users(id) ON DELETE SET NULL,
  verified_at     TIMESTAMP NULL
);

-- ─────────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────────
CREATE TABLE campaigns (
  id               SERIAL PRIMARY KEY,
  patient_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  urgency_level    urgency_level DEFAULT 'medium',
  status           campaign_status DEFAULT 'pending',
  cover_image_url  TEXT,
  verified_by      INT REFERENCES users(id) ON DELETE SET NULL,
  verified_at      TIMESTAMP NULL,
  rejection_reason TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_disease ON campaigns(disease);
CREATE INDEX idx_campaigns_urgency ON campaigns(urgency_level);

-- ─────────────────────────────────────────────
-- DOCUMENTS (medical proof)
-- ─────────────────────────────────────────────
CREATE TABLE documents (
  id            SERIAL PRIMARY KEY,
  campaign_id   INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     VARCHAR(300),
  file_size     INT,
  mime_type     VARCHAR(100),
  uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_campaign ON documents(campaign_id);

-- ─────────────────────────────────────────────
-- DONATIONS
-- ─────────────────────────────────────────────
CREATE TABLE donations (
  id                  SERIAL PRIMARY KEY,
  donor_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id         INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  amount              DECIMAL(12,2) NOT NULL,
  currency            VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id   VARCHAR(200),
  razorpay_payment_id VARCHAR(200),
  razorpay_signature  VARCHAR(500),
  payment_status      payment_status DEFAULT 'pending',
  is_anonymous        BOOLEAN DEFAULT FALSE,
  message             TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_campaign ON donations(campaign_id);
CREATE INDEX idx_donations_status ON donations(payment_status);

-- ─────────────────────────────────────────────
-- EXPENSES (transparency records)
-- ─────────────────────────────────────────────
CREATE TABLE expenses (
  id            SERIAL PRIMARY KEY,
  campaign_id   INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  description   VARCHAR(500) NOT NULL,
  expense_type  expense_type NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  receipt_url   TEXT,
  receipt_name  VARCHAR(300),
  spent_on      DATE NOT NULL,
  uploaded_by   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_campaign ON expenses(campaign_id);

-- ─────────────────────────────────────────────
-- CAMPAIGN UPDATES
-- ─────────────────────────────────────────────
CREATE TABLE campaign_updates (
  id          SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  author_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(300),
  content     TEXT NOT NULL,
  image_url   TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- NGO VERIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE ngo_verifications (
  id              SERIAL PRIMARY KEY,
  campaign_id     INT NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  ngo_user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          verification_status DEFAULT 'pending',
  notes           TEXT,
  hospital_conf_url TEXT,
  verified_at     TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- FRAUD FLAGS
-- ─────────────────────────────────────────────
CREATE TABLE fraud_flags (
  id          SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reported_by INT REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL,
  status      fraud_status DEFAULT 'open',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  title      VARCHAR(300) NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(is_read);

-- ─────────────────────────────────────────────
-- SEED: Admin user (password: Admin@123)
-- ─────────────────────────────────────────────
INSERT INTO users (name, email, password_hash, role, is_verified)
VALUES ('System Admin', 'admin@medtrust.in',
        '$2b$10$YourHashedPasswordHere', 'admin', TRUE);
