import requestService from '../services/request.service.js';

export const createRequest = async (req, res, next) => {
  try {
    const request = await requestService.createRequest(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Administrative request created successfully',
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const organizationId = req.query.organizationId || req.user?.organizationId;
    const result = await requestService.getRequests(organizationId, req.query, req.user);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

export const getRequestById = async (req, res, next) => {
  try {
    const request = await requestService.getRequestById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const updateRequestStatus = async (req, res, next) => {
  try {
    const request = await requestService.updateRequestStatus(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: `Request status updated to ${request.status}`,
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const { decisionNotes } = req.body || {};
    const request = await requestService.updateRequestStatus(
      req.params.id,
      { status: 'approved', decisionNotes },
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Administrative request approved',
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { decisionNotes } = req.body || {};
    const request = await requestService.updateRequestStatus(
      req.params.id,
      { status: 'rejected', decisionNotes },
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Administrative request rejected',
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export const completeRequest = async (req, res, next) => {
  try {
    const { decisionNotes } = req.body || {};
    const request = await requestService.updateRequestStatus(
      req.params.id,
      { status: 'completed', decisionNotes },
      req.user
    );
    res.status(200).json({
      success: true,
      message: 'Administrative request marked as completed',
      data: request
    });
  } catch (err) {
    next(err);
  }
};

export default {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  approveRequest,
  rejectRequest,
  completeRequest
};
