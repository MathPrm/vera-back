import { Dialect } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  HOST: string;
  USER: string;
  PASSWORD: string;
  DB: string;
  dialect: Dialect;
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  port?: number;
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`⚠️ La variable d'environnement ${key} est manquante !`);
  }
  return value;
};

const dbConfig: DbConfig = {

  HOST: getEnv('DB_HOST'),
  USER: getEnv('DB_USER'),
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: getEnv('DB_NAME'),
  
  dialect: (process.env.DB_DIALECT as Dialect) || 'postgres',

  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,

  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: Number(process.env.DB_POOL_MIN) || 0,
    acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: Number(process.env.DB_POOL_IDLE) || 10000
  }
};

export default dbConfig;