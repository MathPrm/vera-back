import { Request, Response } from 'express';
import db from '../models';

const UserConversation = db.UserConversation;
const ConversationMessage = db.ConversationMessage;
const User = db.User;

export class HistoryController {
  /**
   * Récupérer l'historique des conversations de l'utilisateur
   */
  static async getHistory(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const limit = parseInt(req.query.limit as string) || 20;

      const conversations = await UserConversation.findAll({
        where: { 
          userId,
          isDeleted: false 
        },
        include: [{
          model: ConversationMessage,
          as: 'messages',
          order: [['created_at', 'ASC']],
          limit: 10 // Limiter les messages par conversation pour la liste
        }],
        order: [['updated_at', 'DESC']],
        limit
      });

      return res.json({ 
        success: true, 
        conversations 
      });

    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de l\'historique' 
      });
    }
  }

  /**
   * Récupérer une conversation spécifique avec tous ses messages
   */
  static async getConversation(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { conversationId } = req.params;

      const conversation = await UserConversation.findOne({
        where: { 
          id: conversationId,
          userId,
          isDeleted: false
        },
        include: [{
          model: ConversationMessage,
          as: 'messages',
          order: [['created_at', 'ASC']]
        }]
      });

      if (!conversation) {
        return res.status(404).json({ 
          success: false,
          message: 'Conversation non trouvée' 
        });
      }

      return res.json({ 
        success: true, 
        conversation 
      });

    } catch (error) {
      console.error('Erreur récupération conversation:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la récupération de la conversation' 
      });
    }
  }

  /**
   * Créer une nouvelle conversation
   */
  static async createConversation(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { title, firstMessage } = req.body;

      const conversation = await UserConversation.create({
        userId,
        title: title || 'Nouvelle conversation'
      });

      // Ajouter le premier message si fourni
      if (firstMessage) {
        await ConversationMessage.create({
          conversationId: conversation.id,
          sender: 'user',
          content: firstMessage,
          mediaUrls: []
        });
      }

      return res.status(201).json({ 
        success: true, 
        conversation 
      });

    } catch (error) {
      console.error('Erreur création conversation:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la création de la conversation' 
      });
    }
  }

  /**
   * Ajouter un message à une conversation
   */
  static async addMessage(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { conversationId } = req.params;
      const { sender, content, mediaUrls } = req.body;

      // Vérifier que la conversation appartient à l'utilisateur
      const conversation = await UserConversation.findOne({
        where: { 
          id: conversationId,
          userId 
        }
      });

      if (!conversation) {
        return res.status(404).json({ 
          success: false,
          message: 'Conversation non trouvée' 
        });
      }

      const message = await ConversationMessage.create({
        conversationId,
        sender,
        content,
        mediaUrls: mediaUrls || []
      });

      // Mettre à jour le titre si c'est le premier message utilisateur
      if (sender === 'user' && (!conversation.title || conversation.title === 'Nouvelle conversation')) {
        await conversation.update({ 
          title: content.substring(0, 100) 
        });
      }

      return res.status(201).json({ 
        success: true, 
        message 
      });

    } catch (error) {
      console.error('Erreur ajout message:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'ajout du message' 
      });
    }
  }

  /**
   * Supprimer une conversation (soft delete)
   */
  static async deleteConversation(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { conversationId } = req.params;

      const conversation = await UserConversation.findOne({
        where: { 
          id: conversationId,
          userId 
        }
      });

      if (!conversation) {
        return res.status(404).json({ 
          success: false,
          message: 'Conversation non trouvée' 
        });
      }

      await conversation.update({ isDeleted: true });

      return res.json({ 
        success: true,
        message: 'Conversation supprimée' 
      });

    } catch (error) {
      console.error('Erreur suppression conversation:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la suppression de la conversation' 
      });
    }
  }

  /**
   * Effacer tout l'historique de l'utilisateur
   */
  static async clearHistory(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;

      await UserConversation.update(
        { isDeleted: true },
        { where: { userId } }
      );

      return res.json({ 
        success: true,
        message: 'Historique effacé' 
      });

    } catch (error) {
      console.error('Erreur effacement historique:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'effacement de l\'historique' 
      });
    }
  }

  /**
   * Sauvegarder une conversation complète (pour migration depuis localStorage)
   */
  static async saveConversation(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { title, messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Messages requis' 
        });
      }

      // Créer la conversation
      const conversation = await UserConversation.create({
        userId,
        title: title || messages[0].content.substring(0, 100)
      });

      // Ajouter tous les messages
      const messagePromises = messages.map((msg: any) => 
        ConversationMessage.create({
          conversationId: conversation.id,
          sender: msg.sender,
          content: msg.content,
          mediaUrls: msg.mediaUrls || []
        })
      );

      await Promise.all(messagePromises);

      return res.status(201).json({ 
        success: true,
        conversation,
        message: 'Conversation sauvegardée' 
      });

    } catch (error) {
      console.error('Erreur sauvegarde conversation:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la sauvegarde de la conversation' 
      });
    }
  }
}
