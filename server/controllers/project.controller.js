const Project = require('../models/project.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private (Client only)
 */
exports.createProject = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      shortDescription,
      category,
      skills,
      budget,
      deadline,
      duration,
      visibility,
      attachments,
    } = req.body;

    // Create new project
    const project = new Project({
      title,
      description,
      shortDescription,
      client: req.user.id,
      category,
      skills,
      budget,
      deadline,
      duration,
      visibility: visibility || 'public',
      attachments: attachments || [],
    });

    await project.save();

    // Add project to user's projects
    await User.findByIdAndUpdate(req.user.id, {
      $push: { projects: project._id },
    });

    res.status(201).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    next(error);
  }
};

/**
 * @desc    Get all projects with filters
 * @route   GET /api/projects
 * @access  Public
 */
exports.getProjects = async (req, res, next) => {
  try {
    const {
      search,
      category,
      skills,
      minBudget,
      maxBudget,
      status,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Search by title, description, or skills
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',');
      query.skills = { $in: skillsArray };
    }

    // Filter by budget range
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    // Filter by status
    if (status) {
      query.status = status;
    } else {
      // By default, only show open projects
      query.status = 'open';
    }

    // Only show public projects
    query.visibility = 'public';

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'budget_high':
        sortOptions = { budget: -1 };
        break;
      case 'budget_low':
        sortOptions = { budget: 1 };
        break;
      case 'deadline':
        sortOptions = { deadline: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const projects = await Project.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('client', 'name avatar')
      .select('-proposals');

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
 * @route   GET /api/projects/:id
 * @access  Public
 */
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name avatar companyName location')
      .populate('assignedTeam', 'name avatar members')
      .populate('assignedFreelancers', 'name avatar skills');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Increment view count
    project.views += 1;
    await project.save({ validateBeforeSave: false });

    // Check if user is authenticated and is the client or has submitted a proposal
    let userIsClient = false;
    let userProposal = null;

    if (req.user) {
      userIsClient = project.client._id.toString() === req.user.id;

      // If user is not the client, check if they have submitted a proposal
      if (!userIsClient && project.proposals.length > 0) {
        userProposal = project.proposals.find(
          (proposal) => proposal.freelancer.toString() === req.user.id
        );
      }
    }

    // If user is not the client, remove proposals from response
    const projectResponse = project.toObject();
    if (!userIsClient) {
      projectResponse.proposals = [];
      if (userProposal) {
        projectResponse.userProposal = userProposal;
      }
    }

    res.status(200).json({
      success: true,
      project: projectResponse,
      userIsClient,
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Client who created the project)
 */
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    // Check if project can be updated (not in progress or completed)
    if (['in_progress', 'completed', 'cancelled'].includes(project.status)) {
      return res.status(400).json({
        message: `Project cannot be updated when status is ${project.status}`,
      });
    }

    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

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
 * @route   DELETE /api/projects/:id
 * @access  Private (Client who created the project or Admin)
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner or admin
    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    // Check if project can be deleted (not in progress)
    if (project.status === 'in_progress') {
      return res.status(400).json({
        message: 'Cannot delete a project that is in progress',
      });
    }

    // Remove project from user's projects
    await User.findByIdAndUpdate(project.client, {
      $pull: { projects: project._id },
    });

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
 * @desc    Submit a proposal for a project
 * @route   POST /api/projects/:id/proposals
 * @access  Private (Student only)
 */
exports.submitProposal = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { coverLetter, bidAmount, estimatedDuration } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project is open for proposals
    if (project.status !== 'open') {
      return res.status(400).json({
        message: 'This project is not accepting proposals',
      });
    }

    // Check if user has already submitted a proposal
    const existingProposal = project.proposals.find(
      (proposal) => proposal.freelancer.toString() === req.user.id
    );

    if (existingProposal) {
      return res.status(400).json({
        message: 'You have already submitted a proposal for this project',
      });
    }

    // Create new proposal
    const proposal = {
      freelancer: req.user.id,
      coverLetter,
      bidAmount,
      estimatedDuration,
    };

    // Add proposal to project
    project.proposals.push(proposal);
    await project.save();

    // Create notification for project owner
    const notification = new Notification({
      recipient: project.client,
      type: 'proposal',
      title: 'New Proposal Received',
      content: `You have received a new proposal for your project: ${project.title}`,
      project: project._id,
      createdBy: req.user.id,
      link: `/projects/${project._id}/proposals`,
    });

    await notification.save();

    // Add notification to client's notifications
    await User.findByIdAndUpdate(project.client, {
      $push: { notifications: notification._id },
    });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
    });
  } catch (error) {
    console.error('Submit proposal error:', error);
    next(error);
  }
};

/**
 * @desc    Get all proposals for a project
 * @route   GET /api/projects/:id/proposals
 * @access  Private (Client who created the project)
 */
exports.getProjectProposals = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .select('proposals client title')
      .populate('proposals.freelancer', 'name avatar skills rating completedProjects');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these proposals' });
    }

    res.status(200).json({
      success: true,
      proposals: project.proposals,
    });
  } catch (error) {
    console.error('Get project proposals error:', error);
    next(error);
  }
};

/**
 * @desc    Update proposal status (accept/reject)
 * @route   PUT /api/projects/:id/proposals/:proposalId
 * @access  Private (Client who created the project)
 */
exports.updateProposalStatus = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const { id, proposalId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this proposal' });
    }

    // Find the proposal
    const proposalIndex = project.proposals.findIndex(
      (proposal) => proposal._id.toString() === proposalId
    );

    if (proposalIndex === -1) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Update proposal status
    project.proposals[proposalIndex].status = status;

    // If accepting proposal, update project status and assigned freelancer
    if (status === 'accepted') {
      project.status = 'in_progress';
      project.startDate = Date.now();
      
      // Add freelancer to assignedFreelancers
      const freelancerId = project.proposals[proposalIndex].freelancer;
      project.assignedFreelancers.push(freelancerId);

      // Add project to freelancer's projects
      await User.findByIdAndUpdate(freelancerId, {
        $push: { projects: project._id },
      });

      // Create notification for freelancer
      const acceptNotification = new Notification({
        recipient: freelancerId,
        type: 'proposal',
        title: 'Proposal Accepted',
        content: `Your proposal for the project "${project.title}" has been accepted!`,
        project: project._id,
        createdBy: req.user.id,
        link: `/projects/${project._id}`,
      });

      await acceptNotification.save();

      // Add notification to freelancer's notifications
      await User.findByIdAndUpdate(freelancerId, {
        $push: { notifications: acceptNotification._id },
      });
    } else if (status === 'rejected') {
      // Create notification for freelancer
      const rejectNotification = new Notification({
        recipient: project.proposals[proposalIndex].freelancer,
        type: 'proposal',
        title: 'Proposal Rejected',
        content: `Your proposal for the project "${project.title}" has been rejected.`,
        project: project._id,
        createdBy: req.user.id,
        link: `/projects/${project._id}`,
      });

      await rejectNotification.save();

      // Add notification to freelancer's notifications
      await User.findByIdAndUpdate(project.proposals[proposalIndex].freelancer, {
        $push: { notifications: rejectNotification._id },
      });
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: `Proposal ${status} successfully`,
    });
  } catch (error) {
    console.error('Update proposal status error:', error);
    next(error);
  }
};

/**
 * @desc    Add milestone to project
 * @route   POST /api/projects/:id/milestones
 * @access  Private (Client who created the project)
 */
exports.addMilestone = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, amount } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add milestones to this project' });
    }

    // Create new milestone
    const milestone = {
      title,
      description,
      dueDate,
      amount,
    };

    // Add milestone to project
    project.milestones.push(milestone);
    await project.save();

    // Create notification for assigned freelancers
    if (project.assignedFreelancers.length > 0) {
      for (const freelancerId of project.assignedFreelancers) {
        const notification = new Notification({
          recipient: freelancerId,
          type: 'milestone',
          title: 'New Milestone Added',
          content: `A new milestone "${title}" has been added to your project: ${project.title}`,
          project: project._id,
          createdBy: req.user.id,
          link: `/projects/${project._id}`,
        });

        await notification.save();

        // Add notification to freelancer's notifications
        await User.findByIdAndUpdate(freelancerId, {
          $push: { notifications: notification._id },
        });
      }
    }

    res.status(201).json({
      success: true,
      milestone: project.milestones[project.milestones.length - 1],
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    next(error);
  }
};

/**
 * @desc    Update milestone
 * @route   PUT /api/projects/:id/milestones/:milestoneId
 * @access  Private (Client who created the project)
 */
exports.updateMilestone = async (req, res, next) => {
  try {
    const { id, milestoneId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this milestone' });
    }

    // Find the milestone
    const milestoneIndex = project.milestones.findIndex(
      (milestone) => milestone._id.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Update milestone fields
    const { title, description, dueDate, amount } = req.body;

    if (title) project.milestones[milestoneIndex].title = title;
    if (description) project.milestones[milestoneIndex].description = description;
    if (dueDate) project.milestones[milestoneIndex].dueDate = dueDate;
    if (amount) project.milestones[milestoneIndex].amount = amount;

    await project.save();

    res.status(200).json({
      success: true,
      milestone: project.milestones[milestoneIndex],
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    next(error);
  }
};

/**
 * @desc    Mark milestone as complete
 * @route   PUT /api/projects/:id/milestones/:milestoneId/complete
 * @access  Private (Client who created the project)
 */
exports.completeMilestone = async (req, res, next) => {
  try {
    const { id, milestoneId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this milestone' });
    }

    // Find the milestone
    const milestoneIndex = project.milestones.findIndex(
      (milestone) => milestone._id.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    // Update milestone status
    project.milestones[milestoneIndex].status = 'completed';
    project.milestones[milestoneIndex].completedAt = Date.now();

    // Update payment status and total paid
    project.paymentStatus = 'milestone_payment';
    project.totalPaid += project.milestones[milestoneIndex].amount;

    await project.save();

    // Create notification for assigned freelancers
    if (project.assignedFreelancers.length > 0) {
      for (const freelancerId of project.assignedFreelancers) {
        const notification = new Notification({
          recipient: freelancerId,
          type: 'milestone',
          title: 'Milestone Completed',
          content: `The milestone "${project.milestones[milestoneIndex].title}" has been marked as completed for project: ${project.title}`,
          project: project._id,
          createdBy: req.user.id,
          link: `/projects/${project._id}`,
        });

        await notification.save();

        // Add notification to freelancer's notifications
        await User.findByIdAndUpdate(freelancerId, {
          $push: { notifications: notification._id },
        });
      }
    }

    res.status(200).json({
      success: true,
      milestone: project.milestones[milestoneIndex],
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    next(error);
  }
};

/**
 * @desc    Save/unsave project
 * @route   POST /api/projects/:id/save
 * @access  Private
 */
exports.toggleSaveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if project is already saved
    const isSaved = user.savedProjects.includes(project._id);

    if (isSaved) {
      // Unsave project
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { savedProjects: project._id },
      });

      // Remove user from project's savedBy
      await Project.findByIdAndUpdate(req.params.id, {
        $pull: { savedBy: req.user.id },
      });

      res.status(200).json({
        success: true,
        message: 'Project unsaved successfully',
        isSaved: false,
      });
    } else {
      // Save project
      await User.findByIdAndUpdate(req.user.id, {
        $push: { savedProjects: project._id },
      });

      // Add user to project's savedBy
      await Project.findByIdAndUpdate(req.params.id, {
        $push: { savedBy: req.user.id },
      });

      res.status(200).json({
        success: true,
        message: 'Project saved successfully',
        isSaved: true,
      });
    }
  } catch (error) {
    console.error('Toggle save project error:', error);
    next(error);
  }
};

/**
 * @desc    Get user's saved projects
 * @route   GET /api/projects/saved
 * @access  Private
 */
exports.getSavedProjects = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedProjects',
      select: 'title description category skills budget deadline status',
      populate: {
        path: 'client',
        select: 'name avatar',
      },
    });

    res.status(200).json({
      success: true,
      projects: user.savedProjects,
    });
  } catch (error) {
    console.error('Get saved projects error:', error);
    next(error);
  }
};

/**
 * @desc    Mark project as complete
 * @route   POST /api/projects/:id/complete
 * @access  Private (Client who created the project)
 */
exports.completeProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is the project owner
    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to complete this project' });
    }

    // Check if project is in progress
    if (project.status !== 'in_progress') {
      return res.status(400).json({
        message: `Project cannot be completed when status is ${project.status}`,
      });
    }

    // Update project status
    project.status = 'completed';
    project.completedDate = Date.now();
    project.paymentStatus = 'completed';

    await project.save();

    // Update assigned freelancers' stats
    for (const freelancerId of project.assignedFreelancers) {
      await User.findByIdAndUpdate(freelancerId, {
        $inc: { completedProjects: 1, points: 50 }, // Award 50 points for completing a project
      });
    }

    // Create notification for assigned freelancers
    if (project.assignedFreelancers.length > 0) {
      for (const freelancerId of project.assignedFreelancers) {
        const notification = new Notification({
          recipient: freelancerId,
          type: 'project',
          title: 'Project Completed',
          content: `The project "${project.title}" has been marked as completed. Please leave a review!`,
          project: project._id,
          createdBy: req.user.id,
          link: `/projects/${project._id}`,
        });

        await notification.save();

        // Add notification to freelancer's notifications
        await User.findByIdAndUpdate(freelancerId, {
          $push: { notifications: notification._id },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Project marked as completed',
    });
  } catch (error) {
    console.error('Complete project error:', error);
    next(error);
  }
};

/**
 * @desc    Add review for project
 * @route   POST /api/projects/:id/review
 * @access  Private (Client or assigned freelancer)
 */
exports.addReview = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, review } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project is completed
    if (project.status !== 'completed') {
      return res.status(400).json({
        message: 'Project must be completed before adding a review',
      });
    }

    // Check if user is the client or an assigned freelancer
    const isClient = project.client.toString() === req.user.id;
    const isFreelancer = project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        message: 'Not authorized to add a review for this project',
      });
    }

    // Add review based on user role
    if (isClient) {
      // Client reviewing freelancer(s)
      if (project.rating && project.rating.client) {
        return res.status(400).json({
          message: 'You have already submitted a review for this project',
        });
      }

      project.rating.client = {
        rating,
        review,
        createdAt: Date.now(),
      };

      // Update freelancer ratings
      for (const freelancerId of project.assignedFreelancers) {
        const freelancer = await User.findById(freelancerId);
        
        // Calculate new rating based on completed projects
        const totalRating = freelancer.rating * freelancer.completedProjects + rating;
        const newRating = totalRating / (freelancer.completedProjects + 1);
        
        await User.findByIdAndUpdate(freelancerId, {
          rating: newRating,
        });

        // Create notification for freelancer
        const notification = new Notification({
          recipient: freelancerId,
          type: 'project',
          title: 'New Review Received',
          content: `The client has left a review for the project "${project.title}".`,
          project: project._id,
          createdBy: req.user.id,
          link: `/projects/${project._id}`,
        });

        await notification.save();

        // Add notification to freelancer's notifications
        await User.findByIdAndUpdate(freelancerId, {
          $push: { notifications: notification._id },
        });
      }
    } else {
      // Freelancer reviewing client
      if (project.rating && project.rating.freelancer) {
        return res.status(400).json({
          message: 'A freelancer has already submitted a review for this project',
        });
      }

      project.rating.freelancer = {
        rating,
        review,
        createdAt: Date.now(),
      };

      // Create notification for client
      const notification = new Notification({
        recipient: project.client,
        type: 'project',
        title: 'New Review Received',
        content: `A freelancer has left a review for the project "${project.title}".`,
        project: project._id,
        createdBy: req.user.id,
        link: `/projects/${project._id}`,
      });

      await notification.save();

      // Add notification to client's notifications
      await User.findByIdAndUpdate(project.client, {
        $push: { notifications: notification._id },
      });
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
    });
  } catch (error) {
    console.error('Add review error:', error);
    next(error);
  }
};