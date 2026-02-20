# Tester « Livreur trouvé » (statut accepted) — S06-FS-T02

Ce guide explique comment simuler le passage du statut d’une course à **accepted** en base pour vérifier que la page vendeur affiche « Livreur trouvé » et arrête le polling.

## 1. Prérequis

- Backend et frontend lancés.
- Tu es connecté en **vendeur** et tu as créé une course (tu es sur `/seller/trip/:id` avec statut « En attente »).

## 2. Récupérer l’ID de la course

- **Option A** : Dans le navigateur, l’URL est du type `http://localhost:5173/seller/trip/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. La partie après `/seller/trip/` est l’**id** du trip.
- **Option B** : En base, lister les derniers trips :
  ```sql
  SELECT id, status, from_location, created_at FROM trips ORDER BY created_at DESC LIMIT 5;
  ```

## 3. Mettre le statut à `accepted` en base

Depuis le dossier **sokhra-backend**, connecte-toi à PostgreSQL avec les mêmes paramètres que l’app (voir `.env` ou valeurs par défaut).

**Avec `psql` :**

```bash
# Variables (ajuster si ton .env est différent)
export PGHOST=${DB_HOST:-localhost}
export PGPORT=${DB_PORT:-5432}
export PGDATABASE=${DB_NAME:-sokhra_db}
export PGUSER=${DB_USER:-sokhra_user}
export PGPASSWORD=${DB_PASSWORD:-votre_mot_de_passe}

psql -c "UPDATE trips SET status = 'accepted' WHERE id = 'COLLE_L_ID_ICI';"
```

**Ou en une ligne** (remplacer `COLLE_L_ID_ICI` par l’UUID réel) :

```bash
psql -h localhost -p 5432 -U sokhra_user -d sokhra_db -c "UPDATE trips SET status = 'accepted' WHERE id = 'COLLE_L_ID_ICI';"
```

**Exemple :**

```bash
psql -h localhost -p 5432 -U sokhra_user -d sokhra_db -c "UPDATE trips SET status = 'accepted' WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';"
```

Si tu utilises un outil (DBeaver, pgAdmin, etc.), exécute simplement :

```sql
UPDATE trips SET status = 'accepted' WHERE id = 'COLLE_L_ID_ICI';
```

## 4. Vérifier le résultat

1. **Page toujours ouverte sur `/seller/trip/:id`**  
   - Dans les **2 secondes** (prochain poll), la page doit :
     - Afficher le message **« Livreur trouvé »** (encadré vert).
     - Mettre à jour le badge de statut (ex. « Accepté »).
   - Dans l’onglet **Réseau** (F12 → Network) : après ce dernier GET réussi, il ne doit plus y avoir de nouvelles requêtes **GET** vers `/api/v1/seller/trips/:id` (polling arrêté).

2. **Rafraîchir la page**  
   - La page doit charger directement avec « Livreur trouvé » / statut accepté, sans repoll.

## 5. Dépannage

- **Rien ne change** : vérifier que l’`id` dans l’`UPDATE` est bien celui de la course affichée (copier-coller depuis l’URL).
- **Erreur de connexion à la base** : vérifier `DB_*` dans `.env` et que PostgreSQL tourne (`npm run db:check` dans le backend si disponible).
- **Polling ne s’arrête pas** : vérifier que la réponse du GET contient bien `status: "accepted"` (onglet Réseau → clic sur la requête → Response).
