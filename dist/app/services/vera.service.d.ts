interface VeraResult {
    request_id: string;
    status: string;
    score: number;
    verdict: string;
    summary: string;
    flags: Array<{
        type: string;
        message: string;
    }>;
    sources: any[];
    explanation: string;
    toolsUsed: string[];
    confidence: number;
    conversationId?: string;
    error?: boolean;
    message?: string;
    response?: string;
}
interface ExtractedMedia {
    platform: string;
    data: any;
}
interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
interface Message {
    sender: 'user' | 'vera';
    content: string;
    timestamp?: Date;
}
declare class VeraService {
    private apiKey;
    private apiEndpoint;
    private client;
    private tiktokService;
    private youtubeService;
    private instagramService;
    constructor();
    /**
     * Vérifier le contenu d'une vidéo TikTok, Instagram ou YouTube
     */
    checkVideo(contentData: any, platform?: string): Promise<VeraResult>;
    /**
     * Parser la réponse de Vera
     */
    private parseVeraResponse;
    /**
     * Détecter et extraire les données d'une URL de plateforme
     */
    extractFromUrl(url: string): Promise<ExtractedMedia>;
    /**
     * Vérifier un message texte simple (pour le chat web)
     */
    checkContent(message: string, conversationId?: string | null, conversationHistory?: Message[], mediaUrls?: string[], imageFile?: UploadedFile | null, videoFile?: UploadedFile | null): Promise<VeraResult>;
    /**
     * Extraire le domaine d'une URL
     */
    private extractDomain;
    /**
     * Calculer un score de confiance basé sur la réponse
     */
    private calculateConfidence;
}
declare const _default: VeraService;
export default _default;
//# sourceMappingURL=vera.service.d.ts.map