const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hackathon_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Required for executing multiple queries/schema seeding if needed
});

// Test connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('MySQL Database connected successfully!');
        connection.release();
    } catch (err) {
        console.error('MySQL Connection Error:', err.message);
        console.log('Ensure MySQL is running and database "hackathon_portal" is created using database/schema.sql.');
    }
})();

module.exports = pool;
