const db = require('../config/db');

// @desc    Get assigned hackathons for the logged-in judge
// @route   GET /api/judge/hackathons
// @access  Private/Judge
exports.getAssignedHackathons = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [hackathons] = await db.query(
            `SELECT DISTINCT h.* FROM Hackathons h 
             JOIN Judge_Assignments ja ON h.hackathon_id = ja.hackathon_id 
             JOIN Judges j ON ja.judge_id = j.judge_id 
             WHERE j.user_id = ? AND ja.status = 'Active' AND j.status = 'Active'`,
            [userId]
        );

        res.status(200).json({ success: true, count: hackathons.length, data: hackathons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching assigned hackathons' });
    }
};

// @desc    Get assigned project submissions for the judge
// @route   GET /api/judge/submissions
// @access  Private/Judge
exports.getAssignedSubmissions = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [submissions] = await db.query(
            `SELECT * FROM Judge_Dashboard_View 
             WHERE judge_user_id = ? AND assignment_status = 'Active'
             ORDER BY registration_date DESC`,
            [userId]
        );

        res.status(200).json({ success: true, count: submissions.length, data: submissions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error fetching assigned submissions' });
    }
};

// @desc    Create or update project evaluation (marks & feedback)
// @route   POST /api/judge/evaluations
// @access  Private/Judge
exports.submitEvaluation = async (req, res) => {
    const userId = req.user.user_id;
    const { 
        submission_id, 
        innovation, 
        technical_complexity, 
        ui_ux, 
        database_design, 
        presentation, 
        documentation, 
        feedback 
    } = req.body;

    if (!submission_id || innovation === undefined || technical_complexity === undefined || 
        ui_ux === undefined || database_design === undefined || presentation === undefined || 
        documentation === undefined || !feedback) {
        return res.status(400).json({ success: false, message: 'Please provide all score parameters and feedback' });
    }

    // Parse integer values
    const inVal = parseInt(innovation);
    const techVal = parseInt(technical_complexity);
    const uiVal = parseInt(ui_ux);
    const dbVal = parseInt(database_design);
    const presVal = parseInt(presentation);
    const docVal = parseInt(documentation);

    // Validate bounds
    if (isNaN(inVal) || inVal < 0 || inVal > 20 ||
        isNaN(techVal) || techVal < 0 || techVal > 20 ||
        isNaN(uiVal) || uiVal < 0 || uiVal > 15 ||
        isNaN(dbVal) || dbVal < 0 || dbVal > 15 ||
        isNaN(presVal) || presVal < 0 || presVal > 15 ||
        isNaN(docVal) || docVal < 0 || docVal > 15) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid score ranges: Innovation (0-20), Tech (0-20), UI/UX (0-15), DB (0-15), Presentation (0-15), Doc (0-15)' 
        });
    }

    try {
        // Fetch judge_id
        const [judges] = await db.query('SELECT judge_id FROM Judges WHERE user_id = ? AND status = "Active"', [userId]);
        if (judges.length === 0) {
            return res.status(403).json({ success: false, message: 'Unauthorized. You are not an active Judge.' });
        }
        const judgeId = judges[0].judge_id;

        // Verify assignment for the submission's team
        const [assignments] = await db.query(
            `SELECT 1 FROM Submissions s 
             JOIN Judge_Assignments ja ON s.team_id = ja.team_id AND s.hackathon_id = ja.hackathon_id
             WHERE s.submission_id = ? AND ja.judge_id = ? AND ja.status = 'Active'`,
            [submission_id, judgeId]
        );
        if (assignments.length === 0) {
            return res.status(403).json({ success: false, message: 'Unauthorized. You are not assigned to evaluate this project.' });
        }

        // Call Stored Procedure to submit evaluation and trigger notifications
        await db.query(
            'CALL SubmitEvaluation(?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [judgeId, submission_id, inVal, techVal, uiVal, dbVal, presVal, docVal, feedback.trim()]
        );

        res.status(200).json({ success: true, message: 'Evaluation submitted successfully!' });
    } catch (err) {
        console.error('Submit Evaluation Error:', err);
        res.status(500).json({ success: false, message: 'Server error saving evaluation', error: err.message });
    }
};

// @desc    Get leaderboard for a specific hackathon
// @route   GET /api/judge/leaderboard/:hackathonId
// @access  Private
exports.getLeaderboard = async (req, res) => {
    const hackathonId = req.params.hackathonId;

    try {
        const [leaderboard] = await db.query(
            'CALL GenerateLeaderboard(?)',
            [hackathonId]
        );

        // MySQL CALL returns array of arrays, actual result is the first element
        const rows = leaderboard[0] || [];

        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving leaderboard' });
    }
};
