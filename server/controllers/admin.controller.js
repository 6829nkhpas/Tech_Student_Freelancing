const User = require('../models/user.model');
const Project = require('../models/project.model');
const Team = require('../models/team.model');
const Task = require('../models/task.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const teamCount = await Team.countDocuments();
    const taskCount = await Task.countDocuments();

    // Get user stats by role
    const clientCount = await User.countDocuments({ role: 'client' });
    const freelancerCount = await User.countDocuments({ role: 'freelancer' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Get project stats by status
    const openProjects = await Project.countDocuments({ status: 'open' });
    const inProgressProjects = await Project.countDocuments({ status: 'in-progress' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const cancelledProjects = await Project.countDocuments({ status: 'cancelled' });

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role avatar createdAt');

    // Get recent projects
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title client status budget createdAt')
      .populate('client', 'name avatar');

    // Calculate total project value
    const projects = await Project.find().select('budget status');
    const totalProjectValue = projects.reduce((total, project) => total + project.budget, 0);
    const completedProjectValue = projects
      .filter(project => project.status === 'completed')
      .reduce((total, project) => total + project.budget, 0);

    res.status(200).json({
      success: true,
      stats: {
        counts: {
          users: userCount,
          projects: projectCount,
          teams: teamCount,
          tasks: taskCount,
        },
        usersByRole: {
          clients: clientCount,
          freelancers: freelancerCount,
          admins: adminCount,
        },
        projectsByStatus: {
          open: openProjects,
          inProgress: inProgressProjects,
          completed: completedProjects,
          cancelled: cancelledProjects,
        },
        financials: {
          totalProjectValue,
          completedProjectValue,
        },
        recent: {
          users: recentUsers,
          projects: recentProjects,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    next(error);
  }
};

/**
 * @desc    Get all users with pagination and filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    // Build query
    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get users with pagination and sorting
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .populate('savedProjects', 'title description budget deadline status')
      .populate('teams', 'name description avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's projects
    const projects = await Project.find({
      $or: [
        { client: user._id },
        { assignedFreelancers: user._id },
      ],
    }).select('title description budget deadline status');

    // Get user's tasks
    const tasks = await Task.find({
      assignedUsers: user._id,
    }).select('title description status priority dueDate');

    res.status(200).json({
      success: true,
      user,
      projects,
      tasks,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role, isVerified, isActive } = req.body;

    // Build user fields object
    const userFields = {};
    if (name) userFields.name = name;
    if (email) userFields.email = email;
    if (role) userFields.role = role;
    if (isVerified !== undefined) userFields.isVerified = isVerified;
    if (isActive !== undefined) userFields.isActive = isActive;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is an admin
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete user
    await user.remove();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
};

/**
 * @desc    Get all projects with pagination and filtering
 * @route   GET /api/admin/projects
 * @access  Private (Admin only)
 */
exports.getProjects = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    // Build query
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get projects with pagination and sorting
    const projects = await Project.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('client', 'name avatar')
      .populate('assignedFreelancers', 'name avatar')
      .populate('assignedTeam', 'name avatar');

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    next(error);
  }
};

/**
 * @desc    Get project by ID
 * @route   GET /api/admin/projects/:id
 * @access  Private (Admin only)
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name avatar email')
      .populate('assignedFreelancers', 'name avatar email')
      .populate('assignedTeam', 'name avatar')
      .populate('proposals.freelancer', 'name avatar email')
      .populate('milestones.tasks');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project tasks
    const tasks = await Task.find({ project: project._id })
      .populate('assignedUsers', 'name avatar')
      .populate('creator', 'name avatar');

    res.status(200).json({
      success: true,
      project,
      tasks,
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/admin/projects/:id
 * @access  Private (Admin only)
 */
exports.updateProject = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      skills,
      budget,
      deadline,
      status,
      visibility,
    } = req.body;

    // Build project fields object
    const projectFields = {};
    if (title) projectFields.title = title;
    if (description) projectFields.description = description;
    if (category) projectFields.category = category;
    if (skills) projectFields.skills = skills;
    if (budget) projectFields.budget = budget;
    if (deadline) projectFields.deadline = deadline;
    if (status) projectFields.status = status;
    if (visibility !== undefined) projectFields.visibility = visibility;

    // Update project
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: projectFields },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/admin/projects/:id
 * @access  Private (Admin only)
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete project tasks
    await Task.deleteMany({ project: project._id });

    // Delete project
    await project.remove();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    next(error);
  }
};

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/system
 * @access  Private (Admin only)
 */
exports.getSystemStats = async (req, res, next) => {
  try {
    // Get user registration stats by month (last 12 months)
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Get project creation stats by month (last 12 months)
    const projectStats = await Project.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
          totalBudget: { $sum: '$budget' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format the data for frontend charts
    const months = [];
    const userCounts = [];
    const projectCounts = [];
    const projectBudgets = [];

    // Create array of last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthYear = `${monthName} ${year}`;
      months.push(monthYear);

      // Find user count for this month
      const userStat = userStats.find(
        (stat) => stat._id.month === date.getMonth() + 1 && stat._id.year === date.getFullYear()
      );
      userCounts.push(userStat ? userStat.count : 0);

      // Find project count and budget for this month
      const projectStat = projectStats.find(
        (stat) => stat._id.month === date.getMonth() + 1 && stat._id.year === date.getFullYear()
      );
      projectCounts.push(projectStat ? projectStat.count : 0);
      projectBudgets.push(projectStat ? projectStat.totalBudget : 0);
    }

    res.status(200).json({
      success: true,
      stats: {
        months,
        users: userCounts,
        projects: projectCounts,
        budgets: projectBudgets,
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    next(error);
  }
};