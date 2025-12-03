import { Sequelize, Model, Optional } from 'sequelize';
export interface VerificationAttributes {
    id: number;
    platform: 'tiktok' | 'telegram';
    contentType: 'video' | 'image' | 'text';
    metadata: any;
    veraResult: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface VerificationCreationAttributes extends Optional<VerificationAttributes, 'id'> {
}
declare const _default: (sequelize: Sequelize) => import("sequelize").ModelCtor<Model<VerificationAttributes, VerificationCreationAttributes>>;
export default _default;
//# sourceMappingURL=verification.d.ts.map