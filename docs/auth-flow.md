## 🔐 Diagramme — Authentification par téléphone (OTP)

```text
Client
  |
  | 1. POST /auth/request-otp
  |    { phone }
  v
API (Backend)
  |
  | - Validation format téléphone
  | - Génération OTP (6 chiffres)
  | - Hash OTP
  | - Expiration (5 minutes)
  |
  v
Database (otp_codes)
  |
  v
SMS Provider
  |
  | 2. Envoi du SMS avec OTP
  v
Client
  |
  | 3. POST /auth/verify-otp
  |    { phone, code }
  v
API (Backend)
  |
  | - Vérification OTP + expiration
  | - Création utilisateur si inexistant
  | - Suppression OTP
  |
  v
Database (users, refresh_tokens)
  |
  | 4. Génération des tokens
  |    - Access Token (JWT)
  |    - Refresh Token
  v
Client (Authentifié)

```
