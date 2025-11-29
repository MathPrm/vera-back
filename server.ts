import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./app/models"; 
import itemRoutes from "./app/routes/items.routes";

dotenv.config();

const app: Application = express();

const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";

const corsOptions: CorsOptions = {
  origin: clientOrigins.split(','), 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- AJOUT : Configuration Socket.io ---
// On enveloppe l'app Express dans un serveur HTTP natif
const httpServer = createServer(app);

// On initialise Socket.io avec les MÊMES options CORS que ton Express
const io = new Server(httpServer, {
  cors: corsOptions
});

// Écoute des connexions Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Un client est connecté au Socket : ' + socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});
// ---------------------------------------

db.sequelize
  .sync()
  .then(() => {
    console.log("Base de données synchronisée.");
  })
  .catch((err: Error) => {
    console.error("Erreur de synchronisation de la base de données:", err.message);
  });

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur l'API Items. Le serveur fonctionne !" });
});

// Tes routes existantes (NE PAS TOUCHER)
itemRoutes(app);

// --- AJOUT : Route pour le Webhook Google Form ---
app.post('/api/webhook/form', (req: Request, res: Response) => {
  const data = req.body;
  console.log('🔔 Webhook reçu :', data);

  // Notification temps réel via Socket.io
  io.emit('new-form-response', {
    id: Date.now(),
    date: new Date(),
    nom: data.nom || 'Inconnu',
    email: data.email || 'Pas d\'email',
    message: 'Nouvelle soumission reçue'
  });

  res.status(200).send({ message: 'Bien reçu' });
});
// -----------------------------------------------

const PORT: number | string = process.env.PORT || 3000;

// MODIFICATION : On utilise httpServer.listen au lieu de app.listen
// Cela lance Express ET Socket.io en même temps sur le même port.
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}.`);
});