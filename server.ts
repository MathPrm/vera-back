import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./app/models"; 
import itemRoutes from "./app/routes/items.routes";
import authRoutes from "./app/routes/auth.routes";
import surveyRoutes from "./app/routes/survey.routes"; 

dotenv.config();
const app: Application = express();

const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";

// Liste des origines autorisées pour Express et Socket.IO
const allowedOrigins = clientOrigins.split(',').map(url => url.trim());

// Configuration CORS pour Express
const expressCorsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // En développement local, autoriser toute origine locale et l'origine de dev par défaut
        if (process.env.NODE_ENV !== 'production' && (!origin || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            return callback(null, true);
        }
        
        // En production, vérifier si l'origine est dans la liste autorisée
        if (origin && allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Origine non autorisée: ${origin}`);
            // Rejeter si l'origine n'est pas autorisée.
            callback(new Error('Non autorisé par CORS'), false); 
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    optionsSuccessStatus: 204
};

// Appliquer CORS AVANT tout autre middleware Express
app.use(cors(expressCorsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/auth', authRoutes);
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

const PORT: number | string = process.env.PORT || 3000;
httpServer.listen(PORT, () => { console.log(`Serveur démarré sur le port ${PORT}.`); });