-- Migration: Type de compte utilisateur (vendeur / livreur)
-- Description: Permet de choisir le type de compte avant ou à la connexion, pour rediriger vers la bonne interface
-- Date: 2026-02-18

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_users_account_type;

ALTER TABLE users
  ADD CONSTRAINT chk_users_account_type
  CHECK (account_type IS NULL OR account_type IN ('seller', 'courier'));

COMMENT ON COLUMN users.account_type IS 'Type de compte: seller (vendeur) ou courier (livreur). NULL si non défini.';
