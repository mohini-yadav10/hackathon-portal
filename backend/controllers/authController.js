const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @desc    Register a new user (Student role by default)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { name, email, password, college, branch, year } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
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
                'INSERT INTO Users (name, email, password, college, branch, year, role) VALUES (?, ?, ?, ?, ?, ?, "Student")',
                [name, email, hashedPassword, college || null, branch || null, year || null]
            );

            const userId = userResult.insertId;

            // Create blank Student Profile for the user
            await connection.query(
                'INSERT INTO Student_Profiles (user_id, github_url, linkedin_url, resume_path, bio) VALUES (?, ?, ?, ?, ?)',
                [userId, '', '', '', '']
            );

            // Add a default welcome notification
            await connection.query(
                'INSERT INTO Notifications (user_id, message) VALUES (?, ?)',
                [userId, 'Welcome to the Hackathon & Team Formation Portal! Please complete your profile to find matching teams.']
            );

            await connection.commit();
            
            // Generate token
            const token = generateToken(userId);

            res.status(201).json({
                success: true,
                token,
                user: {
                    user_id: userId,
                    name,
                    email,
                    role: 'Student',
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

        // Generate token
        const token = generateToken(user.user_id);

        res.status(200).json({
            success: true,
            token,
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
