const { Sequelize } = require('sequelize'); 
require('dotenv').config(); 

// create a new Sequelize instance (DB connection)
const sequelize = new Sequelize(
  process.env.DB_NAME,        // database name
  process.env.DB_USER,        // database username
  process.env.DB_PASSWORD,    // database password
  {
    host: process.env.DB_HOST,   // database host
    port: process.env.DB_PORT,   // database port
    dialect: 'mysql',             // type of database
    logging: false,               // disable SQL query logs in console
  }
);

module.exports = sequelize; // export the Sequelize instance
