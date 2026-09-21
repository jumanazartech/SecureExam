const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.JSONB, allowNull: false }, // { uz: '', ru: '', en: '' }
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.ENUM('info', 'success', 'warning', 'error'), defaultValue: 'info' },
    link: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Notification;
