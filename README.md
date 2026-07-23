# Nass-Telecom

Site e-commerce complet pour la vente d'appareils électroniques (**ordinateurs, téléphones, tablettes, écouteurs, accessoires**) avec une interface d'administration protégée par authentification.

Site web dynamique, fluide, animé — chaque module tourne à 360° au survol, les boutons rebondissent avant de déclencher les transitions de page, et les pages entrent en mouvement.

## Fonctionnalités

### Boutique (public)
- Page d'accueil avec **héros animé 3D** (téléphone qui tourne en continu, formes flottantes en orbite)
- **Cartes catégories** avec icônes qui tournent à 360° au survol
- **Produits phares** : chaque image de produit effectue une rotation 3D à 360° au survol
- **Page catalogue** avec filtres par catégorie et barre de recherche instantanée
- **Vue détaillée du produit** en modale avec image en rotation continue
- **Boutons "jump"** qui rebondissent avant de déclencher une transition de page fluide
- Animations d'apparition au scroll (`reveal`), transitions de page en overlay
- Responsive mobile / tablette / desktop

### Administration
- **Connexion sécurisée** (JWT + cookie httpOnly + bcrypt)
- **Vue d'ensemble** : nombre de produits, catégories, stock total, valeur du stock, derniers ajouts
- **Gestion des produits** : créer, modifier, supprimer, **édition rapide du prix** en 1 clic, upload d'image ou URL, produits en vedette, gestion du stock
- **Gestion des catégories** : créer, renommer, supprimer (avec suppression en cascade des produits)
- Notifications toast, modales animées, recherche en direct

## Stack technique

- **Backend** : Node.js + Express
- **Base de données** : SQLite embarquée (via `better-sqlite3`) — aucune installation externe requise
- **Auth** : JSON Web Tokens (JWT) + bcryptjs, cookies httpOnly
- **Upload d'images** : Multer (stockage local dans `uploads/`)
- **Frontend** : HTML / CSS / JavaScript vanilla (aucun bundler), fonts Google (Sora, Inter)
- **Animations** : CSS 3D transforms, keyframes, IntersectionObserver

## Démarrage rapide

```bash
# 1) Installer les dépendances
npm install

# 2) (optionnel) Copier la configuration
cp .env.example .env

# 3) Peupler la base avec un catalogue de démo
npm run seed

# 4) Lancer le serveur
npm start
```

Ouvrez ensuite :

- Boutique : **http://localhost:3000/**
- Administration : **http://localhost:3000/admin**

**Identifiants admin par défaut :** `admin` / `admin123`
(modifiables via `ADMIN_USERNAME` et `ADMIN_PASSWORD` dans `.env`)

## Variables d'environnement

| Variable         | Défaut       | Description                                   |
| ---------------- | ------------ | --------------------------------------------- |
| `PORT`           | `3000`       | Port HTTP                                     |
| `JWT_SECRET`     | (dev)        | Clé de signature JWT (à changer en prod)      |
| `ADMIN_USERNAME` | `admin`      | Nom d'utilisateur admin créé au 1er démarrage |
| `ADMIN_PASSWORD` | `admin123`   | Mot de passe admin (à changer en prod)        |

## API

Tous les endpoints d'écriture requièrent un JWT valide (header `Authorization: Bearer <token>` ou cookie `nt_token`).

### Auth
- `POST /api/auth/login` — `{ username, password }` → `{ token, user }`
- `POST /api/auth/logout`
- `GET  /api/auth/me` — infos utilisateur courant (auth requis)

### Catégories
- `GET    /api/categories` — public, retourne la liste avec `product_count`
- `POST   /api/categories` — admin : `{ name, icon, description }`
- `PUT    /api/categories/:id` — admin
- `DELETE /api/categories/:id` — admin

### Produits
- `GET    /api/products?category=<slug|id>&featured=true&q=<search>&limit=200` — public
- `GET    /api/products/:id` — public
- `POST   /api/products` — admin (multipart : `name, category_id, brand, price, old_price, stock, description, featured, image` ou `image_url`)
- `PUT    /api/products/:id` — admin
- `PATCH  /api/products/:id/price` — admin, **édition rapide de prix** : `{ price, old_price? }`
- `DELETE /api/products/:id` — admin

## Structure du projet

```
.
├── server/
│   ├── index.js          # entrée Express, statique + API
│   ├── db.js             # SQLite (schéma + création admin auto)
│   ├── auth.js           # JWT sign / verify + middleware
│   ├── seed.js           # catalogue de démo (5 cat, 17 produits)
│   └── routes/
│       ├── auth.js
│       ├── categories.js
│       └── products.js
├── public/
│   ├── index.html        # accueil animé
│   ├── catalogue.html    # catalogue + filtres
│   ├── 404.html
│   ├── admin/
│   │   └── index.html    # login + dashboard (SPA légère)
│   ├── css/
│   │   ├── styles.css    # design system + animations
│   │   └── admin.css
│   └── js/
│       ├── app.js        # runtime commun (transitions, jump, reveal)
│       ├── home.js
│       ├── catalogue.js
│       └── admin.js
├── data/                 # (généré) base SQLite
├── uploads/              # (généré) images produits
└── package.json
```

## Notes

- La base SQLite et les images téléversées sont stockées dans `data/` et `uploads/` (ignorés par git).
- Au premier démarrage, un compte administrateur est créé automatiquement à partir des variables d'environnement.
- Pour réinitialiser la base : supprimez `data/nass-telecom.db` puis relancez `npm run seed` (ou redémarrez le serveur : seed auto si la base est vide).
- Les **produits d'exemple** sont un catalogue de démonstration. Au lancement officiel du site, supprimez-les depuis l'administration (ou videz la base).
- En production : changez `JWT_SECRET` et `ADMIN_PASSWORD`, et servez via un reverse proxy HTTPS.
