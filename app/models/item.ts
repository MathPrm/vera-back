import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

// 1. Interface représentant les attributs du modèle
export interface ItemAttributes {
  id: number;
  name: string;
  description?: string; // Le '?' indique que le champ peut être undefined/null
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Interface pour la création (l'ID est optionnel à la création)
export interface ItemCreationAttributes extends Optional<ItemAttributes, 'id'> {}

// 3. Définition du modèle
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