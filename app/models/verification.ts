import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface VerificationAttributes {
  id: number;
  platform: 'tiktok' | 'telegram';
  contentType: 'video' | 'image' | 'text';
  metadata: any;
  veraResult: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VerificationCreationAttributes extends Optional<VerificationAttributes, 'id'> {}

export default (sequelize: Sequelize) => {
  const Verification = sequelize.define<Model<VerificationAttributes, VerificationCreationAttributes>>("verification", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contentType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false
    },
    veraResult: {
      type: DataTypes.JSON,
      allowNull: false
    }
  });

  return Verification;
};
