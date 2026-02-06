-- Migration: Création de la table trips
-- Description: Table pour stocker les trajets avec gestion des statuts
-- Date: 2026-02-06

-- Création de la table trips
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'MAD',
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte CHECK pour valider les statuts autorisés
    CONSTRAINT chk_trip_status CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
    
    -- Contrainte CHECK pour valider les statuts de paiement
    CONSTRAINT chk_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Contrainte CHECK pour valider le prix (positif si fourni)
    CONSTRAINT chk_price_positive CHECK (price IS NULL OR price >= 0),
    
    -- Contrainte CHECK pour valider la devise (3 caractères)
    CONSTRAINT chk_currency_length CHECK (LENGTH(currency) = 3)
);

-- Supprimer la contrainte si elle existe déjà avant de la créer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_trips_user'
    ) THEN
        ALTER TABLE trips DROP CONSTRAINT fk_trips_user;
    END IF;
END $$;

-- Créer la contrainte de clé étrangère
ALTER TABLE trips
    ADD CONSTRAINT fk_trips_user 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE CASCADE;

-- Index sur user_id pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);

-- Index sur status pour filtrage et requêtes de statut
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- Index composite sur (user_id, status) pour requêtes efficaces
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips(user_id, status);

-- Index sur created_at pour tri chronologique
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE trips IS 'Table pour stocker les trajets avec gestion des statuts';
COMMENT ON COLUMN trips.id IS 'Identifiant unique du trajet';
COMMENT ON COLUMN trips.user_id IS 'Référence vers l utilisateur propriétaire du trajet';
COMMENT ON COLUMN trips.from_location IS 'Adresse de départ du trajet';
COMMENT ON COLUMN trips.to_location IS 'Adresse d arrivée du trajet';
COMMENT ON COLUMN trips.status IS 'Statut du trajet (pending, accepted, in_progress, completed, cancelled)';
COMMENT ON COLUMN trips.price IS 'Prix du trajet en devise spécifiée';
COMMENT ON COLUMN trips.currency IS 'Devise du prix (3 caractères, défaut: MAD)';
COMMENT ON COLUMN trips.payment_status IS 'Statut du paiement (pending, paid, failed, refunded)';
COMMENT ON COLUMN trips.created_at IS 'Date et heure de création du trajet';
COMMENT ON COLUMN trips.updated_at IS 'Date et heure de dernière mise à jour du trajet';
