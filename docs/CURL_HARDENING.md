# Exemples curl — Hardening API

Base URL : `http://localhost:3000/api/v1`

## GET /me (Bearer requis)

```bash
curl -s -X GET "http://localhost:3000/api/v1/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Réponse attendue (200) : `{ "success": true, "message": "OK", "data": { "id", "phone", "role", "onboarding_completed", "is_admin" }, "error": null }`

---

## GET /couriers/me/account (courier uniquement)

```bash
curl -s -X GET "http://localhost:3000/api/v1/couriers/me/account" \
  -H "Authorization: Bearer <COURIER_ACCESS_TOKEN>"
```

---

## POST /couriers/:id/settle (admin uniquement)

```bash
curl -s -X POST "http://localhost:3000/api/v1/couriers/<COURIER_UUID>/settle" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

---

## Réponses d’erreur standardisées

- `success: false`, `data: null`, `error: { "code": "...", "message": "..." }`, optionnellement `details` (validation).
- Codes HTTP : 400 validation, 401 non authentifié, 403 interdit, 404 not found, 409 conflict.
