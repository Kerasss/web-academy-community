'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('boards', 'category', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'all'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('boards', 'category');
  }
};
