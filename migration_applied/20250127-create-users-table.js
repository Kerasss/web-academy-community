// migrations/20250126090000-create-users-table.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userid: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      studentName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      schoolName: {
        type: Sequelize.STRING(100)
      },
      grade: {
        type: Sequelize.STRING(20)
      },
      parentPhone: {
        type: Sequelize.STRING(20)
      },
      studentPhone: {
        type: Sequelize.STRING(20)
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
