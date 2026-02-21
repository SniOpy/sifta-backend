-- S06-FS-T05: Date/heure à laquelle la course a été acceptée par le livreur (claim atomique)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP NULL;

COMMENT ON COLUMN trips.assigned_at IS 'Date et heure à laquelle un livreur a accepté la course (claim)';
