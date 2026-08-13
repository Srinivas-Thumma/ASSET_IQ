import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import TicketMessage from '../models/TicketMessage.js';
import Asset from '../models/Asset.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';
import { createNotification } from './notification.service.js';
import { emitToTicket } from '../config/socket.js';

export const createTicket = async (data, user) => {
  const ticket = await Ticket.create({
    ...data,
    raisedBy: user._id,
    status: 'open',
    organizationId: user.organizationId
  });

  // Auto-route if issueType matches org settings
  const org = await Organization.findById(user.organizationId);
  if (data.issueType && org?.settings?.defaultTicketRouting?.[data.issueType]) {
    const routeTarget = org.settings.defaultTicketRouting[data.issueType];
    if (routeTarget && routeTarget !== 'asset_manager' && mongoose.Types.ObjectId.isValid(routeTarget)) {
      ticket.handler = routeTarget;
    }
  }
  await ticket.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ticket_created',
    targetType: 'ticket',
    targetId: ticket._id,
    metadata: { type: ticket.type, assetId: ticket.assetId },
    organizationId: user.organizationId
  });

  return ticket;
};

export const getTickets = async (organizationId, user) => {
  if (user.role === 'asset_manager') {
    // Return all tickets in the organization so manager sees Open Queue + Claimed + Resolved
    return await Ticket.find({ organizationId })
      .populate('assetId', 'name assetCode status')
      .populate('raisedBy', 'email name')
      .populate('handler', 'email name')
      .sort({ createdAt: -1 })
      .lean();
  }

  if (user.role === 'org_admin' || user.role === 'super_admin') {
    const query = organizationId ? { organizationId } : {};
    return await Ticket.find(query)
      .populate('assetId', 'name assetCode status')
      .populate('raisedBy', 'email name')
      .populate('handler', 'email name')
      .sort({ createdAt: -1 })
      .lean();
  }

  // Employee: all tickets raised by this employee
  return await Ticket.find({
    $or: [
      { raisedBy: user._id },
      { organizationId, raisedBy: user._id }
    ]
  })
    .populate('assetId', 'name assetCode status')
    .populate('raisedBy', 'email name')
    .populate('handler', 'email name')
    .sort({ createdAt: -1 })
    .lean();
};

export const getTicketById = async (ticketId, organizationId, user = null) => {
  if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(404, 'Ticket not found');
  }

  const ticket = await Ticket.findById(ticketId)
    .populate('assetId', 'name assetCode status')
    .populate('raisedBy', 'email name')
    .populate('handler', 'email name')
    .populate('categoryId', 'name')
    .lean();

  if (!ticket) throw new ApiError(404, 'Ticket not found');

  // Security check: If employee, verify organization or ownership
  if (user && user.role === 'employee') {
    const isSameOrg = String(ticket.organizationId) === String(organizationId);
    const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(user._id);
    if (!isSameOrg && !isRaisedByMe) {
      throw new ApiError(403, 'You are not authorized to view this ticket');
    }
  }

  // Fetch all ticket messages
  const msgQuery = { ticketId };
  if (user?.role === 'employee') {
    msgQuery.isInternal = false;
  }

  const messages = await TicketMessage.find(msgQuery).sort({ createdAt: 1 }).lean();
  ticket.messages = messages || [];

  return ticket;
};

export const claimTicket = async (ticketId, priority, user) => {
  const ticket = await Ticket.findOne({ _id: ticketId, organizationId: user.organizationId });
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (ticket.handler && ticket.handler.toString() !== user._id.toString()) {
    throw new ApiError(400, 'Ticket is already claimed by another manager');
  }

  ticket.handler = user._id;
  if (priority) {
    ticket.priority = priority;
  }
  ticket.status = 'claimed';
  await ticket.save();

  const managerName = user.email ? user.email.split('@')[0] : 'Asset Manager';

  // Create auto system message
  const sysMsg = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderName: 'System Intelligence',
    senderRole: 'system',
    message: `Ticket claimed by ${managerName}`,
    isInternal: false,
    isSystemMessage: true,
    organizationId: user.organizationId
  });

  emitToTicket(ticket._id, 'new-message', sysMsg);

  // Notify employee who raised the ticket
  if (ticket.raisedBy && ticket.raisedBy.toString() !== user._id.toString()) {
    await createNotification({
      userId: ticket.raisedBy,
      organizationId: user.organizationId,
      type: 'ticket_claimed',
      title: 'Ticket Claimed',
      message: `Your ticket "${ticket.title}" has been claimed by ${managerName}.`,
      relatedId: ticket._id,
      relatedType: 'ticket'
    });
  }

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ticket_claimed',
    targetType: 'ticket',
    targetId: ticket._id,
    metadata: { priority: ticket.priority },
    organizationId: user.organizationId
  });

  return ticket;
};

export const resolveTicket = async (ticketId, data, user) => {
  const query = user.role === 'super_admin' ? { _id: ticketId } : { _id: ticketId, organizationId: user.organizationId };
  const ticket = await Ticket.findOne(query);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  if (!ticket.handler) {
    ticket.handler = user._id;
  }

  const { resolutionNotes, assetStateChange } = data || {};
  ticket.resolutionNotes = resolutionNotes || 'Resolved by IT support';
  ticket.resolvedAt = new Date();
  ticket.resolvedBy = user._id;
  ticket.status = 'resolved';

  let statusChangeSummary = '';
  if (assetStateChange) {
    const targetStatus = typeof assetStateChange === 'object' ? assetStateChange.to : assetStateChange;
    if (targetStatus && ticket.assetId) {
      const asset = await Asset.findById(ticket.assetId);
      if (asset) {
        const oldStatus = asset.status;
        asset.status = targetStatus;
        await asset.save();
        statusChangeSummary = ` • Hardware status updated to '${targetStatus}'`;

        await logAudit({
          actorId: user._id,
          actorRole: user.role,
          action: 'asset_state_change',
          targetType: 'asset',
          targetId: asset._id,
          metadata: { from: oldStatus, to: targetStatus, reason: 'Ticket resolution' },
          organizationId: ticket.organizationId
        });
      }
    }
  }

  await ticket.save();

  // Create auto system message
  const sysMsg = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderName: 'System Intelligence',
    senderRole: 'system',
    message: `Ticket marked as Resolved: ${resolutionNotes || 'Issue fixed'}${statusChangeSummary}`,
    isInternal: false,
    isSystemMessage: true,
    organizationId: ticket.organizationId
  });

  emitToTicket(ticket._id, 'new-message', sysMsg);

  // Notify employee
  if (ticket.raisedBy && ticket.raisedBy.toString() !== user._id.toString()) {
    await createNotification({
      userId: ticket.raisedBy,
      organizationId: ticket.organizationId,
      type: 'ticket_resolved',
      title: 'Ticket Resolved',
      message: `Your ticket "${ticket.title}" has been marked as resolved: ${resolutionNotes || 'Issue fixed'}`,
      relatedId: ticket._id,
      relatedType: 'ticket'
    });
  }

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ticket_resolved',
    targetType: 'ticket',
    targetId: ticket._id,
    metadata: { resolutionNotes, assetStateChange },
    organizationId: ticket.organizationId
  });

  return ticket;
};

export const escalateTicket = async (ticketId, user) => {
  const query = user.role === 'super_admin' ? { _id: ticketId } : { _id: ticketId, organizationId: user.organizationId };
  const ticket = await Ticket.findOne(query);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  ticket.isEscalated = true;
  if (!ticket.priority || ticket.priority === 'p3' || ticket.priority === 'p4') {
    ticket.priority = 'p1';
  }
  await ticket.save();

  const sysMsg = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderName: 'System Intelligence',
    senderRole: 'system',
    message: `Ticket escalated to Senior Engineering / Vendor SLA Tier (Priority elevated to P1 Critical)`,
    isInternal: false,
    isSystemMessage: true,
    organizationId: ticket.organizationId
  });

  emitToTicket(ticket._id, 'new-message', sysMsg);

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ticket_escalated',
    targetType: 'ticket',
    targetId: ticket._id,
    organizationId: ticket.organizationId
  });

  return ticket;
};

export default {
  createTicket,
  getTickets,
  getTicketById,
  claimTicket,
  resolveTicket,
  escalateTicket
};
