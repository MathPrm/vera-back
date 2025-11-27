import { Sequelize, Dialect } from 'sequelize';
import dbConfig from '../config/db.config';
import * as dotenv from 'dotenv';

dotenv.config();

interface DbContext {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  items?: any;
}

const dbUrl = process.env.DB_URL;

let sequelize: Sequelize;

if (dbUrl) {

  console.log("🚀 Mode Production : Connexion à PostgreSQL via URL");
  
  sequelize = new Sequelize(dbUrl, {
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

} else {

  console.log("💻 Mode Local : Connexion à PostgreSQL sur le port", process.env.DB_PORT);

  sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: console.log
    }
  );
}

const db: DbContext = {
  Sequelize: Sequelize,
  sequelize: sequelize,
};

db.items = require("./item.ts").default(sequelize, Sequelize);

export default db;