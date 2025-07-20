const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const Team = require('../models/team.model');
const Project = require('../models/project.model');
const Notification = require('../models/notification.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Send a private message to another user
 * @route   POST /api/chats/private
 * @access  Private
 */
exports.sendPrivateMessage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, content, type, fileUrl, fileName, fileSize, fileType } = req.body;

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create new message
    const message = new Chat({
      sender: req.user.id,
      recipient,
      content,
      type: type || 'text',
      isPrivateMessage: true,
    });

    // Add file details if message is a file or image
    if (type === 'file' || type === 'image') {
      message.file = {
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
      };
    }

    await message.save();

    // Populate sender info
    const populatedMessage = await Chat.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    // Create notification for recipient
    const notification = new Notification({
      recipient,
      type: 'message',
      title: 'New Private Message',
      content: `You have received a new message from ${req.user.name}`,
      message: message._id,
      createdBy: req.user.id,
      link: `/messages/${req.user.id}`,
    });

    await notification.save();

    // Add notification to recipient's notifications
    await User.findByIdAndUpdate(recipient, {
      $push: { notifications: notification._id },
    });

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Send private message error:', error);
    next(error);
  }
};

/**
 * @desc    Send a message to a team
 * @route   POST /api/chats/team/:teamId
 * @access  Private (Team members only)
 */
exports.sendTeamMessage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type, fileUrl, fileName, fileSize, fileType } = req.body;
    const { teamId } = req.params;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team member
    const isMember = team.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to send messages to this team' });
    }

    // Create new message
    const message = new Chat({
      sender: req.user.id,
      team: teamId,
      content,
      type: type || 'text',
      isTeamMessage: true,
    });

    // Add file details if message is a file or image
    if (type === 'file' || type === 'image') {
      message.file = {
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
      };
    }

    await message.save();

    // Populate sender info
    const populatedMessage = await Chat.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    // Create notifications for team members (except sender)
    for (const member of team.members) {
      // Skip notification for the sender
      if (member.user.toString() === req.user.id) continue;

      const notification = new Notification({
        recipient: member.user,
        type: 'message',
        title: 'New Team Message',
        content: `${req.user.name} sent a message to the team: ${team.name}`,
        message: message._id,
        team: teamId,
        createdBy: req.user.id,
        link: `/teams/${teamId}/chat`,
      });

      await notification.save();

      // Add notification to member's notifications
      await User.findByIdAndUpdate(member.user, {
        $push: { notifications: notification._id },
      });
    }

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Send team message error:', error);
    next(error);
  }
};

/**
 * @desc    Send a message to a project
 * @route   POST /api/chats/project/:projectId
 * @access  Private (Project client and assigned freelancers/team members only)
 */
exports.sendProjectMessage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type, fileUrl, fileName, fileSize, fileType } = req.body;
    const { projectId } = req.params;

    // Check if project exists
    const project = await Project.findById(projectId)
      .populate('assignedTeam', 'members')
      .populate('client', 'name');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to send messages to this project
    const isClient = project.client._id.toString() === req.user.id;
    const isAssignedFreelancer = project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );

    let isTeamMember = false;
    if (project.assignedTeam) {
      isTeamMember = project.assignedTeam.members.some(
        (member) => member.user.toString() === req.user.id
      );
    }

    if (!isClient && !isAssignedFreelancer && !isTeamMember) {
      return res.status(403).json({
        message: 'Not authorized to send messages to this project',
      });
    }

    // Create new message
    const message = new Chat({
      sender: req.user.id,
      project: projectId,
      content,
      type: type || 'text',
      isProjectMessage: true,
    });

    // Add file details if message is a file or image
    if (type === 'file' || type === 'image') {
      message.file = {
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
      };
    }

    await message.save();

    // Populate sender info
    const populatedMessage = await Chat.findById(message._id).populate(
      'sender',
      'name avatar'
    );

    // Create notifications for project participants (except sender)
    const notifyUsers = new Set();

    // Add client
    if (project.client._id.toString() !== req.user.id) {
      notifyUsers.add(project.client._id.toString());
    }

    // Add assigned freelancers
    project.assignedFreelancers.forEach((freelancer) => {
      if (freelancer.toString() !== req.user.id) {
        notifyUsers.add(freelancer.toString());
      }
    });

    // Add team members if a team is assigned
    if (project.assignedTeam) {
      project.assignedTeam.members.forEach((member) => {
        if (member.user.toString() !== req.user.id) {
          notifyUsers.add(member.user.toString());
        }
      });
    }

    // Create notifications
    for (const userId of notifyUsers) {
      const notification = new Notification({
        recipient: userId,
        type: 'message',
        title: 'New Project Message',
        content: `${req.user.name} sent a message in the project: ${project.title}`,
        message: message._id,
        project: projectId,
        createdBy: req.user.id,
        link: `/projects/${projectId}/chat`,
      });

      await notification.save();

      // Add notification to user's notifications
      await User.findByIdAndUpdate(userId, {
        $push: { notifications: notification._id },
      });
    }

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Send project message error:', error);
    next(error);
  }
};

/**
 * @desc    Get private messages between two users
 * @route   GET /api/chats/private/:userId
 * @access  Private
 */
exports.getPrivateMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get messages between the two users
    const messages = await Chat.find({
      $or: [
        { sender: req.user.id, recipient: userId, isPrivateMessage: true },
        { sender: userId, recipient: req.user.id, isPrivateMessage: true },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('sender', 'name avatar')
      .populate('recipient', 'name avatar');

    // Get total count for pagination
    const total = await Chat.countDocuments({
      $or: [
        { sender: req.user.id, recipient: userId, isPrivateMessage: true },
        { sender: userId, recipient: req.user.id, isPrivateMessage: true },
      ],
    });

    // Mark messages as read
    await Chat.updateMany(
      { sender: userId, recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      messages: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get private messages error:', error);
    next(error);
  }
};

/**
 * @desc    Get team messages
 * @route   GET /api/chats/team/:teamId
 * @access  Private (Team members only)
 */
exports.getTeamMessages = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team member
    const isMember = team.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view messages for this team' });
    }

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get team messages
    const messages = await Chat.find({
      team: teamId,
      isTeamMessage: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('sender', 'name avatar');

    // Get total count for pagination
    const total = await Chat.countDocuments({
      team: teamId,
      isTeamMessage: true,
    });

    // Mark messages as read
    await Chat.updateMany(
      {
        team: teamId,
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id },
      },
      { $push: { readBy: { user: req.user.id, readAt: Date.now() } } }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      messages: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get team messages error:', error);
    next(error);
  }
};

/**
 * @desc    Get project messages
 * @route   GET /api/chats/project/:projectId
 * @access  Private (Project client and assigned freelancers/team members only)
 */
exports.getProjectMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if project exists
    const project = await Project.findById(projectId)
      .populate('assignedTeam', 'members')
      .populate('client', 'name');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is authorized to view messages for this project
    const isClient = project.client._id.toString() === req.user.id;
    const isAssignedFreelancer = project.assignedFreelancers.some(
      (freelancer) => freelancer.toString() === req.user.id
    );

    let isTeamMember = false;
    if (project.assignedTeam) {
      isTeamMember = project.assignedTeam.members.some(
        (member) => member.user.toString() === req.user.id
      );
    }

    if (!isClient && !isAssignedFreelancer && !isTeamMember) {
      return res.status(403).json({
        message: 'Not authorized to view messages for this project',
      });
    }

    // Calculate skip for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get project messages
    const messages = await Chat.find({
      project: projectId,
      isProjectMessage: true,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('sender', 'name avatar');

    // Get total count for pagination
    const total = await Chat.countDocuments({
      project: projectId,
      isProjectMessage: true,
    });

    // Mark messages as read
    await Chat.updateMany(
      {
        project: projectId,
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id },
      },
      { $push: { readBy: { user: req.user.id, readAt: Date.now() } } }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      messages: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Get project messages error:', error);
    next(error);
  }
};

/**
 * @desc    Get user's recent conversations
 * @route   GET /api/chats/conversations
 * @access  Private
 */
exports.getConversations = async (req, res, next) => {
  try {
    // Get private conversations
    const privateMessages = await Chat.aggregate([
      {
        $match: {
          isPrivateMessage: true,
          $or: [{ sender: req.user._id }, { recipient: req.user._id }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$sender', req.user._id] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          user: {
            _id: 1,
            name: 1,
            avatar: 1,
          },
          type: { $literal: 'private' },
        },
      },
    ]);

    // Get team conversations
    const userTeams = await Team.find({ 'members.user': req.user._id })
      .select('_id name avatar')
      .lean();

    const teamConversations = [];

    for (const team of userTeams) {
      const lastMessage = await Chat.findOne({
        team: team._id,
        isTeamMessage: true,
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'name avatar')
        .lean();

      if (lastMessage) {
        const unreadCount = await Chat.countDocuments({
          team: team._id,
          isTeamMessage: true,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
        });

        teamConversations.push({
          _id: team._id,
          lastMessage,
          unreadCount,
          team,
          type: 'team',
        });
      }
    }

    // Get project conversations
    const userProjects = await Project.find({
      $or: [
        { client: req.user._id },
        { assignedFreelancers: req.user._id },
      ],
    })
      .select('_id title client')
      .populate('client', 'name avatar')
      .lean();

    // Also get projects where user is part of the assigned team
    const teamProjects = await Project.find({
      assignedTeam: { $in: userTeams.map((team) => team._id) },
    })
      .select('_id title client')
      .populate('client', 'name avatar')
      .lean();

    // Merge and deduplicate projects
    const allProjects = [...userProjects];
    for (const project of teamProjects) {
      if (!allProjects.some((p) => p._id.toString() === project._id.toString())) {
        allProjects.push(project);
      }
    }

    const projectConversations = [];

    for (const project of allProjects) {
      const lastMessage = await Chat.findOne({
        project: project._id,
        isProjectMessage: true,
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'name avatar')
        .lean();

      if (lastMessage) {
        const unreadCount = await Chat.countDocuments({
          project: project._id,
          isProjectMessage: true,
          sender: { $ne: req.user._id },
          'readBy.user': { $ne: req.user._id },
        });

        projectConversations.push({
          _id: project._id,
          lastMessage,
          unreadCount,
          project,
          type: 'project',
        });
      }
    }

    // Combine all conversations and sort by last message date
    const allConversations = [
      ...privateMessages,
      ...teamConversations,
      ...projectConversations,
    ].sort((a, b) => {
      const dateA = a.lastMessage.createdAt;
      const dateB = b.lastMessage.createdAt;
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      conversations: allConversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    next(error);
  }
};

/**
 * @desc    Reply to a message
 * @route   POST /api/chats/:messageId/reply
 * @access  Private
 */
exports.replyToMessage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, type, fileUrl, fileName, fileSize, fileType } = req.body;
    const { messageId } = req.params;

    // Check if original message exists
    const originalMessage = await Chat.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized to reply to this message
    let isAuthorized = false;

    if (originalMessage.isPrivateMessage) {
      // For private messages, only sender and recipient can reply
      isAuthorized =
        originalMessage.sender.toString() === req.user.id ||
        originalMessage.recipient.toString() === req.user.id;
    } else if (originalMessage.isTeamMessage) {
      // For team messages, only team members can reply
      const team = await Team.findById(originalMessage.team);
      if (team) {
        isAuthorized = team.members.some(
          (member) => member.user.toString() === req.user.id
        );
      }
    } else if (originalMessage.isProjectMessage) {
      // For project messages, only project participants can reply
      const project = await Project.findById(originalMessage.project)
        .populate('assignedTeam', 'members')
        .populate('client', 'name');

      if (project) {
        const isClient = project.client._id.toString() === req.user.id;
        const isAssignedFreelancer = project.assignedFreelancers.some(
          (freelancer) => freelancer.toString() === req.user.id
        );

        let isTeamMember = false;
        if (project.assignedTeam) {
          isTeamMember = project.assignedTeam.members.some(
            (member) => member.user.toString() === req.user.id
          );
        }

        isAuthorized = isClient || isAssignedFreelancer || isTeamMember;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: 'Not authorized to reply to this message',
      });
    }

    // Create new message as a reply
    const replyMessage = new Chat({
      sender: req.user.id,
      content,
      type: type || 'text',
      replyTo: messageId,
    });

    // Copy relevant fields from original message
    if (originalMessage.isPrivateMessage) {
      replyMessage.isPrivateMessage = true;
      replyMessage.recipient =
        originalMessage.sender.toString() === req.user.id
          ? originalMessage.recipient
          : originalMessage.sender;
    } else if (originalMessage.isTeamMessage) {
      replyMessage.isTeamMessage = true;
      replyMessage.team = originalMessage.team;
    } else if (originalMessage.isProjectMessage) {
      replyMessage.isProjectMessage = true;
      replyMessage.project = originalMessage.project;
    }

    // Add file details if message is a file or image
    if (type === 'file' || type === 'image') {
      replyMessage.file = {
        url: fileUrl,
        name: fileName,
        size: fileSize,
        type: fileType,
      };
    }

    await replyMessage.save();

    // Populate sender and reply info
    const populatedMessage = await Chat.findById(replyMessage._id)
      .populate('sender', 'name avatar')
      .populate('replyTo', 'content type');

    // Create notifications based on message type
    if (replyMessage.isPrivateMessage) {
      // Create notification for recipient
      const notification = new Notification({
        recipient: replyMessage.recipient,
        type: 'message',
        title: 'New Reply to Message',
        content: `${req.user.name} replied to your message`,
        message: replyMessage._id,
        createdBy: req.user.id,
        link: `/messages/${req.user.id}`,
      });

      await notification.save();

      // Add notification to recipient's notifications
      await User.findByIdAndUpdate(replyMessage.recipient, {
        $push: { notifications: notification._id },
      });
    } else if (replyMessage.isTeamMessage) {
      // Get team members
      const team = await Team.findById(replyMessage.team);
      if (team) {
        // Create notifications for team members (except sender)
        for (const member of team.members) {
          // Skip notification for the sender
          if (member.user.toString() === req.user.id) continue;

          const notification = new Notification({
            recipient: member.user,
            type: 'message',
            title: 'New Reply in Team Chat',
            content: `${req.user.name} replied to a message in the team: ${team.name}`,
            message: replyMessage._id,
            team: replyMessage.team,
            createdBy: req.user.id,
            link: `/teams/${replyMessage.team}/chat`,
          });

          await notification.save();

          // Add notification to member's notifications
          await User.findByIdAndUpdate(member.user, {
            $push: { notifications: notification._id },
          });
        }
      }
    } else if (replyMessage.isProjectMessage) {
      // Get project participants
      const project = await Project.findById(replyMessage.project)
        .populate('assignedTeam', 'members')
        .populate('client', 'name');

      if (project) {
        const notifyUsers = new Set();

        // Add client
        if (project.client._id.toString() !== req.user.id) {
          notifyUsers.add(project.client._id.toString());
        }

        // Add assigned freelancers
        project.assignedFreelancers.forEach((freelancer) => {
          if (freelancer.toString() !== req.user.id) {
            notifyUsers.add(freelancer.toString());
          }
        });

        // Add team members if a team is assigned
        if (project.assignedTeam) {
          project.assignedTeam.members.forEach((member) => {
            if (member.user.toString() !== req.user.id) {
              notifyUsers.add(member.user.toString());
            }
          });
        }

        // Create notifications
        for (const userId of notifyUsers) {
          const notification = new Notification({
            recipient: userId,
            type: 'message',
            title: 'New Reply in Project Chat',
            content: `${req.user.name} replied to a message in the project: ${project.title}`,
            message: replyMessage._id,
            project: replyMessage.project,
            createdBy: req.user.id,
            link: `/projects/${replyMessage.project}/chat`,
          });

          await notification.save();

          // Add notification to user's notifications
          await User.findByIdAndUpdate(userId, {
            $push: { notifications: notification._id },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Reply to message error:', error);
    next(error);
  }
};

/**
 * @desc    Add reaction to a message
 * @route   POST /api/chats/:messageId/react
 * @access  Private
 */
exports.reactToMessage = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reaction } = req.body;
    const { messageId } = req.params;

    // Check if message exists
    const message = await Chat.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized to react to this message
    let isAuthorized = false;

    if (message.isPrivateMessage) {
      // For private messages, only sender and recipient can react
      isAuthorized =
        message.sender.toString() === req.user.id ||
        message.recipient.toString() === req.user.id;
    } else if (message.isTeamMessage) {
      // For team messages, only team members can react
      const team = await Team.findById(message.team);
      if (team) {
        isAuthorized = team.members.some(
          (member) => member.user.toString() === req.user.id
        );
      }
    } else if (message.isProjectMessage) {
      // For project messages, only project participants can react
      const project = await Project.findById(message.project)
        .populate('assignedTeam', 'members')
        .populate('client', 'name');

      if (project) {
        const isClient = project.client._id.toString() === req.user.id;
        const isAssignedFreelancer = project.assignedFreelancers.some(
          (freelancer) => freelancer.toString() === req.user.id
        );

        let isTeamMember = false;
        if (project.assignedTeam) {
          isTeamMember = project.assignedTeam.members.some(
            (member) => member.user.toString() === req.user.id
          );
        }

        isAuthorized = isClient || isAssignedFreelancer || isTeamMember;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        message: 'Not authorized to react to this message',
      });
    }

    // Check if user has already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user.id && r.emoji === reaction
    );

    if (existingReactionIndex !== -1) {
      // Remove the reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction from this user
      const userReactionIndex = message.reactions.findIndex(
        (r) => r.user.toString() === req.user.id
      );

      if (userReactionIndex !== -1) {
        message.reactions.splice(userReactionIndex, 1);
      }

      // Add the new reaction
      message.reactions.push({
        user: req.user.id,
        emoji: reaction,
        createdAt: Date.now(),
      });
    }

    await message.save();

    // Populate user info in reactions
    const populatedMessage = await Chat.findById(messageId).populate({
      path: 'reactions.user',
      select: 'name avatar',
    });

    res.status(200).json({
      success: true,
      reactions: populatedMessage.reactions,
    });
  } catch (error) {
    console.error('React to message error:', error);
    next(error);
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/chats/:messageId
 * @access  Private (Message sender only)
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Chat.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the message sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Delete message
    await message.remove();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    next(error);
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chats/read
 * @access  Private
 */
exports.markMessagesAsRead = async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Message IDs are required' });
    }

    // Mark private messages as read
    await Chat.updateMany(
      {
        _id: { $in: messageIds },
        isPrivateMessage: true,
        recipient: req.user.id,
        isRead: false,
      },
      { isRead: true }
    );

    // Mark team/project messages as read by adding user to readBy
    await Chat.updateMany(
      {
        _id: { $in: messageIds },
        $or: [{ isTeamMessage: true }, { isProjectMessage: true }],
        sender: { $ne: req.user.id },
        'readBy.user': { $ne: req.user.id },
      },
      { $push: { readBy: { user: req.user.id, readAt: Date.now() } } }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    next(error);
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/chats/unread
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    // Count unread private messages
    const privateCount = await Chat.countDocuments({
      recipient: req.user.id,
      isPrivateMessage: true,
      isRead: false,
    });

    // Count unread team messages
    const userTeams = await Team.find({ 'members.user': req.user.id })
      .select('_id')
      .lean();

    const teamCount = await Chat.countDocuments({
      team: { $in: userTeams.map((team) => team._id) },
      isTeamMessage: true,
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id },
    });

    // Count unread project messages
    const userProjects = await Project.find({
      $or: [
        { client: req.user.id },
        { assignedFreelancers: req.user.id },
        { assignedTeam: { $in: userTeams.map((team) => team._id) } },
      ],
    })
      .select('_id')
      .lean();

    const projectCount = await Chat.countDocuments({
      project: { $in: userProjects.map((project) => project._id) },
      isProjectMessage: true,
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id },
    });

    // Total unread count
    const totalCount = privateCount + teamCount + projectCount;

    res.status(200).json({
      success: true,
      unreadCount: {
        total: totalCount,
        private: privateCount,
        team: teamCount,
        project: projectCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    next(error);
  }
};