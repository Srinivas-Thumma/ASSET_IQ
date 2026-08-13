import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import personnelService from '../services/personnel.service.js';
import Organization from '../models/Organization.js';
import ApiError from '../utils/ApiError.js';

export const getPersonnel = asyncHandler(async (req, res) => {
  const list = await personnelService.getPersonnel(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, list, 'Personnel list retrieved successfully'));
});

export const getPersonnelById = asyncHandler(async (req, res) => {
  const record = await personnelService.getPersonnelById(req.params.id, req.user.organizationId);
  res.status(200).json(new ApiResponse(200, record, 'Personnel record retrieved successfully'));
});

export const createPersonnel = asyncHandler(async (req, res) => {
  const result = await personnelService.createPersonnel(req.body, req.user);
  res.status(201).json(new ApiResponse(201, result, 'Personnel created successfully'));
});

export const updatePersonnel = asyncHandler(async (req, res) => {
  const updated = await personnelService.updatePersonnel(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, updated, 'Personnel updated successfully'));
});

export const deletePersonnel = asyncHandler(async (req, res) => {
  await personnelService.deletePersonnel(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, null, 'Personnel deleted successfully'));
});

export const getMyOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.user.organizationId);
  if (!org) throw new ApiError(404, 'Organization not found');
  res.status(200).json(new ApiResponse(200, org, 'Current organization profile'));
});

export default {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  getMyOrganization
};
