import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import assignmentService from '../services/assignment.service.js';

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.createAssignment(req.body, req.user);
  res.status(201).json(new ApiResponse(201, assignment, 'Asset assigned successfully'));
});

export const inspectAssignment = asyncHandler(async (req, res) => {
  const result = await assignmentService.inspectAssignment(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json(new ApiResponse(200, result, 'Inspection completed successfully'));
});

export const initiateReturn = asyncHandler(async (req, res) => {
  const reason = req.body.reason || req.body.returnReason;
  const assignment = await assignmentService.initiateReturn(
    req.params.id,
    reason,
    req.user
  );
  res.status(200).json(new ApiResponse(200, assignment, 'Asset return initiated successfully'));
});

export const getInspectionQueue = asyncHandler(async (req, res) => {
  const queue = await assignmentService.getInspectionQueue(req.user.organizationId);
  res.status(200).json(new ApiResponse(200, queue, 'Inspection queue retrieved successfully'));
});

export default {
  createAssignment,
  inspectAssignment,
  initiateReturn,
  getInspectionQueue
};
