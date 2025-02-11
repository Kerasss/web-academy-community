// migrations/xxxxxx-update-email-constraints.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 이메일 필드에 NOT NULL 제약 조건 추가
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    });

    // 이미 존재하는 NULL 값인 이메일 레코드를 처리해야 할 경우 추가 작업 필요
    // 예를 들어, 기본 이메일을 설정하거나 해당 레코드를 삭제하는 등의 작업
  },

  down: async (queryInterface, Sequelize) => {
    // 이메일 필드의 NOT NULL 제약 조건 제거
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
      validate: {
        isEmail: true,
        notEmpty: false,
      },
    });
  }
};
