import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { addMessageSchema } from '../validators/ticket.validator.js';
import {
  createMessage,
  getMessages
} from '../controllers/message.controller.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', validate(addMessageSchema), createMessage);
router.get('/', getMessages);

export default router;
