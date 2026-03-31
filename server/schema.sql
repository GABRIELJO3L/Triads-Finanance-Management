-- ============================================================
--  Triads Finance Management — Database Schema
-- ============================================================

-- Users (single admin login)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work categories (fixed seeded values)
CREATE TABLE IF NOT EXISTS work_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Projects / tasks logged under clients
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount_charged NUMERIC(12, 2) DEFAULT 0,
  cost_incurred NUMERIC(12, 2) DEFAULT 0,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  monthly_salary NUMERIC(12, 2) DEFAULT 0,
  joining_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monthly salary payment status per employee
CREATE TABLE IF NOT EXISTS salary_payments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  month CHAR(7) NOT NULL,   -- e.g. '2026-02'
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,
  UNIQUE(employee_id, month)
);

-- One-time bonuses / extra payments
CREATE TABLE IF NOT EXISTS employee_bonuses (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Miscellaneous monthly expenses (rent, tools, subscriptions)
CREATE TABLE IF NOT EXISTS misc_expenses (
  id SERIAL PRIMARY KEY,
  month CHAR(7) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Salary advances (portion of salary collected in advance)
CREATE TABLE IF NOT EXISTS salary_advances (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) DEFAULT 0,
  description TEXT,
  date DATE NOT NULL,
  month CHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── Seed default categories ───────────────────────────────────
INSERT INTO work_categories (name) VALUES
  ('Poster'),
  ('Video'),
  ('Social Media Marketing'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- ── Seed default admin user (username: admin, password: triads@123) ──
-- Password will be replaced by the setup script with a bcrypt hash
INSERT INTO users (username, password_hash) VALUES
  ('admin', '$2b$10$placeholder_will_be_replaced')
ON CONFLICT (username) DO NOTHING;
