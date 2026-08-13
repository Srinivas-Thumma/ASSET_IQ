import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import messageService from '../services/message.service.js';

export const createMessage = asyncHandler(async (req, res) => {
  const ticketId = req.params.id || req.params.ticketId;
  const message = await messageService.createMessage(
    { ...req.body, ticketId },
    req.user
  );
  res.status(201).json(new ApiResponse(201, message, 'Message created successfully'));
});

export const getMessages = asyncHandler(async (req, res) => {
  const ticketId = req.params.id || req.params.ticketId;
  const messages = await messageService.getMessages(ticketId, req.user);
  res.status(200).json(new ApiResponse(200, messages, 'Messages retrieved successfully'));
});

export default {
  createMessage,
  getMessages
};
