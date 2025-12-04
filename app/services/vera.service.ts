import axios, { AxiosInstance } from 'axios';
import tiktokService from './tiktok.service';
import youtubeService from './youtube.service';
import instagramService from './instagram.service';
//import embeddingService from './embedding.service';
//import vectorStoreService from './vector-store.service';

interface VeraResult {
  request_id: string;
  status: string;
  score: number;
  verdict: string;
  summary: string;
  flags: Array<{ type: string; message: string }>;
  sources: any[];
  explanation: string;
  toolsUsed: string[];
  confidence: number;
  conversationId?: string;
  error?: boolean;
  message?: string;
  response?: string;
}

interface MediaUrl {
  type: 'video' | 'image' | 'url';
  url: string;
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

class VeraService {
  private apiKey: string;
  private apiEndpoint: string;
  private client: AxiosInstance;
  private tiktokService: typeof tiktokService;
  private youtubeService: typeof youtubeService;
  private instagramService: typeof instagramService;

  constructor() {
    this.apiKey = process.env.VERA_API_KEY || '';
    this.apiEndpoint = process.env.VERA_API_URL || 'https://feat-api-partner---api-ksrn3vjgma-od.a.run.app/api/v1';
    
    this.tiktokService = tiktokService;
    this.youtubeService = youtubeService;
    this.instagramService = instagramService;
    
    this.client = axios.create({
      baseURL: this.apiEndpoint,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Vérifier le contenu d'une vidéo TikTok, Instagram ou YouTube
   */
  async checkVideo(contentData: any, platform: string = 'tiktok'): Promise<VeraResult> {
    try {
      if (!this.apiKey || this.apiKey === 'your_vera_api_key_here') {
        throw new Error('VERA_API_KEY non configurée');
      }
      
      const platformName = platform === 'tiktok' ? 'TikTok' : 
                          platform === 'instagram' ? 'Instagram' : 
                          platform === 'youtube' ? 'YouTube' : 'Unknown';
      
      const contentId = contentData.video_id || contentData.post_id || contentData.shortcode;
      
      console.log(`🔍 Vérification Vera pour ${platformName} ${contentId}`);
      
      const mediaUrls: MediaUrl[] = [];
      
      if (contentData.download_url || contentData.video_url) {
        mediaUrls.push({
          type: 'video',
          url: contentData.download_url || contentData.video_url
        });
      }
      
      if (contentData.images && contentData.images.length > 0) {
        contentData.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            mediaUrls.push({
              type: 'image',
              url: imgUrl
            });
          }
        });
      } else if (contentData.thumbnail_url) {
        mediaUrls.push({
          type: 'image',
          url: contentData.thumbnail_url
        });
      }
      
      const description = contentData.description || contentData.caption || '';
      const hashtags = Array.isArray(contentData.hashtags) ? contentData.hashtags : [];
      const title = contentData.title || '';
      
      console.log('📦 Médias à analyser:', mediaUrls);
      
      const query = `Analyse ce contenu ${platformName} et vérifie son authenticité:

${title ? `📌 TITRE: ${title}\n` : ''}
${mediaUrls.find(m => m.type === 'video') ? `📹 VIDÉO À ANALYSER: ${mediaUrls.find(m => m.type === 'video')!.url}\n` : ''}
${mediaUrls.filter(m => m.type === 'image').map((m, i) => `🖼️ IMAGE ${i+1} À ANALYSER: ${m.url}`).join('\n')}

⚠️ IMPORTANT: Utilise les outils Vera.ai pour analyser directement les médias:
- Video Deepfake Detection
- Synthetic Image Detection
- Image Forgery and Localization
- Synthetic Speech Detection
- TruFor

📝 CONTEXTE:
Plateforme: ${platformName}
Auteur: @${contentData.author}
Description: ${description}
Hashtags: ${hashtags.join(', ')}

📊 MÉTRIQUES:
- ${(contentData.views || 0).toLocaleString()} vues
- ${(contentData.likes || 0).toLocaleString()} likes  
- ${(contentData.comments || 0).toLocaleString()} commentaires
${contentData.shares ? `- ${contentData.shares.toLocaleString()} partages` : ''}

Réponds avec un verdict: VERIFIED, MOSTLY_TRUE, MIXED, MOSTLY_FALSE, ou FALSE`;

      const payload = {
        userId: `${platformName.toLowerCase()}_bot_${Date.now()}`,
        query: query,
        metadata: {
          source: platformName.toLowerCase(),
          content_id: contentId,
          author: contentData.author,
          media_urls: mediaUrls
        }
      };
      
      const response = await this.client.post('/chat', payload, {
        responseType: 'text',
        timeout: 120000
      });
      
      if (!response.data) {
        throw new Error('Réponse Vera API invalide');
      }
      
      const fullResponse = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      
      return this.parseVeraResponse({ response: fullResponse }, contentData);
      
    } catch (error: any) {
      console.error('❌ Erreur Vera API:', error.message);
      throw error;
    }
  }

  /**
   * Parser la réponse de Vera
   */
  private parseVeraResponse(veraData: any, videoData?: any): VeraResult {
    const response = veraData.response || veraData.answer || veraData.message || veraData || '';
    const analysisText = typeof response === 'string' ? response : JSON.stringify(response);
    
    console.log('📥 Réponse Vera (300 premiers caractères):', analysisText.substring(0, 300));
    
    let score = 70;
    let verdict = 'MIXED';
    const flags: Array<{ type: string; message: string }> = [];
    let summary = analysisText; // Par défaut, utiliser la réponse complète
    
    const lowerResponse = analysisText.toLowerCase();
    
    // Détecter contenu généré par IA
    if (lowerResponse.includes('généré par ia') || 
        lowerResponse.includes('generated by ai') ||
        lowerResponse.includes('synthétique détecté') ||
        lowerResponse.includes('synthetic detected') ||
        lowerResponse.includes('contenu artificiel') ||
        lowerResponse.includes('ai-generated')) {
      score = 35;
      verdict = 'MOSTLY_FALSE';
      flags.push({ type: 'warning', message: 'Contenu IA détecté' });
    }
    // Détecter les confirmations POSITIVES
    else if ((lowerResponse.includes('confirme') || 
        lowerResponse.includes('véridique') || 
        lowerResponse.includes('exact') ||
        lowerResponse.includes('correct')) &&
        !lowerResponse.includes('ne confirme pas') &&
        !lowerResponse.includes('pas confirmé')) {
      score = 85;
      verdict = 'VERIFIED';
    }
    // NEGATIONS fortes
    else if (lowerResponse.includes('faux') || 
             lowerResponse.includes('false') || 
             lowerResponse.includes('désinformation') ||
             lowerResponse.includes('mensonge')) {
      score = 25;
      verdict = 'FALSE';
      flags.push({ type: 'danger', message: 'Désinformation détectée' });
    }
    // Contenu trompeur/manipulé
    else if (lowerResponse.includes('trompeur') || 
             lowerResponse.includes('misleading') || 
             lowerResponse.includes('manipulé')) {
      score = 40;
      verdict = 'MOSTLY_FALSE';
      flags.push({ type: 'warning', message: 'Contenu potentiellement trompeur' });
    }
    // Authentique/vérifié
    else if (lowerResponse.includes('vérifié') || 
             lowerResponse.includes('verified') || 
             lowerResponse.includes('authentique')) {
      score = 85;
      verdict = 'VERIFIED';
    }
    // Probable/plutôt vrai
    else if (lowerResponse.includes('probable') || 
             lowerResponse.includes('likely') || 
             lowerResponse.includes('plutôt vrai')) {
      score = 65;
      verdict = 'MOSTLY_TRUE';
    }
    // Contenu narratif (contes, fables)
    else if (lowerResponse.includes('histoire') || 
             lowerResponse.includes('conte') || 
             lowerResponse.includes('fable') ||
             lowerResponse.includes('fiction')) {
      score = 50;
      verdict = 'MIXED';
    }
    
    const toolsUsed: string[] = [];
    if (lowerResponse.includes('deepfake')) toolsUsed.push('Détection deepfake');
    if (lowerResponse.includes('synthetic') || lowerResponse.includes('synthétique')) toolsUsed.push('Détection contenu IA');
    
    return {
      request_id: veraData.conversationId || `vera_${Date.now()}`,
      status: 'completed',
      score: score,
      verdict: verdict,
      summary: summary,
      flags: flags,
      sources: veraData.sources || [],
      explanation: analysisText,
      toolsUsed: toolsUsed,
      confidence: 0.8
    };
  }

  /**
   * Détecter et extraire les données d'une URL de plateforme
   */
  async extractFromUrl(url: string): Promise<ExtractedMedia> {
    try {
      if (url.includes('tiktok.com')) {
        console.log('🎵 Détection TikTok');
        const videoData = await this.tiktokService.extractVideo(url);
        return { platform: 'tiktok', data: videoData };
      }
      
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        console.log('▶️ Détection YouTube');
        const videoData = await this.youtubeService.extractVideo(url);
        return { platform: 'youtube', data: videoData };
      }
      
      if (url.includes('instagram.com')) {
        console.log('📸 Détection Instagram');
        const videoData = await this.instagramService.extractPost(url);
        return { platform: 'instagram', data: videoData };
      }
      
      if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return {
          platform: 'image',
          data: { url: url, type: 'image', thumbnail_url: url }
        };
      }
      
      if (url.match(/\.(mp4|mov|avi|webm)$/i)) {
        return {
          platform: 'video',
          data: { url: url, type: 'video', download_url: url }
        };
      }
      
      return {
        platform: 'web',
        data: { url: url, type: 'url' }
      };
      
    } catch (error: any) {
      console.error('❌ Erreur extraction URL:', error.message);
      return {
        platform: 'unknown',
        data: { url: url, error: error.message }
      };
    }
  }

  /**
   * Vérifier un message texte simple (pour le chat web)
   */
  async checkContent(
    message: string,
    conversationId: string | null = null,
    conversationHistory: Message[] = [],
    mediaUrls: string[] = [],
    imageFile: UploadedFile | null = null,
    videoFile: UploadedFile | null = null
  ): Promise<VeraResult> {
    try {
      if (!this.apiKey || this.apiKey === 'your_vera_api_key_here') {
        throw new Error('VERA_API_KEY non configurée');
      }

      let similarConversations: any[] = [];
      let ragContext = '';

      const extractedMedias: ExtractedMedia[] = [];
      if (mediaUrls.length > 0) {
        console.log('🔍 Extraction des médias détectés...');
        for (const url of mediaUrls) {
          const extracted = await this.extractFromUrl(url);
          extractedMedias.push(extracted);
        }
      }

      const platformVideos = extractedMedias.filter(m => 
        ['tiktok', 'youtube', 'instagram'].includes(m.platform)
      );
      
      if (platformVideos.length > 0) {
        console.log(`📹 Analyse de ${platformVideos.length} vidéo(s) de plateforme`);
        const video = platformVideos[0];
        const videoData = video.data;
        
        const contextQuery = `Analyse ce contenu ${video.platform.toUpperCase()}:

📌 TITRE: ${videoData.title || 'Aucun titre'}
📝 DESCRIPTION: ${videoData.description || 'Aucune description'}
👤 AUTEUR: @${videoData.author || 'Inconnu'}
🏷️ HASHTAGS: ${videoData.hashtags?.join(', ') || 'Aucun'}

📊 POPULARITÉ:
- ${(videoData.views || 0).toLocaleString()} vues
- ${(videoData.likes || 0).toLocaleString()} likes

🎯 TÂCHE: Vérifie les informations factuelles dans ce contenu.`;

        const payload = {
          userId: `${video.platform}_chat_${Date.now()}`,
          query: contextQuery,
          metadata: {
            source: video.platform,
            content_id: videoData.video_id || videoData.post_id,
            author: videoData.author,
            url: videoData.url
          }
        };

        const response = await this.client.post('/chat', payload, {
          responseType: 'text',
          timeout: 120000
        });

        if (!response.data) {
          throw new Error('Pas de réponse de l\'API Vera');
        }

        const result = this.parseVeraResponse({ response: response.data }, videoData);
        return result;
      }

      let contextualQuery = message;
      if (conversationHistory.length > 0) {
        const lastMessages = conversationHistory.slice(-3);
        const context = lastMessages.map(msg => 
          `${msg.sender === 'user' ? 'Utilisateur' : 'Vera'}: ${msg.content}`
        ).join('\n');
        
        contextualQuery = `Contexte:\n${context}\n\nNouvelle question: ${message}`;
      }
      
      if (ragContext) {
        contextualQuery += ragContext;
      }

      if (mediaUrls.length > 0) {
        contextualQuery += '\n\n📎 Médias à analyser:\n' + mediaUrls.join('\n');
      }

      if (imageFile) {
        contextualQuery += `\n\n🖼️ Image uploadée: ${imageFile.filename}`;
      }
      if (videoFile) {
        contextualQuery += `\n\n🎬 Vidéo uploadée: ${videoFile.filename}`;
      }

      const payload: any = {
        userId: `web-user-${Date.now()}`,
        query: contextualQuery
      };

      if (mediaUrls.length > 0 || imageFile || videoFile) {
        payload.metadata = {
          source: 'web_chat',
          media_urls: mediaUrls.map(url => ({
            type: url.includes('youtube') || url.includes('tiktok') || url.includes('.mp4') ? 'video' : 
                  url.includes('.jpg') || url.includes('.png') ? 'image' : 'url',
            url: url
          }))
        };
      }

      const response = await this.client.post('/chat', payload, {
        responseType: 'text',
        timeout: 120000
      });

      if (!response.data) {
        throw new Error('Pas de réponse de l\'API Vera');
      }

      const result = this.parseVeraResponse(response.data);
      return result;

    } catch (error: any) {
      return {
        error: true,
        message: error.message,
        summary: 'Impossible de vérifier cette information pour le moment.',
        request_id: '',
        status: 'error',
        score: 0,
        verdict: 'ERROR',
        flags: [],
        sources: [],
        explanation: '',
        toolsUsed: [],
        confidence: 0
      };
    }
  }

  /**
   * Extraire le domaine d'une URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Source';
    }
  }

  /**
   * Calculer un score de confiance basé sur la réponse
   */
  private calculateConfidence(response: string, sourcesCount: number): number {
    let confidence = 50;
    
    if (sourcesCount > 0) confidence += 10;
    if (sourcesCount > 2) confidence += 10;
    if (response.length > 200) confidence += 10;
    if (response.match(/selon|d'après|source|étude/gi)) confidence += 10;
    
    return Math.min(confidence, 95);
  }
}

export default new VeraService();
