const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const { protect, authorize, isVerified } = require('../middleware/auth.middleware');

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Client only)
router.post(
  '/',
  [
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
    body('category', 'Category is required').not().isEmpty(),
    body('skills', 'At least one skill is required').isArray({ min: 1 }),
    body('budget', 'Budget is required').isNumeric(),
    body('deadline', 'Deadline is required').isISO8601(),
    body('duration', 'Duration is required').not().isEmpty(),
  ],
  protect,
  isVerified,
  authorize('client'),
  projectController.createProject
);

// @route   GET /api/projects
// @desc    Get all projects with filters
// @access  Public
router.get('/', projectController.getProjects);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get('/:id', projectController.getProjectById);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Client who created the project)
router.put(
  '/:id',
  protect,
  isVerified,
  projectController.updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Client who created the project or Admin)
router.delete(
  '/:id',
  protect,
  isVerified,
  projectController.deleteProject
);

// @route   POST /api/projects/:id/proposals
// @desc    Submit a proposal for a project
// @access  Private (Student only)
router.post(
  '/:id/proposals',
  [
    body('coverLetter', 'Cover letter is required').not().isEmpty(),
    body('bidAmount', 'Bid amount is required').isNumeric(),
    body('estimatedDuration', 'Estimated duration is required').not().isEmpty(),
  ],
  protect,
  isVerified,
  authorize('student'),
  projectController.submitProposal
);

// @route   GET /api/projects/:id/proposals
// @desc    Get all proposals for a project
// @access  Private (Client who created the project)
router.get(
  '/:id/proposals',
  protect,
  isVerified,
  projectController.getProjectProposals
);

// @route   PUT /api/projects/:id/proposals/:proposalId
// @desc    Update proposal status (accept/reject)
// @access  Private (Client who created the project)
router.put(
  '/:id/proposals/:proposalId',
  [
    body('status', 'Status must be either accepted or rejected').isIn(['accepted', 'rejected']),
  ],
  protect,
  isVerified,
  projectController.updateProposalStatus
);

// @route   POST /api/projects/:id/milestones
// @desc    Add milestone to project
// @access  Private (Client who created the project)
router.post(
  '/:id/milestones',
  [
    body('title', 'Title is required').not().isEmpty(),
    body('dueDate', 'Due date is required').isISO8601(),
    body('amount', 'Amount is required').isNumeric(),
  ],
  protect,
  isVerified,
  projectController.addMilestone
);

// @route   PUT /api/projects/:id/milestones/:milestoneId
// @desc    Update milestone
// @access  Private (Client who created the project)
router.put(
  '/:id/milestones/:milestoneId',
  protect,
  isVerified,
  projectController.updateMilestone
);

// @route   PUT /api/projects/:id/milestones/:milestoneId/complete
// @desc    Mark milestone as complete
// @access  Private (Client who created the project)
router.put(
  '/:id/milestones/:milestoneId/complete',
  protect,
  isVerified,
  projectController.completeMilestone
);

// @route   POST /api/projects/:id/save
// @desc    Save/unsave project
// @access  Private
router.post(
  '/:id/save',
  protect,
  isVerified,
  projectController.toggleSaveProject
);

// @route   GET /api/projects/saved
// @desc    Get user's saved projects
// @access  Private
router.get(
  '/user/saved',
  protect,
  isVerified,
  projectController.getSavedProjects
);

// @route   POST /api/projects/:id/complete
// @desc    Mark project as complete
// @access  Private (Client who created the project)
router.post(
  '/:id/complete',
  protect,
  isVerified,
  projectController.completeProject
);

// @route   POST /api/projects/:id/review
// @desc    Add review for project
// @access  Private (Client or assigned freelancer)
router.post(
  '/:id/review',
  [
    body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    body('review', 'Review is required').not().isEmpty(),
  ],
  protect,
  isVerified,
  projectController.addReview
);

module.exports = router;