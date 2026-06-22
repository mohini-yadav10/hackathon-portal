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
            message: 'Registration submitted successfully! It is now pending admin approval.'
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

// @desc    Approve or Reject registration (Admin Only)
// @route   PUT /api/registrations/:id/status
// @access  Private/Admin
exports.updateRegistrationStatus = async (req, res) => {
    const registrationId = req.params.id;
    const { status } = req.body; // 'Approved' or 'Rejected'

    if (!status || !['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Please provide status as Approved or Rejected' });
    }

    try {
        // Verify registration exists
        const [registrations] = await db.query('SELECT * FROM Registrations WHERE registration_id = ?', [registrationId]);
        if (registrations.length === 0) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
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

// @desc    Get all registrations (Admin only, uses Registration_Summary_View)
// @route   GET /api/registrations
// @access  Private/Admin
exports.getAllRegistrations = async (req, res) => {
    try {
        const [registrations] = await db.query('SELECT * FROM Registration_Summary_View ORDER BY submitted_at DESC');
        res.status(200).json({ success: true, count: registrations.length, data: registrations });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving registrations' });
    }
};
