import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/token.utils.js';
import Ticket from '../models/Ticket.js';
import messageService from '../services/message.service.js';
import logger from './logger.js';

export let io = null;

export const initSocket = (httpServer) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? Array.from(new Set([process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173']))
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST']
    },
  });

  // Auth middleware - strictly reject unauthenticated connections
  io.use((socket, next) => {
    try {
      let token = null;

      // 1. Try to extract from cookie header
      const cookieHeader = socket.handshake.headers.cookie || '';
      const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
      if (tokenMatch) {
        token = tokenMatch[1];
      }

      // 2. Fallback to auth object or Authorization header
      if (!token) {
        token = socket.handshake.auth?.token || null;
      }
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        logger.warn(`Socket connection rejected: No access token provided from ${socket.handshake.address}`);
        return next(new Error('Authentication error: Access token missing'));
      }

      // Verify JWT with token utils
      const decoded = verifyAccessToken(token);
      if (!decoded || (!decoded._id && !decoded.id)) {
        logger.warn(`Socket connection rejected: Malformed token payload from ${socket.handshake.address}`);
        return next(new Error('Authentication error: Invalid access token'));
      }

      // Attach authenticated user identity to socket
      socket.userId = decoded._id || decoded.id;
      socket.userEmail = decoded.email || '';
      socket.userRole = decoded.role || 'employee';
      socket.orgId = decoded.organizationId || null;

      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message} from ${socket.handshake.address}`);
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userIdentifier = `${socket.userEmail || socket.userId} (${socket.userRole})`;
    logger.info(`WebSocket client authenticated & connected: ${userIdentifier} [Socket ID: ${socket.id}]`);

    // Automatically join user's own private notification room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join ticket room with rigorous server-side tenant & role authorization
    socket.on('join-ticket', async (ticketId) => {
      try {
        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
          socket.emit('error', { message: 'Invalid ticket ID format' });
          return;
        }

        // Fetch ticket from database
        const ticket = await Ticket.findById(ticketId).lean();
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }

        // Super Admin can join any ticket room
        if (socket.userRole === 'super_admin') {
          socket.join(`ticket:${ticketId}`);
          logger.info(`SuperAdmin ${socket.userId} joined ticket room: ticket:${ticketId}`);
          socket.emit('ticket-joined', { ticketId });
          return;
        }

        // Tenant Isolation: Must belong to the same organization
        if (!socket.orgId || String(ticket.organizationId) !== String(socket.orgId)) {
          logger.warn(
            `SECURITY ALERT: Cross-tenant ticket room join blocked. User ${socket.userId} (Org ${socket.orgId}) attempted to join Ticket ${ticketId} (Org ${ticket.organizationId})`
          );
          socket.emit('error', { message: 'Unauthorized: Ticket does not belong to your organization' });
          return;
        }

        // Role restriction: Employees can only join rooms for tickets they raised
        if (socket.userRole === 'employee') {
          const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(socket.userId);
          if (!isRaisedByMe) {
            logger.warn(
              `SECURITY: Employee ${socket.userId} attempted to join Ticket ${ticketId} raised by another user`
            );
            socket.emit('error', { message: 'Unauthorized to access this ticket room' });
            return;
          }
        }

        // Authorized: Join the room
        socket.join(`ticket:${ticketId}`);
        logger.info(`User ${userIdentifier} joined authorized ticket room: ticket:${ticketId}`);
        socket.emit('ticket-joined', { ticketId });
      } catch (err) {
        logger.error(`Error in socket join-ticket: ${err.message}`);
        socket.emit('error', { message: 'Failed to join ticket room' });
      }
    });

    // Leave ticket room
    socket.on('leave-ticket', (ticketId) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
        logger.info(`Socket ${userIdentifier} left ticket room: ticket:${ticketId}`);
      }
    });

    // Handle new message via socket with full authorization
    socket.on('send-message', async (data) => {
      try {
        const { ticketId, message, isInternal } = data || {};
        if (!ticketId || !message || typeof message !== 'string' || !message.trim()) {
          socket.emit('error', { message: 'Ticket ID and message content are required' });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
          socket.emit('error', { message: 'Invalid ticket ID format' });
          return;
        }

        const ticket = await Ticket.findById(ticketId).lean();
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }

        // Verify tenant isolation
        if (socket.userRole !== 'super_admin' && String(ticket.organizationId) !== String(socket.orgId)) {
          logger.warn(
            `SECURITY ALERT: Cross-tenant socket message blocked. User ${socket.userId} tried posting to Ticket ${ticketId}`
          );
          socket.emit('error', { message: 'Unauthorized: Cross-tenant communication forbidden' });
          return;
        }

        // Verify employee restrictions
        if (socket.userRole === 'employee') {
          const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(socket.userId);
          if (!isRaisedByMe || isInternal) {
            socket.emit('error', { message: 'Unauthorized to post to this ticket' });
            return;
          }
        }

        const user = {
          _id: socket.userId,
          email: socket.userEmail,
          role: socket.userRole,
          organizationId: socket.orgId
        };

        const savedMessage = await messageService.addMessage(
          ticketId,
          { message: message.trim(), isInternal: Boolean(isInternal) },
          user
        );

        // Note: messageService.addMessage emits 'new-message' to ticket room
      } catch (err) {
        logger.error(`Error processing socket message: ${err.message}`);
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${userIdentifier} [Reason: ${reason}]`);
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
