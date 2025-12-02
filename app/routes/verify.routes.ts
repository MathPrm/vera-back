import { Application, Router } from 'express';
import * as verifyController from '../controllers/verify.controller';

export default (app: Application) => {
  const router = Router();

  router.post("/", verifyController.verifyFromUrl);

  app.use("/api/verify", router);
};
