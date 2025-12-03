const { GoogleGenerativeAI } = require('@google/generative-ai');

class EmbeddingService {
  constructor() {
    // Déterminer le provider (OPENAI ou GEMINI)
    this.provider = process.env.EMBEDDING_PROVIDER || 'OPENAI'; // Défaut: OpenAI
    
    if (this.provider === 'OPENAI') {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY non définie - Service d\'embedding désactivé');
        this.disabled = true;
        return;
      }
      this.dimensions = 1536; // OpenAI text-embedding-ada-002
      console.log('🤖 Embedding Service: OpenAI (1536D)');
    } else if (this.provider === 'GEMINI') {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY non définie - Service d\'embedding désactivé');
        this.disabled = true;
        return;
      }
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
      this.dimensions = 768; // Gemini embedding-001
      console.log('🤖 Embedding Service: Gemini (768D)');
    } else {
      throw new Error(`Provider inconnu: ${this.provider}. Utiliser OPENAI ou GEMINI`);
    }
  }

  /**
   * Génère un embedding vectoriel pour un texte donné
   * @param {string} text - Le texte à convertir en vecteur
   * @returns {Promise<number[]>} - Vecteur d'embeddings (1536D pour OpenAI, 768D pour Gemini)
   */
  async generateEmbedding(text) {
    if (this.disabled) {
      console.warn('⚠️ Embedding Service désactivé - Retour d\'un vecteur vide');
      return [];
    }

    if (!text || typeof text !== 'string') {
      throw new Error('Le texte doit être une chaîne non vide');
    }

    try {
      if (this.provider === 'OPENAI') {
        return await this.generateOpenAIEmbedding(text);
      } else {
        return await this.generateGeminiEmbedding(text);
      }
    } catch (error) {
      console.error('Erreur génération embedding:', error.message);
      throw new Error(`Échec génération embedding: ${error.message}`);
    }
  }

  /**
   * Génère un embedding avec OpenAI
   */
  async generateOpenAIEmbedding(text) {
    const axios = require('axios');
    
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        model: 'text-embedding-ada-002',
        input: text
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].embedding;
  }

  /**
   * Génère un embedding avec Gemini
   */
  async generateGeminiEmbedding(text) {
    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Génère des embeddings pour plusieurs textes en batch
   * @param {string[]} texts - Tableau de textes
   * @returns {Promise<number[][]>} - Tableau de vecteurs
   */
  async generateEmbeddings(texts) {
    if (!Array.isArray(texts)) {
      throw new Error('texts doit être un tableau');
    }

    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error) {
      console.error('Erreur génération embeddings batch:', error.message);
      throw error;
    }
  }

  /**
   * Prépare le texte d'une conversation pour l'embedding
   * @param {string} userQuery - Question de l'utilisateur
   * @param {string} veraResponse - Réponse de Vera
   * @returns {string} - Texte combiné optimisé pour l'embedding
   */
  prepareConversationText(userQuery, veraResponse) {
    // Combine query + réponse pour un embedding plus riche
    return `Question: ${userQuery}\n\nRéponse: ${veraResponse}`;
  }
}

// Export singleton
module.exports = new EmbeddingService();
