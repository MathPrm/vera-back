import { Application } from "express";
import * as surveys from "../controllers/survey.controller";

export default (app: Application) => {
  const router = require("express").Router();

  router.get("/", surveys.findAll);
  
  router.post("/", surveys.create);

  app.use('/api/surveys', router);
};