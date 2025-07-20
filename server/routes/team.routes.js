const express = require('express');
const { check } = require('express-validator');
const teamController = require('../controllers/team.controller');
const { protect, isVerified } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(isVerified);

/**
 * @route   POST /api/teams
 * @desc    Create a new team
 * @access  Private
 */
router.post(
  '/',
  [
    check('name', 'Team name is required').not().isEmpty(),
    check('description', 'Team description is required').not().isEmpty(),
  ],
  teamController.createTeam
);

/**
 * @route   GET /api/teams
 * @desc    Get all teams (with filters)
 * @access  Private
 */
router.get('/', teamController.getTeams);

/**
 * @route   GET /api/teams/:id
 * @desc    Get team by ID
 * @access  Private
 */
router.get('/:id', teamController.getTeamById);

/**
 * @route   PUT /api/teams/:id
 * @desc    Update team
 * @access  Private (Team creator or admin only)
 */
router.put(
  '/:id',
  [
    check('name', 'Team name is required').not().isEmpty(),
    check('description', 'Team description is required').not().isEmpty(),
  ],
  teamController.updateTeam
);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Delete team
 * @access  Private (Team creator only)
 */
router.delete('/:id', teamController.deleteTeam);

/**
 * @route   POST /api/teams/:id/invite
 * @desc    Invite user to team
 * @access  Private (Team creator or admin only)
 */
router.post(
  '/:id/invite',
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('role', 'Role is required').not().isEmpty(),
  ],
  teamController.inviteToTeam
);

/**
 * @route   PUT /api/teams/invites/:inviteId/accept
 * @desc    Accept team invitation
 * @access  Private
 */
router.put('/invites/:inviteId/accept', teamController.acceptInvitation);

/**
 * @route   PUT /api/teams/invites/:inviteId/decline
 * @desc    Decline team invitation
 * @access  Private
 */
router.put('/invites/:inviteId/decline', teamController.declineInvitation);

/**
 * @route   DELETE /api/teams/:id/members/:userId
 * @desc    Remove member from team
 * @access  Private (Team creator or admin only)
 */
router.delete('/:id/members/:userId', teamController.removeMember);

/**
 * @route   PUT /api/teams/:id/members/:userId
 * @desc    Update member role
 * @access  Private (Team creator or admin only)
 */
router.put(
  '/:id/members/:userId',
  [
    check('role', 'Role is required').not().isEmpty(),
    check('permissions', 'Permissions must be an array').optional().isArray(),
  ],
  teamController.updateMemberRole
);

/**
 * @route   POST /api/teams/:id/documents
 * @desc    Add team document
 * @access  Private (Team members only)
 */
router.post(
  '/:id/documents',
  [
    check('title', 'Document title is required').not().isEmpty(),
    check('fileUrl', 'File URL is required').not().isEmpty(),
    check('fileType', 'File type is required').not().isEmpty(),
  ],
  teamController.addTeamDocument
);

/**
 * @route   DELETE /api/teams/:id/documents/:documentId
 * @desc    Delete team document
 * @access  Private (Team creator, admin, or document uploader)
 */
router.delete('/:id/documents/:documentId', teamController.deleteTeamDocument);

/**
 * @route   GET /api/teams/:id/projects
 * @desc    Get team projects
 * @access  Private (Team members only)
 */
router.get('/:id/projects', teamController.getTeamProjects);

/**
 * @route   POST /api/teams/:id/projects/:projectId
 * @desc    Assign team to project
 * @access  Private (Team creator or admin only)
 */
router.post('/:id/projects/:projectId', teamController.assignTeamToProject);

/**
 * @route   GET /api/teams/user/invitations
 * @desc    Get user's team invitations
 * @access  Private
 */
router.get('/user/invitations', teamController.getUserInvitations);

/**
 * @route   GET /api/teams/user/teams
 * @desc    Get user's teams
 * @access  Private
 */
router.get('/user/teams', teamController.getUserTeams);

module.exports = router;