"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const models_1 = __importDefault(require("./app/models"));
const items_routes_1 = __importDefault(require("./app/routes/items.routes"));
const verifications_routes_1 = __importDefault(require("./app/routes/verifications.routes"));
const verify_routes_1 = __importDefault(require("./app/routes/verify.routes"));
const auth_routes_1 = __importDefault(require("./app/routes/auth.routes"));
const survey_routes_1 = __importDefault(require("./app/routes/survey.routes"));
const history_routes_1 = __importDefault(require("./app/routes/history.routes"));
const veraService = require(path_1.default.join(__dirname, 'app', 'services', 'vera.service'));
dotenv_1.default.config();
const app = (0, express_1.default)();
const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";
const allowedOrigins = clientOrigins.split(',').map(url => url.trim());
const corsOptions = {
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
        }
        else {
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
    app.use((req, res, next) => {
        console.log(`[${req.method}] ${req.path} - Origin: ${req.headers.origin || 'none'}`);
        next();
    });
}
// Appliquer CORS AVANT tout autre middleware
app.use((0, cors_1.default)(corsOptions));
// Middleware manuel pour gérer les requêtes OPTIONS (fallback)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.status(204).send();
    }
    next();
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const uploadsDir = path_1.default.join(__dirname, 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
const httpServer = (0, http_1.createServer)(app);
// Configuration CORS pour Socket.IO (utilise la liste des origines autorisées)
const io = new socket_io_1.Server(httpServer, {
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
models_1.default.sequelize
    .sync({ alter: true })
    .then(() => {
    console.log("✅ Base de données synchronisée.");
})
    .catch((err) => {
    console.error("❌ Erreur de synchronisation de la base de données:", err.message);
});
app.get("/", (req, res) => {
    res.json({ message: "API Vera opérationnelle." });
});
(0, items_routes_1.default)(app);
(0, verifications_routes_1.default)(app);
(0, verify_routes_1.default)(app);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/history', history_routes_1.default);
(0, survey_routes_1.default)(app);
const conditionalUpload = (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }])(req, res, next);
    }
    next();
};
app.post('/api/chat', conditionalUpload, async (req, res) => {
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
                }
                catch (e) {
                    parsedHistory = [];
                }
            }
            else if (Array.isArray(conversationHistory)) {
                parsedHistory = conversationHistory;
            }
        }
        let parsedMediaUrls = [];
        if (mediaUrls) {
            if (typeof mediaUrls === 'string') {
                try {
                    parsedMediaUrls = JSON.parse(mediaUrls);
                }
                catch (e) {
                    parsedMediaUrls = [mediaUrls];
                }
            }
            else if (Array.isArray(mediaUrls)) {
                parsedMediaUrls = mediaUrls;
            }
        }
        const files = req.files;
        const imageFile = files?.image?.[0];
        const videoFile = files?.video?.[0];
        const result = await veraService.checkContent(message, null, parsedHistory, parsedMediaUrls, imageFile, videoFile);
        // Nettoyer les fichiers temporaires
        if (imageFile) {
            try {
                fs_1.default.unlinkSync(imageFile.path);
            }
            catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }
        if (videoFile) {
            try {
                fs_1.default.unlinkSync(videoFile.path);
            }
            catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }
        const response = {
            response: result.summary || result.response || result.message || 'Réponse générée',
            result: {
                status: result.status || 'approved',
                summary: result.summary || '',
                sources: result.sources || [],
                confidence: result.confidence || 0
            }
        };
        res.json(response);
    }
    catch (error) {
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
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.post('/api/webhook/form', async (req, res) => {
    try {
        const rawData = req.body;
        console.log('🔔 Webhook reçu.');
        const newResponseData = {
            content: rawData,
            date: new Date()
        };
        const savedResponse = await models_1.default.surveyResponses.create(newResponseData);
        console.log("✅ Donnée sauvegardée (JSON) ID :", savedResponse.id);
        io.emit('new-form-response', savedResponse);
        res.status(200).send({ message: 'Sauvegardé' });
    }
    catch (error) {
        console.error("❌ Erreur de sauvegarde :", error.message);
        res.status(500).send({ error: error.message });
    }
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => { console.log(`Serveur démarré sur le port ${PORT}.`); });
//# sourceMappingURL=server.js.map