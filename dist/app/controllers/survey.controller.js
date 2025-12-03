"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = void 0;
const models_1 = __importDefault(require("../models"));
const SurveyResponse = models_1.default.surveyResponses;
const findAll = (req, res) => {
    SurveyResponse.findAll({
        order: [['date', 'DESC']]
    })
        .then((data) => {
        res.send(data);
    })
        .catch((err) => {
        res.status(500).send({
            message: err.message || "Erreur lors de la récupération des réponses."
        });
    });
};
exports.findAll = findAll;
//# sourceMappingURL=survey.controller.js.map