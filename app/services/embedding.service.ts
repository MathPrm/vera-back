import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

type EmbeddingProvider = 'OPENAI' | 'GEMINI';

class EmbeddingService {
  private provider: EmbeddingProvider;
  private disabled: boolean = false;
  private dimensions: number;
  private genAI?: GoogleGenerativeAI;
  private model?: any;

  constructor() {
    // Déterminer le provider (OPENAI ou GEMINI)
    this.provider = (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || 'OPENAI';
    
    if (this.provider === 'OPENAI') {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️ OPENAI_API_KEY non définie - Service d\'embedding désactivé');
        this.disabled = true;
        this.dimensions = 0;
        return;
      }
      this.dimensions = 1536; // OpenAI text-embedding-ada-002
      console.log('🤖 Embedding Service: OpenAI (1536D)');
    } else if (this.provider === 'GEMINI') {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY non définie - Service d\'embedding désactivé');
        this.disabled = true;
        this.dimensions = 0;
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
   * @param text - Le texte à convertir en vecteur
   * @returns Vecteur d'embeddings (1536D pour OpenAI, 768D pour Gemini)
   */
  async generateEmbedding(text: string): Promise<number[]> {
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
    } catch (error: any) {
      console.error('Erreur génération embedding:', error.message);
      throw new Error(`Échec génération embedding: ${error.message}`);
    }
  }

  /**
   * Génère un embedding avec OpenAI
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
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
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    if (!this.model) {
      throw new Error('Modèle Gemini non initialisé');
    }
    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Génère des embeddings pour plusieurs textes en batch
   * @param texts - Tableau de textes
   * @returns Tableau de vecteurs
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!Array.isArray(texts)) {
      throw new Error('texts doit être un tableau');
    }

    try {
      const embeddings = await Promise.all(
        texts.map(text => this.generateEmbedding(text))
      );
      return embeddings;
    } catch (error: any) {
      console.error('Erreur génération embeddings batch:', error.message);
      throw error;
    }
  }

  /**
   * Prépare le texte d'une conversation pour l'embedding
   * @param userQuery - Question de l'utilisateur
   * @param veraResponse - Réponse de Vera
   * @returns Texte combiné optimisé pour l'embedding
   */
  prepareConversationText(userQuery: string, veraResponse: string): string {
    // Combine query + réponse pour un embedding plus riche
    return `Question: ${userQuery}\n\nRéponse: ${veraResponse}`;
  }
}

// Export singleton
export default new EmbeddingService();
