// config/db.config.ts
import { Dialect } from 'sequelize';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export interface DbConfig {
  HOST?: string;
  USER?: string;
  PASSWORD?: string;
  DB?: string;
  storage?: string;
  dialect: Dialect;
  logging?: boolean | ((sql: string, timing?: number) => void);
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
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

export default dbConfig;