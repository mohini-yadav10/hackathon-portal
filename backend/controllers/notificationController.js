const db = require('../config/db');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    const userId = req.user.user_id;

    try {
        const [notifications] = await db.query(
            'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error retrieving notifications' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.user_id;

    try {
        const [rows] = await db.query(
            'SELECT user_id FROM Notifications WHERE notification_id = ?',
            [notificationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await db.query(
            'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ?',
            [notificationId]
        );

        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error marking notification as read' });
    }
};

// @desc    Mark all notifications as read for current user
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
    const userId = req.user.user_id;

    try {
        await db.query(
            'UPDATE Notifications SET is_read = TRUE WHERE user_id = ?',
            [userId]
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error marking all notifications as read' });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.user_id;
    try {
        const [rows] = await db.query('SELECT user_id FROM Notifications WHERE notification_id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Notification not found' });
        if (rows[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });

        await db.query('DELETE FROM Notifications WHERE notification_id = ?', [id]);
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error deleting notification' });
    }
};
