const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Charger d'abord les variables d'environnement du bot (pour VERA_API_KEY)
dotenv.config({ path: path.join(__dirname, '../tiktok-factchecker-bot/.env') });

// Puis charger celles de vera-back (pour API_PORT, etc)
dotenv.config();

// Importer le service Vera local (avec checkContent)
const veraService = require('./app/services/vera.service');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message invalide' });
    }

    console.log(`[API] Question reçue: "${message}"`);
    
    // Récupérer l'historique de conversation
    const conversationHistory = req.body.conversationHistory || [];

    // Utiliser le service Vera avec le contexte
    const result = await veraService.checkContent(message, null, conversationHistory);

    console.log(`[API] Résultat:`, result);

    res.json({
      response: result.summary || result.response || "Pas de réponse disponible",
      result: {
        status: result.status || 'unverified',
        summary: result.summary || '',
        sources: result.sources || [],
        confidence: result.confidence || 50
      }
    });

  } catch (error) {
    console.error('[API] Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur lors du traitement de votre demande',
      response: "Désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?"
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function formatResponse(result) {
  if (!result || result.error) {
    return {
      text: "Je n'ai pas pu vérifier cette information. Pouvez-vous reformuler votre question ?"
    };
  }

  let text = '';

  // Statut
  switch(result.status) {
    case 'verified':
      text = '✓ **Information vérifiée**\n\n';
      break;
    case 'false':
      text = '✗ **Information fausse**\n\n';
      break;
    case 'mixed':
      text = '~ **Information partiellement vraie**\n\n';
      break;
    default:
      text = '? **Information non vérifiée**\n\n';
  }

  // Résumé
  if (result.summary) {
    text += result.summary + '\n\n';
  }

  // Sources
  if (result.sources && result.sources.length > 0) {
    text += '📚 **Sources consultées** :\n';
    result.sources.slice(0, 3).forEach((source, index) => {
      text += `${index + 1}. ${source.title}\n`;
    });
  }

  return { text };
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`[API] Serveur démarré sur http://localhost:${PORT}`);
  console.log(`[API] Endpoints:`);
  console.log(`  - POST http://localhost:${PORT}/api/chat`);
  console.log(`  - GET  http://localhost:${PORT}/api/health`);
});

module.exports = app;
