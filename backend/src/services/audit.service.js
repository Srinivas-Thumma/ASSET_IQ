import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({
  actorId,
  actorRole,
  action,
  targetType,
  targetId,
  metadata = {},
  organizationId
}) => {
  try {
    return await AuditLog.create({
      organizationId,
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      metadata,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('AuditLog creation warning (non-fatal):', err.message);
    return null;
  }
};

export default {
  logAudit
};
