import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Ticket from '../models/Ticket.js';
import AdministrativeRequest from '../models/AdministrativeRequest.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';

/**
 * Centralized authorization guard for Conversation access.
 * Enforces Tenant Isolation, Role-Based Access Control (RBAC),
 * and context-specific rules for REST endpoints and Socket.IO rooms.
 */
export const verifyConversationAccess = async (conversation, user) => {
  if (!conversation || !user) {
    return { authorized: false, reason: 'Invalid parameters for conversation verification' };
  }

  // 1. Tenant Isolation Guard: Non-SuperAdmin users are restricted to their own organization
  if (user.role !== 'super_admin') {
    if (!user.organizationId || String(conversation.organizationId) !== String(user.organizationId)) {
      return { authorized: false, reason: 'Unauthorized: Cross-tenant access forbidden' };
    }
  }

  const contextType = conversation.contextType;

  // 2. Context Rule A: Ticket Conversations
  if (contextType === 'ticket') {
    if (user.role === 'employee') {
      let isAuthorizedParticipant = false;

      // Check explicit participants array
      if (Array.isArray(conversation.participants)) {
        isAuthorizedParticipant = conversation.participants.some(
          (p) => String(p._id || p) === String(user._id)
        );
      }

      // Fallback check against Ticket.raisedBy
      if (!isAuthorizedParticipant && conversation.contextId) {
        const ticket = await Ticket.findById(conversation.contextId).select('raisedBy').lean();
        if (ticket && String(ticket.raisedBy) === String(user._id)) {
          isAuthorizedParticipant = true;
        }
      }

      if (!isAuthorizedParticipant) {
        return { authorized: false, reason: 'Employees can only access ticket conversations they raised' };
      }
    }
    // Asset Managers & Org Admins are authorized for their organization's ticket conversations.
    // SuperAdmin is authorized for read-only audit.
    return { authorized: true };
  }

  // 3. Context Rule B: Administrative Request Conversations
  if (contextType === 'request') {
    if (user.role === 'employee') {
      return { authorized: false, reason: 'Employees are not authorized to access request conversations' };
    }

    if (user.role === 'asset_manager') {
      if (conversation.contextId) {
        const requestDoc = await AdministrativeRequest.findById(conversation.contextId).select('category').lean();
        if (!requestDoc || requestDoc.category !== 'procurement') {
          return { authorized: false, reason: 'Asset Managers can only access procurement request conversations' };
        }
      }
    }
    // Org Admin & SuperAdmin authorized
    return { authorized: true };
  }

  // 4. Context Rule C: Permanent Organization B2B Channel
  if (contextType === 'organization') {
    if (user.role === 'employee' || user.role === 'asset_manager') {
      return { authorized: false, reason: 'Only Org Admins and Super Admins can access organization channels' };
    }
    // Derived Access: Org Admin matching organizationId & SuperAdmin authorized
    return { authorized: true };
  }

  return { authorized: false, reason: 'Unknown conversation context type' };
};

/**
 * Filters internal staff notes for employees server-side.
 * Ensures employees NEVER receive internal messages via REST or WebSockets.
 */
export const sanitizeMessagesForUser = (messages, user) => {
  if (!Array.isArray(messages)) return [];
  if (user && user.role === 'employee') {
    return messages.filter((msg) => !msg.isInternal);
  }
  return messages;
};

/**
 * Lazy initialization: Gets or creates the unique permanent organization channel for a tenant.
 */
export const getOrCreateOrganizationConversation = async (organizationId) => {
  if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID');
  }

  let conv = await Conversation.findOne({
    organizationId,
    contextType: 'organization'
  });

  if (!conv) {
    try {
      conv = await Conversation.create({
        organizationId,
        contextType: 'organization',
        participants: []
      });
    } catch (err) {
      if (err && err.code === 11000) {
        conv = await Conversation.findOne({
          organizationId,
          contextType: 'organization'
        });
      } else {
        throw err;
      }
    }
  }

  return conv;
};

/**
 * Creates a dedicated conversation for a Maintenance Ticket.
 */
export const createTicketConversation = async (ticketDoc, creatorUser) => {
  const participants = [creatorUser._id];
  if (ticketDoc.raisedBy && String(ticketDoc.raisedBy) !== String(creatorUser._id)) {
    participants.push(ticketDoc.raisedBy);
  }

  const conversation = await Conversation.create({
    organizationId: ticketDoc.organizationId,
    contextType: 'ticket',
    contextId: ticketDoc._id,
    participants,
    lastMessageAt: new Date(),
    lastMessageSnippet: `Ticket ${ticketDoc.ticketCode || ''} conversation initialized`
  });

  return conversation;
};

/**
 * Creates a dedicated conversation for an Administrative Request.
 */
export const createRequestConversation = async (requestDoc, creatorUser) => {
  const participants = [creatorUser._id];

  const conversation = await Conversation.create({
    organizationId: requestDoc.organizationId,
    contextType: 'request',
    contextId: requestDoc._id,
    participants,
    lastMessageAt: new Date(),
    lastMessageSnippet: `Request ${requestDoc.requestCode || ''} conversation initialized`
  });

  return conversation;
};

/**
 * Fetches a conversation by ID after verifying authorization.
 */
export const getConversationById = async (conversationId, user) => {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(404, 'Conversation not found');
  }

  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const accessCheck = await verifyConversationAccess(conversation, user);
  if (!accessCheck.authorized) {
    throw new ApiError(403, accessCheck.reason || 'Forbidden conversation access');
  }

  return conversation;
};

/**
 * Adds a message to a conversation after enforcing RBAC, tenant isolation, and isInternal rules.
 */
export const addMessageToConversation = async (conversationId, data, user) => {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, 'Valid Conversation ID is required');
  }

  const { content, isInternal = false, isSystem = false } = data || {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Message content cannot be empty');
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const accessCheck = await verifyConversationAccess(conversation, user);
  if (!accessCheck.authorized) {
    throw new ApiError(403, accessCheck.reason || 'Forbidden conversation access');
  }

  // SuperAdmin Read-Only Operational Ticket Write Guard
  if (conversation.contextType === 'ticket' && user.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access to operational tickets is read-only');
  }

  // Employee internal note guard
  if (user.role === 'employee' && isInternal) {
    throw new ApiError(403, 'Employees are not authorized to post internal staff notes');
  }

  // Determine sender display name
  let senderName = user.name;
  if (!senderName && user.role === 'super_admin') {
    senderName = 'SuperAdmin (Platform)';
  } else if (!senderName && user.employeeRef) {
    const emp = await Employee.findById(user.employeeRef).select('firstName lastName').lean();
    if (emp && (emp.firstName || emp.lastName)) {
      senderName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    }
  }
  if (!senderName && user.email) {
    senderName = user.email.split('@')[0];
  }

  const message = await Message.create({
    conversationId: conversation._id,
    organizationId: conversation.organizationId,
    senderId: user._id,
    senderName: senderName || 'User',
    senderRole: user.role,
    content: content.trim(),
    isInternal: Boolean(isInternal),
    isSystem: Boolean(isSystem),
    readBy: [{ userId: user._id, readAt: new Date() }]
  });

  // Update conversation metadata snippet
  const snippetPrefix = isInternal ? '[Internal Note] ' : '';
  conversation.lastMessageAt = new Date();
  conversation.lastMessageSnippet = `${snippetPrefix}${content.trim()}`.slice(0, 120);

  // Maintain participants array for explicit ticket/request conversations
  if (conversation.contextType !== 'organization') {
    const userIdStr = String(user._id);
    const hasParticipant = conversation.participants.some((p) => String(p) === userIdStr);
    if (!hasParticipant) {
      conversation.participants.push(user._id);
    }
  }

  await conversation.save();

  return message;
};

/**
 * Retrieves message stream for a conversation with server-side isInternal filtering.
 */
export const getConversationMessages = async (conversationId, user) => {
  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(404, 'Conversation not found');
  }

  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }

  const accessCheck = await verifyConversationAccess(conversation, user);
  if (!accessCheck.authorized) {
    throw new ApiError(403, accessCheck.reason || 'Forbidden conversation access');
  }

  const rawMessages = await Message.find({
    conversationId: conversation._id,
    organizationId: conversation.organizationId
  })
    .sort({ createdAt: 1 })
    .lean();

  return sanitizeMessagesForUser(rawMessages, user);
};

export default {
  verifyConversationAccess,
  sanitizeMessagesForUser,
  getOrCreateOrganizationConversation,
  createTicketConversation,
  createRequestConversation,
  getConversationById,
  addMessageToConversation,
  getConversationMessages
};
