const express = require('express');
const { check } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { protect, isVerified } = require('../middleware/auth.middleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(isVerified);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/',
  [
    check('title', 'Task title is required').not().isEmpty(),
    check('description', 'Task description is required').not().isEmpty(),
    check('project', 'Project ID is required').not().isEmpty(),
    check('status', 'Task status is required').not().isEmpty(),
    check('priority', 'Task priority is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty(),
  ],
  taskController.createTask
);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks (with filters)
 * @access  Private
 */
router.get('/', taskController.getTasks);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private (Task creator or assigned user only)
 */
router.put(
  '/:id',
  [
    check('title', 'Task title is required').not().isEmpty(),
    check('description', 'Task description is required').not().isEmpty(),
    check('status', 'Task status is required').not().isEmpty(),
    check('priority', 'Task priority is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty(),
  ],
  taskController.updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Task creator only)
 */
router.delete('/:id', taskController.deleteTask);

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private
 */
router.post(
  '/:id/comments',
  [
    check('content', 'Comment content is required').not().isEmpty(),
  ],
  taskController.addComment
);

/**
 * @route   DELETE /api/tasks/:id/comments/:commentId
 * @desc    Delete comment from task
 * @access  Private (Comment creator only)
 */
router.delete('/:id/comments/:commentId', taskController.deleteComment);

/**
 * @route   POST /api/tasks/:id/assign
 * @desc    Assign task to user
 * @access  Private (Task creator or project manager only)
 */
router.post(
  '/:id/assign',
  [
    check('userId', 'User ID is required').not().isEmpty(),
  ],
  taskController.assignTask
);

/**
 * @route   DELETE /api/tasks/:id/assign/:userId
 * @desc    Unassign task from user
 * @access  Private (Task creator or project manager only)
 */
router.delete('/:id/assign/:userId', taskController.unassignTask);

/**
 * @route   POST /api/tasks/:id/time/start
 * @desc    Start time tracking for task
 * @access  Private (Assigned user only)
 */
router.post('/:id/time/start', taskController.startTimeTracking);

/**
 * @route   POST /api/tasks/:id/time/stop
 * @desc    Stop time tracking for task
 * @access  Private (Assigned user only)
 */
router.post('/:id/time/stop', taskController.stopTimeTracking);

/**
 * @route   POST /api/tasks/:id/attachments
 * @desc    Add attachment to task
 * @access  Private
 */
router.post(
  '/:id/attachments',
  [
    check('fileUrl', 'File URL is required').not().isEmpty(),
    check('fileName', 'File name is required').not().isEmpty(),
    check('fileType', 'File type is required').not().isEmpty(),
  ],
  taskController.addAttachment
);

/**
 * @route   DELETE /api/tasks/:id/attachments/:attachmentId
 * @desc    Delete attachment from task
 * @access  Private (Attachment uploader only)
 */
router.delete('/:id/attachments/:attachmentId', taskController.deleteAttachment);

/**
 * @route   PUT /api/tasks/:id/progress
 * @desc    Update task progress
 * @access  Private (Assigned user only)
 */
router.put(
  '/:id/progress',
  [
    check('progress', 'Progress percentage is required').isNumeric(),
  ],
  taskController.updateProgress
);

/**
 * @route   POST /api/tasks/:id/subtasks
 * @desc    Create subtask
 * @access  Private
 */
router.post(
  '/:id/subtasks',
  [
    check('title', 'Subtask title is required').not().isEmpty(),
    check('description', 'Subtask description is required').not().isEmpty(),
  ],
  taskController.createSubtask
);

/**
 * @route   POST /api/tasks/:id/dependencies
 * @desc    Add task dependency
 * @access  Private
 */
router.post(
  '/:id/dependencies',
  [
    check('dependsOn', 'Dependency task ID is required').not().isEmpty(),
    check('type', 'Dependency type is required').not().isEmpty(),
  ],
  taskController.addDependency
);

/**
 * @route   DELETE /api/tasks/:id/dependencies/:dependencyId
 * @desc    Remove task dependency
 * @access  Private
 */
router.delete('/:id/dependencies/:dependencyId', taskController.removeDependency);

/**
 * @route   GET /api/tasks/project/:projectId
 * @desc    Get all tasks for a project
 * @access  Private
 */
router.get('/project/:projectId', taskController.getProjectTasks);

/**
 * @route   GET /api/tasks/user/assigned
 * @desc    Get all tasks assigned to current user
 * @access  Private
 */
router.get('/user/assigned', taskController.getUserTasks);

module.exports = router;