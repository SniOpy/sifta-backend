-- Migration: Création de la table commission_logs
-- Description: Historique des règlements de commission (montant payé, admin, date)
-- Date: 2026-02-18
-- Ticket: S05-BE-T06 / S05-BE-T08

CREATE TABLE IF NOT EXISTS commission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    admin_id UUID NOT NULL,
    settled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_paid_positive CHECK (amount_paid >= 0),
    CONSTRAINT fk_commission_logs_courier FOREIGN KEY (courier_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_commission_logs_admin FOREIGN KEY (admin_id)
        REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_commission_logs_courier_id ON commission_logs(courier_id);
CREATE INDEX IF NOT EXISTS idx_commission_logs_admin_id ON commission_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_commission_logs_settled_at ON commission_logs(settled_at DESC);

COMMENT ON TABLE commission_logs IS 'Historique des règlements de commission (contrôle et traçabilité)';
COMMENT ON COLUMN commission_logs.courier_id IS 'Livreur dont la commission a été réglée';
COMMENT ON COLUMN commission_logs.amount_paid IS 'Montant réglé en MAD';
COMMENT ON COLUMN commission_logs.admin_id IS 'Admin ayant effectué le règlement';
COMMENT ON COLUMN commission_logs.settled_at IS 'Date et heure du règlement';
