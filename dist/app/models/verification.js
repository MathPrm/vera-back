"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize) => {
    const Verification = sequelize.define("verification", {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        platform: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        contentType: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false
        },
        metadata: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false
        },
        veraResult: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false
        }
    });
    return Verification;
};
//# sourceMappingURL=verification.js.map