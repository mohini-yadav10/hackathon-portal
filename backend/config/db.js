const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool (supports both local and Railway MySQL)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  // Railway MySQL requires SSL in production
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
    ? { rejectUnauthorized: false }
    : false
});

// Test connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ MySQL connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'railway'}`);
        connection.release();
    } catch (err) {
        console.error('❌ MySQL Connection Error:', err.message);
        console.error('Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME environment variables.');
    }
})();

module.exports = pool;
