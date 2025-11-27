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
}

const dbConfig: DbConfig = {
  // Configuration MySQL
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME || 'vera',
  dialect: (process.env.DB_DIALECT as Dialect) || 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

export default dbConfig;