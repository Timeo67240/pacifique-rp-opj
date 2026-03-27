# Pacifique RP — Application OPJ Gendarmerie

Application web de gestion pour les Officiers de Police Judiciaire (OPJ) du serveur Roblox **Pacifique RP**.

## Fonctionnalités

- **Authentification** : comptes sécurisés (Admin / OPJ) avec JWT
- **Fiches Civils** : recherche avancée, profil complet, antécédents
- **Amendes** : création, suivi, changement de statut (payée/contestée/annulée)
- **Gardes à Vue (GAV)** : ouverture/clôture avec durée calculée, notes
- **Procès-Verbaux (PV)** : rédaction structurée, export PDF officiel
- **Dashboard** : statistiques temps réel, dernières interventions
- **Administration** : gestion des comptes, grades, matricules

## Démarrage rapide

### 1. Backend

```bash
cd backend
npm install
# Copier .env.example en .env et personnaliser
npm start
# L'API tourne sur http://localhost:3001
```

**Compte admin par défaut :** `admin` / `Admin1234!`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# L'app tourne sur http://localhost:5173
```

## Déploiement gratuit (production)

### Backend → Render.com

1. Créer un compte sur [render.com](https://render.com)
2. New → Web Service → connecter ton repo GitHub
3. Répertoire : `backend/`
4. Build command : `npm install`
5. Start command : `node server.js`
6. Variables d'environnement :
   - `JWT_SECRET` = une clé secrète longue et aléatoire
   - `FRONTEND_URL` = l'URL de ton frontend Vercel

### Frontend → Vercel

1. Créer un compte sur [vercel.com](https://vercel.com)
2. Importer le repo, répertoire : `frontend/`
3. Variable d'environnement :
   - `VITE_API_URL` = l'URL de ton backend Render + `/api`
4. Déployer

## Structure

```
pacifique-rp-opj/
├── backend/
│   ├── server.js          ← Point d'entrée Express
│   ├── db.js              ← SQLite + schema + seed admin
│   ├── middleware/
│   │   └── auth.js        ← JWT middleware
│   └── routes/
│       ├── auth.js        ← Login, gestion utilisateurs
│       ├── civilians.js   ← CRUD fiches civils
│       ├── fines.js       ← CRUD amendes
│       ├── custody.js     ← CRUD gardes à vue
│       ├── pv.js          ← CRUD procès-verbaux
│       └── dashboard.js   ← Stats et activité
└── frontend/
    └── src/
        ├── pages/         ← Dashboard, Civils, Amendes, GAV, PV, Admin
        ├── components/    ← Layout, Modal, StatCard, PageHeader
        ├── contexts/      ← AuthContext (JWT)
        └── api/           ← axios client avec intercepteurs
```

## Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- Tokens JWT avec expiration 8h
- Routes admin protégées par middleware de rôle
- CORS configuré pour le domaine frontend uniquement
