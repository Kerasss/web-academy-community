// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // db.js에서 Sequelize 인스턴스 가져오기
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

const User = sequelize.define('User', {
  userid: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  studentName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  schoolName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  grade: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  parentPhone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  studentPhone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false, // 필수로 설정
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  // 비밀번호 재설정 관련 필드
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    // 비밀번호 생성 전 해싱
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // 비밀번호 업데이트 전 해싱
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 비밀번호 비교 메소드
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 비밀번호 재설정 토큰 생성 메소드
User.prototype.generatePasswordReset = function() {
  this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordExpires = Date.now() + 3600000; // 1시간 유효
  return this.resetPasswordToken;
};

module.exports = User;
