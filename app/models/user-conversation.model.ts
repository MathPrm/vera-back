import { Sequelize, DataTypes, Model } from 'sequelize';

export interface UserConversationAttributes {
  id: number;
  userId: number;
  title?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserConversation extends Model<UserConversationAttributes> implements UserConversationAttributes {
  public id!: number;
  public userId!: number;
  public title?: string;
  public isDeleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  UserConversation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_deleted'
      }
    },
    {
      sequelize,
      tableName: 'user_conversations',
      timestamps: true,
      underscored: true
    }
  );

  return UserConversation;
};
