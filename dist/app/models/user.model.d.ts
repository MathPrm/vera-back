import { Sequelize, Model, Optional } from 'sequelize';
export interface UserAttributes {
    id: number;
    email: string;
    password: string;
    username?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'username'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    email: string;
    password: string;
    username?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    validatePassword(password: string): Promise<boolean>;
    static hashPassword(password: string): Promise<string>;
}
declare const _default: (sequelize: Sequelize) => typeof User;
export default _default;
//# sourceMappingURL=user.model.d.ts.map