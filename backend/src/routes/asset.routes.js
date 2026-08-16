import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createAssetSchema,
  updateStatusSchema
} from '../validators/asset.validator.js';
import { returnSchema } from '../validators/assignment.validator.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  getAssetHistory,
  getAssetQrCode,
  updateAssetStatus,
  requestRetirement,
  approveRetirement,
  getMyAssets,
  analyzeAsset,
  getWarranties,
  getWarrantyStats,
  renewWarranty
} from '../controllers/asset.controller.js';
import { initiateReturn } from '../controllers/assignment.controller.js';

const router = Router();

router.use(authenticate);

// Employee assigned assets
router.get('/my', getMyAssets);

// Warranty Coverage Hub endpoints (Must be before /:id)
router.get('/warranties/stats', getWarrantyStats);
router.get('/warranties', getWarranties);

// Asset AI Health diagnosis (Ollama LLM)
router.post(
  '/:id/analyze',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  aiLimiter,
  analyzeAsset
);

// Asset history & QR
router.get('/:id/history', getAssetHistory);
router.get('/:id/qr', getAssetQrCode);

// Warranty renewal
router.post(
  '/:id/warranty/renew',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  renewWarranty
);

// Asset CRUD & Lifecycle
router.post(
  '/',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(createAssetSchema),
  createAsset
);

router.get(
  '/',
  getAssets
);

router.get('/:id', getAssetById);

router.put(
  '/:id',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  updateAsset
);

router.patch(
  '/:id/status',
  requireRole(['asset_manager', 'org_admin', 'super_admin']),
  validate(updateStatusSchema),
  updateAssetStatus
);

router.post(
  '/:id/request-retirement',
  requireRole(['asset_manager', 'super_admin']),
  requestRetirement
);

router.patch(
  '/:id/retire',
  requireRole(['org_admin', 'super_admin']),
  approveRetirement
);

// Asset return initiation
router.post(
  '/:id/return',
  requireRole(['employee', 'asset_manager', 'org_admin', 'super_admin']),
  validate(returnSchema),
  initiateReturn
);

export default router;
