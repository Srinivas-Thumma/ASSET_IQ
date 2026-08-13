import TicketMessage from '../models/TicketMessage.js';
import ApiError from '../utils/ApiError.js';
import { emitToTicket } from '../config/socket.js';

export const createMessage = async (data, user) => {
  if (user.role === 'employee' && data.isInternal) {
    throw new ApiError(403, 'You cannot post internal notes');
  }

  const message = await TicketMessage.create({
    ...data,
    senderId: user._id,
    senderName: user.email || user.name,
    senderRole: user.role,
    organizationId: user.organizationId
  });

  // Real-time broadcast to ticket room
  emitToTicket(data.ticketId, 'new-message', message);

  return message;
};

export const getMessages = async (ticketId, user) => {
  const query = { ticketId, organizationId: user.organizationId };

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
