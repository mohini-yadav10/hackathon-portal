const db = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Create a new team (Direct entry of member details, no invitations)
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
    const { hackathon_id, team_name, leader_details, members } = req.body;
    const leader_id = req.user.user_id;

    if (!hackathon_id || !team_name || !leader_details) {
        return res.status(400).json({ success: false, message: 'Please provide hackathon_id, team_name, and leader_details' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Fetch hackathon details and validate limit
        const [hackathons] = await connection.query(
            'SELECT max_team_size, title FROM Hackathons WHERE hackathon_id = ?',
            [hackathon_id]
        );
        if (hackathons.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Hackathon not found' });
        }
        const max_team_size = hackathons[0].max_team_size;

        const totalMemberCount = 1 + (members ? members.length : 0);
        if (totalMemberCount > max_team_size) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Team size (${totalMemberCount}) exceeds the maximum limit of ${max_team_size} for this hackathon.` 
            });
        }

        // 2. Validate unique team name within the hackathon
        const [existingTeam] = await connection.query(
            'SELECT team_id FROM Teams WHERE hackathon_id = ? AND team_name = ?',
            [hackathon_id, team_name]
        );
        if (existingTeam.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Team name must be unique within this hackathon' });
        }

        // 3. Compile all members list for duplicate validation
        const allMembers = [
            {
                name: req.user.name,
                email: req.user.email,
                user_id: leader_id,
                enrollment_number: leader_details.enrollment_number,
                phone_number: leader_details.phone_number,
                branch: leader_details.branch,
                year: leader_details.year,
                github_url: leader_details.github_url || null,
                role: 'Leader'
            }
        ];

        if (members && members.length > 0) {
            members.forEach(m => {
                allMembers.push({
                    name: m.name,
                    email: m.email,
                    enrollment_number: m.enrollment_number,
                    phone_number: m.phone_number,
                    branch: m.branch,
                    year: m.year,
                    github_url: m.github_url || null,
                    role: 'Developer'
                });
            });
        }

        // 4. Duplicate checks inside request
        const emails = allMembers.map(m => m.email.toLowerCase());
        const enrollments = allMembers.map(m => m.enrollment_number.toLowerCase());

        if (new Set(emails).size !== emails.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Duplicate emails detected in team members list.' });
        }

        if (new Set(enrollments).size !== enrollments.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Duplicate enrollment numbers detected in team members list.' });
        }

        // 5. Check if any student already belongs to a team in this hackathon
        // Check database for existing active team assignments for any of the emails
        const [existingAssignments] = await connection.query(
            `SELECT u.email FROM Team_Members tm
             JOIN Teams t ON tm.team_id = t.team_id
             JOIN Users u ON tm.user_id = u.user_id
             WHERE t.hackathon_id = ? AND u.email IN (?)`,
            [hackathon_id, emails]
        );

        if (existingAssignments.length > 0) {
            await connection.rollback();
            const badEmails = existingAssignments.map(a => a.email).join(', ');
            return res.status(400).json({ 
                success: false, 
                message: `The following students are already registered in another team for this hackathon: ${badEmails}` 
            });
        }

        // 6. Call stored procedure to create the team record with the leader
        const defaultPasswordHash = await bcrypt.hash('password123', 10);

        // First insert team record
        const [teamResult] = await connection.query(
            'INSERT INTO Teams (hackathon_id, leader_id, team_name, team_size, status) VALUES (?, ?, ?, ?, "Open")',
            [hackathon_id, leader_id, team_name, totalMemberCount]
        );
        const team_id = teamResult.insertId;

        // Insert leader into Team_Members
        await connection.query(
            `INSERT INTO Team_Members (team_id, user_id, enrollment_number, phone_number, branch, year, role, github_url) 
             VALUES (?, ?, ?, ?, ?, ?, 'Leader', ?)`,
            [
                team_id, 
                leader_id, 
                leader_details.enrollment_number, 
                leader_details.phone_number, 
                leader_details.branch, 
                leader_details.year, 
                leader_details.github_url || null
            ]
        );

        // 7. For each other member, retrieve user_id (or register them automatically if they don't exist)
        for (let i = 1; i < allMembers.length; i++) {
            const member = allMembers[i];
            
            // Check if user exists
            const [users] = await connection.query('SELECT user_id FROM Users WHERE email = ?', [member.email]);
            let memberUserId;

            if (users.length > 0) {
                memberUserId = users[0].user_id;
            } else {
                // Register the user automatically
                const [newUser] = await connection.query(
                    'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, "Student")',
                    [member.name, member.email, defaultPasswordHash]
                );
                memberUserId = newUser.insertId;
            }

            // Insert into Team_Members
            await connection.query(
                `INSERT INTO Team_Members (team_id, user_id, enrollment_number, phone_number, branch, year, role, github_url) 
                 VALUES (?, ?, ?, ?, ?, ?, 'Developer', ?)`,
                [
                    team_id, 
                    memberUserId, 
                    member.enrollment_number, 
                    member.phone_number, 
                    member.branch, 
                    member.year, 
                    member.github_url
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Team and all members registered successfully!',
            team_id
        });

    } catch (err) {
        await connection.rollback();
        console.error('Create Team Error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.sqlMessage || 'Server error creating team', 
            error: err.message 
        });
    } finally {
        connection.release();
    }
};

// @desc    Get team details by team ID (uses Team_Summary_View)
// @route   GET /api/teams/:id
// @access  Private
exports.getTeamDetails = async (req, res) => {
    const teamId = req.params.id;

    try {
        const [teamSummary] = await db.query(
            'SELECT * FROM Team_Summary_View WHERE team_id = ?', 
            [teamId]
        );

        if (teamSummary.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const [members] = await db.query(
            `SELECT tm.member_id, tm.role as team_role, tm.joined_at, 
                    tm.enrollment_number, tm.phone_number, tm.github_url, tm.branch, tm.year,
                    u.user_id, u.name, u.email, u.college
             FROM Team_Members tm
             JOIN Users u ON tm.user_id = u.user_id
             WHERE tm.team_id = ?
             ORDER BY tm.joined_at ASC`,
            [teamId]
        );

        const [regRows] = await db.query('SELECT registration_id, status, submitted_at FROM Registrations WHERE team_id = ?', [teamId]);
        const registration = regRows.length > 0 ? regRows[0] : null;

        res.status(200).json({
            success: true,
            data: {
                ...teamSummary[0],
                registration,
                members
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving team details' });
    }
};

// @desc    Get all teams for matching search
// @route   GET /api/teams
// @access  Private
exports.getAllTeams = async (req, res) => {
    try {
        const [teams] = await db.query('SELECT * FROM Team_Summary_View');
        res.status(200).json({ success: true, data: teams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving teams' });
    }
};

// @desc    Leave a team
// @route   DELETE /api/teams/:id/leave
// @access  Private
exports.leaveTeam = async (req, res) => {
    const teamId = req.params.id;
    const userId = req.user.user_id;

    try {
        const [team] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [teamId]);
        if (team.length === 0) return res.status(404).json({ success: false, message: 'Team not found' });

        if (team[0].leader_id === userId) {
            return res.status(400).json({ success: false, message: 'Team leaders cannot leave the team. You must delete the team instead.' });
        }

        const [result] = await db.query('DELETE FROM Team_Members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
        if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'You are not a member of this team' });

        res.status(200).json({ success: true, message: 'Successfully left the team' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error leaving team' });
    }
};

// @desc    Delete a team (Leader only)
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
    const teamId = req.params.id;
    const userId = req.user.user_id;

    try {
        const [team] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [teamId]);
        if (team.length === 0) return res.status(404).json({ success: false, message: 'Team not found' });

        if (team[0].leader_id !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized. Only team leaders can delete the team.' });
        }

        await db.query('DELETE FROM Teams WHERE team_id = ?', [teamId]);
        res.status(200).json({ success: true, message: 'Team deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting team' });
    }
};

// @desc    Get user's active teams (includes details of teammate memberships)
// @route   GET /api/teams/my-teams
// @access  Private
exports.getMyTeams = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [teams] = await db.query(
            `SELECT t.*, h.title AS hackathon_title, tm.role AS user_role, r.status AS registration_status
             FROM Team_Members tm
             JOIN Teams t ON tm.team_id = t.team_id
             JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
             LEFT JOIN Registrations r ON t.team_id = r.team_id
             WHERE tm.user_id = ?`,
            [userId]
        );
        res.status(200).json({ success: true, data: teams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving user teams' });
    }
};

// @desc    Mock search matching teams to keep endpoint alive
// @route   GET /api/teams/search/match
// @access  Private
exports.searchTeams = async (req, res) => {
    try {
        const [teams] = await db.query('SELECT * FROM Team_Summary_View');
        res.status(200).json({ success: true, data: teams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error searching teams' });
    }
};

// @desc    Remove a member from a team (Leader only)
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
    const { id, userId } = req.params;
    const leaderId = req.user.user_id;

    try {
        const [team] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [id]);
        if (team.length === 0) return res.status(404).json({ success: false, message: 'Team not found' });
        if (team[0].leader_id !== leaderId) return res.status(403).json({ success: false, message: 'Unauthorized. Only team leaders can remove members.' });
        if (parseInt(userId) === leaderId) return res.status(400).json({ success: false, message: 'Leaders cannot remove themselves.' });

        await db.query('DELETE FROM Team_Members WHERE team_id = ? AND user_id = ?', [id, userId]);
        res.status(200).json({ success: true, message: 'Member removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error removing member' });
    }
};

// @desc    Assign a role to a team member (Leader only)
// @route   PUT /api/teams/:id/members/:userId/role
// @access  Private
exports.assignMemberRole = async (req, res) => {
    const { id, userId } = req.params;
    const { role } = req.body;
    const leaderId = req.user.user_id;

    try {
        const [team] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [id]);
        if (team.length === 0) return res.status(404).json({ success: false, message: 'Team not found' });
        if (team[0].leader_id !== leaderId) return res.status(403).json({ success: false, message: 'Unauthorized.' });

        await db.query('UPDATE Team_Members SET role = ? WHERE team_id = ? AND user_id = ?', [role, id, userId]);
        res.status(200).json({ success: true, message: 'Member role updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error assigning member role' });
    }
};

