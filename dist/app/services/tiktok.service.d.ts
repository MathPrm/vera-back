interface TikTokVideoData {
    video_id: string;
    url: string;
    author: string;
    title: string;
    description: string;
    thumbnail_url: string;
    download_url: string;
    duration: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
    music: any;
    hashtags: string[];
    created_at: string;
    author_verified: boolean;
    author_signature: string;
}
interface TikTokUserInfo {
    user_id: string;
    username: string;
    nickname: string;
    avatar: string;
    bio: string;
    verified: boolean;
    follower_count: number;
    following_count: number;
    video_count: number;
    likes_count: number;
}
declare class TikTokService {
    private apiKey;
    private apiHost;
    private baseURL;
    private client;
    constructor();
    /**
     * Extraire une vidéo TikTok par URL
     */
    extractVideo(url: string): Promise<TikTokVideoData>;
    /**
     * Extraire les hashtags d'une description
     */
    private extractHashtags;
    /**
     * Extraire les vidéos d'un utilisateur TikTok
     */
    extractUserVideos(username: string, maxCount?: number): Promise<TikTokVideoData[]>;
    /**
     * Récupérer les informations d'un utilisateur TikTok
     */
    getUserInfo(username: string): Promise<TikTokUserInfo>;
    /**
     * Extraire l'ID d'une vidéo depuis son URL
     */
    private extractVideoIdFromUrl;
    /**
     * Valider une URL TikTok
     */
    isValidTikTokUrl(url: string): boolean;
    /**
     * Vérifier si une URL est une URL TikTok
     */
    isTikTokUrl(url: string): boolean;
    /**
     * Normaliser une URL TikTok (résoudre les liens courts)
     */
    resolveShortUrl(shortUrl: string): Promise<string>;
}
declare const _default: TikTokService;
export default _default;
//# sourceMappingURL=tiktok.service.d.ts.map