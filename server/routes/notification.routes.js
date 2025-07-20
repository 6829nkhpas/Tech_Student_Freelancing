const express = require('express');
const { check } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { protect, isVerified, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(isVerified);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   DELETE /api/notifications/read
 * @desc    Delete all read notifications
 * @access  Private
 */
router.delete('/read', notificationController.deleteReadNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   POST /api/notifications/system
 * @desc    Create a system notification for multiple users
 * @access  Private (Admin only)
 */
router.post(
  '/system',
  isAdmin,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
    check('recipients', 'Recipients must be an array').optional().isArray(),
  ],
  notificationController.createSystemNotification
);

/**
 * @route   POST /api/notifications/user/:userId
 * @desc    Create a notification for a specific user
 * @access  Private (Admin only)
 */
router.post(
  '/user/:userId',
  isAdmin,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
    check('type', 'Type must be a string').optional().isString(),
  ],
  notificationController.createUserNotification
);

/**
 * @route   POST /api/notifications/team/:teamId
 * @desc    Create a notification for a team
 * @access  Private (Team admin or creator only)
 */
router.post(
  '/team/:teamId',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
  ],
  notificationController.createTeamNotification
);

module.exports = router;