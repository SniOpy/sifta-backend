-- Migration: Table courier_account (compte livreur)
-- Date: 2026-02-07

CREATE TABLE IF NOT EXISTS courier_account (
  courier_id UUID PRIMARY KEY,
  total_jobs INTEGER NOT NULL DEFAULT 0,
  commission_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_settlement_at TIMESTAMP,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_total_jobs_positive CHECK (total_jobs >= 0),
  CONSTRAINT chk_commission_due_positive CHECK (commission_due >= 0),
  CONSTRAINT fk_courier_account_courier FOREIGN KEY (courier_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_courier_account_is_blocked ON courier_account(is_blocked);
CREATE INDEX IF NOT EXISTS idx_courier_account_commission_due ON courier_account(commission_due DESC);
CREATE INDEX IF NOT EXISTS idx_courier_account_last_settlement ON courier_account(last_settlement_at DESC);

DROP TRIGGER IF EXISTS update_courier_account_updated_at ON courier_account;
CREATE TRIGGER update_courier_account_updated_at BEFORE UPDATE ON courier_account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
