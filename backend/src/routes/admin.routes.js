import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
  bulkUpdateStatus,
  bulkUpdatePlan,
  bulkDelete,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSuperAdminAnalytics,
  searchGlobal,
  getAdminAlerts,
  getGlobalActivityFeed
} from '../controllers/admin.controller.js';

const router = Router();

// Protect all admin routes for super_admin
router.use(authenticate);
router.use(requireRole(['super_admin']));

// Global Search, Alerts & Activity
router.get('/search', searchGlobal);
router.get('/alerts', getAdminAlerts);
router.get('/activity', getGlobalActivityFeed);

// Organizations
router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganizationById);
router.post('/organizations', createOrganization);
router.put('/organizations/:id', updateOrganization);
router.patch('/organizations/:id/status', updateOrganizationStatus);
router.delete('/organizations/:id', deleteOrganization);

// Bulk Operations
router.post('/organizations/bulk-status', bulkUpdateStatus);
router.post('/organizations/bulk-plan', bulkUpdatePlan);
router.post('/organizations/bulk-delete', bulkDelete);

// Plans
router.get('/plans', getPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// Analytics
router.get('/analytics', getSuperAdminAnalytics);

export default router;
