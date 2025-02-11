// config/db.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // .env 파일 로드

const {
  DB_NAME,
  DB_USER,
  DB_PASS,
  DB_HOST,
  DB_DIALECT,
  DB_PORT
} = process.env;

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST || 'localhost',
  port: DB_PORT || 3306,
  dialect: DB_DIALECT || 'mysql',
  logging: false, // 개발 시 true로 변경하여 SQL 로그 확인 가능
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: false, // 자동 타임스탬프 비활성화
    freezeTableName: true // 테이블 이름 복수화 방지
  }
});

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공.');
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
  }
};

testConnection();

module.exports = sequelize;
