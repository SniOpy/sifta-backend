-- Migration: Création de la table users
-- Description: Table pour stocker les utilisateurs avec association téléphone
-- Date: 2026-02-03

-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur phone pour recherches rapides (déjà unique, mais index explicite pour performance)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Index sur created_at pour requêtes de tri
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE users IS 'Table pour stocker les utilisateurs avec association téléphone';
COMMENT ON COLUMN users.id IS 'Identifiant unique de l utilisateur';
COMMENT ON COLUMN users.phone IS 'Numéro de téléphone (format normalisé, unique)';
COMMENT ON COLUMN users.created_at IS 'Date et heure de création de l utilisateur';
COMMENT ON COLUMN users.updated_at IS 'Date et heure de dernière mise à jour de l utilisateur';
