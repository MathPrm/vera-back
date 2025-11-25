import { Sequelize } from 'sequelize';
import dbConfig from '../config/db.config';
import ItemModel from './item';

// 1. Initialisation de l'instance Sequelize avec les paramètres de config
const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    },
    logging: false // Mettre à console.log pour voir le SQL généré
  }
);

// 2. Construction de l'objet db
const db = {
  Sequelize, // La classe (utile pour les types/opérateurs statiques)
  sequelize, // L'instance connectée
  items: ItemModel(sequelize) // On initialise le modèle Item
};

export default db;