# Livrables détaillés et validation par ticket

Ce document décrit **en détail** ce qui a été fait, fichier par fichier, et comment le valider avec les tickets.

---

## 1. Ticket S05-BE-Correction (Auth role-first, /me, guards)

### 1.1 Retrait du debug auth (sécurité)

| Fichier | Modification |
|---------|--------------|
| `src/services/smsService.ts` | **Suppression** du bloc `console.log` qui affichait en clair le code OTP, le numéro et le message SMS. Le mock n’effectue plus qu’un délai de 100 ms, sans afficher le code. |

**Validation :** Lancer une demande OTP : le code ne doit plus apparaître dans la console du serveur.

---

### 1.2 Plan de test Postman (Auth)

| Fichier | Contenu |
|---------|---------|
| `docs/POSTMAN_TEST_PLAN_AUTH.md` | Plan de test pour : **POST /auth/request-otp** (phone + role), **POST /auth/verify-otp** (phone + code), **GET /auth/me**, **POST /auth/refresh**, **POST /auth/logout**, et test du role guard. Pour chaque route : URL, method, headers, body, réponses attendues (200/400/401/403), ordre recommandé et variables Postman. |

**Validation :** Suivre le plan dans Postman et cocher les cas (request-otp avec/sans role, verify-otp, /me avec token, refresh, logout).

---

### 1.3 Environnement Postman

| Fichier | Contenu |
|---------|---------|
| `docs/postman/Sokhra-Local.postman_environment.json` | Environnement importable avec : `baseUrl` = `http://localhost:3000/api/v1`, `accessToken`, `refreshToken`, `phone`, `otpCode`, `userId`, `tripId`. |

**Validation :** Importer l’environnement dans Postman, sélectionner « Sokhra Local », vérifier que `{{baseUrl}}` est bien utilisée dans les requêtes.

---

### 1.4 Collection Postman (toutes les URLs)

| Fichier | Contenu |
|---------|---------|
| `docs/postman/Sokhra-API.postman_collection.json` | Collection avec **toutes** les routes du backend : **Health** (GET /health), **Auth** (request-otp, verify-otp avec script qui enregistre accessToken/refreshToken/userId, refresh, me, logout), **Users** (GET /users/me), **Trips** (POST /trips avec script qui enregistre tripId, GET /trips, GET /trips/:id, POST /trips/:id/cancel), **Couriers** (GET /couriers/:id/account, POST /couriers/:id/settle). Toutes les URLs utilisent `{{baseUrl}}`. |

**Validation :** Importer la collection, exécuter les requêtes dans l’ordre (auth puis routes protégées) et vérifier que les scripts enregistrent bien les tokens et `tripId`.

---

### 1.5 Montage des routes Couriers

| Fichier | Modification |
|---------|--------------|
| `src/routes/index.ts` | **Ajout** de l’import `courierRoutes` depuis `../domains/courier/routes` et de la ligne `router.use('/couriers', courierRoutes)`. Les routes **GET /api/v1/couriers/:id/account** et **POST /api/v1/couriers/:id/settle** sont ainsi exposées. |

**Validation :** Appeler GET `/api/v1/couriers/<userId>/account` avec un token valide → 200 (ou 404 si pas de compte). POST settle avec un utilisateur dans `ADMIN_USER_IDS` → 200.

---

## 2. Domaine « course » manquant (erreur au démarrage)

Le contrôleur courier importait `../../course/services/courierAccountService` et `../../course/constants/errorMessages`, mais le dossier **`src/domains/course`** n’existait pas. Les fichiers suivants ont été **créés** pour corriger l’erreur « Cannot find module '../../course/services/courierAccountService' ».

### 2.1 Types

| Fichier | Contenu |
|---------|---------|
| `src/domains/course/types.ts` | Interface **CourierAccount** : `courier_id`, `total_jobs`, `commission_due`, `last_settlement_at`, `is_blocked`, `created_at`, `updated_at`. |

### 2.2 Constantes d’erreur

| Fichier | Contenu |
|---------|---------|
| `src/domains/course/constants/errorMessages.ts` | **CourseErrorMessages.ACCOUNT.NOT_FOUND** = "Compte livreur introuvable". |

### 2.3 Modèle (accès BDD)

| Fichier | Contenu |
|---------|---------|
| `src/domains/course/models/courierAccountModel.ts` | • **findCourierAccountById(courierId)** : SELECT sur `courier_account`. • **findOrCreateCourierAccount(courierId)** : INSERT si absent (total_jobs=0, commission_due=0). • **settleCourierAccount(courierId)** : UPDATE commission_due=0, last_settlement_at=NOW(). • **insertCommissionLog(courierId, amountPaid, adminId)** : INSERT dans `commission_logs`. |

### 2.4 Service

| Fichier | Contenu |
|---------|---------|
| `src/domains/course/services/courierAccountService.ts` | • **getCourierAccount(courierId)** : utilise findOrCreateCourierAccount (retourne toujours un compte). • **settleCommission(courierId, adminId)** : récupère le compte, enregistre le montant à régler, appelle settleCourierAccount puis insertCommissionLog. Export **courierAccountService** (getCourierAccount, settleCommission). |

**Lien ticket :** Ces éléments permettent le bon fonctionnement des routes **courier** (compte + règlement) et de la **traçabilité des règlements** (commission_logs), en cohérence avec les tickets sur le settle (ex. T06) et la table `commission_logs` (migration 012).

**Validation :**  
- `npm run dev` démarre sans erreur de module.  
- GET `/api/v1/couriers/<userId>/account` retourne un compte (création automatique si besoin).  
- POST `/api/v1/couriers/<userId>/settle` (avec token admin) met à jour le compte et insère une ligne dans `commission_logs`.

---

## 3. Récapitulatif par ticket

| Ticket / thème | Livrables | Comment valider |
|----------------|-----------|------------------|
| **S05-BE-Correction** | smsService sans log OTP ; plan de test Postman Auth ; env + collection Postman ; routes /couriers montées | Pas de code OTP en console ; tests Postman du flux request-otp → verify-otp → /me, refresh, logout ; appels /couriers réussis. |
| **T06 (settle + log)** | Domaine course : model (settle + insertCommissionLog), service (settleCommission) | Settle remet commission à 0 et crée une entrée dans `commission_logs` (montant, admin_id, date). |
| **Postman / doc** | POSTMAN_TEST_PLAN_AUTH.md, Sokhra-Local env, Sokhra-API collection | Toutes les URLs documentées et testables ; env + collection importables. |

---

## 4. Fichiers modifiés ou créés (liste)

**Modifiés :**  
- `src/services/smsService.ts` (retrait debug)  
- `src/routes/index.ts` (montage /couriers)

**Créés :**  
- `docs/POSTMAN_TEST_PLAN_AUTH.md`  
- `docs/postman/Sokhra-Local.postman_environment.json`  
- `docs/postman/Sokhra-API.postman_collection.json`  
- `src/domains/course/types.ts`  
- `src/domains/course/constants/errorMessages.ts`  
- `src/domains/course/models/courierAccountModel.ts`  
- `src/domains/course/services/courierAccountService.ts`  
- `docs/LIVRABLES_VALIDATION_TICKETS.md` (ce document)

Tu peux t’en servir pour valider point par point avec les tickets (S05-BE-Correction, T06, et tout ce qui concerne Postman / courier).
