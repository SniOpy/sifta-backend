-- Migration: Adresses de prise en charge et de livraison pour les courses
-- Description: Le vendeur renseigne sa position de départ et la position de livraison (pour le livreur), pas la distance
-- Date: 2026-02-18

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS pickup_address VARCHAR(500);

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);

COMMENT ON COLUMN courses.pickup_address IS 'Adresse de prise en charge (position de départ du vendeur)';
COMMENT ON COLUMN courses.delivery_address IS 'Adresse de livraison (position de livraison définie par le vendeur)';
