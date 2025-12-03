"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
class VectorStoreService {
    constructor() {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
            throw new Error('SUPABASE_URL et SUPABASE_KEY requis dans .env');
        }
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    }
    /**
     * Stocke une conversation avec son embedding
     * @param userId - ID de l'utilisateur
     * @param userQuery - Question posée
     * @param veraResponse - Réponse de Vera
     * @param embedding - Vecteur d'embedding (768D pour Gemini)
     * @param metadata - Métadonnées additionnelles (optionnel)
     * @returns Conversation créée
     */
    async storeConversation(userId, userQuery, veraResponse, embedding, metadata = {}) {
        try {
            const { data, error } = await this.supabase
                .from('conversations')
                .insert([
                {
                    user_id: userId,
                    user_query: userQuery,
                    vera_response: veraResponse,
                    embedding: embedding,
                    metadata: metadata,
                    created_at: new Date().toISOString()
                }
            ])
                .select();
            if (error)
                throw error;
            if (!data || data.length === 0)
                throw new Error('Aucune donnée retournée');
            return data[0];
        }
        catch (error) {
            console.error('Erreur stockage conversation:', error.message);
            throw new Error(`Échec stockage: ${error.message}`);
        }
    }
    /**
     * Recherche les conversations similaires par similarité vectorielle
     * @param queryEmbedding - Vecteur de la requête actuelle
     * @param userId - ID utilisateur (optionnel, pour filtrer)
     * @param limit - Nombre de résultats (défaut: 5)
     * @param threshold - Seuil de similarité minimum (0-1, défaut: 0.7)
     * @returns Conversations similaires triées par pertinence
     */
    async searchSimilarConversations(queryEmbedding, userId = null, limit = 5, threshold = 0.7) {
        try {
            // Utilisation de la fonction RPC pour la recherche vectorielle
            let query = this.supabase.rpc('match_conversations', {
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: limit
            });
            // Filtrer par userId si fourni
            if (userId) {
                query = query.eq('user_id', userId);
            }
            const { data, error } = await query;
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Erreur recherche similaire:', error.message);
            throw new Error(`Échec recherche: ${error.message}`);
        }
    }
    /**
     * Récupère l'historique complet d'un utilisateur
     * @param userId - ID utilisateur
     * @param limit - Nombre de conversations (défaut: 50)
     * @returns Historique des conversations
     */
    async getUserHistory(userId, limit = 50) {
        try {
            const { data, error } = await this.supabase
                .from('conversations')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Erreur récupération historique:', error.message);
            throw new Error(`Échec récupération: ${error.message}`);
        }
    }
    /**
     * Supprime les anciennes conversations (nettoyage)
     * @param daysOld - Supprimer conversations plus vieilles que X jours
     * @returns Nombre de conversations supprimées
     */
    async cleanOldConversations(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const { data, error } = await this.supabase
                .from('conversations')
                .delete()
                .lt('created_at', cutoffDate.toISOString())
                .select();
            if (error)
                throw error;
            return data ? data.length : 0;
        }
        catch (error) {
            console.error('Erreur nettoyage conversations:', error.message);
            throw new Error(`Échec nettoyage: ${error.message}`);
        }
    }
    /**
     * Récupère une conversation spécifique par ID
     * @param conversationId - ID de la conversation
     * @returns Conversation
     */
    async getConversation(conversationId) {
        try {
            const { data, error } = await this.supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            console.error('Erreur récupération conversation:', error.message);
            throw new Error(`Échec récupération: ${error.message}`);
        }
    }
}
// Export singleton
exports.default = new VectorStoreService();
//# sourceMappingURL=vector-store.service.js.map