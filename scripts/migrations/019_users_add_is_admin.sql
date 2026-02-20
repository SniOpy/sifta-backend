-- Migration: users.is_admin (remplace ADMIN_USER_IDS)
-- Date: 2026-02-18

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN users.is_admin IS 'Admin applicatif (accès routes admin, ex. settle courier)';
