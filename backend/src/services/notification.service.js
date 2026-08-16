import Asset from '../models/Asset.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../config/socket.js';
import logger from '../config/logger.js';

let isCheckingWarranty = false;

export const createNotification = async (data) => {
  try {
    const notif = await Notification.create(data);
    if (data.userId) {
      emitToUser(data.userId, 'new-notification', notif);
    }
    return notif;
  } catch (err) {
    logger.error('Error creating notification:', { error: err.message });
    return null;
  }
};

/**
 * Perform high-performance, batched, bulk-inserted, and concurrency-safe warranty notification checks.
 *
 * @param {string|null} targetOrgId - Optional organization filter for tenant isolation
 */
export const runWarrantyNotificationCheck = async (targetOrgId = null) => {
  if (isCheckingWarranty) {
    logger.warn('Warranty check already in progress. Skipping concurrent run.');
    return { success: false, message: 'Warranty check already running in another process', notificationsSent: 0 };
  }

  isCheckingWarranty = true;

  try {
    const now = new Date();
    const todayMs = now.getTime();

    // Query active, non-retired assets with warranty end dates
    const assetQuery = {
      warrantyEndDate: { $exists: true, $ne: null },
      status: { $ne: 'retired' }
    };
    if (targetOrgId) {
      assetQuery.organizationId = targetOrgId;
    }

    const assets = await Asset.find(assetQuery).lean();
    if (assets.length === 0) {
      return { success: true, processedAssets: 0, notificationsSent: 0 };
    }

    // Pre-fetch all active managers/admins across the target organizations in 1 single query (Eliminates N+1)
    const orgIds = Array.from(new Set(assets.map((a) => String(a.organizationId)).filter(Boolean)));
    const recipients = await User.find({
      organizationId: { $in: orgIds },
      role: { $in: ['asset_manager', 'org_admin'] },
      status: 'active'
    })
      .select('_id email organizationId')
      .lean();

    // Build lookup map by organizationId
    const orgRecipientMap = new Map();
    recipients.forEach((u) => {
      const orgKey = String(u.organizationId);
      if (!orgRecipientMap.has(orgKey)) {
        orgRecipientMap.set(orgKey, []);
      }
      orgRecipientMap.get(orgKey).push(u);
    });

    const notificationsToInsert = [];

    for (const asset of assets) {
      const expiryMs = new Date(asset.warrantyEndDate).getTime();
      const diffDays = Math.ceil((expiryMs - todayMs) / (1000 * 60 * 60 * 24));

      let alertTag = null;
      let title = '';
      let message = '';

      if (diffDays <= 0) {
        alertTag = 'expired';
        title = 'Warranty Expired';
        message = `Warranty for ${asset.name} (${asset.assetCode}) has expired.`;
      } else if (diffDays <= 1) {
        alertTag = '1d';
        title = 'URGENT: Warranty Expiring Tomorrow';
        message = `URGENT: Warranty for ${asset.name} (${asset.assetCode}) expires tomorrow.`;
      } else if (diffDays <= 15) {
        alertTag = '15d';
        title = 'Warranty Expiring Soon';
        message = `Warranty for ${asset.name} (${asset.assetCode}) expires in ${diffDays} days — consider renewal.`;
      } else if (diffDays <= 30) {
        alertTag = '30d';
        title = 'Warranty Renewal Notice';
        message = `Warranty for ${asset.name} (${asset.assetCode}) expires in ${diffDays} days.`;
      }

      if (!alertTag) continue;

      const alreadySent = asset.warrantyAlertsSent || [];
      if (alreadySent.includes(alertTag)) {
        continue;
      }

      // Atomic conditional update to claim the alert milestone and prevent race conditions
      const updateResult = await Asset.updateOne(
        {
          _id: asset._id,
          warrantyAlertsSent: { $ne: alertTag }
        },
        {
          $addToSet: { warrantyAlertsSent: alertTag }
        }
      );

      // If another process claimed this milestone first, skip dispatching notifications
      if (updateResult.modifiedCount === 0) {
        continue;
      }

      const orgRecipients = orgRecipientMap.get(String(asset.organizationId)) || [];
      for (const user of orgRecipients) {
        notificationsToInsert.push({
          userId: user._id,
          organizationId: asset.organizationId,
          type: 'warranty_expiry',
          title,
          message,
          daysRemaining: diffDays,
          relatedId: asset._id,
          relatedType: 'asset'
        });
      }
    }

    let notificationsSent = 0;
    if (notificationsToInsert.length > 0) {
      const inserted = await Notification.insertMany(notificationsToInsert, { ordered: false });
      notificationsSent = inserted.length;

      // Broadcast live socket notifications
      for (const notif of inserted) {
        if (notif.userId) {
          emitToUser(notif.userId, 'new-notification', notif);
        }
      }
    }

    return { success: true, processedAssets: assets.length, notificationsSent };
  } finally {
    isCheckingWarranty = false;
  }
};

export const getNotificationsForUser = async (userId) => {
  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();
};

export const markNotificationAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { returnDocument: 'after' }
  );
};

export const markAllNotificationsAsRead = async (userId) => {
  return await Notification.updateMany({ userId }, { read: true });
};

export default {
  createNotification,
  runWarrantyNotificationCheck,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
