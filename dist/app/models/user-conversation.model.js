"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserConversation = void 0;
const sequelize_1 = require("sequelize");
class UserConversation extends sequelize_1.Model {
}
exports.UserConversation = UserConversation;
exports.default = (sequelize) => {
    UserConversation.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        title: {
            type: sequelize_1.DataTypes.STRING(500),
            allowNull: true
        },
        isDeleted: {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_deleted'
        }
    }, {
        sequelize,
        tableName: 'user_conversations',
        timestamps: true,
        underscored: true
    });
    return UserConversation;
};
//# sourceMappingURL=user-conversation.model.js.map