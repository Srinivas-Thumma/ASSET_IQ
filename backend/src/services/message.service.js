import TicketMessage from '../models/TicketMessage.js';
import Ticket from '../models/Ticket.js';
import ApiError from '../utils/ApiError.js';
import { emitToTicket } from '../config/socket.js';

export const createMessage = async (data, user) => {
  if (user.role === 'employee' && data.isInternal) {
    throw new ApiError(403, 'You cannot post internal notes');
  }

  // Verify ticket exists and belongs to this organization
  const ticketQuery = user.role === 'super_admin'
    ? { _id: data.ticketId }
    : { _id: data.ticketId, organizationId: user.organizationId };

  const ticket = await Ticket.findOne(ticketQuery);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  // Employees can only message on tickets they raised
  if (user.role === 'employee') {
    const isRaisedByMe = String(ticket.raisedBy?._id || ticket.raisedBy) === String(user._id);
    if (!isRaisedByMe) {
      throw new ApiError(403, 'You are not authorized to post messages to this ticket');
    }
  }

  const message = await TicketMessage.create({
    ticketId: data.ticketId,
    message: data.message,
    isInternal: Boolean(data.isInternal),
    senderId: user._id,
    senderName: user.email || user.name || 'User',
    senderRole: user.role,
    organizationId: ticket.organizationId
  });

  // Real-time broadcast to ticket room
  emitToTicket(data.ticketId, 'new-message', message);

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

  // Employees can only read messages on tickets they raised
  if (user.role === 'employee') {
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
