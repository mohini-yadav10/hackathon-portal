const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

// Generate Access Token (Short-lived, e.g. 15m)
const generateAccessToken = (id, role) => {
    return jwt.sign(
        { id, role }, 
        process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#', 
        { expiresIn: '15m' }
    );
};

// Generate Refresh Token (Long-lived, e.g. 7d)
const generateRefreshToken = (id) => {
    return jwt.sign(
        { id }, 
        process.env.REFRESH_SECRET || 'supersecretrefreshkey123!@#', 
        { expiresIn: '7d' }
    );
};

// @desc    Register a new user (Supports Student, Judge, Manager)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { name, email, password, college, branch, year, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Please provide name, email, password and role' });
    }

    // Only allow registering Student, Judge, Manager roles
    if (!['Student', 'Judge', 'Manager'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid registration role' });
    }

    try {
        // Check if user exists
        const [existingUsers] = await db.query('SELECT user_id FROM Users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Start a Transaction for creating user and profile
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert User
            const [userResult] = await connection.query(
                'INSERT INTO Users (name, email, password, college, branch, year, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, email, hashedPassword, college || null, branch || null, year || null, role]
            );

            const userId = userResult.insertId;

            // Create profile only if the user is a Student
            if (role === 'Student') {
                await connection.query(
                    'INSERT INTO Student_Profiles (user_id, github_url, linkedin_url, resume_path, bio) VALUES (?, ?, ?, ?, ?)',
                    [userId, '', '', '', '']
                );
            }

            // Welcome Notification
            await connection.query(
                'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
                [userId, `Welcome to the portal! You are registered as a ${role}.`]
            );

            await connection.commit();
            
            // Generate tokens
            const accessToken = generateAccessToken(userId, role);
            const refreshToken = generateRefreshToken(userId);

            // Store refresh token in DB
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await db.query(
                'INSERT INTO Refresh_Tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [userId, refreshToken, expiresAt]
            );

            res.status(201).json({
                success: true,
                token: accessToken,
                refreshToken,
                user: {
                    user_id: userId,
                    name,
                    email,
                    role,
                    college: college || null,
                    branch: branch || null,
                    year: year || null
                }
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration', error: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    try {
        // Check for user
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Validate assignments for Judges and Managers
        if (user.role === 'Judge') {
            const [judgeRows] = await db.query('SELECT judge_id FROM Judges WHERE user_id = ? AND status = "Active"', [user.user_id]);
            if (judgeRows.length === 0) {
                return res.status(403).json({ success: false, message: 'You are not registered as an active Judge.' });
            }
            const [assignRows] = await db.query('SELECT assignment_id FROM Judge_Assignments WHERE judge_id = ? AND status = "Active"', [judgeRows[0].judge_id]);
            if (assignRows.length === 0) {
                return res.status(403).json({ success: false, isUnassignedJudge: true, message: 'You are not assigned to any hackathon.' });
            }
        } else if (user.role === 'Manager') {
            const [mgrRows] = await db.query('SELECT manager_id FROM Hackathon_Managers WHERE user_id = ? AND status = "Active"', [user.user_id]);
            if (mgrRows.length === 0) {
                return res.status(403).json({ success: false, message: 'You are not assigned as a manager to any hackathon.' });
            }
        }


        // Generate tokens
        const accessToken = generateAccessToken(user.user_id, user.role);
        const refreshToken = generateRefreshToken(user.user_id);

        // Save refresh token in DB (invalidate existing ones for safety if needed, or just insert)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.query(
            'INSERT INTO Refresh_Tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.user_id, refreshToken, expiresAt]
        );

        res.status(200).json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                college: user.college,
                branch: user.branch,
                year: user.year
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
    }
};

// @desc    Refresh Token rotation
// @route   POST /api/auth/refresh
// @access  Public
exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    try {
        // Find token in DB
        const [tokenRows] = await db.query(
            'SELECT * FROM Refresh_Tokens WHERE token = ? AND expires_at > NOW()', 
            [refreshToken]
        );

        if (tokenRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
        }

        // Verify Refresh Token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'supersecretrefreshkey123!@#');

        // Fetch User Info
        const [users] = await db.query('SELECT user_id, role FROM Users WHERE user_id = ?', [decoded.id]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // Rotate Refresh Token: delete the old one, generate a new one
        await db.query('DELETE FROM Refresh_Tokens WHERE token = ?', [refreshToken]);

        const newAccessToken = generateAccessToken(user.user_id, user.role);
        const newRefreshToken = generateRefreshToken(user.user_id);

        // Store new refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await db.query(
            'INSERT INTO Refresh_Tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.user_id, newRefreshToken, expiresAt]
        );

        res.status(200).json({
            success: true,
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        console.error('Token Refresh Error:', err);
        return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// @desc    Logout - Invalidate refresh token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    const { refreshToken } = req.body;

    try {
        if (refreshToken) {
            await db.query('DELETE FROM Refresh_Tokens WHERE token = ?', [refreshToken]);
        }
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout Error:', err);
        res.status(500).json({ success: false, message: 'Server error during logout' });
    }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide your email' });
    }

    try {
        const [users] = await db.query('SELECT user_id FROM Users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No user registered with this email' });
        }

        const userId = users[0].user_id;

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const tokenExpire = new Date(Date.now() + 3600000); // 1 hour

        // Update User
        await db.query(
            'UPDATE Users SET reset_password_token = ?, reset_password_expire = ? WHERE user_id = ?',
            [resetToken, tokenExpire, userId]
        );

        // MOCK EMAIL LOGGING
        console.log(`[PASSWORD RESET LINK]: http://localhost:5173/reset-password?token=${resetToken}`);

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to your email (Mocked to Console).'
        });
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ success: false, message: 'Server error requesting password reset' });
    }
};

// @desc    Confirm password reset
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Please provide token and new password' });
    }

    try {
        // Find user by valid unexpired token
        const [users] = await db.query(
            'SELECT user_id FROM Users WHERE reset_password_token = ? AND reset_password_expire > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const userId = users[0].user_id;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token
        await db.query(
            'UPDATE Users SET password = ?, reset_password_token = NULL, reset_password_expire = NULL WHERE user_id = ?',
            [hashedPassword, userId]
        );

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now login.'
        });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ success: false, message: 'Server error resetting password' });
    }
};
