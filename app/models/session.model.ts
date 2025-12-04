import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface SessionAttributes {
  id: number;
  user_id: number;
  token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: Date;
  is_active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'ip_address' | 'user_agent' | 'is_active'> {}

export class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: number;
  public user_id!: number;
  public token!: string;
  public ip_address?: string;
  public user_agent?: string;
  public expires_at!: Date;
  public is_active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default (sequelize: Sequelize) => {
  Session.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      ip_address: {
        type: DataTypes.STRING(45), // IPv6 support
        allowNull: true
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      tableName: 'sessions',
      timestamps: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['token'] },
        { fields: ['is_active'] }
      ]
    }
  );

  return Session;
};

