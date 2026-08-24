import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRequestSchema, updateRequestStatusSchema } from '../validators/request.validator.js';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  approveRequest,
  rejectRequest,
  completeRequest
} from '../controllers/request.controller.js';

const router = Router();

// Protect all request routes with authentication
router.use(authenticate);

// Request Operations (Employees strictly forbidden)
router.post(
  '/',
  requireRole(['asset_manager', 'org_admin']),
  validate(createRequestSchema),
  createRequest
);

router.get(
  '/',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  getRequests
);

router.get(
  '/:id',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  getRequestById
);

router.patch(
  '/:id/status',
  requireRole(['org_admin', 'super_admin']),
  validate(updateRequestStatusSchema),
  updateRequestStatus
);

router.post(
  '/:id/approve',
  requireRole(['org_admin', 'super_admin']),
  approveRequest
);

router.post(
  '/:id/reject',
  requireRole(['org_admin', 'super_admin']),
  rejectRequest
);

router.post(
  '/:id/complete',
  requireRole(['org_admin', 'super_admin']),
  completeRequest
);

export default router;
