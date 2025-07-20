const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect, isVerified, authorize } = require('../middleware/auth.middleware');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, isVerified, userController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    protect,
    isVerified,
    [
      check('name', 'Name is required').optional(),
      check('bio', 'Bio cannot exceed 500 characters').optional().isLength({ max: 500 }),
      check('website', 'Please include a valid URL').optional().isURL(),
      check('skills', 'Skills must be an array').optional().isArray(),
      check('hourlyRate', 'Hourly rate must be a number').optional().isNumeric(),
      check('availability', 'Availability must be a valid status').optional().isIn([
        'available',
        'limited',
        'unavailable',
      ]),
    ],
  ],
  userController.updateUserProfile
);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, isVerified, userController.getUserById);

// @route   GET /api/users
// @desc    Get all users (with filters)
// @access  Private (Admin only)
router.get('/', protect, isVerified, authorize('admin'), userController.getUsers);

// @route   POST /api/users/education
// @desc    Add education to user profile
// @access  Private
router.post(
  '/education',
  [
    protect,
    isVerified,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  userController.addEducation
);

// @route   DELETE /api/users/education/:eduId
// @desc    Delete education from user profile
// @access  Private
router.delete('/education/:eduId', protect, isVerified, userController.deleteEducation);

// @route   POST /api/users/experience
// @desc    Add experience to user profile
// @access  Private
router.post(
  '/experience',
  [
    protect,
    isVerified,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  userController.addExperience
);

// @route   DELETE /api/users/experience/:expId
// @desc    Delete experience from user profile
// @access  Private
router.delete('/experience/:expId', protect, isVerified, userController.deleteExperience);

// @route   GET /api/users/freelancers
// @desc    Get freelancers by skills
// @access  Private
router.get('/freelancers', protect, isVerified, userController.getFreelancers);

// @route   GET /api/users/stats
// @desc    Get user stats
// @access  Private
router.get('/stats', protect, isVerified, userController.getUserStats);

// @route   PUT /api/users/skills
// @desc    Update user skills
// @access  Private
router.put(
  '/skills',
  [
    protect,
    isVerified,
    [check('skills', 'Skills must be an array').isArray()],
  ],
  userController.updateSkills
);

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, isVerified, userController.getUserNotifications);

module.exports = router;