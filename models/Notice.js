// models/Notice.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');  // 위에서 만든 sequelize 인스턴스

const Notice = sequelize.define('Notice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,  // YYYY-MM-DD 형식
    allowNull: false
  }, 
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true // or false
  },
  attachments: {
    type: DataTypes.TEXT, // or STRING
    allowNull: true
  }
}, {
  tableName: 'notices',  // 실제 DB 테이블명 (기본적으로 모델명+s)
  timestamps: false      // createdAt, updatedAt 자동 생성 비활성화
});

// 테이블이 아직 없다면 생성(sync). 개발 단계에서만 사용, 운영에선 migration 권장
Notice.sync();

module.exports = Notice;
