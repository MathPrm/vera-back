import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./app/models"; 
import itemRoutes from "./app/routes/items.routes";
<<<<<<< HEAD
import authRoutes from "./app/routes/auth.routes";
=======
import surveyRoutes from "./app/routes/survey.routes"; 
>>>>>>> dashboard-google-form

dotenv.config();
const app: Application = express();

const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";
<<<<<<< HEAD

// Configuration CORS simplifiée et robuste
=======
>>>>>>> dashboard-google-form
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
<<<<<<< HEAD

// Middleware pour logger les requêtes (développement uniquement)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${req.method}] ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
  });
}

// Appliquer CORS AVANT tout autre middleware
=======
>>>>>>> dashboard-google-form
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

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

io.on('connection', (socket) => {
  console.log('🔌 Un client est connecté au Socket : ' + socket.id);
  socket.on('disconnect', () => { console.log('Client déconnecté'); });
});

db.sequelize

  .sync({ alter: true }) 
  .then(() => {
<<<<<<< HEAD
    console.log("✅ Base de données synchronisée.");
  })
  .catch((err: Error) => {
    console.error("❌ Erreur de synchronisation de la base de données:", err.message);
=======
    console.log("Base de données synchronisée (Structure mise à jour).");
  })
  .catch((err: Error) => {
    console.error("Erreur de synchronisation :", err.message);
>>>>>>> dashboard-google-form
  });


app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Vera opérationnelle." });
});

itemRoutes(app);
<<<<<<< HEAD
app.use('/api/auth', authRoutes);
=======
surveyRoutes(app); 

app.post('/api/webhook/form', async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    console.log('🔔 Webhook reçu.');

    const newResponseData = {
      content: rawData,
      date: new Date()
    };

    const savedResponse = await db.surveyResponses.create(newResponseData);
    console.log("✅ Donnée sauvegardée (JSON) ID :", savedResponse.id);

    io.emit('new-form-response', savedResponse);

    res.status(200).send({ message: 'Sauvegardé' });

  } catch (error: any) {
    console.error("❌ Erreur de sauvegarde :", error.message);
    res.status(500).send({ error: error.message });
  }
});
>>>>>>> dashboard-google-form

const PORT: number | string = process.env.PORT || 3000;
httpServer.listen(PORT, () => { console.log(`Serveur démarré sur le port ${PORT}.`); });