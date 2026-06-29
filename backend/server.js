const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import db configuration to test connection on startup
require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rate Limiter for Authentication endpoints (prevent brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Route Controllers & Middleware
const { protect, authorize } = require('./middleware/auth');
const authCtrl = require('./controllers/authController');
const profileCtrl = require('./controllers/profileController');
const hackathonCtrl = require('./controllers/hackathonController');
const teamCtrl = require('./controllers/teamController');
const inviteCtrl = require('./controllers/invitationController');
const regCtrl = require('./controllers/registrationController');
const adminCtrl = require('./controllers/adminController');
const notifCtrl = require('./controllers/notificationController');
const submissionCtrl = require('./controllers/submissionController');
const judgeCtrl = require('./controllers/judgeController');
const upload = require('./middleware/upload');

// 1. Authentication Routes
app.post('/api/auth/register', authLimiter, authCtrl.register);
app.post('/api/auth/login', authLimiter, authCtrl.login);
app.post('/api/auth/refresh', authCtrl.refresh);
app.post('/api/auth/logout', protect, authCtrl.logout);
app.post('/api/auth/forgot-password', authCtrl.forgotPassword);
app.post('/api/auth/reset-password', authCtrl.resetPassword);
app.get('/api/auth/me', protect, authCtrl.getMe);

// 2. Student Profile Routes
app.get('/api/profiles', protect, profileCtrl.getProfile);
app.get('/api/profiles/:userId', protect, profileCtrl.getProfile);
app.put('/api/profiles', protect, profileCtrl.updateProfile);
app.post('/api/profiles/upload-avatar', protect, upload.single('avatar'), profileCtrl.uploadAvatar);
app.post('/api/profiles/upload-resume', protect, upload.single('resume'), profileCtrl.uploadResume);

// 3. Hackathon Management Routes
app.get('/api/hackathons', protect, hackathonCtrl.getAllHackathons);
app.get('/api/hackathons/active', protect, hackathonCtrl.getActiveHackathons);
app.get('/api/hackathons/bookmarks/list', protect, hackathonCtrl.getBookmarks);
app.post('/api/hackathons/:id/bookmark', protect, hackathonCtrl.toggleBookmark);
app.get('/api/hackathons/:id', protect, hackathonCtrl.getHackathon);
app.post('/api/hackathons', protect, authorize('Admin', 'Manager'), hackathonCtrl.createHackathon);
app.put('/api/hackathons/:id', protect, authorize('Admin', 'Manager'), hackathonCtrl.updateHackathon);
app.delete('/api/hackathons/:id', protect, authorize('Admin', 'Manager'), hackathonCtrl.deleteHackathon);


// 4. Team Formation Routes
app.post('/api/teams', protect, teamCtrl.createTeam);
app.get('/api/teams/my-teams', protect, teamCtrl.getMyTeams);
app.get('/api/teams/search/match', protect, teamCtrl.searchTeams);
app.get('/api/teams/:id', protect, teamCtrl.getTeamDetails);
app.delete('/api/teams/:id/leave', protect, teamCtrl.leaveTeam);
app.delete('/api/teams/:id/members/:userId', protect, teamCtrl.removeMember);
app.put('/api/teams/:id/members/:userId/role', protect, teamCtrl.assignMemberRole);

// 5. Invitation System Routes
app.post('/api/invitations', protect, inviteCtrl.sendInvitation);
app.post('/api/invitations/request', protect, inviteCtrl.requestToJoin);
app.get('/api/invitations/pending', protect, inviteCtrl.getPendingInvitations);
app.get('/api/invitations/team/:teamId', protect, inviteCtrl.getTeamSentInvitations);
app.put('/api/invitations/:id/accept', protect, inviteCtrl.acceptInvitation);
app.put('/api/invitations/:id/reject', protect, inviteCtrl.rejectInvitation);
app.delete('/api/invitations/:id', protect, inviteCtrl.cancelInvitation);



// 6. Registration Module Routes
app.post('/api/registrations', protect, regCtrl.submitRegistration);
app.get('/api/registrations', protect, authorize('Admin', 'Manager'), regCtrl.getAllRegistrations);
app.put('/api/registrations/:id/status', protect, authorize('Admin', 'Manager'), regCtrl.updateRegistrationStatus);

// 7. Notification Routes
app.get('/api/notifications', protect, notifCtrl.getNotifications);
app.put('/api/notifications/read-all', protect, notifCtrl.markAllAsRead);
app.put('/api/notifications/:id/read', protect, notifCtrl.markAsRead);
app.delete('/api/notifications/:id', protect, notifCtrl.deleteNotification);

// 9. Submission Routes
app.post('/api/submissions', protect, authorize('Student', 'Leader'), submissionCtrl.submitProject);
app.get('/api/submissions', protect, authorize('Admin', 'Judge'), submissionCtrl.getAllSubmissions);
app.get('/api/submissions/team/:teamId', protect, submissionCtrl.getSubmissionByTeam);
app.delete('/api/submissions/:id', protect, authorize('Student', 'Leader'), submissionCtrl.deleteSubmission);

// 8. Admin & Announcement Routes
app.get('/api/admin/users', protect, authorize('Admin'), adminCtrl.getAllUsers);
app.put('/api/admin/users/:id/role', protect, authorize('Admin'), adminCtrl.updateUserRole);
app.delete('/api/admin/users/:id', protect, authorize('Admin'), adminCtrl.deleteUser);
app.post('/api/admin/announcements', protect, authorize('Admin', 'Manager'), adminCtrl.createAnnouncement);
app.get('/api/admin/announcements', protect, adminCtrl.getAnnouncements);
app.get('/api/admin/analytics', protect, authorize('Admin', 'Manager'), adminCtrl.getAnalytics);
app.get('/api/admin/export/csv', protect, authorize('Admin'), adminCtrl.exportRegistrationsCSV);

// New assignments routes
app.get('/api/admin/managers', protect, authorize('Admin'), adminCtrl.getManagers);
app.get('/api/admin/judges', protect, authorize('Admin', 'Manager'), adminCtrl.getJudges);
app.post('/api/admin/assignments/manager', protect, authorize('Admin'), adminCtrl.assignManager);
app.post('/api/admin/assignments/judge', protect, authorize('Admin', 'Manager'), adminCtrl.assignJudge);
app.get('/api/admin/assignments/:hackathonId', protect, authorize('Admin', 'Manager'), adminCtrl.getHackathonAssignments);
app.delete('/api/admin/assignments/manager/:id', protect, authorize('Admin'), adminCtrl.removeManagerAssignment);
app.delete('/api/admin/assignments/judge/:id', protect, authorize('Admin', 'Manager'), adminCtrl.removeJudgeAssignment);

// 10. Judge Routes
app.get('/api/judge/hackathons', protect, authorize('Judge'), judgeCtrl.getAssignedHackathons);
app.get('/api/judge/submissions', protect, authorize('Judge'), judgeCtrl.getAssignedSubmissions);
app.post('/api/judge/evaluations', protect, authorize('Judge'), judgeCtrl.submitEvaluation);
app.get('/api/judge/leaderboard/:hackathonId', protect, judgeCtrl.getLeaderboard);



// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
