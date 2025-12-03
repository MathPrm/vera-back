interface Conversation {
    id?: string;
    user_id: string;
    user_query: string;
    vera_response: string;
    embedding: number[];
    metadata?: Record<string, any>;
    created_at: string;
    similarity?: number;
}
declare class VectorStoreService {
    private supabase;
    constructor();
    /**
     * Stocke une conversation avec son embedding
     * @param userId - ID de l'utilisateur
     * @param userQuery - Question posée
     * @param veraResponse - Réponse de Vera
     * @param embedding - Vecteur d'embedding (768D pour Gemini)
     * @param metadata - Métadonnées additionnelles (optionnel)
     * @returns Conversation créée
     */
    storeConversation(userId: string, userQuery: string, veraResponse: string, embedding: number[], metadata?: Record<string, any>): Promise<Conversation>;
    /**
     * Recherche les conversations similaires par similarité vectorielle
     * @param queryEmbedding - Vecteur de la requête actuelle
     * @param userId - ID utilisateur (optionnel, pour filtrer)
     * @param limit - Nombre de résultats (défaut: 5)
     * @param threshold - Seuil de similarité minimum (0-1, défaut: 0.7)
     * @returns Conversations similaires triées par pertinence
     */
    searchSimilarConversations(queryEmbedding: number[], userId?: string | null, limit?: number, threshold?: number): Promise<Conversation[]>;
    /**
     * Récupère l'historique complet d'un utilisateur
     * @param userId - ID utilisateur
     * @param limit - Nombre de conversations (défaut: 50)
     * @returns Historique des conversations
     */
    getUserHistory(userId: string, limit?: number): Promise<Conversation[]>;
    /**
     * Supprime les anciennes conversations (nettoyage)
     * @param daysOld - Supprimer conversations plus vieilles que X jours
     * @returns Nombre de conversations supprimées
     */
    cleanOldConversations(daysOld?: number): Promise<number>;
    /**
     * Récupère une conversation spécifique par ID
     * @param conversationId - ID de la conversation
     * @returns Conversation
     */
    getConversation(conversationId: string): Promise<Conversation>;
}
declare const _default: VectorStoreService;
export default _default;
//# sourceMappingURL=vector-store.service.d.ts.map