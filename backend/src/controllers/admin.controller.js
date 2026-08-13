import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import adminService from '../services/admin.service.js';

export const getOrganizations = asyncHandler(async (req, res) => {
  const orgs = await adminService.getOrganizations();
  res.status(200).json(new ApiResponse(200, orgs, 'Organizations retrieved successfully'));
});

export const getOrganizationById = asyncHandler(async (req, res) => {
  const org = await adminService.getOrganizationById(req.params.id);
  res.status(200).json(new ApiResponse(200, org, 'Organization profile retrieved successfully'));
});

export const createOrganization = asyncHandler(async (req, res) => {
  const org = await adminService.createOrganization(req.body);
  res.status(201).json(new ApiResponse(201, org, 'Organization created successfully'));
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const org = await adminService.updateOrganization(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, org, 'Organization updated successfully'));
});

export const updateOrganizationStatus = asyncHandler(async (req, res) => {
  const org = await adminService.updateOrganizationStatus(req.params.id, req.body.status);
  res.status(200).json(new ApiResponse(200, org, 'Organization status updated'));
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  const result = await adminService.deleteOrganization(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Organization deleted successfully'));
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const result = await adminService.bulkUpdateOrganizationStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, result, 'Bulk status updated'));
});

export const bulkUpdatePlan = asyncHandler(async (req, res) => {
  const result = await adminService.bulkUpdateOrganizationPlan(req.body.ids, req.body.planId);
  res.status(200).json(new ApiResponse(200, result, 'Bulk plan updated'));
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const result = await adminService.bulkDeleteOrganizations(req.body.ids);
  res.status(200).json(new ApiResponse(200, result, 'Bulk organizations deleted'));
});

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await adminService.getPlans();
  res.status(200).json(new ApiResponse(200, plans, 'Plans retrieved successfully'));
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await adminService.createPlan(req.body);
  res.status(201).json(new ApiResponse(201, plan, 'Plan created successfully'));
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await adminService.updatePlan(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, plan, 'Plan updated successfully'));
});

export const deletePlan = asyncHandler(async (req, res) => {
  await adminService.deletePlan(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Plan deleted successfully'));
});

export const getSuperAdminAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getSuperAdminAnalytics();
  res.status(200).json(new ApiResponse(200, analytics, 'Analytics retrieved successfully'));
});

export const searchGlobal = asyncHandler(async (req, res) => {
  const results = await adminService.searchGlobal(req.query.q || '');
  res.status(200).json(new ApiResponse(200, results, 'Search results retrieved'));
});

export const getAdminAlerts = asyncHandler(async (req, res) => {
  const alerts = await adminService.getAdminAlerts();
  res.status(200).json(new ApiResponse(200, alerts, 'Alerts retrieved'));
});

export const getGlobalActivityFeed = asyncHandler(async (req, res) => {
  const activity = await adminService.getGlobalActivityFeed();
  res.status(200).json(new ApiResponse(200, activity, 'Activity feed retrieved'));
});

export default {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
  bulkUpdateStatus,
  bulkUpdatePlan,
  bulkDelete,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSuperAdminAnalytics,
  searchGlobal,
  getAdminAlerts,
  getGlobalActivityFeed
};
