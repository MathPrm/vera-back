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
}

const dbConfig: DbConfig = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'postgres', // Souvent 'postgres' par défaut
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME || 'vera',
  // CHANGEMENT ICI : On force postgres par défaut
  dialect: (process.env.DB_DIALECT as Dialect) || 'postgres', 
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 5,
    min: Number(process.env.DB_POOL_MIN) || 0,
    acquire: Number(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: Number(process.env.DB_POOL_IDLE) || 10000
  }
};

export default dbConfig;