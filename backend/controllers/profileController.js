const db = require('../config/db');

// @desc    Get user profile (includes basic user info, profile details, skills, and interests)
// @route   GET /api/profiles/:userId
// @access  Private
exports.getProfile = async (req, res) => {
    const userId = req.params.userId || req.user.user_id;

    try {
        // Fetch user basic data
        const [users] = await db.query(
            'SELECT user_id, name, email, college, branch, year, role FROM Users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // Fetch profile details
        const [profiles] = await db.query(
            'SELECT github_url, linkedin_url, resume_path, bio FROM Student_Profiles WHERE user_id = ?',
            [userId]
        );

        const profile = profiles[0] || { github_url: '', linkedin_url: '', resume_path: '', bio: '' };

        // Fetch skills
        const [skillsRows] = await db.query(
            'SELECT skill FROM Student_Skills WHERE user_id = ?',
            [userId]
        );
        const skills = skillsRows.map(row => row.skill);

        // Fetch interests
        const [interestsRows] = await db.query(
            'SELECT interest FROM Student_Interests WHERE user_id = ?',
            [userId]
        );
        const interests = interestsRows.map(row => row.interest);

        res.status(200).json({
            success: true,
            data: {
                ...user,
                github_url: profile.github_url,
                linkedin_url: profile.linkedin_url,
                resume_path: profile.resume_path,
                bio: profile.bio,
                skills,
                interests
            }
        });
    } catch (err) {
        console.error('Fetch Profile Error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving profile', error: err.message });
    }
};

// @desc    Update student profile, skills, and interests
// @route   PUT /api/profiles
// @access  Private
exports.updateProfile = async (req, res) => {
    const userId = req.user.user_id;
    const { github_url, linkedin_url, bio, skills, interests, college, branch, year } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update basic user information (college, branch, year)
        await connection.query(
            'UPDATE Users SET college = ?, branch = ?, year = ? WHERE user_id = ?',
            [college || null, branch || null, year || null, userId]
        );

        // 2. Check if student profile exists, if not create one, otherwise update it
        const [profiles] = await connection.query('SELECT profile_id FROM Student_Profiles WHERE user_id = ?', [userId]);
        if (profiles.length === 0) {
            await connection.query(
                'INSERT INTO Student_Profiles (user_id, github_url, linkedin_url, bio) VALUES (?, ?, ?, ?)',
                [userId, github_url || '', linkedin_url || '', bio || '']
            );
        } else {
            await connection.query(
                'UPDATE Student_Profiles SET github_url = ?, linkedin_url = ?, bio = ? WHERE user_id = ?',
                [github_url || '', linkedin_url || '', bio || '', userId]
            );
        }

        // 3. Update Skills (Clear existing and re-insert for normalized table)
        await connection.query('DELETE FROM Student_Skills WHERE user_id = ?', [userId]);
        if (skills && Array.isArray(skills) && skills.length > 0) {
            const skillQueries = skills.map(skill => {
                return connection.query('INSERT INTO Student_Skills (user_id, skill) VALUES (?, ?)', [userId, skill.trim()]);
            });
            await Promise.all(skillQueries);
        }

        // 4. Update Interests (Clear existing and re-insert for normalized table)
        await connection.query('DELETE FROM Student_Interests WHERE user_id = ?', [userId]);
        if (interests && Array.isArray(interests) && interests.length > 0) {
            const interestQueries = interests.map(interest => {
                return connection.query('INSERT INTO Student_Interests (user_id, interest) VALUES (?, ?)', [userId, interest.trim()]);
            });
            await Promise.all(interestQueries);
        }

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        await connection.rollback();
        console.error('Update Profile Error:', err);
        res.status(500).json({ success: false, message: 'Server error updating profile', error: err.message });
    } finally {
        connection.release();
    }
};
