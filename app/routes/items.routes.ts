import { Application, Router } from 'express';
import * as items from '../controllers/item.controller';

export default (app: Application) => {
  const router = Router();

  // Créer un nouvel Item
  router.post("/", items.create);

  // Récupérer tous les Items
  router.get("/", items.findAll);

  // Récupérer un seul Item par son id
  router.get("/:id", items.findOne);

  // Mettre à jour un Item par son id
  router.put("/:id", items.update);

  // Supprimer un Item par son id
  // Note: on utilise 'remove' car c'est le nom exporté dans le contrôleur TS
  router.delete("/:id", items.remove);

  app.use("/api/items", router);
};