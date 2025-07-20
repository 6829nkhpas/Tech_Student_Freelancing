const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { protect, isVerified, authorize } = require('../middleware/auth.middleware');

// Apply admin middleware to all routes
router.use(protect);
router.use(isVerified);
router.use(authorize('admin'));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/users', adminController.getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/users/:id',
  [
    check('name', 'Name is required').optional(),
    check('email', 'Please include a valid email').optional().isEmail(),
    check('role', 'Role must be valid').optional().isIn(['client', 'freelancer', 'admin']),
    check('isVerified', 'isVerified must be a boolean').optional().isBoolean(),
    check('isActive', 'isActive must be a boolean').optional().isBoolean(),
  ],
  adminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route   GET /api/admin/projects
 * @desc    Get all projects with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/projects', adminController.getProjects);

/**
 * @route   GET /api/admin/projects/:id
 * @desc    Get project by ID
 * @access  Private (Admin only)
 */
router.get('/projects/:id', adminController.getProjectById);

/**
 * @route   PUT /api/admin/projects/:id
 * @desc    Update project
 * @access  Private (Admin only)
 */
router.put(
  '/projects/:id',
  [
    check('title', 'Title is required').optional(),
    check('description', 'Description is required').optional(),
    check('category', 'Category is required').optional(),
    check('skills', 'Skills must be an array').optional().isArray(),
    check('budget', 'Budget must be a number').optional().isNumeric(),
    check('deadline', 'Deadline must be a valid date').optional().isISO8601(),
    check('status', 'Status must be valid').optional().isIn([
      'open',
      'in-progress',
      'completed',
      'cancelled',
    ]),
    check('visibility', 'Visibility must be a boolean').optional().isBoolean(),
  ],
  adminController.updateProject
);

/**
 * @route   DELETE /api/admin/projects/:id
 * @desc    Delete project
 * @access  Private (Admin only)
 */
router.delete('/projects/:id', adminController.deleteProject);

/**
 * @route   GET /api/admin/system
 * @desc    Get system statistics
 * @access  Private (Admin only)
 */
router.get('/system', adminController.getSystemStats);

module.exports = router;