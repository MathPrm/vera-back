# 🧠 RAG Memory System - Documentation

## Vue d'ensemble

Le système RAG (Retrieval-Augmented Generation) permet à Vera de se souvenir de **toutes** les conversations passées et d'utiliser cette mémoire pour enrichir ses réponses futures.

## 🎯 Fonctionnalités

### 1. **Mémoire Longue Durée**
- Stockage permanent de toutes les conversations dans Supabase (PostgreSQL)
- Chaque conversation est convertie en vecteur d'embedding (768 dimensions via Gemini)
- Index vectoriel `ivfflat` pour recherche ultra-rapide (cosine similarity)

### 2. **Recherche Sémantique**
- Trouve automatiquement les 3 conversations les plus similaires à la question actuelle
- Seuil de similarité : 75% minimum
- Pas de limite par utilisateur → bénéficie de toute la base de connaissances

### 3. **Enrichissement Contextuel**
- Les conversations similaires sont injectées dans le contexte envoyé à Vera
- Vera peut référencer des discussions passées pour donner des réponses plus cohérentes
- Évite de répéter les mêmes analyses

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER QUERY                                  │
│                     "Cette vidéo TikTok est-elle vraie?"        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: GÉNÉRATION EMBEDDING                                  │
│  embedding.service.js → Gemini embedding-001                    │
│  Input: "Cette vidéo TikTok est-elle vraie?"                    │
│  Output: [0.123, -0.456, 0.789, ...] (768 dimensions)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: RECHERCHE VECTORIELLE                                 │
│  vector-store.service.js → Supabase match_conversations()       │
│  Search: cosine similarity > 0.75                               │
│  Limit: 3 conversations                                         │
│  Output:                                                        │
│  [1] 89% similar: "TikTok deepfake détection..."               │
│  [2] 82% similar: "Vidéo manipulée analyse..."                 │
│  [3] 76% similar: "Fact-check TikTok..."                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: CONSTRUCTION CONTEXTE                                 │
│  vera.service.js → checkContent()                               │
│  Context: User question + RAG memory + conversation history     │
│  Payload:                                                       │
│  {                                                              │
│    query: "Nouvelle question: ...\n                            │
│            💾 MÉMOIRE (conversations passées):\n               │
│            [1] 89% similar: Q: ... R: ..."                     │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4: VERA API CALL                                         │
│  Vera AI reçoit le contexte enrichi                             │
│  Analyse avec outils + mémoire                                  │
│  Output: Réponse détaillée + verdict                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5: STOCKAGE                                              │
│  1. Combiner question + réponse                                 │
│  2. Générer embedding de la conversation complète               │
│  3. Stocker dans Supabase (conversations table)                 │
│  4. Index automatique pour futures recherches                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Stack Technique

### Backend (Node.js)
- **@supabase/supabase-js**: Client PostgreSQL + pgvector
- **@google/generative-ai**: Gemini embeddings (gratuit !)
- **embedding.service.js**: Génération d'embeddings 768D
- **vector-store.service.js**: CRUD conversations + recherche vectorielle

### Database (Supabase)
- **PostgreSQL 15+** avec extension **pgvector**
- Table `conversations`:
  - `id` (UUID)
  - `user_id` (TEXT)
  - `user_query` (TEXT)
  - `vera_response` (TEXT)
  - `embedding` (vector(768)) ← Gemini embeddings
  - `metadata` (JSONB)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- Index `ivfflat` pour recherche vectorielle rapide
- Fonction RPC `match_conversations()` pour cosine similarity

### AI Models
- **Google Gemini embedding-001**: 768 dimensions, gratuit
- Alternative testée: OpenAI text-embedding-ada-002 (1536D, payant)

## 🚀 Setup

### 1. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor**
3. Exécuter le script `database/supabase-rag-setup.sql`
4. Vérifier que la table `conversations` est créée avec l'index vectoriel

### 2. Variables d'environnement

Ajouter dans `.env`:

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxxxxxxxxxxx  # anon public key
SUPABASE_SERVICE_KEY=eyJxxxxxxxxxxxx  # service_role (optionnel)

# Google Gemini
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx
```

### 3. Installation

```bash
cd vera-back
npm install @supabase/supabase-js @google/generative-ai
```

### 4. Test

```bash
# Démarrer le serveur
npm run api

# Tester l'endpoint chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Cette vidéo TikTok est-elle vraie?", "mediaUrls": ["https://tiktok.com/@user/video/123"]}'

# Rechercher des conversations similaires
curl -X POST http://localhost:3000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"query": "deepfake", "limit": 5}'

# Récupérer l'historique
curl http://localhost:3000/api/memory/history/user-123
```

## 📡 API Endpoints

### Chat avec RAG
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Question à poser",
  "conversationHistory": [...],  // Optionnel
  "mediaUrls": [...]              // Optionnel
}

Response:
{
  "response": "Réponse enrichie avec mémoire RAG",
  "result": {...}
}
```

### Recherche Sémantique
```http
POST /api/memory/search
Content-Type: application/json

{
  "query": "deepfake TikTok",
  "userId": "user-123",  // Optionnel (filtre)
  "limit": 5,            // Défaut: 5
  "threshold": 0.7       // Défaut: 0.7 (70% similarité)
}

Response:
{
  "success": true,
  "count": 3,
  "conversations": [
    {
      "id": "uuid",
      "user_query": "...",
      "vera_response": "...",
      "similarity": 0.89,
      "created_at": "2025-12-03T..."
    }
  ]
}
```

### Historique Utilisateur
```http
GET /api/memory/history/:userId?limit=50

Response:
{
  "success": true,
  "count": 42,
  "conversations": [...]
}
```

### Conversation Spécifique
```http
GET /api/memory/conversation/:id

Response:
{
  "success": true,
  "conversation": {...}
}
```

### Nettoyage (Admin)
```http
POST /api/memory/cleanup
Content-Type: application/json

{
  "daysOld": 90  // Supprimer conversations > 90 jours
}

Response:
{
  "success": true,
  "deletedCount": 127
}
```

## 🔧 Maintenance

### Optimisation Index
Si la base grandit beaucoup (>100k conversations), reconstruire l'index:

```sql
-- Supabase SQL Editor
REINDEX INDEX idx_conversations_embedding;
```

### Statistiques
```sql
SELECT * FROM get_conversation_stats();
```

Retourne:
- Total conversations
- Utilisateurs uniques
- Date première/dernière conversation
- Longueur moyenne des réponses

### Nettoyage Automatique
Configurer un cron job Supabase (Database > Cron Jobs):

```sql
-- Tous les jours à 3h du matin, supprimer conversations > 90 jours
SELECT cron.schedule(
  'cleanup-old-conversations',
  '0 3 * * *',
  $$ SELECT cleanup_old_conversations(90); $$
);
```

## 💡 Cas d'Usage

### 1. Cohérence Multi-Conversations
**Sans RAG:**
```
User: "Cette vidéo TikTok de @influencer est vraie?"
Vera: "Oui, vérifiée."

[2 jours plus tard]
User: "Et la vidéo de @influencer alors?"
Vera: "Désolé, je ne sais pas de quoi tu parles."
```

**Avec RAG:**
```
User: "Et la vidéo de @influencer alors?"
Vera: "💾 Je me souviens ! Il y a 2 jours, nous avons analysé sa vidéo 
       et elle était vérifiée comme authentique. Tu veux des détails?"
```

### 2. Expertise Cumulative
Chaque analyse enrichit la base de connaissances. Si 100 utilisateurs posent des questions sur les deepfakes, le 101ème bénéficie de toutes les analyses précédentes.

### 3. Détection de Patterns
Vera peut identifier des récurrences:
```
"💡 J'ai remarqué 12 conversations similaires sur ce type de deepfake.
    La technique utilisée est connue et analysée en détail ici: ..."
```

## 🎨 Intégration Frontend (TODO)

À implémenter dans `vera-front`:

1. **Badge Mémoire**: Afficher "🧠 3 conversations similaires trouvées"
2. **Expandable Panel**: Cliquer pour voir les snippets des conversations passées
3. **Timeline**: Vue chronologique de l'historique utilisateur
4. **Search Bar**: Recherche sémantique dans l'historique

## 🔐 Sécurité

### Row Level Security (RLS)
Actuellement désactivé pour partager les connaissances entre utilisateurs.

Pour activer le RLS (chaque user voit uniquement ses conversations):
```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid()::text = user_id);
```

### Rate Limiting
Implémenter un rate limit pour éviter les abus:
```javascript
// api-server.js
const rateLimit = require('express-rate-limit');

const memorySearchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10 // 10 recherches max par minute
});

app.post('/api/memory/search', memorySearchLimiter, ...);
```

## 📊 Performance

### Benchmarks (10k conversations)
- **Génération embedding**: ~50ms (Gemini API)
- **Recherche vectorielle**: ~20ms (Supabase pgvector + ivfflat)
- **Stockage**: ~30ms
- **Total overhead RAG**: ~100ms

### Scalabilité
- **10k conversations**: Performance optimale
- **100k conversations**: Toujours rapide avec ivfflat
- **1M+ conversations**: Envisager sharding ou filtrage par date

## 🐛 Troubleshooting

### Erreur "extension vector does not exist"
```sql
-- Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Erreur "function match_conversations does not exist"
Réexécuter le script `supabase-rag-setup.sql` complet.

### Embeddings dimension mismatch
Gemini = 768D, OpenAI = 1536D. Choisir un modèle et s'y tenir.

Pour changer de modèle:
```sql
-- Supabase SQL Editor
ALTER TABLE conversations ALTER COLUMN embedding TYPE vector(1536);
DROP INDEX idx_conversations_embedding;
CREATE INDEX idx_conversations_embedding ON conversations 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### RAG non disponible (fallback gracieux)
Le système continue de fonctionner sans RAG si erreur. Check logs:
```
⚠️ RAG non disponible: SUPABASE_URL non définie
```

## 🚀 Évolutions Futures

### Phase 2: Multi-Modal RAG
- Stocker les embeddings d'images/vidéos (CLIP, ImageBind)
- Recherche cross-modale: "Trouve toutes les vidéos similaires à cette image"

### Phase 3: RAG Contextuel
- Embeddings séparés pour: questions, réponses, métadonnées
- Recherche multi-vecteurs pour précision accrue

### Phase 4: RAG Fédéré
- Combiner mémoire personnelle + base commune
- Privacy-preserving: chaque user garde son historique privé

## 📚 Références

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Gemini Embeddings](https://ai.google.dev/docs/embeddings_guide)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-columns)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

**Créé le**: 3 Décembre 2025  
**Version**: 1.0.0  
**Auteur**: Vera AI Team  
**License**: MIT
