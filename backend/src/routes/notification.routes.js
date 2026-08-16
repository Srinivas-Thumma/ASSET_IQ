import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  runWarrantyNotificationCheck
} from '../controllers/notification.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.post('/run-warranty-check', requireRole(['super_admin', 'org_admin', 'asset_manager']), runWarrantyNotificationCheck);

export default router;
