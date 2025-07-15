const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Notification = require('../models/notification.model');

/**
 * Setup socket handlers for real-time communication
 * @param {Object} io - Socket.io instance
 */
const setupSocketHandlers = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: ' + error.message));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    // Join user to their personal room
    socket.join(socket.user._id.toString());

    // Join team rooms
    if (socket.user.teams && socket.user.teams.length > 0) {
      socket.user.teams.forEach(team => {
        socket.join(`team:${team}`);
      });
    }

    // Join project rooms if user is a client or assigned freelancer
    if (socket.user.projects && socket.user.projects.length > 0) {
      socket.user.projects.forEach(project => {
        socket.join(`project:${project}`);
      });
    }

    // Handle private messages
    socket.on('private-message', async (data) => {
      try {
        const { recipientId, content, type = 'text' } = data;

        // Create new chat message
        const newMessage = new Chat({
          sender: socket.user._id,
          recipient: recipientId,
          content,
          type
        });

        await newMessage.save();

        // Emit to recipient
        io.to(recipientId).emit('new-message', {
          message: newMessage,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });

        // Emit back to sender for confirmation
        socket.emit('message-sent', { success: true, messageId: newMessage._id });
      } catch (error) {
        console.error('Error sending private message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle team messages
    socket.on('team-message', async (data) => {
      try {
        const { teamId, content, type = 'text' } = data;

        // Check if user is part of the team
        if (!socket.user.teams.includes(teamId)) {
          return socket.emit('error', { message: 'You are not a member of this team' });
        }

        // Create new team message
        const newMessage = new Chat({
          sender: socket.user._id,
          team: teamId,
          content,
          type,
          isTeamMessage: true
        });

        await newMessage.save();

        // Emit to team room
        io.to(`team:${teamId}`).emit('new-team-message', {
          message: newMessage,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });
      } catch (error) {
        console.error('Error sending team message:', error);
        socket.emit('error', { message: 'Failed to send team message' });
      }
    });

    // Handle project updates
    socket.on('project-update', async (data) => {
      try {
        const { projectId, updateType, content } = data;

        // Emit to project room
        io.to(`project:${projectId}`).emit('project-updated', {
          projectId,
          updateType,
          content,
          timestamp: new Date(),
          user: {
            _id: socket.user._id,
            name: socket.user.name
          }
        });

        // Create notification for project members
        const notification = new Notification({
          type: 'project',
          title: `Project Update: ${updateType}`,
          content,
          project: projectId,
          createdBy: socket.user._id
        });

        await notification.save();
      } catch (error) {
        console.error('Error sending project update:', error);
        socket.emit('error', { message: 'Failed to send project update' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { recipientId } = data;
      socket.to(recipientId).emit('user-typing', { userId: socket.user._id });
    });

    socket.on('stop-typing', (data) => {
      const { recipientId } = data;
      socket.to(recipientId).emit('user-stop-typing', { userId: socket.user._id });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });
};

module.exports = { setupSocketHandlers };