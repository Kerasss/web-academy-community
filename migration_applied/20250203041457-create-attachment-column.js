'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('boards', 'attachments', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '첨부된 파일 경로들을 JSON 문자열로 저장'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('boards', 'attachments');
  }
};
