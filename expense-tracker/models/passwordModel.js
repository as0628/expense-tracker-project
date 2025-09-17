const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PasswordModel = sequelize.define('PasswordModel', {
  id: { 
    type: DataTypes.STRING(36),   // matches VARCHAR(36)
    allowNull: false, 
    primaryKey: true 
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  isActive: { 
    type: DataTypes.BOOLEAN,     // tinyint(1) → BOOLEAN
    defaultValue: true 
  },
  createdAt: { 
    type: DataTypes.DATE,        // timestamp
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'forgotpasswordrequests',
  timestamps: false
});

module.exports = PasswordModel;
