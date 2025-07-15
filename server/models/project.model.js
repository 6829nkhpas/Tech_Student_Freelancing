const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Project title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [5000, 'Project description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      enum: [
        'Web Development',
        'Mobile Development',
        'UI/UX Design',
        'Data Science',
        'Machine Learning',
        'Blockchain',
        'DevOps',
        'Content Writing',
        'Digital Marketing',
        'Other',
      ],
    },
    skills: [{
      type: String,
      required: [true, 'At least one skill is required'],
    }],
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    duration: {
      type: String,
      enum: ['Less than 1 week', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', '6+ months'],
      required: [true, 'Project duration is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'review', 'completed', 'cancelled'],
      default: 'open',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'invite_only'],
      default: 'public',
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    proposals: [{
      freelancer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      coverLetter: {
        type: String,
        required: true,
      },
      bidAmount: {
        type: Number,
        required: true,
      },
      estimatedDuration: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    assignedFreelancers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    milestones: [{
      title: {
        type: String,
        required: true,
      },
      description: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started',
      },
      completedAt: Date,
      amount: Number, // Payment amount for this milestone
    }],
    tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    }],
    paymentStatus: {
      type: String,
      enum: ['not_started', 'milestone_payment', 'completed', 'disputed'],
      default: 'not_started',
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    rating: {
      client: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        createdAt: Date,
      },
      freelancer: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        createdAt: Date,
      },
    },
    startDate: Date,
    completedDate: Date,
    views: {
      type: Number,
      default: 0,
    },
    savedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true }
);

// Create index for search functionality
projectSchema.index({ title: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('Project', projectSchema);