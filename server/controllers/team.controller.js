const Team = require('../models/team.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Notification = require('../models/notification.model');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new team
 * @route   POST /api/teams
 * @access  Private
 */
exports.createTeam = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, skills, avatar } = req.body;

    // Create new team
    const team = new Team({
      name,
      description,
      creator: req.user.id,
      members: [
        {
          user: req.user.id,
          role: 'admin',
          permissions: ['manage_team', 'manage_members', 'manage_projects', 'invite_members'],
          joinedAt: Date.now(),
        },
      ],
      skills: skills || [],
      avatar,
    });

    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user.id, {
      $push: { teams: team._id },
    });

    // Populate creator info
    const populatedTeam = await Team.findById(team._id).populate({
      path: 'members.user',
      select: 'name avatar',
    });

    res.status(201).json({
      success: true,
      team: populatedTeam,
    });
  } catch (error) {
    console.error('Create team error:', error);
    next(error);
  }
};

/**
 * @desc    Get all teams with filters
 * @route   GET /api/teams
 * @access  Public
 */
exports.getTeams = async (req, res, next) => {
  try {
    const {
      search,
      skills,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',');
      query.skills = { $in: skillsArray };
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
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'completed_projects':
        sortOptions = { completedProjects: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const teams = await Team.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar')
      .select('-invitations -documents');

    // Get total count for pagination
    const total = await Team.countDocuments(query);

    res.status(200).json({
      success: true,
      count: teams.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      teams,
    });
  } catch (error) {
    console.error('Get teams error:', error);
    next(error);
  }
};

/**
 * @desc    Get team by ID
 * @route   GET /api/teams/:id
 * @access  Public
 */
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar skills')
      .populate('projects', 'title description status');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member of the team
    let userIsMember = false;
    let userRole = null;
    let userPermissions = [];

    if (req.user) {
      const memberInfo = team.members.find(
        (member) => member.user._id.toString() === req.user.id
      );

      if (memberInfo) {
        userIsMember = true;
        userRole = memberInfo.role;
        userPermissions = memberInfo.permissions;
      }
    }

    // If user is not a member, remove invitations from response
    const teamResponse = team.toObject();
    if (!userIsMember) {
      teamResponse.invitations = [];
      teamResponse.documents = [];
    }

    res.status(200).json({
      success: true,
      team: teamResponse,
      userIsMember,
      userRole,
      userPermissions,
    });
  } catch (error) {
    console.error('Get team by ID error:', error);
    next(error);
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private (Team admin only)
 */
exports.updateTeam = async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team admin
    const memberInfo = team.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (!memberInfo || memberInfo.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this team' });
    }

    // Update team
    team = await Team.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar skills');

    res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    console.error('Update team error:', error);
    next(error);
  }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private (Team creator only)
 */
exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is the team creator
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this team' });
    }

    // Remove team from all members' teams
    for (const member of team.members) {
      await User.findByIdAndUpdate(member.user, {
        $pull: { teams: team._id },
      });
    }

    // Remove team from all projects
    await Project.updateMany(
      { assignedTeam: team._id },
      { $unset: { assignedTeam: 1 } }
    );

    // Delete team
    await team.remove();

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error) {
    console.error('Delete team error:', error);
    next(error);
  }
};

/**
 * @desc    Invite user to team
 * @route   POST /api/teams/:id/invite
 * @access  Private (Team admin only)
 */
exports.inviteToTeam = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, role, permissions } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team admin
    const memberInfo = team.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (!memberInfo || memberInfo.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to invite users to this team' });
    }

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    // Check if user is already invited
    const isAlreadyInvited = team.invitations.some(
      (invitation) => invitation.user.toString() === user._id.toString()
    );

    if (isAlreadyInvited) {
      return res.status(400).json({ message: 'User is already invited to this team' });
    }

    // Create invitation
    const invitation = {
      user: user._id,
      role: role || 'member',
      permissions: permissions || ['view_projects'],
      invitedBy: req.user.id,
      invitedAt: Date.now(),
    };

    // Add invitation to team
    team.invitations.push(invitation);
    await team.save();

    // Create notification for invited user
    const notification = new Notification({
      recipient: user._id,
      type: 'invitation',
      title: 'Team Invitation',
      content: `You have been invited to join the team: ${team.name}`,
      team: team._id,
      createdBy: req.user.id,
      link: `/teams/${team._id}/invitations`,
      actions: [
        {
          name: 'Accept',
          endpoint: `/api/teams/${team._id}/invitations/accept`,
          method: 'POST',
        },
        {
          name: 'Decline',
          endpoint: `/api/teams/${team._id}/invitations/decline`,
          method: 'POST',
        },
      ],
    });

    await notification.save();

    // Add notification to user's notifications
    await User.findByIdAndUpdate(user._id, {
      $push: { notifications: notification._id },
    });

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${user.name}`,
    });
  } catch (error) {
    console.error('Invite to team error:', error);
    next(error);
  }
};

/**
 * @desc    Accept team invitation
 * @route   POST /api/teams/:id/invitations/accept
 * @access  Private
 */
exports.acceptInvitation = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has an invitation
    const invitationIndex = team.invitations.findIndex(
      (invitation) => invitation.user.toString() === req.user.id
    );

    if (invitationIndex === -1) {
      return res.status(400).json({ message: 'No invitation found for this user' });
    }

    const invitation = team.invitations[invitationIndex];

    // Add user to team members
    team.members.push({
      user: req.user.id,
      role: invitation.role,
      permissions: invitation.permissions,
      joinedAt: Date.now(),
    });

    // Remove invitation
    team.invitations.splice(invitationIndex, 1);
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user.id, {
      $push: { teams: team._id },
    });

    // Create notification for team admins
    const teamAdmins = team.members.filter((member) => member.role === 'admin');
    for (const admin of teamAdmins) {
      // Skip notification for the user who accepted the invitation
      if (admin.user.toString() === req.user.id) continue;

      const notification = new Notification({
        recipient: admin.user,
        type: 'team',
        title: 'Invitation Accepted',
        content: `${req.user.name} has accepted the invitation to join the team: ${team.name}`,
        team: team._id,
        createdBy: req.user.id,
        link: `/teams/${team._id}`,
      });

      await notification.save();

      // Add notification to admin's notifications
      await User.findByIdAndUpdate(admin.user, {
        $push: { notifications: notification._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `You have joined the team: ${team.name}`,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    next(error);
  }
};

/**
 * @desc    Decline team invitation
 * @route   POST /api/teams/:id/invitations/decline
 * @access  Private
 */
exports.declineInvitation = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user has an invitation
    const invitationIndex = team.invitations.findIndex(
      (invitation) => invitation.user.toString() === req.user.id
    );

    if (invitationIndex === -1) {
      return res.status(400).json({ message: 'No invitation found for this user' });
    }

    // Remove invitation
    team.invitations.splice(invitationIndex, 1);
    await team.save();

    // Create notification for team admins
    const teamAdmins = team.members.filter((member) => member.role === 'admin');
    for (const admin of teamAdmins) {
      const notification = new Notification({
        recipient: admin.user,
        type: 'team',
        title: 'Invitation Declined',
        content: `${req.user.name} has declined the invitation to join the team: ${team.name}`,
        team: team._id,
        createdBy: req.user.id,
        link: `/teams/${team._id}`,
      });

      await notification.save();

      // Add notification to admin's notifications
      await User.findByIdAndUpdate(admin.user, {
        $push: { notifications: notification._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `You have declined the invitation to join the team: ${team.name}`,
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    next(error);
  }
};

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Private (Team admin only)
 */
exports.removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team admin
    const adminInfo = team.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (!adminInfo || adminInfo.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to remove members from this team' });
    }

    // Check if member exists
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }

    // Check if trying to remove the creator
    if (team.creator.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove the team creator' });
    }

    // Remove member from team
    team.members.splice(memberIndex, 1);
    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(userId, {
      $pull: { teams: team._id },
    });

    // Create notification for removed user
    const notification = new Notification({
      recipient: userId,
      type: 'team',
      title: 'Removed from Team',
      content: `You have been removed from the team: ${team.name}`,
      createdBy: req.user.id,
    });

    await notification.save();

    // Add notification to user's notifications
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: notification._id },
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    next(error);
  }
};

/**
 * @desc    Update member role and permissions
 * @route   PUT /api/teams/:id/members/:userId
 * @access  Private (Team admin only)
 */
exports.updateMember = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, userId } = req.params;
    const { role, permissions } = req.body;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team admin
    const adminInfo = team.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (!adminInfo || adminInfo.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update members in this team' });
    }

    // Check if member exists
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in this team' });
    }

    // Check if trying to update the creator's role
    if (team.creator.toString() === userId && role && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change the role of the team creator' });
    }

    // Update member role and permissions
    if (role) team.members[memberIndex].role = role;
    if (permissions) team.members[memberIndex].permissions = permissions;

    await team.save();

    // Create notification for updated user
    const notification = new Notification({
      recipient: userId,
      type: 'team',
      title: 'Role Updated',
      content: `Your role in the team ${team.name} has been updated to ${role || team.members[memberIndex].role}`,
      team: team._id,
      createdBy: req.user.id,
      link: `/teams/${team._id}`,
    });

    await notification.save();

    // Add notification to user's notifications
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: notification._id },
    });

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      member: team.members[memberIndex],
    });
  } catch (error) {
    console.error('Update member error:', error);
    next(error);
  }
};

/**
 * @desc    Leave team
 * @route   POST /api/teams/:id/leave
 * @access  Private
 */
exports.leaveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a member
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === req.user.id
    );

    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    // Check if user is the creator
    if (team.creator.toString() === req.user.id) {
      return res.status(400).json({
        message: 'Team creator cannot leave. Transfer ownership or delete the team instead.',
      });
    }

    // Remove user from team
    team.members.splice(memberIndex, 1);
    await team.save();

    // Remove team from user's teams
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { teams: team._id },
    });

    // Create notification for team admins
    const teamAdmins = team.members.filter((member) => member.role === 'admin');
    for (const admin of teamAdmins) {
      const notification = new Notification({
        recipient: admin.user,
        type: 'team',
        title: 'Member Left Team',
        content: `${req.user.name} has left the team: ${team.name}`,
        team: team._id,
        createdBy: req.user.id,
        link: `/teams/${team._id}`,
      });

      await notification.save();

      // Add notification to admin's notifications
      await User.findByIdAndUpdate(admin.user, {
        $push: { notifications: notification._id },
      });
    }

    res.status(200).json({
      success: true,
      message: `You have left the team: ${team.name}`,
    });
  } catch (error) {
    console.error('Leave team error:', error);
    next(error);
  }
};

/**
 * @desc    Transfer team ownership
 * @route   POST /api/teams/:id/transfer
 * @access  Private (Team creator only)
 */
exports.transferOwnership = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is the team creator
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to transfer ownership of this team' });
    }

    // Check if new owner is a member
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'New owner must be a member of the team' });
    }

    // Update team creator
    team.creator = userId;

    // Ensure new owner has admin role and full permissions
    team.members[memberIndex].role = 'admin';
    team.members[memberIndex].permissions = [
      'manage_team',
      'manage_members',
      'manage_projects',
      'invite_members',
    ];

    await team.save();

    // Create notification for new owner
    const notification = new Notification({
      recipient: userId,
      type: 'team',
      title: 'Team Ownership Transferred',
      content: `You are now the owner of the team: ${team.name}`,
      team: team._id,
      createdBy: req.user.id,
      link: `/teams/${team._id}`,
    });

    await notification.save();

    // Add notification to new owner's notifications
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: notification._id },
    });

    res.status(200).json({
      success: true,
      message: 'Team ownership transferred successfully',
    });
  } catch (error) {
    console.error('Transfer ownership error:', error);
    next(error);
  }
};

/**
 * @desc    Add document to team
 * @route   POST /api/teams/:id/documents
 * @access  Private (Team member only)
 */
exports.addDocument = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, fileUrl, fileType, fileSize } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is a team member
    const isMember = team.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to add documents to this team' });
    }

    // Create new document
    const document = {
      title,
      description,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy: req.user.id,
      uploadedAt: Date.now(),
    };

    // Add document to team
    team.documents.push(document);
    await team.save();

    // Create notification for team members
    for (const member of team.members) {
      // Skip notification for the uploader
      if (member.user.toString() === req.user.id) continue;

      const notification = new Notification({
        recipient: member.user,
        type: 'document',
        title: 'New Team Document',
        content: `${req.user.name} has added a new document to the team: ${team.name}`,
        team: team._id,
        createdBy: req.user.id,
        link: `/teams/${team._id}/documents`,
      });

      await notification.save();

      // Add notification to member's notifications
      await User.findByIdAndUpdate(member.user, {
        $push: { notifications: notification._id },
      });
    }

    res.status(201).json({
      success: true,
      document: team.documents[team.documents.length - 1],
    });
  } catch (error) {
    console.error('Add document error:', error);
    next(error);
  }
};

/**
 * @desc    Get user's teams
 * @route   GET /api/teams/user
 * @access  Private
 */
exports.getUserTeams = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'teams',
      select: 'name description avatar members projects completedProjects rating',
      populate: [
        {
          path: 'members.user',
          select: 'name avatar',
        },
        {
          path: 'projects',
          select: 'title status',
        },
      ],
    });

    res.status(200).json({
      success: true,
      teams: user.teams,
    });
  } catch (error) {
    console.error('Get user teams error:', error);
    next(error);
  }
};

/**
 * @desc    Get team invitations for user
 * @route   GET /api/teams/invitations
 * @access  Private
 */
exports.getUserInvitations = async (req, res, next) => {
  try {
    const teams = await Team.find({ 'invitations.user': req.user.id })
      .select('name description avatar creator invitations')
      .populate('creator', 'name avatar')
      .populate('invitations.invitedBy', 'name avatar');

    // Filter out only the user's invitations
    const invitations = teams.map((team) => {
      const invitation = team.invitations.find(
        (inv) => inv.user.toString() === req.user.id
      );

      return {
        team: {
          _id: team._id,
          name: team.name,
          description: team.description,
          avatar: team.avatar,
          creator: team.creator,
        },
        role: invitation.role,
        permissions: invitation.permissions,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
      };
    });

    res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error('Get user invitations error:', error);
    next(error);
  }
};

/**
 * @desc    Assign team to project
 * @route   POST /api/teams/:id/projects/:projectId
 * @access  Private (Team admin and Project client only)
 */
exports.assignTeamToProject = async (req, res, next) => {
  try {
    const { id, projectId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a team admin
    const isTeamAdmin = team.members.some(
      (member) => member.user.toString() === req.user.id && member.role === 'admin'
    );

    // Check if user is the project client
    const isProjectClient = project.client.toString() === req.user.id;

    if (!isTeamAdmin && !isProjectClient) {
      return res.status(403).json({
        message: 'Not authorized to assign this team to the project',
      });
    }

    // Check if project is open for assignment
    if (project.status !== 'open') {
      return res.status(400).json({
        message: `Project cannot be assigned when status is ${project.status}`,
      });
    }

    // Assign team to project
    project.assignedTeam = team._id;
    project.status = 'in_progress';
    project.startDate = Date.now();
    await project.save();

    // Add project to team's projects
    await Team.findByIdAndUpdate(id, {
      $push: { projects: projectId },
    });

    // Create notifications for team members
    for (const member of team.members) {
      // Skip notification for the user who assigned the team
      if (member.user.toString() === req.user.id) continue;

      const notification = new Notification({
        recipient: member.user,
        type: 'project',
        title: 'Team Assigned to Project',
        content: `Your team ${team.name} has been assigned to the project: ${project.title}`,
        team: team._id,
        project: project._id,
        createdBy: req.user.id,
        link: `/projects/${project._id}`,
      });

      await notification.save();

      // Add notification to member's notifications
      await User.findByIdAndUpdate(member.user, {
        $push: { notifications: notification._id },
      });
    }

    // Create notification for project client if not the assigner
    if (!isProjectClient) {
      const notification = new Notification({
        recipient: project.client,
        type: 'project',
        title: 'Team Assigned to Your Project',
        content: `The team ${team.name} has been assigned to your project: ${project.title}`,
        team: team._id,
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

    res.status(200).json({
      success: true,
      message: `Team ${team.name} assigned to project ${project.title}`,
    });
  } catch (error) {
    console.error('Assign team to project error:', error);
    next(error);
  }
};