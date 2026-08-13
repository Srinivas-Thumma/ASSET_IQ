import { Router } from 'express';
import authRoutes from './auth.routes.js';
import assetRoutes from './asset.routes.js';
import assignmentRoutes from './assignment.routes.js';
import ticketRoutes from './ticket.routes.js';
import messageRoutes from './message.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';
import catalogRoutes from './catalog.routes.js';
import personnelRoutes from './personnel.routes.js';

import { getMyAssets } from '../controllers/asset.controller.js';
import { getTickets } from '../controllers/ticket.controller.js';
import { getInspectionQueue } from '../controllers/assignment.controller.js';
import { getMyOrganization } from '../controllers/personnel.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const apiRouter = Router();

// Phase 1 Auth
apiRouter.use('/auth', authRoutes);

// Phase 2 Modules
apiRouter.use('/assets', assetRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/tickets/:id/messages', messageRoutes);
apiRouter.use('/tickets/:ticketId/messages', messageRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/personnel', personnelRoutes);

// Catalog endpoints (categories, departments, locations, vendors, employees)
apiRouter.use('/', catalogRoutes);

// Current Organization Profile & Routing settings
apiRouter.get('/organizations/me', authenticate, getMyOrganization);

// Top-level aliases specified in blueprint
apiRouter.get('/my-assets', authenticate, getMyAssets);
apiRouter.get('/my-tickets', authenticate, getTickets);
apiRouter.get('/inspections', authenticate, getInspectionQueue);

export default apiRouter;
