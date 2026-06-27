-- Migration: ajout ville + téléphone client aux trips
-- Phase test mono-ville (Tanger) : on stocke la ville de la course et le téléphone
-- du client pour que le livreur puisse le contacter.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30);

COMMENT ON COLUMN trips.city IS 'Ville de la course (phase test: Tanger uniquement)';
COMMENT ON COLUMN trips.customer_phone IS 'Téléphone du client destinataire (contact livreur)';
