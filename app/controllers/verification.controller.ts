import { Request, Response } from 'express';
import { Op } from 'sequelize';
import db from '../models';
import { literal } from 'sequelize';

const Verification = db.verifications;

export const create = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.body.platform || !req.body.contentType || !req.body.metadata || !req.body.veraResult) {
      return res.status(400).json({ 
        message: "Les champs 'platform', 'contentType', 'metadata' et 'veraResult' sont obligatoires." 
      });
    }

    const verification = await Verification.create({
      platform: req.body.platform,
      contentType: req.body.contentType,
      metadata: req.body.metadata,
      veraResult: req.body.veraResult
    });

    return res.status(201).json(verification);
  } catch (error) {
    console.error("Erreur create verification:", error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : "Erreur lors de la création de la vérification." 
    });
  }
};

export const findAll = async (req: Request, res: Response): Promise<Response> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const platform = req.query.platform as string | undefined;
    
    let condition = {};
    if (platform) {
      condition = { platform };
    }

    const verifications = await Verification.findAll({ 
      where: condition,
      order: [['createdAt', 'DESC']],
      limit
    });
    
    return res.status(200).json(verifications);
  } catch (error) {
    console.error("Erreur findAll verifications:", error);
    return res.status(500).json({ 
      message: "Erreur lors de la récupération des vérifications." 
    });
  }
};

export const findOne = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;
    const verification = await Verification.findByPk(id);

    if (!verification) {
      return res.status(404).json({ 
        message: `Vérification avec l'id ${id} introuvable.` 
      });
    }

    return res.status(200).json(verification);
  } catch (error) {
    console.error("Erreur findOne verification:", error);
    return res.status(500).json({ 
      message: `Erreur lors de la récupération de la vérification avec l'id ${req.params.id}.` 
    });
  }
};

export const getStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const totalVerifications = await Verification.count();
    
    // Récupérer toutes les vérifications et compter côté JavaScript pour simplifier
    const allVerifications = await Verification.findAll();
    const verifiedContent = allVerifications.filter((v: any) => v.veraResult?.isVerified === true).length;
    
    const tiktokCount = await Verification.count({ where: { platform: 'tiktok' } });
    const telegramCount = await Verification.count({ where: { platform: 'telegram' } });

    const stats = {
      totalVerifications,
      verifiedContent,
      platformBreakdown: {
        tiktok: tiktokCount,
        telegram: telegramCount
      }
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Erreur getStats:", error);
    return res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques." 
    });
  }
};

export const deleteOne = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;
    const deleted = await Verification.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ 
        message: `Impossible de supprimer la vérification avec l'id ${id}. Vérification introuvable.` 
      });
    }

    return res.status(200).json({ 
      message: "Vérification supprimée avec succès." 
    });
  } catch (error) {
    console.error("Erreur delete verification:", error);
    return res.status(500).json({ 
      message: `Erreur lors de la suppression de la vérification avec l'id ${req.params.id}.` 
    });
  }
};
