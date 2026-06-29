const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/avatars'),
    path.join(__dirname, '../uploads/resumes')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            cb(null, path.join(__dirname, '../uploads/avatars'));
        } else if (file.fieldname === 'resume') {
            cb(null, path.join(__dirname, '../uploads/resumes'));
        } else {
            cb(null, path.join(__dirname, '../uploads'));
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filters
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'avatar') {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only JPEG, JPG, and PNG images are allowed!'));
        }
    } else if (file.fieldname === 'resume') {
        const allowedTypes = /pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.doc') || file.originalname.endsWith('.docx');
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            return cb(new Error('Only PDF and Word documents are allowed!'));
        }
    } else {
        cb(null, true);
    }
};

// Multer Upload Instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

module.exports = upload;
