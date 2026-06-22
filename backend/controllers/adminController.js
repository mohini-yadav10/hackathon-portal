const db = require('../config/db');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT user_id, name, email, college, branch, year, role, created_at FROM Users ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving users' });
    }
};

// @desc    Create Announcement (Admin only)
// @route   POST /api/admin/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res) => {
    const { title, description } = req.body;
    const adminId = req.user.user_id;

    if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Please provide title and description' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO Announcements (title, description, created_by) VALUES (?, ?, ?)',
            [title, description, adminId]
        );

        // Also push notification to all students
        const [students] = await db.query('SELECT user_id FROM Users WHERE role = "Student"');
        if (students.length > 0) {
            const notifications = students.map(s => {
                return db.query(
                    'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
                    [s.user_id, `New Announcement: "${title}" - ${description.substring(0, 50)}...`]
                );
            });
            await Promise.all(notifications);
        }

        res.status(201).json({
            success: true,
            message: 'Announcement published successfully',
            announcement_id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error publishing announcement' });
    }
};

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await db.query(
            `SELECT a.announcement_id, a.title, a.description, a.created_at, u.name AS author_name 
             FROM Announcements a 
             LEFT JOIN Users u ON a.created_by = u.user_id 
             ORDER BY a.created_at DESC`
        );
        res.status(200).json({ success: true, count: announcements.length, data: announcements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving announcements' });
    }
};

// @desc    Get Dashboard Analytics (Admin only)
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    try {
        // 1. Core counters
        const [totalStudentsRows] = await db.query('SELECT COUNT(*) AS count FROM Users WHERE role = "Student"');
        const [totalTeamsRows] = await db.query('SELECT COUNT(*) AS count FROM Teams');
        const [totalHackathonsRows] = await db.query('SELECT COUNT(*) AS count FROM Hackathons');
        const [pendingRegRows] = await db.query('SELECT COUNT(*) AS count FROM Registrations WHERE status = "Pending"');
        const [approvedRegRows] = await db.query('SELECT COUNT(*) AS count FROM Registrations WHERE status = "Approved"');

        // 2. Registrations Per Month (Graph 1)
        const [registrationsPerMonth] = await db.query(`
            SELECT DATE_FORMAT(submitted_at, '%b %Y') AS month, COUNT(*) AS count 
            FROM Registrations 
            GROUP BY MONTH(submitted_at), YEAR(submitted_at), DATE_FORMAT(submitted_at, '%b %Y')
            ORDER BY YEAR(submitted_at), MONTH(submitted_at)
        `);

        // 3. Hackathon Popularity (Graph 2 - registrations per hackathon)
        const [hackathonPopularity] = await db.query(`
            SELECT h.title, COUNT(r.registration_id) AS registrations_count 
            FROM Hackathons h
            LEFT JOIN Registrations r ON h.hackathon_id = r.hackathon_id
            GROUP BY h.hackathon_id, h.title
            ORDER BY registrations_count DESC
            LIMIT 5
        `);

        // 4. Team Formation Trends (Graph 3 - teams formed per hackathon)
        const [teamTrends] = await db.query(`
            SELECT h.title, COUNT(t.team_id) AS teams_count 
            FROM Hackathons h
            LEFT JOIN Teams t ON h.hackathon_id = t.hackathon_id
            GROUP BY h.hackathon_id, h.title
            ORDER BY teams_count DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                cards: {
                    totalStudents: totalStudentsRows[0].count,
                    totalTeams: totalTeamsRows[0].count,
                    totalHackathons: totalHackathonsRows[0].count,
                    pendingRegistrations: pendingRegRows[0].count,
                    approvedRegistrations: approvedRegRows[0].count
                },
                charts: {
                    registrationsPerMonth,
                    hackathonPopularity,
                    teamTrends
                }
            }
        });
    } catch (err) {
        console.error('Analytics Fetch Error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving analytics data', error: err.message });
    }
};
