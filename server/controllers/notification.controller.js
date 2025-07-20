const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all notifications for the current user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    // Build query
    const query = { recipient: req.user.id };
    
    // Add filter for unread notifications if requested
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name avatar')
      .populate('project', 'title')
      .populate('task', 'title')
      .populate('team', 'name avatar');
    
    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    // Update notification
    notification.isRead = true;
    notification.readAt = Date.now();
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    // Update all unread notifications for the user
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if notification belongs to current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await notification.remove();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    next(error);
  }
};

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/read
 * @access  Private
 */
exports.deleteReadNotifications = async (req, res, next) => {
  try {
    // Delete all read notifications for the user
    const result = await Notification.deleteMany({
      recipient: req.user.id,
      isRead: true,
    });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} read notifications deleted successfully`,
    });
  } catch (error) {
    console.error('Delete read notifications error:', error);
    next(error);
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    
    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    next(error);
  }
};

/**
 * @desc    Create a system notification for multiple users
 * @route   POST /api/notifications/system
 * @access  Private (Admin only)
 */
exports.createSystemNotification = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, recipients, link, priority, expiresAt } = req.body;
    
    // If recipients is not provided, send to all users
    let userIds = [];
    
    if (recipients && recipients.length > 0) {
      // Validate that all recipients exist
      const users = await User.find({ _id: { $in: recipients } }).select('_id');
      userIds = users.map(user => user._id);
    } else {
      // Get all user IDs
      const users = await User.find().select('_id');
      userIds = users.map(user => user._id);
    }
    
    // Create notifications for each user
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = new Notification({
        recipient: userId,
        type: 'system',
        title,
        content,
        link,
        priority: priority || 'normal',
        isSystemNotification: true,
        createdBy: req.user.id,
      });
      
      // Add expiration if provided
      if (expiresAt) {
        notification.expiresAt = new Date(expiresAt);
      }
      
      await notification.save();
      notifications.push(notification);
      
      // Add notification to user's notifications
      await User.findByIdAndUpdate(userId, {
        $push: { notifications: notification._id },
      });
    }
    
    res.status(201).json({
      success: true,
      message: `System notification sent to ${notifications.length} users`,
      notifications,
    });
  } catch (error) {
    console.error('Create system notification error:', error);
    next(error);
  }
};

/**
 * @desc    Create a notification for a specific user
 * @route   POST /api/notifications/user/:userId
 * @access  Private (Admin only)
 */
exports.createUserNotification = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, type, link, priority, expiresAt } = req.body;
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create notification
    const notification = new Notification({
      recipient: userId,
      type: type || 'system',
      title,
      content,
      link,
      priority: priority || 'normal',
      createdBy: req.user.id,
    });
    
    // Add expiration if provided
    if (expiresAt) {
      notification.expiresAt = new Date(expiresAt);
    }
    
    await notification.save();
    
    // Add notification to user's notifications
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: notification._id },
    });
    
    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Create user notification error:', error);
    next(error);
  }
};

/**
 * @desc    Create a notification for a team
 * @route   POST /api/notifications/team/:teamId
 * @access  Private (Team admin or creator only)
 */
exports.createTeamNotification = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, link, priority, expiresAt } = req.body;
    const { teamId } = req.params;
    
    // Check if team exists and user is authorized
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    // Check if user is team creator or admin
    const isCreator = team.creator.toString() === req.user.id;
    const isAdmin = team.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: 'Not authorized to create team notifications',
      });
    }
    
    // Create notifications for each team member
    const notifications = [];
    
    for (const member of team.members) {
      const notification = new Notification({
        recipient: member.user,
        team: teamId,
        type: 'team',
        title,
        content,
        link,
        priority: priority || 'normal',
        createdBy: req.user.id,
      });
      
      // Add expiration if provided
      if (expiresAt) {
        notification.expiresAt = new Date(expiresAt);
      }
      
      await notification.save();
      notifications.push(notification);
      
      // Add notification to user's notifications
      await User.findByIdAndUpdate(member.user, {
        $push: { notifications: notification._id },
      });
    }
    
    res.status(201).json({
      success: true,
      message: `Team notification sent to ${notifications.length} members`,
      notifications,
    });
  } catch (error) {
    console.error('Create team notification error:', error);
    next(error);
  }
};