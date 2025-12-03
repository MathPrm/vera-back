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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const getEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`⚠️ La variable d'environnement ${key} est manquante !`);
    }
    return value;
};
const dbConfig = {
    HOST: getEnv('DB_HOST'),
    USER: getEnv('DB_USER'),
    PASSWORD: process.env.DB_PASSWORD || '',
    DB: getEnv('DB_NAME'),
    dialect: process.env.DB_DIALECT || 'postgres',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    pool: {
        max: Number(process.env.DB_POOL_MAX) || 5,
        min: Number(process.env.DB_POOL_MIN) || 0,
        acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
        idle: Number(process.env.DB_POOL_IDLE) || 10000
    }
};
exports.default = dbConfig;
//# sourceMappingURL=db.config.js.map