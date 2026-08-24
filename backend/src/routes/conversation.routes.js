import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { addMessageSchema } from '../validators/ticket.validator.js';
import {
  getConversationById,
  getOrCreateOrganizationConversation,
  getConversationMessages,
  sendMessage,
  markConversationAsRead
} from '../controllers/conversation.controller.js';

const router = Router();

// Protect all conversation routes with authentication
router.use(authenticate);

// Organization Channel Lazy Lookup / Creation
router.get('/organization', getOrCreateOrganizationConversation);

// Conversation Detail & Message Operations
router.get('/:id', getConversationById);
router.get('/:id/messages', getConversationMessages);
router.post('/:id/messages', validate(addMessageSchema), sendMessage);
router.post('/:id/read', markConversationAsRead);

export default router;
