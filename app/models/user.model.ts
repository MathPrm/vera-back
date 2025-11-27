// models/user.model.ts
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';

// Interface pour les attributs du User
export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface pour la création (id est auto-généré)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'username'> {}

// Classe User
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public username!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Méthode pour vérifier le mot de passe
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Méthode pour hasher le mot de passe
  public static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}

// Fonction pour initialiser le modèle
export const UserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Email invalide'
          }
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: {
            args: [6, 255],
            msg: 'Le mot de passe doit contenir au moins 6 caractères'
          }
        }
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: true
      }
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            user.password = await User.hashPassword(user.password);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password')) {
            user.password = await User.hashPassword(user.password);
          }
        }
      }
    }
  );

  return User;
};