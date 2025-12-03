interface YouTubeVideoData {
    video_id: string;
    url: string;
    title: string;
    description: string;
    author: string;
    author_id: string;
    thumbnail_url: string;
    duration: string;
    published_at: string;
    views: number;
    likes: number;
    comments: number;
    category_id: string;
    tags: string[];
    hashtags: string[];
    is_live: boolean;
}
declare class YouTubeService {
    private apiKey;
    private client;
    constructor();
    /**
     * Extraire une vidéo YouTube par URL
     */
    extractVideo(url: string): Promise<YouTubeVideoData>;
    /**
     * Normaliser les données d'une vidéo YouTube
     */
    private normalizeVideoData;
    /**
     * Extraire le video ID depuis l'URL YouTube
     */
    private extractVideoIdFromUrl;
    /**
     * Extraire les hashtags d'un texte
     */
    private extractHashtags;
    /**
     * Vérifier si une URL est une URL YouTube
     */
    isYouTubeUrl(url: string): boolean;
}
declare const _default: YouTubeService;
export default _default;
//# sourceMappingURL=youtube.service.d.ts.map