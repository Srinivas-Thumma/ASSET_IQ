import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/token.utils.js';
import Ticket from '../models/Ticket.js';
import Conversation from '../models/Conversation.js';
import messageService from '../services/message.service.js';
import conversationService, { verifyConversationAccess } from '../services/conversation.service.js';
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
    }
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
      socket.userName = decoded.name || '';

      socket.user = {
        _id: socket.userId,
        email: socket.userEmail,
        role: socket.userRole,
        organizationId: socket.orgId,
        name: socket.userName
      };

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

    // ─────────────────────────────────────────────────────────────
    // CONVERSATION SOCKET ARCHITECTURE (NEW)
    // ─────────────────────────────────────────────────────────────

    // Join Conversation Room with centralized authorization guard
    socket.on('conversation:join', async (payload) => {
      try {
        const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;
        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          socket.emit('error', { code: 'INVALID_CONVERSATION', message: 'Invalid conversation ID format' });
          return;
        }

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
          socket.emit('error', { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
          return;
        }

        // Single Source of Truth: Centralized Authorization Guard
        const accessCheck = await verifyConversationAccess(conversation, socket.user);
        if (!accessCheck.authorized) {
          logger.warn(`SECURITY: Socket conversation:join blocked for user ${socket.userId}: ${accessCheck.reason}`);
          socket.emit('error', { code: 'FORBIDDEN', message: accessCheck.reason || 'Unauthorized to join conversation' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        logger.info(`User ${userIdentifier} joined conversation room: conversation:${conversationId}`);
        socket.emit('conversation:joined', { conversationId });
      } catch (err) {
        logger.error(`Error in socket conversation:join: ${err.message}`);
        socket.emit('error', { code: 'JOIN_FAILED', message: 'Failed to join conversation room' });
      }
    });

    // Leave Conversation Room
    socket.on('conversation:leave', (payload) => {
      const conversationId = typeof payload === 'string' ? payload : payload?.conversationId;
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
        logger.info(`User ${userIdentifier} left conversation room: conversation:${conversationId}`);
      }
    });

    // Send Message to Conversation Thread
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, isInternal } = data || {};

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
          socket.emit('error', { code: 'INVALID_CONVERSATION', message: 'Valid Conversation ID is required' });
          return;
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
          socket.emit('error', { code: 'INVALID_MESSAGE', message: 'Message content cannot be empty' });
          return;
        }

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
          socket.emit('error', { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
          return;
        }

        // Centralized Authorization Verification
        const accessCheck = await verifyConversationAccess(conversation, socket.user);
        if (!accessCheck.authorized) {
          socket.emit('error', { code: 'FORBIDDEN', message: accessCheck.reason || 'Unauthorized' });
          return;
        }

        // Write Permissions Guard A: SuperAdmin maintenance ticket read-only check
        if (conversation.contextType === 'ticket' && socket.userRole === 'super_admin') {
          socket.emit('error', {
            code: 'FORBIDDEN',
            message: 'SuperAdmin access to operational tickets is read-only'
          });
          return;
        }

        // Write Permissions Guard B: Employee internal note check
        if (socket.userRole === 'employee' && isInternal) {
          socket.emit('error', {
            code: 'FORBIDDEN',
            message: 'Employees are not authorized to post internal staff notes'
          });
          return;
        }

        // Add Message via conversation.service (Ignores client-supplied senderId, orgId, role)
        const savedMessage = await conversationService.addMessageToConversation(
          conversationId,
          { content, isInternal: Boolean(isInternal) },
          socket.user
        );

        // REAL-TIME BROADCAST WITH SERVER-SIDE INTERNAL MESSAGE FILTERING
        if (savedMessage.isInternal) {
          // Internal Note: Emit ONLY to authorized staff sockets in room (excluding employees)
          const socketsInRoom = await io.in(`conversation:${conversationId}`).fetchSockets();
          for (const s of socketsInRoom) {
            if (s.userRole !== 'employee') {
              s.emit('message:new', savedMessage);
            }
          }
        } else {
          // Public Message: Broadcast to all room members
          io.to(`conversation:${conversationId}`).emit('message:new', savedMessage);
        }
      } catch (err) {
        logger.error(`Error in socket message:send: ${err.message}`);
        socket.emit('error', { code: 'MESSAGE_SEND_FAILED', message: err.message });
      }
    });

    // ─────────────────────────────────────────────────────────────
    // LEGACY TICKET ROOM HANDLERS (PRESERVED)
    // ─────────────────────────────────────────────────────────────

    // Join ticket room with server-side tenant & role authorization
    socket.on('join-ticket', async (ticketId) => {
      try {
        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
          socket.emit('error', { message: 'Invalid ticket ID format' });
          return;
        }

        const ticket = await Ticket.findById(ticketId).lean();
        if (!ticket) {
          socket.emit('error', { message: 'Ticket not found' });
          return;
        }

        // Super Admin can join any ticket room for audit
        if (socket.userRole === 'super_admin') {
          socket.join(`ticket:${ticketId}`);
          logger.info(`SuperAdmin ${socket.userId} joined ticket room: ticket:${ticketId}`);
          socket.emit('ticket-joined', { ticketId });
          return;
        }

        // Tenant Isolation
        if (!socket.orgId || String(ticket.organizationId) !== String(socket.orgId)) {
          logger.warn(
            `SECURITY ALERT: Cross-tenant ticket room join blocked. User ${socket.userId} (Org ${socket.orgId}) attempted to join Ticket ${ticketId} (Org ${ticket.organizationId})`
          );
          socket.emit('error', { message: 'Unauthorized: Ticket does not belong to your organization' });
          return;
        }

        // Employee restriction
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

    // Handle legacy message
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

        // SuperAdmin read-only check on legacy maintenance tickets
        if (socket.userRole === 'super_admin' && ticket.type !== 'admin_support') {
          socket.emit('error', { message: 'SuperAdmin access to operational tickets is read-only' });
          return;
        }

        const user = {
          _id: socket.userId,
          email: socket.userEmail,
          role: socket.userRole,
          organizationId: socket.orgId
        };

        await messageService.addMessage(
          ticketId,
          { message: message.trim(), isInternal: Boolean(isInternal) },
          user
        );
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

export const emitToConversation = async (conversationId, event, data) => {
  if (io && conversationId) {
    if (data && data.isInternal) {
      const socketsInRoom = await io.in(`conversation:${conversationId}`).fetchSockets();
      for (const s of socketsInRoom) {
        if (s.userRole !== 'employee') {
          s.emit(event, data);
        }
      }
    } else {
      io.to(`conversation:${conversationId}`).emit(event, data);
    }
  }
};

export default {
  io,
  initSocket,
  emitToUser,
  emitToTicket,
  emitToConversation
};
