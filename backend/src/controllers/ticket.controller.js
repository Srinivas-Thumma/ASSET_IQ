import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ticketService from '../services/ticket.service.js';
import Ticket from '../models/Ticket.js';

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user);
  res.status(201).json(new ApiResponse(201, ticket, 'Ticket created successfully'));
});

export const getTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.getTickets(req.user.organizationId, req.user);
  res.status(200).json(new ApiResponse(200, tickets, 'Tickets retrieved successfully'));
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(
    req.params.id,
    req.user.organizationId,
    req.user
  );
  res.status(200).json(new ApiResponse(200, ticket, 'Ticket details retrieved successfully'));
});

export const claimTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.claimTicket(
    req.params.id,
    req.body.priority,
    req.user
  );
  res.status(200).json(new ApiResponse(200, ticket, 'Ticket claimed successfully'));
});

export const resolveTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.resolveTicket(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json(new ApiResponse(200, ticket, 'Ticket resolved successfully'));
});

export const escalateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.escalateTicket(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, ticket, 'Ticket escalated successfully'));
});

export default {
  createTicket,
  getTickets,
  getTicketById,
  claimTicket,
  resolveTicket,
  escalateTicket
};
