import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import db from "./app/models"; // Assure l'import de l'objet db depuis index.ts
import itemRoutes from "./app/routes/items.routes";
import verificationRoutes from "./app/routes/verifications.routes";
import verifyRoutes from "./app/routes/verify.routes";

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

db.sequelize
  .sync()
  .then(() => {
    console.log("Base de données synchronisée.");
  })
  .catch((err: Error) => {
    console.error("Erreur de synchronisation de la base de données:", err);
  });

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur l'API Items. Le serveur fonctionne !" });
});

itemRoutes(app);
verificationRoutes(app);
verifyRoutes(app);

const PORT: number | string = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}.`);
});