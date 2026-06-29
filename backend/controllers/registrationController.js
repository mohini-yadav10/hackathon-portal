const db = require('../config/db');

// @desc    Submit registration for a team (calls SubmitRegistration Stored Procedure)
// @route   POST /api/registrations
// @access  Private
exports.submitRegistration = async (req, res) => {
    const { team_id, hackathon_id } = req.body;
    const userId = req.user.user_id;

    if (!team_id || !hackathon_id) {
        return res.status(400).json({ success: false, message: 'Please provide team_id and hackathon_id' });
    }

    try {
        // Verify user is team leader
        const [teams] = await db.query('SELECT leader_id, status FROM Teams WHERE team_id = ?', [team_id]);
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        if (teams[0].leader_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the team leader can submit registration.' });
        }

        // Call stored procedure SubmitRegistration(team_id, hackathon_id)
        await db.query('CALL SubmitRegistration(?, ?)', [team_id, hackathon_id]);

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully! It is now pending approval.'
        });
    } catch (err) {
        console.error('Submit Registration Error:', err);
        res.status(400).json({ 
            success: false, 
            message: err.sqlMessage || 'Could not submit registration', 
            error: err.message 
        });
    }
};

// @desc    Approve or Reject registration (Admin/Manager)
// @route   PUT /api/registrations/:id/status
// @access  Private/Admin/Manager
exports.updateRegistrationStatus = async (req, res) => {
    const registrationId = req.params.id;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const { user_id, role } = req.user;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Please provide status as Approved or Rejected' });
    }

    try {
        // Verify registration exists
        const [registrations] = await db.query('SELECT * FROM Registrations WHERE registration_id = ?', [registrationId]);
        if (registrations.length === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Manager assignment verification
        if (role === 'Manager') {
            const [mgrAssigned] = await db.query(
                `SELECT 1 FROM Registrations r 
                 JOIN Hackathon_Managers hm ON r.hackathon_id = hm.hackathon_id 
                 WHERE r.registration_id = ? AND hm.user_id = ? AND hm.status = 'Active'`,
                [registrationId, user_id]
            );
            if (mgrAssigned.length === 0) {
                return res.status(403).json({ success: false, message: 'Unauthorized. You do not manage the hackathon for this registration.' });
            }
        }

        // Update status. Trigger after_registration_status_update will fire automatically,
        // logging the change to Registration_Logs and notifying the team leader.
        await db.query(
            'UPDATE Registrations SET status = ? WHERE registration_id = ?',
            [status, registrationId]
        );

        res.status(200).json({
            success: true,
            message: `Registration successfully ${status.toLowerCase()}!`
        });
    } catch (err) {
        console.error('Update Registration Status Error:', err);
        res.status(500).json({ success: false, message: 'Server error updating registration status', error: err.message });
    }
};

// @desc    Get all registrations (Admin / Assigned Manager)
// @route   GET /api/registrations
// @access  Private/Admin/Manager
exports.getAllRegistrations = async (req, res) => {
    const { user_id, role } = req.user;

    try {
        let registrations;
        
        // Define base query to aggregate all teammate properties
        const queryStr = `
            SELECT 
                tr.*,
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'name', u.name,
                                'email', u.email,
                                'enrollment_number', tm.enrollment_number,
                                'phone_number', tm.phone_number,
                                'branch', tm.branch,
                                'year', tm.year,
                                'role', tm.role,
                                'github_url', tm.github_url
                            )
                        )
                        FROM Team_Members tm
                        JOIN Users u ON tm.user_id = u.user_id
                        WHERE tm.team_id = tr.team_id
                    ),
                    '[]'
                ) AS members
            FROM Team_Registration_View tr
        `;

        if (role === 'Admin') {
            const [rows] = await db.query(`${queryStr} ORDER BY tr.registration_date DESC`);
            registrations = rows;
        } else if (role === 'Manager') {
            const [rows] = await db.query(
                `${queryStr} 
                 JOIN Hackathon_Managers hm ON tr.hackathon_id = hm.hackathon_id 
                 WHERE hm.user_id = ? AND hm.status = 'Active'
                 ORDER BY tr.registration_date DESC`,
                [user_id]
            );
            registrations = rows;
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized.' });
        }

        res.status(200).json({ success: true, count: registrations.length, data: registrations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving registrations' });
    }
};
