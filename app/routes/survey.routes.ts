import { Application } from "express";
import * as surveys from "../controllers/survey.controller";

// Importez les middlewares d'authentification et d'autorisation
import { verifyToken } from "../../middleware/auth.middleware"; 
import { isAdmin } from "../../middleware/isAdmin.middleware"; 

export default (app: Application) => {
  const router = require("express").Router();

  // ----------------------------------------------------
  // ROUTE GET /api/surveys (Accès restreint aux Admins)
  // ----------------------------------------------------
  // Cette route nécessite un jeton valide ET le statut d'administrateur.
  router.get(
    "/", 
    verifyToken, // 1. Vérifie le JWT et attache l'info req.is_admin
    isAdmin,     // 2. Vérifie si req.is_admin est true
    surveys.findAll // 3. Exécute le contrôleur
  );
  
  // ----------------------------------------------------
  // ROUTE POST /api/surveys (Webhook public)
  // ----------------------------------------------------
  // Cette route doit rester publique pour que Google Apps Script puisse envoyer les données
  router.post("/", surveys.create);

  app.use('/api/surveys', router);
};