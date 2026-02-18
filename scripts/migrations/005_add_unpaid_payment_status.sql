-- Migration: Ajout du statut unpaid pour payment_status (trips)
-- Date: 2026-02-06

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_status' AND conrelid = 'trips'::regclass) THEN
    ALTER TABLE trips DROP CONSTRAINT chk_payment_status;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_trips_payment_status' AND conrelid = 'trips'::regclass) THEN
    ALTER TABLE trips DROP CONSTRAINT chk_trips_payment_status;
  END IF;
END $$;

ALTER TABLE trips ADD CONSTRAINT chk_payment_status CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded'));
