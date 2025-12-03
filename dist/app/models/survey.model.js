"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    class SurveyResponse extends sequelize_1.Model {
    }
    SurveyResponse.init({
        content: {
            type: sequelize_1.DataTypes.JSONB,
            allowNull: false
        },
        date: {
            type: sequelize_1.DataTypes.DATE,
            defaultValue: sequelize_1.DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: "SurveyResponse",
        tableName: "survey_responses",
    });
    return SurveyResponse;
};
//# sourceMappingURL=survey.model.js.map