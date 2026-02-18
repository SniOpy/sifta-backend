-- S05-BE-Correction: user.role (seller|courier) and onboarding_completed for /me and role-first flow.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE users
  ADD CONSTRAINT chk_users_role
  CHECK (role IS NULL OR role IN ('seller', 'courier'));

-- Optional: backfill role from account_type if that column exists (Sprint 5 compat)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'account_type'
  ) THEN
    UPDATE users SET role = account_type WHERE account_type IS NOT NULL AND (role IS NULL OR role = '');
  END IF;
END $$;

COMMENT ON COLUMN users.role IS 'seller | courier; set at verify-otp from OTP session (S05-BE-Correction)';
COMMENT ON COLUMN users.onboarding_completed IS 'true after first successful verify-otp with role (S05-BE-Correction)';
