import { Sequelize, Dialect } from 'sequelize';
import dbConfig from '../config/db.config';
import * as dotenv from 'dotenv';

dotenv.config();

interface DbContext {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  items?: any;
  verifications?: any;
  User?: any;
  surveyResponses?: any;
  UserConversation?: any;
  ConversationMessage?: any;
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

db.items = require("./item").default(sequelize, Sequelize);
db.verifications = require("./verification").default(sequelize, Sequelize);
db.User = require("./user.model").default(sequelize);
db.surveyResponses = require("./survey.model").default(sequelize);
db.UserConversation = require("./user-conversation.model").default(sequelize);
db.ConversationMessage = require("./conversation-message.model").default(sequelize);

// Associations
db.User.hasMany(db.UserConversation, { foreignKey: 'user_id', as: 'conversations' });
db.UserConversation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });

db.UserConversation.hasMany(db.ConversationMessage, { foreignKey: 'conversation_id', as: 'messages' });
db.ConversationMessage.belongsTo(db.UserConversation, { foreignKey: 'conversation_id', as: 'conversation' });

export default db;