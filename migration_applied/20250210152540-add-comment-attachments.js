'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('comments', 'photo', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '댓글에 첨부된 단일 사진의 파일 경로'
    });
    await queryInterface.addColumn('comments', 'attachments', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '댓글에 첨부된 파일들의 경로를 JSON 문자열로 저장'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('comments', 'photo');
    await queryInterface.removeColumn('comments', 'attachments');
  }
};
