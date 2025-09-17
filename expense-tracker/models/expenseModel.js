// models/Expense.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Define model mapped to your existing 'expenses' table
const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: false },
  category: { type: DataTypes.STRING(100), allowNull: false },
  type: { 
    type: DataTypes.ENUM('income', 'expense'), 
    allowNull: false 
  },
  note: { type: DataTypes.TEXT, allowNull: true },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  user_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'expenses',
  timestamps: false
});

module.exports = Expense;
