declare class EmbeddingService {
    private provider;
    private disabled;
    private dimensions;
    private genAI?;
    private model?;
    constructor();
    /**
     * Génère un embedding vectoriel pour un texte donné
     * @param text - Le texte à convertir en vecteur
     * @returns Vecteur d'embeddings (1536D pour OpenAI, 768D pour Gemini)
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Génère un embedding avec OpenAI
     */
    private generateOpenAIEmbedding;
    /**
     * Génère un embedding avec Gemini
     */
    private generateGeminiEmbedding;
    /**
     * Génère des embeddings pour plusieurs textes en batch
     * @param texts - Tableau de textes
     * @returns Tableau de vecteurs
     */
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Prépare le texte d'une conversation pour l'embedding
     * @param userQuery - Question de l'utilisateur
     * @param veraResponse - Réponse de Vera
     * @returns Texte combiné optimisé pour l'embedding
     */
    prepareConversationText(userQuery: string, veraResponse: string): string;
}
declare const _default: EmbeddingService;
export default _default;
//# sourceMappingURL=embedding.service.d.ts.map