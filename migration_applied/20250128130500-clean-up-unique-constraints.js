'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 기존 userid와 email의 고유 제약 조건을 유지
    await queryInterface.addConstraint('users', {
      fields: ['userid'],
      type: 'unique',
      name: 'unique_users_userid' // 이미 제거되었으므로 다시 추가해도 괜찮음
    });

    await queryInterface.addConstraint('users', {
      fields: ['email'],
      type: 'unique',
      name: 'unique_users_email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 마이그레이션 롤백 시 고유 제약 조건 제거
    await queryInterface.removeConstraint('users', 'unique_users_userid');
    await queryInterface.removeConstraint('users', 'unique_users_email');
  }
};
