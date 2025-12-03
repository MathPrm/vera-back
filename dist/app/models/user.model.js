"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Classe User
class User extends sequelize_1.Model {
    // Méthode pour vérifier le mot de passe
    async validatePassword(password) {
        return bcryptjs_1.default.compare(password, this.password);
    }
    // Méthode pour hasher le mot de passe
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 10);
    }
}
exports.User = User;
// Fonction pour initialiser le modèle
exports.default = (sequelize) => {
    User.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: 'Email invalide'
                }
            }
        },
        password: {
            type: sequelize_1.DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: {
                    args: [6, 255],
                    msg: 'Le mot de passe doit contenir au moins 6 caractères'
                }
            }
        },
        username: {
            type: sequelize_1.DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        sequelize,
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await User.hashPassword(user.password);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await User.hashPassword(user.password);
                }
            }
        }
    });
    return User;
};
//# sourceMappingURL=user.model.js.map