-- Migration: flux de livraison complet + suivi livreur
-- - delivery_fee (F) et sokhra_commission (C) figés à la création
-- - picked_up_at / delivered_at : jalons du flux
-- - cash_collected : encaissement confirmé à la livraison
-- - courier_lat / courier_lng / courier_location_at : position GPS live du livreur

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS sokhra_commission DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cash_collected BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS courier_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS courier_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS courier_location_at TIMESTAMP;

COMMENT ON COLUMN trips.delivery_fee IS 'Frais de livraison F (revenu livreur), calculés selon la distance';
COMMENT ON COLUMN trips.sokhra_commission IS 'Commission Sokhra C (10% de F), ajoutée au total client';
COMMENT ON COLUMN trips.picked_up_at IS 'Horodatage de la confirmation de réception (pickup)';
COMMENT ON COLUMN trips.delivered_at IS 'Horodatage de la confirmation de livraison';
COMMENT ON COLUMN trips.cash_collected IS 'Encaissement confirmé chez le client';
COMMENT ON COLUMN trips.courier_lat IS 'Dernière latitude connue du livreur (suivi live)';
COMMENT ON COLUMN trips.courier_lng IS 'Dernière longitude connue du livreur (suivi live)';
COMMENT ON COLUMN trips.courier_location_at IS 'Horodatage de la dernière position livreur';
