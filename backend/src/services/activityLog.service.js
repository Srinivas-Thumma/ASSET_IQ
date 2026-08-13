import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const logActivity = async ({
  actorId,
  actorRole = 'system',
  action,
  targetType = 'asset',
  targetId,
  metadata = {},
  organizationId
}) => {
  try {
    return await AuditLog.create({
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      metadata,
      organizationId,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Failed to write activity audit log:', err.message);
    return null;
  }
};

export const getOrgActivityLogs = async (organizationId, limit = 20) => {
  const logs = await AuditLog.find({ organizationId })
    .populate('actorId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return logs.map((log) => {
    const actorName = log.actorId?.name || log.actorId?.email || 'System';
    return {
      id: log._id,
      actor: actorName,
      actorRole: log.actorRole,
      action: log.action.replace(/_/g, ' '),
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      createdAt: log.createdAt
    };
  });
};

export const getGlobalActivityLogs = async (limit = 30) => {
  const logs = await AuditLog.find({})
    .populate('actorId', 'name email role')
    .populate('organizationId', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return logs.map((log) => {
    const actorName = log.actorId?.name || log.actorId?.email || 'Admin';
    return {
      id: log._id,
      actor: actorName,
      actorRole: log.actorRole,
      action: log.action.replace(/_/g, ' '),
      targetType: log.targetType,
      targetId: log.targetId,
      orgName: log.organizationId?.name || 'Platform',
      metadata: log.metadata,
      createdAt: log.createdAt
    };
  });
};

export default {
  logActivity,
  getOrgActivityLogs,
  getGlobalActivityLogs
};
