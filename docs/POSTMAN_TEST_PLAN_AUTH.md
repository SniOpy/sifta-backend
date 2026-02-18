# Plan de test Postman – Auth (S05-BE-Correction)

Base URL : `http://localhost:3000/api/v1` (ou `{{baseUrl}}` en variable Postman).

---

## 1. POST /auth/request-otp

**Objectif** : Demander un code OTP en choisissant le rôle (seller ou courier). Le code est envoyé par le mock SMS (en dev il n’est plus affiché en console ; pour tester, utiliser un outil type DB ou un endpoint dev si vous en ajoutez un).

| Champ | Valeur |
|-------|--------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/request-otp` |
| Headers | `Content-Type: application/json` |
| Body (raw JSON) | `{"phone": "+33612345678", "role": "seller"}` |

**Variantes à tester :**
- `"role": "courier"` → même flux, rôle différent.
- Sans `role` ou `role` invalide → **400** avec message de validation.
- Téléphone invalide → **400**.

**Réponse attendue (200)** :  
`{"data": {"message": "Code OTP envoyé avec succès"}, "message": "..."}`

---

## 2. POST /auth/verify-otp

**Objectif** : Vérifier le code OTP et obtenir les tokens + user (id, phone, role, onboarding_completed). Le rôle vient de la session (request-otp), pas du body.

| Champ | Valeur |
|-------|--------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/verify-otp` |
| Headers | `Content-Type: application/json` |
| Body (raw JSON) | `{"phone": "+33612345678", "code": "123456"}` |

**À faire avant** :  
1. Appeler **request-otp** avec le même `phone` (et le rôle voulu).  
2. Récupérer le code OTP (en dev : soit via un moyen que vous ajoutez, soit en le lisant en base dans `otp_codes` pour ce numéro, ou en laissant un log temporaire côté backend si besoin).

**Réponse attendue (200)** :  
- `data.user` : `{ "id", "phone", "role", "onboarding_completed" }` (role = celui envoyé à request-otp).  
- `data.tokens` : `{ "accessToken", "refreshToken" }`.

**Cas d’erreur :**
- Code faux → **400** (ex. "Le code OTP est incorrect").
- Aucun OTP actif pour ce téléphone → **404**.
- Trop de tentatives → **429**.

**Postman** : dans un **Test** script, enregistrer le token pour les requêtes suivantes, par exemple :
```js
if (pm.response.code === 200) {
  const json = pm.response.json();
  if (json.data && json.data.tokens && json.data.tokens.accessToken) {
    pm.environment.set("accessToken", json.data.tokens.accessToken);
    pm.environment.set("refreshToken", json.data.tokens.refreshToken);
  }
}
```

---

## 3. GET /auth/me (protégé)

**Objectif** : Récupérer le profil de l’utilisateur connecté (id, phone, role, onboarding_completed) pour la redirection front.

| Champ | Valeur |
|-------|--------|
| Method | `GET` |
| URL | `{{baseUrl}}/auth/me` |
| Headers | `Authorization: Bearer {{accessToken}}` |

**Réponse attendue (200)** :  
`data.user` = `{ "id", "phone", "role", "onboarding_completed" }` (aligné avec verify-otp).

**Sans token ou token invalide** → **401**.

---

## 4. POST /auth/refresh

**Objectif** : Obtenir une nouvelle paire de tokens à partir du refresh token.

| Champ | Valeur |
|-------|--------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/refresh` |
| Headers | `Content-Type: application/json` |
| Body (raw JSON) | `{"refreshToken": "{{refreshToken}}"}` |

**Réponse attendue (200)** :  
`data` contient `accessToken` et `refreshToken`. Mettre à jour `accessToken` (et éventuellement `refreshToken`) en variable pour les prochains appels.

---

## 5. POST /auth/logout (protégé)

**Objectif** : Révoquer les refresh tokens de l’utilisateur.

| Champ | Valeur |
|-------|--------|
| Method | `POST` |
| URL | `{{baseUrl}}/auth/logout` |
| Headers | `Authorization: Bearer {{accessToken}}` |

**Réponse attendue (200)** : body vide ou message de succès. Ensuite, refresh ne doit plus fonctionner avec l’ancien refresh token.

---

## 6. Test du role guard (si une route protégée par rôle existe)

Exemple si vous avez une route **seller** :  
`GET {{baseUrl}}/.../seller-only` avec `Authorization: Bearer {{accessToken}}`.

- Avec un user **seller** : **200** (ou réponse métier attendue).  
- Avec le même token mais pour une route **courier-only** (ou l’inverse) : **403** (ex. "Accès réservé aux livreurs").

Pour tester :  
1. Se connecter en **seller** (request-otp + verify-otp avec role seller), noter le token.  
2. Appeler une route **courier-only** avec ce token → **403**.  
3. Se connecter en **courier**, appeler la même route → **200** (si implémentée).

---

## Ordre recommandé dans Postman

1. **request-otp** (seller)  
2. **verify-otp** (avec le code obtenu autrement en dev) → sauvegarder `accessToken` et `refreshToken`.  
3. **GET /auth/me** → vérifier `role`, `onboarding_completed`.  
4. **logout** (optionnel).  
5. Répéter 1–3 avec `role: "courier"`.  
6. **refresh** après une connexion, puis **GET /auth/me** avec le nouveau token.

---

## Variables d’environnement Postman suggérées

- `baseUrl` = `http://localhost:3000/api/v1`  
- `accessToken` = (rempli par le script après verify-otp)  
- `refreshToken` = (rempli par le script après verify-otp)
