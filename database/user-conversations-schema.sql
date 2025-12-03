-- ============================================
-- SCHÉMA : HISTORIQUE DES CONVERSATIONS PAR UTILISATEUR
-- PostgreSQL 16
-- ============================================

-- Table des conversations utilisateurs
CREATE TABLE IF NOT EXISTS user_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500), -- Titre ou première question
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false -- Soft delete
);

-- Table des messages dans une conversation
CREATE TABLE IF NOT EXISTS conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES user_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'user' ou 'vera'
    content TEXT NOT NULL,
    media_urls TEXT[], -- URLs de médias analysés
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_updated ON user_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_conversations_deleted ON user_conversations(is_deleted);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created ON conversation_messages(created_at);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_updated_at
    BEFORE UPDATE ON user_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Trigger pour mettre à jour updated_at de la conversation quand un message est ajouté
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_conversations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();
