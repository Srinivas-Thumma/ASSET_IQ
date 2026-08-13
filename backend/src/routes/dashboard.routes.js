import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  getExceptionQueue,
  getExceptionCounts,
  getPendingApprovals,
  getStats,
  getActivity
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getStats);
router.get('/metrics', getStats);
router.get('/activity', getActivity);
router.get('/pending-approvals', requireRole(['org_admin', 'super_admin']), getPendingApprovals);
router.get('/exception-queue', requireRole(['org_admin', 'super_admin']), getExceptionQueue);
router.get('/exceptions', requireRole(['org_admin', 'super_admin']), getExceptionQueue);
// Allow authenticated users to fetch counts (returns zeros for non-admins)
router.get('/exception-counts', getExceptionCounts);

export default router;
