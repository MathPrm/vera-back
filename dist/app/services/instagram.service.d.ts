interface InstagramPostData {
    post_id: string;
    shortcode: string;
    url: string;
    author: string;
    author_id: string;
    author_verified: boolean;
    caption: string;
    type: 'photo' | 'video';
    is_video: boolean;
    thumbnail_url: string;
    video_url: string;
    images: string[];
    likes: number;
    comments: number;
    views: number;
    created_at: string;
    location: string | null;
    hashtags: string[];
    mentions: string[];
}
declare class InstagramService {
    private apiKey;
    private apiHost;
    private client;
    constructor();
    extractPost(url: string): Promise<InstagramPostData>;
    private normalizePostData;
    private extractShortcodeFromUrl;
    private extractHashtags;
    private extractMentions;
    isInstagramUrl(url: string): boolean;
}
declare const _default: InstagramService;
export default _default;
//# sourceMappingURL=instagram.service.d.ts.map