const express = require('express');
const { check } = require('express-validator');
const chatController = require('../controllers/chat.controller');
const { protect, isVerified } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(isVerified);

/**
 * @route   POST /api/chats/private
 * @desc    Send a private message to another user
 * @access  Private
 */
router.post(
  '/private',
  [
    check('recipient', 'Recipient ID is required').not().isEmpty(),
    check('content', 'Message content is required').not().isEmpty(),
  ],
  chatController.sendPrivateMessage
);

/**
 * @route   POST /api/chats/team/:teamId
 * @desc    Send a message to a team
 * @access  Private (Team members only)
 */
router.post(
  '/team/:teamId',
  [
    check('content', 'Message content is required').not().isEmpty(),
  ],
  chatController.sendTeamMessage
);

/**
 * @route   POST /api/chats/project/:projectId
 * @desc    Send a message to a project
 * @access  Private (Project client and assigned freelancers/team members only)
 */
router.post(
  '/project/:projectId',
  [
    check('content', 'Message content is required').not().isEmpty(),
  ],
  chatController.sendProjectMessage
);

/**
 * @route   GET /api/chats/private/:userId
 * @desc    Get private messages between two users
 * @access  Private
 */
router.get('/private/:userId', chatController.getPrivateMessages);

/**
 * @route   GET /api/chats/team/:teamId
 * @desc    Get team messages
 * @access  Private (Team members only)
 */
router.get('/team/:teamId', chatController.getTeamMessages);

/**
 * @route   GET /api/chats/project/:projectId
 * @desc    Get project messages
 * @access  Private (Project client and assigned freelancers/team members only)
 */
router.get('/project/:projectId', chatController.getProjectMessages);

/**
 * @route   GET /api/chats/conversations
 * @desc    Get user's recent conversations
 * @access  Private
 */
router.get('/conversations', chatController.getConversations);

/**
 * @route   POST /api/chats/:messageId/reply
 * @desc    Reply to a message
 * @access  Private
 */
router.post(
  '/:messageId/reply',
  [
    check('content', 'Message content is required').not().isEmpty(),
  ],
  chatController.replyToMessage
);

/**
 * @route   POST /api/chats/:messageId/react
 * @desc    Add reaction to a message
 * @access  Private
 */
router.post(
  '/:messageId/react',
  [
    check('reaction', 'Reaction emoji is required').not().isEmpty(),
  ],
  chatController.reactToMessage
);

/**
 * @route   DELETE /api/chats/:messageId
 * @desc    Delete a message
 * @access  Private (Message sender only)
 */
router.delete('/:messageId', chatController.deleteMessage);

/**
 * @route   PUT /api/chats/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put(
  '/read',
  [
    check('messageIds', 'Message IDs are required').isArray(),
  ],
  chatController.markMessagesAsRead
);

/**
 * @route   GET /api/chats/unread
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread', chatController.getUnreadCount);

module.exports = router;