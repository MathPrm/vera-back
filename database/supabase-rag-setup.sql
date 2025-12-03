-- =====================================================
-- SCRIPT SQL POUR SUPABASE - RAG MEMORY SYSTEM
-- =====================================================
-- Instructions:
-- 1. Ouvrir Supabase Dashboard: https://supabase.com/dashboard
-- 2. Sélectionner votre projet
-- 3. Aller dans SQL Editor
-- 4. Copier/coller ce script complet
-- 5. Exécuter (bouton RUN)
-- =====================================================

-- Activer l'extension pgvector (vecteurs pour embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Créer la table conversations avec support vectoriel
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  vera_response TEXT NOT NULL,
  embedding vector(768),  -- Gemini embedding-001 produit 768 dimensions
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON conversations(user_id);

-- Index pour tri par date
CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
ON conversations(created_at DESC);

-- Index IVFFLAT pour recherche vectorielle ultra-rapide
-- (utilise une approximation pour performance avec de gros volumes)
CREATE INDEX IF NOT EXISTS idx_conversations_embedding 
ON conversations USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alternative: Index HNSW (plus précis, plus lent à construire)
-- Décommenter si vous préférez la précision à la vitesse:
-- CREATE INDEX IF NOT EXISTS idx_conversations_embedding_hnsw 
-- ON conversations USING hnsw (embedding vector_cosine_ops);

-- Trigger pour update automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTION RPC POUR RECHERCHE VECTORIELLE
-- =====================================================
-- Recherche les conversations les plus similaires via cosine similarity
-- Paramètres:
--   query_embedding: vecteur de la requête actuelle (768D)
--   match_threshold: seuil de similarité minimum (0-1)
--   match_count: nombre max de résultats
-- Retourne: conversations triées par similarité descendante
-- =====================================================

CREATE OR REPLACE FUNCTION match_conversations(
  query_embedding vector(768),
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

-- =====================================================
-- FONCTION UTILITAIRE: NETTOYAGE AUTOMATIQUE
-- =====================================================
-- Supprime les conversations plus vieilles que X jours
-- Utilisation: SELECT cleanup_old_conversations(90); -- 90 jours
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_conversations(days_old int DEFAULT 90)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM conversations
  WHERE created_at < NOW() - (days_old || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- FONCTION UTILITAIRE: STATISTIQUES
-- =====================================================
-- Affiche des stats sur la table conversations
-- =====================================================

CREATE OR REPLACE FUNCTION get_conversation_stats()
RETURNS TABLE (
  total_conversations BIGINT,
  unique_users BIGINT,
  oldest_conversation TIMESTAMPTZ,
  newest_conversation TIMESTAMPTZ,
  avg_response_length FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_conversations,
    COUNT(DISTINCT user_id) AS unique_users,
    MIN(created_at) AS oldest_conversation,
    MAX(created_at) AS newest_conversation,
    AVG(LENGTH(vera_response)) AS avg_response_length
  FROM conversations;
END;
$$;

-- =====================================================
-- POLITIQUES DE SÉCURITÉ RLS (Row Level Security)
-- =====================================================
-- Optionnel: Décommenter si vous voulez activer RLS
-- Cela permet de limiter l'accès aux conversations par user_id
-- =====================================================

-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs ne voient que leurs conversations
-- CREATE POLICY "Users can view their own conversations"
--   ON conversations FOR SELECT
--   USING (auth.uid()::text = user_id);

-- Politique: Les utilisateurs ne peuvent créer que leurs conversations
-- CREATE POLICY "Users can insert their own conversations"
--   ON conversations FOR INSERT
--   WITH CHECK (auth.uid()::text = user_id);

-- Politique: Admin peut tout voir
-- CREATE POLICY "Admins can view all conversations"
--   ON conversations FOR SELECT
--   USING (auth.jwt()->>'role' = 'admin');

-- =====================================================
-- TEST DE LA TABLE
-- =====================================================
-- Insérer une conversation de test
-- =====================================================

-- INSERT INTO conversations (user_id, user_query, vera_response, embedding, metadata)
-- VALUES (
--   'test-user-123',
--   'Est-ce que cette vidéo TikTok est vraie?',
--   'Après analyse, cette vidéo présente des signes de manipulation...',
--   array_fill(0.1, ARRAY[768])::vector,  -- Embedding factice
--   '{"platform": "tiktok", "url": "https://tiktok.com/@test"}'::jsonb
-- );

-- Tester la recherche vectorielle
-- SELECT * FROM match_conversations(
--   array_fill(0.1, ARRAY[768])::vector,
--   0.5,
--   5
-- );

-- Afficher les stats
-- SELECT * FROM get_conversation_stats();

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- Une fois exécuté, votre base est prête pour le RAG !
-- Les services Node.js peuvent maintenant stocker et rechercher
-- des conversations via similarité vectorielle.
-- =====================================================
