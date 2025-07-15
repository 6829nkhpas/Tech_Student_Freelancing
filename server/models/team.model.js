const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [50, 'Team name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Team description cannot exceed 500 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['leader', 'developer', 'designer', 'tester', 'writer', 'marketer', 'member'],
          default: 'member',
        },
        permissions: {
          canInvite: {
            type: Boolean,
            default: false,
          },
          canRemove: {
            type: Boolean,
            default: false,
          },
          canEditTeam: {
            type: Boolean,
            default: false,
          },
          canManageProjects: {
            type: Boolean,
            default: false,
          },
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
      },
    ],
    invitations: [
      {
        email: {
          type: String,
          required: true,
        },
        token: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ['leader', 'developer', 'designer', 'tester', 'writer', 'marketer', 'member'],
          default: 'member',
        },
        sentBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],
    skills: [{
      type: String,
      trim: true,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    completedProjects: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    documents: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);