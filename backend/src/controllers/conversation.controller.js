import conversationService from '../services/conversation.service.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';

export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (err) {
    next(err);
  }
};

export const getOrCreateOrganizationConversation = async (req, res, next) => {
  try {
    if (req.user?.role === 'employee' || req.user?.role === 'asset_manager') {
      throw new ApiError(403, 'Only Org Admins and Super Admins can access organization channels');
    }

    const organizationId = req.query.organizationId || req.user?.organizationId;
    if (!organizationId) {
      throw new ApiError(400, 'Organization ID is required');
    }

    // If SuperAdmin targeting another org, verify organizationId is valid
    if (req.user.role !== 'super_admin' && String(organizationId) !== String(req.user.organizationId)) {
      throw new ApiError(403, 'Unauthorized: Cross-tenant access forbidden');
    }

    const conversation = await conversationService.getOrCreateOrganizationConversation(organizationId);
    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (err) {
    next(err);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const messages = await conversationService.getConversationMessages(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content, isInternal } = req.body || {};

    if (req.user?.role === 'employee' && isInternal) {
      throw new ApiError(403, 'Employees are not authorized to post internal staff notes');
    }

    const message = await conversationService.addMessageToConversation(
      req.params.id,
      { content, isInternal },
      req.user
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (err) {
    next(err);
  }
};

export const markConversationAsRead = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user);

    // Update unread messages for this user
    await Message.updateMany(
      {
        conversationId: conversation._id,
        organizationId: conversation.organizationId,
        'readBy.userId': { $ne: req.user._id }
      },
      {
        $push: { readBy: { userId: req.user._id, readAt: new Date() } }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getConversationById,
  getOrCreateOrganizationConversation,
  getConversationMessages,
  sendMessage,
  markConversationAsRead
};
