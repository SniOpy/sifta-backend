# Checklist de validation - Ticket S01-T01

## Tests à effectuer pour finaliser le ticket

### ✅ Point 1 : Validation téléphone invalide

**Test 1.1 : Téléphone sans préfixe +212**
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "0612345678"}'
```

**Résultat attendu :** `400 Bad Request`
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "phone": "Format de téléphone invalide. Format attendu: +2126xxxxxxx ou +2127xxxxxxx"
  }
}
```

**Test 1.2 : Téléphone manquant**
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Résultat attendu :** `400 Bad Request`
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "phone": "Le numéro de téléphone est requis"
  }
}
```

**Test 1.3 : Format invalide (trop court)**
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+21261234"}'
```

**Résultat attendu :** `400 Bad Request` avec message d'erreur de format

---

### ✅ Point 2 : Rate limiting

**Test 2.1 : Envoyer 4 requêtes rapidement**

Exécutez cette commande 4 fois rapidement (dans les 10 secondes) :

```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212612345678"}'
```

**Résultats attendus :**
- Requêtes 1, 2, 3 : `200 OK` avec `{ "success": true, "message": "Code OTP envoyé avec succès" }`
- Requête 4 : `429 Too Many Requests` avec :
```json
{
  "success": false,
  "error": "Trop de demandes",
  "message": "Veuillez patienter avant de redemander un code"
}
```

**Vérification dans les headers de réponse :**
Les requêtes réussies devraient avoir des headers `RateLimit-*` :
- `RateLimit-Limit`: 3
- `RateLimit-Remaining`: 2, 1, 0
- `RateLimit-Reset`: timestamp

---

### ✅ Point 3 : Un seul OTP actif par téléphone

**Test 3.1 : Demander un OTP deux fois pour le même téléphone**

**Étape 1 :** Première demande
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212612345678"}'
```

**Étape 2 :** Vérifier en base de données (immédiatement après)
```sql
SELECT phone, expires_at, created_at, attempts 
FROM otp_codes 
WHERE phone = '+212612345678' 
ORDER BY created_at DESC;
```

**Étape 3 :** Deuxième demande (dans les 10 secondes)
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212612345678"}'
```

**Étape 4 :** Vérifier en base de données (immédiatement après)
```sql
-- Compter les OTP actifs (non expirés) pour ce téléphone
SELECT COUNT(*) as active_otps
FROM otp_codes 
WHERE phone = '+212612345678' 
AND expires_at > NOW();

-- Voir tous les OTP pour ce téléphone
SELECT phone, expires_at, created_at, attempts 
FROM otp_codes 
WHERE phone = '+212612345678' 
ORDER BY created_at DESC;
```

**Résultat attendu :**
- `active_otps` = **1** (un seul OTP actif)
- Le premier OTP devrait être supprimé (ou expiré)
- Seul le dernier OTP créé devrait être actif

**Test 3.2 : Vérifier que les anciens OTP sont bien supprimés**

Après avoir fait plusieurs demandes pour le même téléphone :
```sql
-- Voir tous les OTP (y compris ceux supprimés/expirés)
SELECT phone, expires_at, created_at, 
       CASE 
         WHEN expires_at > NOW() THEN 'ACTIF'
         ELSE 'EXPIRÉ'
       END as status
FROM otp_codes 
WHERE phone = '+212612345678' 
ORDER BY created_at DESC;
```

**Résultat attendu :**
- Un seul OTP avec status = 'ACTIF'
- Les autres OTP devraient être supprimés (ne pas apparaître dans la requête) OU avoir status = 'EXPIRÉ'

---

## Résumé des vérifications

| Critère | Test | Statut |
|---------|------|--------|
| Validation téléphone invalide | Test 1.1, 1.2, 1.3 | ⬜ À tester |
| Rate limiting (3 req/min) | Test 2.1 | ⬜ À tester |
| Un seul OTP actif par téléphone | Test 3.1, 3.2 | ⬜ À tester |

---

## Commandes SQL utiles

```sql
-- Voir tous les OTP actifs
SELECT phone, expires_at, created_at, attempts 
FROM otp_codes 
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Compter les OTP actifs par téléphone
SELECT phone, COUNT(*) as active_count
FROM otp_codes 
WHERE expires_at > NOW()
GROUP BY phone;

-- Voir tous les OTP (y compris expirés)
SELECT phone, expires_at, created_at, attempts,
       CASE 
         WHEN expires_at > NOW() THEN 'ACTIF'
         ELSE 'EXPIRÉ'
       END as status
FROM otp_codes 
ORDER BY created_at DESC;

-- Nettoyer les OTP expirés (maintenance)
DELETE FROM otp_codes WHERE expires_at <= NOW();
```

---

## Notes importantes

1. **Rate limiting** : La fenêtre est de 60 secondes (1 minute). Après 1 minute, vous pouvez refaire 3 nouvelles requêtes.

2. **Suppression des anciens OTP** : Le code supprime TOUS les OTP pour un téléphone avant d'en créer un nouveau, pas seulement les actifs. C'est une sécurité supplémentaire.

3. **Expiration automatique** : Les OTP expirent après 5 minutes (configurable via `OTP_EXPIRES_IN_MINUTES` dans `.env`).
