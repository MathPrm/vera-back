# Vera Backend API

API backend pour Vera, une application de fact-checking utilisant l'IA pour vérifier l'authenticité des informations.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Structure du projet](#structure-du-projet)
- [Commandes disponibles](#commandes-disponibles)
- [API Endpoints](#api-endpoints)
- [Authentification](#authentification)
- [Base de données](#base-de-données)
- [Déploiement](#déploiement)

## 🔧 Prérequis

- **Node.js** : version 18 ou supérieure
- **PostgreSQL** : version 12 ou supérieure
- **npm** ou **yarn**
- **Supabase** : compte et projet configuré (pour le RAG/vecteur store)

## 📦 Installation

1. **Cloner le repository** (si nécessaire)
```bash
cd vera-back
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Puis éditer le fichier .env avec vos configurations
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

### Base de données PostgreSQL
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=vera_db
DB_DIALECT=postgres
DB_PORT=5432
DB_POOL_MAX=5
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
```

### Authentification JWT
```env
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
```

### Supabase (pour le RAG)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Google Generative AI (Gemini)
```env
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### CORS & Client
```env
CLIENT_URL=http://localhost:4200
PORT=3000
NODE_ENV=development
```

### Socket.IO (optionnel)
```env
SOCKET_URL=http://localhost:3000
```

## 📁 Structure du projet

```
vera-back/
├── app/
│   ├── config/          # Configuration de la base de données
│   ├── controllers/     # Contrôleurs pour les routes
│   ├── models/          # Modèles Sequelize (User, Session, etc.)
│   ├── routes/          # Définition des routes API
│   └── services/        # Services métier (Vera, Vector Store, etc.)
├── database/            # Scripts SQL et schémas
├── docs/                # Documentation supplémentaire
├── middleware/          # Middlewares (auth, admin)
├── scripts/            # Scripts utilitaires
├── uploads/            # Dossier pour les fichiers uploadés
├── server.ts           # Point d'entrée principal
├── package.json        # Dépendances et scripts
└── tsconfig.json       # Configuration TypeScript
```

## 🚀 Commandes disponibles

### Développement
```bash
# Démarrer le serveur en mode développement (avec hot-reload)
npm run dev

# Compiler TypeScript
npm run build

# Démarrer le serveur compilé
npm start
```

### Production
```bash
# Build pour la production
npm run build

# Démarrer en production
npm start
```

## 🔌 API Endpoints

### Authentification (`/api/auth`)

- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion (retourne un cookie HttpOnly)
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Obtenir le profil de l'utilisateur connecté

### Vérification (`/api/verify`)

- `POST /api/verify` - Vérifier une information avec Vera
- `POST /api/verify/image` - Vérifier une image
- `POST /api/verify/video` - Vérifier une vidéo

### Historique (`/api/history`)

- `GET /api/history` - Obtenir l'historique des conversations
- `POST /api/history` - Créer une nouvelle conversation
- `DELETE /api/history/:id` - Supprimer une conversation

### Formulaires (`/api/survey`)

- `GET /api/survey` - Obtenir tous les formulaires
- `POST /api/survey` - Créer un nouveau formulaire
- `GET /api/survey/:id` - Obtenir un formulaire spécifique

### Items (`/api/items`)

- `GET /api/items` - Obtenir tous les items
- `POST /api/items` - Créer un nouvel item

## 🔐 Authentification

L'API utilise **JWT (JSON Web Tokens)** stockés dans des **cookies HttpOnly** pour la sécurité.

### Flux d'authentification

1. **Inscription/Connexion** : L'utilisateur s'inscrit ou se connecte
2. **Cookie HttpOnly** : Le serveur définit un cookie `authToken` avec le JWT
3. **Requêtes authentifiées** : Le cookie est automatiquement envoyé avec chaque requête
4. **Vérification** : Le middleware `verifyToken` vérifie le token et la session en base

### Middleware d'authentification

```typescript
// Routes protégées
router.get('/profile', verifyToken, AuthController.getProfile);
router.post('/logout', verifyToken, AuthController.logout);
```

### Rôle Admin

Les utilisateurs avec `is_admin: true` ont accès aux routes admin. Le middleware `isAdmin` vérifie ce rôle.

## 🗄️ Base de données

### Modèles principaux

- **User** : Utilisateurs de l'application
  - `id`, `email`, `password` (hashé), `username`, `is_admin`
  
- **Session** : Sessions utilisateur actives
  - `id`, `user_id`, `token`, `ip_address`, `user_agent`, `expires_at`, `is_active`

- **UserConversation** : Conversations utilisateur
  - `id`, `user_id`, `conversation_id`, `title`, `created_at`

- **ConversationMessage** : Messages des conversations
  - `id`, `conversation_id`, `sender`, `content`, `timestamp`

### Migration de la base de données

Les modèles Sequelize créent automatiquement les tables au démarrage. Assurez-vous que PostgreSQL est démarré et que les variables d'environnement sont correctement configurées.

## 🌐 WebSocket

Le serveur utilise **Socket.IO** pour les communications en temps réel :

```typescript
// Connexion WebSocket
const socket = io('http://localhost:3000');
```

## 📤 Upload de fichiers

Les fichiers sont uploadés dans le dossier `uploads/` via **Multer** :

- Images : `/api/verify/image`
- Vidéos : `/api/verify/video`
- Fichiers génériques : `/api/verify` (avec champ `file`)

## 🚢 Déploiement

### Variables d'environnement en production

Assurez-vous de configurer toutes les variables d'environnement sur votre plateforme de déploiement (Render, Heroku, etc.).

### Build et démarrage

```bash
npm run build
npm start
```

### CORS en production

Le serveur accepte les requêtes depuis les origines définies dans `CLIENT_URL`. En production, configurez cette variable avec l'URL de votre frontend.

### Cookies en production

Les cookies HttpOnly nécessitent :
- `secure: true` (HTTPS uniquement)
- `sameSite: 'none'` (pour les requêtes cross-origin)

## 📚 Documentation supplémentaire

- `docs/API-HISTORY.md` - Documentation de l'API d'historique
- `docs/RAG-MEMORY.md` - Documentation du système RAG
- `docs/RAG-REACTIVATION.md` - Réactivation du RAG
- `VERA-BOT-DOCUMENTATION.md` - Documentation du bot Vera

## 🛠️ Technologies utilisées

- **Express.js** : Framework web Node.js
- **Sequelize** : ORM pour PostgreSQL
- **Socket.IO** : Communication WebSocket en temps réel
- **JWT** : Authentification par tokens
- **bcryptjs** : Hachage des mots de passe
- **Multer** : Gestion des uploads de fichiers
- **Supabase** : Base de données vectorielle pour le RAG
- **Google Generative AI** : Modèle Gemini pour le fact-checking
- **TypeScript** : Typage statique

## 📝 Notes

- Les mots de passe sont hashés avec **bcryptjs** (10 rounds)
- Les sessions sont stockées en base de données pour un meilleur contrôle
- Le système RAG utilise Supabase pour la recherche vectorielle
- Les cookies HttpOnly sont utilisés pour une sécurité renforcée

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que PostgreSQL est démarré
- Vérifiez les variables d'environnement `DB_*`

### Erreur CORS
- Vérifiez que `CLIENT_URL` correspond à l'URL de votre frontend
- En développement, les origines locales sont acceptées automatiquement

### Cookies non envoyés
- Vérifiez que `withCredentials: true` est configuré côté frontend
- En production, vérifiez `secure` et `sameSite` dans les options des cookies

## 📄 Licence

ISC
