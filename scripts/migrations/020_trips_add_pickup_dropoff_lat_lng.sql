-- S06-FS-T03: Géoloc minimal — colonnes lat/lng pour matching 3 km
-- pickup = from_location, dropoff = to_location

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS dropoff_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS dropoff_lng DECIMAL(11, 8);

COMMENT ON COLUMN trips.pickup_lat IS 'Latitude lieu de prise en charge (extraite d''URL Maps/WhatsApp)';
COMMENT ON COLUMN trips.pickup_lng IS 'Longitude lieu de prise en charge';
COMMENT ON COLUMN trips.dropoff_lat IS 'Latitude lieu de livraison';
COMMENT ON COLUMN trips.dropoff_lng IS 'Longitude lieu de livraison';
