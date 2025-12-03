import { Sequelize, DataTypes, Model } from 'sequelize';

export interface ConversationMessageAttributes {
  id: number;
  conversationId: number;
  sender: 'user' | 'vera';
  content: string;
  mediaUrls?: string[];
  createdAt?: Date;
}

export class ConversationMessage extends Model<ConversationMessageAttributes> implements ConversationMessageAttributes {
  public id!: number;
  public conversationId!: number;
  public sender!: 'user' | 'vera';
  public content!: string;
  public mediaUrls?: string[];
  public readonly createdAt!: Date;
}

export default (sequelize: Sequelize) => {
  ConversationMessage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'conversation_id',
        references: {
          model: 'user_conversations',
          key: 'id'
        }
      },
      sender: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['user', 'vera']]
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      mediaUrls: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        field: 'media_urls',
        defaultValue: []
      }
    },
    {
      sequelize,
      tableName: 'conversation_messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );

  return ConversationMessage;
};
