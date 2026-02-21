-- Livreur qui a accepté la course (claim)
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS courier_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_trips_courier'
  ) THEN
    ALTER TABLE trips
      ADD CONSTRAINT fk_trips_courier
      FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trips_courier_id ON trips(courier_id);

COMMENT ON COLUMN trips.courier_id IS 'Livreur ayant accepté la course (null si pending)';
