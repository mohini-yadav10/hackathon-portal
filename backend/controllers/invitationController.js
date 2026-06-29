const db = require('../config/db');

// @desc    Send team invitation to a user
// @route   POST /api/invitations
// @access  Private
exports.sendInvitation = async (req, res) => {
    const { receiver_email, team_id } = req.body;
    const sender_id = req.user.user_id;

    if (!receiver_email || !team_id) {
        return res.status(400).json({ success: false, message: 'Please provide receiver_email and team_id' });
    }

    try {
        // Find team
        const [teams] = await db.query('SELECT leader_id, hackathon_id, team_name, status, team_size FROM Teams WHERE team_id = ?', [team_id]);
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const team = teams[0];

        // Check if requester is leader
        if (team.leader_id !== sender_id) {
            return res.status(403).json({ success: false, message: 'Only team leaders can send invitations' });
        }

        // Check if team is open
        if (team.status === 'Closed') {
            return res.status(400).json({ success: false, message: 'Team is closed. Cannot invite more members.' });
        }

        // Find receiver user
        const [receivers] = await db.query('SELECT user_id, name FROM Users WHERE email = ? AND role = "Student"', [receiver_email]);
        if (receivers.length === 0) {
            return res.status(404).json({ success: false, message: 'Student with this email not found' });
        }

        const receiver_id = receivers[0].user_id;

        // Check if receiver is already in the team
        const [memberCheck] = await db.query('SELECT member_id FROM Team_Members WHERE team_id = ? AND user_id = ?', [team_id, receiver_id]);
        if (memberCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Student is already in your team' });
        }

        // Check if receiver is already in a team for this hackathon
        const [existingTeamCheck] = await db.query(
            `SELECT tm.member_id FROM Team_Members tm
             JOIN Teams t ON tm.team_id = t.team_id
             WHERE tm.user_id = ? AND t.hackathon_id = ?`,
            [receiver_id, team.hackathon_id]
        );
        if (existingTeamCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'Student is already in a team for this hackathon' });
        }

        // Check for active pending invitation already sent to this user
        const [inviteCheck] = await db.query(
            'SELECT invitation_id FROM Invitations WHERE team_id = ? AND receiver_id = ? AND status = "Pending"',
            [team_id, receiver_id]
        );
        if (inviteCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'An invitation is already pending for this user' });
        }

        // Insert invitation (Trigger after_invitation_insert will auto-notify the recipient)
        await db.query(
            'INSERT INTO Invitations (sender_id, receiver_id, team_id, status) VALUES (?, ?, ?, "Pending")',
            [sender_id, receiver_id, team_id]
        );

        res.status(201).json({
            success: true,
            message: `Invitation sent successfully to ${receivers[0].name}!`
        });
    } catch (err) {
        console.error('Send Invite Error:', err);
        res.status(500).json({ success: false, message: 'Server error sending invitation', error: err.message });
    }
};

// @desc    Accept team invitation (invokes AcceptInvitation Stored Procedure)
// @route   PUT /api/invitations/:id/accept
// @access  Private
exports.acceptInvitation = async (req, res) => {
    const invitationId = req.params.id;
    const userId = req.user.user_id;

    try {
        // Call stored procedure AcceptInvitation(invitation_id, user_id)
        await db.query('CALL AcceptInvitation(?, ?)', [invitationId, userId]);

        // Get team name to send success message details
        const [teamDetails] = await db.query(
            `SELECT t.team_name, t.team_id FROM Invitations i 
             JOIN Teams t ON i.team_id = t.team_id 
             WHERE i.invitation_id = ?`,
            [invitationId]
        );

        const teamName = teamDetails.length > 0 ? teamDetails[0].team_name : 'the team';
        const teamId = teamDetails.length > 0 ? teamDetails[0].team_id : null;

        // Trigger after_team_member_insert handles team size and status update
        // We can send notifications to other members or leader manually here, or let them view it on reload.
        // Let's notify the team leader that the invitation was accepted
        const [teamLeader] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [teamId]);
        if (teamLeader.length > 0) {
            await db.query(
                'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
                [teamLeader[0].leader_id, `${req.user.name} has accepted your invitation to join "${teamName}".`]
            );
        }

        res.status(200).json({
            success: true,
            message: `You have successfully joined team "${teamName}"!`,
            team_id: teamId
        });
    } catch (err) {
        console.error('Accept Invite Error:', err);
        res.status(400).json({ 
            success: false, 
            message: err.sqlMessage || 'Could not accept invitation', 
            error: err.message 
        });
    }
};

// @desc    Reject team invitation
// @route   PUT /api/invitations/:id/reject
// @access  Private
exports.rejectInvitation = async (req, res) => {
    const invitationId = req.params.id;
    const userId = req.user.user_id;

    try {
        const [invites] = await db.query(
            'SELECT receiver_id, team_id FROM Invitations WHERE invitation_id = ? AND status = "Pending"',
            [invitationId]
        );

        if (invites.length === 0) {
            return res.status(404).json({ success: false, message: 'Pending invitation not found' });
        }

        if (invites[0].receiver_id !== userId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to reject this invitation' });
        }

        // Update status to Rejected
        await db.query(
            'UPDATE Invitations SET status = "Rejected" WHERE invitation_id = ?',
            [invitationId]
        );

        // Notify leader of rejection
        const [teams] = await db.query('SELECT leader_id, team_name FROM Teams WHERE team_id = ?', [invites[0].team_id]);
        if (teams.length > 0) {
            await db.query(
                'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
                [teams[0].leader_id, `${req.user.name} has declined your invitation to join "${teams[0].team_name}".`]
            );
        }

        res.status(200).json({ success: true, message: 'Invitation declined successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error rejecting invitation' });
    }
};

// @desc    Get all pending invitations for current student
// @route   GET /api/invitations/pending
// @access  Private
exports.getPendingInvitations = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [invitations] = await db.query(
            `SELECT i.invitation_id, i.created_at, u.name AS sender_name, u.email AS sender_email,
                    t.team_id, t.team_name, t.team_size, h.title AS hackathon_title, h.max_team_size
             FROM Invitations i
             JOIN Users u ON i.sender_id = u.user_id
             JOIN Teams t ON i.team_id = t.team_id
             JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
             WHERE i.receiver_id = ? AND i.status = 'Pending'`,
            [userId]
        );

        res.status(200).json({ success: true, count: invitations.length, data: invitations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving pending invitations' });
    }
};

// @desc    Request to join a team (Student asks leader to invite them)
// @route   POST /api/invitations/request
// @access  Private
exports.requestToJoin = async (req, res) => {
    const { team_id } = req.body;
    const userId = req.user.user_id;

    if (!team_id) {
        return res.status(400).json({ success: false, message: 'Please provide team_id' });
    }

    try {
        // Find team
        const [teams] = await db.query(
            'SELECT leader_id, hackathon_id, team_name, status, team_size FROM Teams WHERE team_id = ?',
            [team_id]
        );
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        const team = teams[0];

        // Check if requester is already in a team for this hackathon
        const [existingTeamCheck] = await db.query(
            `SELECT tm.member_id FROM Team_Members tm
             JOIN Teams t ON tm.team_id = t.team_id
             WHERE tm.user_id = ? AND t.hackathon_id = ?`,
            [userId, team.hackathon_id]
        );
        if (existingTeamCheck.length > 0) {
            return res.status(400).json({ success: false, message: 'You are already in a team for this hackathon' });
        }

        // Check if team is closed
        if (team.status === 'Closed') {
            return res.status(400).json({ success: false, message: 'This team is closed' });
        }

        // Notify the team leader
        const message = `Student "${req.user.name}" (${req.user.email}) has requested to join your team "${team.team_name}". Go to "My Team" to send them an invitation.`;
        await db.query(
            'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
            [team.leader_id, message]
        );

        res.status(200).json({
            success: true,
            message: 'Join request sent to the team leader successfully!'
        });
    } catch (err) {
        console.error('Request to join error:', err);
        res.status(500).json({ success: false, message: 'Server error requesting to join team' });
    }
};

// @desc    Get all invitations sent by a team (for leader to track)
// @route   GET /api/invitations/team/:teamId
// @access  Private
exports.getTeamSentInvitations = async (req, res) => {
    const { teamId } = req.params;
    const userId = req.user.user_id;

    try {
        // Verify user is leader of the team
        const [teams] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [teamId]);
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        if (teams[0].leader_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only team leaders can view sent invitations' });
        }

        const [invitations] = await db.query(
            `SELECT i.invitation_id, i.status, i.created_at, u.name AS receiver_name, u.email AS receiver_email
             FROM Invitations i
             JOIN Users u ON i.receiver_id = u.user_id
             WHERE i.team_id = ?
             ORDER BY i.created_at DESC`,
            [teamId]
        );

        res.status(200).json({ success: true, count: invitations.length, data: invitations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving sent invitations' });
    }
};

// @desc    Cancel/Retract sent invitation (Leader only)
// @route   DELETE /api/invitations/:id
// @access  Private
exports.cancelInvitation = async (req, res) => {
    const invitationId = req.params.id;
    const userId = req.user.user_id;

    try {
        const [invites] = await db.query('SELECT team_id FROM Invitations WHERE invitation_id = ?', [invitationId]);
        if (invites.length === 0) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        const [teams] = await db.query('SELECT leader_id FROM Teams WHERE team_id = ?', [invites[0].team_id]);
        if (teams.length === 0 || teams[0].leader_id !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this invitation' });
        }

        await db.query('DELETE FROM Invitations WHERE invitation_id = ?', [invitationId]);
        res.status(200).json({ success: true, message: 'Invitation cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error cancelling invitation' });
    }
};


