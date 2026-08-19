import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import TicketMessage from '../models/TicketMessage.js';
import Asset from '../models/Asset.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';
import { createNotification } from './notification.service.js';
import { emitToTicket } from '../config/socket.js';

const populateEmployee = {
  path: 'employeeRef',
  select: 'firstName lastName jobTitle email departmentId'
};

export const createTicket = async (data, user) => {
  if (user?.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access is read-only. Creating operational tickets is not permitted.');
  }

  const org = await Organization.findById(user.organizationId).lean();

  const ticket = await Ticket.create({
    ...data,
    raisedBy: user._id,
    status: 'open',
    organizationId: user.organizationId,
    organizationName: org?.name || ''
  });

  // Auto-route if issueType matches org settings
  if (org?.settings?.autoRouteCategories) {
    const autoHandler = org.settings.autoRouteCategories[data.issueType];
    if (autoHandler) {
      ticket.handler = autoHandler;
      ticket.status = 'claimed';
      await ticket.save();
    }
  }

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ticket_created',
    targetType: 'ticket',
    targetId: ticket._id,
    metadata: { title: ticket.title, type: ticket.type, priority: ticket.priority },
    organizationId: user.organizationId
  });

  return ticket;
};

export const getTickets = async (organizationId, userOrFilters = {}, filtersOrUser = {}) => {
  let user = null;
  let filters = {};

  if (userOrFilters && typeof userOrFilters === 'object' && userOrFilters.role !== undefined) {
    user = userOrFilters;
    filters = filtersOrUser || {};
  } else if (filtersOrUser && typeof filtersOrUser === 'object' && filtersOrUser.role !== undefined) {
    user = filtersOrUser;
    filters = userOrFilters || {};
  } else {
    filters = userOrFilters || {};
    user = filtersOrUser || null;
  }

  const { status, type, priority, handler, raisedBy, assetId, isEscalated, page, limit, search } = filters;

  const baseQuery = (user && user.role === 'super_admin')
    ? (organizationId ? { organizationId } : {})
    : { organizationId: organizationId || user?.organizationId };

  if (status) baseQuery.status = status;
  if (type) baseQuery.type = type;
  if (priority) baseQuery.priority = priority;
  if (handler) baseQuery.handler = handler;
  if (raisedBy) baseQuery.raisedBy = raisedBy;
  if (assetId) baseQuery.assetId = assetId;
  if (isEscalated !== undefined) baseQuery.isEscalated = isEscalated === 'true' || isEscalated === true;

  // Search by title or description
  if (search && typeof search === 'string' && search.trim()) {
    baseQuery.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Ticket.find(baseQuery)
        .populate('assetId', 'name assetCode status')
        .populate({ path: 'raisedBy', select: 'email role employeeRef', populate: populateEmployee })
        .populate({ path: 'handler', select: 'email role employeeRef', populate: populateEmployee })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(baseQuery)
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  return await Ticket.find(baseQuery)
    .populate('assetId', 'name assetCode status')
    .populate({ path: 'raisedBy', select: 'email role employeeRef', populate: populateEmployee })
    .populate({ path: 'handler', select: 'email role employeeRef', populate: populateEmployee })
    .sort({ createdAt: -1 })
    .lean();
};

export const getTicketById = async (ticketId, organizationId, user = null) => {
  if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(404, 'Ticket not found');
  }

  const query = (user && user.role === 'super_admin')
    ? { _id: ticketId }
    : { _id: ticketId, organizationId: (user?.organizationId || organizationId) };

  const ticket = await Ticket.findOne(query)
    .populate('organizationId', 'name slug')
    .populate('assetId', 'name assetCode status')
    .populate({ path: 'raisedBy', select: 'email role employeeRef', populate: populateEmployee })
    .populate({ path: 'handler', select: 'email role employeeRef', populate: populateEmployee })
    .populate('categoryId', 'name')
    .lean();

  if (!ticket) throw new ApiError(404, 'Ticket not found');

  // Security check: If employee, verify ticket was raised by this employee
  if (user && user.role === 'employee') {
    const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(user._id);
    if (!isRaisedByMe) {
      throw new ApiError(403, 'You are not authorized to view this ticket');
    }
  }

  // Fetch all ticket messages within the tenant
  const orgId = ticket.organizationId?._id || ticket.organizationId;
  const msgQuery = { ticketId, organizationId: orgId };
  if (user?.role === 'employee') {
    msgQuery.isInternal = false;
  }

  const messages = await TicketMessage.find(msgQuery).sort({ createdAt: 1 }).lean();
  ticket.messages = messages || [];

  return ticket;
};

export const claimTicket = async (ticketId, priority, user) => {
  if (user?.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access is read-only. Claiming operational tickets is not permitted.');
  }

  const ticket = await Ticket.findOne({ _id: ticketId, organizationId: user.organizationId });
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  ticket.handler = user._id;
  if (priority) {
    ticket.priority = priority;
  }
  ticket.status = 'claimed';
  await ticket.save();

  let managerName = 'Asset Manager';
  if (user.employeeRef) {
    const emp = await Employee.findById(user.employeeRef).select('firstName lastName').lean();
    if (emp && (emp.firstName || emp.lastName)) {
      managerName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
    }
  } else if (user.name) {
    managerName = user.name;
  } else if (user.email) {
    managerName = user.email.split('@')[0];
  }

  const roleLabel = user.role === 'asset_manager' ? 'Asset Manager' : (user.role === 'org_admin' ? 'Org Admin' : 'Staff');

  // Create auto system message
  const sysMsg = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderName: 'System Intelligence',
    senderRole: 'system',
    message: `Ticket claimed by ${managerName} (${roleLabel})`,
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
    metadata: { priority: ticket.priority, handlerName: managerName },
    organizationId: user.organizationId
  });

  return ticket;
};

export const resolveTicket = async (ticketId, data, user) => {
  if (user?.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access is read-only. Resolving operational tickets is not permitted.');
  }

  const ticket = await Ticket.findOne({ _id: ticketId, organizationId: user.organizationId });
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
  if (user?.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access is read-only. Escalating operational tickets is not permitted.');
  }

  const ticket = await Ticket.findOne({ _id: ticketId, organizationId: user.organizationId });
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

export const updateTicketStatus = async (ticketId, data, user) => {
  if (user?.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access is read-only. Updating ticket status is not permitted.');
  }

  const ticket = await Ticket.findOne({ _id: ticketId, organizationId: user.organizationId });
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  const { status, resolutionNotes, priority, assetStateChange } = data || {};
  const previousStatus = ticket.status;

  if (status) {
    ticket.status = status;
  }
  if (priority) {
    ticket.priority = priority;
  }
  if (resolutionNotes) {
    ticket.resolutionNotes = resolutionNotes;
  }

  if (status === 'resolved' || status === 'closed') {
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = user._id;
  }
  if (!ticket.handler && ['claimed', 'in_progress'].includes(status)) {
    ticket.handler = user._id;
  }

  let statusChangeSummary = '';
  if (assetStateChange && ticket.assetId) {
    const targetStatus = typeof assetStateChange === 'object' ? assetStateChange.to : assetStateChange;
    if (targetStatus) {
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
          metadata: { from: oldStatus, to: targetStatus, reason: `Ticket status update to ${status}` },
          organizationId: ticket.organizationId
        });
      }
    }
  }

  await ticket.save();

  // Create auto system message
  const statusLabel = status || 'Updated';
  const sysMsg = await TicketMessage.create({
    ticketId: ticket._id,
    senderId: user._id,
    senderName: 'System Intelligence',
    senderRole: 'system',
    message: `Ticket status updated to ${statusLabel}: ${resolutionNotes || 'Status updated by administrator'}${statusChangeSummary}`,
    isInternal: false,
    isSystemMessage: true,
    organizationId: ticket.organizationId
  });

  emitToTicket(ticket._id, 'new-message', sysMsg);

  // Notify employee if resolved or closed
  if (['resolved', 'closed'].includes(status) && ticket.raisedBy && ticket.raisedBy.toString() !== user._id.toString()) {
    await createNotification({
      userId: ticket.raisedBy,
      organizationId: ticket.organizationId,
      type: status === 'resolved' ? 'ticket_resolved' : 'ticket_claimed',
      title: `Ticket ${status === 'resolved' ? 'Resolved' : 'Updated'}`,
      message: `Your ticket "${ticket.title}" status changed to ${status}: ${resolutionNotes || 'Status updated'}`,
      relatedId: ticket._id,
      relatedType: 'ticket'
    });
  }

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: status === 'resolved' ? 'ticket_resolved' : 'ticket_claimed',
    targetType: 'ticket',
    targetId: ticket._id,
    metadata: { from: previousStatus, to: ticket.status, resolutionNotes, priority },
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
  updateTicketStatus,
  escalateTicket
};
