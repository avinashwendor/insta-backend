const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * WebSocket (Socket.IO) server setup.
 * Handles real-time chat events and notifications.
 */
const initializeWebSocket = (io) => {
  // Authentication middleware — verify JWT before allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.user = {
        id: decoded.id,
        username: decoded.username,
      };
      next();
    } catch (_err) {
      next(new Error('Invalid token'));
    }
  });

  // Track online users: userId -> Set<socketId>
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      // Broadcast online status to followers
      socket.broadcast.emit('user_online', { user_id: userId });
    }
    onlineUsers.get(userId).add(socket.id);

    logger.info(`WebSocket connected: ${socket.user.username} (${socket.id})`);

    // ─── Chat Events ───────────────────────────────────────

    socket.on('join_conversation', ({ conversation_id }) => {
      socket.join(`conv:${conversation_id}`);
    });

    socket.on('leave_conversation', ({ conversation_id }) => {
      socket.leave(`conv:${conversation_id}`);
    });

    socket.on('typing_start', ({ conversation_id }) => {
      socket.to(`conv:${conversation_id}`).emit('user_typing', {
        conversation_id,
        user_id: userId,
        username: socket.user.username,
      });
    });

    socket.on('typing_stop', ({ conversation_id }) => {
      socket.to(`conv:${conversation_id}`).emit('user_stopped_typing', {
        conversation_id,
        user_id: userId,
      });
    });

    // ─── Server Channel Events ─────────────────────────────

    socket.on('join_channel', ({ channel_id }) => {
      socket.join(`channel:${channel_id}`);
    });

    socket.on('leave_channel', ({ channel_id }) => {
      socket.leave(`channel:${channel_id}`);
    });

    // ─── Disconnect ────────────────────────────────────────

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user_offline', { user_id: userId });
        }
      }
      logger.info(`WebSocket disconnected: ${socket.user.username} (${socket.id})`);
    });
  });

  /**
   * Emit a new message to all participants of a conversation.
   * Called from chat service after a message is persisted.
   */
  io.emitToConversation = (conversationId, event, data) => {
    io.to(`conv:${conversationId}`).emit(event, data);
  };

  /**
   * Emit a notification to a specific user (all their connected sockets).
   */
  io.emitToUser = (userId, event, data) => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        io.to(socketId).emit(event, data);
      }
    }
  };

  logger.info('WebSocket server initialized');
  return io;
};

module.exports = { initializeWebSocket };
