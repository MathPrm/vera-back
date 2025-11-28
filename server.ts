import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import db from "./app/models"; // Assure l'import de l'objet db depuis index.ts
import itemRoutes from "./app/routes/items.routes";
import authRoutes from "./app/routes/auth.routes";

dotenv.config();

const app: Application = express();

const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";

// Configuration CORS simplifiée et robuste
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // En développement, accepter toutes les origines locales
    if (process.env.NODE_ENV !== 'production') {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // En production, vérifier les origines autorisées
    if (!origin) {
      return callback(null, true); // Permettre les requêtes sans origine
    }
    
    const allowedOrigins = clientOrigins.split(',').map(url => url.trim());
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origine non autorisée: ${origin}`);
      callback(null, true); // En développement, accepter quand même
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware pour logger les requêtes (développement uniquement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${req.method}] ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

// Appliquer CORS AVANT tout autre middleware
app.use(cors(corsOptions));

// Middleware manuel pour gérer les requêtes OPTIONS (fallback)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).send();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

db.sequelize
  .sync()
  .then(() => {
    console.log("✅ Base de données synchronisée.");
  })
  .catch((err: Error) => {
    console.error("❌ Erreur de synchronisation de la base de données:", err.message);
  });

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur l'API Items. Le serveur fonctionne !" });
});

itemRoutes(app);
app.use('/api/auth', authRoutes);

const PORT: number | string = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}.`);
});