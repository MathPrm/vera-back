const axios = require('axios');

// Importer les services de plateforme (ce sont des singletons)
const tiktokService = require('./tiktok.service');
const youtubeService = require('./youtube.service');
const instagramService = require('./instagram.service');

// Importer les services RAG
const embeddingService = require('./embedding.service');
const vectorStoreService = require('./vector-store.service');

class VeraService {
    constructor() {
        this.apiKey = process.env.VERA_API_KEY;
        this.apiEndpoint = process.env.VERA_API_URL || 'https://feat-api-partner---api-ksrn3vjgma-od.a.run.app/api/v1';
        
        // Utiliser les services singleton
        this.tiktokService = tiktokService;
        this.youtubeService = youtubeService;
        this.instagramService = instagramService;
        
        this.client = axios.create({
            baseURL: this.apiEndpoint,
            headers: {
                'X-API-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 secondes (au lieu de 2 minutes)
        });
    }
    
    /**
     * Vérifier le contenu d'une vidéo TikTok, Instagram ou YouTube
     * @param {Object} contentData - Données du contenu extrait
     * @param {string} platform - Plateforme: 'tiktok', 'instagram', 'youtube'
     */
    async checkVideo(contentData, platform = 'tiktok') {
        try {
            if (!this.apiKey || this.apiKey === 'your_vera_api_key_here') {
                throw new Error('VERA_API_KEY non configurée. Veuillez configurer une clé API Vera dans le fichier .env');
            }
            
            // Normaliser le nom de plateforme
            const platformName = platform === 'tiktok' ? 'TikTok' : 
                                platform === 'instagram' ? 'Instagram' : 
                                platform === 'youtube' ? 'YouTube' : 'Unknown';
            
            const contentId = contentData.video_id || contentData.post_id || contentData.shortcode;
            
            console.log(`🔍 Vérification Vera pour ${platformName} ${contentId}`);
            
            // Préparer les médias à envoyer
            const mediaUrls = [];
            
            // Ajouter la vidéo
            if (contentData.download_url || contentData.video_url) {
                mediaUrls.push({
                    type: 'video',
                    url: contentData.download_url || contentData.video_url
                });
            }
            
            // Ajouter les images (Instagram peut avoir plusieurs images)
            if (contentData.images && contentData.images.length > 0) {
                contentData.images.forEach(imgUrl => {
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
            
            // Construire la query pour Vera avec contexte et médias
            const description = contentData.description || contentData.caption || '';
            const hashtags = Array.isArray(contentData.hashtags) ? contentData.hashtags : [];
            const title = contentData.title || '';
            
            // Afficher les URLs dans les logs pour debug
            console.log('📦 Médias à analyser:', mediaUrls);
            
            const query = `Analyse ce contenu ${platformName} et vérifie son authenticité:

${title ? `📌 TITRE: ${title}\n` : ''}
${mediaUrls.find(m => m.type === 'video') ? `📹 VIDÉO À ANALYSER: ${mediaUrls.find(m => m.type === 'video').url}\n` : ''}
${mediaUrls.filter(m => m.type === 'image').map((m, i) => `🖼️ IMAGE ${i+1} À ANALYSER: ${m.url}`).join('\n')}

⚠️ IMPORTANT: Utilise les outils Vera.ai pour analyser directement les médias (vidéo et images) ci-dessus:
- Video Deepfake Detection → analyse la vidéo pour détecter les deepfakes
- Synthetic Image Detection → analyse les images pour détecter si elles sont générées par IA
- Image Forgery and Localization → détecte les manipulations dans les images
- Synthetic Speech Detection → analyse l'audio pour détecter les voix synthétiques
- TruFor → analyse forensique complète des médias

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

🎯 ANALYSE REQUISE:
1. Utilise tes outils pour analyser les URLs de médias ci-dessus
2. Authenticité vidéo/image (deepfake, manipulation)
3. Vérification des claims factuels dans le contenu
4. Détection de désinformation
5. Évaluation crédibilité globale

Réponds avec un verdict: VERIFIED, MOSTLY_TRUE, MIXED, MOSTLY_FALSE, ou FALSE
Et explique ton raisonnement avec les preuves de tes outils.`;

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
            
            // Vera envoie une réponse en streaming (text/plain)
            // Il faut récupérer tout le texte avant de parser
            const response = await this.client.post('/chat', payload, {
                responseType: 'text',
                timeout: 120000 // 2 minutes pour laisser le temps à Vera d'analyser
            });
            
            if (!response.data) {
                throw new Error('Réponse Vera API invalide');
            }
            
            // La réponse est du texte brut en streaming
            const fullResponse = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            
            return this.parseVeraResponse({ response: fullResponse }, contentData);
            
        } catch (error) {
            console.error('❌ Erreur Vera API:', error.message);
            throw error;
        }
    }
    
    
    /**
     * Parser la réponse de Vera
     */
    parseVeraResponse(veraData, videoData) {
        // La réponse de Vera contient l'analyse textuelle complète
        const response = veraData.response || veraData.answer || veraData.message || veraData || '';
        
        // Si c'est un string direct (streaming), l'utiliser
        const analysisText = typeof response === 'string' ? response : JSON.stringify(response);
        
        // Analyser le texte pour extraire un score et verdict
        let score = 70; // Score par défaut
        let verdict = 'MIXED';
        const flags = [];
        let summary = '';
        
        const lowerResponse = analysisText.toLowerCase();
        
        // Détecter d'abord si Vera ne peut PAS analyser
        if (lowerResponse.includes('ne suis pas capable') || 
            lowerResponse.includes('cannot analyze') ||
            lowerResponse.includes('ne peux pas analyser') ||
            lowerResponse.includes('unable to') ||
            (lowerResponse.includes('pas capable') && lowerResponse.includes('analyser'))) {
            score = 0;
            verdict = 'MIXED';
            summary = '⚠️ Vera ne peut pas analyser ce contenu multimédia';
            flags.push({ type: 'warning', message: 'Analyse multimédia non disponible' });
        }
        // Détecter si l'analyse est incomplète (streaming en cours)
        else if (lowerResponse.includes('un moment') || 
            lowerResponse.includes('veuillez patienter') ||
            (lowerResponse.includes('je vais') && lowerResponse.length < 200)) {
            score = 50;
            verdict = 'MIXED';
            summary = '⏳ Analyse incomplète - réessayez dans quelques instants';
            flags.push({ type: 'warning', message: 'Réponse partielle reçue' });
        }
        // Détecter contenu généré par IA
        else if (lowerResponse.includes('généré par ia') || 
                 lowerResponse.includes('generated by ai') ||
                 lowerResponse.includes('synthétique détecté') ||
                 lowerResponse.includes('synthetic detected') ||
                 lowerResponse.includes('contenu artificiel') ||
                 lowerResponse.includes('ai-generated')) {
            score = 35;
            verdict = 'MOSTLY_FALSE';
            summary = 'Contenu généré par IA détecté';
            flags.push({ type: 'warning', message: 'Contenu IA détecté' });
        }
        // Détecter les confirmations POSITIVES (mais seulement si contexte positif)
        else if ((lowerResponse.includes('confirme') || 
            lowerResponse.includes('véridique') || 
            lowerResponse.includes('exact') ||
            lowerResponse.includes('correct')) &&
            !lowerResponse.includes('ne confirme pas') &&
            !lowerResponse.includes('pas confirmé')) {
            score = 85;
            verdict = 'VERIFIED';
            summary = 'Contenu vérifié et authentique';
        }
        // Puis les NEGATIONS fortes
        else if (lowerResponse.includes('faux') || 
                 lowerResponse.includes('false') || 
                 lowerResponse.includes('désinformation') ||
                 lowerResponse.includes('mensonge')) {
            score = 25;
            verdict = 'FALSE';
            summary = 'Contenu identifié comme faux ou désinformation';
            flags.push({ type: 'danger', message: 'Désinformation détectée' });
        }
        // Contenu trompeur/manipulé (mais seulement si pas de confirmation positive avant)
        else if (lowerResponse.includes('trompeur') || 
                 lowerResponse.includes('misleading') || 
                 lowerResponse.includes('manipulé')) {
            score = 40;
            verdict = 'MOSTLY_FALSE';
            summary = 'Contenu potentiellement trompeur ou manipulé';
            flags.push({ type: 'warning', message: 'Contenu potentiellement trompeur' });
        }
        // Authentique/vérifié
        else if (lowerResponse.includes('vérifié') || 
                 lowerResponse.includes('verified') || 
                 lowerResponse.includes('authentique')) {
            score = 85;
            verdict = 'VERIFIED';
            summary = 'Contenu vérifié et authentique';
        }
        // Probable/plutôt vrai
        else if (lowerResponse.includes('probable') || 
                 lowerResponse.includes('likely') || 
                 lowerResponse.includes('plutôt vrai')) {
            score = 65;
            verdict = 'MOSTLY_TRUE';
            summary = 'Contenu probablement véridique';
        }
        // Défaut pour contenu narratif (contes, fables)
        else if (lowerResponse.includes('histoire') || 
                 lowerResponse.includes('conte') || 
                 lowerResponse.includes('fable') ||
                 lowerResponse.includes('fiction')) {
            score = 50;
            verdict = 'MIXED';
            summary = 'Contenu narratif/divertissement - non factuel';
        }
        else {
            summary = 'Analyse en cours - résultat non concluant';
        }
        
        // Détecter les outils utilisés par Vera
        const toolsUsed = [];
        if (lowerResponse.includes('deepfake')) toolsUsed.push('Détection deepfake');
        if (lowerResponse.includes('synthetic') || lowerResponse.includes('synthétique')) toolsUsed.push('Détection contenu IA');
        if (lowerResponse.includes('forgery') || lowerResponse.includes('manipulation')) toolsUsed.push('Analyse forensique');
        if (lowerResponse.includes('speech') || lowerResponse.includes('voix')) toolsUsed.push('Analyse audio');
        
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
    async extractFromUrl(url) {
        try {
            // TikTok
            if (url.includes('tiktok.com')) {
                console.log('🎵 Détection TikTok');
                const videoData = await this.tiktokService.extractVideo(url);
                return { platform: 'tiktok', data: videoData };
            }
            
            // YouTube
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                console.log('▶️ Détection YouTube');
                const videoData = await this.youtubeService.extractVideo(url);
                return { platform: 'youtube', data: videoData };
            }
            
            // Instagram
            if (url.includes('instagram.com')) {
                console.log('📸 Détection Instagram');
                const videoData = await this.instagramService.extractPost(url);
                return { platform: 'instagram', data: videoData };
            }
            
            // URL d'image directe
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                return {
                    platform: 'image',
                    data: {
                        url: url,
                        type: 'image',
                        thumbnail_url: url
                    }
                };
            }
            
            // URL de vidéo directe
            if (url.match(/\.(mp4|mov|avi|webm)$/i)) {
                return {
                    platform: 'video',
                    data: {
                        url: url,
                        type: 'video',
                        download_url: url
                    }
                };
            }
            
            // URL générique (article, site web)
            return {
                platform: 'web',
                data: {
                    url: url,
                    type: 'url'
                }
            };
            
        } catch (error) {
            console.error('❌ Erreur extraction URL:', error.message);
            return {
                platform: 'unknown',
                data: { url: url, error: error.message }
            };
        }
    }
    
    /**
     * Vérifier un message texte simple (pour le chat web)
     * @param {string} message - Question de l'utilisateur
     * @param {string} conversationId - ID de conversation (non utilisé car Vera ne le supporte pas)
     * @param {Array} conversationHistory - Historique des messages pour le contexte
     * @param {Array} mediaUrls - URLs de médias à analyser
     * @param {Object} imageFile - Fichier image uploadé
     * @param {Object} videoFile - Fichier vidéo uploadé
     */
    async checkContent(message, conversationId = null, conversationHistory = [], mediaUrls = [], imageFile = null, videoFile = null) {
        try {
            if (!this.apiKey || this.apiKey === 'your_vera_api_key_here') {
                throw new Error('VERA_API_KEY non configurée');
            }

            // ==============================
            // ÉTAPE 1: RAG - RECHERCHE DE MÉMOIRE (DÉSACTIVÉ)
            // ==============================
            // RAG temporairement désactivé (quota API embeddings dépassé)
            let similarConversations = [];
            let ragContext = '';
            
            // Décommenter pour réactiver le RAG:
            /*
            try {
                const queryEmbedding = await embeddingService.generateEmbedding(message);
                const userId = conversationId || `web-user-${Date.now()}`;
                similarConversations = await vectorStoreService.searchSimilarConversations(
                    queryEmbedding,
                    null,
                    3,
                    0.75
                );
                
                if (similarConversations.length > 0) {
                    console.log(`🧠 RAG: ${similarConversations.length} conversations similaires trouvées`);
                    ragContext = '\n\n💾 MÉMOIRE (conversations similaires passées):\n';
                    similarConversations.forEach((conv, i) => {
                        ragContext += `\n[${i+1}] Similarité: ${(conv.similarity * 100).toFixed(1)}%\n`;
                        ragContext += `Q: ${conv.user_query}\n`;
                        ragContext += `R: ${conv.vera_response.substring(0, 200)}...\n`;
                    });
                    ragContext += '\n⚠️ Utilise ces conversations passées pour enrichir ta réponse si pertinent.\n';
                }
            } catch (ragError) {
                console.warn('⚠️ RAG non disponible:', ragError.message);
            }
            */

            // ==============================
            // ÉTAPE 2: EXTRACTION DES MÉDIAS
            // ==============================
            // Extraire les données des URLs de médias (TikTok, YouTube, Instagram)
            const extractedMedias = [];
            if (mediaUrls.length > 0) {
                console.log('🔍 Extraction des médias détectés...');
                for (const url of mediaUrls) {
                    const extracted = await this.extractFromUrl(url);
                    extractedMedias.push(extracted);
                }
            }

            // Si on a extrait des vidéos de plateformes, utiliser checkVideo
            const platformVideos = extractedMedias.filter(m => 
                ['tiktok', 'youtube', 'instagram'].includes(m.platform)
            );
            
            if (platformVideos.length > 0) {
                // Utiliser la logique complète du bot pour les vidéos de plateforme
                console.log(`📹 Analyse de ${platformVideos.length} vidéo(s) de plateforme`);
                const video = platformVideos[0];
                
                // WORKAROUND : Vera refuse d'analyser les URLs de médias
                // On analyse le contexte textuel uniquement (description, titre, hashtags)
                const videoData = video.data;
                const contextQuery = `Analyse ce contenu ${video.platform.toUpperCase()} et vérifie les informations factuelles:

📌 TITRE: ${videoData.title || 'Aucun titre'}
📝 DESCRIPTION: ${videoData.description || 'Aucune description'}
👤 AUTEUR: @${videoData.author || 'Inconnu'}
🏷️ HASHTAGS: ${videoData.hashtags?.join(', ') || 'Aucun'}

📊 POPULARITÉ:
- ${(videoData.views || 0).toLocaleString()} vues
- ${(videoData.likes || 0).toLocaleString()} likes
- ${(videoData.comments || 0).toLocaleString()} commentaires

🎯 TÂCHE:
1. Vérifie si les claims dans le titre/description sont vrais ou faux
2. Recherche des sources fiables sur le sujet
3. Détecte la désinformation potentielle dans le texte
4. Évalue la crédibilité de l'auteur si possible

Note: L'analyse visuelle de la vidéo n'est pas disponible pour le moment.`;

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

            // Sinon, continuer avec la logique du chat simple
            // Construire le contexte avec l'historique
            let contextualQuery = message;
            if (conversationHistory.length > 0) {
                const lastMessages = conversationHistory.slice(-3); // 3 derniers messages
                const context = lastMessages.map(msg => 
                    `${msg.sender === 'user' ? 'Utilisateur' : 'Vera'}: ${msg.content}`
                ).join('\n');
                
                contextualQuery = `Contexte de la conversation:\n${context}\n\nNouvelle question: ${message}`;
            }
            
            // Ajouter le contexte RAG s'il existe
            if (ragContext) {
                contextualQuery += ragContext;
            }

            // Ajouter les URLs de médias si présentes avec format détaillé
            if (mediaUrls.length > 0) {
                // Détecter le type de média par l'URL
                const videoUrls = mediaUrls.filter(url => 
                    url.includes('youtube.com') || 
                    url.includes('youtu.be') || 
                    url.includes('tiktok.com') || 
                    url.includes('instagram.com') ||
                    url.includes('.mp4') ||
                    url.includes('.mov') ||
                    url.includes('.avi')
                );
                
                const imageUrls = mediaUrls.filter(url => 
                    url.includes('.jpg') || 
                    url.includes('.jpeg') || 
                    url.includes('.png') || 
                    url.includes('.gif') ||
                    url.includes('.webp')
                );
                
                const otherUrls = mediaUrls.filter(url => 
                    !videoUrls.includes(url) && !imageUrls.includes(url)
                );

                contextualQuery += '\n\n';
                
                if (videoUrls.length > 0) {
                    videoUrls.forEach((url, i) => {
                        contextualQuery += `📹 VIDÉO ${i+1} À ANALYSER: ${url}\n`;
                    });
                }
                
                if (imageUrls.length > 0) {
                    imageUrls.forEach((url, i) => {
                        contextualQuery += `🖼️ IMAGE ${i+1} À ANALYSER: ${url}\n`;
                    });
                }
                
                if (otherUrls.length > 0) {
                    otherUrls.forEach((url, i) => {
                        contextualQuery += `🔗 LIEN ${i+1} À VÉRIFIER: ${url}\n`;
                    });
                }

                contextualQuery += `\n⚠️ IMPORTANT: Utilise tes outils Vera.ai pour analyser ces médias:
- Video Deepfake Detection → analyse les vidéos pour détecter les deepfakes
- Synthetic Image Detection → détecte si les images sont générées par IA
- Image Forgery and Localization → détecte les manipulations dans les images
- Synthetic Speech Detection → analyse l'audio pour détecter les voix synthétiques
- TruFor → analyse forensique complète des médias
- Web Search → vérifie les informations sur le web

🎯 ANALYSE REQUISE:
1. Analyse chaque média avec tes outils appropriés
2. Vérifie l'authenticité (deepfake, manipulation, IA)
3. Vérifie les claims factuels dans le contenu
4. Détecte la désinformation potentielle
5. Fournis des sources fiables pour tes vérifications

Réponds avec un verdict clair et des preuves de tes outils.`;
            }

            // Si fichiers uploadés, indiquer leur présence
            if (imageFile) {
                contextualQuery += `\n\n🖼️ Image uploadée: ${imageFile.filename} (${(imageFile.size / 1024).toFixed(2)} KB)`;
                contextualQuery += '\n⚠️ Note: L\'analyse de fichiers locaux nécessite une URL publique. Demande à l\'utilisateur de partager un lien.';
            }
            if (videoFile) {
                contextualQuery += `\n\n🎬 Vidéo uploadée: ${videoFile.filename} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`;
                contextualQuery += '\n⚠️ Note: L\'analyse de fichiers locaux nécessite une URL publique. Demande à l\'utilisateur de partager un lien.';
            }

            // Payload avec metadata (comme le bot TikTok)
            const payload = {
                userId: `web-user-${Date.now()}`,
                query: contextualQuery
            };

            // Ajouter metadata si URLs présentes
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
                responseType: 'text',  // Comme le bot TikTok
                timeout: 120000 // 2 minutes pour l'analyse de médias
            });

            if (!response.data) {
                throw new Error('Pas de réponse de l\'API Vera');
            }

            // Parser la réponse Vera
            const result = this.parseVeraResponse(response.data);

            // ==============================
            // ÉTAPE 3: RAG - STOCKAGE (DÉSACTIVÉ)
            // ==============================
            // Stockage RAG temporairement désactivé (quota embeddings dépassé)
            
            // Décommenter pour réactiver le stockage:
            /*
            try {
                const userId = conversationId || `web-user-${Date.now()}`;
                const veraResponseText = typeof result === 'string' ? result : 
                                        result.summary || result.message || JSON.stringify(result);
                const conversationText = embeddingService.prepareConversationText(message, veraResponseText);
                const conversationEmbedding = await embeddingService.generateEmbedding(conversationText);
                
                await vectorStoreService.storeConversation(
                    userId,
                    message,
                    veraResponseText,
                    conversationEmbedding,
                    {
                        media_urls: mediaUrls,
                        has_files: !!(imageFile || videoFile),
                        platform_videos: extractedMedias.length,
                        similar_conversations_used: similarConversations.length
                    }
                );
                
                console.log('✅ Conversation stockée dans la mémoire RAG');
            } catch (storageError) {
                console.warn('⚠️ Stockage RAG échoué:', storageError.message);
            }
            */

            return result;

        } catch (error) {
            return {
                error: true,
                message: error.message,
                summary: 'Impossible de vérifier cette information pour le moment.'
            };
        }
    }

    /**
     * Parser la réponse de Vera pour extraire le statut et les sources
     */
    parseVeraResponse(data) {
        // Si data est un string direct, l'utiliser
        // Sinon chercher dans data.response, data.answer, etc.
        let response = '';
        if (typeof data === 'string') {
            response = data;
        } else {
            response = data.response || data.answer || data.message || '';
        }
        
        // Détecter le statut
        let status = 'verified';
        if (response.match(/faux|incorrect|désinformation|fake|réfuté/i)) {
            status = 'false';
        } else if (response.match(/partiellement|mitigé|nuancé/i)) {
            status = 'mixed';
        } else if (response.match(/non vérifié|impossible de vérifier|pas accéder/i)) {
            status = 'unverified';
        }

        // Extraire les sources avec leurs contextes
        const sources = [];
        // Pattern pour trouver "Selon X, ... (URL)"
        const sourcePattern = /[Ss]elon ([^,]+),.*?\(?(https?:\/\/[^\s\)]+)\)?/g;
        let match;
        
        while ((match = sourcePattern.exec(response)) !== null) {
            const outlet = match[1].trim();
            const url = match[2].trim();
            sources.push({
                title: outlet,
                url: url,
                outlet: outlet
            });
        }

        // Si pas de sources avec "Selon", extraire toutes les URLs
        if (sources.length === 0) {
            const urlRegex = /https?:\/\/[^\s\)]+/g;
            const urls = response.match(urlRegex) || [];
            
            urls.forEach(url => {
                sources.push({
                    title: this.extractDomain(url),
                    url: url,
                    outlet: this.extractDomain(url)
                });
            });
        }

        return {
            status,
            summary: response,
            sources: sources.slice(0, 5), // Max 5 sources
            confidence: this.calculateConfidence(response, sources.length),
            conversationId: data.conversation_id || data.conversationId // Retourner l'ID de conversation
        };
    }

    /**
     * Extraire le domaine d'une URL
     */
    extractDomain(url) {
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
    calculateConfidence(response, sourcesCount) {
        let confidence = 50;
        
        if (sourcesCount > 0) confidence += 10;
        if (sourcesCount > 2) confidence += 10;
        if (response.length > 200) confidence += 10;
        if (response.match(/selon|d'après|source|étude/gi)) confidence += 10;
        
        return Math.min(confidence, 95);
    }
    
    /**
     * Extraire le contenu textuel d'une vidéo pour analyse
     */
    extractTextContent(videoData) {
        const parts = [];
        
        if (videoData.title) parts.push(videoData.title);
        if (videoData.description) parts.push(videoData.description);
        if (videoData.hashtags && videoData.hashtags.length > 0) {
            parts.push(`Hashtags: ${videoData.hashtags.join(', ')}`);
        }
        
        return parts.join('\n\n');
    }
}

module.exports = new VeraService();
