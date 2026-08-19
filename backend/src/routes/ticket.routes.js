import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTicketSchema,
  claimTicketSchema,
  resolveTicketSchema,
  updateTicketStatusSchema
} from '../validators/ticket.validator.js';
import {
  createTicket,
  getTickets,
  getTicketById,
  claimTicket,
  resolveTicket,
  updateTicketStatus,
  escalateTicket
} from '../controllers/ticket.controller.js';
import messageRoutes from './message.routes.js';

const router = Router();

router.use(authenticate);

// Nested message routes: /api/tickets/:id/messages
router.use('/:id/messages', messageRoutes);
router.use('/:ticketId/messages', messageRoutes);

// Employee convenience route
router.get('/my', getTickets);

// Ticket CRUD and Triage
router.post('/', requireRole(['employee', 'asset_manager', 'org_admin']), validate(createTicketSchema), createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);

router.patch(
  '/:id/claim',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(claimTicketSchema),
  claimTicket
);

router.patch(
  '/:id/resolve',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(resolveTicketSchema),
  resolveTicket
);

router.patch(
  '/:id/status',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(updateTicketStatusSchema),
  updateTicketStatus
);

router.post(
  '/:id/escalate',
  requireRole(['asset_manager', 'org_admin']),
  escalateTicket
);

export default router;
