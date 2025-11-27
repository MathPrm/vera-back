// models/index.ts
import { Sequelize } from 'sequelize';
import dbConfig from '../config/db.config';
import { UserModel } from './user.model';
import ItemModel from './item';

// Initialisation de Sequelize avec MySQL
const sequelize = new Sequelize(
  dbConfig.DB ?? 'vera',
  dbConfig.USER ?? 'root',
  dbConfig.PASSWORD ?? '',
  {
    host: dbConfig.HOST ?? 'localhost',
    dialect: dbConfig.dialect,
    pool: dbConfig.pool,
    logging: dbConfig.logging
  }
);

// Initialisation des modèles
const db = {
  Sequelize,
  sequelize,
  User: UserModel(sequelize),
  Item: ItemModel(sequelize)
};

export default db;