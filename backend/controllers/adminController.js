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

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['Student', 'Leader', 'Judge', 'Manager', 'Admin'];

    if (!validRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    try {
        const [result] = await db.query('UPDATE Users SET role = ? WHERE user_id = ?', [role, id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: `User role updated to ${role}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating user role' });
    }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    // Prevent self-deletion
    if (parseInt(id) === req.user.user_id) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    try {
        const [result] = await db.query('DELETE FROM Users WHERE user_id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting user' });
    }
};

// @desc    Export registrations to CSV (Admin only)
// @route   GET /api/admin/export/csv
// @access  Private/Admin
exports.exportRegistrationsCSV = async (req, res) => {
    try {
        const [registrations] = await db.query('SELECT * FROM Registration_Summary_View ORDER BY submitted_at DESC');

        let csv = 'Registration ID,Submitted At,Status,Team ID,Team Name,Team Size,Hackathon ID,Hackathon Title,Leader Name,Leader Email\n';
        
        registrations.forEach(r => {
            const teamNameEsc = (r.team_name || '').replace(/"/g, '""');
            const titleEsc = (r.hackathon_title || '').replace(/"/g, '""');
            const leaderNameEsc = (r.leader_name || '').replace(/"/g, '""');
            
            csv += `"${r.registration_id}","${new Date(r.submitted_at).toISOString()}","${r.registration_status}","${r.team_id}","${teamNameEsc}","${r.team_size}","${r.hackathon_id}","${titleEsc}","${leaderNameEsc}","${r.leader_email}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
        res.status(200).send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error exporting registrations' });
    }
};

// @desc    Get all users with role 'Manager'
// @route   GET /api/admin/managers
// @access  Private/Admin
exports.getManagers = async (req, res) => {
    try {
        const [managers] = await db.query(
            "SELECT user_id, name, email FROM Users WHERE role = 'Manager'"
        );
        res.status(200).json({ success: true, data: managers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching managers list' });
    }
};

// @desc    Get all judges (active or inactive)
// @route   GET /api/admin/judges
// @access  Private/Admin/Manager
exports.getJudges = async (req, res) => {
    try {
        const [judges] = await db.query(
            `SELECT j.judge_id, j.user_id, j.specialization, j.organization, j.experience, j.status,
                    u.name, u.email
             FROM Judges j
             JOIN Users u ON j.user_id = u.user_id`
        );
        res.status(200).json({ success: true, data: judges });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching judges list' });
    }
};

// @desc    Assign a manager to a hackathon
// @route   POST /api/admin/assignments/manager
// @access  Private/Admin
exports.assignManager = async (req, res) => {
    const { user_id, hackathon_id } = req.body;

    if (!user_id || !hackathon_id) {
        return res.status(400).json({ success: false, message: 'Please provide user_id and hackathon_id' });
    }

    try {
        await db.query(
            `INSERT INTO Hackathon_Managers (user_id, hackathon_id, status)
             VALUES (?, ?, 'Active')
             ON DUPLICATE KEY UPDATE status = 'Active'`,
            [user_id, hackathon_id]
        );
        res.status(200).json({ success: true, message: 'Manager assigned successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error assigning manager' });
    }
};

// @desc    Assign a judge to a hackathon
// @route   POST /api/admin/assignments/judge
// @access  Private/Admin/Manager
exports.assignJudge = async (req, res) => {
    const { user_id, hackathon_id, team_id, specialization, organization, experience } = req.body;
    const assignedBy = req.user.user_id;

    if (!user_id || !hackathon_id || !team_id) {
        return res.status(400).json({ success: false, message: 'Please provide user_id, hackathon_id, and team_id' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Check if user has a Judge profile; if not, create one
        const [judges] = await connection.query('SELECT judge_id FROM Judges WHERE user_id = ?', [user_id]);
        let judgeId;

        if (judges.length > 0) {
            judgeId = judges[0].judge_id;
        } else {
            const [newJudge] = await connection.query(
                `INSERT INTO Judges (user_id, specialization, organization, experience, status)
                 VALUES (?, ?, ?, ?, 'Active')`,
                [
                    user_id,
                    specialization || 'General Evaluation',
                    organization || 'Independent Expert',
                    experience || 2
                ]
            );
            judgeId = newJudge.insertId;
        }

        // 2. Call stored procedure to create assignment and trigger notifications
        await connection.query(
            'CALL AssignJudge(?, ?, ?, ?)',
            [judgeId, hackathon_id, team_id, assignedBy]
        );

        await connection.commit();
        res.status(200).json({ success: true, message: 'Judge assigned successfully!' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error assigning judge' });
    } finally {
        connection.release();
    }
};

// @desc    Get all assignments (judges and managers) for a hackathon
// @route   GET /api/admin/assignments/:hackathonId
// @access  Private/Admin/Manager
exports.getHackathonAssignments = async (req, res) => {
    const hackathonId = req.params.hackathonId;

    try {
        const [managers] = await db.query(
            `SELECT hm.manager_id, hm.user_id, u.name, u.email, hm.assigned_date
             FROM Hackathon_Managers hm
             JOIN Users u ON hm.user_id = u.user_id
             WHERE hm.status = 'Active' AND hm.hackathon_id = ?`,
            [hackathonId]
        );

        const [judges] = await db.query(
            `SELECT ja.assignment_id, ja.judge_id, ja.team_id, t.team_name, u.name, u.email, j.specialization, ja.assigned_date
             FROM Judge_Assignments ja
             JOIN Judges j ON ja.judge_id = j.judge_id
             JOIN Users u ON j.user_id = u.user_id
             JOIN Teams t ON ja.team_id = t.team_id
             WHERE ja.hackathon_id = ? AND ja.status = 'Active'`,
            [hackathonId]
        );

        res.status(200).json({ success: true, managers, judges });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching hackathon assignments' });
    }
};

// @desc    Remove a manager assignment
// @route   DELETE /api/admin/assignments/manager/:id
// @access  Private/Admin
exports.removeManagerAssignment = async (req, res) => {
    const managerId = req.params.id;
    try {
        await db.query('DELETE FROM Hackathon_Managers WHERE manager_id = ?', [managerId]);
        res.status(200).json({ success: true, message: 'Manager assignment removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error removing manager assignment' });
    }
};

// @desc    Remove a judge assignment
// @route   DELETE /api/admin/assignments/judge/:id
// @access  Private/Admin/Manager
exports.removeJudgeAssignment = async (req, res) => {
    const assignmentId = req.params.id;
    try {
        await db.query('DELETE FROM Judge_Assignments WHERE assignment_id = ?', [assignmentId]);
        res.status(200).json({ success: true, message: 'Judge assignment removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error removing judge assignment' });
    }
};



