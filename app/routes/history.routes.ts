import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Toutes ces routes nécessitent une authentification
router.use(verifyToken);

// Récupérer l'historique
router.get('/', HistoryController.getHistory);

// Créer une nouvelle conversation
router.post('/conversations', HistoryController.createConversation);

// Sauvegarder une conversation complète (migration localStorage)
router.post('/conversations/save', HistoryController.saveConversation);

// Récupérer une conversation spécifique
router.get('/conversations/:conversationId', HistoryController.getConversation);

// Ajouter un message à une conversation
router.post('/conversations/:conversationId/messages', HistoryController.addMessage);

// Supprimer une conversation
router.delete('/conversations/:conversationId', HistoryController.deleteConversation);

// Effacer tout l'historique
router.delete('/clear', HistoryController.clearHistory);

export default router;
