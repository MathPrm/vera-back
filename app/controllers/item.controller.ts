import { Request, Response } from 'express';
import { Op } from 'sequelize';
import db from '../models'; // Assurez-vous que cela pointe vers votre fichier d'index des modèles

// Récupération du modèle initialisé
const Item = db.items;

// Créer et sauvegarder un nouvel Item
export const create = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validation de la requête
    if (!req.body.name) {
      return res.status(400).json({ message: "Le champ 'name' est obligatoire." });
    }

    // Création de l'objet
    const item = await Item.create({
      name: req.body.name,
      description: req.body.description || null
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("Erreur create item:", error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : "Erreur lors de la création de l'item." 
    });
  }
};

// Récupérer tous les Items (avec ou sans filtre de recherche)
export const findAll = async (req: Request, res: Response): Promise<Response> => {
  try {
    const search = req.query.search as string | undefined;
    let condition = {};

    if (search) {
      condition = {
        name: {
          [Op.like]: `%${search}%`
        }
      };
    }

    const items = await Item.findAll({ where: condition });
    return res.status(200).json(items);
  } catch (error) {
    console.error("Erreur findAll items:", error);
    return res.status(500).json({ 
      message: "Erreur lors de la récupération des items." 
    });
  }
};

// Trouver un Item par son ID
export const findOne = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;

    const item = await Item.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: `Item avec id=${id} non trouvé.` });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error("Erreur findOne item:", error);
    return res.status(500).json({ 
      message: "Erreur lors de la récupération de l'item." 
    });
  }
};

// Mettre à jour un Item par son ID
export const update = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;

    // update retourne un tableau contenant le nombre de lignes affectées
    const [nbUpdated] = await Item.update(req.body, {
      where: { id: id }
    });

    if (nbUpdated === 0) {
      return res.status(404).json({ 
        message: `Item avec id=${id} non trouvé ou aucune modification.` 
      });
    }

    // On récupère l'item mis à jour pour le renvoyer
    const updatedItem = await Item.findByPk(id);
    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Erreur update item:", error);
    return res.status(500).json({ 
      message: "Erreur lors de la mise à jour de l'item." 
    });
  }
};

// Supprimer un Item par son ID
export const remove = async (req: Request, res: Response): Promise<Response> => {
  // Note: j'ai renommé 'delete' en 'remove' car 'delete' est un mot clé réservé, 
  // bien que cela soit permis comme nom de propriété, c'est plus propre en TS/JS d'éviter la confusion.
  try {
    const id = req.params.id;

    const nbDeleted = await Item.destroy({
      where: { id: id }
    });

    if (nbDeleted === 0) {
      return res.status(404).json({ message: `Item avec id=${id} non trouvé.` });
    }

    return res.status(200).json({ message: "Item supprimé avec succès." });
  } catch (error) {
    console.error("Erreur delete item:", error);
    return res.status(500).json({ 
      message: "Erreur lors de la suppression de l'item." 
    });
  }
};