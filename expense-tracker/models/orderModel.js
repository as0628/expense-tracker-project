const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  orderId: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'PENDING' },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'orders',
  timestamps: false
});

module.exports = Order;
