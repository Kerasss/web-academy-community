// models/BoardRecommendation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BoardRecommendation = sequelize.define('BoardRecommendation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  boardId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'board_recommendations',
  timestamps: false
});

module.exports = BoardRecommendation;
