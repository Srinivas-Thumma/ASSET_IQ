import TicketMessage from '../models/TicketMessage.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import { emitToTicket } from '../config/socket.js';
import { createNotification } from './notification.service.js';
import { logAudit } from './audit.service.js';

export const createMessage = async (ticketIdOrData, dataOrUser, userOrNone) => {
  let ticketId;
  let data;
  let user;

  if (typeof ticketIdOrData === 'string' || (ticketIdOrData && ticketIdOrData._bsontype === 'ObjectID')) {
    ticketId = String(ticketIdOrData);
    data = { ...dataOrUser, ticketId };
    user = userOrNone;
  } else {
    data = ticketIdOrData || {};
    ticketId = data.ticketId;
    user = dataOrUser;
  }

  if (!ticketId) {
    throw new ApiError(400, 'Ticket ID is required');
  }

  // Verify ticket exists and enforce tenant isolation
  const ticketQuery = user.role === 'super_admin'
    ? { _id: data.ticketId }
    : { _id: data.ticketId, organizationId: user.organizationId };

  const ticket = await Ticket.findOne(ticketQuery);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // SuperAdmin is read-only for operational tickets, but has full conversation access for admin_support
  if (user?.role === 'super_admin') {
    if (ticket.type !== 'admin_support') {
      throw new ApiError(403, 'SuperAdmin access is read-only. Operational message creation is not permitted.');
    }
  }

  // Employees cannot access platform support or post internal notes
  if (user.role === 'employee') {
    if (ticket.type === 'admin_support') {
      throw new ApiError(403, 'Employees are not authorized to participate in platform support requests');
    }
    if (data.isInternal) {
      throw new ApiError(403, 'You cannot post internal notes');
    }
    const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(user._id);
    if (!isRaisedByMe) {
      throw new ApiError(403, 'You are not authorized to post messages to this ticket');
    }
  }

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

  const message = await TicketMessage.create({
    ticketId: data.ticketId,
    message: data.message,
    isInternal: Boolean(data.isInternal),
    senderId: user._id,
    senderName: senderName || 'User',
    senderRole: user.role,
    organizationId: ticket.organizationId
  });

  // Real-time broadcast to ticket room
  emitToTicket(data.ticketId, 'new-message', message);

  // Notification routing for chat replies
  if (!data.isInternal) {
    const raiserId = String(ticket.raisedBy?._id || ticket.raisedBy || '');
    const senderId = String(user._id || '');

    if (ticket.type === 'admin_support') {
      if (user.role === 'super_admin') {
        if (raiserId && raiserId !== senderId) {
          await createNotification({
            userId: raiserId,
            organizationId: ticket.organizationId,
            type: 'admin_support_reply',
            title: 'Platform Support Reply',
            message: `SuperAdmin replied to support request "${ticket.title}".`,
            relatedId: ticket._id,
            relatedType: 'ticket'
          });
        }
      } else {
        const superAdmins = await User.find({ role: 'super_admin', status: 'active' }).select('_id').lean();
        for (const sa of superAdmins) {
          if (String(sa._id) !== senderId) {
            await createNotification({
              userId: sa._id,
              organizationId: ticket.organizationId,
              type: 'admin_support_reply',
              title: 'Platform Support Reply',
              message: `${senderName} replied to platform support request "${ticket.title}".`,
              relatedId: ticket._id,
              relatedType: 'ticket'
            });
          }
        }
      }
    } else {
      // Standard operational tickets (repair, request, return, support)
      if (senderId !== raiserId && raiserId) {
        // Non-raiser (Asset Manager / Admin) replied -> Notify original ticket raiser (Employee)
        await createNotification({
          userId: raiserId,
          organizationId: ticket.organizationId,
          type: 'ticket_created',
          title: 'New Reply on Ticket',
          message: `${senderName} replied to your ticket "${ticket.title}".`,
          relatedId: ticket._id,
          relatedType: 'ticket'
        });
      } else if (senderId === raiserId) {
        // Raiser (Employee) replied -> Notify assigned handler or asset managers
        const handlerId = String(ticket.handler?._id || ticket.handler || '');
        if (handlerId && handlerId !== senderId) {
          await createNotification({
            userId: handlerId,
            organizationId: ticket.organizationId,
            type: 'ticket_created',
            title: 'New Reply from Employee',
            message: `${senderName} replied to ticket "${ticket.title}".`,
            relatedId: ticket._id,
            relatedType: 'ticket'
          });
        } else {
          const managers = await User.find({
            organizationId: ticket.organizationId,
            role: 'asset_manager',
            status: 'active',
            _id: { $ne: user._id }
          }).select('_id').lean();

          for (const mgr of managers) {
            await createNotification({
              userId: mgr._id,
              organizationId: ticket.organizationId,
              type: 'ticket_created',
              title: 'New Reply on Ticket',
              message: `${senderName} replied to ticket "${ticket.title}".`,
              relatedId: ticket._id,
              relatedType: 'ticket'
            });
          }
        }
      }
    }
  }

  // Audit logging
  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'ticket_message_created',
    targetType: 'ticket',
    targetId: ticket._id,
    metadata: { ticketType: ticket.type, senderRole: user.role, isInternal: Boolean(data.isInternal) },
    organizationId: ticket.organizationId
  });

  return message;
};

export const getMessages = async (ticketId, user) => {
  // Verify ticket access
  const ticketQuery = user.role === 'super_admin'
    ? { _id: ticketId }
    : { _id: ticketId, organizationId: user.organizationId };

  const ticket = await Ticket.findOne(ticketQuery);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Employees can only read messages on operational tickets they raised
  if (user.role === 'employee') {
    if (ticket.type === 'admin_support') {
      throw new ApiError(403, 'Employees are not authorized to view platform support tickets');
    }
    const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(user._id);
    if (!isRaisedByMe) {
      throw new ApiError(403, 'You are not authorized to view messages for this ticket');
    }
  }

  const query = { ticketId, organizationId: ticket.organizationId };

  // Employees only see public messages
  if (user.role === 'employee') {
    query.isInternal = false;
  }

  return await TicketMessage.find(query).sort({ createdAt: 1 });
};

export const addMessage = createMessage;
export const getTicketMessages = getMessages;

export default {
  createMessage,
  getMessages,
  addMessage,
  getTicketMessages
};
