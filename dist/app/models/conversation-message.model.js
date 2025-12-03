"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMessage = void 0;
const sequelize_1 = require("sequelize");
class ConversationMessage extends sequelize_1.Model {
}
exports.ConversationMessage = ConversationMessage;
exports.default = (sequelize) => {
    ConversationMessage.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        conversationId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'conversation_id',
            references: {
                model: 'user_conversations',
                key: 'id'
            }
        },
        sender: {
            type: sequelize_1.DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['user', 'vera']]
            }
        },
        content: {
            type: sequelize_1.DataTypes.TEXT,
            allowNull: false
        },
        mediaUrls: {
            type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
            field: 'media_urls',
            defaultValue: []
        }
    }, {
        sequelize,
        tableName: 'conversation_messages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });
    return ConversationMessage;
};
//# sourceMappingURL=conversation-message.model.js.map