import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';
import { createNotification } from './notification.service.js';

export const createAssignment = async (data, user) => {
  // Check asset is in stock
  const asset = await Asset.findOne({ _id: data.assetId, organizationId: user.organizationId });
  if (!asset) throw new ApiError(404, 'Asset not found');
  if (asset.status !== 'stock') throw new ApiError(400, 'Asset must be in stock to assign');

  // Check asset not already assigned
  const existing = await Assignment.findOne({
    assetId: data.assetId,
    organizationId: user.organizationId,
    returnedAt: null
  });
  if (existing) throw new ApiError(400, 'Asset is already assigned to another employee');

  const assignment = await Assignment.create({
    ...data,
    assignedBy: user._id,
    assignedAt: new Date(),
    organizationId: user.organizationId
  });

  // Update asset status
  asset.status = 'assigned';
  await asset.save();

  // Notify assigned employee user account if found
  const targetUser = await User.findOne({
    employeeRef: data.employeeId,
    organizationId: user.organizationId
  });
  if (targetUser) {
    await createNotification({
      userId: targetUser._id,
      organizationId: user.organizationId,
      type: 'asset_assigned',
      title: 'Equipment Assigned',
      message: `You have been assigned ${asset.name} (${asset.assetCode}).`,
      relatedId: asset._id,
      relatedType: 'asset'
    });
  }

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'assignment_created',
    targetType: 'assignment',
    targetId: assignment._id,
    metadata: { assetId: data.assetId, employeeId: data.employeeId },
    organizationId: user.organizationId
  });

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'asset_state_change',
    targetType: 'asset',
    targetId: asset._id,
    metadata: { from: 'stock', to: 'assigned', reason: 'assigned to employee' },
    organizationId: user.organizationId
  });

  return assignment;
};

export const inspectAssignment = async (assignmentId, data, user) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, organizationId: user.organizationId });
  if (!assignment) throw new ApiError(404, 'Assignment not found');
  if (assignment.returnedAt) throw new ApiError(400, 'Assignment already returned');
  if (!assignment.returnInitiatedAt) throw new ApiError(400, 'Return not initiated for this assignment');

  const { inspectionResult, inspectionNotes } = data;
  assignment.inspectedAt = new Date();
  assignment.inspectedBy = user._id;
  assignment.inspectionResult = inspectionResult;
  assignment.inspectionNotes = inspectionNotes;
  assignment.returnedAt = new Date();
  await assignment.save();

  // Update asset status based on inspection
  const asset = await Asset.findOne({ _id: assignment.assetId, organizationId: user.organizationId });
  let targetStatus = 'stock';
  if (inspectionResult === 'fail_repair' || inspectionResult === 'fail_retire') {
    targetStatus = 'repair';
  }
  if (asset) {
    asset.status = targetStatus;
    await asset.save();
  }

  // Notify original employee
  const targetUser = await User.findOne({
    employeeRef: assignment.employeeId,
    organizationId: user.organizationId
  });
  if (targetUser) {
    await createNotification({
      userId: targetUser._id,
      organizationId: user.organizationId,
      type: 'inspection_completed',
      title: 'Equipment Inspection Complete',
      message: `Return inspection for your previously assigned device completed (Verdict: ${inspectionResult}).`,
      relatedId: assignment._id,
      relatedType: 'assignment'
    });
  }

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'inspection_completed',
    targetType: 'assignment',
    targetId: assignment._id,
    metadata: { inspectionResult, inspectionNotes },
    organizationId: user.organizationId
  });

  if (asset) {
    await logAudit({
      actorId: user._id,
      actorRole: user.role,
      action: 'asset_state_change',
      targetType: 'asset',
      targetId: asset._id,
      metadata: { from: 'assigned', to: targetStatus, reason: `inspection: ${inspectionResult}` },
      organizationId: user.organizationId
    });
  }

  return { assignment, asset };
};

export const initiateReturn = async (targetId, reason, user) => {
  // Support lookup by either assignment ID or asset ID
  let assignment = null;
  if (mongoose.Types.ObjectId.isValid(targetId)) {
    assignment = await Assignment.findOne({
      _id: targetId,
      returnedAt: null,
      organizationId: user.organizationId
    });
  }
  if (!assignment && mongoose.Types.ObjectId.isValid(targetId)) {
    assignment = await Assignment.findOne({
      assetId: targetId,
      returnedAt: null,
      organizationId: user.organizationId
    });
  }
  if (!assignment) throw new ApiError(404, 'No active assignment found for this equipment');

  // Verify employee owns this asset (if employee role)
  if (user.role === 'employee') {
    let employeeId = user.employeeRef;
    if (!employeeId && user.email) {
      const emp = await Employee.findOne({ email: user.email, organizationId: user.organizationId });
      if (emp) employeeId = emp._id;
    }
    if (!employeeId || assignment.employeeId.toString() !== employeeId.toString()) {
      throw new ApiError(403, 'This asset is not assigned to you');
    }
  }

  // Normalize reason into valid enum (offboarding, upgrade, defective)
  let cleanReason = 'upgrade';
  const reasonLower = (reason || '').toLowerCase().trim();
  if (['offboarding', 'upgrade', 'defective'].includes(reasonLower)) {
    cleanReason = reasonLower;
  } else if (reasonLower.includes('offboard')) {
    cleanReason = 'offboarding';
  } else if (reasonLower.includes('defect') || reasonLower.includes('broken') || reasonLower.includes('damage') || reasonLower.includes('flicker') || reasonLower.includes('issue')) {
    cleanReason = 'defective';
  }

  assignment.returnInitiatedAt = new Date();
  assignment.returnInitiatedBy = user._id;
  assignment.returnReason = cleanReason;
  await assignment.save();

  await logAudit({
    actorId: user._id,
    actorRole: user.role,
    action: 'return_initiated',
    targetType: 'assignment',
    targetId: assignment._id,
    metadata: { assetId: assignment.assetId, assignmentId: assignment._id, reason: cleanReason, rawReason: reason },
    organizationId: user.organizationId
  });

  return assignment;
};

export const getInspectionQueue = async (organizationId) => {
  const assignments = await Assignment.find({ organizationId, returnedAt: null, returnInitiatedAt: { $ne: null } })
    .populate('assetId', 'name assetCode status')
    .populate('employeeId', 'firstName lastName')
    .populate('returnInitiatedBy', 'email');

  // Normalize to flat shape expected by frontend
  return assignments.map((a) => {
    const obj = a.toObject();
    return {
      ...obj,
      assetName: obj.assetId?.name || 'Unknown Asset',
      assetCode: obj.assetId?.assetCode || '',
      assetStatus: obj.assetId?.status || '',
      employeeName: obj.employeeId
        ? `${obj.employeeId.firstName} ${obj.employeeId.lastName}`.trim()
        : 'Unknown Employee',
    };
  });
};

export const completeInspection = inspectAssignment;
export const getPendingInspections = getInspectionQueue;

export default {
  createAssignment,
  inspectAssignment,
  initiateReturn,
  getInspectionQueue,
  completeInspection,
  getPendingInspections
};
