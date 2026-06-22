const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Protect routes - Verify JWT
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route, no token provided' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwttokenkey123!@#');

        // Get user from database
        const [rows] = await db.query('SELECT user_id, name, email, role, college, branch, year FROM Users WHERE user_id = ?', [decoded.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No user found with this id' });
        }

        req.user = rows[0];
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route, token failed' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route` 
            });
        }
        next();
    };
};
