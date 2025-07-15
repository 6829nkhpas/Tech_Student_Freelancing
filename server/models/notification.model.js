const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    type: {
      type: String,
      enum: [
        'project', // Project related notifications
        'proposal', // Proposal accepted/rejected
        'team', // Team invitations, removals
        'task', // Task assignments, completions
        'message', // New messages
        'payment', // Payment received/sent
        'milestone', // Milestone completed
        'system', // System notifications
        'badge', // Badge earned
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    link: String, // URL to redirect when clicked
    // References to related entities
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project.proposals',
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For system-wide notifications
    isGlobal: {
      type: Boolean,
      default: false,
    },
    // For role-specific notifications
    targetRole: {
      type: String,
      enum: ['student', 'client', 'admin', 'all'],
      default: 'all',
    },
    // For expiring notifications
    expiresAt: Date,
    // For actionable notifications
    actions: [{
      label: String, // e.g., "Accept", "Reject", "View"
      actionType: String, // e.g., "api_call", "redirect"
      value: String, // API endpoint or URL
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: Date,
    }],
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  { timestamps: true }
);

// Create indexes for faster queries
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ team: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isGlobal: 1, targetRole: 1 });

module.exports = mongoose.model('Notification', notificationSchema);