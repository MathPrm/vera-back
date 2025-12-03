import { Sequelize, Model } from 'sequelize';
export interface UserConversationAttributes {
    id: number;
    userId: number;
    title?: string;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class UserConversation extends Model<UserConversationAttributes> implements UserConversationAttributes {
    id: number;
    userId: number;
    title?: string;
    isDeleted: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
declare const _default: (sequelize: Sequelize) => typeof UserConversation;
export default _default;
//# sourceMappingURL=user-conversation.model.d.ts.map