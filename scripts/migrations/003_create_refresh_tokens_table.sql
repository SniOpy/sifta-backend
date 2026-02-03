-- Migration: Création de la table refresh_tokens
-- Description: Table pour stocker les refresh tokens avec hash sécurisé
-- Date: 2026-02-03

-- Création de la table refresh_tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Index sur user_id pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Index sur expires_at pour nettoyage des tokens expirés
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Index sur revoked pour requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(revoked);

-- Index composite sur (user_id, revoked) pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_revoked ON refresh_tokens(user_id, revoked);

-- Commentaires pour documentation
COMMENT ON TABLE refresh_tokens IS 'Table pour stocker les refresh tokens avec hash sécurisé';
COMMENT ON COLUMN refresh_tokens.id IS 'Identifiant unique du refresh token';
COMMENT ON COLUMN refresh_tokens.user_id IS 'Référence vers l utilisateur propriétaire du token';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hash bcrypt du refresh token';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Date et heure d expiration du token';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Indique si le token a été révoqué';
COMMENT ON COLUMN refresh_tokens.created_at IS 'Date et heure de création du token';
