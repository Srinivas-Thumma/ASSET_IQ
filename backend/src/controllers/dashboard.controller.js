import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import dashboardService from '../services/dashboard.service.js';

export const getExceptionQueue = asyncHandler(async (req, res) => {
  const exceptions = await dashboardService.getExceptionQueue(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, exceptions, 'Exception queue retrieved successfully'));
});

export const getExceptionCounts = asyncHandler(async (req, res) => {
  const counts = await dashboardService.getExceptionCounts(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, counts, 'Exception counts retrieved successfully'));
});

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const approvals = await dashboardService.getPendingApprovals(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, approvals, 'Pending approvals retrieved successfully'));
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, stats, 'Dashboard statistics retrieved successfully'));
});

import { getOrgActivityLogs } from '../services/activityLog.service.js';

export const getActivity = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const activity = await getOrgActivityLogs(req.user.organizationId, limit);
  res.status(200).json(new ApiResponse(200, activity, 'Activity logs retrieved successfully'));
});

export default {
  getExceptionQueue,
  getExceptionCounts,
  getPendingApprovals,
  getStats,
  getActivity
};
