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
            'SELECT github_url, linkedin_url, resume_path, bio, profile_pic_path FROM Student_Profiles WHERE user_id = ?',
            [userId]
        );

        const profile = profiles[0] || { github_url: '', linkedin_url: '', resume_path: '', bio: '', profile_pic_path: null };

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
                profile_pic_path: profile.profile_pic_path,
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

// @desc    Upload Profile Picture (Avatar)
// @route   POST /api/profiles/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const userId = req.user.user_id;
    const profilePicPath = `/uploads/avatars/${req.file.filename}`;

    try {
        const [profiles] = await db.query('SELECT profile_id FROM Student_Profiles WHERE user_id = ?', [userId]);
        if (profiles.length === 0) {
            await db.query(
                'INSERT INTO Student_Profiles (user_id, profile_pic_path) VALUES (?, ?)',
                [userId, profilePicPath]
            );
        } else {
            await db.query(
                'UPDATE Student_Profiles SET profile_pic_path = ? WHERE user_id = ?',
                [profilePicPath, userId]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            profile_pic_path: profilePicPath
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error uploading profile picture' });
    }
};

// @desc    Upload Resume
// @route   POST /api/profiles/upload-resume
// @access  Private
exports.uploadResume = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF/Word document' });
    }

    const userId = req.user.user_id;
    const resumePath = `/uploads/resumes/${req.file.filename}`;

    try {
        const [profiles] = await db.query('SELECT profile_id FROM Student_Profiles WHERE user_id = ?', [userId]);
        if (profiles.length === 0) {
            await db.query(
                'INSERT INTO Student_Profiles (user_id, resume_path) VALUES (?, ?)',
                [userId, resumePath]
            );
        } else {
            await db.query(
                'UPDATE Student_Profiles SET resume_path = ? WHERE user_id = ?',
                [resumePath, userId]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Resume uploaded successfully',
            resume_path: resumePath
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error uploading resume' });
    }
};

