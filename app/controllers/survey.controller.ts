import db from "../models";
import { Request, Response } from "express";

const SurveyResponse = db.surveyResponses; 

/**
 * Gère la requête POST pour créer une nouvelle réponse d'enquête.
 * C'est l'endpoint appelé par Google Apps Script (Webhook).
 */
export const create = async (req: Request, res: Response) => {
  try {
    // Les données envoyées par Google Apps Script sont dans req.body (JSON)
    const payload = req.body; 

    // Création de l'entrée dans la base de données (PostgreSQL via Sequelize).
    // Le contenu complet du formulaire est stocké dans le champ JSONB 'content' du modèle.
    const newEntry = await SurveyResponse.create({
      content: payload,
    });

    // Envoi d'une réponse de succès. C'est important pour que Google Apps Script sache que l'envoi a réussi.
    return res.status(201).send({ 
      message: "Données de formulaire reçues et enregistrées avec succès.", 
      id: newEntry.id 
    });

  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la réponse du formulaire:", error);
    
    // Déterminer le message d'erreur
    let errorMessage = "Erreur inconnue lors du traitement de la requête.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    
    // Envoi d'une réponse d'erreur
    return res.status(500).send({
      message: "Erreur interne du serveur lors du traitement de la requête.",
      error: errorMessage
    });
  }
};


/**
 * Gère la requête GET pour récupérer toutes les réponses d'enquête (existante).
 */
export const findAll = (req: Request, res: Response) => {
  SurveyResponse.findAll({
    order: [['date', 'DESC']]
  })
    .then((data: any) => {
      res.send(data);
    })
    .catch((err: any) => {
      res.status(500).send({
        message: err.message || "Erreur lors de la récupération des réponses."
      });
    });
};