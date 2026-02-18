-- S05-BE-Correction: Store role with OTP so verify-otp uses server-side role (source of truth).
-- Role is chosen at request-otp and persisted here; at verify we read it, never trust client body.

ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS role VARCHAR(20);

ALTER TABLE otp_codes
  DROP CONSTRAINT IF EXISTS chk_otp_codes_role;

ALTER TABLE otp_codes
  ADD CONSTRAINT chk_otp_codes_role
  CHECK (role IS NULL OR role IN ('seller', 'courier'));

COMMENT ON COLUMN otp_codes.role IS 'Role choisi à request-otp; source de vérité au verify-otp (S05-BE-Correction)';
