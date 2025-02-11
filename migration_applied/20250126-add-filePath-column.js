module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.addColumn('notices', 'attachments', {
        type: Sequelize.TEXT, // JSON 문자열을 저장하기 위해 TEXT나 LONGTEXT
        allowNull: true
      });
    },
    async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn('notices', 'attachments');
    }
  };