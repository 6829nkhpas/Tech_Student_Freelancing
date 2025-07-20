const User = require('../models/user.model');
const Project = require('../models/project.model');
const Team = require('../models/team.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('savedProjects', 'title description budget deadline status')
      .populate('teams', 'name description avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateUserProfile = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      bio,
      avatar,
      location,
      website,
      skills,
      hourlyRate,
      availability,
      githubUsername,
      linkedinUrl,
      twitterUrl,
    } = req.body;

    // Build user profile object
    const userFields = {};
    if (name) userFields.name = name;
    if (bio) userFields.bio = bio;
    if (avatar) userFields.avatar = avatar;
    if (location) userFields.location = location;
    if (website) userFields.website = website;
    if (skills) userFields.skills = skills;
    if (hourlyRate) userFields.hourlyRate = hourlyRate;
    if (availability) userFields.availability = availability;

    // Build social object
    userFields.social = {};
    if (githubUsername) userFields.social.github = githubUsername;
    if (linkedinUrl) userFields.social.linkedin = linkedinUrl;
    if (twitterUrl) userFields.social.twitter = twitterUrl;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -email -notifications -savedProjects -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Get all users (with filters)
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role, skills, search, page = 1, limit = 10, sort = 'createdAt' } = req.query;

    // Build query
    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',');
      query.skills = { $in: skillsArray };
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
      .sort({ [sort]: sort === 'rating' ? -1 : 1 })
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
 * @desc    Add education to user profile
 * @route   POST /api/users/education
 * @access  Private
 */
exports.addEducation = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldOfStudy, from, to, current, description } = req.body;

    // Create education object
    const newEducation = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    };

    // Add education to user
    const user = await User.findById(req.user.id);
    user.education.unshift(newEducation);
    await user.save();

    res.status(201).json({
      success: true,
      education: user.education,
    });
  } catch (error) {
    console.error('Add education error:', error);
    next(error);
  }
};

/**
 * @desc    Delete education from user profile
 * @route   DELETE /api/users/education/:eduId
 * @access  Private
 */
exports.deleteEducation = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Get education index
    const eduIndex = user.education.findIndex(
      (edu) => edu._id.toString() === req.params.eduId
    );

    if (eduIndex === -1) {
      return res.status(404).json({ message: 'Education not found' });
    }

    // Remove education
    user.education.splice(eduIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      education: user.education,
    });
  } catch (error) {
    console.error('Delete education error:', error);
    next(error);
  }
};

/**
 * @desc    Add experience to user profile
 * @route   POST /api/users/experience
 * @access  Private
 */
exports.addExperience = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } = req.body;

    // Create experience object
    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    // Add experience to user
    const user = await User.findById(req.user.id);
    user.experience.unshift(newExperience);
    await user.save();

    res.status(201).json({
      success: true,
      experience: user.experience,
    });
  } catch (error) {
    console.error('Add experience error:', error);
    next(error);
  }
};

/**
 * @desc    Delete experience from user profile
 * @route   DELETE /api/users/experience/:expId
 * @access  Private
 */
exports.deleteExperience = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Get experience index
    const expIndex = user.experience.findIndex(
      (exp) => exp._id.toString() === req.params.expId
    );

    if (expIndex === -1) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Remove experience
    user.experience.splice(expIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      experience: user.experience,
    });
  } catch (error) {
    console.error('Delete experience error:', error);
    next(error);
  }
};

/**
 * @desc    Get freelancers by skills
 * @route   GET /api/users/freelancers
 * @access  Private
 */
exports.getFreelancers = async (req, res, next) => {
  try {
    const { skills, search, page = 1, limit = 10, sort = 'rating' } = req.query;

    // Build query
    const query = { role: 'freelancer' };

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',');
      query.skills = { $in: skillsArray };
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get freelancers with pagination and sorting
    const freelancers = await User.find(query)
      .select('name avatar bio skills rating hourlyRate availability')
      .sort({ [sort]: sort === 'rating' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: freelancers.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      freelancers,
    });
  } catch (error) {
    console.error('Get freelancers error:', error);
    next(error);
  }
};

/**
 * @desc    Get user stats
 * @route   GET /api/users/stats
 * @access  Private
 */
exports.getUserStats = async (req, res, next) => {
  try {
    // Get user projects
    const userProjects = await Project.find({
      $or: [
        { client: req.user.id },
        { assignedFreelancers: req.user.id },
      ],
    });

    // Get user teams
    const userTeams = await Team.find({ 'members.user': req.user.id });

    // Calculate stats
    const stats = {
      totalProjects: userProjects.length,
      completedProjects: userProjects.filter(p => p.status === 'completed').length,
      activeProjects: userProjects.filter(p => p.status === 'in-progress').length,
      totalTeams: userTeams.length,
      totalEarnings: userProjects
        .filter(p => p.status === 'completed' && p.assignedFreelancers.includes(req.user.id))
        .reduce((total, project) => total + project.budget, 0),
    };

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    next(error);
  }
};

/**
 * @desc    Update user skills
 * @route   PUT /api/users/skills
 * @access  Private
 */
exports.updateSkills = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { skills } = req.body;

    // Update user skills
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { skills } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      skills: user.skills,
    });
  } catch (error) {
    console.error('Update skills error:', error);
    next(error);
  }
};

/**
 * @desc    Get user notifications
 * @route   GET /api/users/notifications
 * @access  Private
 */
exports.getUserNotifications = async (req, res, next) => {
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
    
    // Get user with populated notifications
    const user = await User.findById(req.user.id)
      .populate({
        path: 'notifications',
        match: query,
        options: {
          sort: { createdAt: -1 },
          skip,
          limit: Number(limit),
        },
        populate: [
          { path: 'createdBy', select: 'name avatar' },
          { path: 'project', select: 'title' },
          { path: 'task', select: 'title' },
          { path: 'team', select: 'name avatar' },
        ],
      });
    
    // Get total count for pagination
    const total = user.notifications.length;
    
    res.status(200).json({
      success: true,
      count: user.notifications.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      notifications: user.notifications,
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    next(error);
  }
};