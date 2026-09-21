const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { user_id: req.user.id },
            order: [['created_at', 'DESC']],
            limit: 50
        });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            where: { id: req.params.id, user_id: req.user.id }
        });
        if (!notification) return res.status(404).json({ error: 'Notification not found' });
        await notification.update({ is_read: true });
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.update(
            { is_read: true },
            { where: { user_id: req.user.id, is_read: false } }
        );
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
