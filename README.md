# TikTok Fact-Checker Bot 🤖🔍

Bot Telegram de fact-checking automatique pour vidéos TikTok avec intégration Vera AI.

## 📋 Fonctionnalités

- ✅ **Vérification à la demande** : Commande `/check [url]` pour vérifier une vidéo TikTok
- 📊 **Monitoring automatique** : Surveillance continue de comptes TikTok
- 🔍 **Fact-checking Vera AI** : Analyse automatique de désinformation
- 💾 **Base de données** : Historique des vérifications
- 📈 **Statistiques** : Métriques et rapports

## 🚀 Installation

### Prérequis

- Node.js 18+
- Compte Telegram Bot (via @BotFather)
- Clé API RapidAPI (TikTok video no watermark2)
- Clé API Vera AI

### 1. Installer les dépendances

```bash
cd tiktok-factchecker-bot
npm install
```

### 2. Configuration

Créer un fichier `.env` :

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# RapidAPI TikTok
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=tiktok-video-no-watermark2.p.rapidapi.com

# Vera AI
VERA_API_KEY=your_vera_api_key
VERA_API_URL=https://api.vera.ai/v1

# Base de données
DATABASE_PATH=./data/factchecker.db

# Monitoring (optionnel)
MONITORING_INTERVAL=300000
```

### 3. Initialiser la base de données

```bash
npm run init-db
```

### 4. Démarrer le bot

```bash
npm start
```

En mode développement :

```bash
npm run dev
```

## 📱 Commandes Telegram

- `/start` - Démarrer le bot
- `/help` - Aide et liste des commandes
- `/check [url]` - Vérifier une vidéo TikTok
- `/monitor [username]` - Surveiller un compte TikTok
- `/stop [username]` - Arrêter la surveillance
- `/list` - Liste des comptes surveillés
- `/stats` - Statistiques des vérifications

## 🏗️ Architecture

```
tiktok-factchecker-bot/
├── src/
│   ├── bot.js                    # Point d'entrée du bot Telegram
│   ├── services/
│   │   ├── tiktok.service.js     # Extraction TikTok
│   │   ├── vera.service.js       # Intégration Vera AI
│   │   └── monitor.service.js    # Système de monitoring
│   ├── database/
│   │   ├── init.js               # Initialisation DB
│   │   └── queries.js            # Requêtes SQL
│   ├── handlers/
│   │   ├── commands.js           # Handlers des commandes
│   │   └── callbacks.js          # Handlers des boutons
│   └── utils/
│       ├── logger.js             # Logs
│       └── validators.js         # Validations
├── data/                         # Base de données SQLite
├── .env                          # Configuration
└── package.json
```

## 🔗 Intégration dans une autre app

Ce bot est modulaire et peut être intégré facilement :

### En tant que service Node.js

```javascript
import { TikTokService } from './services/tiktok.service.js';
import { VeraService } from './services/vera.service.js';

const tiktokService = new TikTokService();
const veraService = new VeraService();

// Extraire et vérifier une vidéo
const video = await tiktokService.extractVideo(url);
const factCheck = await veraService.verifyContent(video);
```

### Via API REST (à créer)

```javascript
// POST /api/fact-check
{
  "url": "https://www.tiktok.com/@user/video/123"
}

// Response
{
  "video": { ... },
  "verification": {
    "status": "verified",
    "score": 0.85,
    "flags": ["misleading"],
    "sources": [...]
  }
}
```

## 📊 Base de données

### Tables

- `videos` - Vidéos extraites
- `verifications` - Résultats fact-checking
- `monitored_accounts` - Comptes surveillés
- `monitoring_logs` - Historique monitoring

## 🔐 Sécurité

- Clés API stockées dans `.env` (jamais commitées)
- Rate limiting sur les requêtes
- Validation des entrées utilisateur
- Logs d'audit

## 📝 TODO

- [ ] Ajouter support Signal
- [ ] Dashboard web de visualisation
- [ ] Export des rapports (PDF, JSON)
- [ ] Notifications webhook
- [ ] Multi-langue

## 🤝 Contribution

Ce projet est développé pour un système de fact-checking académique.

## 📄 Licence

MIT
# DC-Extract-Bot
