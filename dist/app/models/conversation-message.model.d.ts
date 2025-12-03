import { Sequelize, Model } from 'sequelize';
export interface ConversationMessageAttributes {
    id: number;
    conversationId: number;
    sender: 'user' | 'vera';
    content: string;
    mediaUrls?: string[];
    createdAt?: Date;
}
export declare class ConversationMessage extends Model<ConversationMessageAttributes> implements ConversationMessageAttributes {
    id: number;
    conversationId: number;
    sender: 'user' | 'vera';
    content: string;
    mediaUrls?: string[];
    readonly createdAt: Date;
}
declare const _default: (sequelize: Sequelize) => typeof ConversationMessage;
export default _default;
//# sourceMappingURL=conversation-message.model.d.ts.map