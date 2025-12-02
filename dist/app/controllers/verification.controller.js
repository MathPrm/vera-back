"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOne = exports.getStats = exports.findOne = exports.findAll = exports.create = void 0;
const models_1 = __importDefault(require("../models"));
const Verification = models_1.default.verifications;
const create = async (req, res) => {
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
    }
    catch (error) {
        console.error("Erreur create verification:", error);
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Erreur lors de la création de la vérification."
        });
    }
};
exports.create = create;
const findAll = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const platform = req.query.platform;
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
    }
    catch (error) {
        console.error("Erreur findAll verifications:", error);
        return res.status(500).json({
            message: "Erreur lors de la récupération des vérifications."
        });
    }
};
exports.findAll = findAll;
const findOne = async (req, res) => {
    try {
        const id = req.params.id;
        const verification = await Verification.findByPk(id);
        if (!verification) {
            return res.status(404).json({
                message: `Vérification avec l'id ${id} introuvable.`
            });
        }
        return res.status(200).json(verification);
    }
    catch (error) {
        console.error("Erreur findOne verification:", error);
        return res.status(500).json({
            message: `Erreur lors de la récupération de la vérification avec l'id ${req.params.id}.`
        });
    }
};
exports.findOne = findOne;
const getStats = async (req, res) => {
    try {
        const totalVerifications = await Verification.count();
        // Récupérer toutes les vérifications et compter côté JavaScript pour simplifier
        const allVerifications = await Verification.findAll();
        const verifiedContent = allVerifications.filter((v) => v.veraResult?.isVerified === true).length;
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
    }
    catch (error) {
        console.error("Erreur getStats:", error);
        return res.status(500).json({
            message: "Erreur lors de la récupération des statistiques."
        });
    }
};
exports.getStats = getStats;
const deleteOne = async (req, res) => {
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
    }
    catch (error) {
        console.error("Erreur delete verification:", error);
        return res.status(500).json({
            message: `Erreur lors de la suppression de la vérification avec l'id ${req.params.id}.`
        });
    }
};
exports.deleteOne = deleteOne;
//# sourceMappingURL=verification.controller.js.map