const db = require('../config/db');

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Private
exports.getAllHackathons = async (req, res) => {
    try {
        // Admins can see all, students see published/completed
        let query = 'SELECT * FROM Hackathons ORDER BY start_date DESC';
        if (req.user.role !== 'Admin') {
            query = "SELECT * FROM Hackathons WHERE status IN ('Published', 'Completed') ORDER BY start_date DESC";
        }
        
        const [hackathons] = await db.query(query);
        res.status(200).json({ success: true, count: hackathons.length, data: hackathons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving hackathons' });
    }
};

// @desc    Get active hackathons (Using Active_Hackathon_View)
// @route   GET /api/hackathons/active
// @access  Private
exports.getActiveHackathons = async (req, res) => {
    try {
        const [hackathons] = await db.query('SELECT * FROM Active_Hackathon_View');
        res.status(200).json({ success: true, count: hackathons.length, data: hackathons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving active hackathons' });
    }
};

// @desc    Get single hackathon details
// @route   GET /api/hackathons/:id
// @access  Private
exports.getHackathon = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Hackathons WHERE hackathon_id = ?', [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hackathon not found' });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create new hackathon
// @route   POST /api/hackathons
// @access  Private/Admin
exports.createHackathon = async (req, res) => {
    const { title, description, start_date, end_date, location, max_team_size, registration_deadline, status } = req.body;

    if (!title || !start_date || !end_date || !registration_deadline) {
        return res.status(400).json({ success: false, message: 'Please enter title, start/end date, and registration deadline.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO Hackathons (title, description, start_date, end_date, location, max_team_size, registration_deadline, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description || '', start_date, end_date, location || 'Online', max_team_size || 4, registration_deadline, status || 'Draft']
        );

        res.status(201).json({
            success: true,
            message: 'Hackathon created successfully',
            hackathon_id: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error creating hackathon', error: err.message });
    }
};

// @desc    Update hackathon
// @route   PUT /api/hackathons/:id
// @access  Private/Admin
exports.updateHackathon = async (req, res) => {
    const { title, description, start_date, end_date, location, max_team_size, registration_deadline, status } = req.body;
    const hackathonId = req.params.id;

    try {
        const [rows] = await db.query('SELECT * FROM Hackathons WHERE hackathon_id = ?', [hackathonId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hackathon not found' });
        }

        await db.query(
            'UPDATE Hackathons SET title = ?, description = ?, start_date = ?, end_date = ?, location = ?, max_team_size = ?, registration_deadline = ?, status = ? WHERE hackathon_id = ?',
            [title, description, start_date, end_date, location, max_team_size, registration_deadline, status, hackathonId]
        );

        res.status(200).json({ success: true, message: 'Hackathon updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating hackathon', error: err.message });
    }
};

// @desc    Delete hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private/Admin
exports.deleteHackathon = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Hackathons WHERE hackathon_id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Hackathon not found' });
        }

        await db.query('DELETE FROM Hackathons WHERE hackathon_id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Hackathon deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting hackathon', error: err.message });
    }
};
