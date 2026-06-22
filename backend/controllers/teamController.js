const db = require('../config/db');

// @desc    Create a new team (using RegisterTeam Stored Procedure)
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
    const { hackathon_id, team_name } = req.body;
    const leader_id = req.user.user_id;

    if (!hackathon_id || !team_name) {
        return res.status(400).json({ success: false, message: 'Please provide hackathon_id and team_name' });
    }

    try {
        // Check if user is already in a team for this hackathon
        const [existing] = await db.query(
            `SELECT tm.member_id FROM Team_Members tm 
             JOIN Teams t ON tm.team_id = t.team_id 
             WHERE tm.user_id = ? AND t.hackathon_id = ?`,
            [leader_id, hackathon_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already in a team for this hackathon. You must leave that team first.' 
            });
        }

        // Call stored procedure RegisterTeam(hackathon_id, leader_id, team_name, OUT team_id)
        // First we register the team
        await db.query('CALL RegisterTeam(?, ?, ?, @p_team_id)', [hackathon_id, leader_id, team_name]);
        
        // Fetch the output parameter
        const [outRows] = await db.query('SELECT @p_team_id AS team_id');
        const team_id = outRows[0].team_id;

        res.status(201).json({
            success: true,
            message: 'Team created successfully and leader joined!',
            team_id
        });
    } catch (err) {
        console.error('Create Team Error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.sqlMessage || 'Server error creating team', 
            error: err.message 
        });
    }
};

// @desc    Get team details by team ID (uses Team_Summary_View)
// @route   GET /api/teams/:id
// @access  Private
exports.getTeamDetails = async (req, res) => {
    const teamId = req.params.id;

    try {
        // Query view for summary info
        const [teamSummary] = await db.query(
            'SELECT * FROM Team_Summary_View WHERE team_id = ?', 
            [teamId]
        );

        if (teamSummary.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Query team members joining Users and Student_Profiles
        const [members] = await db.query(
            `SELECT tm.member_id, tm.role as team_role, tm.joined_at, 
                    u.user_id, u.name, u.email, u.college, u.branch, u.year,
                    p.github_url, p.linkedin_url, p.bio
             FROM Team_Members tm
             JOIN Users u ON tm.user_id = u.user_id
             LEFT JOIN Student_Profiles p ON u.user_id = p.user_id
             WHERE tm.team_id = ?
             ORDER BY tm.joined_at ASC`,
            [teamId]
        );

        // Fetch skills for each member
        const membersWithSkills = await Promise.all(members.map(async (m) => {
            const [skillRows] = await db.query('SELECT skill FROM Student_Skills WHERE user_id = ?', [m.user_id]);
            return {
                ...m,
                skills: skillRows.map(s => s.skill)
            };
        }));

        // Check if there is a pending registration
        const [regRows] = await db.query('SELECT registration_id, status, submitted_at FROM Registrations WHERE team_id = ?', [teamId]);
        const registration = regRows.length > 0 ? regRows[0] : null;

        res.status(200).json({
            success: true,
            data: {
                ...teamSummary[0],
                registration,
                members: membersWithSkills
            }
        });
    } catch (err) {
        console.error('Get Team Details Error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving team details' });
    }
};

// @desc    Get current user's team for a hackathon
// @route   GET /api/teams/user/active
// @access  Private
exports.getMyTeams = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [teams] = await db.query(
            `SELECT t.team_id, t.team_name, t.team_size, t.status AS team_status,
                    tm.role AS user_role, h.hackathon_id, h.title AS hackathon_title,
                    h.max_team_size, h.registration_deadline,
                    (SELECT name FROM Users WHERE user_id = t.leader_id) AS leader_name
             FROM Team_Members tm
             JOIN Teams t ON tm.team_id = t.team_id
             JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
             WHERE tm.user_id = ?`,
            [userId]
        );

        res.status(200).json({ success: true, count: teams.length, data: teams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving your teams' });
    }
};

// @desc    Leave a team (If leader leaves, team is dissolved)
// @route   DELETE /api/teams/:id/leave
// @access  Private
exports.leaveTeam = async (req, res) => {
    const teamId = req.params.id;
    const userId = req.user.user_id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if team exists
        const [teams] = await connection.query('SELECT leader_id, status FROM Teams WHERE team_id = ? FOR UPDATE', [teamId]);
        if (teams.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const team = teams[0];
        
        // Cannot leave a team if the registration has already been submitted (team status is Closed/Submitted)
        const [regRows] = await connection.query('SELECT registration_id FROM Registrations WHERE team_id = ?', [teamId]);
        if (regRows.length > 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Cannot leave the team after registration has been submitted.' });
        }

        if (team.leader_id === userId) {
            // Leader leaves: Dissolve the team entirely
            await connection.query('DELETE FROM Teams WHERE team_id = ?', [teamId]);
            await connection.commit();
            res.status(200).json({ success: true, message: 'Team dissolved successfully as leader left.' });
        } else {
            // Normal member leaves
            await connection.query('DELETE FROM Team_Members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
            await connection.commit();
            res.status(200).json({ success: true, message: 'You have left the team successfully.' });
        }
    } catch (err) {
        await connection.rollback();
        console.error('Leave Team Error:', err);
        res.status(500).json({ success: false, message: 'Server error leaving team', error: err.message });
    } finally {
        connection.release();
    }
};

// @desc    Remove a member (Leader only)
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
    const teamId = req.params.id;
    const removeUserId = req.params.userId;
    const requesterId = req.user.user_id;

    try {
        const [teams] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [teamId]);
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        if (teams[0].leader_id !== requesterId) {
            return res.status(403).json({ success: false, message: 'Only the team leader can remove members' });
        }

        if (parseInt(removeUserId) === requesterId) {
            return res.status(400).json({ success: false, message: 'Leaders cannot remove themselves. Leave the team to dissolve it.' });
        }

        await db.query('DELETE FROM Team_Members WHERE team_id = ? AND user_id = ?', [teamId, removeUserId]);
        
        // Notify the removed member
        await db.query(
            'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
            [removeUserId, `You have been removed from team ID ${teamId}.`]
        );

        res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error removing member' });
    }
};

// @desc    Assign role to a team member (Leader only)
// @route   PUT /api/teams/:id/members/:userId/role
// @access  Private
exports.assignMemberRole = async (req, res) => {
    const teamId = req.params.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;
    const requesterId = req.user.user_id;

    if (!role) {
        return res.status(400).json({ success: false, message: 'Please provide a role name' });
    }

    try {
        const [teams] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [teamId]);
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        if (teams[0].leader_id !== requesterId) {
            return res.status(403).json({ success: false, message: 'Only the team leader can assign roles' });
        }

        await db.query(
            'UPDATE Team_Members SET role = ? WHERE team_id = ? AND user_id = ?',
            [role, teamId, targetUserId]
        );

        res.status(200).json({ success: true, message: 'Member role updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error assigning role' });
    }
};

// @desc    Search and match teams (Complex SQL: JOINs, GROUP BY, HAVING)
// @route   GET /api/teams/search/match
// @access  Private
exports.searchTeams = async (req, res) => {
    const { hackathon_id, skill, interest } = req.query;

    if (!hackathon_id) {
        return res.status(400).json({ success: false, message: 'hackathon_id is required' });
    }

    try {
        // Core query to fetch Open teams with their current size and max allowed size.
        // We will construct matching filters.
        // Complex SQL joining Teams, Hackathons, Team_Members, Users, Student_Skills, Student_Interests
        let queryParams = [hackathon_id];
        let filterJoin = '';
        let filterWhere = '';

        if (skill) {
            filterJoin += ` JOIN Team_Members tm2 ON t.team_id = tm2.team_id 
                            JOIN Student_Skills ss ON tm2.user_id = ss.user_id`;
            filterWhere += ` AND ss.skill = ?`;
            queryParams.push(skill);
        }

        if (interest) {
            filterJoin += ` JOIN Team_Members tm3 ON t.team_id = tm3.team_id 
                            JOIN Student_Interests si ON tm3.user_id = si.user_id`;
            filterWhere += ` AND si.interest = ?`;
            queryParams.push(interest);
        }

        // SQL using: JOINS, GROUP BY, and HAVING to select teams that are open,
        // match search criteria, and have NOT exceeded their hackathon team limit.
        const sql = `
            SELECT 
                t.team_id, 
                t.team_name, 
                t.team_size,
                t.status AS team_status, 
                h.title AS hackathon_title, 
                h.max_team_size,
                u.name AS leader_name,
                u.email AS leader_email
            FROM Teams t
            JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
            LEFT JOIN Users u ON t.leader_id = u.user_id
            ${filterJoin}
            WHERE t.hackathon_id = ? 
              AND t.status = 'Open'
              ${filterWhere}
            GROUP BY t.team_id, h.max_team_size, u.name, u.email
            HAVING t.team_size < h.max_team_size
            ORDER BY t.team_size DESC
        `;

        const [teams] = await db.query(sql, queryParams);

        // Fetch members for each matched team
        const teamsWithMembers = await Promise.all(teams.map(async (team) => {
            const [mRows] = await db.query(
                `SELECT u.name, u.email, tm.role 
                 FROM Team_Members tm 
                 JOIN Users u ON tm.user_id = u.user_id 
                 WHERE tm.team_id = ?`,
                [team.team_id]
            );
            return {
                ...team,
                members: mRows
            };
        }));

        res.status(200).json({ success: true, count: teamsWithMembers.length, data: teamsWithMembers });
    } catch (err) {
        console.error('Team Matching Search Error:', err);
        res.status(500).json({ success: false, message: 'Server error searching for teams', error: err.message });
    }
};
