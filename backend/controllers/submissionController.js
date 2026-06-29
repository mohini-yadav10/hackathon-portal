const db = require('../config/db');

// @desc    Submit or update a project
// @route   POST /api/submissions
// @access  Private (Leader)
exports.submitProject = async (req, res) => {
    const {
        team_id, hackathon_id, project_title, description,
        problem_statement, solution, tech_stack,
        github_url, ppt_url, demo_video_url
    } = req.body;

    if (!team_id || !hackathon_id || !project_title || !description || !problem_statement || !solution || !tech_stack || !github_url) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
    }

    try {
        await db.query('CALL SubmitProject(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            team_id, hackathon_id, project_title, description,
            problem_statement, solution, tech_stack,
            github_url, ppt_url || null, demo_video_url || null
        ]);

        res.status(200).json({ success: true, message: 'Project submitted successfully' });
    } catch (err) {
        console.error('Submit Project Error:', err);
        const msg = err.sqlMessage || err.message;
        res.status(400).json({ success: false, message: msg });
    }
};

// @desc    Get submission for a team
// @route   GET /api/submissions/team/:teamId
// @access  Private
exports.getSubmissionByTeam = async (req, res) => {
    const { teamId } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT s.*, t.team_name, h.title AS hackathon_title FROM Submissions s JOIN Teams t ON s.team_id = t.team_id JOIN Hackathons h ON s.hackathon_id = h.hackathon_id WHERE s.team_id = ?',
            [teamId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No submission found for this team' });
        }
        res.status(200).json({ success: true, submission: rows[0] });
    } catch (err) {
        console.error('Get Submission Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all submissions (for judges/admin)
// @route   GET /api/submissions
// @access  Private (Judge, Admin)
exports.getAllSubmissions = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*, t.team_name, h.title AS hackathon_title 
             FROM Submissions s 
             JOIN Teams t ON s.team_id = t.team_id 
             JOIN Hackathons h ON s.hackathon_id = h.hackathon_id
             ORDER BY s.created_at DESC`
        );
        res.status(200).json({ success: true, submissions: rows });
    } catch (err) {
        console.error('Get All Submissions Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a submission
// @route   DELETE /api/submissions/:id
// @access  Private (Leader)
exports.deleteSubmission = async (req, res) => {
    const { id } = req.params;
    try {
        // Verify ownership
        const [rows] = await db.query(
            `SELECT s.submission_id FROM Submissions s 
             JOIN Teams t ON s.team_id = t.team_id
             WHERE s.submission_id = ? AND t.leader_id = ?`,
            [id, req.user.user_id]
        );
        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this submission' });
        }

        await db.query('DELETE FROM Submissions WHERE submission_id = ?', [id]);
        res.status(200).json({ success: true, message: 'Submission deleted' });
    } catch (err) {
        console.error('Delete Submission Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
