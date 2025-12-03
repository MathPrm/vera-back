import axios, { AxiosInstance } from 'axios';

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

class YouTubeService {
  private apiKey: string;
  private client: AxiosInstance;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    
    this.client = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3',
      params: {
        key: this.apiKey
      },
      timeout: 30000
    });
  }

  /**
   * Extraire une vidéo YouTube par URL
   */
  async extractVideo(url: string): Promise<YouTubeVideoData> {
    try {
      console.log(`📥 Extraction vidéo YouTube : ${url}`);
      
      const videoId = this.extractVideoIdFromUrl(url);
      
      if (!videoId) {
        throw new Error('URL invalide - impossible d\'extraire le video ID');
      }
      
      const response = await this.client.get('/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId
        }
      });
      
      if (!response.data || !response.data.items || response.data.items.length === 0) {
        throw new Error('Vidéo YouTube introuvable');
      }
      
      return this.normalizeVideoData(response.data.items[0], videoId, url);
      
    } catch (error: any) {
      console.error(`❌ Erreur extraction YouTube:`, error.message);
      
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Vidéo YouTube introuvable ou privée');
        }
        if (error.response.status === 403) {
          throw new Error('Accès interdit - vérifiez la clé API');
        }
        if (error.response.status === 429) {
          throw new Error('Limite API atteinte - réessayez dans quelques instants');
        }
      }
      
      throw error;
    }
  }

  /**
   * Normaliser les données d'une vidéo YouTube
   */
  private normalizeVideoData(videoData: any, videoId: string, url: string): YouTubeVideoData {
    const snippet = videoData.snippet || {};
    const statistics = videoData.statistics || {};
    const contentDetails = videoData.contentDetails || {};
    
    return {
      video_id: videoId,
      url: url,
      title: snippet.title || '',
      description: snippet.description || '',
      author: snippet.channelTitle || 'Inconnu',
      author_id: snippet.channelId || '',
      thumbnail_url: snippet.thumbnails?.maxres?.url || 
                    snippet.thumbnails?.high?.url || 
                    snippet.thumbnails?.default?.url || '',
      duration: contentDetails.duration || '',
      published_at: snippet.publishedAt || new Date().toISOString(),
      views: parseInt(statistics.viewCount) || 0,
      likes: parseInt(statistics.likeCount) || 0,
      comments: parseInt(statistics.commentCount) || 0,
      category_id: snippet.categoryId || '',
      tags: snippet.tags || [],
      hashtags: this.extractHashtags(snippet.description || ''),
      is_live: snippet.liveBroadcastContent === 'live'
    };
  }

  /**
   * Extraire le video ID depuis l'URL YouTube
   */
  private extractVideoIdFromUrl(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Extraire les hashtags d'un texte
   */
  private extractHashtags(text: string): string[] {
    const hashtagPattern = /#[\w\u00C0-\u017F]+/g;
    const matches = text.match(hashtagPattern) || [];
    return matches.map(tag => tag.substring(1));
  }

  /**
   * Vérifier si une URL est une URL YouTube
   */
  isYouTubeUrl(url: string): boolean {
    return /(?:youtube\.com|youtu\.be)/.test(url);
  }
}

export default new YouTubeService();
