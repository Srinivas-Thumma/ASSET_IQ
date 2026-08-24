import mongoose from 'mongoose';
import AdministrativeRequest from '../models/AdministrativeRequest.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { validateRequestPayload } from '../validators/request.validator.js';
import { createRequestConversation } from './conversation.service.js';
import { logAudit } from './audit.service.js';
import { createNotification } from './notification.service.js';

/**
 * Creates a new AdministrativeRequest after strict RBAC checks & category payload validation.
 */
export const createRequest = async (data, user) => {
  if (user.role === 'employee') {
    throw new ApiError(403, 'Employees are not authorized to create administrative requests');
  }

  if (user.role === 'super_admin') {
    throw new ApiError(403, 'SuperAdmin access is read-only for tenant request creation');
  }

  if (user.role === 'asset_manager' && data.category !== 'procurement') {
    throw new ApiError(403, 'Asset Managers are only authorized to create procurement requests');
  }

  // Validate category-specific payload
  const validatedPayload = validateRequestPayload(data.category, data.payload);

  const org = await Organization.findById(user.organizationId).lean();
  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }

  // Generate unique request code: REQ-<hex timestamp>
  const requestCode = `REQ-${Date.now().toString(16).toUpperCase()}`;

  // 1. Instantiate linked Request Conversation
  const tempDoc = {
    organizationId: user.organizationId,
    requestCode,
    raisedBy: user._id
  };
  const conversation = await createRequestConversation(tempDoc, user);

  // 2. Create AdministrativeRequest document
  const request = await AdministrativeRequest.create({
    organizationId: user.organizationId,
    organizationName: org.name || '',
    requestCode,
    category: data.category,
    status: 'submitted',
    priority: data.priority || 'p3',
    raisedBy: user._id,
    conversationId: conversation._id,
    title: data.title,
    description: data.description,
    payload: validatedPayload
  });

  // Update conversation contextId to created request._id
  conversation.contextId = request._id;
  await conversation.save();

  // Audit Logging
  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'procurement_approved',
    targetType: 'ticket',
    targetId: request._id,
    metadata: { requestCode, category: request.category, priority: request.priority },
    organizationId: user.organizationId
  });

  // Notify SuperAdmins for platform governance categories
  if (['platform_support', 'plan_upgrade', 'quota_increase', 'billing'].includes(data.category)) {
    const superAdmins = await User.find({ role: 'super_admin', status: 'active' }).select('_id').lean();
    for (const sa of superAdmins) {
      await createNotification({
        userId: sa._id,
        organizationId: user.organizationId,
        type: 'admin_support_created',
        title: `New ${data.category.replace('_', ' ')} Request`,
        message: `Organization "${org.name}" submitted request "${request.title}".`,
        relatedId: request._id,
        relatedType: 'request'
      });
    }
  }

  return request;
};

/**
 * Retrieves administrative requests with tenant isolation & role filtering.
 */
export const getRequests = async (organizationId, filters = {}, user = null) => {
  const { category, status, priority, search, page, limit } = filters;

  let baseQuery = {};

  if (user && user.role === 'super_admin') {
    baseQuery = organizationId ? { organizationId } : {};
  } else {
    const targetOrgId = user?.organizationId || organizationId;
    if (!targetOrgId) {
      throw new ApiError(400, 'Organization ID is required');
    }
    baseQuery = { organizationId: targetOrgId };

    if (user && user.role === 'employee') {
      throw new ApiError(403, 'Employees are not authorized to view administrative requests');
    }

    if (user && user.role === 'asset_manager') {
      baseQuery.category = 'procurement';
    }
  }

  if (category && (!user || user.role !== 'asset_manager' || category === 'procurement')) {
    baseQuery.category = category;
  }

  if (status) baseQuery.status = status;
  if (priority) baseQuery.priority = priority;

  if (search && typeof search === 'string' && search.trim()) {
    baseQuery.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { requestCode: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      AdministrativeRequest.find(baseQuery)
        .populate('raisedBy', 'email name role')
        .populate('assignedSuperAdmin', 'email name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdministrativeRequest.countDocuments(baseQuery)
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  return await AdministrativeRequest.find(baseQuery)
    .populate('raisedBy', 'email name role')
    .populate('assignedSuperAdmin', 'email name')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Retrieves a specific administrative request by ID with tenant & RBAC verification.
 */
export const getRequestById = async (requestId, user) => {
  if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(404, 'Administrative request not found');
  }

  if (user.role === 'employee') {
    throw new ApiError(403, 'Employees are not authorized to view administrative requests');
  }

  const query = user.role === 'super_admin'
    ? { _id: requestId }
    : { _id: requestId, organizationId: user.organizationId };

  const request = await AdministrativeRequest.findOne(query)
    .populate('raisedBy', 'email name role')
    .populate('assignedSuperAdmin', 'email name')
    .populate('decidedBy', 'email name')
    .lean();

  if (!request) {
    throw new ApiError(404, 'Administrative request not found');
  }

  if (user.role === 'asset_manager' && request.category !== 'procurement') {
    throw new ApiError(403, 'Asset Managers are only authorized to view procurement requests');
  }

  return request;
};

/**
 * Updates status and decision notes for an Administrative Request.
 */
export const updateRequestStatus = async (requestId, data, user) => {
  if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
    throw new ApiError(404, 'Administrative request not found');
  }

  const { status, decisionNotes } = data || {};
  if (!status || !['submitted', 'under_review', 'approved', 'rejected', 'completed'].includes(status)) {
    throw new ApiError(400, 'Invalid request status transition');
  }

  const query = user.role === 'super_admin'
    ? { _id: requestId }
    : { _id: requestId, organizationId: user.organizationId };

  const request = await AdministrativeRequest.findOne(query);
  if (!request) {
    throw new ApiError(404, 'Administrative request not found');
  }

  // State Machine Validation Rules
  const allowedTransitions = {
    submitted: ['under_review', 'approved', 'rejected'],
    under_review: ['approved', 'rejected'],
    approved: ['completed'],
    rejected: ['completed'],
    completed: []
  };

  if (request.status !== status) {
    const allowed = allowedTransitions[request.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Invalid status transition from '${request.status}' to '${status}'`);
    }
  }

  // Permission Guard: Only SuperAdmin or Org Admin can approve/reject
  if (['approved', 'rejected', 'completed'].includes(status)) {
    if (user.role === 'employee') {
      throw new ApiError(403, 'Employees cannot approve or reject requests');
    }
    if (user.role === 'asset_manager') {
      throw new ApiError(403, 'Asset Managers cannot authorize administrative requests');
    }
    // Org Admin can only approve internal procurement requests
    if (user.role === 'org_admin' && request.category !== 'procurement') {
      throw new ApiError(403, 'Org Admins can only authorize internal procurement requests; platform requests require SuperAdmin approval');
    }
  }

  const previousStatus = request.status;
  request.status = status;
  if (decisionNotes) {
    request.decisionNotes = decisionNotes;
  }

  if (['approved', 'rejected', 'completed'].includes(status)) {
    request.decidedAt = new Date();
    request.decidedBy = user._id;
  }

  if (user.role === 'super_admin' && !request.assignedSuperAdmin) {
    request.assignedSuperAdmin = user._id;
  }

  await request.save();

  // Audit Logging
  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'procurement_approved',
    targetType: 'ticket',
    targetId: request._id,
    metadata: { from: previousStatus, to: status, decisionNotes },
    organizationId: request.organizationId
  });

  // Notify Requester
  if (request.raisedBy && String(request.raisedBy) !== String(user._id)) {
    await createNotification({
      userId: request.raisedBy,
      organizationId: request.organizationId,
      type: 'admin_support_status',
      title: `Request ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your request "${request.title}" status changed to ${status}.`,
      relatedId: request._id,
      relatedType: 'request'
    });
  }

  return request;
};

export default {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus
};
