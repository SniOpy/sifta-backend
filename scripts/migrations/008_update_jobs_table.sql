-- Migration: Mise à jour jobs (colonnes optionnelles) - Idempotent
-- Date: 2026-02-07

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'seller_id') THEN
      ALTER TABLE jobs ADD COLUMN seller_id UUID;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'user_id') THEN
        UPDATE jobs SET seller_id = user_id WHERE seller_id IS NULL;
      END IF;
      ALTER TABLE jobs ALTER COLUMN seller_id SET NOT NULL;
      ALTER TABLE jobs ADD CONSTRAINT fk_jobs_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_jobs_seller_id ON jobs(seller_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'sokhra_fee') THEN
      ALTER TABLE jobs ADD COLUMN sokhra_fee DECIMAL(10,2) NOT NULL DEFAULT 3.00;
      ALTER TABLE jobs ADD CONSTRAINT chk_sokhra_fee_positive CHECK (sokhra_fee >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'cash_collected') THEN
      ALTER TABLE jobs ADD COLUMN cash_collected BOOLEAN NOT NULL DEFAULT false;
      CREATE INDEX IF NOT EXISTS idx_jobs_cash_collected ON jobs(cash_collected);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'distance_km') THEN
      ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_distance_positive;
      ALTER TABLE jobs DROP COLUMN distance_km;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'pickup_address') THEN
      ALTER TABLE jobs DROP COLUMN pickup_address;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'dropoff_address') THEN
      ALTER TABLE jobs DROP COLUMN dropoff_address;
    END IF;
  END IF;
END $$;
