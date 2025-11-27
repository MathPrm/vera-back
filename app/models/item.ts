import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

export interface ItemAttributes {
  id: number;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ItemCreationAttributes extends Optional<ItemAttributes, 'id'> {}

export default (sequelize: Sequelize) => {
  const Item = sequelize.define<Model<ItemAttributes, ItemCreationAttributes>>("item", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Item;
};