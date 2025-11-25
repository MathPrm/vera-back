import dotenv from "dotenv";
import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import db from "./app/models"; // Assure l'import de l'objet db depuis index.ts
import itemRoutes from "./app/routes/items.routes";

dotenv.config();

const app: Application = express();

const corsOptions: CorsOptions = {
  origin: "http://localhost:4200"
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Synchronisation de la base de données
db.sequelize
  .sync()
  .then(() => {
    console.log("Base de données synchronisée.");
  })
  .catch((err: Error) => {
    console.error("Erreur de synchronisation de la base de données:", err.message);
  });

// Route simple de bienvenue
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Bienvenue sur l'API Items." });
});

// Importation des routes (appel de la fonction exportée par défaut)
itemRoutes(app);

const PORT: number | string = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}.`);
});