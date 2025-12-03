const express = require('express');
const router = express.Router();
const embeddingService = require('../services/embedding.service');
const vectorStoreService = require('../services/vector-store.service');

/**
 * GET /api/memory/history/:userId
 * Récupère l'historique des conversations d'un utilisateur
 */
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const history = await vectorStoreService.getUserHistory(userId, limit);

        res.json({
            success: true,
            count: history.length,
            conversations: history
        });
    } catch (error) {
        console.error('Erreur récupération historique:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/memory/search
 * Recherche des conversations similaires à une query
 */
router.post('/search', async (req, res) => {
    try {
        const { query, userId, limit = 5, threshold = 0.7 } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'query requis'
            });
        }

        // Générer l'embedding de la query
        const queryEmbedding = await embeddingService.generateEmbedding(query);

        // Rechercher les conversations similaires
        const similar = await vectorStoreService.searchSimilarConversations(
            queryEmbedding,
            userId,
            limit,
            threshold
        );

        res.json({
            success: true,
            query: query,
            count: similar.length,
            conversations: similar
        });
    } catch (error) {
        console.error('Erreur recherche similaire:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/memory/conversation/:id
 * Récupère une conversation spécifique par ID
 */
router.get('/conversation/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const conversation = await vectorStoreService.getConversation(id);

        res.json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Erreur récupération conversation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/memory/cleanup
 * Nettoie les vieilles conversations (admin seulement)
 */
router.post('/cleanup', async (req, res) => {
    try {
        const { daysOld = 90 } = req.body;

        const deletedCount = await vectorStoreService.cleanOldConversations(daysOld);

        res.json({
            success: true,
            message: `${deletedCount} conversations supprimées`,
            deletedCount
        });
    } catch (error) {
        console.error('Erreur nettoyage:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/memory/stats
 * Statistiques globales sur la mémoire RAG
 */
router.get('/stats', async (req, res) => {
    try {
        // Cette fonction doit être ajoutée dans vector-store.service.js
        const stats = {
            message: 'Stats disponibles via SQL: SELECT * FROM get_conversation_stats();'
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
