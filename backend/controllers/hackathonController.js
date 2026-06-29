const db = require('../config/db');

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Private
exports.getAllHackathons = async (req, res) => {
    try {
        let query = 'SELECT * FROM Hackathons ORDER BY start_date DESC';
        let params = [];
        if (req.user.role === 'Manager') {
            query = `
                SELECT h.* FROM Hackathons h
                JOIN Hackathon_Managers hm ON h.hackathon_id = hm.hackathon_id
                WHERE hm.user_id = ? AND hm.status = 'Active'
                ORDER BY h.start_date DESC
            `;
            params = [req.user.user_id];
        } else if (req.user.role !== 'Admin') {
            query = "SELECT * FROM Hackathons WHERE status IN ('Published', 'Completed') ORDER BY start_date DESC";
        }
        
        const [hackathons] = await db.query(query, params);
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

// @desc    Get user's bookmarked hackathons
// @route   GET /api/hackathons/bookmarks/list
// @access  Private
exports.getBookmarks = async (req, res) => {
    const userId = req.user.user_id;
    try {
        const [bookmarks] = await db.query(
            `SELECT h.* FROM Bookmarks b
             JOIN Hackathons h ON b.hackathon_id = h.hackathon_id
             WHERE b.user_id = ?
             ORDER BY h.start_date DESC`,
            [userId]
        );
        res.status(200).json({ success: true, count: bookmarks.length, data: bookmarks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving bookmarks' });
    }
};

// @desc    Toggle hackathon bookmark
// @route   POST /api/hackathons/:id/bookmark
// @access  Private
exports.toggleBookmark = async (req, res) => {
    const hackathonId = req.params.id;
    const userId = req.user.user_id;

    try {
        // Check if hackathon exists
        const [hackathons] = await db.query('SELECT * FROM Hackathons WHERE hackathon_id = ?', [hackathonId]);
        if (hackathons.length === 0) {
            return res.status(404).json({ success: false, message: 'Hackathon not found' });
        }

        // Check if bookmark exists
        const [existing] = await db.query(
            'SELECT * FROM Bookmarks WHERE user_id = ? AND hackathon_id = ?',
            [userId, hackathonId]
        );

        if (existing.length > 0) {
            // Remove bookmark
            await db.query(
                'DELETE FROM Bookmarks WHERE user_id = ? AND hackathon_id = ?',
                [userId, hackathonId]
            );
            return res.status(200).json({ success: true, bookmarked: false, message: 'Bookmark removed' });
        } else {
            // Add bookmark
            await db.query(
                'INSERT INTO Bookmarks (user_id, hackathon_id) VALUES (?, ?)',
                [userId, hackathonId]
            );
            return res.status(200).json({ success: true, bookmarked: true, message: 'Bookmark added' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error toggling bookmark' });
    }
};

