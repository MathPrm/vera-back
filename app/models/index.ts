import { Sequelize, Dialect } from 'sequelize';
import dbConfig from '../config/db.config';
import * as dotenv from 'dotenv';

dotenv.config();

interface DbContext {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  items?: any;
  verifications?: any;
}

const dbUrl = process.env.DATABASE_URL;

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

  const dialect = (process.env.DB_DIALECT || 'postgres') as Dialect;
  
  if (dialect === 'sqlite') {
    console.log("💻 Mode Local : Connexion à SQLite");
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './database.sqlite',
      logging: console.log
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
}

const db: DbContext = {
  Sequelize: Sequelize,
  sequelize: sequelize,
};

db.items = require("./item").default(sequelize, Sequelize);
db.verifications = require("./verification").default(sequelize, Sequelize);

export default db;