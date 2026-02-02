-- Migration: Création de la table otp_codes
-- Description: Table pour stocker les codes OTP avec hash, expiration et tentatives
-- Date: 2026-02-02

-- Création de la table otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index sur phone pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);

-- Index sur expires_at pour nettoyage des codes expirés
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Index composite sur (phone, expires_at) pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_expires ON otp_codes(phone, expires_at);

-- Commentaires pour documentation
COMMENT ON TABLE otp_codes IS 'Table pour stocker les codes OTP avec hash sécurisé';
COMMENT ON COLUMN otp_codes.id IS 'Identifiant unique du code OTP';
COMMENT ON COLUMN otp_codes.phone IS 'Numéro de téléphone (format normalisé)';
COMMENT ON COLUMN otp_codes.code_hash IS 'Hash bcrypt du code OTP';
COMMENT ON COLUMN otp_codes.expires_at IS 'Date et heure d expiration du code';
COMMENT ON COLUMN otp_codes.attempts IS 'Nombre de tentatives de vérification';
COMMENT ON COLUMN otp_codes.created_at IS 'Date et heure de création du code';
