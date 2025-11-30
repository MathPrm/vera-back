import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./app/models"; 
import itemRoutes from "./app/routes/items.routes";
import surveyRoutes from "./app/routes/survey.routes"; 

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

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

io.on('connection', (socket) => {
  console.log('🔌 Un client est connecté au Socket : ' + socket.id);
  socket.on('disconnect', () => { console.log('Client déconnecté'); });
});

db.sequelize

  .sync({ alter: true }) 
  .then(() => {
    console.log("Base de données synchronisée (Structure mise à jour).");
  })
  .catch((err: Error) => {
    console.error("Erreur de synchronisation :", err.message);
  });


app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Vera opérationnelle." });
});

itemRoutes(app);
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