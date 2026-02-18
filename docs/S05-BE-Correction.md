# S05-BE-Correction: Role-first auth + role guards + /me

## Role-first flow

1. **Frontend**: User chooses role (seller | courier) then enters phone.
2. **POST /auth/request-otp** `{ "phone": "+33...", "role": "seller" }`  
   - Role is **required** and stored with the OTP in `otp_codes.role`.
3. **POST /auth/verify-otp** `{ "phone": "+33...", "code": "123456" }`  
   - **No role in body.** Role is read from the OTP row (server-side).  
   - User is created/updated with `user.role = session.role` and `onboarding_completed = true`.
4. **GET /auth/me** (with Bearer token)  
   - Returns `{ user: { id, phone, role, onboarding_completed } }` from DB for redirect.

## Source of truth for role

- **request-otp**: Client sends role → stored in `otp_codes.role`.
- **verify-otp**: Role is taken **only** from the OTP row (never from body).  
  Then written to `users.role` and `users.onboarding_completed = true`.

## Role guards

- `requireRole('seller')` / `requireRole('courier')`: use after `authenticateJWT`.  
  Block with 403 if `req.user.role` does not match.  
  Apply to seller-only or courier-only routes.

## DB

- **otp_codes**: `role` (VARCHAR, seller|courier) — migration 017.
- **users**: `role`, `onboarding_completed` — migration 018.

## Legacy users

- `role = null`, `onboarding_completed = false` → frontend can show role choice and call a future `POST /profile/complete` or re-auth with role.
