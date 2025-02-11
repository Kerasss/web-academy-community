// models/Comment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  boardId: { type: DataTypes.INTEGER, allowNull: false },
  parentCommentId: { type: DataTypes.INTEGER, allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  author: { type: DataTypes.STRING(50), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  // 새로 추가된 컬럼들:
  photo: { 
    type: DataTypes.STRING,  // 사진 경로 (단일 이미지)
    allowNull: true 
  },
  attachments: { 
    type: DataTypes.TEXT,    // 첨부파일 경로들의 JSON 문자열
    allowNull: true 
  }
}, {
  tableName: 'comments',
  timestamps: false
});

module.exports = Comment;
