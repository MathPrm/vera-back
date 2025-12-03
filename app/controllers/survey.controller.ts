import db from "../models";
import { Request, Response } from "express";

const SurveyResponse = db.surveyResponses;

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