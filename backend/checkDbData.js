const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Connected to MySQL database!');

    try {
        const [users] = await connection.query('SELECT user_id, name, email, role FROM Users');
        console.log('\n--- USERS ---');
        console.table(users);

        const [hackathons] = await connection.query('SELECT hackathon_id, title, status FROM Hackathons');
        console.log('\n--- HACKATHONS ---');
        console.table(hackathons);

        const [managers] = await connection.query('SELECT * FROM Hackathon_Managers');
        console.log('\n--- HACKATHON MANAGERS ---');
        console.table(managers);

        const [teams] = await connection.query('SELECT team_id, hackathon_id, leader_id, team_name, team_size, status FROM Teams');
        console.log('\n--- TEAMS ---');
        console.table(teams);

        const [registrations] = await connection.query('SELECT * FROM Registrations');
        console.log('\n--- REGISTRATIONS ---');
        console.table(registrations);

        const [submissions] = await connection.query('SELECT * FROM Submissions');
        console.log('\n--- SUBMISSIONS ---');
        console.table(submissions);

        const [assignments] = await connection.query('SELECT * FROM Judge_Assignments');
        console.log('\n--- JUDGE ASSIGNMENTS ---');
        console.table(assignments);

        const [evaluations] = await connection.query('SELECT * FROM Evaluations');
        console.log('\n--- EVALUATIONS ---');
        console.table(evaluations);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

run();
