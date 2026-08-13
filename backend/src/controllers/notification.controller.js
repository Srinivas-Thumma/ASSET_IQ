import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import notificationService from '../services/notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotificationsForUser(req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Notifications retrieved successfully'));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markNotificationAsRead(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, updated, 'Notification marked as read'));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsAsRead(req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

export const runWarrantyNotificationCheck = asyncHandler(async (req, res) => {
  const result = await notificationService.runWarrantyNotificationCheck();
  res.status(200).json(new ApiResponse(200, result, 'Warranty notification check completed'));
});

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
  runWarrantyNotificationCheck
};
