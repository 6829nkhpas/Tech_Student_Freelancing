const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Task title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Task description cannot exceed 2000 characters'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    milestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project.milestones',
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'in_review', 'done'],
      default: 'not_started',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: Date,
    startDate: Date,
    completedDate: Date,
    estimatedHours: Number,
    actualHours: Number,
    timeTracking: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      startTime: Date,
      endTime: Date,
      duration: Number, // in minutes
      notes: String,
    }],
    attachments: [{
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
    }],
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: Date,
      attachments: [{
        name: String,
        url: String,
        type: String,
      }],
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    dependencies: [{
      task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
      type: {
        type: String,
        enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'],
        default: 'finish_to_start',
      },
    }],
    githubPRLink: String,
    githubCommitLinks: [String],
    isSubtask: {
      type: Boolean,
      default: false,
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    subtasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);