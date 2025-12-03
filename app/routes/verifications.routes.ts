import { Application, Router } from 'express';
import * as verifications from '../controllers/verification.controller';

export default (app: Application) => {
  const router = Router();

  router.post("/", verifications.create);

  router.get("/", verifications.findAll);

  router.get("/stats", verifications.getStats);

  router.get("/:id", verifications.findOne);

  router.delete("/:id", verifications.deleteOne);

  app.use("/api/verifications", router);
};
