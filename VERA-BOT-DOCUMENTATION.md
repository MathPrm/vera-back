# Documentation Technique - Vera Bot

## Vue d'ensemble
Le bot Vera est un système d'IA conversationnel conçu pour vérifier la véracité des informations, détecter la désinformation et analyser les médias (vidéos, images, URLs). Il utilise l'API Vera.ai pour effectuer des fact-checking avancés.

---

## Architecture du Bot

### Fichiers principaux
- **`app/services/vera.service.js`** - Service principal du bot Vera
- **`server.ts`** - Point d'entrée avec route `/api/chat`
- **`app/services/embedding.service.js`** - Gestion des embeddings (RAG désactivé - quota Gemini épuisé)
- **`app/services/vector-store.service.js`** - Stockage vectoriel Supabase (RAG désactivé - quota Gemini épuisé)

---

## Service Vera (`vera.service.js`)

### Classe `VeraService`

#### Constructeur
```javascript
constructor() {
  this.apiKey = process.env.VERA_API_KEY;
  this.apiEndpoint = process.env.VERA_API_URL;
  this.client = axios.create({
    baseURL: this.apiEndpoint,
    headers: { 'X-API-Key': this.apiKey },
    timeout: 30000
  });
}
```

Initialise le client HTTP Axios avec l'API key et l'endpoint Vera.ai.

---

### Méthodes principales

#### 1. `checkContent(message, conversationId, conversationHistory, mediaUrls, imageFile, videoFile)`

**Fonction centrale** du bot qui traite toutes les requêtes utilisateur.

**Paramètres :**
- `message` (string) - Message de l'utilisateur
- `conversationId` (string|null) - ID de conversation (optionnel)
- `conversationHistory` (array) - Historique des messages précédents
- `mediaUrls` (array) - URLs de médias à analyser
- `imageFile` (object) - Fichier image uploadé (Multer)
- `videoFile` (object) - Fichier vidéo uploadé (Multer)

**Retour :**
```javascript
{
  status: 'verified' | 'false' | 'mixed' | 'unverified',
  summary: 'Texte de la réponse Vera',
  sources: [{title, url, outlet}, ...],
  confidence: 0-1
}
```

**Workflow :**

1. **Vérification API Key**
   ```javascript
   if (!this.apiKey || this.apiKey === 'your_vera_api_key_here') {
     throw new Error('VERA_API_KEY non configurée');
   }
   ```

2. **RAG - Recherche de mémoire** (❌ désactivé - quota API épuisé)
   - Génère un embedding du message utilisateur
   - Recherche les conversations similaires dans Supabase
   - Construit un contexte RAG si pertinent

3. **Extraction des médias**
   - Parcourt les `mediaUrls` fournis
   - Appelle `extractFromUrl()` pour chaque URL
   - Détecte le type de plateforme (TikTok, YouTube, Instagram)

4. **Analyse vidéo de plateforme**
   Si une vidéo TikTok/YouTube/Instagram est détectée :
   ```javascript
   const contextQuery = `Analyse ce contenu ${platform}:
   TITRE: ${videoData.title}
   DESCRIPTION: ${videoData.description}
   AUTEUR: @${videoData.author}
   ...`;
   ```
   - Crée un payload détaillé avec métadonnées
   - Envoie à l'API Vera via `/chat`

5. **Chat simple**
   Si pas de vidéo de plateforme :
   - Construit un contexte avec l'historique (3 derniers messages)
   - Ajoute les URLs avec format détaillé (📹 VIDÉO, 🖼️ IMAGE, 🔗 LIEN)
   - Envoie instructions pour utiliser les outils Vera :
     - Video Deepfake Detection
     - Synthetic Image Detection
     - Image Forgery and Localization
     - Synthetic Speech Detection
     - TruFor (analyse forensique)
     - Web Search

6. **Parsing de la réponse**
   - Appelle `parseVeraResponse()` pour extraire status/sources

7. **RAG - Stockage** (❌ désactivé - quota API épuisé)
   - Génère embedding de la conversation
   - Stocke dans Supabase pour mémoire future

---

#### 2. `parseVeraResponse(data)`

Parse la réponse brute de l'API Vera et extrait les informations structurées.

**Algorithme :**

1. **Extraction du texte**
   ```javascript
   let response = typeof data === 'string' ? data : 
                  data.response || data.answer || data.message;
   ```

2. **Détection du statut** (via regex)
   - `false` : faux|incorrect|désinformation|fake|réfuté
   - `mixed` : partiellement|mitigé|nuancé
   - `unverified` : non vérifié|impossible de vérifier
   - `verified` : par défaut

3. **Extraction des sources**
   - Pattern : `Selon X, ... (URL)`
   - Fallback : extraction de toutes les URLs trouvées
   - Limite : 5 sources maximum

4. **Calcul de confiance**
   ```javascript
   calculateConfidence(response, sourcesCount) {
     let confidence = 0.5;
     if (/confirmé|vérifié|fiable/.test(response)) confidence += 0.3;
     if (sourcesCount >= 2) confidence += 0.1;
     return Math.min(confidence, 1);
   }
   ```

**Retour :**
```javascript
{
  status: string,
  summary: string,
  sources: Array<{title, url, outlet}>,
  confidence: number,
  conversationId: string
}
```

---

#### 3. `extractFromUrl(url)`

Détecte et extrait les données d'une URL (TikTok, YouTube, Instagram).

**Détection de plateforme :**
```javascript
if (url.includes('tiktok.com')) return this.tiktokService.extract(url);
if (url.includes('youtu')) return this.youtubeService.extract(url);
if (url.includes('instagram.com')) return this.instagramService.extract(url);
```

**Retour :**
```javascript
{
  platform: 'tiktok' | 'youtube' | 'instagram' | 'unknown',
  data: {
    video_id, title, description, author,
    views, likes, comments, hashtags, url, thumbnail
  }
}
```

---

#### 4. `checkVideo(contentData, platform)`

Analyse approfondie d'une vidéo de plateforme.

**Étapes :**
1. Valide l'API key
2. Normalise le nom de plateforme
3. Construit un payload avec toutes les métadonnées
4. Envoie à `/chat` avec timeout de 120s
5. Parse et retourne le résultat structuré

---

## Intégration Backend (`server.ts`)

### Route `/api/chat`

**Endpoint :** `POST /api/chat`

**Headers acceptés :**
- `Content-Type: application/json` (chat simple)
- `Content-Type: multipart/form-data` (avec fichiers)

**Body (JSON) :**
```json
{
  "message": "Vérifie cette info",
  "conversationHistory": [
    {"sender": "user", "content": "..."},
    {"sender": "vera", "content": "..."}
  ],
  "mediaUrls": ["https://..."]
}
```

**Body (FormData) :**
```
message: "..."
conversationHistory: "[...]" (JSON stringifié)
mediaUrls: "[...]" (JSON stringifié)
image: File (optionnel)
video: File (optionnel)
```

**Réponse :**
```json
{
  "response": "Texte de réponse Vera",
  "result": {
    "status": "verified",
    "summary": "Résumé de l'analyse",
    "sources": [{"title": "...", "url": "..."}],
    "confidence": 0.85
  }
}
```

**Gestion des fichiers :**
- Multer upload vers `uploads/`
- Nettoyage automatique après traitement
- Types supportés : images (jpg, png, webp), vidéos (mp4, mov, avi)

---

## Configuration Environnement

### Variables requises (`.env`)

```env
# API Vera
VERA_API_KEY=your-api-key
VERA_API_URL=https://feat-api-partner---api-ksrn3vjgma-od.a.run.app/api/v1

# APIs externes
RAPIDAPI_KEY=...
YOUTUBE_API_KEY=...
GEMINI_API_KEY=...

# RAG désactivé (quota Gemini épuisé)
# Pour réactiver: activer facturation Google Cloud ou utiliser OpenAI
EMBEDDING_PROVIDER=GEMINI
SUPABASE_URL=...
SUPABASE_KEY=...
# Alternative: OPENAI_API_KEY=... + EMBEDDING_PROVIDER=OPENAI
```

---

## RAG (Retrieval-Augmented Generation)

### État actuel : **❌ DÉSACTIVÉ**

**Raison :** Quota API Gemini Embeddings épuisé

**Limites API Gemini gratuite :**
- 1500 requêtes/jour (free tier)
- 100 requêtes/minute
- Quotas se réinitialisent après 24h

**Solutions pour réactiver :**
1. **Activer facturation Google Cloud** pour augmenter les quotas
2. **Attendre 24h** pour réinitialisation automatique des quotas
3. **Utiliser OpenAI** : Configurer `OPENAI_API_KEY` et `EMBEDDING_PROVIDER=OPENAI`

**Fallback actuel :** Le système fonctionne normalement sans RAG (pas de mémoire sémantique)

### Fonctionnement (quand activé)

1. **Embedding Service**
   - Providers : OpenAI (1536D) ou Gemini (768D)
   - Génère des vecteurs d'embedding pour chaque conversation
   - `generateEmbedding(text)` → `number[]`

2. **Vector Store Service**
   - Stocke dans Supabase avec pgvector
   - `storeConversation()` → enregistre user_query + vera_response
   - `searchSimilarConversations()` → recherche par similarité cosinus

3. **Intégration**
   - Avant chaque requête : recherche conversations similaires
   - Ajoute contexte RAG au prompt
   - Après réponse : stocke nouvelle conversation

### Réactivation

Décommenter les blocs dans `vera.service.js` :
- Lignes ~375-405 (recherche)
- Lignes ~605-635 (stockage)

---

## Gestion des erreurs

### Erreurs API Vera
```javascript
catch (error) {
  return {
    error: true,
    message: error.message,
    summary: 'Impossible de vérifier cette information pour le moment.'
  };
}
```

### Erreurs réseau
- Timeout : 30s (chat simple), 120s (analyse vidéo)
- Retry : Non implémenté (à ajouter si besoin)

### Erreurs fichiers
- Upload invalide → message d'erreur
- Fichiers locaux → demande URL publique

---

## Plateformes supportées

### TikTok (`tiktok.service.js`)
- Extraction via RapidAPI
- Métadonnées : likes, comments, shares, music

### YouTube (`youtube.service.js`)
- Extraction via YouTube Data API v3
- Métadonnées : views, likes, channel, published date

### Instagram (`instagram.service.js`)
- Extraction via RapidAPI
- Métadonnées : likes, comments, type (photo/video/carousel)

---

## Performances

- **Temps de réponse moyen :** 3-10s
- **Timeout vidéo :** 120s
- **Limite fichiers :** Non définie (configurable dans Multer)
- **Concurrent requests :** Illimité (géré par Express)

---

## Sécurité

1. **API Key** - Stockée dans .env, jamais exposée au client
2. **CORS** - Configuré pour origines autorisées
3. **Validation** - Type checking des inputs
4. **Rate limiting** - Non implémenté (recommandé pour production)
5. **Sanitization** - Basique (à améliorer)

---

## Déploiement (Render)

### Build
```bash
npm run build  # Compile TypeScript → dist/
```

### Start
```bash
npm start  # Lance dist/server.js
```

### Variables d'environnement
Configurer dans Render Dashboard :
- `VERA_API_KEY`
- `VERA_API_URL`
- `NODE_ENV=production`
- `CLIENT_URL` (URL Vercel du frontend)

---

## Améliorations futures

1. **Rate limiting** - Protéger contre abus
2. **Caching** - Redis pour réponses fréquentes
3. **Monitoring** - Logs structurés (Winston/Pino)
4. **Retry logic** - En cas d'échec API
5. **Webhooks** - Notifications asynchrones
6. **Streaming** - Réponses en temps réel (SSE)
7. **Multilingue** - Support autres langues
8. **Analytics** - Tracking usage/erreurs
