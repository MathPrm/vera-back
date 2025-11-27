import { Application, Router } from 'express';
import * as items from '../controllers/item.controller';

export default (app: Application) => {
  const router = Router();

  router.post("/", items.create);

  router.get("/", items.findAll);

  router.get("/:id", items.findOne);

  router.put("/:id", items.update);

  router.delete("/:id", items.remove);

  app.use("/api/items", router);
};