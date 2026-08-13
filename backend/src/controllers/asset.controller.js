import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import assetService from '../services/asset.service.js';
import aiService from '../services/ai.service.js';
import Employee from '../models/Employee.js';

export const createAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.createAsset(req.body, req.user);
  res.status(201).json(new ApiResponse(201, asset, 'Asset created successfully'));
});

export const getAssets = asyncHandler(async (req, res) => {
  const assets = await assetService.getAssets(req.user.organizationId, req.query);
  res.status(200).json(new ApiResponse(200, assets, 'Assets retrieved successfully'));
});

export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.user.organizationId);
  res.status(200).json(new ApiResponse(200, asset, 'Asset retrieved successfully'));
});

export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAsset(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, asset, 'Asset updated successfully'));
});

export const getAssetHistory = asyncHandler(async (req, res) => {
  const history = await assetService.getAssetHistory(req.params.id, req.user.organizationId);
  res.status(200).json(new ApiResponse(200, history, 'Asset assignment history retrieved successfully'));
});

export const getAssetQrCode = asyncHandler(async (req, res) => {
  const qr = await assetService.getAssetQrCode(req.params.id, req.user.organizationId);
  res.status(200).json(new ApiResponse(200, qr, 'Asset QR code generated successfully'));
});

export const updateAssetStatus = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAssetStatus(
    req.params.id,
    req.body.status,
    req.body.reason,
    req.user
  );
  res.status(200).json(new ApiResponse(200, asset, 'Asset status updated successfully'));
});

export const requestRetirement = asyncHandler(async (req, res) => {
  const asset = await assetService.requestRetirement(req.params.id, req.body.reason, req.user);
  res.status(200).json(new ApiResponse(200, asset, 'Asset retirement requested successfully'));
});

export const approveRetirement = asyncHandler(async (req, res) => {
  const asset = await assetService.approveRetirement(req.params.id, req.user);
  res.status(200).json(new ApiResponse(200, asset, 'Asset retirement approved successfully'));
});

export const getMyAssets = asyncHandler(async (req, res) => {
  let employeeId = req.user.employeeRef;
  if (!employeeId && req.user.email) {
    const emp = await Employee.findOne({ email: req.user.email, organizationId: req.user.organizationId });
    if (emp) employeeId = emp._id;
  }
  const assets = await assetService.getMyAssets(employeeId, req.user.organizationId);
  res.status(200).json(new ApiResponse(200, assets, 'Assigned assets retrieved successfully'));
});

export const analyzeAsset = asyncHandler(async (req, res) => {
  const result = await aiService.analyzeAssetHealth(req.params.id, req.user.organizationId, req.user);
  res.status(200).json(new ApiResponse(200, result, 'AI health diagnosis completed'));
});

export const getWarranties = asyncHandler(async (req, res) => {
  const warranties = await assetService.getWarranties(req.user.organizationId, req.query);
  res.status(200).json(new ApiResponse(200, warranties, 'Warranties retrieved successfully'));
});

export const getWarrantyStats = asyncHandler(async (req, res) => {
  const stats = await assetService.getWarrantyStats(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, stats, 'Warranty statistics retrieved successfully'));
});

export const renewWarranty = asyncHandler(async (req, res) => {
  const asset = await assetService.renewWarranty(req.params.id, req.body, req.user);
  res.status(200).json(new ApiResponse(200, asset, 'Warranty renewed successfully'));
});

export default {
  createAsset,
  getAssets,
  getAssetById,
  getAssetHistory,
  getAssetQrCode,
  updateAsset,
  updateAssetStatus,
  requestRetirement,
  approveRetirement,
  getMyAssets,
  analyzeAsset,
  getWarranties,
  getWarrantyStats,
  renewWarranty
};
