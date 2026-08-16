import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAssignmentSchema,
  inspectSchema,
  returnSchema
} from '../validators/assignment.validator.js';
import {
  createAssignment,
  inspectAssignment,
  initiateReturn,
  getInspectionQueue
} from '../controllers/assignment.controller.js';

const router = Router();

router.use(authenticate);

// Inspection queue — restricted to asset managers and admins
router.get(
  '/inspections',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  getInspectionQueue
);

// Create assignment
router.post(
  '/',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(createAssignmentSchema),
  createAssignment
);

// Inspect assignment
router.post(
  '/:id/inspect',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(inspectSchema),
  inspectAssignment
);

// Return flow
router.post(
  '/:id/return',
  requireRole(['employee', 'asset_manager', 'org_admin', 'super_admin']),
  validate(returnSchema),
  initiateReturn
);

export default router;
