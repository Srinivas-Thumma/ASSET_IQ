import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './env.js';
import messageService from '../services/message.service.js';
import logger from './logger.js';

export let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST']
    },
  });

  // Auth middleware - extract accessToken from HttpOnly cookie or auth object
  io.use((socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || '';
      const tokenMatch = cookie.match(/accessToken=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : (socket.handshake.auth?.token || null);

      if (!token) {
        // Fallback for development if token is passed via query/auth
        return next();
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded._id || decoded.id;
      socket.userRole = decoded.role;
      socket.orgId = decoded.organizationId;
      next();
    } catch (err) {
      logger.warn(`Socket auth warning: ${err.message}`);
      next();
    }
  });

  io.on('connection', (socket) => {
    const userIdentifier = socket.userId || socket.id;
    logger.info(`WebSocket client connected: ${userIdentifier}`);

    // Join user's private notification room if authenticated
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join ticket room
    socket.on('join-ticket', (ticketId) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
        logger.info(`Socket ${userIdentifier} joined ticket room: ticket:${ticketId}`);
      }
    });

    // Leave ticket room
    socket.on('leave-ticket', (ticketId) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
        logger.info(`Socket ${userIdentifier} left ticket room: ticket:${ticketId}`);
      }
    });

    // Handle new message via socket
    socket.on('send-message', async (data) => {
      try {
        const { ticketId, message, isInternal } = data;
        if (!ticketId || !message) return;

        const user = {
          _id: socket.userId,
          role: socket.userRole,
          organizationId: socket.orgId
        };

        const savedMessage = await messageService.addMessage(ticketId, { message, isInternal }, user);
        io.to(`ticket:${ticketId}`).emit('new-message', savedMessage);
      } catch (err) {
        logger.error(`Error processing socket message: ${err.message}`);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${userIdentifier}`);
    });
  });

  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToTicket = (ticketId, event, data) => {
  if (io && ticketId) {
    io.to(`ticket:${ticketId}`).emit(event, data);
  }
};

export default {
  io,
  initSocket,
  emitToUser,
  emitToTicket
};
