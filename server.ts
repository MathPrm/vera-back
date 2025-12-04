import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import db from "./app/models"; // Assure l'import de l'objet db depuis index.ts
import itemRoutes from "./app/routes/items.routes";
import authRoutes from "./app/routes/auth.routes";

dotenv.config();

const app: Application = express();

const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";

// Configuration CORS simplifiée - très permissive en développement
const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // En développement, accepter toutes les origines
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En production, vérifier les origines autorisées
    const allowedOrigins = clientOrigins.split(',').map(url => url.trim());
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  optionsSuccessStatus: 200
};

// Appliquer CORS en PREMIER, avant tout autre middleware
app.use(cors(corsOptions));

// Middleware pour logger les requêtes (développement uniquement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${req.method}] ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Synchronisation de la base de données (ne bloque pas le démarrage du serveur)
db.sequelize
  .sync()
  .then(() => {
    console.log("✅ Base de données synchronisée.");
  })
  .catch((err: Error) => {
    console.error("❌ Erreur de synchronisation de la base de données:", err.message);
    // Ne pas arrêter le serveur, juste logger l'erreur
    console.warn("⚠️ Le serveur continue de fonctionner malgré l'erreur de synchronisation.");
  });

// Gestion globale des erreurs non capturées (AVANT le démarrage du serveur)
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Erreur non capturée:', error);
  // Ne pas arrêter le serveur, juste logger l'erreur
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  // Ne pas arrêter le serveur, juste logger l'erreur
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur l'API Items. Le serveur fonctionne !" });
});

itemRoutes(app);
app.use('/api/auth', authRoutes);

// Middleware de gestion d'erreurs global (DOIT être APRÈS toutes les routes)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erreur dans le middleware:', err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

const PORT: number | string = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}.`);
  console.log(`📡 API disponible sur http://localhost:${PORT}`);
}).on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé.`);
    console.error(`💡 Solutions:`);
    console.error(`   1. Arrêter le processus qui utilise le port: npx kill-port ${PORT}`);
    console.error(`   2. Ou changer le port dans le fichier .env: PORT=3001`);
    console.error(`   3. Ou trouver et arrêter le processus manuellement`);
    // Ne pas arrêter nodemon, juste attendre
    return;
  } else {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Signal SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement.');
    process.exit(0);
  });
});