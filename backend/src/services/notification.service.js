import Asset from '../models/Asset.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../config/socket.js';

export const createNotification = async (data) => {
  try {
    const notif = await Notification.create(data);
    if (data.userId) {
      emitToUser(data.userId, 'new-notification', notif);
    }
    return notif;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

export const runWarrantyNotificationCheck = async () => {
  const now = new Date();
  const todayMs = now.getTime();

  // Find all assets with a warrantyEndDate that are not retired
  const assets = await Asset.find({
    warrantyEndDate: { $exists: true, $ne: null },
    status: { $ne: 'retired' }
  }).lean();

  let notificationsSent = 0;

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
      // Deduplication: alert tag already dispatched for this milestone
      continue;
    }

    // Find all Asset Managers and Org Admins in this organization
    const recipients = await User.find({
      organizationId: asset.organizationId,
      role: { $in: ['asset_manager', 'org_admin'] },
      isActive: true
    }).select('_id email');

    for (const user of recipients) {
      const notif = await createNotification({
        userId: user._id,
        organizationId: asset.organizationId,
        type: 'warranty_expiry',
        title,
        message,
        daysRemaining: diffDays,
        relatedId: asset._id,
        relatedType: 'asset'
      });

      notificationsSent++;
    }

    // Mark alert tag sent in asset
    await Asset.findByIdAndUpdate(asset._id, {
      $addToSet: { warrantyAlertsSent: alertTag }
    });
  }

  return { success: true, processedAssets: assets.length, notificationsSent };
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
    { new: true }
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
