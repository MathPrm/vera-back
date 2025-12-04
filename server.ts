import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "./app/models"; 
import itemRoutes from "./app/routes/items.routes";
import verificationRoutes from "./app/routes/verifications.routes";
import verifyRoutes from "./app/routes/verify.routes";
import authRoutes from "./app/routes/auth.routes";
import surveyRoutes from "./app/routes/survey.routes";
import historyRoutes from "./app/routes/history.routes";
import veraService from "./app/services/vera.service";

interface VeraResult {
  summary?: string;
  response?: string;
  message?: string;
  status?: string;
  sources?: any[];
  confidence?: number;
  explanation?: string;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

dotenv.config();
const app: Application = express();

const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";
const allowedOrigins = clientOrigins.split(',').map(url => url.trim());
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

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadsDir);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const httpServer = createServer(app);

// Configuration CORS pour Socket.IO (utilise la liste des origines autorisées)
const io = new Server(httpServer, { 
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('🔌 Un client est connecté au Socket : ' + socket.id);
    socket.on('disconnect', () => { console.log('Client déconnecté'); });
});

db.sequelize
    .sync({ alter: true }) 
    .then(() => {
        console.log("✅ Base de données synchronisée.");
    })
    .catch((err: Error) => {
        console.error("❌ Erreur de synchronisation de la base de données:", err.message);
    });

app.get("/", (req: Request, res: Response) => {
    res.json({ message: "API Vera opérationnelle." });
});

itemRoutes(app);
verificationRoutes(app);
verifyRoutes(app);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
surveyRoutes(app);

const conditionalUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }])(req, res, next);
  }
  next();
};

app.post('/api/chat', conditionalUpload, async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, mediaUrls } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    let parsedHistory = [];
    if (conversationHistory) {
      if (typeof conversationHistory === 'string') {
        try {
          parsedHistory = JSON.parse(conversationHistory);
        } catch (e) {
          parsedHistory = [];
        }
      } else if (Array.isArray(conversationHistory)) {
        parsedHistory = conversationHistory;
      }
    }

    let parsedMediaUrls: string[] = [];
    if (mediaUrls) {
      if (typeof mediaUrls === 'string') {
        try {
          parsedMediaUrls = JSON.parse(mediaUrls);
        } catch (e) {
          parsedMediaUrls = [mediaUrls];
        }
      } else if (Array.isArray(mediaUrls)) {
        parsedMediaUrls = mediaUrls;
      }
    }

    const files = (req as any).files as { [fieldname: string]: MulterFile[] };
    const imageFile = files?.image?.[0];
    const videoFile = files?.video?.[0];

    const result: VeraResult = await veraService.checkContent(
      message,
      null,
      parsedHistory,
      parsedMediaUrls,
      imageFile,
      videoFile
    );

    // Nettoyer les fichiers temporaires
    if (imageFile) {
      try {
        fs.unlinkSync(imageFile.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
    if (videoFile) {
      try {
        fs.unlinkSync(videoFile.path);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }

    const response = {
      response: result.explanation || result.summary || result.response || result.message || 'Réponse générée',
      result: {
        status: result.status || 'approved',
        summary: result.summary || '',
        explanation: result.explanation || result.summary || '',
        sources: result.sources || [],
        confidence: result.confidence || 0
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      response: "Désolé, une erreur s'est produite. Pouvez-vous reformuler votre question ?",
      result: {
        status: 'error',
        summary: error.message || 'Internal server error',
        sources: [],
        confidence: 0
      }
    });
  }
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

const PORT: number | string = process.env.PORT || 3000;
httpServer.listen(PORT, () => { console.log(`Serveur démarré sur le port ${PORT}.`); });