'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('board_recommendations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      boardId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      userId: {   // 사용자의 고유 ID (User 모델에 맞게 타입 조정)
        type: Sequelize.STRING(50),
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('board_recommendations');
  }
};
