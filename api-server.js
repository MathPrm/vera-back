const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config();

// Importer le service Vera local (avec checkContent)
const veraService = require('./app/services/vera.service');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Configurer multer pour l'upload de fichiers
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Middleware
app.use(cors());
app.use(express.json());

// Middleware conditionnel pour multer (seulement si multipart/form-data)
const conditionalUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }])(req, res, next);
  } else {
    next();
  }
};

// Routes
app.post('/api/chat', conditionalUpload, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message invalide' });
    }
    
    // Récupérer l'historique de conversation (peut être string si FormData ou objet si JSON)
    let conversationHistory = req.body.conversationHistory || [];
    if (typeof conversationHistory === 'string') {
      try {
        conversationHistory = JSON.parse(conversationHistory);
      } catch (e) {
        conversationHistory = [];
      }
    }
    
    // Récupérer les URLs de médias (peut être string si FormData ou tableau si JSON)
    let mediaUrls = req.body.mediaUrls || [];
    if (typeof mediaUrls === 'string') {
      try {
        mediaUrls = JSON.parse(mediaUrls);
      } catch (e) {
        mediaUrls = [];
      }
    }
    
    // Récupérer les fichiers uploadés
    const imageFile = req.files?.['image']?.[0];
    const videoFile = req.files?.['video']?.[0];

    // Utiliser le service Vera avec le contexte et les médias
    const result = await veraService.checkContent(
      message, 
      null, 
      conversationHistory,
      mediaUrls,
      imageFile,
      videoFile
    );
    
    // Supprimer les fichiers temporaires après traitement
    if (imageFile) {
      fs.unlinkSync(imageFile.path);
    }
    if (videoFile) {
      fs.unlinkSync(videoFile.path);
    }

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
