const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ExportHistory = sequelize.define('ExportHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  s3_key: { type: DataTypes.STRING(255), allowNull: false },
  url: { type: DataTypes.STRING(255), allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'export_history',
  timestamps: false
});

module.exports = ExportHistory;
