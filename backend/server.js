const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import db configuration to test connection on startup
require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

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

// 1. Authentication Routes
app.post('/api/auth/register', authCtrl.register);
app.post('/api/auth/login', authCtrl.login);
app.get('/api/auth/me', protect, authCtrl.getMe);

// 2. Student Profile Routes
app.get('/api/profiles', protect, profileCtrl.getProfile);
app.get('/api/profiles/:userId', protect, profileCtrl.getProfile);
app.put('/api/profiles', protect, profileCtrl.updateProfile);

// 3. Hackathon Management Routes
app.get('/api/hackathons', protect, hackathonCtrl.getAllHackathons);
app.get('/api/hackathons/active', protect, hackathonCtrl.getActiveHackathons);
app.get('/api/hackathons/:id', protect, hackathonCtrl.getHackathon);
app.post('/api/hackathons', protect, authorize('Admin'), hackathonCtrl.createHackathon);
app.put('/api/hackathons/:id', protect, authorize('Admin'), hackathonCtrl.updateHackathon);
app.delete('/api/hackathons/:id', protect, authorize('Admin'), hackathonCtrl.deleteHackathon);

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
app.get('/api/invitations/pending', protect, inviteCtrl.getPendingInvitations);
app.put('/api/invitations/:id/accept', protect, inviteCtrl.acceptInvitation);
app.put('/api/invitations/:id/reject', protect, inviteCtrl.rejectInvitation);

// 6. Registration Module Routes
app.post('/api/registrations', protect, regCtrl.submitRegistration);
app.get('/api/registrations', protect, authorize('Admin'), regCtrl.getAllRegistrations);
app.put('/api/registrations/:id/status', protect, authorize('Admin'), regCtrl.updateRegistrationStatus);

// 7. Notification Routes
app.get('/api/notifications', protect, notifCtrl.getNotifications);
app.put('/api/notifications/read-all', protect, notifCtrl.markAllAsRead);
app.put('/api/notifications/:id/read', protect, notifCtrl.markAsRead);

// 8. Admin & Announcement Routes
app.get('/api/admin/users', protect, authorize('Admin'), adminCtrl.getAllUsers);
app.post('/api/admin/announcements', protect, authorize('Admin'), adminCtrl.createAnnouncement);
app.get('/api/admin/announcements', protect, adminCtrl.getAnnouncements);
app.get('/api/admin/analytics', protect, authorize('Admin'), adminCtrl.getAnalytics);

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
