import { Sequelize, Model, Optional } from 'sequelize';
export interface ItemAttributes {
    id: number;
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ItemCreationAttributes extends Optional<ItemAttributes, 'id'> {
}
declare const _default: (sequelize: Sequelize) => import("sequelize").ModelCtor<Model<ItemAttributes, ItemCreationAttributes>>;
export default _default;
//# sourceMappingURL=item.d.ts.map