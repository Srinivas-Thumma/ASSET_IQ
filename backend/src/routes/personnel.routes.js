import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPersonnelSchema,
  updatePersonnelSchema
} from '../validators/personnel.validator.js';
import {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel
} from '../controllers/personnel.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(['org_admin', 'super_admin']));

router.get('/', getPersonnel);
router.post('/', validate(createPersonnelSchema), createPersonnel);
router.get('/:id', getPersonnelById);
router.put('/:id', validate(updatePersonnelSchema), updatePersonnel);
router.delete('/:id', deletePersonnel);

export default router;
