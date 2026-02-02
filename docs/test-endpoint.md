# Guide de test de l'endpoint request-otp

## Prérequis

1. ✅ Migration SQL exécutée
2. ✅ Fichier `.env` configuré
3. ✅ Serveur démarré (`npm run dev`)

## Endpoint

**URL:** `POST http://localhost:3000/api/v1/auth/request-otp`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "+212612345678"
}
```

---

## Méthode 1 : curl (Terminal)

### Test avec téléphone valide
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+212612345678"}'
```

### Test avec téléphone invalide (format incorrect)
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "0612345678"}'
```

### Test avec téléphone manquant
```bash
curl -X POST http://localhost:3000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test du rate limiting (envoyer 4 requêtes rapidement)
```bash
# Exécuter 4 fois rapidement pour tester le rate limit
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/v1/auth/request-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+212612345678"}'
  echo ""
done
```

---

## Méthode 2 : Postman

1. **Créer une nouvelle requête**
   - Méthode: `POST`
   - URL: `http://localhost:3000/api/v1/auth/request-otp`

2. **Configurer les headers**
   - Key: `Content-Type`
   - Value: `application/json`

3. **Ajouter le body (raw JSON)**
   ```json
   {
     "phone": "+212612345678"
   }
   ```

4. **Envoyer la requête**

### Exemples de tests dans Postman

**Test 1: Téléphone valide**
```json
{
  "phone": "+212612345678"
}
```
**Résultat attendu:** `200 OK` avec `{ "success": true, "message": "Code OTP envoyé avec succès" }`

**Test 2: Téléphone invalide**
```json
{
  "phone": "0612345678"
}
```
**Résultat attendu:** `400 Bad Request` avec erreur de validation

**Test 3: Téléphone manquant**
```json
{}
```
**Résultat attendu:** `400 Bad Request` avec erreur de validation

**Test 4: Rate limiting**
Envoyer 4 requêtes rapidement avec le même téléphone.
**Résultat attendu:** Les 3 premières réussissent, la 4ème retourne `429 Too Many Requests`

---

## Méthode 3 : HTTPie (si installé)

```bash
http POST http://localhost:3000/api/v1/auth/request-otp phone="+212612345678"
```

---

## Réponses attendues

### ✅ Succès (200)
```json
{
  "success": true,
  "message": "Code OTP envoyé avec succès"
}
```

### ❌ Erreur de validation (400)
```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "phone": "Format de téléphone invalide. Format attendu: +2126xxxxxxx ou +2127xxxxxxx"
  }
}
```

### ❌ Rate limit (429)
```json
{
  "success": false,
  "error": "Trop de demandes",
  "message": "Veuillez patienter avant de redemander un code"
}
```

### ❌ Erreur serveur (500)
```json
{
  "success": false,
  "error": "Erreur interne du serveur",
  "message": "Une erreur est survenue lors de l'envoi du code OTP"
}
```

---

## Vérifications dans les logs

Lors d'une requête réussie, vous devriez voir dans la console :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SMS MOCK] 📱 Envoi SMS
   Destinataire: +212612345678
   Message: Votre code OTP Sokhra est 123456
   Code: 123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Vérification en base de données

Pour vérifier que l'OTP a bien été stocké :

```sql
-- Se connecter à PostgreSQL
psql -U postgres -d sokhra_db

-- Voir les OTP actifs
SELECT phone, expires_at, attempts, created_at 
FROM otp_codes 
WHERE expires_at > NOW()
ORDER BY created_at DESC;

-- Voir tous les OTP (y compris expirés)
SELECT * FROM otp_codes ORDER BY created_at DESC;
```

---

## Formats de téléphone acceptés

L'endpoint accepte et normalise automatiquement ces formats :

- ✅ `+212612345678` (format international complet)
- ✅ `+212712345678` (format international complet)
- ✅ `0612345678` (format local, sera converti en +212612345678)
- ✅ `0712345678` (format local, sera converti en +212712345678)
- ✅ `212612345678` (sans +, sera converti en +212612345678)

❌ Formats rejetés :
- `1234567890` (pas de préfixe pays)
- `+33123456789` (pas marocain)
- `+21212345678` (ne commence pas par 6 ou 7)
