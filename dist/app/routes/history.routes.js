"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const history_controller_1 = require("../controllers/history.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Toutes ces routes nécessitent une authentification
router.use(auth_middleware_1.verifyToken);
// Récupérer l'historique
router.get('/', history_controller_1.HistoryController.getHistory);
// Créer une nouvelle conversation
router.post('/conversations', history_controller_1.HistoryController.createConversation);
// Sauvegarder une conversation complète (migration localStorage)
router.post('/conversations/save', history_controller_1.HistoryController.saveConversation);
// Récupérer une conversation spécifique
router.get('/conversations/:conversationId', history_controller_1.HistoryController.getConversation);
// Ajouter un message à une conversation
router.post('/conversations/:conversationId/messages', history_controller_1.HistoryController.addMessage);
// Supprimer une conversation
router.delete('/conversations/:conversationId', history_controller_1.HistoryController.deleteConversation);
// Effacer tout l'historique
router.delete('/clear', history_controller_1.HistoryController.clearHistory);
exports.default = router;
//# sourceMappingURL=history.routes.js.map