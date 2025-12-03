"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const dbUrl = process.env.DATABASE_URL;
let sequelize;
if (dbUrl) {
    console.log("🚀 Mode Production : Connexion à PostgreSQL via URL");
    sequelize = new sequelize_1.Sequelize(dbUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
}
else {
    console.log("💻 Mode Local : Connexion à PostgreSQL sur le port", process.env.DB_PORT);
    sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: console.log
    });
}
const db = {
    Sequelize: sequelize_1.Sequelize,
    sequelize: sequelize,
};
db.items = require("./item").default(sequelize, sequelize_1.Sequelize);
db.verifications = require("./verification").default(sequelize, sequelize_1.Sequelize);
db.User = require("./user.model").default(sequelize);
db.surveyResponses = require("./survey.model").default(sequelize);
db.UserConversation = require("./user-conversation.model").default(sequelize);
db.ConversationMessage = require("./conversation-message.model").default(sequelize);
// Associations
db.User.hasMany(db.UserConversation, { foreignKey: 'user_id', as: 'conversations' });
db.UserConversation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.UserConversation.hasMany(db.ConversationMessage, { foreignKey: 'conversation_id', as: 'messages' });
db.ConversationMessage.belongsTo(db.UserConversation, { foreignKey: 'conversation_id', as: 'conversation' });
exports.default = db;
//# sourceMappingURL=index.js.map