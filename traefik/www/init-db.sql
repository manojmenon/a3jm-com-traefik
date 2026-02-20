-- Enable bcrypt for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users: students and admin
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(32)  NOT NULL DEFAULT 'student',
  full_name     VARCHAR(255),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Session store for express-session (connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid"    VARCHAR NOT NULL PRIMARY KEY,
  "sess"   JSON    NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Registrations: optional link to user account
CREATE TABLE IF NOT EXISTS registrations (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id) ON DELETE SET NULL,
  student_name   VARCHAR(255) NOT NULL,
  guardian_name  VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(64)  NOT NULL,
  grade          VARCHAR(64)  NOT NULL,
  subject        VARCHAR(128) NOT NULL,
  slot           VARCHAR(64)  NOT NULL,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- Backfill user_id column if upgrading from an older schema (before indexes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registrations' AND column_name = 'user_id') THEN
    ALTER TABLE registrations ADD COLUMN user_id INT REFERENCES users(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);

-- Seed default admin (password: Admin@123) – change after first login
INSERT INTO users (email, password_hash, role, full_name)
SELECT 'admin@a3jm.com', crypt('Admin@123', gen_salt('bf')), 'admin', 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@a3jm.com');
