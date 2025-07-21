const Task = require('../models/task.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/projects/:projectId/tasks
 * @access  Private
 */
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const {
      status,
      priority,
      assignedTo,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Find project and check authorization
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isClient = project.client.toString() === req.user.id;
    const isAssignedFreelancer = project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to view tasks for this project' });
    }

    // Build query
    const query = { project: projectId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('completedBy', 'name email avatar');

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    next(error);
  }
};

/**
 * @desc    Get all tasks assigned to the user
 * @route   GET /api/tasks/my-tasks
 * @access  Private
 */
exports.getUserTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      project,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { assignedTo: req.user.id };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (project) {
      query.project = project;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('project', 'name client')
      .populate('assignedTo', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('completedBy', 'name email avatar');

    const total = await Task.countDocuments(query);

    res.json({
      success: true,
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    next(error);
  }
};

/**
 * @desc    Add a dependency to a task
 * @route   POST /api/tasks/:taskId/dependencies
 * @access  Private
 */
exports.addDependency = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { dependencyId } = req.body;

    // Find both tasks
    const task = await Task.findById(taskId).populate('project');
    const dependency = await Task.findById(dependencyId);

    if (!task || !dependency) {
      return res.status(404).json({ message: 'Task or dependency not found' });
    }

    // Check if user is authorized to modify task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to modify this task' });
    }

    // Check if dependency is from the same project
    if (task.project._id.toString() !== dependency.project.toString()) {
      return res.status(400).json({ message: 'Dependency must be from the same project' });
    }

    // Check if dependency already exists
    if (task.dependencies.includes(dependencyId)) {
      return res.status(400).json({ message: 'Dependency already exists' });
    }

    // Check for circular dependencies
    const checkCircularDependency = async (currentTaskId, targetTaskId, visited = new Set()) => {
      if (currentTaskId === targetTaskId) return true;
      if (visited.has(currentTaskId)) return false;
      
      visited.add(currentTaskId);
      const currentTask = await Task.findById(currentTaskId);
      
      for (const depId of currentTask.dependencies) {
        if (await checkCircularDependency(depId.toString(), targetTaskId, visited)) {
          return true;
        }
      }
      
      return false;
    };

    if (await checkCircularDependency(dependencyId, taskId)) {
      return res.status(400).json({ message: 'Adding this dependency would create a circular dependency' });
    }

    // Add dependency
    task.dependencies.push(dependencyId);
    await task.save();

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Add dependency error:', error);
    next(error);
  }
};

/**
 * @desc    Remove a dependency from a task
 * @route   DELETE /api/tasks/:taskId/dependencies/:dependencyId
 * @access  Private
 */
exports.removeDependency = async (req, res, next) => {
  try {
    const { taskId, dependencyId } = req.params;

    // Find the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to modify task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to modify this task' });
    }

    // Check if dependency exists
    if (!task.dependencies.includes(dependencyId)) {
      return res.status(404).json({ message: 'Dependency not found' });
    }

    // Remove dependency
    task.dependencies = task.dependencies.filter(dep => dep.toString() !== dependencyId);
    await task.save();

    res.json({
      success: true,
      message: 'Dependency removed successfully',
      task
    });
  } catch (error) {
    console.error('Remove dependency error:', error);
    next(error);
  }
};

/**
 * @desc    Create a subtask
 * @route   POST /api/tasks/:taskId/subtasks
 * @access  Private
 */
exports.createSubtask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      estimatedHours,
      tags
    } = req.body;

    // Find the parent task
    const parentTask = await Task.findById(taskId).populate('project');
    if (!parentTask) {
      return res.status(404).json({ message: 'Parent task not found' });
    }

    // Check if user is authorized to create subtask
    const isClient = parentTask.project.client.toString() === req.user.id;
    const isAssignedFreelancer = parentTask.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to create subtasks for this task' });
    }

    // Create new subtask
    const subtask = new Task({
      title,
      description,
      project: parentTask.project._id,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || [],
      creator: req.user.id,
      dueDate,
      estimatedHours,
      tags: tags || [],
      parentTask: taskId
    });

    await subtask.save();

    // Add subtask to parent task's subtasks
    parentTask.subtasks.push(subtask._id);
    await parentTask.save();

    // Create notifications for assigned users
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        if (userId === req.user.id) continue;

        const notification = new Notification({
          recipient: userId,
          type: 'subtask_assignment',
          title: 'New Subtask Assignment',
          content: `You have been assigned to a new subtask: ${title}`,
          project: parentTask.project._id,
          task: subtask._id,
          createdBy: req.user.id,
          link: `/projects/${parentTask.project._id}/tasks/${subtask._id}`
        });

        await notification.save();
        await User.findByIdAndUpdate(userId, {
          $push: { notifications: notification._id }
        });
      }
    }

    res.status(201).json({
      success: true,
      subtask
    });
  } catch (error) {
    console.error('Create subtask error:', error);
    next(error);
  }
};

/**
 * @desc    Update task progress
 * @route   PUT /api/tasks/:taskId/progress
 * @access  Private
 */
exports.updateProgress = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { progress, status } = req.body;

    // Find the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to update progress
    if (!task.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this task\'s progress' });
    }

    // Update progress
    if (typeof progress === 'number' && progress >= 0 && progress <= 100) {
      task.progress = progress;
    }

    // Update status if provided
    if (status && ['todo', 'in_progress', 'review', 'completed'].includes(status)) {
      const oldStatus = task.status;
      task.status = status;

      // If task is marked as completed
      if (status === 'completed' && oldStatus !== 'completed') {
        task.completedAt = new Date();
        task.completedBy = req.user.id;

        // Award points to the user who completed the task
        const pointsEarned = Math.ceil(task.estimatedHours || 1) * 10; // 10 points per estimated hour
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { points: pointsEarned }
        });

        // Create notification for project client
        const notification = new Notification({
          recipient: task.project.client,
          type: 'task_completed',
          title: 'Task Completed',
          content: `Task "${task.title}" has been completed by ${req.user.name}`,
          project: task.project._id,
          task: task._id,
          createdBy: req.user.id,
          link: `/projects/${task.project._id}/tasks/${task._id}`
        });

        await notification.save();
        await User.findByIdAndUpdate(task.project.client, {
          $push: { notifications: notification._id }
        });
      }
    }

    await task.save();

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Update progress error:', error);
    next(error);
  }
};

/**
 * @desc    Add an attachment to a task
 * @route   POST /api/tasks/:taskId/attachments
 * @access  Private
 */
exports.addAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { fileName, fileUrl, fileSize, fileType } = req.body;

    // Find the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to add attachment
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to add attachments to this task' });
    }

    // Add attachment
    task.attachments.push({
      fileName,
      fileUrl,
      fileSize,
      fileType,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });

    await task.save();

    // Create notification for task assignees and creator
    const notificationRecipients = new Set([...task.assignedTo, task.creator]);
    notificationRecipients.delete(req.user.id); // Don't notify the uploader

    for (const recipientId of notificationRecipients) {
      const notification = new Notification({
        recipient: recipientId,
        type: 'attachment',
        title: 'New Task Attachment',
        content: `${req.user.name} added an attachment to task: ${task.title}`,
        project: task.project._id,
        task: task._id,
        createdBy: req.user.id,
        link: `/projects/${task.project._id}/tasks/${task._id}`
      });

      await notification.save();

      await User.findByIdAndUpdate(recipientId, {
        $push: { notifications: notification._id }
      });
    }

    res.status(201).json({
      success: true,
      attachment: task.attachments[task.attachments.length - 1]
    });
  } catch (error) {
    console.error('Add attachment error:', error);
    next(error);
  }
};

/**
 * @desc    Delete an attachment from a task
 * @route   DELETE /api/tasks/:taskId/attachments/:attachmentId
 * @access  Private
 */
exports.deleteAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params;

    // Find the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find the attachment
    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check if user is authorized to delete attachment
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );
    const isUploader = attachment.uploadedBy.toString() === req.user.id;

    if (!isClient && !isAssignedFreelancer && !isUploader) {
      return res.status(403).json({ message: 'Not authorized to delete this attachment' });
    }

    // Remove attachment
    attachment.remove();
    await task.save();

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    next(error);
  }
};

/**
 * @desc    Start time tracking for a task
 * @route   POST /api/tasks/:taskId/time-tracking/start
 * @access  Private
 */
exports.startTimeTracking = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to the task
    if (!task.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to track time for this task' });
    }

    // Check if user already has an active time tracking session
    const activeSession = task.timeTracking.find(
      session => session.user.toString() === req.user.id && !session.endTime
    );

    if (activeSession) {
      return res.status(400).json({ message: 'You already have an active time tracking session' });
    }

    // Start new time tracking session
    task.timeTracking.push({
      user: req.user.id,
      startTime: new Date(),
      description: req.body.description || ''
    });

    await task.save();

    res.json({
      success: true,
      message: 'Time tracking started',
      session: task.timeTracking[task.timeTracking.length - 1]
    });
  } catch (error) {
    console.error('Start time tracking error:', error);
    next(error);
  }
};

/**
 * @desc    Stop time tracking for a task
 * @route   POST /api/tasks/:taskId/time-tracking/stop
 * @access  Private
 */
exports.stopTimeTracking = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find active time tracking session for the user
    const sessionIndex = task.timeTracking.findIndex(
      session => session.user.toString() === req.user.id && !session.endTime
    );

    if (sessionIndex === -1) {
      return res.status(400).json({ message: 'No active time tracking session found' });
    }

    // Stop time tracking session
    const endTime = new Date();
    task.timeTracking[sessionIndex].endTime = endTime;
    task.timeTracking[sessionIndex].duration = 
      (endTime - task.timeTracking[sessionIndex].startTime) / (1000 * 60 * 60); // Duration in hours

    if (req.body.description) {
      task.timeTracking[sessionIndex].description += 
        (task.timeTracking[sessionIndex].description ? '\n' : '') + req.body.description;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Time tracking stopped',
      session: task.timeTracking[sessionIndex]
    });
  } catch (error) {
    console.error('Stop time tracking error:', error);
    next(error);
  }
};

/**
 * @desc    Assign a user to a task
 * @route   POST /api/tasks/:taskId/assign
 * @access  Private
 */
exports.assignTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;

    // Find the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to assign task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to assign this task' });
    }

    // Check if user to be assigned exists and is part of the project
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isUserInProject = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === userId
    ) || task.project.client.toString() === userId;

    if (!isUserInProject) {
      return res.status(400).json({ message: 'User is not part of the project' });
    }

    // Check if user is already assigned
    if (task.assignedTo.includes(userId)) {
      return res.status(400).json({ message: 'User is already assigned to this task' });
    }

    // Assign user to task
    task.assignedTo.push(userId);
    await task.save();

    // Create notification for assigned user
    const notification = new Notification({
      recipient: userId,
      type: 'task_assignment',
      title: 'Task Assignment',
      content: `You have been assigned to task: ${task.title}`,
      project: task.project._id,
      task: task._id,
      createdBy: req.user.id,
      link: `/projects/${task.project._id}/tasks/${task._id}`
    });

    await notification.save();

    // Add notification to user's notifications
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: notification._id }
    });

    res.json({
      success: true,
      message: 'User assigned successfully',
      task
    });
  } catch (error) {
    console.error('Assign task error:', error);
    next(error);
  }
};

/**
 * @desc    Unassign a user from a task
 * @route   DELETE /api/tasks/:taskId/assign/:userId
 * @access  Private
 */
exports.unassignTask = async (req, res, next) => {
  try {
    const { taskId, userId } = req.params;

    // Find the task
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to unassign task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      freelancer => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({ message: 'Not authorized to unassign from this task' });
    }

    // Check if user is assigned to the task
    if (!task.assignedTo.includes(userId)) {
      return res.status(400).json({ message: 'User is not assigned to this task' });
    }

    // Unassign user from task
    task.assignedTo = task.assignedTo.filter(id => id.toString() !== userId);
    await task.save();

    // Create notification for unassigned user
    const notification = new Notification({
      recipient: userId,
      type: 'task_unassignment',
      title: 'Task Unassignment',
      content: `You have been unassigned from task: ${task.title}`,
      project: task.project._id,
      task: task._id,
      createdBy: req.user.id,
      link: `/projects/${task.project._id}/tasks/${task._id}`
    });

    await notification.save();

    // Add notification to user's notifications
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: notification._id }
    });

    res.json({
      success: true,
      message: 'User unassigned successfully',
      task
    });
  } catch (error) {
    console.error('Unassign task error:', error);
    next(error);
  }
};

/**
 * @desc    Add a comment to a task
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { content } = req.body;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Add the comment
    task.comments.push({
      content,
      user: req.user.id
    });

    await task.save();

    // Create notification for task assignees and creator
    const notificationRecipients = new Set([...task.assignedTo, task.creator]);
    notificationRecipients.delete(req.user.id); // Don't notify the commenter

    for (const recipientId of notificationRecipients) {
      const notification = new Notification({
        recipient: recipientId,
        type: 'comment',
        title: 'New Comment on Task',
        content: `${req.user.name} commented on task: ${task.title}`,
        project: task.project,
        task: task._id,
        createdBy: req.user.id,
        link: `/projects/${task.project}/tasks/${task._id}`
      });

      await notification.save();

      // Add notification to recipient's notifications
      await User.findByIdAndUpdate(recipientId, {
        $push: { notifications: notification._id }
      });
    }

    res.status(201).json({
      success: true,
      comment: task.comments[task.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    next(error);
  }
};

/**
 * @desc    Delete a comment from a task
 * @route   DELETE /api/tasks/:taskId/comments/:commentId
 * @access  Private
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { taskId, commentId } = req.params;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find the comment
    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is authorized to delete the comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove the comment
    comment.remove();
    await task.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    next(error);
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      project,
      milestone,
      status,
      priority,
      assignedTo,
      dueDate,
      estimatedHours,
      tags,
      dependencies,
      githubLink,
      parentTask,
    } = req.body;

    // Check if project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to create task for this project
    const isClient = projectExists.client.toString() === req.user.id;
    const isAssignedFreelancer = projectExists.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer) {
      return res.status(403).json({
        message: 'Not authorized to create tasks for this project',
      });
    }

    // Check if milestone exists if provided
    if (milestone) {
      const milestoneExists = projectExists.milestones.some(
        (m) => m._id.toString() === milestone
      );
      if (!milestoneExists) {
        return res.status(404).json({ message: 'Milestone not found' });
      }
    }

    // Check if parent task exists if provided
    if (parentTask) {
      const parentTaskExists = await Task.findById(parentTask);
      if (!parentTaskExists) {
        return res.status(404).json({ message: 'Parent task not found' });
      }
    }

    // Create new task
    const task = new Task({
      title,
      description,
      project,
      milestone,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || [],
      creator: req.user.id,
      dueDate,
      estimatedHours,
      tags: tags || [],
      dependencies: dependencies || [],
      githubLink,
      parentTask,
    });

    await task.save();

    // Add task to project's tasks
    await Project.findByIdAndUpdate(project, {
      $push: { tasks: task._id },
    });

    // If parent task exists, add this task as a subtask
    if (parentTask) {
      await Task.findByIdAndUpdate(parentTask, {
        $push: { subtasks: task._id },
      });
    }

    // Create notifications for assigned users
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        // Skip notification if the assigned user is the creator
        if (userId === req.user.id) continue;

        const notification = new Notification({
          recipient: userId,
          type: 'task',
          title: 'New Task Assignment',
          content: `You have been assigned to a new task: ${title}`,
          project,
          task: task._id,
          createdBy: req.user.id,
          link: `/projects/${project}/tasks/${task._id}`,
        });

        await notification.save();

        // Add notification to user's notifications
        await User.findByIdAndUpdate(userId, {
          $push: { notifications: notification._id },
        });
      }
    }

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    next(error);
  }
};

/**
 * @desc    Get all tasks with filters
 * @route   GET /api/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    const {
      project,
      milestone,
      status,
      priority,
      assignedTo,
      creator,
      dueDate,
      search,
      tags,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Filter by project
    if (project) {
      query.project = project;

      // Check if user is authorized to view tasks for this project
      const projectDoc = await Project.findById(project);
      if (!projectDoc) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const isClient = projectDoc.client.toString() === req.user.id;
      const isAssignedFreelancer = projectDoc.assignedFreelancers.some(
        (freelancer) => freelancer.toString() === req.user.id
      );

      if (!isClient && !isAssignedFreelancer) {
        return res.status(403).json({
          message: 'Not authorized to view tasks for this project',
        });
      }
    } else {
      // If no project specified, only show tasks from projects the user is involved in
      const userProjects = await Project.find({
        $or: [
          { client: req.user.id },
          { assignedFreelancers: req.user.id },
        ],
      }).select('_id');

      query.project = { $in: userProjects.map((p) => p._id) };
    }

    // Filter by milestone
    if (milestone) {
      query.milestone = milestone;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Filter by creator
    if (creator) {
      query.creator = creator;
    }

    // Filter by due date
    if (dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (dueDate) {
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query.dueDate = { $gte: today, $lt: tomorrow };
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          query.dueDate = { $gte: today, $lt: nextWeek };
          break;
        case 'overdue':
          query.dueDate = { $lt: today };
          query.status = { $ne: 'completed' };
          break;
        default:
          // Specific date format: YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
            const specificDate = new Date(dueDate);
            const nextDay = new Date(specificDate);
            nextDay.setDate(nextDay.getDate() + 1);
            query.dueDate = { $gte: specificDate, $lt: nextDay };
          }
      }
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by tags
    if (tags) {
      const tagsArray = tags.split(',');
      query.tags = { $in: tagsArray };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'due_soon':
        sortOptions = { dueDate: 1 };
        break;
      case 'priority_high':
        sortOptions = { priority: -1 }; // Assuming higher priority is represented by higher value
        break;
      case 'priority_low':
        sortOptions = { priority: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const tasks = await Task.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('project', 'title')
      .populate('milestone', 'title')
      .populate('assignedTo', 'name avatar')
      .populate('creator', 'name avatar')
      .populate('parentTask', 'title');

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    next(error);
  }
};

/**
 * @desc    Get task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
exports.getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title client assignedFreelancers')
      .populate('milestone', 'title dueDate')
      .populate('assignedTo', 'name avatar')
      .populate('creator', 'name avatar')
      .populate('parentTask', 'title')
      .populate('subtasks', 'title status');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to view this task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );
    const isAssignedToTask = task.assignedTo.some(
      (user) => user._id.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer && !isAssignedToTask) {
      return res.status(403).json({
        message: 'Not authorized to view this task',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let task = await Task.findById(req.params.id).populate(
      'project',
      'client assignedFreelancers'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to update this task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );
    const isCreator = task.creator.toString() === req.user.id;
    const isAssignedToTask = task.assignedTo.some(
      (user) => user.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer && !isCreator && !isAssignedToTask) {
      return res.status(403).json({
        message: 'Not authorized to update this task',
      });
    }

    // Handle status change separately to track progress
    const oldStatus = task.status;
    const newStatus = req.body.status;

    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('project', 'title')
      .populate('milestone', 'title')
      .populate('assignedTo', 'name avatar')
      .populate('creator', 'name avatar');

    // Handle status change notifications
    if (newStatus && oldStatus !== newStatus) {
      // Create notification for task creator if not the updater
      if (task.creator.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: task.creator,
          type: 'task',
          title: 'Task Status Updated',
          content: `The task "${task.title}" has been updated to ${newStatus}`,
          project: task.project._id,
          task: task._id,
          createdBy: req.user.id,
          link: `/projects/${task.project._id}/tasks/${task._id}`,
        });

        await notification.save();

        // Add notification to creator's notifications
        await User.findByIdAndUpdate(task.creator, {
          $push: { notifications: notification._id },
        });
      }

      // Create notification for client if not the updater
      const projectDoc = await Project.findById(task.project._id);
      if (projectDoc.client.toString() !== req.user.id) {
        const notification = new Notification({
          recipient: projectDoc.client,
          type: 'task',
          title: 'Task Status Updated',
          content: `The task "${task.title}" has been updated to ${newStatus}`,
          project: task.project._id,
          task: task._id,
          createdBy: req.user.id,
          link: `/projects/${task.project._id}/tasks/${task._id}`,
        });

        await notification.save();

        // Add notification to client's notifications
        await User.findByIdAndUpdate(projectDoc.client, {
          $push: { notifications: notification._id },
        });
      }

      // If task is completed, update progress
      if (newStatus === 'completed') {
        // Update task completion time
        await Task.findByIdAndUpdate(req.params.id, {
          completedAt: Date.now(),
        });

        // Award points to assigned users
        if (task.assignedTo && task.assignedTo.length > 0) {
          for (const userId of task.assignedTo) {
            await User.findByIdAndUpdate(userId, {
              $inc: { points: 10 }, // Award 10 points for completing a task
            });
          }
        }
      }
    }

    // Handle assignment changes
    if (req.body.assignedTo) {
      const oldAssignedIds = task.assignedTo.map((user) => user.toString());
      const newAssignedIds = Array.isArray(req.body.assignedTo)
        ? req.body.assignedTo
        : [req.body.assignedTo];

      // Find newly assigned users
      const newlyAssigned = newAssignedIds.filter(
        (id) => !oldAssignedIds.includes(id)
      );

      // Create notifications for newly assigned users
      for (const userId of newlyAssigned) {
        // Skip notification if the assigned user is the updater
        if (userId === req.user.id) continue;

        const notification = new Notification({
          recipient: userId,
          type: 'task',
          title: 'New Task Assignment',
          content: `You have been assigned to the task: ${task.title}`,
          project: task.project._id,
          task: task._id,
          createdBy: req.user.id,
          link: `/projects/${task.project._id}/tasks/${task._id}`,
        });

        await notification.save();

        // Add notification to user's notifications
        await User.findByIdAndUpdate(userId, {
          $push: { notifications: notification._id },
        });
      }
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Update task error:', error);
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'project',
      'client'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to delete this task
    const isClient = task.project.client.toString() === req.user.id;
    const isCreator = task.creator.toString() === req.user.id;

    if (!isClient && !isCreator) {
      return res.status(403).json({
        message: 'Not authorized to delete this task',
      });
    }

    // Remove task from project's tasks
    await Project.findByIdAndUpdate(task.project._id, {
      $pull: { tasks: task._id },
    });

    // Remove task from parent task's subtasks if it has a parent
    if (task.parentTask) {
      await Task.findByIdAndUpdate(task.parentTask, {
        $pull: { subtasks: task._id },
      });
    }

    // Delete all subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      await Task.deleteMany({ _id: { $in: task.subtasks } });
    }

    // Delete task
    await task.remove();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
exports.addComment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    const task = await Task.findById(req.params.id).populate(
      'project',
      'client assignedFreelancers'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to comment on this task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );
    const isAssignedToTask = task.assignedTo.some(
      (user) => user.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer && !isAssignedToTask) {
      return res.status(403).json({
        message: 'Not authorized to comment on this task',
      });
    }

    // Create new comment
    const comment = {
      user: req.user.id,
      content,
      createdAt: Date.now(),
    };

    // Add comment to task
    task.comments.push(comment);
    await task.save();

    // Populate user info in the new comment
    const populatedTask = await Task.findById(req.params.id).populate({
      path: 'comments.user',
      select: 'name avatar',
    });

    const newComment = populatedTask.comments[populatedTask.comments.length - 1];

    // Create notifications for task assignees and creator (except commenter)
    const notifyUsers = new Set();

    // Add task creator
    if (task.creator.toString() !== req.user.id) {
      notifyUsers.add(task.creator.toString());
    }

    // Add task assignees
    task.assignedTo.forEach((userId) => {
      if (userId.toString() !== req.user.id) {
        notifyUsers.add(userId.toString());
      }
    });

    // Create notifications
    for (const userId of notifyUsers) {
      const notification = new Notification({
        recipient: userId,
        type: 'comment',
        title: 'New Comment on Task',
        content: `${req.user.name} commented on the task: ${task.title}`,
        project: task.project._id,
        task: task._id,
        createdBy: req.user.id,
        link: `/projects/${task.project._id}/tasks/${task._id}`,
      });

      await notification.save();

      // Add notification to user's notifications
      await User.findByIdAndUpdate(userId, {
        $push: { notifications: notification._id },
      });
    }

    res.status(201).json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    next(error);
  }
};

/**
 * @desc    Start time tracking for a task
 * @route   POST /api/tasks/:id/track/start
 * @access  Private
 */
exports.startTimeTracking = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      'project',
      'client assignedFreelancers'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to track time for this task
    const isAssignedToTask = task.assignedTo.some(
      (user) => user.toString() === req.user.id
    );

    if (!isAssignedToTask) {
      return res.status(403).json({
        message: 'Not authorized to track time for this task',
      });
    }

    // Check if user already has an active time tracking session
    const activeSession = task.timeTracking.find(
      (session) =>
        session.user.toString() === req.user.id && session.endTime === null
    );

    if (activeSession) {
      return res.status(400).json({
        message: 'You already have an active time tracking session for this task',
      });
    }

    // Create new time tracking session
    const timeTrackingSession = {
      user: req.user.id,
      startTime: Date.now(),
      endTime: null,
    };

    // Add session to task's timeTracking
    task.timeTracking.push(timeTrackingSession);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Time tracking started',
      session: task.timeTracking[task.timeTracking.length - 1],
    });
  } catch (error) {
    console.error('Start time tracking error:', error);
    next(error);
  }
};

/**
 * @desc    Stop time tracking for a task
 * @route   POST /api/tasks/:id/track/stop
 * @access  Private
 */
exports.stopTimeTracking = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Find active time tracking session for the user
    const sessionIndex = task.timeTracking.findIndex(
      (session) =>
        session.user.toString() === req.user.id && session.endTime === null
    );

    if (sessionIndex === -1) {
      return res.status(400).json({
        message: 'No active time tracking session found',
      });
    }

    // Update session end time
    task.timeTracking[sessionIndex].endTime = Date.now();

    // Calculate duration in milliseconds
    const startTime = new Date(task.timeTracking[sessionIndex].startTime).getTime();
    const endTime = new Date(task.timeTracking[sessionIndex].endTime).getTime();
    const durationMs = endTime - startTime;

    // Convert to hours and round to 2 decimal places
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    task.timeTracking[sessionIndex].duration = durationHours;

    // Update task's actual hours
    task.actualHours = (task.actualHours || 0) + durationHours;

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Time tracking stopped',
      session: task.timeTracking[sessionIndex],
      totalHours: task.actualHours,
    });
  } catch (error) {
    console.error('Stop time tracking error:', error);
    next(error);
  }
};

/**
 * @desc    Add attachment to task
 * @route   POST /api/tasks/:id/attachments
 * @access  Private
 */
exports.addAttachment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, fileUrl, fileType, fileSize } = req.body;

    const task = await Task.findById(req.params.id).populate(
      'project',
      'client assignedFreelancers'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to add attachments to this task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );
    const isAssignedToTask = task.assignedTo.some(
      (user) => user.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer && !isAssignedToTask) {
      return res.status(403).json({
        message: 'Not authorized to add attachments to this task',
      });
    }

    // Create new attachment
    const attachment = {
      name,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy: req.user.id,
      uploadedAt: Date.now(),
    };

    // Add attachment to task
    task.attachments.push(attachment);
    await task.save();

    res.status(201).json({
      success: true,
      attachment: task.attachments[task.attachments.length - 1],
    });
  } catch (error) {
    console.error('Add attachment error:', error);
    next(error);
  }
};

/**
 * @desc    Update task progress
 * @route   PUT /api/tasks/:id/progress
 * @access  Private
 */
exports.updateProgress = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { progress } = req.body;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        message: 'Progress must be between 0 and 100',
      });
    }

    const task = await Task.findById(req.params.id).populate(
      'project',
      'client assignedFreelancers'
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is authorized to update progress for this task
    const isClient = task.project.client.toString() === req.user.id;
    const isAssignedFreelancer = task.project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );
    const isAssignedToTask = task.assignedTo.some(
      (user) => user.toString() === req.user.id
    );

    if (!isClient && !isAssignedFreelancer && !isAssignedToTask) {
      return res.status(403).json({
        message: 'Not authorized to update progress for this task',
      });
    }

    // Update task progress
    task.progress = progress;

    // If progress is 100%, update status to completed if not already
    if (progress === 100 && task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = Date.now();

      // Award points to assigned users
      if (task.assignedTo && task.assignedTo.length > 0) {
        for (const userId of task.assignedTo) {
          await User.findByIdAndUpdate(userId, {
            $inc: { points: 10 }, // Award 10 points for completing a task
          });
        }
      }
    }

    await task.save();

    res.status(200).json({
      success: true,
      progress: task.progress,
      status: task.status,
    });
  } catch (error) {
    console.error('Update progress error:', error);
    next(error);
  }
};