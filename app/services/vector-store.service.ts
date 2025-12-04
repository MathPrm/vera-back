// import { createClient, SupabaseClient } from '@supabase/supabase-js';

// interface Conversation {
//   id?: string;
//   user_id: string;
//   user_query: string;
//   vera_response: string;
//   embedding: number[];
//   metadata?: Record<string, any>;
//   created_at: string;
//   similarity?: number;
// }

// class VectorStoreService {
//   private supabase: SupabaseClient;

//   constructor() {
//     if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
//       throw new Error('SUPABASE_URL et SUPABASE_KEY requis dans .env');
//     }

//     this.supabase = createClient(
//       process.env.SUPABASE_URL,
//       process.env.SUPABASE_KEY
//     );
//   }

//   /**
//    * Stocke une conversation avec son embedding
//    * @param userId - ID de l'utilisateur
//    * @param userQuery - Question posée
//    * @param veraResponse - Réponse de Vera
//    * @param embedding - Vecteur d'embedding (768D pour Gemini)
//    * @param metadata - Métadonnées additionnelles (optionnel)
//    * @returns Conversation créée
//    */
//   async storeConversation(
//     userId: string,
//     userQuery: string,
//     veraResponse: string,
//     embedding: number[],
//     metadata: Record<string, any> = {}
//   ): Promise<Conversation> {
//     try {
//       const { data, error } = await this.supabase
//         .from('conversations')
//         .insert([
//           {
//             user_id: userId,
//             user_query: userQuery,
//             vera_response: veraResponse,
//             embedding: embedding,
//             metadata: metadata,
//             created_at: new Date().toISOString()
//           }
//         ])
//         .select();

//       if (error) throw error;
//       if (!data || data.length === 0) throw new Error('Aucune donnée retournée');

//       return data[0];
//     } catch (error: any) {
//       console.error('Erreur stockage conversation:', error.message);
//       throw new Error(`Échec stockage: ${error.message}`);
//     }
//   }

//   /**
//    * Recherche les conversations similaires par similarité vectorielle
//    * @param queryEmbedding - Vecteur de la requête actuelle
//    * @param userId - ID utilisateur (optionnel, pour filtrer)
//    * @param limit - Nombre de résultats (défaut: 5)
//    * @param threshold - Seuil de similarité minimum (0-1, défaut: 0.7)
//    * @returns Conversations similaires triées par pertinence
//    */
//   async searchSimilarConversations(
//     queryEmbedding: number[],
//     userId: string | null = null,
//     limit: number = 5,
//     threshold: number = 0.7
//   ): Promise<Conversation[]> {
//     try {
//       // Utilisation de la fonction RPC pour la recherche vectorielle
//       let query = this.supabase.rpc('match_conversations', {
//         query_embedding: queryEmbedding,
//         match_threshold: threshold,
//         match_count: limit
//       });

//       // Filtrer par userId si fourni
//       if (userId) {
//         query = query.eq('user_id', userId);
//       }

//       const { data, error } = await query;

//       if (error) throw error;

//       return data || [];
//     } catch (error: any) {
//       console.error('Erreur recherche similaire:', error.message);
//       throw new Error(`Échec recherche: ${error.message}`);
//     }
//   }

//   /**
//    * Récupère l'historique complet d'un utilisateur
//    * @param userId - ID utilisateur
//    * @param limit - Nombre de conversations (défaut: 50)
//    * @returns Historique des conversations
//    */
//   async getUserHistory(userId: string, limit: number = 50): Promise<Conversation[]> {
//     try {
//       const { data, error } = await this.supabase
//         .from('conversations')
//         .select('*')
//         .eq('user_id', userId)
//         .order('created_at', { ascending: false })
//         .limit(limit);

//       if (error) throw error;

//       return data || [];
//     } catch (error: any) {
//       console.error('Erreur récupération historique:', error.message);
//       throw new Error(`Échec récupération: ${error.message}`);
//     }
//   }

//   /**
//    * Supprime les anciennes conversations (nettoyage)
//    * @param daysOld - Supprimer conversations plus vieilles que X jours
//    * @returns Nombre de conversations supprimées
//    */
//   async cleanOldConversations(daysOld: number = 90): Promise<number> {
//     try {
//       const cutoffDate = new Date();
//       cutoffDate.setDate(cutoffDate.getDate() - daysOld);

//       const { data, error } = await this.supabase
//         .from('conversations')
//         .delete()
//         .lt('created_at', cutoffDate.toISOString())
//         .select();

//       if (error) throw error;

//       return data ? data.length : 0;
//     } catch (error: any) {
//       console.error('Erreur nettoyage conversations:', error.message);
//       throw new Error(`Échec nettoyage: ${error.message}`);
//     }
//   }

//   /**
//    * Récupère une conversation spécifique par ID
//    * @param conversationId - ID de la conversation
//    * @returns Conversation
//    */
//   async getConversation(conversationId: string): Promise<Conversation> {
//     try {
//       const { data, error } = await this.supabase
//         .from('conversations')
//         .select('*')
//         .eq('id', conversationId)
//         .single();

//       if (error) throw error;

//       return data;
//     } catch (error: any) {
//       console.error('Erreur récupération conversation:', error.message);
//       throw new Error(`Échec récupération: ${error.message}`);
//     }
//   }
// }

// // Export singleton
// export default new VectorStoreService();
