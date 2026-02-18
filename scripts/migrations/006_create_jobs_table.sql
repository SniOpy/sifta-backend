-- Migration: Création de la table jobs (renommée en courses par 010)
-- Date: 2026-02-07

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  courier_id UUID,
  city VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sokhra_fee DECIMAL(10,2) NOT NULL DEFAULT 3.00,
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
  cash_collected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_job_status CHECK (status IN ('CREATED', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED')),
  CONSTRAINT chk_price_fixed CHECK (price IN (20, 25, 30, 40, 50)),
  CONSTRAINT chk_sokhra_fee_positive CHECK (sokhra_fee > 0 AND sokhra_fee <= 10)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_jobs_seller') THEN ALTER TABLE jobs DROP CONSTRAINT fk_jobs_seller; END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_jobs_courier') THEN ALTER TABLE jobs DROP CONSTRAINT fk_jobs_courier; END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_jobs_user') THEN ALTER TABLE jobs DROP CONSTRAINT fk_jobs_user; END IF;
END $$;

ALTER TABLE jobs ADD CONSTRAINT fk_jobs_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_courier FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_seller_id ON jobs(seller_id);
CREATE INDEX IF NOT EXISTS idx_jobs_courier_id ON jobs(courier_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_cash_collected ON jobs(cash_collected);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
