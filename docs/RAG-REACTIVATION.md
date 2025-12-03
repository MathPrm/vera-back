# 🔄 RAG - Guide de Réactivation

## 🚫 État Actuel : DÉSACTIVÉ

Le système RAG est temporairement désactivé car le quota gratuit de l'API Gemini Embeddings a été dépassé.

**Le chat fonctionne normalement sans RAG** - c'est juste la mémoire long-terme qui est désactivée.

---

## 📋 Options pour Réactiver le RAG

### Option 1: OpenAI (Recommandé pour Production) 💰

**Coût**: ~$0.0001 par message (très peu cher)  
**Dimensions**: 1536D  
**Qualité**: Excellente

#### Étapes :

1. **Créer un compte OpenAI** : https://platform.openai.com/signup
2. **Ajouter une carte bancaire** : Settings > Billing
3. **Créer une API Key** : https://platform.openai.com/api-keys
4. **Ajouter dans `.env`** :
   ```env
   EMBEDDING_PROVIDER=OPENAI
   OPENAI_API_KEY=sk-xxxxxxxxxxxx
   ```
5. **Modifier la table Supabase** (change 768D → 1536D) :
   ```sql
   -- Supabase SQL Editor
   ALTER TABLE conversations ALTER COLUMN embedding TYPE vector(1536);
   DROP INDEX idx_conversations_embedding;
   CREATE INDEX idx_conversations_embedding ON conversations 
     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
   
   -- Modifier la fonction RPC
   CREATE OR REPLACE FUNCTION match_conversations(
     query_embedding vector(1536), -- Change 768 → 1536
     match_threshold float DEFAULT 0.7,
     match_count int DEFAULT 5
   )
   RETURNS TABLE (
     id UUID,
     user_id TEXT,
     user_query TEXT,
     vera_response TEXT,
     metadata JSONB,
     created_at TIMESTAMPTZ,
     similarity FLOAT
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       c.id,
       c.user_id,
       c.user_query,
       c.vera_response,
       c.metadata,
       c.created_at,
       1 - (c.embedding <=> query_embedding) AS similarity
     FROM conversations c
     WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
     ORDER BY c.embedding <=> query_embedding
     LIMIT match_count;
   END;
   $$;
   ```

6. **Décommenter le code RAG dans `vera.service.js`** :
   - Ligne ~370 : Recherche de mémoire
   - Ligne ~600 : Stockage de conversation

7. **Redémarrer le serveur** :
   ```bash
   cd vera-back
   npm run api
   ```

---

### Option 2: Gemini (Gratuit) 🆓

**Coût**: Gratuit (avec quotas)  
**Dimensions**: 768D  
**Qualité**: Bonne  
**Limite**: 1500 requêtes/jour

#### Étapes :

1. **Créer un nouveau projet Google Cloud**
2. **Activer Gemini API**
3. **Créer une nouvelle API Key**
4. **Ajouter dans `.env`** :
   ```env
   EMBEDDING_PROVIDER=GEMINI
   GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx  # NOUVELLE CLÉ
   ```
5. **La table Supabase est déjà configurée pour 768D** ✅
6. **Décommenter le code RAG dans `vera.service.js`**
7. **Redémarrer le serveur**

---

### Option 3: HuggingFace (Gratuit + Self-Hosted) 🤗

**Coût**: Gratuit (API) ou Self-hosted  
**Dimensions**: 384D ou 768D selon modèle  
**Qualité**: Variable

#### Modèles recommandés :
- `sentence-transformers/all-MiniLM-L6-v2` (384D, rapide)
- `sentence-transformers/all-mpnet-base-v2` (768D, meilleur)

#### Étapes :

1. **Installer transformers** :
   ```bash
   cd vera-back
   npm install @huggingface/inference
   ```

2. **Créer `app/services/huggingface-embedding.service.js`** :
   ```javascript
   const { HfInference } = require('@huggingface/inference');
   
   class HuggingFaceEmbeddingService {
     constructor() {
       this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
       this.model = 'sentence-transformers/all-mpnet-base-v2';
     }
     
     async generateEmbedding(text) {
       const result = await this.hf.featureExtraction({
         model: this.model,
         inputs: text
       });
       return Array.from(result);
     }
   }
   
   module.exports = new HuggingFaceEmbeddingService();
   ```

3. **Modifier `embedding.service.js`** pour utiliser HuggingFace

4. **Créer une API key gratuite** : https://huggingface.co/settings/tokens

5. **Ajouter dans `.env`** :
   ```env
   EMBEDDING_PROVIDER=HUGGINGFACE
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
   ```

---

## 🔓 Décommenter le Code RAG

Une fois le provider d'embeddings configuré, **décommenter ces blocs** dans `vera-back/app/services/vera.service.js` :

### Bloc 1: Recherche de Mémoire (~ligne 370)

```javascript
// Décommenter de la ligne "try {" jusqu'à "} catch (ragError) {"
try {
    const queryEmbedding = await embeddingService.generateEmbedding(message);
    const userId = conversationId || `web-user-${Date.now()}`;
    similarConversations = await vectorStoreService.searchSimilarConversations(
        queryEmbedding,
        null,
        3,
        0.75
    );
    
    if (similarConversations.length > 0) {
        console.log(`🧠 RAG: ${similarConversations.length} conversations similaires trouvées`);
        ragContext = '\n\n💾 MÉMOIRE (conversations similaires passées):\n';
        similarConversations.forEach((conv, i) => {
            ragContext += `\n[${i+1}] Similarité: ${(conv.similarity * 100).toFixed(1)}%\n`;
            ragContext += `Q: ${conv.user_query}\n`;
            ragContext += `R: ${conv.vera_response.substring(0, 200)}...\n`;
        });
        ragContext += '\n⚠️ Utilise ces conversations passées pour enrichir ta réponse si pertinent.\n';
    }
} catch (ragError) {
    console.warn('⚠️ RAG non disponible:', ragError.message);
}
```

### Bloc 2: Stockage de Conversation (~ligne 600)

```javascript
// Décommenter de la ligne "try {" jusqu'à la fin du bloc
try {
    const userId = conversationId || `web-user-${Date.now()}`;
    const veraResponseText = typeof result === 'string' ? result : 
                            result.summary || result.message || JSON.stringify(result);
    const conversationText = embeddingService.prepareConversationText(message, veraResponseText);
    const conversationEmbedding = await embeddingService.generateEmbedding(conversationText);
    
    await vectorStoreService.storeConversation(
        userId,
        message,
        veraResponseText,
        conversationEmbedding,
        {
            media_urls: mediaUrls,
            has_files: !!(imageFile || videoFile),
            platform_videos: extractedMedias.length,
            similar_conversations_used: similarConversations.length
        }
    );
    
    console.log('✅ Conversation stockée dans la mémoire RAG');
} catch (storageError) {
    console.warn('⚠️ Stockage RAG échoué:', storageError.message);
}
```

---

## ✅ Vérifier que ça Fonctionne

Après réactivation, tu devrais voir dans les logs :

```
🤖 Embedding Service: OpenAI (1536D)
[API] Serveur démarré sur http://localhost:3000
...
🧠 RAG: 3 conversations similaires trouvées
✅ Conversation stockée dans la mémoire RAG
```

---

## 📊 Coûts Comparatifs

| Provider | Coût / 1K requêtes | Coût / mois (100 msg/jour) |
|----------|-------------------|---------------------------|
| **OpenAI** | $0.10 | ~$0.60/mois |
| **Gemini** | Gratuit | $0 (jusqu'à 1500/jour) |
| **HuggingFace** | Gratuit | $0 (rate limited) |

💡 **Recommandation** : OpenAI pour production (coût négligeable), Gemini pour dev/test

---

## 🆘 Problèmes Fréquents

### "OPENAI_API_KEY non définie"
→ Vérifie que `.env` contient bien la clé et que `EMBEDDING_PROVIDER=OPENAI`

### "dimension mismatch"
→ La table Supabase est en 768D mais OpenAI produit 1536D. Exécute le script SQL ci-dessus.

### "quota exceeded"
→ Gemini : Attendre 24h ou changer de provider  
→ OpenAI : Ajouter du crédit sur le compte

### "Cannot read property 'values' of undefined"
→ Gemini : Vérifie que la clé API est valide  
→ Modèle embedding-001 existe bien

---

## 📚 Documentation Complète

Voir `docs/RAG-MEMORY.md` pour :
- Architecture complète
- API endpoints
- Cas d'usage
- Maintenance
- Troubleshooting avancé

---

**Créé le**: 3 Décembre 2025  
**Dernière MAJ**: 3 Décembre 2025  
**Status**: RAG DÉSACTIVÉ (quota embeddings)  
